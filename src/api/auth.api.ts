import { apiRequest } from './client';
import type { AuthUser } from '../types';

export async function loginRequest(username: string, password: string): Promise<{ user: AuthUser }> {
  return apiRequest<{ user: AuthUser }>('POST', '/auth/login', { username, password });
}

export async function refreshRequest(): Promise<void> {
  await apiRequest('POST', '/auth/refresh');
}

export async function logoutRequest(): Promise<void> {
  await apiRequest('POST', '/auth/logout');
}

export async function getMeRequest(): Promise<AuthUser> {
  return apiRequest<AuthUser>('GET', '/auth/me');
}
