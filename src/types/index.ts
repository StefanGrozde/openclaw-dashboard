export type AgentStatus = 'active' | 'idle' | 'error' | 'offline';
export type TaskStatus = 'running' | 'queued' | 'completed' | 'failed' | 'paused';
export type WorkflowStatus = 'active' | 'inactive' | 'draft';
export type LogLevel = 'info' | 'warning' | 'error' | 'success';
export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface Agent {
  id: string;
  name: string;
  type: string;
  status: AgentStatus;
  description: string;
  tasksCompleted: number;
  tasksRunning: number;
  lastActive: string;
  model: string;
  tags: string[];
}

export interface Task {
  id: string;
  title: string;
  agentId: string;
  agentName: string;
  status: TaskStatus;
  progress: number;
  createdAt: string;
  updatedAt: string;
  priority: Priority;
  description: string;
  workflowId?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  agents: string[];
  tasksTotal: number;
  tasksCompleted: number;
  createdAt: string;
  updatedAt: string;
  trigger: string;
}

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  modified: string;
  children?: FileNode[];
  path: string;
}

export interface Operation {
  id: string;
  timestamp: string;
  level: LogLevel;
  source: string;
  message: string;
  details?: string;
}

export interface AuthUser {
  id: string;
  username: string;
  role: 'admin';
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType {
  authState: AuthState;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export interface ApiError extends Error {
  status: number;
  message: string;
  code?: string;
}

export interface SystemSettings {
  systemName: string;
  defaultModel: string;
  maxConcurrentTasks: number;
  taskTimeoutSeconds: number;
  logRetentionDays: number;
  outputStoragePath: string;
  autoPurgeCompleted: boolean;
  requireAuth: boolean;
  auditLogging: boolean;
  sandboxExecution: boolean;
  agentPollingInterval: number;
  maxTokensPerTask: number;
  emailAlertsEnabled: boolean;
  slackWebhookEnabled: boolean;
  alertOnTaskFailure: boolean;
  alertOnAgentOffline: boolean;
}

export interface WorkflowStep {
  id: string;
  agentId: string;
  label: string;
  config: Record<string, unknown>;
  dependsOn: string[];
}

export interface WorkflowCreatePayload {
  name: string;
  description: string;
  trigger: string;
  steps: WorkflowStep[];
}

export type WorkflowUpdatePayload = Partial<WorkflowCreatePayload>;

export interface WorkflowRun {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  triggeredBy: string;
}

export interface TaskFilters {
  status?: TaskStatus;
  agentId?: string;
  workflowId?: string;
}

export interface OperationFilters {
  level?: LogLevel;
  limit?: number;
  offset?: number;
}

export type WsEventType = 'operation' | 'agent_status' | 'task_progress';

export type WsEvent =
  | { type: 'operation'; data: Operation }
  | { type: 'agent_status'; data: { id: string; status: AgentStatus } }
  | { type: 'task_progress'; data: { id: string; progress: number; status: TaskStatus } };
