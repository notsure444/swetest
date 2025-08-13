/**
 * System-level utility functions.
 * 
 * Utilities for system monitoring, resource management, and infrastructure
 * operations shared across the entire platform.
 */

import type { 
  ContainerStatus,
  SystemMetrics,
  ResourceLimits,
  LogLevel,
  Environment
} from '../types';

export const parseResourceLimit = (limit: string): number => {
  const match = limit.match(/^(\d+(?:\.\d+)?)\s*([KMGTPE]?B?)$/i);
  if (!match) return 0;
  
  const [, amount, unit] = match;
  const num = parseFloat(amount);
  
  switch (unit.toUpperCase()) {
    case 'B':
    case '':
      return num;
    case 'KB':
      return num * 1024;
    case 'MB':
      return num * 1024 * 1024;
    case 'GB':
      return num * 1024 * 1024 * 1024;
    case 'TB':
      return num * 1024 * 1024 * 1024 * 1024;
    case 'PB':
      return num * 1024 * 1024 * 1024 * 1024 * 1024;
    default:
      return 0;
  }
};

export const formatResourceLimit = (bytes: number, unit?: string): string => {
  if (unit) {
    switch (unit.toUpperCase()) {
      case 'KB':
        return `${Math.round(bytes / 1024)}KB`;
      case 'MB':
        return `${Math.round(bytes / (1024 * 1024))}MB`;
      case 'GB':
        return `${Math.round(bytes / (1024 * 1024 * 1024))}GB`;
      case 'TB':
        return `${Math.round(bytes / (1024 * 1024 * 1024 * 1024))}TB`;
      default:
        return `${bytes}B`;
    }
  }
  
  // Auto-select appropriate unit
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))}MB`;
  if (bytes < 1024 * 1024 * 1024 * 1024) return `${Math.round(bytes / (1024 * 1024 * 1024))}GB`;
  return `${Math.round(bytes / (1024 * 1024 * 1024 * 1024))}TB`;
};

export const parseCpuLimit = (cpuString: string): number => {
  if (cpuString.endsWith('m')) {
    // Millicpu format (e.g., "500m" = 0.5 CPU)
    return parseInt(cpuString.slice(0, -1)) / 1000;
  }
  return parseFloat(cpuString);
};

export const formatCpuLimit = (cpu: number, format: 'decimal' | 'millicpu' = 'decimal'): string => {
  if (format === 'millicpu') {
    return `${Math.round(cpu * 1000)}m`;
  }
  return cpu.toString();
};

export const calculateResourceUsage = (used: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((used / total) * 100);
};

export const isResourceUsageHigh = (usagePercentage: number, threshold = 80): boolean => {
  return usagePercentage >= threshold;
};

export const isResourceUsageCritical = (usagePercentage: number, threshold = 95): boolean => {
  return usagePercentage >= threshold;
};

export const getContainerHealthStatus = (status: ContainerStatus): 'healthy' | 'warning' | 'critical' => {
  const statusMap: Record<ContainerStatus, 'healthy' | 'warning' | 'critical'> = {
    'running': 'healthy',
    'healthy': 'healthy',
    'starting': 'warning',
    'restarting': 'warning',
    'paused': 'warning',
    'stopped': 'critical',
    'stopping': 'warning',
    'dead': 'critical',
    'unhealthy': 'critical'
  };
  
  return statusMap[status] || 'warning';
};

export const generateContainerName = (
  projectNamespace: string,
  containerType: string,
  suffix?: string
): string => {
  const baseName = `${projectNamespace}_${containerType}`;
  return suffix ? `${baseName}_${suffix}` : baseName;
};

export const validateResourceLimits = (limits: ResourceLimits): string[] => {
  const errors: string[] = [];
  
  if (limits.memory) {
    const memoryBytes = parseResourceLimit(limits.memory);
    if (memoryBytes === 0) {
      errors.push('Invalid memory limit format');
    } else if (memoryBytes < 128 * 1024 * 1024) { // Minimum 128MB
      errors.push('Memory limit must be at least 128MB');
    }
  }
  
  if (limits.cpus) {
    const cpuValue = parseCpuLimit(limits.cpus);
    if (cpuValue <= 0) {
      errors.push('CPU limit must be greater than 0');
    } else if (cpuValue > 32) { // Reasonable upper limit
      errors.push('CPU limit seems excessively high (>32 CPUs)');
    }
  }
  
  if (limits.storage) {
    const storageBytes = parseResourceLimit(limits.storage);
    if (storageBytes === 0) {
      errors.push('Invalid storage limit format');
    } else if (storageBytes < 100 * 1024 * 1024) { // Minimum 100MB
      errors.push('Storage limit must be at least 100MB');
    }
  }
  
  return errors;
};

export const calculateSystemLoad = (metrics: SystemMetrics): 'low' | 'medium' | 'high' | 'critical' => {
  const cpuUsage = (metrics.resourceUsage.usedCPU / metrics.resourceUsage.totalCPU) * 100;
  const memoryUsage = (metrics.resourceUsage.usedMemory / metrics.resourceUsage.totalMemory) * 100;
  const storageUsage = (metrics.resourceUsage.usedStorage / metrics.resourceUsage.totalStorage) * 100;
  
  const maxUsage = Math.max(cpuUsage, memoryUsage, storageUsage);
  
  if (maxUsage >= 95) return 'critical';
  if (maxUsage >= 80) return 'high';
  if (maxUsage >= 60) return 'medium';
  return 'low';
};

export const getLogLevelSeverity = (level: LogLevel): number => {
  const severityMap: Record<LogLevel, number> = {
    'debug': 0,
    'info': 1,
    'warn': 2,
    'error': 3,
    'fatal': 4
  };
  
  return severityMap[level] || 1;
};

export const shouldLogAtLevel = (messageLevel: LogLevel, configuredLevel: LogLevel): boolean => {
  return getLogLevelSeverity(messageLevel) >= getLogLevelSeverity(configuredLevel);
};

export const generateLogId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `log_${timestamp}_${random}`;
};

export const sanitizeLogMessage = (message: string): string => {
  // Remove sensitive information patterns
  return message
    .replace(/password[=:]\s*[^\s]+/gi, 'password=***')
    .replace(/token[=:]\s*[^\s]+/gi, 'token=***')
    .replace(/api[_-]?key[=:]\s*[^\s]+/gi, 'api_key=***')
    .replace(/secret[=:]\s*[^\s]+/gi, 'secret=***')
    .substring(0, 10000); // Limit message length
};

export const createHealthCheck = (
  endpoint: string,
  expectedStatus = 200,
  timeout = 5000
): Promise<boolean> => {
  return new Promise((resolve) => {
    // This would implement actual health check logic
    // For now, return a mock result
    setTimeout(() => {
      resolve(Math.random() > 0.1); // 90% success rate for demo
    }, Math.min(timeout, 1000));
  });
};

export const calculateUptime = (startTime: number): string => {
  const now = Date.now();
  const uptimeMs = now - startTime;
  
  const seconds = Math.floor(uptimeMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

export const isProductionEnvironment = (env: Environment): boolean => {
  return env === 'production';
};

export const isDevelopmentEnvironment = (env: Environment): boolean => {
  return env === 'development';
};

export const getEnvironmentColor = (env: Environment): string => {
  const colors: Record<Environment, string> = {
    'development': 'blue',
    'testing': 'yellow',
    'staging': 'orange',
    'production': 'red'
  };
  
  return colors[env] || 'gray';
};

export const generateSystemId = (type: string): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 12);
  return `${type}_${timestamp}_${random}`;
};

export const validatePortRange = (port: number): boolean => {
  return port >= 1024 && port <= 65535; // Avoid system ports
};

export const findAvailablePort = async (startPort: number, endPort: number): Promise<number | null> => {
  // This would implement actual port availability checking
  // For now, return a mock available port
  return startPort + Math.floor(Math.random() * (endPort - startPort));
};

export const normalizeUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    return parsed.toString();
  } catch {
    return url;
  }
};

export const isValidDockerImage = (imageName: string): boolean => {
  // Docker image name validation
  const imageRegex = /^[a-z0-9]+((\.|_|__|-+)[a-z0-9]+)*(\/[a-z0-9]+((\.|_|__|-+)[a-z0-9]+)*)*(:[\w][\w.-]{0,127})?$/;
  return imageRegex.test(imageName);
};
