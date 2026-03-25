import { useCallback, useEffect, useState } from 'react';
import { getTasks } from '../api/tasks.api';
import type { Task, TaskFilters } from '../types';

const POLLING_INTERVAL_MS = 5000;

export function useTasks(filters?: TaskFilters) {
  const [data, setData] = useState<Task[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);

    try {
      const tasks = await getTasks(filters);
      setData(tasks);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void fetchTasks();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'hidden') {
        return;
      }

      void fetchTasks();
    }, POLLING_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void fetchTasks();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchTasks]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchTasks,
  };
}
