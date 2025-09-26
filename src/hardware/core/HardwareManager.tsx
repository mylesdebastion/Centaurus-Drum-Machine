/**
 * Hardware Manager - Central orchestrator for hardware controller lifecycle
 * 
 * React Context provider that manages all hardware controller registration,
 * lifecycle events, and sequencer state synchronization.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { 
  HardwareController, 
  HardwareContextType, 
  SequencerState, 
  HardwareEvent
} from './types';
import { HardwareErrorBoundary } from './HardwareErrorBoundary';

/**
 * React Context for hardware management
 */
const HardwareContext = createContext<HardwareContextType | null>(null);

/**
 * Props for HardwareManager component
 */
export interface HardwareManagerProps {
  children: React.ReactNode;
}

/**
 * Performance monitoring for abstraction layer overhead tracking
 */
class PerformanceMonitor {
  private samples: number[] = [];
  private readonly maxSamples = 100;

  addSample(duration: number): void {
    this.samples.push(duration);
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }
  }

  getAverageOverhead(): number {
    if (this.samples.length === 0) return 0;
    return this.samples.reduce((sum, sample) => sum + sample, 0) / this.samples.length;
  }

  reset(): void {
    this.samples = [];
  }
}

/**
 * HardwareManager Component - Central hardware orchestrator
 * 
 * Provides React Context for hardware controller management including:
 * - Controller registration/deregistration
 * - Lifecycle management (connect/disconnect/error handling)
 * - Event-driven communication system
 * - Performance monitoring
 */
export const HardwareManager: React.FC<HardwareManagerProps> = ({ children }) => {
  const [controllers, setControllers] = useState<HardwareController[]>([]);
  const performanceMonitor = useRef(new PerformanceMonitor());
  const eventListeners = useRef(new Map<string, Set<(event: HardwareEvent) => void>>());

  /**
   * Register a new hardware controller
   */
  const registerController = useCallback((controller: HardwareController) => {
    const startTime = performance.now();
    
    try {
      setControllers(prev => {
        // Prevent duplicate registration
        if (prev.find(c => c.id === controller.id)) {
          console.warn(`Controller ${controller.id} is already registered`);
          return prev;
        }
        
        console.log(`Registering hardware controller: ${controller.name} (${controller.id})`);
        return [...prev, controller];
      });

      // Set up event forwarding from controller to system
      controller.addEventListener('connection_change', (event) => {
        const listeners = eventListeners.current.get('connection_change');
        if (listeners) {
          listeners.forEach(listener => listener(event));
        }
      });

      controller.addEventListener('hardware_input', (event) => {
        const listeners = eventListeners.current.get('hardware_input');
        if (listeners) {
          listeners.forEach(listener => listener(event));
        }
      });

      controller.addEventListener('step_toggle', (event) => {
        const listeners = eventListeners.current.get('step_toggle');
        if (listeners) {
          listeners.forEach(listener => listener(event));
        }
      });

    } catch (error) {
      console.error(`Failed to register controller ${controller.id}:`, error);
      controller.handleError(error as Error);
    } finally {
      const duration = performance.now() - startTime;
      performanceMonitor.current.addSample(duration);
    }
  }, []);

  /**
   * Unregister a hardware controller
   */
  const unregisterController = useCallback(async (controllerId: string) => {
    const startTime = performance.now();
    
    try {
      setControllers(prev => {
        const controller = prev.find(c => c.id === controllerId);
        if (!controller) {
          console.warn(`Controller ${controllerId} not found for unregistration`);
          return prev;
        }

        console.log(`Unregistering hardware controller: ${controller.name} (${controllerId})`);
        
        // Disconnect controller before removing
        controller.disconnect().catch(error => {
          console.error(`Error disconnecting controller ${controllerId}:`, error);
        });

        return prev.filter(c => c.id !== controllerId);
      });
    } catch (error) {
      console.error(`Failed to unregister controller ${controllerId}:`, error);
    } finally {
      const duration = performance.now() - startTime;
      performanceMonitor.current.addSample(duration);
    }
  }, []);

  /**
   * Broadcast sequencer state to all connected controllers
   */
  const broadcastSequencerState = useCallback((state: SequencerState) => {
    const startTime = performance.now();
    
    try {
      controllers.forEach(controller => {
        if (controller.connectionStatus === 'connected') {
          try {
            controller.updateSequencerState(state);
          } catch (error) {
            console.error(`Error updating state for controller ${controller.id}:`, error);
            controller.handleError(error as Error);
          }
        }
      });
    } catch (error) {
      console.error('Error broadcasting sequencer state:', error);
    } finally {
      const duration = performance.now() - startTime;
      performanceMonitor.current.addSample(duration);
    }
  }, [controllers]);

  /**
   * Get controller by ID
   */
  const getController = useCallback((id: string): HardwareController | undefined => {
    return controllers.find(controller => controller.id === id);
  }, [controllers]);


  /**
   * Performance monitoring effect
   */
  useEffect(() => {
    const interval = setInterval(() => {
      const avgOverhead = performanceMonitor.current.getAverageOverhead();
      
      // Log warning if overhead exceeds 5% threshold (assuming 16ms frame budget = 0.8ms)
      if (avgOverhead > 0.8) {
        console.warn(`Hardware abstraction layer overhead: ${avgOverhead.toFixed(2)}ms (>5% threshold)`);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  /**
   * Cleanup effect - disconnect all controllers on unmount
   */
  useEffect(() => {
    return () => {
      controllers.forEach(controller => {
        controller.disconnect().catch(error => {
          console.error(`Error disconnecting controller ${controller.id} during cleanup:`, error);
        });
      });
    };
  }, [controllers]);

  const contextValue: HardwareContextType = {
    controllers,
    registerController,
    unregisterController,
    broadcastSequencerState,
    getController,
  };

  return (
    <HardwareErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Hardware system error caught by boundary:', {
          error: error.message,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
        });
        
        // Attempt to disconnect all controllers to prevent further issues
        controllers.forEach(controller => {
          try {
            controller.handleError(error);
          } catch (recoveryError) {
            console.error(`Failed to handle error for controller ${controller.id}:`, recoveryError);
          }
        });
      }}
      showErrorDetails={false}
    >
      <HardwareContext.Provider value={contextValue}>
        {children}
      </HardwareContext.Provider>
    </HardwareErrorBoundary>
  );
};

/**
 * Hook to access hardware context
 * 
 * @throws Error if used outside of HardwareManager
 */
export const useHardwareContext = (): HardwareContextType => {
  const context = useContext(HardwareContext);
  if (!context) {
    throw new Error('useHardwareContext must be used within a HardwareManager');
  }
  return context;
};