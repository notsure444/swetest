// convex/agentIntegration.ts
// Advanced AI Agent Component integration and orchestration utilities
import { action, query } from "./_generated/server";
import { v } from "convex/values";
import { api, components } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// AI Agent Component Integration: Create agent thread with AI capabilities
export const createAIAgentThread = action({
  args: {
    projectId: v.id("projects"),
    agentId: v.id("agents"),
    initialContext: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent || agent.projectId !== args.projectId) {
      throw new Error("Agent not found or not in project");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    try {
      // Create AI-powered thread using the AI Agent Component
      const threadId = await components.agent.lib.createThread(ctx, {
        title: `${agent.type} AI Thread`,
        metadata: {
          agentId: args.agentId,
          agentType: agent.type,
          projectId: args.projectId,
          projectNamespace: project.namespace,
        },
      });

      // Store thread reference in our schema
      await ctx.db.insert("agentThreads", {
        projectId: args.projectId,
        participantIds: [args.agentId],
        topic: `${agent.type} AI Assistant`,
        status: "active",
        createdAt: Date.now(),
        lastMessageAt: Date.now(),
      });

      // Send initial context message if provided
      if (args.initialContext) {
        await components.agent.lib.sendMessage(ctx, {
          threadId,
          message: args.initialContext,
          sender: "system",
          metadata: {
            messageType: "context",
            timestamp: Date.now(),
          },
        });
      }

      return {
        success: true,
        threadId,
        agentType: agent.type,
      };
    } catch (error) {
      throw new Error(`Failed to create AI agent thread: ${error}`);
    }
  },
});

// Agent Workflow Integration: Execute agent workflow with AI assistance
export const executeAgentWorkflow = action({
  args: {
    agentId: v.id("agents"),
    taskId: v.id("tasks"),
    workflowType: v.union(
      v.literal("architecture"),
      v.literal("planning"),
      v.literal("coding"),
      v.literal("testing"),
      v.literal("qa"),
      v.literal("deployment")
    ),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) throw new Error("Agent not found");

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    // Get agent context with RAG enhancement
    const agentContext = await ctx.runAction(api.agents.getAgentContext, {
      agentId: args.agentId,
      includeCodeContext: true,
      contextQuery: task.title,
    });

    // Create workflow prompt based on agent type and task
    const workflowPrompt = generateWorkflowPrompt(agent.type, args.workflowType, task, agentContext);

    try {
      // Use AI Agent Component to process the workflow
      const threadId = await components.agent.lib.createThread(ctx, {
        title: `${agent.type} Workflow: ${task.title}`,
        metadata: {
          agentId: args.agentId,
          taskId: args.taskId,
          workflowType: args.workflowType,
          projectId: agent.projectId,
        },
      });

      // Send workflow prompt to AI agent
      await components.agent.lib.sendMessage(ctx, {
        threadId,
        message: workflowPrompt,
        sender: agent.type,
        metadata: {
          messageType: "workflow_execution",
          taskId: args.taskId,
          workflowType: args.workflowType,
          timestamp: Date.now(),
        },
      });

      // Update task status to in progress
      await ctx.db.patch(args.taskId, {
        status: "in_progress",
        updatedAt: Date.now(),
      });

      // Update agent status
      await ctx.db.patch(args.agentId, {
        status: "working",
        currentTask: task.title,
        lastActivity: Date.now(),
      });

      // Log workflow execution
      await ctx.db.insert("systemLogs", {
        projectId: agent.projectId,
        agentId: args.agentId,
        level: "info",
        message: `Started ${args.workflowType} workflow for task: ${task.title}`,
        metadata: {
          taskId: args.taskId,
          workflowType: args.workflowType,
          threadId,
        },
        timestamp: Date.now(),
      });

      return {
        success: true,
        threadId,
        workflowType: args.workflowType,
        status: "started",
      };
    } catch (error) {
      // Update task status to failed
      await ctx.db.patch(args.taskId, {
        status: "failed",
        updatedAt: Date.now(),
      });

      throw new Error(`Workflow execution failed: ${error}`);
    }
  },
});

// Agent Coordination: Coordinate multi-agent collaboration
export const coordinateAgentCollaboration = action({
  args: {
    projectId: v.id("projects"),
    coordinatorAgentId: v.id("agents"),
    participantAgentIds: v.array(v.id("agents")),
    collaborationGoal: v.string(),
    taskIds: v.optional(v.array(v.id("tasks"))),
  },
  handler: async (ctx, args) => {
    const coordinator = await ctx.db.get(args.coordinatorAgentId);
    if (!coordinator || coordinator.projectId !== args.projectId) {
      throw new Error("Invalid coordinator agent");
    }

    // Validate all participant agents
    const participants = await Promise.all(
      args.participantAgentIds.map(id => ctx.db.get(id))
    );

    const invalidParticipant = participants.find(agent => 
      !agent || agent.projectId !== args.projectId
    );
    if (invalidParticipant === null || invalidParticipant === undefined) {
      throw new Error("Invalid participant agent");
    }

    try {
      // Create collaboration thread
      const allAgentIds = [args.coordinatorAgentId, ...args.participantAgentIds];
      const threadId = await components.agent.lib.createThread(ctx, {
        title: `Collaboration: ${args.collaborationGoal}`,
        metadata: {
          coordinatorId: args.coordinatorAgentId,
          participantIds: args.participantAgentIds,
          projectId: args.projectId,
          collaborationType: "multi_agent_coordination",
        },
      });

      // Store collaboration thread
      await ctx.db.insert("agentThreads", {
        projectId: args.projectId,
        participantIds: allAgentIds,
        topic: `Collaboration: ${args.collaborationGoal}`,
        status: "active",
        createdAt: Date.now(),
        lastMessageAt: Date.now(),
      });

      // Send coordination message
      const coordinationMessage = `
**Multi-Agent Collaboration Initiated**

**Goal:** ${args.collaborationGoal}

**Coordinator:** ${coordinator.type}
**Participants:** ${participants.filter(p => p).map(p => p!.type).join(", ")}

**Context:**
${participants.filter(p => p).map(p => `- ${p!.type}: Currently ${p!.status}${p!.currentTask ? ` (${p!.currentTask})` : ""}`).join("\n")}

**Tasks Related:** ${args.taskIds?.length || 0} tasks assigned

Please coordinate your efforts to achieve the collaboration goal. Share status updates, ask questions, and coordinate dependencies as needed.
      `;

      await components.agent.lib.sendMessage(ctx, {
        threadId,
        message: coordinationMessage,
        sender: coordinator.type,
        metadata: {
          messageType: "coordination_start",
          timestamp: Date.now(),
        },
      });

      // Log collaboration initiation
      await ctx.db.insert("systemLogs", {
        projectId: args.projectId,
        agentId: args.coordinatorAgentId,
        level: "info",
        message: `Initiated multi-agent collaboration: ${args.collaborationGoal}`,
        metadata: {
          participantCount: args.participantAgentIds.length,
          participants: participants.filter(p => p).map(p => p!.type),
          threadId,
        },
        timestamp: Date.now(),
      });

      return {
        success: true,
        threadId,
        coordinatorType: coordinator.type,
        participantCount: args.participantAgentIds.length,
        participants: participants.filter(p => p).map(p => p!.type),
      };
    } catch (error) {
      throw new Error(`Failed to coordinate collaboration: ${error}`);
    }
  },
});

// Helper function to generate workflow-specific prompts
function generateWorkflowPrompt(agentType: string, workflowType: string, task: any, context: any): string {
  const basePrompt = `
**Agent Type:** ${agentType}
**Workflow:** ${workflowType}
**Task:** ${task.title}
**Description:** ${task.description}
**Priority:** ${task.priority}

**Project Context:**
- Project: ${context.projectInfo.name}
- Status: ${context.projectInfo.status}
- Tech Stack: ${context.projectInfo.techStack.join(", ")}

**Current Context:**
${context.recentMessages.length > 0 ? `Recent Messages: ${context.recentMessages.slice(0, 3).map((m: any) => `- ${m.message}`).join("\n")}` : "No recent messages"}

**Assigned Tasks:**
${context.assignedTasks.map((t: any) => `- ${t.title} (${t.status})`).join("\n")}
  `;

  const workflowSpecificPrompts = {
    architecture: `
**Architecture Design Workflow:**
1. Analyze requirements and constraints
2. Design system architecture and components
3. Create technical specifications
4. Define interfaces and data models
5. Document architectural decisions

**Code Context:**
${context.codeContext ? `Relevant code found: ${context.codeContext.totalResults} results` : "No code context available"}
    `,
    planning: `
**Task Planning Workflow:**
1. Break down requirements into actionable tasks
2. Identify dependencies and constraints
3. Estimate effort and timeline
4. Assign priorities and milestones
5. Create detailed work plan
    `,
    coding: `
**Code Generation Workflow:**
1. Understand requirements and specifications
2. Design code structure and interfaces
3. Implement functionality with best practices
4. Write comprehensive tests
5. Document code and APIs

**Code Context:**
${context.codeContext?.formattedText || "No existing code context"}
    `,
    testing: `
**Testing Workflow:**
1. Create comprehensive test strategy
2. Implement automated tests (unit, integration, e2e)
3. Set up test environments
4. Execute tests and report results
5. Validate quality metrics
    `,
    qa: `
**Quality Assurance Workflow:**
1. Review deliverables for completeness
2. Validate against requirements
3. Perform quality audits
4. Generate quality metrics
5. Provide improvement recommendations
    `,
    deployment: `
**Deployment Workflow:**
1. Prepare deployment environment
2. Create deployment scripts and automation
3. Execute deployment with monitoring
4. Validate successful deployment
5. Set up monitoring and alerting
    `,
  };

  return basePrompt + (workflowSpecificPrompts[workflowType as keyof typeof workflowSpecificPrompts] || "");
}

// System Health: Monitor agent system health and performance
export const getAgentSystemHealth = query({
  args: {
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    let agentsQuery = ctx.db.query("agents");
    
    if (args.projectId) {
      agentsQuery = agentsQuery.withIndex("by_project", (q) => q.eq("projectId", args.projectId));
    }

    const agents = await agentsQuery.collect();
    
    // Get recent system logs
    let logsQuery = ctx.db.query("systemLogs").order("desc").take(100);
    if (args.projectId) {
      logsQuery = ctx.db
        .query("systemLogs")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .order("desc")
        .take(100);
    }
    
    const recentLogs = await logsQuery;

    // Calculate health metrics
    const healthMetrics = {
      totalAgents: agents.length,
      agentsByStatus: {
        idle: agents.filter(a => a.status === "idle").length,
        working: agents.filter(a => a.status === "working").length,
        waiting: agents.filter(a => a.status === "waiting").length,
        error: agents.filter(a => a.status === "error").length,
        completed: agents.filter(a => a.status === "completed").length,
      },
      agentsByType: agents.reduce((acc, agent) => {
        acc[agent.type] = (acc[agent.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      recentActivity: agents.filter(a => 
        Date.now() - a.lastActivity < 5 * 60 * 1000 // 5 minutes
      ).length,
      errorRate: recentLogs.filter(log => log.level === "error").length / Math.max(recentLogs.length, 1),
      systemStatus: agents.filter(a => a.status === "error").length > 0 ? "degraded" : "healthy",
    };

    return {
      ...healthMetrics,
      timestamp: Date.now(),
      projectId: args.projectId || "all",
    };
  },
});
