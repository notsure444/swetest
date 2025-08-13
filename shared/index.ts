/**
 * Shared utilities and types main export file.
 * 
 * Central export point for all shared components, types, utilities,
 * and constants used across the AI agent platform.
 */

// Type definitions
export * from './types';

// Utility functions
export * from './utils';

// Constants and configuration
export * from './constants';

// Re-export commonly used items for convenience
export type {
  ProjectType,
  ProjectStatus,
  AgentType,
  AgentStatus,
  ApiResponse,
  ValidationResult
} from './types';

export {
  formatDate,
  formatRelativeTime,
  createId,
  createNamespace,
  validateProjectConfiguration,
  PROJECT_TYPES,
  AGENT_TYPES,
  DEFAULT_RESOURCE_LIMITS
} from './utils';

export {
  PROJECT_STATUSES,
  AGENT_STATUSES,
  ERROR_CODES,
  SUCCESS_MESSAGES
} from './constants';
