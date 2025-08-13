/**
 * Project-specific utility functions.
 * 
 * Utilities for project management, lifecycle, and coordination
 * shared across dashboard, agents, and backend.
 */

import type { 
  ProjectType, 
  ProjectStatus, 
  ProjectPriority,
  ProjectComplexity,
  ProjectConfiguration,
  Deliverable,
  EvaluationCriterion
} from '../types';

export const getProjectStatusOrder = (status: ProjectStatus): number => {
  const statusOrder: Record<ProjectStatus, number> = {
    'created': 0,
    'planning': 1,
    'architecture': 2,
    'task_breakdown': 3,
    'development': 4,
    'testing': 5,
    'integration': 6,
    'deployment_prep': 7,
    'deployment': 8,
    'validation': 9,
    'maintenance': 10,
    'completed': 11,
    'paused': 100,
    'cancelled': 101,
    'failed': 102
  };
  
  return statusOrder[status] || 50;
};

export const canTransitionToStatus = (from: ProjectStatus, to: ProjectStatus): boolean => {
  const fromOrder = getProjectStatusOrder(from);
  const toOrder = getProjectStatusOrder(to);
  
  // Can always transition to paused, cancelled, or failed
  if (['paused', 'cancelled', 'failed'].includes(to)) return true;
  
  // Can resume from paused to previous status or next logical status
  if (from === 'paused') return true;
  
  // Can only move forward in the normal flow (or stay same)
  return toOrder >= fromOrder;
};

export const getNextProjectStatus = (currentStatus: ProjectStatus): ProjectStatus | null => {
  const statusFlow: Record<ProjectStatus, ProjectStatus | null> = {
    'created': 'planning',
    'planning': 'architecture',
    'architecture': 'task_breakdown',
    'task_breakdown': 'development',
    'development': 'testing',
    'testing': 'integration',
    'integration': 'deployment_prep',
    'deployment_prep': 'deployment',
    'deployment': 'validation',
    'validation': 'maintenance',
    'maintenance': 'completed',
    'completed': null,
    'paused': null, // Depends on what was paused
    'cancelled': null,
    'failed': null
  };
  
  return statusFlow[currentStatus] || null;
};

export const calculateProjectProgress = (
  currentStatus: ProjectStatus,
  deliverables?: Deliverable[]
): number => {
  const statusProgress: Record<ProjectStatus, number> = {
    'created': 5,
    'planning': 10,
    'architecture': 20,
    'task_breakdown': 25,
    'development': 60,
    'testing': 75,
    'integration': 85,
    'deployment_prep': 90,
    'deployment': 95,
    'validation': 98,
    'maintenance': 99,
    'completed': 100,
    'paused': 0, // Use deliverables percentage
    'cancelled': 0,
    'failed': 0
  };
  
  // For paused projects, calculate based on deliverables
  if (currentStatus === 'paused' && deliverables) {
    const completed = deliverables.filter(d => d.status === 'completed').length;
    return deliverables.length > 0 ? Math.round((completed / deliverables.length) * 100) : 0;
  }
  
  return statusProgress[currentStatus] || 0;
};

export const getPriorityWeight = (priority: ProjectPriority): number => {
  const weights: Record<ProjectPriority, number> = {
    'urgent': 4,
    'high': 3,
    'medium': 2,
    'low': 1
  };
  
  return weights[priority] || 2;
};

export const getComplexityMultiplier = (complexity: ProjectComplexity): number => {
  const multipliers: Record<ProjectComplexity, number> = {
    'simple': 1,
    'moderate': 1.5,
    'complex': 2.5,
    'enterprise': 4
  };
  
  return multipliers[complexity] || 1.5;
};

export const estimateProjectDuration = (
  type: ProjectType,
  complexity: ProjectComplexity,
  techStack: string[]
): string => {
  const baseHours: Record<ProjectType, number> = {
    'web': 160, // 4 weeks
    'mobile': 240, // 6 weeks
    'fullstack': 320 // 8 weeks
  };
  
  const complexityMultiplier = getComplexityMultiplier(complexity);
  const techStackMultiplier = Math.min(1 + (techStack.length * 0.1), 2); // Max 2x for tech stack
  
  const totalHours = baseHours[type] * complexityMultiplier * techStackMultiplier;
  const weeks = Math.ceil(totalHours / 40); // 40 hours per week
  
  if (weeks <= 4) return `${weeks} week${weeks > 1 ? 's' : ''}`;
  if (weeks <= 12) return `${Math.ceil(weeks / 4)} month${Math.ceil(weeks / 4) > 1 ? 's' : ''}`;
  return `${Math.ceil(weeks / 12)} quarter${Math.ceil(weeks / 12) > 1 ? 's' : ''}`;
};

export const generateProjectNamespace = (
  projectName: string,
  projectType: ProjectType
): string => {
  const sanitizedName = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 20);
  
  const timestamp = Date.now().toString(36);
  return `${projectType}_${sanitizedName}_${timestamp}`;
};

export const validateProjectConfiguration = (config: ProjectConfiguration): string[] => {
  const errors: string[] = [];
  
  if (!config.requirements || config.requirements.trim().length < 10) {
    errors.push('Project requirements must be at least 10 characters long');
  }
  
  if (!config.techStack || config.techStack.length === 0) {
    errors.push('At least one technology must be specified in the tech stack');
  }
  
  if (config.deliverables && config.deliverables.length === 0) {
    errors.push('At least one deliverable should be defined');
  }
  
  if (config.evaluationCriteria && config.evaluationCriteria.length === 0) {
    errors.push('At least one evaluation criterion should be defined');
  }
  
  return errors;
};

export const calculateQualityScore = (evaluations: EvaluationCriterion[]): number => {
  if (!evaluations || evaluations.length === 0) return 0;
  
  const completedEvaluations = evaluations.filter(e => e.result);
  if (completedEvaluations.length === 0) return 0;
  
  let weightedScore = 0;
  let totalWeight = 0;
  
  for (const evaluation of completedEvaluations) {
    if (evaluation.result) {
      weightedScore += evaluation.result.score * evaluation.weight;
      totalWeight += evaluation.weight;
    }
  }
  
  return totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) / 100 : 0;
};

export const getRequiredAgentTypes = (projectType: ProjectType): string[] => {
  const baseAgents = ['ProjectManager', 'SystemArchitect', 'TaskPlanner'];
  
  switch (projectType) {
    case 'web':
      return [...baseAgents, 'CodeGenerator', 'TestEngineer', 'DeploymentEngineer'];
    case 'mobile':
      return [...baseAgents, 'CodeGenerator', 'TestEngineer', 'QAAnalyst', 'DeploymentEngineer'];
    case 'fullstack':
      return [...baseAgents, 'CodeGenerator', 'TestEngineer', 'QAAnalyst', 'DeploymentEngineer'];
    default:
      return baseAgents;
  }
};

export const getTechStackRecommendations = (projectType: ProjectType): string[] => {
  const recommendations: Record<ProjectType, string[]> = {
    'web': ['React', 'TypeScript', 'Node.js', 'Express', 'PostgreSQL', 'Tailwind CSS'],
    'mobile': ['React Native', 'TypeScript', 'Expo', 'Node.js', 'Express', 'PostgreSQL'],
    'fullstack': ['Next.js', 'TypeScript', 'Node.js', 'Express', 'PostgreSQL', 'Tailwind CSS', 'Prisma']
  };
  
  return recommendations[projectType] || [];
};

export const isProjectActive = (status: ProjectStatus): boolean => {
  const activeStatuses: ProjectStatus[] = [
    'planning', 'architecture', 'task_breakdown',
    'development', 'testing', 'integration',
    'deployment_prep', 'deployment', 'validation'
  ];
  
  return activeStatuses.includes(status);
};

export const isProjectCompleted = (status: ProjectStatus): boolean => {
  return ['completed', 'cancelled', 'failed'].includes(status);
};

export const getStatusColor = (status: ProjectStatus): string => {
  const colors: Record<ProjectStatus, string> = {
    'created': 'gray',
    'planning': 'blue',
    'architecture': 'indigo',
    'task_breakdown': 'purple',
    'development': 'green',
    'testing': 'yellow',
    'integration': 'orange',
    'deployment_prep': 'orange',
    'deployment': 'red',
    'validation': 'pink',
    'maintenance': 'teal',
    'completed': 'green',
    'paused': 'gray',
    'cancelled': 'gray',
    'failed': 'red'
  };
  
  return colors[status] || 'gray';
};
