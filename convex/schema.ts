// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Projects table for managing multiple isolated projects
  projects: defineTable({
    name: v.string(),
    description: v.string(),
    type: v.union(v.literal("web"), v.literal("mobile"), v.literal("fullstack")),
    status: v.union(
      v.literal("created"),
      v.literal("planning"),
      v.literal("development"),
      v.literal("testing"),
      v.literal("deployment"),
      v.literal("completed"),
      v.literal("paused"),
      v.literal("failed")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
    configuration: v.object({
      techStack: v.array(v.string()),
      requirements: v.string(),
      deliverables: v.array(v.string()),
      evaluationCriteria: v.array(v.string()),
    }),
    namespace: v.string(), // For RAG and data isolation
    containerId: v.optional(v.string()), // Docker container ID for isolation
  }).index("by_status", ["status"])
    .index("by_namespace", ["namespace"]),

  // Agent instances and their states
  agents: defineTable({
    projectId: v.id("projects"),
    type: v.union(
      v.literal("ProjectManager"),
      v.literal("SystemArchitect"),
      v.literal("TaskPlanner"),
      v.literal("CodeGenerator"),
      v.literal("TestEngineer"),
      v.literal("QAAnalyst"),
      v.literal("DeploymentEngineer")
    ),
    status: v.union(
      v.literal("idle"),
      v.literal("working"),
      v.literal("waiting"),
      v.literal("error"),
      v.literal("completed")
    ),
    currentTask: v.optional(v.string()),
    lastActivity: v.number(),
    configuration: v.object({
      model: v.string(), // GPT-5, Claude 4.1, etc.
      prompt: v.string(),
      tools: v.array(v.string()),
    }),
  }).index("by_project", ["projectId"])
    .index("by_type", ["type"])
    .index("by_status", ["status"]),

  // Tasks and work items
  tasks: defineTable({
    projectId: v.id("projects"),
    assignedAgentId: v.optional(v.id("agents")),
    title: v.string(),
    description: v.string(),
    type: v.union(
      v.literal("architecture"),
      v.literal("planning"),
      v.literal("coding"),
      v.literal("testing"),
      v.literal("qa"),
      v.literal("deployment"),
      v.literal("documentation")
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("blocked")
    ),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    dependencies: v.array(v.id("tasks")),
    createdAt: v.number(),
    updatedAt: v.number(),
    estimatedHours: v.optional(v.number()),
    actualHours: v.optional(v.number()),
    results: v.optional(v.object({
      output: v.string(),
      files: v.array(v.string()),
      notes: v.string(),
    })),
  }).index("by_project", ["projectId"])
    .index("by_status", ["status"])
    .index("by_agent", ["assignedAgentId"])
    .index("by_type", ["type"]),

  // Project notes and documentation
  projectNotes: defineTable({
    projectId: v.id("projects"),
    agentId: v.optional(v.id("agents")),
    title: v.string(),
    content: v.string(),
    type: v.union(
      v.literal("note"),
      v.literal("decision"),
      v.literal("issue"),
      v.literal("solution"),
      v.literal("progress")
    ),
    tags: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_project", ["projectId"])
    .index("by_type", ["type"])
    .index("by_agent", ["agentId"]),

  // Todo lists for agents
  todos: defineTable({
    projectId: v.id("projects"),
    agentId: v.id("agents"),
    taskId: v.optional(v.id("tasks")),
    title: v.string(),
    description: v.optional(v.string()),
    completed: v.boolean(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    dueDate: v.optional(v.number()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_project", ["projectId"])
    .index("by_agent", ["agentId"])
    .index("by_completed", ["completed"]),

  // System logs for monitoring and debugging
  systemLogs: defineTable({
    projectId: v.optional(v.id("projects")),
    agentId: v.optional(v.id("agents")),
    level: v.union(v.literal("debug"), v.literal("info"), v.literal("warn"), v.literal("error")),
    message: v.string(),
    metadata: v.optional(v.any()),
    timestamp: v.number(),
  }).index("by_level", ["level"])
    .index("by_project", ["projectId"])
    .index("by_timestamp", ["timestamp"]),

  // Agent communication threads (leveraging AI Agent Component)
  agentThreads: defineTable({
    projectId: v.id("projects"),
    participantIds: v.array(v.id("agents")),
    topic: v.string(),
    status: v.union(v.literal("active"), v.literal("archived"), v.literal("paused")),
    createdAt: v.number(),
    lastMessageAt: v.number(),
  }).index("by_project", ["projectId"])
    .index("by_status", ["status"]),
});
