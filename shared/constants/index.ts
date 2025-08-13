/**
 * Shared constants and configuration values.
 * 
 * Central location for constants used across the entire platform
 * to ensure consistency and easy maintenance.
 */

// Project configuration constants
export const PROJECT_TYPES = ['web', 'mobile', 'fullstack'] as const;

export const PROJECT_STATUSES = [
  'created', 'planning', 'architecture', 'task_breakdown',
  'development', 'testing', 'integration', 'deployment_prep',
  'deployment', 'validation', 'maintenance', 'completed',
  'paused', 'cancelled', 'failed'
] as const;

export const PROJECT_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

export const PROJECT_COMPLEXITIES = ['simple', 'moderate', 'complex', 'enterprise'] as const;

// Agent configuration constants
export const AGENT_TYPES = [
  'ProjectManager', 'SystemArchitect', 'TaskPlanner',
  'CodeGenerator', 'TestEngineer', 'QAAnalyst', 'DeploymentEngineer'
] as const;

export const AGENT_STATUSES = [
  'available', 'reserved', 'busy', 'idle',
  'working', 'waiting', 'error', 'completed'
] as const;

export const TASK_TYPES = [
  'architecture_design', 'task_planning', 'code_generation',
  'code_review', 'testing', 'deployment', 'documentation',
  'quality_assurance', 'project_management'
] as const;

export const TASK_STATUSES = [
  'pending', 'assigned', 'in_progress', 'review',
  'completed', 'failed', 'cancelled', 'blocked'
] as const;

// System configuration constants
export const CONTAINER_TYPES = ['development', 'testing', 'deployment', 'database'] as const;

export const CONTAINER_STATUSES = [
  'running', 'stopped', 'starting', 'stopping',
  'paused', 'restarting', 'dead', 'healthy', 'unhealthy'
] as const;

export const LOG_LEVELS = ['debug', 'info', 'warn', 'error', 'fatal'] as const;

export const ENVIRONMENTS = ['development', 'testing', 'staging', 'production'] as const;

// Resource limit defaults
export const DEFAULT_RESOURCE_LIMITS = {
  memory: '1G',
  cpus: '1.0',
  storage: '5G'
} as const;

export const MINIMUM_RESOURCE_LIMITS = {
  memory: '128MB',
  cpus: '0.1',
  storage: '100MB'
} as const;

export const MAXIMUM_RESOURCE_LIMITS = {
  memory: '32G',
  cpus: '16.0',
  storage: '1TB'
} as const;

// Network and port configuration
export const PORT_RANGES = {
  development: { start: 4000, end: 4999 },
  testing: { start: 5000, end: 5999 },
  deployment: { start: 6000, end: 6999 },
  system: { start: 3000, end: 3999 }
} as const;

// API and service configuration
export const API_RATE_LIMITS = {
  default: 100,
  authenticated: 1000,
  premium: 10000
} as const;

export const LLM_MODELS = {
  gpt: 'gpt-5',
  claude: 'claude-4.1'
} as const;

export const LLM_RATE_LIMITS = {
  gpt: 60, // requests per minute
  claude: 50
} as const;

// File and directory constants
export const RESERVED_FILENAMES = [
  'package.json', 'tsconfig.json', 'Dockerfile',
  '.env', '.env.local', '.env.production',
  'docker-compose.yml', 'README.md'
] as const;

export const SUPPORTED_FILE_EXTENSIONS = [
  '.js', '.ts', '.jsx', '.tsx', '.json', '.md',
  '.yml', '.yaml', '.env', '.txt', '.css', '.scss'
] as const;

// Validation constants
export const VALIDATION_RULES = {
  projectName: {
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-_.]+$/
  },
  namespace: {
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-z0-9_]+$/
  },
  agentId: {
    minLength: 5,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_-]+$/
  },
  description: {
    minLength: 10,
    maxLength: 5000
  }
} as const;

// Time constants (in milliseconds)
export const TIME_CONSTANTS = {
  second: 1000,
  minute: 60 * 1000,
  hour: 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000
} as const;

// Cache configuration
export const CACHE_DURATIONS = {
  short: 5 * TIME_CONSTANTS.minute,
  medium: 30 * TIME_CONSTANTS.minute,
  long: 2 * TIME_CONSTANTS.hour,
  persistent: 24 * TIME_CONSTANTS.hour
} as const;

// Health check intervals
export const HEALTH_CHECK_INTERVALS = {
  container: 30 * TIME_CONSTANTS.second,
  agent: 60 * TIME_CONSTANTS.second,
  system: 2 * TIME_CONSTANTS.minute,
  external_service: 5 * TIME_CONSTANTS.minute
} as const;

// Monitoring thresholds
export const MONITORING_THRESHOLDS = {
  cpu: {
    warning: 70,
    critical: 90
  },
  memory: {
    warning: 80,
    critical: 95
  },
  storage: {
    warning: 85,
    critical: 95
  },
  response_time: {
    warning: 1000, // 1 second
    critical: 5000  // 5 seconds
  },
  error_rate: {
    warning: 0.05, // 5%
    critical: 0.1   // 10%
  }
} as const;

// Security constants
export const SECURITY_SETTINGS = {
  sessionTimeout: 24 * TIME_CONSTANTS.hour,
  tokenExpiry: 7 * TIME_CONSTANTS.day,
  maxLoginAttempts: 5,
  lockoutDuration: 15 * TIME_CONSTANTS.minute,
  passwordMinLength: 8,
  apiKeyLength: 32
} as const;

// Feature flags (default values)
export const DEFAULT_FEATURE_FLAGS = {
  multiProjectSupport: true,
  containerIsolation: true,
  realTimeMonitoring: true,
  advancedSecurity: true,
  performanceOptimization: false,
  experimentalFeatures: false
} as const;

// Quality gates
export const QUALITY_GATES = {
  codeQuality: {
    minimum: 7.0,
    target: 8.5
  },
  testCoverage: {
    minimum: 70,
    target: 85
  },
  performance: {
    loadTime: 2000, // 2 seconds
    lighthouse: 85
  },
  security: {
    vulnerabilities: 0,
    dependencyCheck: true
  }
} as const;

// URL patterns and endpoints
export const URL_PATTERNS = {
  project: /^\/projects\/([a-zA-Z0-9_-]+)$/,
  agent: /^\/agents\/([a-zA-Z0-9_-]+)$/,
  api: /^\/api\/v\d+\//
} as const;

// Error codes
export const ERROR_CODES = {
  // Authentication errors
  AUTH_REQUIRED: 'AUTH_001',
  INVALID_CREDENTIALS: 'AUTH_002',
  TOKEN_EXPIRED: 'AUTH_003',
  
  // Validation errors
  VALIDATION_FAILED: 'VAL_001',
  REQUIRED_FIELD: 'VAL_002',
  INVALID_FORMAT: 'VAL_003',
  
  // Resource errors
  RESOURCE_NOT_FOUND: 'RES_001',
  RESOURCE_CONFLICT: 'RES_002',
  RESOURCE_LIMIT_EXCEEDED: 'RES_003',
  
  // System errors
  INTERNAL_ERROR: 'SYS_001',
  SERVICE_UNAVAILABLE: 'SYS_002',
  TIMEOUT: 'SYS_003'
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  PROJECT_CREATED: 'Project created successfully',
  AGENT_ASSIGNED: 'Agent assigned to project',
  TASK_COMPLETED: 'Task completed successfully',
  DEPLOYMENT_SUCCESS: 'Deployment completed successfully'
} as const;
