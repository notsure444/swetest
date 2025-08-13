/**
 * Validation utility functions.
 * 
 * Shared validation utilities for data integrity across
 * the platform, ensuring consistent validation logic.
 */

import type { 
  ProjectType, 
  ProjectStatus, 
  AgentType, 
  AgentStatus,
  ValidationResult,
  ValidationError,
  ValidationWarning
} from '../types';

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isValidNamespace = (namespace: string): boolean => {
  // Namespace should be lowercase alphanumeric with underscores
  const namespaceRegex = /^[a-z0-9_]+$/;
  return namespaceRegex.test(namespace) && namespace.length >= 3 && namespace.length <= 50;
};

export const isValidProjectName = (name: string): boolean => {
  return name.length >= 2 && name.length <= 100 && /^[a-zA-Z0-9\s\-_.]+$/.test(name);
};

export const isValidAgentId = (agentId: string): boolean => {
  return agentId.length >= 5 && agentId.length <= 50 && /^[a-zA-Z0-9_-]+$/.test(agentId);
};

export const isValidProjectType = (type: string): type is ProjectType => {
  return ['web', 'mobile', 'fullstack'].includes(type);
};

export const isValidProjectStatus = (status: string): status is ProjectStatus => {
  const validStatuses = [
    'created', 'planning', 'architecture', 'task_breakdown',
    'development', 'testing', 'integration', 'deployment_prep',
    'deployment', 'validation', 'maintenance', 'completed',
    'paused', 'cancelled', 'failed'
  ];
  return validStatuses.includes(status);
};

export const isValidAgentType = (type: string): type is AgentType => {
  const validTypes = [
    'ProjectManager', 'SystemArchitect', 'TaskPlanner',
    'CodeGenerator', 'TestEngineer', 'QAAnalyst', 'DeploymentEngineer'
  ];
  return validTypes.includes(type);
};

export const isValidAgentStatus = (status: string): status is AgentStatus => {
  const validStatuses = [
    'available', 'reserved', 'busy', 'idle',
    'working', 'waiting', 'error', 'completed'
  ];
  return validStatuses.includes(status);
};

export const validateProjectConfiguration = (config: any): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!config.name || typeof config.name !== 'string') {
    errors.push({
      field: 'name',
      message: 'Project name is required and must be a string',
      code: 'REQUIRED_FIELD',
      value: config.name
    });
  } else if (!isValidProjectName(config.name)) {
    errors.push({
      field: 'name',
      message: 'Project name must be 2-100 characters and contain only letters, numbers, spaces, and basic punctuation',
      code: 'INVALID_FORMAT',
      value: config.name
    });
  }

  if (!config.description || typeof config.description !== 'string') {
    errors.push({
      field: 'description',
      message: 'Project description is required and must be a string',
      code: 'REQUIRED_FIELD',
      value: config.description
    });
  } else if (config.description.length < 10) {
    warnings.push({
      field: 'description',
      message: 'Project description is quite short',
      suggestion: 'Consider providing more detailed project requirements'
    });
  }

  if (!config.type || !isValidProjectType(config.type)) {
    errors.push({
      field: 'type',
      message: 'Project type must be one of: web, mobile, fullstack',
      code: 'INVALID_VALUE',
      value: config.type
    });
  }

  if (config.configuration) {
    if (!Array.isArray(config.configuration.techStack)) {
      errors.push({
        field: 'configuration.techStack',
        message: 'Tech stack must be an array of strings',
        code: 'INVALID_TYPE',
        value: config.configuration.techStack
      });
    } else if (config.configuration.techStack.length === 0) {
      warnings.push({
        field: 'configuration.techStack',
        message: 'No tech stack specified',
        suggestion: 'Consider specifying the technologies to be used'
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

export const validateAgentConfiguration = (config: any): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!config.type || !isValidAgentType(config.type)) {
    errors.push({
      field: 'type',
      message: 'Agent type must be a valid agent type',
      code: 'INVALID_VALUE',
      value: config.type
    });
  }

  if (!config.model || typeof config.model !== 'string') {
    errors.push({
      field: 'model',
      message: 'Agent model is required and must be a string',
      code: 'REQUIRED_FIELD',
      value: config.model
    });
  }

  if (!config.prompt || typeof config.prompt !== 'string') {
    errors.push({
      field: 'prompt',
      message: 'Agent prompt is required and must be a string',
      code: 'REQUIRED_FIELD',
      value: config.prompt
    });
  } else if (config.prompt.length < 50) {
    warnings.push({
      field: 'prompt',
      message: 'Agent prompt is quite short',
      suggestion: 'Consider providing more detailed instructions for the agent'
    });
  }

  if (!Array.isArray(config.tools)) {
    errors.push({
      field: 'tools',
      message: 'Agent tools must be an array of strings',
      code: 'INVALID_TYPE',
      value: config.tools
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

export const validateResourceLimits = (limits: any): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (limits.memory && typeof limits.memory !== 'string') {
    errors.push({
      field: 'memory',
      message: 'Memory limit must be a string (e.g., "1G", "512MB")',
      code: 'INVALID_TYPE',
      value: limits.memory
    });
  }

  if (limits.cpus && typeof limits.cpus !== 'string') {
    errors.push({
      field: 'cpus',
      message: 'CPU limit must be a string (e.g., "1.0", "0.5")',
      code: 'INVALID_TYPE',
      value: limits.cpus
    });
  }

  if (limits.storage && typeof limits.storage !== 'string') {
    errors.push({
      field: 'storage',
      message: 'Storage limit must be a string (e.g., "5G", "1TB")',
      code: 'INVALID_TYPE',
      value: limits.storage
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

export const sanitizeInput = (input: string, maxLength: number = 1000): string => {
  return input
    .trim()
    .substring(0, maxLength)
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255);
};

export const validateEnvironmentVariables = (env: Record<string, any>): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check for required environment variables
  const requiredVars = [
    'NODE_ENV',
    'PROJECT_ID',
    'PROJECT_NAMESPACE'
  ];

  for (const varName of requiredVars) {
    if (!env[varName]) {
      errors.push({
        field: varName,
        message: `Required environment variable ${varName} is missing`,
        code: 'MISSING_REQUIRED_VAR',
        value: env[varName]
      });
    }
  }

  // Check for sensitive information in non-production environments
  if (env.NODE_ENV !== 'production') {
    if (env.API_KEY || env.SECRET_KEY) {
      warnings.push({
        field: 'security',
        message: 'API keys detected in non-production environment',
        suggestion: 'Consider using development/testing API keys'
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};
