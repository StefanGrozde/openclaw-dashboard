import { useCallback, useEffect, useState } from 'react';
import { getAgents } from '../api/agents.api';
import type { Agent } from '../types';

const POLLING_INTERVAL_MS = 5000;

export function useAgents() {
  const [data, setData] = useState<Agent[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    setIsLoading(true);

    try {
      const agents = await getAgents();
      setData(agents);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agents');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAgents();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'hidden') {
        return;
      }

      void fetchAgents();
    }, POLLING_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void fetchAgents();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchAgents]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchAgents,
  };
}
