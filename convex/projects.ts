// convex/projects.ts
// Multi-project isolation architecture with lifecycle management
import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { api, components } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Project configuration interface
interface ProjectConfig {
  name: string;
  description: string;
  type: "web" | "mobile" | "fullstack";
  techStack: string[];
  requirements: string;
  deliverables: string[];
  evaluationCriteria: string[];
  isolationLevel: "basic" | "standard" | "strict";
  resourceLimits?: {
    maxMemory?: string;
    maxCpu?: number;
    maxStorage?: string;
    maxContainers?: number;
  };
}

// Container configuration for project isolation
interface ContainerConfig {
  projectId: string;
  containerType: "development" | "testing" | "deployment";
  imageName: string;
  ports: number[];
  environment: Record<string, string>;
  volumes: string[];
  networks: string[];
  resourceLimits: {
    memory: string;
    cpus: number;
  };
}

// Project Lifecycle Management
export const createProject = mutation({
  args: {
    config: v.object({
      name: v.string(),
      description: v.string(),
      type: v.union(v.literal("web"), v.literal("mobile"), v.literal("fullstack")),
      techStack: v.array(v.string()),
      requirements: v.string(),
      deliverables: v.array(v.string()),
      evaluationCriteria: v.array(v.string()),
      isolationLevel: v.optional(v.union(v.literal("basic"), v.literal("standard"), v.literal("strict"))),
      resourceLimits: v.optional(v.object({
        maxMemory: v.optional(v.string()),
        maxCpu: v.optional(v.number()),
        maxStorage: v.optional(v.string()),
        maxContainers: v.optional(v.number()),
      })),
    }),
  },
  handler: async (ctx, args) => {
    // Generate unique namespace for project isolation
    const namespace = `project_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    // Create project with isolated namespace
    const projectId = await ctx.db.insert("projects", {
      name: args.config.name,
      description: args.config.description,
      type: args.config.type,
      status: "created",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      configuration: {
        techStack: args.config.techStack,
        requirements: args.config.requirements,
        deliverables: args.config.deliverables,
        evaluationCriteria: args.config.evaluationCriteria,
      },
      namespace,
    });

    // Create initial project structure and isolation
    await initializeProjectIsolation(ctx, projectId, namespace, args.config);

    // Log project creation
    await ctx.db.insert("systemLogs", {
      projectId,
      level: "info",
      message: `Project created: ${args.config.name}`,
      metadata: {
        namespace,
        type: args.config.type,
        techStack: args.config.techStack,
        isolationLevel: args.config.isolationLevel || "standard",
      },
      timestamp: Date.now(),
    });

    return {
      projectId,
      namespace,
      status: "created",
      message: `Project "${args.config.name}" created successfully with isolated namespace`,
    };
  },
});

// Initialize project isolation infrastructure
async function initializeProjectIsolation(
  ctx: any, 
  projectId: Id<"projects">, 
  namespace: string, 
  config: ProjectConfig
) {
  // Create project-specific RAG namespace for code isolation
  try {
    // Initialize RAG namespace for semantic code search isolation
    await components.rag.lib.add(ctx, {
      namespace,
      key: "project_initialization",
      text: `Project: ${config.name}\nType: ${config.type}\nTech Stack: ${config.techStack.join(", ")}\nRequirements: ${config.requirements}`,
      filterValues: [
        { name: "projectId", value: projectId },
        { name: "contentType", value: "project_metadata" },
        { name: "isolationLevel", value: config.isolationLevel || "standard" },
      ],
    });
  } catch (error) {
    // Handle case where RAG isn't ready yet
    console.log("RAG initialization will be handled later");
  }

  // Create project isolation container configuration
  await createProjectContainerConfig(ctx, projectId, namespace, config);
}

// Create container configuration for project isolation
async function createProjectContainerConfig(
  ctx: any,
  projectId: Id<"projects">,
  namespace: string,
  config: ProjectConfig
) {
  const isolationLevel = config.isolationLevel || "standard";
  const resourceLimits = config.resourceLimits || {};

  // Define container configurations based on project type and isolation level
  const containerConfigs = generateContainerConfigs(config, namespace, isolationLevel);

  // Store container configurations in project notes for later use
  for (const containerConfig of containerConfigs) {
    await ctx.db.insert("projectNotes", {
      projectId,
      title: `Container Config: ${containerConfig.containerType}`,
      content: JSON.stringify(containerConfig, null, 2),
      type: "note",
      tags: ["container", "isolation", containerConfig.containerType],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }
}

// Generate container configurations based on project requirements
function generateContainerConfigs(
  config: ProjectConfig,
  namespace: string,
  isolationLevel: string
): ContainerConfig[] {
  const baseConfig = {
    projectId: namespace,
    environment: {
      PROJECT_NAMESPACE: namespace,
      ISOLATION_LEVEL: isolationLevel,
      PROJECT_TYPE: config.type,
    },
    networks: [`${namespace}_network`],
  };

  const configs: ContainerConfig[] = [];

  // Development container
  configs.push({
    ...baseConfig,
    containerType: "development",
    imageName: getDevImageForTechStack(config.techStack),
    ports: getPortsForProjectType(config.type, "development"),
    volumes: [
      `${namespace}_code:/app/code`,
      `${namespace}_node_modules:/app/node_modules`,
      `${namespace}_cache:/app/.cache`,
    ],
    resourceLimits: {
      memory: config.resourceLimits?.maxMemory || "2GB",
      cpus: config.resourceLimits?.maxCpu || 2,
    },
  });

  // Testing container
  configs.push({
    ...baseConfig,
    containerType: "testing",
    imageName: getTestImageForTechStack(config.techStack),
    ports: getPortsForProjectType(config.type, "testing"),
    volumes: [
      `${namespace}_code:/app/code:ro`,
      `${namespace}_test_results:/app/test-results`,
    ],
    resourceLimits: {
      memory: config.resourceLimits?.maxMemory || "1GB",
      cpus: config.resourceLimits?.maxCpu || 1,
    },
  });

  // Deployment container (for production-like testing)
  configs.push({
    ...baseConfig,
    containerType: "deployment",
    imageName: getDeploymentImageForTechStack(config.techStack),
    ports: getPortsForProjectType(config.type, "deployment"),
    volumes: [
      `${namespace}_code:/app/code:ro`,
      `${namespace}_assets:/app/assets`,
    ],
    resourceLimits: {
      memory: config.resourceLimits?.maxMemory || "1GB",
      cpus: config.resourceLimits?.maxCpu || 1,
    },
  });

  return configs;
}

// Helper functions for container configuration
function getDevImageForTechStack(techStack: string[]): string {
  if (techStack.includes("node") || techStack.includes("typescript")) {
    return "node:20-alpine";
  } else if (techStack.includes("python")) {
    return "python:3.11-slim";
  } else if (techStack.includes("react")) {
    return "node:20-alpine";
  }
  return "ubuntu:22.04";
}

function getTestImageForTechStack(techStack: string[]): string {
  if (techStack.includes("node") || techStack.includes("typescript")) {
    return "node:20-alpine";
  } else if (techStack.includes("python")) {
    return "python:3.11-slim";
  }
  return "ubuntu:22.04";
}

function getDeploymentImageForTechStack(techStack: string[]): string {
  if (techStack.includes("react") || techStack.includes("node")) {
    return "nginx:alpine";
  } else if (techStack.includes("python")) {
    return "python:3.11-slim";
  }
  return "ubuntu:22.04";
}

function getPortsForProjectType(type: string, containerType: string): number[] {
  const portMap = {
    web: {
      development: [3000, 5173, 8080],
      testing: [8081, 9999],
      deployment: [80, 443],
    },
    mobile: {
      development: [3000, 8081, 19000, 19001, 19002],
      testing: [8082],
      deployment: [80],
    },
    fullstack: {
      development: [3000, 3001, 5173, 8080],
      testing: [8081, 8082],
      deployment: [80, 443, 5432],
    },
  };

  return portMap[type as keyof typeof portMap]?.[containerType as keyof typeof portMap.web] || [8080];
}

// Project Status Management
export const updateProjectStatus = mutation({
  args: {
    projectId: v.id("projects"),
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
    statusMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    const previousStatus = project.status;

    await ctx.db.patch(args.projectId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    // Log status change
    await ctx.db.insert("systemLogs", {
      projectId: args.projectId,
      level: "info",
      message: args.statusMessage || `Project status changed to ${args.status}`,
      metadata: {
        previousStatus,
        newStatus: args.status,
        namespace: project.namespace,
      },
      timestamp: Date.now(),
    });

    // Handle status-specific actions
    await handleStatusChange(ctx, args.projectId, previousStatus, args.status);

    return {
      success: true,
      previousStatus,
      newStatus: args.status,
    };
  },
});

// Handle project status change actions
async function handleStatusChange(
  ctx: any,
  projectId: Id<"projects">,
  previousStatus: string,
  newStatus: string
) {
  switch (newStatus) {
    case "planning":
      // Create all agents for the project when entering planning phase
      if (previousStatus === "created") {
        await ctx.runMutation(api.agents.createProjectAgents, { projectId });
      }
      break;
      
    case "development":
      // Ensure containers are ready for development
      await prepareProjectContainers(ctx, projectId, "development");
      break;
      
    case "testing":
      // Prepare testing environment
      await prepareProjectContainers(ctx, projectId, "testing");
      break;
      
    case "deployment":
      // Prepare deployment environment
      await prepareProjectContainers(ctx, projectId, "deployment");
      break;
      
    case "paused":
      // Pause all project containers to save resources
      await pauseProjectContainers(ctx, projectId);
      break;
      
    case "failed":
      // Clean up resources and log failure
      await handleProjectFailure(ctx, projectId);
      break;
  }
}

// Resource allocation and container management
async function prepareProjectContainers(ctx: any, projectId: Id<"projects">, phase: string) {
  const project = await ctx.db.get(projectId);
  if (!project) return;

  // Log container preparation
  await ctx.db.insert("systemLogs", {
    projectId,
    level: "info",
    message: `Preparing containers for ${phase} phase`,
    metadata: {
      phase,
      namespace: project.namespace,
    },
    timestamp: Date.now(),
  });

  // Container preparation will be handled by Docker Compose when implemented
}

async function pauseProjectContainers(ctx: any, projectId: Id<"projects">) {
  await ctx.db.insert("systemLogs", {
    projectId,
    level: "info",
    message: "Project containers paused to save resources",
    timestamp: Date.now(),
  });
}

async function handleProjectFailure(ctx: any, projectId: Id<"projects">) {
  await ctx.db.insert("systemLogs", {
    projectId,
    level: "error",
    message: "Project failed - initiating cleanup procedures",
    timestamp: Date.now(),
  });
}

// Project Query Functions
export const getProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return null;

    // Get project agents
    const agents = await ctx.db
      .query("agents")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Get project tasks
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Get container configurations
    const containerNotes = await ctx.db
      .query("projectNotes")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("tags")[0], "container"))
      .collect();

    return {
      ...project,
      agents: agents.length,
      tasks: tasks.length,
      tasksCompleted: tasks.filter(t => t.status === "completed").length,
      containers: containerNotes.length,
      isolation: {
        namespace: project.namespace,
        containerConfigs: containerNotes.map(note => ({
          type: note.title,
          config: JSON.parse(note.content),
        })),
      },
    };
  },
});

export const listProjects = query({
  args: {
    status: v.optional(v.union(
      v.literal("created"),
      v.literal("planning"),
      v.literal("development"),
      v.literal("testing"),
      v.literal("deployment"),
      v.literal("completed"),
      v.literal("paused"),
      v.literal("failed")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("projects");
    
    if (args.status) {
      query = query.withIndex("by_status", (q) => q.eq("status", args.status));
    }
    
    query = query.order("desc");
    
    if (args.limit) {
      query = query.take(args.limit);
    }

    const projects = await query.collect();

    // Get additional data for each project
    const projectsWithData = await Promise.all(
      projects.map(async (project) => {
        const agents = await ctx.db
          .query("agents")
          .withIndex("by_project", (q) => q.eq("projectId", project._id))
          .collect();
        
        const tasks = await ctx.db
          .query("tasks")
          .withIndex("by_project", (q) => q.eq("projectId", project._id))
          .collect();

        return {
          ...project,
          stats: {
            agents: agents.length,
            totalTasks: tasks.length,
            completedTasks: tasks.filter(t => t.status === "completed").length,
            activeTasks: tasks.filter(t => t.status === "in_progress").length,
          },
        };
      })
    );

    return projectsWithData;
  },
});

// Project Resource Management
export const getProjectResources = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    // Get resource usage logs
    const resourceLogs = await ctx.db
      .query("systemLogs")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("level"), "info"))
      .order("desc")
      .take(50);

    // Get container configurations
    const containerConfigs = await ctx.db
      .query("projectNotes")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("tags")[0], "container"))
      .collect();

    return {
      projectId: args.projectId,
      namespace: project.namespace,
      status: project.status,
      isolation: {
        level: "standard", // Could be enhanced to store in project config
        containers: containerConfigs.length,
        namespace: project.namespace,
      },
      resources: {
        containers: containerConfigs.map(config => {
          const parsedConfig = JSON.parse(config.content);
          return {
            type: parsedConfig.containerType,
            image: parsedConfig.imageName,
            memory: parsedConfig.resourceLimits.memory,
            cpus: parsedConfig.resourceLimits.cpus,
            ports: parsedConfig.ports,
          };
        }),
      },
      recentActivity: resourceLogs.map(log => ({
        message: log.message,
        timestamp: log.timestamp,
        metadata: log.metadata,
      })),
    };
  },
});

// Project Deletion with Cleanup
export const deleteProject = mutation({
  args: { 
    projectId: v.id("projects"),
    confirmDeletion: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (!args.confirmDeletion) {
      throw new Error("Project deletion must be confirmed");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    // Delete all related data
    await cleanupProjectData(ctx, args.projectId, project.namespace);

    // Delete the project
    await ctx.db.delete(args.projectId);

    // Log deletion
    await ctx.db.insert("systemLogs", {
      level: "info",
      message: `Project deleted: ${project.name}`,
      metadata: {
        projectId: args.projectId,
        namespace: project.namespace,
        deletedAt: Date.now(),
      },
      timestamp: Date.now(),
    });

    return {
      success: true,
      message: `Project "${project.name}" deleted successfully`,
      namespace: project.namespace,
    };
  },
});

// Cleanup all project-related data
async function cleanupProjectData(ctx: any, projectId: Id<"projects">, namespace: string) {
  // Delete agents
  const agents = await ctx.db
    .query("agents")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .collect();
  for (const agent of agents) {
    await ctx.db.delete(agent._id);
  }

  // Delete tasks
  const tasks = await ctx.db
    .query("tasks")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .collect();
  for (const task of tasks) {
    await ctx.db.delete(task._id);
  }

  // Delete project notes
  const notes = await ctx.db
    .query("projectNotes")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .collect();
  for (const note of notes) {
    await ctx.db.delete(note._id);
  }

  // Delete todos
  const todos = await ctx.db
    .query("todos")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .collect();
  for (const todo of todos) {
    await ctx.db.delete(todo._id);
  }

  // Delete threads
  const threads = await ctx.db
    .query("agentThreads")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .collect();
  for (const thread of threads) {
    await ctx.db.delete(thread._id);
  }

  // Delete system logs (keep some for audit trail)
  const oldLogs = await ctx.db
    .query("systemLogs")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .filter((q) => q.lt(q.field("timestamp"), Date.now() - 7 * 24 * 60 * 60 * 1000)) // older than 7 days
    .collect();
  for (const log of oldLogs) {
    await ctx.db.delete(log._id);
  }

  // TODO: Clean up RAG namespace when containers are implemented
}
