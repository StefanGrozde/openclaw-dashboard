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
