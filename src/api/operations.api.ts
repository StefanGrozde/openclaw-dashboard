import { apiRequest } from './client';
import type { Operation, OperationFilters } from '../types';

function buildOperationsQuery(filters?: OperationFilters): string {
  if (!filters) {
    return '';
  }

  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function getOperations(filters?: OperationFilters): Promise<Operation[]> {
  return apiRequest<Operation[]>('GET', `/operations${buildOperationsQuery(filters)}`);
}
