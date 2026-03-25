import { useCallback, useEffect, useState } from 'react';
import { getOperations } from '../api/operations.api';
import type { Operation, OperationFilters } from '../types';

const POLLING_INTERVAL_MS = 5000;

export function useOperations(filters?: OperationFilters) {
  const [data, setData] = useState<Operation[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOperations = useCallback(async () => {
    setIsLoading(true);

    try {
      const operations = await getOperations(filters);
      setData(operations);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load operations');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void fetchOperations();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'hidden') {
        return;
      }

      void fetchOperations();
    }, POLLING_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void fetchOperations();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchOperations]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchOperations,
  };
}
