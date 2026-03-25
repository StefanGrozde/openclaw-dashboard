import { useCallback, useEffect, useState } from 'react';
import { getWorkflows } from '../api/workflows.api';
import type { Workflow } from '../types';

const POLLING_INTERVAL_MS = 5000;

export function useWorkflows() {
  const [data, setData] = useState<Workflow[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflows = useCallback(async () => {
    setIsLoading(true);

    try {
      const workflows = await getWorkflows();
      setData(workflows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflows');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchWorkflows();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'hidden') {
        return;
      }

      void fetchWorkflows();
    }, POLLING_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void fetchWorkflows();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchWorkflows]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchWorkflows,
  };
}
