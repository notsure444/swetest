/**
 * Shared agent-related type definitions.
 * 
 * These types define the agent system structure and are shared between
 * the dashboard, agent implementations, and Convex backend.
 */

// Agent types from Convex schema
export type AgentType = 
  | "ProjectManager"
  | "SystemArchitect"
  | "TaskPlanner"
  | "CodeGenerator"
  | "TestEngineer"
  | "QAAnalyst"
  | "DeploymentEngineer";

export type AgentStatus = 
  | "available"
  | "reserved"
  | "busy"
  | "idle"
  | "working"
  | "waiting"
  | "error"
  | "completed";

export interface AgentConfiguration {
  model: string; // GPT-5, Claude 4.1, etc.
  prompt: string;
  tools: string[];
  maxConcurrentTasks?: number;
  contextNamespace?: string;
  rateLimitPerMinute?: number;
}

export interface Agent {
  id: string;
  projectId?: string;
  type: AgentType;
  status: AgentStatus;
  currentProjectId?: string;
  currentTask?: string;
  assignedTasks: string[];
  lastActivity: number;
  createdAt: number;
  updatedAt: number;
  configuration: AgentConfiguration;
}

// Agent communication and coordination
export interface AgentMessage {
  id: string;
  fromAgentId: string;
  toAgentId?: string; // Optional for broadcast messages
  projectId: string;
  messageType: AgentMessageType;
  content: string;
  metadata?: Record<string, any>;
  timestamp: number;
  threadId?: string;
}

export type AgentMessageType = 
  | "task_assignment"
  | "progress_update"
  | "collaboration_request"
  | "resource_request"
  | "status_update"
  | "error_report"
  | "completion_notification"
  | "coordination_message";

export interface AgentTask {
  id: string;
  projectId: string;
  assignedAgentId: string;
  assignedAgentType: AgentType;
  title: string;
  description: string;
  taskType: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  dependencies: string[];
  estimatedDuration?: number;
  actualDuration?: number;
  context: TaskContext;
  result?: TaskResult;
  createdAt: number;
  updatedAt: number;
  startedAt?: number;
  completedAt?: number;
}

export type TaskType = 
  | "architecture_design"
  | "task_planning"
  | "code_generation"
  | "code_review"
  | "testing"
  | "deployment"
  | "documentation"
  | "quality_assurance"
  | "project_management";

export type TaskStatus = 
  | "pending"
  | "assigned"
  | "in_progress"
  | "review"
  | "completed"
  | "failed"
  | "cancelled"
  | "blocked";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface TaskContext {
  deliverableIds?: string[];
  requiredSkills?: string[];
  resourceRequirements?: ResourceRequirement[];
  qualityGates?: string[];
  acceptanceCriteria?: string[];
}

export interface TaskResult {
  status: "success" | "failure" | "partial";
  output?: any;
  files?: string[];
  metrics?: Record<string, number>;
  logs?: string[];
  errors?: string[];
  nextSteps?: string[];
}

export interface ResourceRequirement {
  type: "api_access" | "file_access" | "service_access" | "compute" | "memory";
  resource: string;
  permissions: string[];
  quotaLimits?: Record<string, number>;
}

// Agent system health and monitoring
export interface AgentSystemHealth {
  totalAgents: number;
  agentsByStatus: Record<AgentStatus, number>;
  agentsByType: Record<AgentType, number>;
  recentActivity: number;
  errorRate: number;
  systemStatus: "healthy" | "degraded" | "critical" | "idle";
  lastUpdated: number;
}

export interface AgentPerformanceMetrics {
  agentId: string;
  agentType: AgentType;
  tasksCompleted: number;
  tasksInProgress: number;
  tasksFailed: number;
  averageTaskDuration: number;
  successRate: number;
  qualityScore: number;
  resourceUsage: ResourceUsage;
  lastActive: number;
}

export interface ResourceUsage {
  cpuUsage: number;
  memoryUsage: number;
  apiCalls: number;
  apiQuotaRemaining: number;
  storageUsed: number;
}

// Agent collaboration and workflow
export interface CollaborationRequest {
  id: string;
  fromAgentId: string;
  toAgentIds: string[];
  projectId: string;
  taskId: string;
  collaborationType: CollaborationType;
  description: string;
  requiredCapabilities: string[];
  expectedDuration?: number;
  deadline?: number;
  status: "pending" | "accepted" | "declined" | "in_progress" | "completed";
  createdAt: number;
  updatedAt: number;
}

export type CollaborationType = 
  | "code_review"
  | "architecture_review"
  | "pair_programming"
  | "knowledge_sharing"
  | "problem_solving"
  | "testing_assistance"
  | "deployment_support";

export interface AgentCapability {
  name: string;
  description: string;
  agentTypes: AgentType[];
  requiredTools: string[];
  skillLevel: "basic" | "intermediate" | "advanced" | "expert";
}

// Agent workflow and orchestration
export interface WorkflowStep {
  id: string;
  workflowId: string;
  stepType: string;
  agentType: AgentType;
  status: TaskStatus;
  order: number;
  dependencies: string[];
  configuration: Record<string, any>;
  result?: TaskResult;
}

export interface AgentWorkflow {
  id: string;
  projectId: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  createdAt: number;
  updatedAt: number;
  startedAt?: number;
  completedAt?: number;
}
