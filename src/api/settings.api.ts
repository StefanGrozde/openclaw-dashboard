import { apiRequest } from './client';
import type { SystemSettings } from '../types';

export async function getSettings(): Promise<SystemSettings> {
  return apiRequest<SystemSettings>('GET', '/settings');
}

export async function updateSettings(partial: Partial<SystemSettings>): Promise<SystemSettings> {
  return apiRequest<SystemSettings>('PUT', '/settings', partial);
}
