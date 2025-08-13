// convex/agents.ts
// Core agent orchestration system using AI Agent Component
import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { api, components } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { RAG } from "@convex-dev/rag";
import { openai } from "@ai-sdk/openai";

// Initialize RAG component for semantic code search
const rag = new RAG(components.rag, {
  textEmbeddingModel: openai.embedding("text-embedding-3-small"),
  embeddingDimension: 1536,
});

// Agent types as defined in our schema
export type AgentType = 
  | "ProjectManager"
  | "SystemArchitect" 
  | "TaskPlanner"
  | "CodeGenerator"
  | "TestEngineer"
  | "QAAnalyst"
  | "DeploymentEngineer";

// Agent configuration interface
interface AgentConfig {
  type: AgentType;
  model: string;
  systemPrompt: string;
  tools: string[];
  workpoolName: string;
  maxConcurrentTasks: number;
  contextNamespace?: string;
}

// Agent Manager class for orchestrating different agent types
export class AgentManager {
  // Agent configurations for each type
  private static agentConfigs: Record<AgentType, AgentConfig> = {
    ProjectManager: {
      type: "ProjectManager",
      model: "gpt-4o",
      systemPrompt: `You are a Project Manager AI agent responsible for:
- Creating and managing software development projects
- Coordinating between different agents and teams
- Tracking project progress and deliverables
- Making high-level decisions about project direction
- Communicating with stakeholders and providing status updates
- Ensuring projects meet requirements and deadlines
- Managing project resources and priorities

You have access to project management tools, communication channels, and can coordinate with other specialized agents to achieve project goals.`,
      tools: ["projectManagement", "communication", "statusTracking", "resourceAllocation"],
      workpoolName: "taskWorkpool",
      maxConcurrentTasks: 3,
    },

    SystemArchitect: {
      type: "SystemArchitect",
      model: "gpt-4o",
      systemPrompt: `You are a System Architect AI agent responsible for:
- Designing software architecture and system structures
- Making technical decisions about frameworks, patterns, and technologies
- Creating architectural diagrams and documentation
- Ensuring system scalability, security, and maintainability
- Reviewing and approving major technical changes
- Defining coding standards and best practices
- Analyzing system requirements and constraints

You have access to architectural tools, design patterns knowledge, and can collaborate with other agents to implement your designs.`,
      tools: ["architecturalDesign", "technicalAnalysis", "codebaseSearch", "documentationGeneration"],
      workpoolName: "architectureWorkpool",
      maxConcurrentTasks: 2,
    },

    TaskPlanner: {
      type: "TaskPlanner",
      model: "gpt-4o",
      systemPrompt: `You are a Task Planner AI agent responsible for:
- Breaking down projects into actionable tasks
- Creating task dependencies and scheduling
- Assigning tasks to appropriate agents
- Monitoring task progress and identifying blockages  
- Optimizing workflow efficiency and resource utilization
- Managing task priorities and deadlines
- Coordinating parallel work streams

You have access to task management tools, resource planning, and can analyze project requirements to create detailed work plans.`,
      tools: ["taskBreakdown", "scheduling", "resourcePlanning", "dependencyAnalysis"],
      workpoolName: "taskWorkpool",
      maxConcurrentTasks: 4,
    },

    CodeGenerator: {
      type: "CodeGenerator",
      model: "claude-3-5-sonnet-20241022",
      systemPrompt: `You are a Code Generator AI agent responsible for:
- Writing high-quality, maintainable code
- Implementing features according to specifications
- Following coding standards and best practices
- Performing code reviews and refactoring
- Creating unit tests for implemented code
- Documenting code and APIs
- Integrating with existing codebases

You have access to code generation tools, semantic code search, testing frameworks, and can collaborate with other agents to ensure code quality.`,
      tools: ["codeGeneration", "codeReview", "testing", "codebaseSearch", "documentation"],
      workpoolName: "codingWorkpool",
      maxConcurrentTasks: 5,
    },

    TestEngineer: {
      type: "TestEngineer", 
      model: "gpt-4o",
      systemPrompt: `You are a Test Engineer AI agent responsible for:
- Creating comprehensive test strategies and plans
- Writing automated tests (unit, integration, e2e)
- Setting up testing environments and CI/CD pipelines
- Performing manual testing when needed
- Identifying and reporting bugs and issues
- Ensuring test coverage and quality metrics
- Validating system performance and reliability

You have access to testing tools, isolated test environments, and can coordinate with development agents to ensure software quality.`,
      tools: ["testCreation", "testExecution", "bugReporting", "testEnvironment", "performanceTesting"],
      workpoolName: "testingWorkpool",
      maxConcurrentTasks: 3,
    },

    QAAnalyst: {
      type: "QAAnalyst",
      model: "gpt-4o",
      systemPrompt: `You are a Quality Assurance Analyst AI agent responsible for:
- Reviewing deliverables for quality and completeness
- Validating requirements and acceptance criteria
- Performing quality audits and assessments
- Creating quality metrics and reports
- Ensuring compliance with standards and regulations
- Coordinating with all agents to maintain quality
- Providing quality improvement recommendations

You have access to quality analysis tools, reporting systems, and can evaluate all aspects of the development process.`,
      tools: ["qualityAssessment", "complianceCheck", "reporting", "metrics", "auditTools"],
      workpoolName: "testingWorkpool",
      maxConcurrentTasks: 2,
    },

    DeploymentEngineer: {
      type: "DeploymentEngineer",
      model: "gpt-4o",
      systemPrompt: `You are a Deployment Engineer AI agent responsible for:
- Creating deployment scripts and automation
- Managing CI/CD pipelines and infrastructure
- Configuring production and staging environments
- Monitoring system health and performance
- Managing releases and rollbacks
- Ensuring security and compliance in deployments
- Scaling and optimizing deployed applications

You have access to deployment tools, infrastructure management, monitoring systems, and can coordinate with other agents for successful releases.`,
      tools: ["deploymentAutomation", "infraManagement", "monitoring", "security", "scaling"],
      workpoolName: "deploymentWorkpool",
      maxConcurrentTasks: 2,
    },
  };

  // Create a new agent instance
  static async createAgent(ctx: any, projectId: Id<"projects">, type: AgentType): Promise<Id<"agents">> {
    const config = this.agentConfigs[type];
    
    const agentId = await ctx.db.insert("agents", {
      projectId,
      type,
      status: "idle",
      lastActivity: Date.now(),
      configuration: {
        model: config.model,
        prompt: config.systemPrompt,
        tools: config.tools,
      },
    });

    // Initialize agent thread for communication
    await this.initializeAgentThread(ctx, agentId, projectId);

    return agentId;
  }

  // Initialize communication thread for agent
  private static async initializeAgentThread(ctx: any, agentId: Id<"agents">, projectId: Id<"projects">) {
    await ctx.db.insert("agentThreads", {
      projectId,
      participantIds: [agentId],
      topic: `Agent ${agentId} Communication`,
      status: "active",
      createdAt: Date.now(),
      lastMessageAt: Date.now(),
    });
  }

  // Get agent configuration by type
  static getAgentConfig(type: AgentType): AgentConfig {
    return this.agentConfigs[type];
  }

  // Get appropriate workpool for agent type
  static getWorkpoolForAgent(type: AgentType): string {
    return this.agentConfigs[type].workpoolName;
  }
}

// Create all agents for a project
export const createProjectAgents = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const agents: Record<AgentType, Id<"agents">> = {} as any;
    
    // Create each type of agent for the project
    for (const agentType of Object.keys(AgentManager.agentConfigs) as AgentType[]) {
      const agentId = await AgentManager.createAgent(ctx, args.projectId, agentType);
      agents[agentType] = agentId;
      
      // Log agent creation
      await ctx.db.insert("systemLogs", {
        projectId: args.projectId,
        agentId,
        level: "info",
        message: `Created ${agentType} agent`,
        timestamp: Date.now(),
      });
    }

    return {
      success: true,
      agents,
      message: `Created ${Object.keys(agents).length} agents for project`,
    };
  },
});

// Get agents for a project
export const getProjectAgents = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const agents = await ctx.db
      .query("agents")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    return agents.map(agent => ({
      id: agent._id,
      type: agent.type,
      status: agent.status,
      currentTask: agent.currentTask,
      lastActivity: agent.lastActivity,
      configuration: agent.configuration,
    }));
  },
});

// Assign task to appropriate agent
export const assignTaskToAgent = mutation({
  args: {
    taskId: v.id("tasks"),
    agentType: v.optional(v.union(
      v.literal("ProjectManager"),
      v.literal("SystemArchitect"),
      v.literal("TaskPlanner"),
      v.literal("CodeGenerator"),
      v.literal("TestEngineer"),
      v.literal("QAAnalyst"),
      v.literal("DeploymentEngineer")
    )),
  },
  handler: async (ctx, args) => {
    // Get task details
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    // Determine appropriate agent type if not specified
    let targetAgentType = args.agentType;
    if (!targetAgentType) {
      // Auto-assign based on task type
      const taskTypeToAgent: Record<string, AgentType> = {
        architecture: "SystemArchitect",
        planning: "TaskPlanner",
        coding: "CodeGenerator",
        testing: "TestEngineer",
        qa: "QAAnalyst",
        deployment: "DeploymentEngineer",
        documentation: "CodeGenerator",
      };
      targetAgentType = taskTypeToAgent[task.type] || "TaskPlanner";
    }

    // Find available agent of the specified type
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_project", (q) => q.eq("projectId", task.projectId))
      .filter((q) => q.and(
        q.eq(q.field("type"), targetAgentType),
        q.eq(q.field("status"), "idle")
      ))
      .first();

    if (!agent) {
      throw new Error(`No available ${targetAgentType} agent found`);
    }

    // Assign task to agent
    await ctx.db.patch(args.taskId, {
      assignedAgentId: agent._id,
      status: "in_progress",
      updatedAt: Date.now(),
    });

    // Update agent status
    await ctx.db.patch(agent._id, {
      status: "working",
      currentTask: task.title,
      lastActivity: Date.now(),
    });

    // Log assignment
    await ctx.db.insert("systemLogs", {
      projectId: task.projectId,
      agentId: agent._id,
      level: "info",
      message: `Assigned task "${task.title}" to ${targetAgentType} agent`,
      metadata: { taskId: args.taskId, taskType: task.type },
      timestamp: Date.now(),
    });

    return {
      success: true,
      agentId: agent._id,
      agentType: agent.type,
      taskId: args.taskId,
    };
  },
});

// Agent communication: Send message between agents
export const sendAgentMessage = action({
  args: {
    fromAgentId: v.id("agents"),
    toAgentId: v.id("agents"),
    message: v.string(),
    messageType: v.optional(v.union(
      v.literal("coordination"),
      v.literal("question"),
      v.literal("update"),
      v.literal("request"),
      v.literal("response")
    )),
  },
  handler: async (ctx, args) => {
    // Get agent details
    const fromAgent = await ctx.db.get(args.fromAgentId);
    const toAgent = await ctx.db.get(args.toAgentId);
    
    if (!fromAgent || !toAgent) {
      throw new Error("Agent not found");
    }

    // Find or create communication thread
    let thread = await ctx.db
      .query("agentThreads")
      .withIndex("by_project", (q) => q.eq("projectId", fromAgent.projectId))
      .filter((q) => q.or(
        q.and(
          q.eq(q.field("participantIds").length, 2),
          q.eq(q.field("participantIds")[0], args.fromAgentId),
          q.eq(q.field("participantIds")[1], args.toAgentId)
        ),
        q.and(
          q.eq(q.field("participantIds").length, 2),
          q.eq(q.field("participantIds")[0], args.toAgentId),
          q.eq(q.field("participantIds")[1], args.fromAgentId)
        )
      ))
      .first();

    if (!thread) {
      // Create new thread
      const threadId = await ctx.db.insert("agentThreads", {
        projectId: fromAgent.projectId,
        participantIds: [args.fromAgentId, args.toAgentId],
        topic: `${fromAgent.type} ↔ ${toAgent.type}`,
        status: "active",
        createdAt: Date.now(),
        lastMessageAt: Date.now(),
      });
      thread = await ctx.db.get(threadId);
    }

    if (!thread) throw new Error("Failed to create thread");

    // Use AI Agent Component to send message
    try {
      await components.agent.lib.sendMessage(ctx, {
        threadId: thread._id,
        message: args.message,
        sender: fromAgent.type,
        metadata: {
          messageType: args.messageType || "coordination",
          fromAgentId: args.fromAgentId,
          toAgentId: args.toAgentId,
          timestamp: Date.now(),
        },
      });

      // Update thread last message time
      await ctx.db.patch(thread._id, {
        lastMessageAt: Date.now(),
      });

      // Log the communication
      await ctx.db.insert("systemLogs", {
        projectId: fromAgent.projectId,
        level: "info",
        message: `Agent communication: ${fromAgent.type} → ${toAgent.type}`,
        metadata: {
          messageType: args.messageType,
          threadId: thread._id,
        },
        timestamp: Date.now(),
      });

      return {
        success: true,
        threadId: thread._id,
        message: "Message sent successfully",
      };
    } catch (error) {
      throw new Error(`Failed to send message: ${error}`);
    }
  },
});

// Get agent communication history
export const getAgentMessages = query({
  args: {
    agentId: v.id("agents"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) throw new Error("Agent not found");

    // Get threads involving this agent
    const threads = await ctx.db
      .query("agentThreads")
      .withIndex("by_project", (q) => q.eq("projectId", agent.projectId))
      .filter((q) => q.or(
        q.eq(q.field("participantIds")[0], args.agentId),
        q.eq(q.field("participantIds")[1], args.agentId)
      ))
      .collect();

    // Get messages from all threads
    const allMessages = [];
    for (const thread of threads) {
      try {
        const messages = await components.agent.lib.getMessages(ctx, {
          threadId: thread._id,
          limit: args.limit || 50,
        });
        allMessages.push(...messages.map((msg: any) => ({
          ...msg,
          threadId: thread._id,
          threadTopic: thread.topic,
        })));
      } catch (error) {
        // Handle case where messages don't exist yet
        continue;
      }
    }

    return allMessages.sort((a, b) => b.timestamp - a.timestamp);
  },
});

// Update agent status
export const updateAgentStatus = mutation({
  args: {
    agentId: v.id("agents"),
    status: v.union(
      v.literal("idle"),
      v.literal("working"), 
      v.literal("waiting"),
      v.literal("error"),
      v.literal("completed")
    ),
    currentTask: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) throw new Error("Agent not found");

    await ctx.db.patch(args.agentId, {
      status: args.status,
      currentTask: args.currentTask,
      lastActivity: Date.now(),
    });

    // Log status change
    await ctx.db.insert("systemLogs", {
      projectId: agent.projectId,
      agentId: args.agentId,
      level: "info",
      message: `Agent status changed to ${args.status}`,
      metadata: { 
        previousStatus: agent.status,
        currentTask: args.currentTask 
      },
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

// Get agent performance metrics
export const getAgentMetrics = query({
  args: {
    projectId: v.id("projects"),
    agentType: v.optional(v.union(
      v.literal("ProjectManager"),
      v.literal("SystemArchitect"),
      v.literal("TaskPlanner"),
      v.literal("CodeGenerator"),
      v.literal("TestEngineer"),
      v.literal("QAAnalyst"),
      v.literal("DeploymentEngineer")
    )),
  },
  handler: async (ctx, args) => {
    let agentsQuery = ctx.db
      .query("agents")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId));

    if (args.agentType) {
      agentsQuery = agentsQuery.filter((q) => q.eq(q.field("type"), args.agentType));
    }

    const agents = await agentsQuery.collect();

    // Get tasks assigned to these agents
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Calculate metrics
    const metrics = agents.map(agent => {
      const agentTasks = tasks.filter(task => task.assignedAgentId === agent._id);
      const completedTasks = agentTasks.filter(task => task.status === "completed");
      const failedTasks = agentTasks.filter(task => task.status === "failed");
      
      return {
        agentId: agent._id,
        type: agent.type,
        status: agent.status,
        tasksAssigned: agentTasks.length,
        tasksCompleted: completedTasks.length,
        tasksFailed: failedTasks.length,
        successRate: agentTasks.length > 0 ? completedTasks.length / agentTasks.length : 0,
        avgTaskTime: completedTasks.length > 0 
          ? completedTasks.reduce((sum, task) => sum + (task.actualHours || 0), 0) / completedTasks.length
          : 0,
        lastActivity: agent.lastActivity,
      };
    });

    return metrics;
  },
});


