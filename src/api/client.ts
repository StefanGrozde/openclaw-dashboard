import type { ApiError } from '../types';

const API_BASE: string = import.meta.env.VITE_API_BASE ?? '/api';

let logoutHandler: (() => void) | null = null;

export function setLogoutHandler(fn: () => void): void {
  logoutHandler = fn;
}

async function buildApiError(response: Response): Promise<ApiError> {
  let message = 'Request failed';
  let code: string | undefined;

  try {
    const errorBody = (await response.json()) as { message?: string; code?: string };
    message = errorBody.message ?? message;
    code = errorBody.code;
  } catch {
    // Fall back to a generic message when the response body is empty or invalid JSON.
  }

  const error = new Error(message) as ApiError;
  error.status = response.status;
  error.code = code;

  return error;
}

async function sendRequest(method: string, path: string, body?: unknown): Promise<Response> {
  const headers: Record<string, string> = {
    'X-Requested-With': 'XMLHttpRequest',
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  return fetch(`${API_BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function apiRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  let response = await sendRequest(method, path, body);

  if (response.status === 401) {
    const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    if (!refreshResponse.ok) {
      logoutHandler?.();

      const error = new Error('Session expired') as ApiError;
      error.status = 401;

      throw error;
    }

    response = await sendRequest(method, path, body);
  }

  if (!response.ok) {
    throw await buildApiError(response);
  }

  return (await response.json()) as T;
}

export { API_BASE };
