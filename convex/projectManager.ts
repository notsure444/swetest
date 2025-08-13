// convex/projectManager.ts
// Comprehensive project management system for autonomous AI-agent platform
import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { api, components } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { AgentManager } from "./agents";

// Enhanced project configuration interface with AI-assisted features
interface EnhancedProjectConfig {
  name: string;
  description: string;
  type: "web" | "mobile" | "fullstack";
  techStack: string[];
  requirements: string;
  deliverables: DeliverableSpec[];
  evaluations: EvaluationSpec[];
  priority: "low" | "medium" | "high" | "urgent";
  estimatedDuration?: string;
  complexity: "simple" | "moderate" | "complex" | "enterprise";
  targetAudience?: string;
  businessGoals?: string[];
  technicalConstraints?: string[];
}

// Deliverable specification with evaluation criteria
interface DeliverableSpec {
  id: string;
  name: string;
  description: string;
  type: "feature" | "component" | "documentation" | "test" | "deployment";
  acceptanceCriteria: string[];
  dependencies: string[];
  estimatedEffort: number; // story points or hours
  assignedAgentType?: string;
  dueDate?: number;
  status: "not_started" | "in_progress" | "review" | "completed" | "blocked";
}

// Evaluation specification for project assessment
interface EvaluationSpec {
  id: string;
  name: string;
  description: string;
  type: "functionality" | "performance" | "security" | "usability" | "maintainability";
  criteria: EvaluationCriterion[];
  weight: number; // Relative importance (1-10)
  automatedCheck: boolean;
  testScript?: string;
}

interface EvaluationCriterion {
  name: string;
  description: string;
  metric: string;
  threshold: string | number;
  critical: boolean;
}

// Agent task assignment with coordination
interface AgentTaskAssignment {
  agentType: string;
  agentId?: Id<"agents">;
  deliverableIds: string[];
  priority: "low" | "medium" | "high" | "urgent";
  estimatedDuration: number;
  dependencies: string[];
  status: "pending" | "assigned" | "in_progress" | "completed" | "failed";
  assignedAt?: number;
  startedAt?: number;
  completedAt?: number;
}

// AI-assisted project suggestions
interface ProjectSuggestion {
  category: "tech_stack" | "architecture" | "features" | "timeline" | "resources";
  suggestion: string;
  reasoning: string;
  confidence: number; // 0-1
  impact: "low" | "medium" | "high";
  effort: "low" | "medium" | "high";
}

// Project lifecycle states with comprehensive tracking
type ProjectLifecycleState = 
  | "planning"           // Initial project setup and requirements gathering
  | "architecture"       // System design and architecture planning  
  | "task_breakdown"     // Detailed task planning and decomposition
  | "development"        // Active development phase
  | "testing"           // Testing and QA phase
  | "integration"       // Integration testing and system assembly
  | "deployment_prep"   // Deployment preparation and staging
  | "deployment"        // Production deployment
  | "validation"        // Post-deployment validation and monitoring
  | "maintenance"       // Ongoing maintenance and updates
  | "completed"         // Project fully completed
  | "paused"           // Temporarily paused
  | "cancelled"        // Project cancelled
  | "failed";          // Project failed

// Create enhanced project with AI assistance
export const createEnhancedProject = mutation({
  args: {
    config: v.object({
      name: v.string(),
      description: v.string(),
      type: v.union(v.literal("web"), v.literal("mobile"), v.literal("fullstack")),
      techStack: v.array(v.string()),
      requirements: v.string(),
      priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
      complexity: v.union(v.literal("simple"), v.literal("moderate"), v.literal("complex"), v.literal("enterprise")),
      estimatedDuration: v.optional(v.string()),
      targetAudience: v.optional(v.string()),
      businessGoals: v.optional(v.array(v.string())),
      technicalConstraints: v.optional(v.array(v.string())),
      deliverables: v.array(v.object({
        id: v.string(),
        name: v.string(),
        description: v.string(),
        type: v.union(v.literal("feature"), v.literal("component"), v.literal("documentation"), v.literal("test"), v.literal("deployment")),
        acceptanceCriteria: v.array(v.string()),
        dependencies: v.array(v.string()),
        estimatedEffort: v.number(),
        assignedAgentType: v.optional(v.string()),
        dueDate: v.optional(v.number()),
      })),
      evaluations: v.array(v.object({
        id: v.string(),
        name: v.string(),
        description: v.string(),
        type: v.union(v.literal("functionality"), v.literal("performance"), v.literal("security"), v.literal("usability"), v.literal("maintainability")),
        weight: v.number(),
        automatedCheck: v.boolean(),
        testScript: v.optional(v.string()),
        criteria: v.array(v.object({
          name: v.string(),
          description: v.string(),
          metric: v.string(),
          threshold: v.union(v.string(), v.number()),
          critical: v.boolean(),
        })),
      })),
    }),
  },
  handler: async (ctx, args) => {
    // Generate unique namespace for complete project isolation
    const namespace = `project_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    
    // Create enhanced project with comprehensive configuration
    const projectId = await ctx.db.insert("projects", {
      name: args.config.name,
      description: args.config.description,
      type: args.config.type,
      status: "planning",
      priority: args.config.priority,
      complexity: args.config.complexity,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      configuration: {
        techStack: args.config.techStack,
        requirements: args.config.requirements,
        deliverables: args.config.deliverables,
        evaluationCriteria: args.config.evaluations,
        estimatedDuration: args.config.estimatedDuration,
        targetAudience: args.config.targetAudience,
        businessGoals: args.config.businessGoals || [],
        technicalConstraints: args.config.technicalConstraints || [],
      },
      namespace,
      lifecycle: {
        currentState: "planning" as ProjectLifecycleState,
        stateHistory: [{
          state: "planning" as ProjectLifecycleState,
          enteredAt: Date.now(),
          triggeredBy: "system",
          reason: "Project creation"
        }],
        estimatedCompletion: args.config.estimatedDuration ? 
          Date.now() + parseDurationToMs(args.config.estimatedDuration) : undefined,
      },
      metrics: {
        totalDeliverables: args.config.deliverables.length,
        completedDeliverables: 0,
        totalEvaluations: args.config.evaluations.length,
        passedEvaluations: 0,
        progressPercentage: 0,
        qualityScore: 0,
      }
    });

    // Initialize project isolation and container infrastructure
    await initializeProjectInfrastructure(ctx, projectId, namespace, args.config);

    // Create deliverables tracking records
    for (const deliverable of args.config.deliverables) {
      await ctx.db.insert("deliverables", {
        projectId,
        deliverableId: deliverable.id,
        name: deliverable.name,
        description: deliverable.description,
        type: deliverable.type,
        status: "not_started",
        acceptanceCriteria: deliverable.acceptanceCriteria,
        dependencies: deliverable.dependencies,
        estimatedEffort: deliverable.estimatedEffort,
        assignedAgentType: deliverable.assignedAgentType,
        dueDate: deliverable.dueDate,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Create evaluation tracking records
    for (const evaluation of args.config.evaluations) {
      await ctx.db.insert("evaluations", {
        projectId,
        evaluationId: evaluation.id,
        name: evaluation.name,
        description: evaluation.description,
        type: evaluation.type,
        status: "pending",
        weight: evaluation.weight,
        automatedCheck: evaluation.automatedCheck,
        testScript: evaluation.testScript,
        criteria: evaluation.criteria,
        results: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Initialize agent coordination and task assignment
    await initializeAgentCoordination(ctx, projectId, args.config);

    // Create comprehensive project log
    await ctx.db.insert("systemLogs", {
      projectId,
      level: "info",
      category: "project_management",
      message: `Enhanced project created: ${args.config.name}`,
      metadata: {
        namespace,
        type: args.config.type,
        priority: args.config.priority,
        complexity: args.config.complexity,
        techStack: args.config.techStack,
        deliverableCount: args.config.deliverables.length,
        evaluationCount: args.config.evaluations.length,
      },
      timestamp: Date.now(),
    });

    return {
      projectId,
      namespace,
      status: "planning" as ProjectLifecycleState,
      message: "Enhanced project created successfully with comprehensive management system"
    };
  },
});

// Get AI-assisted project suggestions based on configuration
export const getProjectSuggestions = action({
  args: {
    projectType: v.union(v.literal("web"), v.literal("mobile"), v.literal("fullstack")),
    techStack: v.array(v.string()),
    requirements: v.string(),
    complexity: v.union(v.literal("simple"), v.literal("moderate"), v.literal("complex"), v.literal("enterprise")),
    targetAudience: v.optional(v.string()),
    businessGoals: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args): Promise<ProjectSuggestion[]> => {
    // Use rate limiter for AI API calls
    const rateLimiter = components.rateLimiter;
    
    // Check rate limit for AI suggestions
    const { ok } = await rateLimiter.checkRateLimit(ctx, {
      name: "project_suggestions",
      key: `suggestions_${Date.now()}`,
      count: 1,
    });

    if (!ok) {
      throw new Error("Rate limit exceeded for project suggestions. Please try again later.");
    }

    // Generate AI-powered suggestions based on project parameters
    const suggestions: ProjectSuggestion[] = [];

    // Tech stack suggestions based on project type
    if (args.projectType === "web") {
      suggestions.push({
        category: "tech_stack",
        suggestion: "Consider using React.js with TypeScript for better type safety and developer experience",
        reasoning: "React with TypeScript provides excellent tooling, strong typing, and a large ecosystem",
        confidence: 0.85,
        impact: "high",
        effort: "medium"
      });

      suggestions.push({
        category: "architecture",
        suggestion: "Implement a component-based architecture with state management (Redux/Zustand)",
        reasoning: "Component-based architecture promotes reusability and maintainability",
        confidence: 0.9,
        impact: "high",
        effort: "medium"
      });
    }

    if (args.projectType === "mobile") {
      suggestions.push({
        category: "tech_stack",
        suggestion: "Use React Native or Flutter for cross-platform development",
        reasoning: "Cross-platform frameworks reduce development time and maintenance overhead",
        confidence: 0.8,
        impact: "high",
        effort: "low"
      });
    }

    // Complexity-based suggestions
    if (args.complexity === "enterprise") {
      suggestions.push({
        category: "architecture",
        suggestion: "Implement microservices architecture with proper API gateway and service discovery",
        reasoning: "Enterprise applications benefit from distributed architecture for scalability",
        confidence: 0.85,
        impact: "high",
        effort: "high"
      });

      suggestions.push({
        category: "features",
        suggestion: "Include comprehensive monitoring, logging, and alerting systems",
        reasoning: "Enterprise applications require robust observability for production operations",
        confidence: 0.95,
        impact: "high",
        effort: "medium"
      });
    }

    // Timeline suggestions based on complexity
    const timelineMultiplier = {
      simple: 1,
      moderate: 1.5,
      complex: 2.5,
      enterprise: 4
    };

    suggestions.push({
      category: "timeline",
      suggestion: `Estimated development time: ${2 * timelineMultiplier[args.complexity]}-${4 * timelineMultiplier[args.complexity]} weeks`,
      reasoning: `Based on ${args.complexity} complexity level and typical development patterns`,
      confidence: 0.7,
      impact: "medium",
      effort: "low"
    });

    // Resource suggestions
    const agentCount = args.complexity === "enterprise" ? 7 : args.complexity === "complex" ? 5 : 3;
    suggestions.push({
      category: "resources",
      suggestion: `Recommend deploying ${agentCount} specialized agents for parallel development`,
      reasoning: "Multiple agents can work on different aspects simultaneously to reduce overall timeline",
      confidence: 0.8,
      impact: "medium",
      effort: "low"
    });

    return suggestions;
  },
});

// Manage project lifecycle state transitions
export const transitionProjectState = mutation({
  args: {
    projectId: v.id("projects"),
    newState: v.union(
      v.literal("planning"),
      v.literal("architecture"),
      v.literal("task_breakdown"),
      v.literal("development"),
      v.literal("testing"),
      v.literal("integration"),
      v.literal("deployment_prep"),
      v.literal("deployment"),
      v.literal("validation"),
      v.literal("maintenance"),
      v.literal("completed"),
      v.literal("paused"),
      v.literal("cancelled"),
      v.literal("failed")
    ),
    reason: v.string(),
    triggeredBy: v.string(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const currentState = project.lifecycle?.currentState || "planning";
    
    // Validate state transition
    if (!isValidStateTransition(currentState as ProjectLifecycleState, args.newState as ProjectLifecycleState)) {
      throw new Error(`Invalid state transition from ${currentState} to ${args.newState}`);
    }

    // Update project lifecycle
    const updatedLifecycle = {
      ...project.lifecycle,
      currentState: args.newState as ProjectLifecycleState,
      stateHistory: [
        ...(project.lifecycle?.stateHistory || []),
        {
          state: args.newState as ProjectLifecycleState,
          enteredAt: Date.now(),
          triggeredBy: args.triggeredBy,
          reason: args.reason,
          previousState: currentState as ProjectLifecycleState,
        }
      ],
    };

    await ctx.db.patch(args.projectId, {
      status: args.newState,
      lifecycle: updatedLifecycle,
      updatedAt: Date.now(),
    });

    // Trigger appropriate agent coordination for new state
    await coordinateAgentsForState(ctx, args.projectId, args.newState as ProjectLifecycleState);

    // Log state transition
    await ctx.db.insert("systemLogs", {
      projectId: args.projectId,
      level: "info",
      category: "lifecycle_management",
      message: `Project transitioned from ${currentState} to ${args.newState}`,
      metadata: {
        previousState: currentState,
        newState: args.newState,
        triggeredBy: args.triggeredBy,
        reason: args.reason,
      },
      timestamp: Date.now(),
    });

    return {
      success: true,
      previousState: currentState,
      newState: args.newState,
      message: `Project successfully transitioned to ${args.newState}`,
    };
  },
});

// Coordinate agent task assignments
export const assignAgentTasks = mutation({
  args: {
    projectId: v.id("projects"),
    assignments: v.array(v.object({
      agentType: v.string(),
      deliverableIds: v.array(v.string()),
      priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
      estimatedDuration: v.number(),
      dependencies: v.array(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const taskAssignments: AgentTaskAssignment[] = [];

    for (const assignment of args.assignments) {
      // Find appropriate agent of the specified type
      const availableAgent = await ctx.db
        .query("agents")
        .filter((q) => q.eq(q.field("type"), assignment.agentType))
        .filter((q) => q.eq(q.field("status"), "available"))
        .first();

      // Create task assignment record
      const taskAssignment: AgentTaskAssignment = {
        agentType: assignment.agentType,
        agentId: availableAgent?._id,
        deliverableIds: assignment.deliverableIds,
        priority: assignment.priority,
        estimatedDuration: assignment.estimatedDuration,
        dependencies: assignment.dependencies,
        status: availableAgent ? "assigned" : "pending",
        assignedAt: availableAgent ? Date.now() : undefined,
      };

      taskAssignments.push(taskAssignment);

      // Update deliverables with agent assignment
      for (const deliverableId of assignment.deliverableIds) {
        const deliverable = await ctx.db
          .query("deliverables")
          .filter((q) => q.eq(q.field("projectId"), args.projectId))
          .filter((q) => q.eq(q.field("deliverableId"), deliverableId))
          .first();

        if (deliverable) {
          await ctx.db.patch(deliverable._id, {
            assignedAgentType: assignment.agentType,
            assignedAgentId: availableAgent?._id,
            status: availableAgent ? "assigned" : "pending",
            updatedAt: Date.now(),
          });
        }
      }

      // If agent is available, update agent status and create task
      if (availableAgent) {
        await ctx.db.patch(availableAgent._id, {
          status: "busy",
          currentProjectId: args.projectId,
          assignedTasks: assignment.deliverableIds,
          updatedAt: Date.now(),
        });

        // Create task record for tracking
        await ctx.db.insert("tasks", {
          projectId: args.projectId,
          agentId: availableAgent._id,
          agentType: assignment.agentType,
          deliverableIds: assignment.deliverableIds,
          title: `Work on ${assignment.deliverableIds.length} deliverable(s)`,
          description: `Agent ${assignment.agentType} assigned to work on deliverables: ${assignment.deliverableIds.join(", ")}`,
          priority: assignment.priority,
          status: "assigned",
          estimatedDuration: assignment.estimatedDuration,
          dependencies: assignment.dependencies,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }

    // Store task assignments in project metadata
    await ctx.db.patch(args.projectId, {
      agentAssignments: taskAssignments,
      updatedAt: Date.now(),
    });

    // Log task assignments
    await ctx.db.insert("systemLogs", {
      projectId: args.projectId,
      level: "info",
      category: "agent_coordination",
      message: `Assigned tasks to ${args.assignments.length} agent(s)`,
      metadata: {
        assignments: args.assignments,
        assignedAgents: taskAssignments.filter(ta => ta.agentId).length,
        pendingAssignments: taskAssignments.filter(ta => !ta.agentId).length,
      },
      timestamp: Date.now(),
    });

    return {
      success: true,
      totalAssignments: args.assignments.length,
      assignedAgents: taskAssignments.filter(ta => ta.agentId).length,
      pendingAssignments: taskAssignments.filter(ta => !ta.agentId).length,
      assignments: taskAssignments,
    };
  },
});

// Track project progress and update metrics
export const updateProjectProgress = mutation({
  args: {
    projectId: v.id("projects"),
    deliverableId: v.string(),
    newStatus: v.union(
      v.literal("not_started"),
      v.literal("in_progress"),
      v.literal("review"),
      v.literal("completed"),
      v.literal("blocked")
    ),
    completionPercentage: v.optional(v.number()),
    qualityScore: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Update deliverable status
    const deliverable = await ctx.db
      .query("deliverables")
      .filter((q) => q.eq(q.field("projectId"), args.projectId))
      .filter((q) => q.eq(q.field("deliverableId"), args.deliverableId))
      .first();

    if (!deliverable) {
      throw new Error("Deliverable not found");
    }

    const previousStatus = deliverable.status;
    await ctx.db.patch(deliverable._id, {
      status: args.newStatus,
      completionPercentage: args.completionPercentage,
      qualityScore: args.qualityScore,
      notes: args.notes,
      updatedAt: Date.now(),
    });

    // Recalculate project metrics
    const allDeliverables = await ctx.db
      .query("deliverables")
      .filter((q) => q.eq(q.field("projectId"), args.projectId))
      .collect();

    const completedDeliverables = allDeliverables.filter(d => d.status === "completed").length;
    const totalDeliverables = allDeliverables.length;
    const progressPercentage = Math.round((completedDeliverables / totalDeliverables) * 100);

    // Calculate average quality score
    const qualityScores = allDeliverables
      .filter(d => d.qualityScore !== undefined)
      .map(d => d.qualityScore || 0);
    const averageQuality = qualityScores.length > 0 
      ? Math.round(qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length)
      : 0;

    // Update project metrics
    await ctx.db.patch(args.projectId, {
      metrics: {
        totalDeliverables,
        completedDeliverables,
        progressPercentage,
        qualityScore: averageQuality,
        ...project.metrics,
      },
      updatedAt: Date.now(),
    });

    // Check if project should advance to next state
    if (progressPercentage === 100 && project.lifecycle?.currentState === "development") {
      await transitionProjectState(ctx, {
        projectId: args.projectId,
        newState: "testing",
        reason: "All deliverables completed",
        triggeredBy: "system",
      });
    }

    // Log progress update
    await ctx.db.insert("systemLogs", {
      projectId: args.projectId,
      level: "info",
      category: "progress_tracking",
      message: `Deliverable ${args.deliverableId} status changed from ${previousStatus} to ${args.newStatus}`,
      metadata: {
        deliverableId: args.deliverableId,
        previousStatus,
        newStatus: args.newStatus,
        completionPercentage: args.completionPercentage,
        qualityScore: args.qualityScore,
        projectProgress: progressPercentage,
      },
      timestamp: Date.now(),
    });

    return {
      success: true,
      deliverableId: args.deliverableId,
      previousStatus,
      newStatus: args.newStatus,
      projectProgress: progressPercentage,
      message: `Progress updated successfully. Project is ${progressPercentage}% complete.`,
    };
  },
});

// Get comprehensive project dashboard data
export const getProjectDashboard = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Get all deliverables
    const deliverables = await ctx.db
      .query("deliverables")
      .filter((q) => q.eq(q.field("projectId"), args.projectId))
      .collect();

    // Get all evaluations
    const evaluations = await ctx.db
      .query("evaluations")
      .filter((q) => q.eq(q.field("projectId"), args.projectId))
      .collect();

    // Get assigned agents and their current tasks
    const assignedAgents = await ctx.db
      .query("agents")
      .filter((q) => q.eq(q.field("currentProjectId"), args.projectId))
      .collect();

    // Get recent project logs
    const recentLogs = await ctx.db
      .query("systemLogs")
      .filter((q) => q.eq(q.field("projectId"), args.projectId))
      .order("desc")
      .take(50);

    // Get active tasks
    const activeTasks = await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("projectId"), args.projectId))
      .filter((q) => q.neq(q.field("status"), "completed"))
      .collect();

    // Calculate detailed metrics
    const deliverablesByStatus = deliverables.reduce((acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const agentUtilization = assignedAgents.map(agent => ({
      type: agent.type,
      status: agent.status,
      tasksCount: activeTasks.filter(t => t.agentId === agent._id).length,
      efficiency: calculateAgentEfficiency(agent, activeTasks.filter(t => t.agentId === agent._id)),
    }));

    return {
      project: {
        ...project,
        metrics: {
          ...project.metrics,
          deliverablesByStatus,
          activeAgents: assignedAgents.length,
          activeTasks: activeTasks.length,
          agentUtilization,
        },
      },
      deliverables,
      evaluations,
      assignedAgents,
      activeTasks,
      recentActivity: recentLogs,
      insights: generateProjectInsights(project, deliverables, assignedAgents, activeTasks),
    };
  },
});

// Helper function to validate state transitions
function isValidStateTransition(from: ProjectLifecycleState, to: ProjectLifecycleState): boolean {
  const validTransitions: Record<ProjectLifecycleState, ProjectLifecycleState[]> = {
    planning: ["architecture", "paused", "cancelled"],
    architecture: ["task_breakdown", "planning", "paused", "cancelled"],
    task_breakdown: ["development", "architecture", "paused", "cancelled"],
    development: ["testing", "task_breakdown", "paused", "cancelled"],
    testing: ["integration", "development", "paused", "cancelled", "failed"],
    integration: ["deployment_prep", "testing", "paused", "cancelled", "failed"],
    deployment_prep: ["deployment", "integration", "paused", "cancelled"],
    deployment: ["validation", "deployment_prep", "failed", "cancelled"],
    validation: ["maintenance", "completed", "failed", "deployment"],
    maintenance: ["completed", "development", "paused"],
    completed: ["maintenance"],
    paused: ["planning", "architecture", "task_breakdown", "development", "testing", "integration", "deployment_prep", "cancelled"],
    cancelled: [],
    failed: ["planning", "cancelled"],
  };

  return validTransitions[from].includes(to);
}

// Helper function to initialize project infrastructure
async function initializeProjectInfrastructure(ctx: any, projectId: Id<"projects">, namespace: string, config: any) {
  // This would integrate with the existing docker container management
  // and project isolation infrastructure from convex/projects.ts
  
  // Create isolated container environment
  // Set up project-specific networking
  // Initialize project workspace
  // Configure monitoring and logging
  
  // For now, we'll create the necessary database records
  await ctx.db.insert("projectInfrastructure", {
    projectId,
    namespace,
    containerConfigs: [],
    networkConfigs: [],
    volumeMounts: [],
    status: "initializing",
    createdAt: Date.now(),
  });
}

// Helper function to initialize agent coordination
async function initializeAgentCoordination(ctx: any, projectId: Id<"projects">, config: any) {
  // Create initial agent pool assignment based on project type and complexity
  const requiredAgentTypes = determineRequiredAgents(config.type, config.complexity);
  
  for (const agentType of requiredAgentTypes) {
    // Try to assign an available agent
    const availableAgent = await ctx.db
      .query("agents")
      .filter((q) => q.eq(q.field("type"), agentType))
      .filter((q) => q.eq(q.field("status"), "available"))
      .first();

    if (availableAgent) {
      await ctx.db.patch(availableAgent._id, {
        status: "reserved",
        currentProjectId: projectId,
        updatedAt: Date.now(),
      });
    }
  }
}

// Helper function to determine required agents
function determineRequiredAgents(projectType: string, complexity: string): string[] {
  const baseAgents = ["ProjectManager", "SystemArchitect"];
  
  if (complexity === "simple") {
    return [...baseAgents, "CodeGenerator", "TestEngineer"];
  } else if (complexity === "moderate") {
    return [...baseAgents, "TaskPlanner", "CodeGenerator", "TestEngineer", "QAAnalyst"];
  } else {
    return ["ProjectManager", "SystemArchitect", "TaskPlanner", "CodeGenerator", "TestEngineer", "QAAnalyst", "DeploymentEngineer"];
  }
}

// Helper function to coordinate agents for specific states
async function coordinateAgentsForState(ctx: any, projectId: Id<"projects">, state: ProjectLifecycleState) {
  // Coordinate appropriate agents based on lifecycle state
  const stateAgentMap: Record<ProjectLifecycleState, string[]> = {
    planning: ["ProjectManager"],
    architecture: ["SystemArchitect", "ProjectManager"],
    task_breakdown: ["TaskPlanner", "ProjectManager"],
    development: ["CodeGenerator", "SystemArchitect"],
    testing: ["TestEngineer", "QAAnalyst"],
    integration: ["TestEngineer", "QAAnalyst", "SystemArchitect"],
    deployment_prep: ["DeploymentEngineer", "QAAnalyst"],
    deployment: ["DeploymentEngineer"],
    validation: ["QAAnalyst", "TestEngineer"],
    maintenance: ["ProjectManager", "DeploymentEngineer"],
    completed: [],
    paused: [],
    cancelled: [],
    failed: ["ProjectManager"],
  };

  const relevantAgentTypes = stateAgentMap[state] || [];
  
  // Notify relevant agents about state change
  for (const agentType of relevantAgentTypes) {
    // Create notification or task for agent
    await ctx.db.insert("agentNotifications", {
      projectId,
      agentType,
      type: "state_change",
      message: `Project transitioned to ${state}`,
      priority: "medium",
      createdAt: Date.now(),
    });
  }
}

// Helper function to parse duration string to milliseconds
function parseDurationToMs(duration: string): number {
  const units: Record<string, number> = {
    'min': 60 * 1000,
    'hour': 60 * 60 * 1000,
    'day': 24 * 60 * 60 * 1000,
    'week': 7 * 24 * 60 * 60 * 1000,
    'month': 30 * 24 * 60 * 60 * 1000,
  };

  const match = duration.match(/(\d+)\s*(\w+)/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // Default 1 week

  const [, amount, unit] = match;
  const unitKey = Object.keys(units).find(key => unit.toLowerCase().startsWith(key));
  
  return unitKey ? parseInt(amount) * units[unitKey] : 7 * 24 * 60 * 60 * 1000;
}

// Helper function to calculate agent efficiency
function calculateAgentEfficiency(agent: any, tasks: any[]): number {
  // Basic efficiency calculation based on task completion rate
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const totalTasks = tasks.length;
  
  return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
}

// Helper function to generate project insights
function generateProjectInsights(project: any, deliverables: any[], agents: any[], tasks: any[]) {
  const insights = [];

  // Progress insights
  const progress = project.metrics?.progressPercentage || 0;
  if (progress < 30) {
    insights.push({
      type: "progress",
      level: "info",
      message: "Project is in early stages. Focus on clear requirement definition.",
    });
  } else if (progress < 70) {
    insights.push({
      type: "progress",
      level: "info",
      message: "Project is making good progress. Monitor task dependencies closely.",
    });
  } else if (progress < 90) {
    insights.push({
      type: "progress",
      level: "warning",
      message: "Project is nearing completion. Prepare for final testing and deployment.",
    });
  }

  // Agent utilization insights
  const busyAgents = agents.filter(a => a.status === "busy").length;
  const totalAgents = agents.length;
  if (totalAgents > 0 && (busyAgents / totalAgents) < 0.5) {
    insights.push({
      type: "resources",
      level: "warning",
      message: `Only ${busyAgents}/${totalAgents} agents are actively working. Consider task redistribution.`,
    });
  }

  // Timeline insights
  const overdueTasks = tasks.filter(t => t.dueDate && t.dueDate < Date.now() && t.status !== "completed").length;
  if (overdueTasks > 0) {
    insights.push({
      type: "timeline",
      level: "error",
      message: `${overdueTasks} task(s) are overdue. Immediate attention required.`,
    });
  }

  return insights;
}
