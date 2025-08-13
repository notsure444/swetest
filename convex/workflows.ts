// convex/workflows.ts
// Agent workflow orchestration using Workflow Component for durable multi-step processes
import { action, query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api, components } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { WorkflowManager } from "@convex-dev/workflow";

// Initialize Workflow Manager with different workpools for agent coordination
export const workflowManager = new WorkflowManager(components.workflow, {
  defaultRetryBehavior: {
    maxAttempts: 3,
    initialBackoffMs: 1000,
    base: 2,
  },
  retryActionsByDefault: true,
});

// Workflow step types for the development lifecycle
export type WorkflowStep = 
  | "architecture_design"
  | "task_creation" 
  | "work_assignment"
  | "coding"
  | "testing"
  | "qa"
  | "deployment";

// Workflow status tracking
export type WorkflowStatus = 
  | "pending"
  | "in_progress"
  | "completed"
  | "failed"
  | "paused"
  | "cancelled";

// Development Lifecycle Workflow: Complete autonomous development process
export const developmentLifecycleWorkflow = workflowManager.define({
  args: {
    projectId: v.id("projects"),
    workflowConfig: v.object({
      skipSteps: v.optional(v.array(v.string())),
      parallelExecution: v.optional(v.boolean()),
      priorityLevel: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical"))),
      resourceLimits: v.optional(v.object({
        maxConcurrentTasks: v.optional(v.number()),
        timeoutMinutes: v.optional(v.number()),
      })),
    }),
  },
  handler: async (step, { projectId, workflowConfig }): Promise<{
    success: boolean;
    completedSteps: WorkflowStep[];
    failedSteps: WorkflowStep[];
    results: Record<WorkflowStep, any>;
  }> => {
    const results: Record<string, any> = {};
    const completedSteps: WorkflowStep[] = [];
    const failedSteps: WorkflowStep[] = [];
    const skipSteps = workflowConfig.skipSteps || [];

    try {
      // Step 1: Architecture Design
      if (!skipSteps.includes("architecture_design")) {
        const architectureResult = await step.runAction(
          api.workflows.executeArchitectureDesign,
          { projectId },
          { 
            name: "Architecture Design",
            retry: { maxAttempts: 2, initialBackoffMs: 2000, base: 2 }
          }
        );
        results.architecture_design = architectureResult;
        completedSteps.push("architecture_design");
      }

      // Step 2: Task Creation (depends on architecture)
      if (!skipSteps.includes("task_creation")) {
        const taskCreationResult = await step.runAction(
          api.workflows.executeTaskCreation,
          { 
            projectId, 
            architectureResults: results.architecture_design 
          },
          { 
            name: "Task Creation",
            retry: { maxAttempts: 3, initialBackoffMs: 1000, base: 2 }
          }
        );
        results.task_creation = taskCreationResult;
        completedSteps.push("task_creation");
      }

      // Step 3: Work Assignment
      if (!skipSteps.includes("work_assignment")) {
        const workAssignmentResult = await step.runAction(
          api.workflows.executeWorkAssignment,
          { 
            projectId, 
            tasks: results.task_creation?.tasks || [] 
          },
          { 
            name: "Work Assignment",
            retry: true
          }
        );
        results.work_assignment = workAssignmentResult;
        completedSteps.push("work_assignment");
      }

      // Step 4: Parallel or Sequential Development Phase
      if (workflowConfig.parallelExecution) {
        // Execute coding, testing in parallel while respecting dependencies
        const [codingResult, initialTestingResult] = await Promise.all([
          step.runAction(
            api.workflows.executeCoding,
            { projectId, assignedTasks: results.work_assignment?.assignments || [] },
            { 
              name: "Parallel Coding",
              retry: { maxAttempts: 2, initialBackoffMs: 3000, base: 2 }
            }
          ),
          step.runAction(
            api.workflows.executeInitialTesting,
            { projectId, testStrategy: results.architecture_design?.testStrategy },
            { 
              name: "Initial Testing Setup",
              retry: true
            }
          ),
        ]);
        
        results.coding = codingResult;
        results.initial_testing = initialTestingResult;
        completedSteps.push("coding");
      } else {
        // Sequential execution for better resource management
        
        // Step 4a: Coding Phase
        if (!skipSteps.includes("coding")) {
          const codingResult = await step.runAction(
            api.workflows.executeCoding,
            { 
              projectId, 
              assignedTasks: results.work_assignment?.assignments || [] 
            },
            { 
              name: "Sequential Coding",
              retry: { maxAttempts: 2, initialBackoffMs: 3000, base: 2 }
            }
          );
          results.coding = codingResult;
          completedSteps.push("coding");
        }
      }

      // Step 5: Testing Phase (always after coding)
      if (!skipSteps.includes("testing")) {
        const testingResult = await step.runAction(
          api.workflows.executeTesting,
          { 
            projectId, 
            codeResults: results.coding,
            testEnvironmentConfig: results.initial_testing?.environment
          },
          { 
            name: "Testing Phase",
            retry: { maxAttempts: 2, initialBackoffMs: 2000, base: 2 }
          }
        );
        results.testing = testingResult;
        completedSteps.push("testing");
      }

      // Step 6: Quality Assurance
      if (!skipSteps.includes("qa")) {
        const qaResult = await step.runAction(
          api.workflows.executeQualityAssurance,
          { 
            projectId, 
            codeResults: results.coding,
            testResults: results.testing 
          },
          { 
            name: "Quality Assurance",
            retry: true
          }
        );
        results.qa = qaResult;
        completedSteps.push("qa");
      }

      // Step 7: Deployment (only if QA passes)
      if (!skipSteps.includes("deployment") && results.qa?.approved) {
        const deploymentResult = await step.runAction(
          api.workflows.executeDeployment,
          { 
            projectId, 
            deploymentConfig: results.architecture_design?.deploymentConfig,
            approvedArtifacts: results.qa?.artifacts
          },
          { 
            name: "Deployment",
            retry: { maxAttempts: 2, initialBackoffMs: 5000, base: 2 }
          }
        );
        results.deployment = deploymentResult;
        completedSteps.push("deployment");
      }

      return {
        success: true,
        completedSteps,
        failedSteps,
        results: results as Record<WorkflowStep, any>,
      };

    } catch (error) {
      // Log workflow failure
      await step.runMutation(
        api.workflows.logWorkflowEvent,
        {
          projectId,
          eventType: "workflow_failure",
          eventData: {
            error: error instanceof Error ? error.message : "Unknown error",
            completedSteps,
            failedStep: "unknown",
          },
        }
      );

      return {
        success: false,
        completedSteps,
        failedSteps: ["unknown"] as WorkflowStep[],
        results: results as Record<WorkflowStep, any>,
      };
    }
  },
});

// Architecture Design Workflow Step
export const executeArchitectureDesign = action({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const project = await ctx.db.get(projectId);
    if (!project) throw new Error("Project not found");

    // Get SystemArchitect agent
    const architect = await ctx.db
      .query("agents")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .filter((q) => q.eq(q.field("type"), "SystemArchitect"))
      .first();

    if (!architect) {
      throw new Error("SystemArchitect agent not found");
    }

    // Enqueue architecture design task to architecture workpool
    const workId = await components.architectureWorkpool.lib.enqueue(ctx, {
      functionReference: api.workflows.performArchitectureDesign,
      args: { projectId, architectId: architect._id },
      options: {
        priority: "high",
        onComplete: api.workflows.onArchitectureComplete,
        context: { projectId, step: "architecture_design" },
      },
    });

    // Create architecture task in database
    const taskId = await ctx.db.insert("tasks", {
      projectId,
      assignedAgentId: architect._id,
      title: "System Architecture Design",
      description: `Design system architecture for ${project.name}`,
      type: "architecture",
      status: "in_progress",
      priority: "high",
      dependencies: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      estimatedHours: 4,
    });

    return {
      success: true,
      workId,
      taskId,
      architectId: architect._id,
      step: "architecture_design",
    };
  },
});

// Task Creation Workflow Step
export const executeTaskCreation = action({
  args: { 
    projectId: v.id("projects"),
    architectureResults: v.optional(v.any())
  },
  handler: async (ctx, { projectId, architectureResults }) => {
    // Get TaskPlanner agent
    const taskPlanner = await ctx.db
      .query("agents")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .filter((q) => q.eq(q.field("type"), "TaskPlanner"))
      .first();

    if (!taskPlanner) {
      throw new Error("TaskPlanner agent not found");
    }

    // Enqueue task creation to task workpool
    const workId = await components.taskWorkpool.lib.enqueue(ctx, {
      functionReference: api.workflows.performTaskCreation,
      args: { projectId, taskPlannerId: taskPlanner._id, architectureResults },
      options: {
        priority: "high",
        onComplete: api.workflows.onTaskCreationComplete,
        context: { projectId, step: "task_creation" },
      },
    });

    return {
      success: true,
      workId,
      taskPlannerId: taskPlanner._id,
      step: "task_creation",
    };
  },
});

// Work Assignment Workflow Step
export const executeWorkAssignment = action({
  args: {
    projectId: v.id("projects"),
    tasks: v.array(v.any()),
  },
  handler: async (ctx, { projectId, tasks }) => {
    // Get ProjectManager agent for coordination
    const projectManager = await ctx.db
      .query("agents")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .filter((q) => q.eq(q.field("type"), "ProjectManager"))
      .first();

    if (!projectManager) {
      throw new Error("ProjectManager agent not found");
    }

    // Enqueue work assignment
    const workId = await components.taskWorkpool.lib.enqueue(ctx, {
      functionReference: api.workflows.performWorkAssignment,
      args: { projectId, projectManagerId: projectManager._id, tasks },
      options: {
        priority: "medium",
        onComplete: api.workflows.onWorkAssignmentComplete,
        context: { projectId, step: "work_assignment" },
      },
    });

    return {
      success: true,
      workId,
      projectManagerId: projectManager._id,
      step: "work_assignment",
    };
  },
});

// Coding Phase Workflow Step
export const executeCoding = action({
  args: {
    projectId: v.id("projects"),
    assignedTasks: v.array(v.any()),
  },
  handler: async (ctx, { projectId, assignedTasks }) => {
    // Get all CodeGenerator agents
    const codeGenerators = await ctx.db
      .query("agents")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .filter((q) => q.eq(q.field("type"), "CodeGenerator"))
      .collect();

    if (codeGenerators.length === 0) {
      throw new Error("No CodeGenerator agents found");
    }

    // Distribute coding tasks across available CodeGenerator agents
    const codingJobs = [];
    for (let i = 0; i < Math.min(assignedTasks.length, codeGenerators.length); i++) {
      const task = assignedTasks[i];
      const agent = codeGenerators[i % codeGenerators.length];

      const workId = await components.codingWorkpool.lib.enqueue(ctx, {
        functionReference: api.workflows.performCoding,
        args: { 
          projectId, 
          agentId: agent._id, 
          task,
          codeGeneratorIndex: i
        },
        options: {
          priority: task.priority || "medium",
          onComplete: api.workflows.onCodingComplete,
          context: { projectId, taskId: task.id, step: "coding" },
        },
      });

      codingJobs.push({
        workId,
        agentId: agent._id,
        taskId: task.id,
      });
    }

    return {
      success: true,
      codingJobs,
      step: "coding",
      totalJobs: codingJobs.length,
    };
  },
});

// Testing Phase Workflow Step
export const executeTesting = action({
  args: {
    projectId: v.id("projects"),
    codeResults: v.any(),
    testEnvironmentConfig: v.optional(v.any()),
  },
  handler: async (ctx, { projectId, codeResults, testEnvironmentConfig }) => {
    // Get TestEngineer agents
    const testEngineers = await ctx.db
      .query("agents")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .filter((q) => q.eq(q.field("type"), "TestEngineer"))
      .collect();

    if (testEngineers.length === 0) {
      throw new Error("No TestEngineer agents found");
    }

    // Enqueue testing phase
    const workId = await components.testingWorkpool.lib.enqueue(ctx, {
      functionReference: api.workflows.performTesting,
      args: { 
        projectId, 
        testEngineerId: testEngineers[0]._id, // Use first available test engineer
        codeResults,
        testEnvironmentConfig 
      },
      options: {
        priority: "high",
        onComplete: api.workflows.onTestingComplete,
        context: { projectId, step: "testing" },
      },
    });

    return {
      success: true,
      workId,
      testEngineerId: testEngineers[0]._id,
      step: "testing",
    };
  },
});

// Initial Testing Setup (for parallel execution)
export const executeInitialTesting = action({
  args: {
    projectId: v.id("projects"),
    testStrategy: v.optional(v.any()),
  },
  handler: async (ctx, { projectId, testStrategy }) => {
    // Set up test environment in parallel with coding
    const testEngineers = await ctx.db
      .query("agents")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .filter((q) => q.eq(q.field("type"), "TestEngineer"))
      .collect();

    if (testEngineers.length === 0) {
      throw new Error("No TestEngineer agents found");
    }

    const workId = await components.testingWorkpool.lib.enqueue(ctx, {
      functionReference: api.workflows.performInitialTestSetup,
      args: { projectId, testEngineerId: testEngineers[0]._id, testStrategy },
      options: {
        priority: "medium",
        context: { projectId, step: "initial_testing" },
      },
    });

    return {
      success: true,
      workId,
      testEngineerId: testEngineers[0]._id,
      environment: { setupInitiated: true, workId },
    };
  },
});

// Quality Assurance Workflow Step
export const executeQualityAssurance = action({
  args: {
    projectId: v.id("projects"),
    codeResults: v.any(),
    testResults: v.any(),
  },
  handler: async (ctx, { projectId, codeResults, testResults }) => {
    // Get QAAnalyst agents
    const qaAnalysts = await ctx.db
      .query("agents")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .filter((q) => q.eq(q.field("type"), "QAAnalyst"))
      .collect();

    if (qaAnalysts.length === 0) {
      throw new Error("No QAAnalyst agents found");
    }

    const workId = await components.testingWorkpool.lib.enqueue(ctx, {
      functionReference: api.workflows.performQualityAssurance,
      args: { 
        projectId, 
        qaAnalystId: qaAnalysts[0]._id, 
        codeResults, 
        testResults 
      },
      options: {
        priority: "high",
        onComplete: api.workflows.onQAComplete,
        context: { projectId, step: "qa" },
      },
    });

    return {
      success: true,
      workId,
      qaAnalystId: qaAnalysts[0]._id,
      step: "quality_assurance",
    };
  },
});

// Deployment Workflow Step
export const executeDeployment = action({
  args: {
    projectId: v.id("projects"),
    deploymentConfig: v.optional(v.any()),
    approvedArtifacts: v.any(),
  },
  handler: async (ctx, { projectId, deploymentConfig, approvedArtifacts }) => {
    // Get DeploymentEngineer agents
    const deploymentEngineers = await ctx.db
      .query("agents")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .filter((q) => q.eq(q.field("type"), "DeploymentEngineer"))
      .collect();

    if (deploymentEngineers.length === 0) {
      throw new Error("No DeploymentEngineer agents found");
    }

    const workId = await components.deploymentWorkpool.lib.enqueue(ctx, {
      functionReference: api.workflows.performDeployment,
      args: { 
        projectId, 
        deploymentEngineerId: deploymentEngineers[0]._id, 
        deploymentConfig, 
        approvedArtifacts 
      },
      options: {
        priority: "critical",
        onComplete: api.workflows.onDeploymentComplete,
        context: { projectId, step: "deployment" },
      },
    });

    return {
      success: true,
      workId,
      deploymentEngineerId: deploymentEngineers[0]._id,
      step: "deployment",
    };
  },
});

// Start Development Lifecycle Workflow
export const startDevelopmentWorkflow = action({
  args: {
    projectId: v.id("projects"),
    workflowConfig: v.optional(v.object({
      skipSteps: v.optional(v.array(v.string())),
      parallelExecution: v.optional(v.boolean()),
      priorityLevel: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical"))),
      resourceLimits: v.optional(v.object({
        maxConcurrentTasks: v.optional(v.number()),
        timeoutMinutes: v.optional(v.number()),
      })),
    })),
  },
  handler: async (ctx, { projectId, workflowConfig }) => {
    const project = await ctx.db.get(projectId);
    if (!project) throw new Error("Project not found");

    const config = workflowConfig || {
      parallelExecution: false,
      priorityLevel: "medium" as const,
    };

    try {
      // Start the comprehensive development lifecycle workflow
      const workflowId = await workflowManager.start(
        ctx,
        api.workflows.developmentLifecycleWorkflow,
        { projectId, workflowConfig: config },
        {
          onComplete: api.workflows.onDevelopmentWorkflowComplete,
          context: { projectId, workflowType: "development_lifecycle" },
        }
      );

      // Update project status
      await ctx.db.patch(projectId, {
        status: "development",
        updatedAt: Date.now(),
      });

      // Log workflow start
      await ctx.db.insert("systemLogs", {
        projectId,
        level: "info",
        message: "Development lifecycle workflow started",
        metadata: {
          workflowId,
          config,
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
      });

      return {
        success: true,
        workflowId,
        projectId,
        status: "workflow_started",
        config,
      };
    } catch (error) {
      // Log error
      await ctx.db.insert("systemLogs", {
        projectId,
        level: "error",
        message: `Failed to start development workflow: ${error}`,
        timestamp: Date.now(),
      });

      throw error;
    }
  },
});

// Workflow completion handlers and event logging
export const onDevelopmentWorkflowComplete = mutation({
  args: {
    workflowId: v.string(),
    result: v.any(),
    context: v.any(),
  },
  handler: async (ctx, { workflowId, result, context }) => {
    const { projectId } = context;

    if (result.kind === "success") {
      const workflowResult = result.returnValue;
      
      // Update project status based on workflow completion
      const finalStatus = workflowResult.success ? "completed" : "failed";
      await ctx.db.patch(projectId, {
        status: finalStatus,
        updatedAt: Date.now(),
      });

      // Log successful completion
      await ctx.db.insert("systemLogs", {
        projectId,
        level: "info",
        message: `Development lifecycle workflow completed successfully`,
        metadata: {
          workflowId,
          completedSteps: workflowResult.completedSteps,
          failedSteps: workflowResult.failedSteps,
        },
        timestamp: Date.now(),
      });

      // Create completion summary task
      await ctx.db.insert("tasks", {
        projectId,
        title: "Development Workflow Completed",
        description: `Workflow completed with ${workflowResult.completedSteps.length} successful steps`,
        type: "documentation",
        status: "completed",
        priority: "low",
        dependencies: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        results: {
          output: JSON.stringify(workflowResult, null, 2),
          files: [],
          notes: `Completed steps: ${workflowResult.completedSteps.join(", ")}`,
        },
      });
    } else if (result.kind === "failed") {
      // Handle workflow failure
      await ctx.db.patch(projectId, {
        status: "failed",
        updatedAt: Date.now(),
      });

      await ctx.db.insert("systemLogs", {
        projectId,
        level: "error",
        message: `Development lifecycle workflow failed: ${result.error}`,
        metadata: {
          workflowId,
          error: result.error,
        },
        timestamp: Date.now(),
      });
    } else if (result.kind === "canceled") {
      // Handle workflow cancellation
      await ctx.db.patch(projectId, {
        status: "paused",
        updatedAt: Date.now(),
      });

      await ctx.db.insert("systemLogs", {
        projectId,
        level: "warn",
        message: "Development lifecycle workflow was canceled",
        metadata: { workflowId },
        timestamp: Date.now(),
      });
    }
  },
});

// Individual step completion handlers
export const onArchitectureComplete = mutation({
  args: {
    workId: v.string(),
    result: v.any(),
    context: v.any(),
  },
  handler: async (ctx, { workId, result, context }) => {
    await logWorkflowStepCompletion(ctx, "architecture_design", workId, result, context);
  },
});

export const onTaskCreationComplete = mutation({
  args: {
    workId: v.string(),
    result: v.any(),
    context: v.any(),
  },
  handler: async (ctx, { workId, result, context }) => {
    await logWorkflowStepCompletion(ctx, "task_creation", workId, result, context);
  },
});

export const onWorkAssignmentComplete = mutation({
  args: {
    workId: v.string(),
    result: v.any(),
    context: v.any(),
  },
  handler: async (ctx, { workId, result, context }) => {
    await logWorkflowStepCompletion(ctx, "work_assignment", workId, result, context);
  },
});

export const onCodingComplete = mutation({
  args: {
    workId: v.string(),
    result: v.any(),
    context: v.any(),
  },
  handler: async (ctx, { workId, result, context }) => {
    await logWorkflowStepCompletion(ctx, "coding", workId, result, context);
  },
});

export const onTestingComplete = mutation({
  args: {
    workId: v.string(),
    result: v.any(),
    context: v.any(),
  },
  handler: async (ctx, { workId, result, context }) => {
    await logWorkflowStepCompletion(ctx, "testing", workId, result, context);
  },
});

export const onQAComplete = mutation({
  args: {
    workId: v.string(),
    result: v.any(),
    context: v.any(),
  },
  handler: async (ctx, { workId, result, context }) => {
    await logWorkflowStepCompletion(ctx, "qa", workId, result, context);
  },
});

export const onDeploymentComplete = mutation({
  args: {
    workId: v.string(),
    result: v.any(),
    context: v.any(),
  },
  handler: async (ctx, { workId, result, context }) => {
    await logWorkflowStepCompletion(ctx, "deployment", workId, result, context);
  },
});

// Helper function for logging workflow step completions
async function logWorkflowStepCompletion(
  ctx: any,
  stepName: string,
  workId: string,
  result: any,
  context: any
) {
  const { projectId } = context;
  
  const logLevel = result.kind === "success" ? "info" : "error";
  const message = result.kind === "success" 
    ? `Workflow step '${stepName}' completed successfully`
    : `Workflow step '${stepName}' failed: ${result.error}`;

  await ctx.db.insert("systemLogs", {
    projectId,
    level: logLevel,
    message,
    metadata: {
      step: stepName,
      workId,
      result: result.kind,
      ...(result.kind === "success" && result.returnValue ? { output: result.returnValue } : {}),
    },
    timestamp: Date.now(),
  });
}

// Log workflow events
export const logWorkflowEvent = mutation({
  args: {
    projectId: v.id("projects"),
    eventType: v.string(),
    eventData: v.any(),
  },
  handler: async (ctx, { projectId, eventType, eventData }) => {
    await ctx.db.insert("systemLogs", {
      projectId,
      level: eventType.includes("error") || eventType.includes("failure") ? "error" : "info",
      message: `Workflow event: ${eventType}`,
      metadata: {
        eventType,
        ...eventData,
      },
      timestamp: Date.now(),
    });
  },
});
