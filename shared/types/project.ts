/**
 * Shared project-related type definitions.
 * 
 * These types are shared between the dashboard, agents, and Convex backend
 * to ensure consistent data structures across the entire system.
 */

// Project configuration types from Convex schema
export type ProjectType = "web" | "mobile" | "fullstack";

export type ProjectStatus = 
  | "created"
  | "planning"
  | "architecture"
  | "task_breakdown"
  | "development"
  | "testing"
  | "integration"
  | "deployment_prep"
  | "deployment"
  | "validation"
  | "maintenance"
  | "completed"
  | "paused"
  | "cancelled"
  | "failed";

export type ProjectPriority = "low" | "medium" | "high" | "urgent";

export type ProjectComplexity = "simple" | "moderate" | "complex" | "enterprise";

export interface ProjectConfiguration {
  techStack: string[];
  requirements: string;
  deliverables: Deliverable[];
  evaluationCriteria: EvaluationCriterion[];
  estimatedDuration?: string;
  targetAudience?: string;
  businessGoals?: string[];
  technicalConstraints?: string[];
}

export interface ProjectLifecycle {
  currentState: string;
  stateHistory: ProjectStateTransition[];
  estimatedCompletion?: number;
}

export interface ProjectMetrics {
  totalDeliverables: number;
  completedDeliverables: number;
  totalEvaluations: number;
  passedEvaluations: number;
  progressPercentage: number;
  qualityScore: number;
}

export interface ProjectStateTransition {
  from: ProjectStatus;
  to: ProjectStatus;
  timestamp: number;
  reason?: string;
  agentId?: string;
}

export interface Deliverable {
  id: string;
  title: string;
  description: string;
  type: DeliverableType;
  status: DeliverableStatus;
  acceptanceCriteria: string[];
  assignedAgentType?: string;
  estimatedHours?: number;
  actualHours?: number;
  dependencies?: string[];
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

export type DeliverableType = 
  | "feature"
  | "component"
  | "api"
  | "database"
  | "documentation"
  | "test_suite"
  | "deployment_script"
  | "configuration";

export type DeliverableStatus = 
  | "pending"
  | "in_progress"
  | "review"
  | "approved"
  | "completed"
  | "blocked"
  | "cancelled";

export interface EvaluationCriterion {
  id: string;
  title: string;
  description: string;
  type: EvaluationType;
  threshold: number;
  weight: number;
  automated: boolean;
  status: EvaluationStatus;
  result?: EvaluationResult;
}

export type EvaluationType = 
  | "performance"
  | "security"
  | "accessibility"
  | "code_quality"
  | "test_coverage"
  | "user_experience"
  | "functionality"
  | "reliability";

export type EvaluationStatus = 
  | "pending"
  | "running"
  | "passed"
  | "failed"
  | "cancelled";

export interface EvaluationResult {
  score: number;
  passed: boolean;
  details: string;
  timestamp: number;
  evidence?: string[];
}

// Project creation and management interfaces
export interface CreateProjectRequest {
  name: string;
  description: string;
  type: ProjectType;
  configuration: Partial<ProjectConfiguration>;
  priority?: ProjectPriority;
  complexity?: ProjectComplexity;
}

export interface ProjectUpdateRequest {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  complexity?: ProjectComplexity;
  configuration?: Partial<ProjectConfiguration>;
}

export interface ProjectDashboardData {
  id: string;
  name: string;
  description: string;
  type: ProjectType;
  status: ProjectStatus;
  priority: ProjectPriority;
  complexity: ProjectComplexity;
  configuration: ProjectConfiguration;
  namespace: string;
  containerId?: string;
  lifecycle?: ProjectLifecycle;
  metrics?: ProjectMetrics;
  agentAssignments: AgentAssignment[];
  createdAt: number;
  updatedAt: number;
}

export interface AgentAssignment {
  agentId: string;
  agentType: string;
  assignedAt: number;
  status: string;
  currentTask?: string;
  assignedTasks: string[];
}
