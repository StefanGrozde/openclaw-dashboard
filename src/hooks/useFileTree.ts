import { useCallback, useEffect, useState } from 'react';
import { getFileTree } from '../api/files.api';
import type { FileNode } from '../types';

export function useFileTree() {
  const [data, setData] = useState<FileNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFileTree = useCallback(async () => {
    setIsLoading(true);

    try {
      const fileTree = await getFileTree();
      setData(fileTree);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file tree');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchFileTree();
  }, [fetchFileTree]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchFileTree,
  };
}
