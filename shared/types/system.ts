/**
 * Shared system-level type definitions.
 * 
 * These types define system infrastructure, monitoring, and management
 * structures shared across the entire platform.
 */

// Container and isolation types
export interface ContainerConfiguration {
  projectId: string;
  containerType: ContainerType;
  imageName: string;
  ports: number[];
  environmentVariables: Record<string, string>;
  volumes: VolumeMount[];
  resourceLimits: ResourceLimits;
  securityProfile: SecurityProfile;
  networkConfiguration: NetworkConfiguration;
  isolationLevel: IsolationLevel;
}

export type ContainerType = "development" | "testing" | "deployment" | "database";

export type IsolationLevel = "minimal" | "standard" | "high" | "maximum";

export interface VolumeMount {
  source: string;
  target: string;
  type: "bind" | "volume" | "tmpfs";
  readOnly?: boolean;
}

export interface ResourceLimits {
  memory: string; // e.g., "1G", "512MB"
  cpus: string;   // e.g., "1.0", "0.5"
  storage: string; // e.g., "5G", "1TB"
  networkBandwidth?: string;
}

export interface SecurityProfile {
  runAsUser: string;
  runAsGroup: string;
  readOnlyRootFS: boolean;
  allowPrivilegeEscalation: boolean;
  capabilities: SecurityCapability[];
  seccompProfile?: string;
  apparmorProfile?: string;
}

export interface SecurityCapability {
  name: string;
  action: "add" | "drop";
}

export interface NetworkConfiguration {
  networks: string[];
  exposedPorts: PortMapping[];
  isolation: boolean;
  bandwidth?: BandwidthLimits;
}

export interface PortMapping {
  containerPort: number;
  hostPort?: number;
  protocol: "tcp" | "udp";
}

export interface BandwidthLimits {
  ingress?: string;
  egress?: string;
}

// System monitoring and health
export interface SystemMetrics {
  timestamp: number;
  containerMetrics: ContainerMetrics[];
  resourceUsage: SystemResourceUsage;
  networkStats: NetworkStats;
  applicationMetrics: ApplicationMetrics;
}

export interface ContainerMetrics {
  containerId: string;
  containerName: string;
  projectId: string;
  status: ContainerStatus;
  cpuUsage: number;
  memoryUsage: number;
  memoryLimit: number;
  storageUsage: number;
  storageLimit: number;
  networkIO: NetworkIO;
  diskIO: DiskIO;
  uptime: number;
}

export type ContainerStatus = 
  | "running"
  | "stopped" 
  | "starting"
  | "stopping"
  | "paused"
  | "restarting"
  | "dead"
  | "healthy"
  | "unhealthy";

export interface SystemResourceUsage {
  totalMemory: number;
  usedMemory: number;
  totalCPU: number;
  usedCPU: number;
  totalStorage: number;
  usedStorage: number;
  activeContainers: number;
  totalContainers: number;
}

export interface NetworkIO {
  bytesReceived: number;
  bytesSent: number;
  packetsReceived: number;
  packetsSent: number;
}

export interface DiskIO {
  bytesRead: number;
  bytesWritten: number;
  readsCompleted: number;
  writesCompleted: number;
}

export interface NetworkStats {
  totalBandwidth: number;
  usedBandwidth: number;
  activeConnections: number;
  failedConnections: number;
  latency: LatencyStats;
}

export interface LatencyStats {
  average: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
}

export interface ApplicationMetrics {
  activeSessions: number;
  requestsPerSecond: number;
  errorRate: number;
  responseTime: LatencyStats;
  cacheHitRate: number;
  databaseConnections: number;
  queueDepth: number;
}

// Logging and audit types
export interface SystemLog {
  id: string;
  timestamp: number;
  level: LogLevel;
  source: LogSource;
  projectId?: string;
  agentId?: string;
  containerId?: string;
  category: LogCategory;
  message: string;
  metadata?: Record<string, any>;
  tags: string[];
}

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export type LogSource = 
  | "system"
  | "agent"
  | "container"
  | "network"
  | "database"
  | "api"
  | "workflow"
  | "security";

export type LogCategory = 
  | "performance"
  | "security"
  | "error"
  | "audit"
  | "debug"
  | "monitoring"
  | "deployment"
  | "user_action";

export interface AuditEvent {
  id: string;
  timestamp: number;
  userId?: string;
  agentId?: string;
  projectId?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  outcome: "success" | "failure" | "partial";
}

export type AuditAction = 
  | "create"
  | "read"
  | "update"
  | "delete"
  | "execute"
  | "deploy"
  | "access"
  | "configure"
  | "authenticate"
  | "authorize";

// Configuration and settings
export interface SystemConfiguration {
  version: string;
  environment: Environment;
  features: FeatureFlags;
  limits: SystemLimits;
  security: SystemSecurity;
  integration: IntegrationSettings;
  monitoring: MonitoringSettings;
}

export type Environment = "development" | "staging" | "production" | "testing";

export interface FeatureFlags {
  multiProjectSupport: boolean;
  containerIsolation: boolean;
  realTimeMonitoring: boolean;
  advancedSecurity: boolean;
  performanceOptimization: boolean;
  experimentalFeatures: boolean;
}

export interface SystemLimits {
  maxConcurrentProjects: number;
  maxAgentsPerProject: number;
  maxContainersPerProject: number;
  maxResourcesPerContainer: ResourceLimits;
  maxStoragePerProject: string;
  maxNetworkBandwidth: string;
  apiRateLimit: number;
}

export interface SystemSecurity {
  encryptionEnabled: boolean;
  tlsRequired: boolean;
  authenticationRequired: boolean;
  auditLoggingEnabled: boolean;
  containerScanningEnabled: boolean;
  networkPolicyEnabled: boolean;
  secretsManagementEnabled: boolean;
}

export interface IntegrationSettings {
  convexEndpoint: string;
  databaseConfig: DatabaseConfig;
  externalServices: ExternalServiceConfig[];
  webhookEndpoints: WebhookConfig[];
}

export interface DatabaseConfig {
  type: "postgresql" | "mongodb" | "redis";
  host: string;
  port: number;
  database: string;
  ssl: boolean;
  poolSize: number;
}

export interface ExternalServiceConfig {
  name: string;
  type: "llm" | "storage" | "monitoring" | "notification";
  endpoint: string;
  authentication: AuthenticationConfig;
  rateLimits: RateLimitConfig;
}

export interface AuthenticationConfig {
  type: "api_key" | "oauth" | "jwt" | "basic";
  credentials: Record<string, string>;
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstLimit: number;
}

export interface WebhookConfig {
  name: string;
  url: string;
  events: string[];
  secret?: string;
  timeout: number;
  retryCount: number;
}

export interface MonitoringSettings {
  metricsCollection: boolean;
  metricsRetention: string;
  alerting: AlertingConfig;
  dashboards: DashboardConfig[];
}

export interface AlertingConfig {
  enabled: boolean;
  channels: AlertChannel[];
  rules: AlertRule[];
}

export interface AlertChannel {
  name: string;
  type: "email" | "slack" | "webhook" | "sms";
  configuration: Record<string, string>;
}

export interface AlertRule {
  name: string;
  condition: string;
  threshold: number;
  duration: string;
  severity: "info" | "warning" | "critical";
  channels: string[];
}

export interface DashboardConfig {
  name: string;
  panels: DashboardPanel[];
  refreshInterval: number;
  autoRefresh: boolean;
}

export interface DashboardPanel {
  title: string;
  type: "graph" | "table" | "stat" | "gauge";
  query: string;
  timeRange: string;
}
