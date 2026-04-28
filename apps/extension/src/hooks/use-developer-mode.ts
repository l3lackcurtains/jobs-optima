import { useState, useEffect } from 'react';
import { STORAGE_KEYS } from '@/lib/constants';

export function useDeveloperMode() {
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load developer mode preference on mount
    const loadDeveloperMode = async () => {
      try {
        const result = await chrome.storage.local.get(STORAGE_KEYS.DEVELOPER_MODE);
        setIsDeveloperMode(result.developerMode || false);
      } catch (error) {
        console.error('Failed to load developer mode preference:', error);
        setIsDeveloperMode(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadDeveloperMode();
  }, []);

  const toggleDeveloperMode = async () => {
    const newMode = !isDeveloperMode;
    try {
      await chrome.storage.local.set({ [STORAGE_KEYS.DEVELOPER_MODE]: newMode });
      setIsDeveloperMode(newMode);
      
      // Optional: Show a toast or notification about the change
      console.log(`Developer mode ${newMode ? 'enabled' : 'disabled'}: Using ${newMode ? 'localhost:8888' : 'production'} backend`);
    } catch (error) {
      console.error('Failed to save developer mode preference:', error);
    }
  };

  return {
    isDeveloperMode,
    isLoading,
    toggleDeveloperMode,
  };
}