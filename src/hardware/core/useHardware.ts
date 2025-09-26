/**
 * useHardware Hook - React hook for hardware controller access
 * 
 * Provides convenient access to hardware management functionality
 * with additional utilities for common hardware operations.
 */

import { useCallback, useEffect, useState } from 'react';
import type { 
  HardwareController, 
  SequencerState, 
  HardwareEvent, 
  HardwareEventType
} from './types';
import { useHardwareContext } from './HardwareManager';

/**
 * Hardware statistics for monitoring and debugging
 */
export interface HardwareStats {
  connectedCount: number;
  disconnectedCount: number;
  errorCount: number;
  totalControllers: number;
  lastEventTimestamp: number | null;
}

/**
 * Return type for useHardware hook
 */
export interface UseHardwareReturn {
  // Controller management
  controllers: HardwareController[];
  registerController: (controller: HardwareController) => void;
  unregisterController: (controllerId: string) => void;
  getController: (id: string) => HardwareController | undefined;
  
  // State management
  broadcastSequencerState: (state: SequencerState) => void;
  
  // Event handling
  addEventListener: (type: HardwareEventType, callback: (event: HardwareEvent) => void) => void;
  removeEventListener: (type: HardwareEventType, callback: (event: HardwareEvent) => void) => void;
  
  // Utilities
  getConnectedControllers: () => HardwareController[];
  getControllersByCapability: (capability: keyof import('./types').ControllerCapabilities) => HardwareController[];
  connectAllControllers: () => Promise<void>;
  disconnectAllControllers: () => Promise<void>;
  
  // Statistics and monitoring
  stats: HardwareStats;
  isAnyControllerConnected: boolean;
}

/**
 * Custom hook for hardware management
 * 
 * Provides access to hardware context with additional utilities
 * for common hardware operations and state monitoring.
 */
export const useHardware = (): UseHardwareReturn => {
  const context = useHardwareContext();
  const [lastEventTimestamp, setLastEventTimestamp] = useState<number | null>(null);

  // Event listener for tracking last event timestamp
  const handleHardwareEvent = useCallback((event: HardwareEvent) => {
    setLastEventTimestamp(event.timestamp);
  }, []);

  // Set up event listeners for statistics tracking
  useEffect(() => {
    // Note: Event listener setup would be implemented when HardwareManager
    // provides system-level event handling capabilities
    return () => {
      // Cleanup logic would go here
    };
  }, [handleHardwareEvent]);

  /**
   * Get all connected controllers
   */
  const getConnectedControllers = useCallback((): HardwareController[] => {
    return context.controllers.filter(controller => 
      controller.connectionStatus === 'connected'
    );
  }, [context.controllers]);

  /**
   * Get controllers by specific capability
   */
  const getControllersByCapability = useCallback((
    capability: keyof import('./types').ControllerCapabilities
  ): HardwareController[] => {
    return context.controllers.filter(controller => 
      controller.capabilities[capability] === true
    );
  }, [context.controllers]);

  /**
   * Connect all registered controllers
   */
  const connectAllControllers = useCallback(async (): Promise<void> => {
    const connectionPromises = context.controllers
      .filter(controller => controller.connectionStatus === 'disconnected')
      .map(async controller => {
        try {
          await controller.connect();
          console.log(`Connected controller: ${controller.name} (${controller.id})`);
        } catch (error) {
          console.error(`Failed to connect controller ${controller.id}:`, error);
          controller.handleError(error as Error);
        }
      });

    await Promise.allSettled(connectionPromises);
  }, [context.controllers]);

  /**
   * Disconnect all connected controllers
   */
  const disconnectAllControllers = useCallback(async (): Promise<void> => {
    const disconnectionPromises = context.controllers
      .filter(controller => controller.connectionStatus === 'connected')
      .map(async controller => {
        try {
          await controller.disconnect();
          console.log(`Disconnected controller: ${controller.name} (${controller.id})`);
        } catch (error) {
          console.error(`Failed to disconnect controller ${controller.id}:`, error);
          controller.handleError(error as Error);
        }
      });

    await Promise.allSettled(disconnectionPromises);
  }, [context.controllers]);

  /**
   * Calculate hardware statistics
   */
  const stats: HardwareStats = {
    connectedCount: context.controllers.filter(c => c.connectionStatus === 'connected').length,
    disconnectedCount: context.controllers.filter(c => c.connectionStatus === 'disconnected').length,
    errorCount: context.controllers.filter(c => c.connectionStatus === 'error').length,
    totalControllers: context.controllers.length,
    lastEventTimestamp,
  };

  /**
   * Check if any controller is connected
   */
  const isAnyControllerConnected = stats.connectedCount > 0;

  // Enhanced event handling with system-level access
  const addEventListener = useCallback((
    _type: HardwareEventType, 
    _callback: (event: HardwareEvent) => void
  ) => {
    // Enhanced version would integrate with HardwareManager's event system
    // For now, event handling is done through individual controllers
    console.log('Event listener registration - not yet implemented');
  }, []);

  const removeEventListener = useCallback((
    _type: HardwareEventType, 
    _callback: (event: HardwareEvent) => void
  ) => {
    // Enhanced version would integrate with HardwareManager's event system
    // For now, event handling is done through individual controllers
    console.log('Event listener removal - not yet implemented');
  }, []);

  return {
    // Core context functionality
    controllers: context.controllers,
    registerController: context.registerController,
    unregisterController: context.unregisterController,
    getController: context.getController,
    broadcastSequencerState: context.broadcastSequencerState,
    
    // Enhanced event handling
    addEventListener,
    removeEventListener,
    
    // Utility functions
    getConnectedControllers,
    getControllersByCapability,
    connectAllControllers,
    disconnectAllControllers,
    
    // Statistics and monitoring
    stats,
    isAnyControllerConnected,
  };
};