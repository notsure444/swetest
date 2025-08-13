/**
 * Shared utilities index file.
 * 
 * Exports all utility functions for easy importing
 * across the dashboard, agents, and Convex backend.
 */

// Date and time utilities
export * from './date-utils';

// Validation utilities
export * from './validation-utils';

// String and formatting utilities
export * from './format-utils';

// Project and agent utilities
export * from './project-utils';
export * from './agent-utils';

// System utilities
export * from './system-utils';

// Common utility functions
export const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

export const retry = async <T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await sleep(delay);
      return retry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

export const createId = (prefix?: string): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
};

export const createNamespace = (projectName: string, timestamp?: number): string => {
  const ts = timestamp || Date.now();
  const sanitized = projectName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `project_${sanitized}_${ts}`;
};

export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as T;
  if (Array.isArray(obj)) return obj.map(item => deepClone(item)) as T;
  
  const cloned = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
};

export const omit = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
};

export const pick = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};
