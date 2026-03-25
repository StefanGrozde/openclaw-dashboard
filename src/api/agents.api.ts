import { apiRequest } from './client';
import type { Agent } from '../types';

export async function getAgents(): Promise<Agent[]> {
  return apiRequest<Agent[]>('GET', '/agents');
}

export async function getAgent(id: string): Promise<Agent> {
  return apiRequest<Agent>('GET', `/agents/${id}`);
}

export async function startAgent(id: string): Promise<Agent> {
  return apiRequest<Agent>('POST', `/agents/${id}/start`);
}

export async function stopAgent(id: string): Promise<Agent> {
  return apiRequest<Agent>('POST', `/agents/${id}/stop`);
}

export async function restartAgent(id: string): Promise<Agent> {
  return apiRequest<Agent>('POST', `/agents/${id}/restart`);
}
