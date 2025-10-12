import { useState, useEffect, useCallback } from 'react';
import { LoadedModule, createModuleInstance } from './moduleRegistry';

/**
 * Module Manager Hook (Story 4.7)
 * Manages loaded modules, active module (mobile), and localStorage persistence
 */

const STORAGE_KEY = 'studio-loaded-modules';
const STORAGE_VERSION = 1;

interface StoredModules {
  version: number;
  modules: LoadedModule[];
  timestamp: string;
}

export function useModuleManager() {
  const [loadedModules, setLoadedModules] = useState<LoadedModule[]>([]);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

  // Load modules from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: StoredModules = JSON.parse(stored);
        if (data.version === STORAGE_VERSION && Array.isArray(data.modules)) {
          setLoadedModules(data.modules);
          // Set first module as active for mobile
          if (data.modules.length > 0) {
            setActiveModuleId(data.modules[0].instanceId);
          }
        }
      }
    } catch (error) {
      console.error('[Studio] Failed to load modules from localStorage:', error);
    }
  }, []);

  // Save modules to localStorage whenever they change
  useEffect(() => {
    if (loadedModules.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    try {
      const data: StoredModules = {
        version: STORAGE_VERSION,
        modules: loadedModules,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('[Studio] Failed to save modules to localStorage:', error);
    }
  }, [loadedModules]);

  /**
   * Add a new module to the workspace
   */
  const addModule = useCallback((moduleId: string) => {
    const newModule = createModuleInstance(moduleId, loadedModules);
    if (!newModule) {
      console.error('[Studio] Failed to create module instance:', moduleId);
      return;
    }

    setLoadedModules((prev) => [...prev, newModule]);

    // Set as active module for mobile
    setActiveModuleId(newModule.instanceId);

    console.log('[Studio] Added module:', newModule);
  }, [loadedModules]);

  /**
   * Remove a module from the workspace
   */
  const removeModule = useCallback((instanceId: string) => {
    setLoadedModules((prev) => {
      const filtered = prev.filter((m) => m.instanceId !== instanceId);

      // If removing active module on mobile, switch to first available
      if (activeModuleId === instanceId && filtered.length > 0) {
        setActiveModuleId(filtered[0].instanceId);
      } else if (filtered.length === 0) {
        setActiveModuleId(null);
      }

      return filtered;
    });

    console.log('[Studio] Removed module:', instanceId);
  }, [activeModuleId]);

  /**
   * Update settings for a specific module instance
   */
  const updateModuleSettings = useCallback((instanceId: string, settings: Record<string, any>) => {
    setLoadedModules((prev) =>
      prev.map((m) =>
        m.instanceId === instanceId
          ? { ...m, settings: { ...m.settings, ...settings } }
          : m
      )
    );
  }, []);

  /**
   * Reorder modules (for drag-drop support)
   */
  const reorderModules = useCallback((newOrder: LoadedModule[]) => {
    setLoadedModules(newOrder);
  }, []);

  /**
   * Clear all modules from workspace
   */
  const clearAllModules = useCallback(() => {
    setLoadedModules([]);
    setActiveModuleId(null);
    localStorage.removeItem(STORAGE_KEY);
    console.log('[Studio] Cleared all modules');
  }, []);

  return {
    loadedModules,
    activeModuleId,
    setActiveModuleId,
    addModule,
    removeModule,
    updateModuleSettings,
    reorderModules,
    clearAllModules,
  };
}
