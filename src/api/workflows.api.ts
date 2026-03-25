import { apiRequest } from './client';
import type { Workflow, WorkflowCreatePayload, WorkflowRun, WorkflowUpdatePayload } from '../types';

export async function getWorkflows(): Promise<Workflow[]> {
  return apiRequest<Workflow[]>('GET', '/workflows');
}

export async function getWorkflow(id: string): Promise<Workflow> {
  return apiRequest<Workflow>('GET', `/workflows/${id}`);
}

export async function createWorkflow(payload: WorkflowCreatePayload): Promise<Workflow> {
  return apiRequest<Workflow>('POST', '/workflows', payload);
}

export async function updateWorkflow(id: string, payload: WorkflowUpdatePayload): Promise<Workflow> {
  return apiRequest<Workflow>('PUT', `/workflows/${id}`, payload);
}

export async function deleteWorkflow(id: string): Promise<void> {
  await apiRequest('DELETE', `/workflows/${id}`);
}

export async function runWorkflow(id: string): Promise<Workflow> {
  return apiRequest<Workflow>('POST', `/workflows/${id}/run`);
}

export async function pauseWorkflow(id: string): Promise<Workflow> {
  return apiRequest<Workflow>('POST', `/workflows/${id}/pause`);
}

export async function getWorkflowRuns(id: string): Promise<WorkflowRun[]> {
  return apiRequest<WorkflowRun[]>('GET', `/workflows/${id}/runs`);
}
