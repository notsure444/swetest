/**
 * Shared types index file.
 * 
 * Exports all shared type definitions for easy importing
 * across the dashboard, agents, and Convex backend.
 */

// Project types
export * from './project';

// Agent types  
export * from './agent';

// System types
export * from './system';

// Common utility types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: number;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  error?: string;
  timestamp: number;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, any>;
  timestamp: number;
}

// Common filter and query types
export interface FilterOptions {
  search?: string;
  status?: string[];
  type?: string[];
  priority?: string[];
  dateRange?: DateRange;
  tags?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DateRange {
  start: number;
  end: number;
}

export interface QueryOptions extends FilterOptions {
  page?: number;
  limit?: number;
  includeDeleted?: boolean;
}

// Real-time update types
export interface RealtimeUpdate<T = any> {
  type: 'create' | 'update' | 'delete';
  resource: string;
  resourceId: string;
  data: T;
  timestamp: number;
  userId?: string;
  agentId?: string;
}

// Notification types
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: NotificationCategory;
  read: boolean;
  projectId?: string;
  agentId?: string;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: number;
  expiresAt?: number;
}

export type NotificationType = 
  | 'info'
  | 'success' 
  | 'warning'
  | 'error'
  | 'system';

export type NotificationCategory = 
  | 'project_update'
  | 'agent_status'
  | 'system_health'
  | 'deployment'
  | 'security'
  | 'performance';

// Configuration validation types
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

// Dashboard and UI types
export interface DashboardState {
  projects: any[];
  agents: any[];
  systemHealth: any;
  notifications: Notification[];
  filters: FilterOptions;
  selectedProject?: string;
  selectedAgent?: string;
}

export interface UIPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  refreshInterval: number;
  compactMode: boolean;
  showNotifications: boolean;
  showSystemInfo: boolean;
}

// Event and webhook types
export interface WebhookEvent {
  id: string;
  event: string;
  timestamp: number;
  data: any;
  projectId?: string;
  agentId?: string;
  version: string;
}

export interface EventSubscription {
  id: string;
  events: string[];
  endpoint: string;
  secret?: string;
  active: boolean;
  filters?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}
