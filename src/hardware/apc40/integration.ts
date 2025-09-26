/**
 * APC40 Integration Module
 * 
 * Provides high-level utilities for integrating APC40 controllers
 * with the HardwareManager context and drum machine sequencer.
 */

import { APC40Controller } from './APC40Controller';
import type { HardwareContextType, SequencerState } from '../core/types';

export interface APC40IntegrationOptions {
  /** Custom device ID for the controller */
  deviceId?: string;
  /** Whether to automatically connect on registration */
  autoConnect?: boolean;
  /** Whether to auto-detect APC40 devices */
  autoDetect?: boolean;
}

export interface APC40IntegrationResult {
  controller: APC40Controller;
  success: boolean;
  error?: string;
}

/**
 * APC40 Hardware Integration Utility
 */
export class APC40Integration {
  private static instance: APC40Integration | null = null;
  private registeredControllers: Map<string, APC40Controller> = new Map();
  private hardwareContext: HardwareContextType | null = null;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): APC40Integration {
    if (!APC40Integration.instance) {
      APC40Integration.instance = new APC40Integration();
    }
    return APC40Integration.instance;
  }

  /**
   * Initialize integration with hardware context
   */
  initialize(hardwareContext: HardwareContextType): void {
    this.hardwareContext = hardwareContext;
    console.log('[APC40Integration] Initialized with hardware context');
  }

  /**
   * Register and optionally connect an APC40 controller
   */
  async registerAPC40(options: APC40IntegrationOptions = {}): Promise<APC40IntegrationResult> {
    if (!this.hardwareContext) {
      return {
        controller: null as any,
        success: false,
        error: 'Hardware context not initialized. Call initialize() first.',
      };
    }

    try {
      // Create APC40 controller instance
      const controller = new APC40Controller(options.deviceId);
      
      // Register with hardware manager
      this.hardwareContext.registerController(controller);
      this.registeredControllers.set(controller.id, controller);

      console.log(`[APC40Integration] Registered controller: ${controller.name} (${controller.id})`);

      // Auto-connect if requested
      if (options.autoConnect !== false) {
        try {
          await controller.connect();
          console.log(`[APC40Integration] Successfully connected: ${controller.name}`);
        } catch (connectionError) {
          console.warn(`[APC40Integration] Connection failed for ${controller.name}:`, connectionError);
          // Don't fail registration if connection fails
        }
      }

      return {
        controller,
        success: true,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[APC40Integration] Registration failed:', errorMessage);
      
      return {
        controller: null as any,
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Unregister an APC40 controller
   */
  async unregisterAPC40(controllerId: string): Promise<boolean> {
    if (!this.hardwareContext) {
      console.error('[APC40Integration] Hardware context not initialized');
      return false;
    }

    try {
      // Disconnect and unregister
      await this.hardwareContext.unregisterController(controllerId);
      this.registeredControllers.delete(controllerId);
      
      console.log(`[APC40Integration] Unregistered controller: ${controllerId}`);
      return true;

    } catch (error) {
      console.error(`[APC40Integration] Failed to unregister controller ${controllerId}:`, error);
      return false;
    }
  }

  /**
   * Get all registered APC40 controllers
   */
  getRegisteredControllers(): APC40Controller[] {
    return Array.from(this.registeredControllers.values());
  }

  /**
   * Get APC40 controller by ID
   */
  getController(controllerId: string): APC40Controller | undefined {
    return this.registeredControllers.get(controllerId);
  }

  /**
   * Check if any APC40 controllers are connected
   */
  hasConnectedControllers(): boolean {
    return Array.from(this.registeredControllers.values())
      .some(controller => controller.connectionStatus === 'connected');
  }

  /**
   * Get connection status summary
   */
  getConnectionStatus(): {
    total: number;
    connected: number;
    disconnected: number;
    error: number;
  } {
    const controllers = Array.from(this.registeredControllers.values());
    
    return {
      total: controllers.length,
      connected: controllers.filter(c => c.connectionStatus === 'connected').length,
      disconnected: controllers.filter(c => c.connectionStatus === 'disconnected').length,
      error: controllers.filter(c => c.connectionStatus === 'error').length,
    };
  }

  /**
   * Connect all registered controllers
   */
  async connectAll(): Promise<{
    successful: string[];
    failed: Array<{ id: string; error: string }>;
  }> {
    const results = {
      successful: [] as string[],
      failed: [] as Array<{ id: string; error: string }>,
    };

    const controllers = Array.from(this.registeredControllers.values());
    
    await Promise.allSettled(
      controllers.map(async (controller) => {
        try {
          await controller.connect();
          results.successful.push(controller.id);
          console.log(`[APC40Integration] Connected: ${controller.name}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          results.failed.push({ id: controller.id, error: errorMessage });
          console.error(`[APC40Integration] Connection failed for ${controller.name}:`, errorMessage);
        }
      })
    );

    return results;
  }

  /**
   * Disconnect all registered controllers
   */
  async disconnectAll(): Promise<void> {
    const controllers = Array.from(this.registeredControllers.values());
    
    await Promise.allSettled(
      controllers.map(async (controller) => {
        try {
          await controller.disconnect();
          console.log(`[APC40Integration] Disconnected: ${controller.name}`);
        } catch (error) {
          console.error(`[APC40Integration] Disconnect failed for ${controller.name}:`, error);
        }
      })
    );
  }

  /**
   * Update sequencer state for all connected APC40 controllers
   */
  updateSequencerState(state: SequencerState): void {
    const connectedControllers = Array.from(this.registeredControllers.values())
      .filter(controller => controller.connectionStatus === 'connected');

    connectedControllers.forEach(controller => {
      try {
        controller.updateSequencerState(state);
      } catch (error) {
        console.error(`[APC40Integration] Failed to update state for ${controller.name}:`, error);
      }
    });
  }

  /**
   * Auto-detect and register APC40 devices
   */
  async autoDetectAndRegister(): Promise<APC40IntegrationResult[]> {
    console.log('[APC40Integration] Starting auto-detection...');
    
    const results: APC40IntegrationResult[] = [];
    
    try {
      // For now, attempt to register one APC40 with auto-detection
      // In a more advanced implementation, this could enumerate Web MIDI devices
      // and register multiple APC40s found
      const result = await this.registerAPC40({
        autoConnect: true,
        autoDetect: true,
      });
      
      results.push(result);
      
      if (result.success) {
        console.log('[APC40Integration] Auto-detection successful');
      } else {
        console.log('[APC40Integration] Auto-detection found no devices');
      }

    } catch (error) {
      console.error('[APC40Integration] Auto-detection failed:', error);
    }

    return results;
  }

  /**
   * Setup event listeners for drum machine integration
   */
  setupDrumMachineIntegration(callbacks: {
    onStepToggle?: (step: number, intensity: number) => void;
    onTransportControl?: (command: 'play' | 'stop' | 'record') => void;
    onConnectionChange?: (connected: boolean, deviceName?: string) => void;
  }): void {
    if (!this.hardwareContext) {
      console.error('[APC40Integration] Hardware context not initialized');
      return;
    }

    const controllers = Array.from(this.registeredControllers.values());
    
    controllers.forEach(controller => {
      // Setup step toggle handling
      if (callbacks.onStepToggle) {
        controller.addEventListener('step_toggle', (event) => {
          callbacks.onStepToggle!(event.data.step, event.data.intensity);
        });
      }

      // Setup transport control handling
      if (callbacks.onTransportControl) {
        controller.addEventListener('hardware_input', (event) => {
          if (event.data.transport && event.data.command) {
            callbacks.onTransportControl!(event.data.command);
          }
        });
      }

      // Setup connection change handling
      if (callbacks.onConnectionChange) {
        controller.addEventListener('connection_change', (event) => {
          callbacks.onConnectionChange!(
            event.data.connected,
            event.data.deviceName
          );
        });
      }
    });

    console.log('[APC40Integration] Drum machine integration callbacks setup complete');
  }

  /**
   * Get debug information
   */
  getDebugInfo(): {
    initialized: boolean;
    controllersRegistered: number;
    connectionStatus: ReturnType<APC40Integration['getConnectionStatus']>;
    controllerDetails: Array<{
      id: string;
      name: string;
      status: string;
      capabilities: any;
    }>;
  } {
    const controllers = Array.from(this.registeredControllers.values());
    
    return {
      initialized: this.hardwareContext !== null,
      controllersRegistered: controllers.length,
      connectionStatus: this.getConnectionStatus(),
      controllerDetails: controllers.map(controller => ({
        id: controller.id,
        name: controller.name,
        status: controller.connectionStatus,
        capabilities: controller.capabilities,
      })),
    };
  }
}

// Export singleton instance for easy access
export const apc40Integration = APC40Integration.getInstance();