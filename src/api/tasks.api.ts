import { apiRequest } from './client';
import type { Task, TaskFilters } from '../types';

function buildTaskQuery(filters?: TaskFilters): string {
  if (!filters) {
    return '';
  }

  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      params.set(key, value);
    }
  });

  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function getTasks(filters?: TaskFilters): Promise<Task[]> {
  return apiRequest<Task[]>('GET', `/tasks${buildTaskQuery(filters)}`);
}

export async function getTask(id: string): Promise<Task> {
  return apiRequest<Task>('GET', `/tasks/${id}`);
}

export async function cancelTask(id: string): Promise<Task> {
  return apiRequest<Task>('POST', `/tasks/${id}/cancel`);
}
