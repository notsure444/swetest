/**
 * Agent-specific utility functions.
 * 
 * Utilities for agent management, coordination, and workflow
 * shared across dashboard, agent implementations, and backend.
 */

import type { 
  AgentType, 
  AgentStatus, 
  AgentConfiguration,
  AgentTask,
  TaskType,
  TaskStatus,
  ResourceRequirement
} from '../types';

export const getAgentCapabilities = (agentType: AgentType): string[] => {
  const capabilities: Record<AgentType, string[]> = {
    'ProjectManager': [
      'project_coordination', 'stakeholder_communication', 'timeline_management',
      'resource_allocation', 'progress_tracking', 'risk_assessment'
    ],
    'SystemArchitect': [
      'architecture_design', 'system_design', 'technology_selection',
      'scalability_planning', 'security_design', 'integration_planning'
    ],
    'TaskPlanner': [
      'task_breakdown', 'dependency_analysis', 'effort_estimation',
      'resource_planning', 'timeline_creation', 'milestone_definition'
    ],
    'CodeGenerator': [
      'code_generation', 'api_development', 'frontend_development',
      'backend_development', 'database_design', 'code_optimization'
    ],
    'TestEngineer': [
      'test_planning', 'unit_testing', 'integration_testing',
      'e2e_testing', 'test_automation', 'quality_assurance'
    ],
    'QAAnalyst': [
      'quality_analysis', 'code_review', 'performance_analysis',
      'security_analysis', 'compliance_checking', 'documentation_review'
    ],
    'DeploymentEngineer': [
      'deployment_planning', 'ci_cd_setup', 'infrastructure_management',
      'monitoring_setup', 'performance_optimization', 'rollback_planning'
    ]
  };
  
  return capabilities[agentType] || [];
};

export const getRecommendedTools = (agentType: AgentType): string[] => {
  const tools: Record<AgentType, string[]> = {
    'ProjectManager': ['project_notes', 'todo_manager', 'web_search', 'semantic_search'],
    'SystemArchitect': ['web_search', 'semantic_search', 'project_notes', 'code_analysis'],
    'TaskPlanner': ['todo_manager', 'project_notes', 'semantic_search', 'time_estimation'],
    'CodeGenerator': ['semantic_search', 'code_generation', 'file_operations', 'git_operations'],
    'TestEngineer': ['test_runner', 'coverage_analysis', 'semantic_search', 'file_operations'],
    'QAAnalyst': ['code_analysis', 'quality_metrics', 'semantic_search', 'documentation_analysis'],
    'DeploymentEngineer': ['deployment_tools', 'monitoring_tools', 'infrastructure_tools', 'web_search']
  };
  
  return tools[agentType] || [];
};

export const calculateAgentWorkload = (tasks: AgentTask[]): number => {
  const activeTasks = tasks.filter(task => 
    ['assigned', 'in_progress'].includes(task.status)
  );
  
  const totalEstimatedHours = activeTasks.reduce((total, task) => 
    total + (task.estimatedDuration || 0), 0
  );
  
  // Normalize to 0-100 scale assuming 40 hours per week capacity
  return Math.min(Math.round((totalEstimatedHours / 40) * 100), 100);
};

export const getAgentPriorityScore = (
  agentType: AgentType,
  taskType: TaskType,
  currentWorkload: number
): number => {
  // Base priority based on agent type and task type compatibility
  const compatibility: Record<AgentType, Record<TaskType, number>> = {
    'ProjectManager': {
      'project_management': 10, 'architecture_design': 3, 'task_planning': 8,
      'code_generation': 2, 'code_review': 5, 'testing': 3,
      'deployment': 6, 'documentation': 7, 'quality_assurance': 6
    },
    'SystemArchitect': {
      'project_management': 4, 'architecture_design': 10, 'task_planning': 6,
      'code_generation': 7, 'code_review': 8, 'testing': 4,
      'deployment': 5, 'documentation': 8, 'quality_assurance': 7
    },
    'TaskPlanner': {
      'project_management': 6, 'architecture_design': 5, 'task_planning': 10,
      'code_generation': 3, 'code_review': 4, 'testing': 5,
      'deployment': 4, 'documentation': 6, 'quality_assurance': 5
    },
    'CodeGenerator': {
      'project_management': 2, 'architecture_design': 6, 'task_planning': 4,
      'code_generation': 10, 'code_review': 7, 'testing': 6,
      'deployment': 3, 'documentation': 5, 'quality_assurance': 4
    },
    'TestEngineer': {
      'project_management': 3, 'architecture_design': 4, 'task_planning': 5,
      'code_generation': 5, 'code_review': 6, 'testing': 10,
      'deployment': 4, 'documentation': 6, 'quality_assurance': 8
    },
    'QAAnalyst': {
      'project_management': 5, 'architecture_design': 6, 'task_planning': 4,
      'code_generation': 4, 'code_review': 9, 'testing': 7,
      'deployment': 3, 'documentation': 7, 'quality_assurance': 10
    },
    'DeploymentEngineer': {
      'project_management': 4, 'architecture_design': 5, 'task_planning': 3,
      'code_generation': 3, 'code_review': 4, 'testing': 5,
      'deployment': 10, 'documentation': 5, 'quality_assurance': 6
    }
  };
  
  const baseScore = compatibility[agentType]?.[taskType] || 1;
  
  // Apply workload penalty (higher workload = lower priority)
  const workloadPenalty = Math.max(0, (currentWorkload - 50) / 50); // Penalty starts at 50% workload
  
  return Math.max(1, Math.round(baseScore * (1 - workloadPenalty * 0.5)));
};

export const canAgentHandleTask = (
  agentType: AgentType,
  taskType: TaskType,
  requiredCapabilities: string[]
): boolean => {
  const agentCapabilities = getAgentCapabilities(agentType);
  
  // Check if agent has the basic capability for this task type
  const taskCapabilities: Record<TaskType, string[]> = {
    'architecture_design': ['architecture_design', 'system_design'],
    'task_planning': ['task_breakdown', 'dependency_analysis'],
    'code_generation': ['code_generation', 'api_development'],
    'code_review': ['code_review', 'quality_analysis'],
    'testing': ['test_planning', 'unit_testing'],
    'deployment': ['deployment_planning', 'ci_cd_setup'],
    'documentation': ['documentation_review'],
    'quality_assurance': ['quality_analysis', 'compliance_checking'],
    'project_management': ['project_coordination', 'progress_tracking']
  };
  
  const requiredForTask = taskCapabilities[taskType] || [];
  const hasBasicCapability = requiredForTask.some(cap => agentCapabilities.includes(cap));
  
  if (!hasBasicCapability) return false;
  
  // Check if agent has all specifically required capabilities
  return requiredCapabilities.every(cap => agentCapabilities.includes(cap));
};

export const estimateTaskDuration = (
  taskType: TaskType,
  agentType: AgentType,
  complexity: 'simple' | 'moderate' | 'complex' = 'moderate'
): number => {
  // Base duration in hours
  const baseDurations: Record<TaskType, number> = {
    'architecture_design': 16,
    'task_planning': 8,
    'code_generation': 24,
    'code_review': 4,
    'testing': 16,
    'deployment': 12,
    'documentation': 6,
    'quality_assurance': 8,
    'project_management': 4
  };
  
  // Agent efficiency multipliers
  const efficiency: Record<AgentType, Record<TaskType, number>> = {
    'ProjectManager': {
      'project_management': 0.8, 'architecture_design': 1.5, 'task_planning': 0.9,
      'code_generation': 2.0, 'code_review': 1.2, 'testing': 1.4,
      'deployment': 1.3, 'documentation': 1.0, 'quality_assurance': 1.1
    },
    'SystemArchitect': {
      'project_management': 1.3, 'architecture_design': 0.7, 'task_planning': 1.0,
      'code_generation': 1.0, 'code_review': 0.9, 'testing': 1.2,
      'deployment': 1.1, 'documentation': 0.9, 'quality_assurance': 1.0
    },
    'CodeGenerator': {
      'project_management': 1.5, 'architecture_design': 1.1, 'task_planning': 1.2,
      'code_generation': 0.8, 'code_review': 1.0, 'testing': 1.0,
      'deployment': 1.3, 'documentation': 1.1, 'quality_assurance': 1.2
    },
    'TestEngineer': {
      'project_management': 1.4, 'architecture_design': 1.2, 'task_planning': 1.1,
      'code_generation': 1.1, 'code_review': 1.0, 'testing': 0.7,
      'deployment': 1.2, 'documentation': 1.0, 'quality_assurance': 0.9
    },
    'QAAnalyst': {
      'project_management': 1.2, 'architecture_design': 1.0, 'task_planning': 1.1,
      'code_generation': 1.2, 'code_review': 0.8, 'testing': 0.9,
      'deployment': 1.3, 'documentation': 0.9, 'quality_assurance': 0.8
    },
    'DeploymentEngineer': {
      'project_management': 1.3, 'architecture_design': 1.1, 'task_planning': 1.2,
      'code_generation': 1.3, 'code_review': 1.1, 'testing': 1.0,
      'deployment': 0.8, 'documentation': 1.0, 'quality_assurance': 1.0
    },
    'TaskPlanner': {
      'project_management': 1.0, 'architecture_design': 1.1, 'task_planning': 0.8,
      'code_generation': 1.4, 'code_review': 1.1, 'testing': 1.0,
      'deployment': 1.2, 'documentation': 0.9, 'quality_assurance': 1.0
    }
  };
  
  // Complexity multipliers
  const complexityMultipliers = {
    'simple': 0.7,
    'moderate': 1.0,
    'complex': 1.5
  };
  
  const baseDuration = baseDurations[taskType] || 8;
  const agentMultiplier = efficiency[agentType]?.[taskType] || 1.0;
  const complexityMultiplier = complexityMultipliers[complexity];
  
  return Math.round(baseDuration * agentMultiplier * complexityMultiplier);
};

export const formatAgentStatus = (status: AgentStatus): { text: string; color: string } => {
  const statusMap: Record<AgentStatus, { text: string; color: string }> = {
    'available': { text: 'Available', color: 'green' },
    'reserved': { text: 'Reserved', color: 'yellow' },
    'busy': { text: 'Busy', color: 'blue' },
    'idle': { text: 'Idle', color: 'gray' },
    'working': { text: 'Working', color: 'blue' },
    'waiting': { text: 'Waiting', color: 'yellow' },
    'error': { text: 'Error', color: 'red' },
    'completed': { text: 'Completed', color: 'green' }
  };
  
  return statusMap[status] || { text: 'Unknown', color: 'gray' };
};

export const validateResourceRequirement = (requirement: ResourceRequirement): string[] => {
  const errors: string[] = [];
  
  if (!requirement.type) {
    errors.push('Resource requirement type is required');
  }
  
  if (!requirement.resource || requirement.resource.trim().length === 0) {
    errors.push('Resource name is required');
  }
  
  if (!Array.isArray(requirement.permissions) || requirement.permissions.length === 0) {
    errors.push('At least one permission must be specified');
  }
  
  return errors;
};

export const generateAgentId = (agentType: AgentType, projectId?: string): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  const prefix = agentType.toLowerCase().replace(/([A-Z])/g, '_$1').toLowerCase();
  
  if (projectId) {
    const shortProjectId = projectId.substring(0, 8);
    return `${prefix}_${shortProjectId}_${timestamp}_${random}`;
  }
  
  return `${prefix}_${timestamp}_${random}`;
};

export const isAgentAvailable = (status: AgentStatus): boolean => {
  return ['available', 'idle'].includes(status);
};

export const isAgentWorking = (status: AgentStatus): boolean => {
  return ['busy', 'working', 'reserved'].includes(status);
};

export const getAgentTypeColor = (agentType: AgentType): string => {
  const colors: Record<AgentType, string> = {
    'ProjectManager': 'purple',
    'SystemArchitect': 'indigo',
    'TaskPlanner': 'blue',
    'CodeGenerator': 'green',
    'TestEngineer': 'yellow',
    'QAAnalyst': 'orange',
    'DeploymentEngineer': 'red'
  };
  
  return colors[agentType] || 'gray';
};
