import { useCallback, useEffect, useState } from 'react';
import { getSettings, updateSettings } from '../api/settings.api';
import type { SystemSettings } from '../types';

export function useSettings() {
  const [data, setData] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);

    try {
      const settings = await getSettings();
      setData(settings);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveSettings = useCallback(async (partial: Partial<SystemSettings>) => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const settings = await updateSettings(partial);
      setData(settings);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save settings');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchSettings,
    saveSettings,
    isSaving,
    saveError,
  };
}
