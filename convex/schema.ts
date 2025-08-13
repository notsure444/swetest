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

  // Enhanced project notes system for agent knowledge management
  project_notes: defineTable({
    projectId: v.id("projects"),
    agentId: v.string(),
    title: v.string(),
    content: v.string(),
    category: v.optional(v.string()),
    tags: v.array(v.string()),
    isPrivate: v.boolean(),
    associatedTask: v.optional(v.id("tasks")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_project", ["projectId"])
    .index("by_category", ["category"])
    .index("by_agent", ["agentId"])
    .index("by_private", ["isPrivate"]),

  // Enhanced todo system with dependencies and priorities
  todos: defineTable({
    projectId: v.id("projects"),
    agentId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    category: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("in_progress"), v.literal("completed"), v.literal("cancelled")),
    dueDate: v.optional(v.number()),
    dependencies: v.array(v.id("todos")),
    associatedTask: v.optional(v.id("tasks")),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_project", ["projectId"])
    .index("by_agent", ["agentId"])
    .index("by_status", ["status"])
    .index("by_priority", ["priority"]),

  // Tool usage logging for analytics and optimization
  tool_usage_logs: defineTable({
    toolName: v.string(),
    agentId: v.string(),
    projectId: v.optional(v.id("projects")),
    parameters: v.any(),
    timestamp: v.number(),
  }).index("by_tool", ["toolName"])
    .index("by_agent", ["agentId"])
    .index("by_project", ["projectId"])
    .index("by_timestamp", ["timestamp"]),

  // Search history for web search optimization
  search_history: defineTable({
    projectId: v.id("projects"),
    agentId: v.string(),
    query: v.string(),
    results: v.any(),
    searchType: v.string(),
    timestamp: v.number(),
  }).index("by_project", ["projectId"])
    .index("by_agent", ["agentId"])
    .index("by_query", ["query"]),

  // Test environments for isolated testing
  test_environments: defineTable({
    testEnvId: v.string(),
    projectId: v.id("projects"),
    agentId: v.string(),
    testType: v.union(v.literal("unit"), v.literal("integration"), v.literal("e2e"), v.literal("performance")),
    status: v.union(v.literal("creating"), v.literal("ready"), v.literal("running"), v.literal("failed"), v.literal("cleaned_up")),
    configuration: v.any(),
    containerInfo: v.optional(v.any()),
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    cleanedUpAt: v.optional(v.number()),
  }).index("by_project", ["projectId"])
    .index("by_agent", ["agentId"])
    .index("by_status", ["status"])
    .index("by_test_env_id", ["testEnvId"]),

  // Test execution results
  test_results: defineTable({
    testEnvironmentId: v.string(),
    agentId: v.string(),
    testCommand: v.string(),
    results: v.any(),
    timestamp: v.number(),
  }).index("by_environment", ["testEnvironmentId"])
    .index("by_agent", ["agentId"])
    .index("by_timestamp", ["timestamp"]),

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

