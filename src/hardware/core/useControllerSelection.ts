/**
 * useControllerSelection - React hook for dynamic controller switching
 *
 * Manages controller lifecycle:
 * - Loads saved preference from localStorage
 * - Switches between controllers
 * - Auto-connects to selected controller
 * - Persists selection across sessions
 */

import { useState, useEffect, useCallback } from 'react';
import { useHardwareContext } from './HardwareManager';
import {
  createController,
  getAllControllers,
  getControllerDefinition,
  type ControllerType
} from './ControllerRegistry';
import type { HardwareController } from './types';

const STORAGE_KEY = 'centaurus:hardware:selected-controller';

export interface UseControllerSelectionReturn {
  selectedType: ControllerType;
  activeController: HardwareController | undefined;
  allControllers: ReturnType<typeof getAllControllers>;
  switchController: (type: ControllerType) => Promise<void>;
  isConnecting: boolean;
  connectionError: string | null;
}

export const useControllerSelection = (): UseControllerSelectionReturn => {
  const { registerController, unregisterController, controllers } = useHardwareContext();
  const [selectedType, setSelectedType] = useState<ControllerType>('none');
  const [activeControllerId, setActiveControllerId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    const loadSavedPreference = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const type = saved as ControllerType;
          const definition = getControllerDefinition(type);

          // Only restore if controller is available
          if (definition.available) {
            console.log(`Restoring saved controller preference: ${type}`);
            setSelectedType(type);
            setHasInitialized(true);
          } else {
            console.warn(`Saved controller ${type} not available yet, defaulting to 'none'`);
            localStorage.removeItem(STORAGE_KEY);
            setHasInitialized(true);
          }
        } else {
          setHasInitialized(true);
        }
      } catch (error) {
        console.error('Failed to load controller preference:', error);
        setHasInitialized(true);
      }
    };

    loadSavedPreference();
  }, []);

  // Auto-connect when selectedType changes (only after initialization)
  useEffect(() => {
    if (hasInitialized && selectedType !== 'none' && !activeControllerId) {
      switchController(selectedType).catch(error => {
        console.error(`Failed to auto-connect to ${selectedType}:`, error);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasInitialized, selectedType]); // Only run when initialized or selectedType changes

  /**
   * Switch to a different controller
   */
  const switchController = useCallback(async (type: ControllerType) => {
    setIsConnecting(true);
    setConnectionError(null);

    try {
      // Step 1: Disconnect and unregister previous controller
      if (activeControllerId) {
        console.log(`Disconnecting previous controller: ${activeControllerId}`);
        await unregisterController(activeControllerId);
        setActiveControllerId(null);
      }

      // Step 2: Create and register new controller
      if (type !== 'none') {
        const controller = createController(type);

        if (controller) {
          console.log(`Registering new controller: ${controller.name} (${controller.id})`);
          registerController(controller);
          setActiveControllerId(controller.id);

          // Step 3: Auto-connect to hardware
          try {
            console.log(`Connecting to ${controller.name}...`);
            await controller.connect();
            console.log(`✅ Connected to ${controller.name}`);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
            console.error(`Failed to connect to ${type}:`, error);
            setConnectionError(`Connection failed: ${errorMessage}`);
            // Controller remains registered but disconnected
          }
        } else {
          console.warn(`Failed to create controller for type: ${type}`);
          setConnectionError(`Controller ${type} is not available yet`);
        }
      }

      // Step 4: Save preference to localStorage
      setSelectedType(type);
      try {
        if (type === 'none') {
          localStorage.removeItem(STORAGE_KEY);
        } else {
          localStorage.setItem(STORAGE_KEY, type);
        }
      } catch (error) {
        console.error('Failed to save controller preference to localStorage:', error);
      }

    } catch (error) {
      console.error('Error during controller switch:', error);
      setConnectionError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsConnecting(false);
    }
  }, [activeControllerId, registerController, unregisterController]);

  return {
    selectedType,
    activeController: controllers.find(c => c.id === activeControllerId),
    allControllers: getAllControllers(),
    switchController,
    isConnecting,
    connectionError
  };
};
