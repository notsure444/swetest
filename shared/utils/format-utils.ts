/**
 * String and formatting utility functions.
 * 
 * Shared utilities for string manipulation, formatting,
 * and data presentation across the platform.
 */

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const camelCase = (str: string): string => {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
      index === 0 ? word.toLowerCase() : word.toUpperCase()
    )
    .replace(/\s+/g, '');
};

export const kebabCase = (str: string): string => {
  return str
    .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[\s_]/g, '-');
};

export const snakeCase = (str: string): string => {
  return str
    .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/[\s-]/g, '_');
};

export const titleCase = (str: string): string => {
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const formatNumber = (num: number, decimals = 0): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

export const formatPercentage = (value: number, total: number, decimals = 1): string => {
  if (total === 0) return '0%';
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(decimals)}%`;
};

export const formatCPU = (cpuString: string): string => {
  const cpu = parseFloat(cpuString);
  if (cpu >= 1) {
    return `${cpu} CPU${cpu > 1 ? 's' : ''}`;
  }
  return `${(cpu * 1000).toFixed(0)}m CPU`;
};

export const formatMemory = (memoryString: string): string => {
  // Handle different memory formats (MB, GB, etc.)
  const match = memoryString.match(/^(\d+(?:\.\d+)?)\s*([KMGTPE]?B?)$/i);
  if (!match) return memoryString;
  
  const [, amount, unit] = match;
  const num = parseFloat(amount);
  
  switch (unit.toUpperCase()) {
    case 'B':
    case '':
      return formatBytes(num);
    case 'KB':
      return formatBytes(num * 1024);
    case 'MB':
      return formatBytes(num * 1024 * 1024);
    case 'GB':
      return formatBytes(num * 1024 * 1024 * 1024);
    default:
      return memoryString;
  }
};

export const truncateText = (text: string, maxLength: number, suffix = '...'): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
};

export const pluralize = (count: number, singular: string, plural?: string): string => {
  const pluralForm = plural || (singular + 's');
  return count === 1 ? singular : pluralForm;
};

export const humanizeList = (items: string[], maxItems = 3): string => {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  
  if (items.length <= maxItems) {
    const lastItem = items.pop();
    return `${items.join(', ')}, and ${lastItem}`;
  }
  
  const displayed = items.slice(0, maxItems);
  const remaining = items.length - maxItems;
  return `${displayed.join(', ')}, and ${remaining} more`;
};

export const generateInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
};

export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

export const highlightText = (text: string, query: string): string => {
  if (!query || query.trim() === '') return text;
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

export const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>/g, '');
};

export const formatHash = (hash: string, length = 8): string => {
  return hash.substring(0, length);
};

export const maskSensitiveData = (text: string, visibleChars = 4): string => {
  if (text.length <= visibleChars * 2) {
    return '*'.repeat(text.length);
  }
  
  const start = text.substring(0, visibleChars);
  const end = text.substring(text.length - visibleChars);
  const middle = '*'.repeat(text.length - visibleChars * 2);
  
  return `${start}${middle}${end}`;
};

export const formatStatusBadge = (status: string): { text: string; variant: string } => {
  const statusMap: Record<string, { text: string; variant: string }> = {
    // Project statuses
    created: { text: 'Created', variant: 'secondary' },
    planning: { text: 'Planning', variant: 'info' },
    architecture: { text: 'Architecture', variant: 'info' },
    development: { text: 'Development', variant: 'primary' },
    testing: { text: 'Testing', variant: 'warning' },
    deployment: { text: 'Deployment', variant: 'warning' },
    completed: { text: 'Completed', variant: 'success' },
    failed: { text: 'Failed', variant: 'error' },
    cancelled: { text: 'Cancelled', variant: 'secondary' },
    paused: { text: 'Paused', variant: 'secondary' },
    
    // Agent statuses
    available: { text: 'Available', variant: 'success' },
    busy: { text: 'Busy', variant: 'primary' },
    working: { text: 'Working', variant: 'primary' },
    idle: { text: 'Idle', variant: 'secondary' },
    error: { text: 'Error', variant: 'error' },
    waiting: { text: 'Waiting', variant: 'warning' },
  };
  
  return statusMap[status] || { text: capitalize(status), variant: 'secondary' };
};

export const formatApiResponse = (data: any, message?: string): any => {
  return {
    success: true,
    data,
    message: message || 'Operation completed successfully',
    timestamp: Date.now()
  };
};

export const formatErrorResponse = (error: string, code?: string): any => {
  return {
    success: false,
    error,
    code,
    timestamp: Date.now()
  };
};
