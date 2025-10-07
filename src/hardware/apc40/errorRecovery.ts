/**
 * APC40 Error Recovery System
 * 
 * Provides APC40-specific error recovery strategies and integration
 * with the central hardware error handler.
 */

import { hardwareErrorHandler, type HardwareError } from '../utils/errorHandler';
import { APC40_ERROR_CODES, APC40_TIMING, CONNECTION_HEALTH } from './constants';
// import type { ConnectionStatus } from '../core/types'; // Unused for now

export interface APC40ErrorContext {
  controllerId: string;
  deviceName: string;
  lastHeartbeat?: number;
  reconnectAttempts?: number;
  connectionHealth?: number;
  operation?: string;
}

export interface RecoveryAction {
  type: 'retry' | 'reconnect' | 'reset' | 'notify_user';
  delay?: number;
  maxAttempts?: number;
  description: string;
}

export interface RecoveryStrategy {
  immediate: RecoveryAction[];
  delayed: RecoveryAction[];
  fallback: RecoveryAction[];
}

/**
 * APC40-specific error recovery manager
 */
export class APC40ErrorRecovery {
  private recoveryStrategies: Map<string, RecoveryStrategy> = new Map();
  private activeRecoveries: Map<string, {
    startTime: number;
    attempts: number;
    strategy: RecoveryStrategy;
  }> = new Map();

  constructor() {
    this.initializeRecoveryStrategies();
    this.setupErrorHandlerIntegration();
  }

  /**
   * Handle APC40-specific error with recovery strategy
   */
  handleAPC40Error(
    error: Error | string,
    errorCode: string,
    context: APC40ErrorContext
  ): HardwareError {
    // Log the error using the central handler
    const hardwareError = hardwareErrorHandler.handleDeviceError(error, {
      deviceId: context.controllerId,
      deviceName: context.deviceName,
      operation: context.operation,
    });

    // Apply APC40-specific error code
    hardwareError.code = errorCode;
    hardwareError.context = {
      ...hardwareError.context,
      ...context,
    };

    // Determine and execute recovery strategy
    const strategy = this.getRecoveryStrategy(errorCode, context);
    if (strategy) {
      this.executeRecoveryStrategy(errorCode, strategy, context);
    }

    return hardwareError;
  }

  /**
   * Handle connection health degradation
   */
  handleConnectionHealthDegradation(
    health: number,
    context: APC40ErrorContext
  ): void {
    let errorCode = '';
    let message = '';

    if (health <= CONNECTION_HEALTH.CRITICAL) {
      errorCode = APC40_ERROR_CODES.HEARTBEAT_TIMEOUT;
      message = 'APC40 connection health critical - device may be disconnected';
    } else if (health <= CONNECTION_HEALTH.POOR) {
      errorCode = 'APC40_CONNECTION_DEGRADED';
      message = 'APC40 connection health poor - experiencing communication issues';
    } else if (health <= CONNECTION_HEALTH.WARNING) {
      errorCode = 'APC40_CONNECTION_SLOW';
      message = 'APC40 connection slow - performance may be affected';
    } else {
      return; // Health is acceptable
    }

    this.handleAPC40Error(message, errorCode, context);
  }

  /**
   * Get appropriate recovery strategy for error code
   */
  private getRecoveryStrategy(
    errorCode: string,
    _context: APC40ErrorContext
  ): RecoveryStrategy | null {
    const strategy = this.recoveryStrategies.get(errorCode);
    if (strategy) {
      return strategy;
    }

    // Fallback strategy based on error type
    if (errorCode.includes('CONNECTION')) {
      return this.recoveryStrategies.get('CONNECTION_DEFAULT')!;
    } else if (errorCode.includes('SYSEX') || errorCode.includes('LED')) {
      return this.recoveryStrategies.get('SYSEX_DEFAULT')!;
    } else if (errorCode.includes('INITIALIZATION')) {
      return this.recoveryStrategies.get('INITIALIZATION_DEFAULT')!;
    }

    return this.recoveryStrategies.get('GENERIC_DEFAULT')!;
  }

  /**
   * Execute recovery strategy
   */
  private executeRecoveryStrategy(
    errorCode: string,
    strategy: RecoveryStrategy,
    context: APC40ErrorContext
  ): void {
    const recoveryId = `${context.controllerId}-${errorCode}`;
    
    // Check if recovery is already in progress
    if (this.activeRecoveries.has(recoveryId)) {
      const active = this.activeRecoveries.get(recoveryId)!;
      active.attempts++;
      
      // If max attempts exceeded, try fallback
      if (active.attempts >= 3) {
        this.executeFallbackActions(strategy.fallback, context);
        this.activeRecoveries.delete(recoveryId);
        return;
      }
    } else {
      // Start new recovery
      this.activeRecoveries.set(recoveryId, {
        startTime: performance.now(),
        attempts: 1,
        strategy,
      });
    }

    // Execute immediate actions
    this.executeActions(strategy.immediate, context);

    // Schedule delayed actions
    if (strategy.delayed.length > 0) {
      setTimeout(() => {
        if (this.activeRecoveries.has(recoveryId)) {
          this.executeActions(strategy.delayed, context);
        }
      }, APC40_TIMING.RECONNECT_DELAY);
    }
  }

  /**
   * Execute list of recovery actions
   */
  private executeActions(actions: RecoveryAction[], context: APC40ErrorContext): void {
    actions.forEach(action => {
      console.log(`[APC40Recovery] Executing ${action.type}: ${action.description}`);
      
      switch (action.type) {
        case 'retry':
          // Signal that retry should be attempted
          this.emitRecoveryEvent('retry_requested', {
            controllerId: context.controllerId,
            delay: action.delay || 0,
          });
          break;

        case 'reconnect':
          // Signal that reconnection should be attempted
          this.emitRecoveryEvent('reconnect_requested', {
            controllerId: context.controllerId,
            delay: action.delay || APC40_TIMING.RECONNECT_DELAY,
          });
          break;

        case 'reset':
          // Signal that device reset should be attempted
          this.emitRecoveryEvent('reset_requested', {
            controllerId: context.controllerId,
            delay: action.delay || 0,
          });
          break;

        case 'notify_user':
          // Emit user notification
          this.emitRecoveryEvent('user_notification', {
            controllerId: context.controllerId,
            message: action.description,
          });
          break;
      }
    });
  }

  /**
   * Execute fallback actions when primary recovery fails
   */
  private executeFallbackActions(actions: RecoveryAction[], context: APC40ErrorContext): void {
    console.warn('[APC40Recovery] Primary recovery failed, executing fallback actions');
    this.executeActions(actions, context);
  }

  /**
   * Clear recovery state for controller
   */
  clearRecoveryState(controllerId: string): void {
    const toRemove = Array.from(this.activeRecoveries.keys())
      .filter(key => key.startsWith(controllerId));
    
    toRemove.forEach(key => {
      this.activeRecoveries.delete(key);
    });
  }

  /**
   * Get recovery status for controller
   */
  getRecoveryStatus(controllerId: string): {
    hasActiveRecoveries: boolean;
    recoveryCount: number;
    lastRecoveryTime?: number;
  } {
    const activeKeys = Array.from(this.activeRecoveries.keys())
      .filter(key => key.startsWith(controllerId));
    
    let lastRecoveryTime: number | undefined;
    for (const key of activeKeys) {
      const recovery = this.activeRecoveries.get(key);
      if (recovery && (!lastRecoveryTime || recovery.startTime > lastRecoveryTime)) {
        lastRecoveryTime = recovery.startTime;
      }
    }

    return {
      hasActiveRecoveries: activeKeys.length > 0,
      recoveryCount: activeKeys.length,
      lastRecoveryTime,
    };
  }

  /**
   * Initialize recovery strategies for different error types
   */
  private initializeRecoveryStrategies(): void {
    // Device not found
    this.recoveryStrategies.set(APC40_ERROR_CODES.DEVICE_NOT_FOUND, {
      immediate: [
        {
          type: 'notify_user',
          description: 'APC40 not detected. Check USB connection and power.',
        },
      ],
      delayed: [
        {
          type: 'retry',
          delay: APC40_TIMING.RECONNECT_DELAY,
          description: 'Retry device detection',
        },
      ],
      fallback: [
        {
          type: 'notify_user',
          description: 'APC40 connection failed. Device may not be supported or properly connected.',
        },
      ],
    });

    // Connection failed
    this.recoveryStrategies.set(APC40_ERROR_CODES.CONNECTION_FAILED, {
      immediate: [
        {
          type: 'retry',
          delay: 1000,
          description: 'Immediate connection retry',
        },
      ],
      delayed: [
        {
          type: 'reconnect',
          delay: APC40_TIMING.RECONNECT_DELAY,
          description: 'Full reconnection attempt',
        },
      ],
      fallback: [
        {
          type: 'reset',
          description: 'Reset connection state and notify user',
        },
        {
          type: 'notify_user',
          description: 'APC40 connection failed. Try unplugging and reconnecting the device.',
        },
      ],
    });

    // Initialization failed
    this.recoveryStrategies.set(APC40_ERROR_CODES.INITIALIZATION_FAILED, {
      immediate: [
        {
          type: 'retry',
          delay: APC40_TIMING.INITIALIZATION_DELAY * 2,
          description: 'Retry initialization with longer delay',
        },
      ],
      delayed: [
        {
          type: 'reset',
          delay: APC40_TIMING.RECONNECT_DELAY,
          description: 'Reset and reinitialize device',
        },
      ],
      fallback: [
        {
          type: 'notify_user',
          description: 'APC40 initialization failed. Device firmware may need updating.',
        },
      ],
    });

    // SysEx failed
    this.recoveryStrategies.set(APC40_ERROR_CODES.SYSEX_FAILED, {
      immediate: [
        {
          type: 'retry',
          delay: 100,
          description: 'Retry SysEx message',
        },
      ],
      delayed: [
        {
          type: 'reset',
          delay: 500,
          description: 'Reset SysEx communication',
        },
      ],
      fallback: [
        {
          type: 'notify_user',
          description: 'APC40 LED control unavailable. Device will work but without visual feedback.',
        },
      ],
    });

    // LED update failed
    this.recoveryStrategies.set(APC40_ERROR_CODES.LED_UPDATE_FAILED, {
      immediate: [], // Don't retry LED updates immediately
      delayed: [
        {
          type: 'retry',
          delay: APC40_TIMING.LED_UPDATE_THROTTLE * 10,
          description: 'Retry LED update after throttle period',
        },
      ],
      fallback: [
        {
          type: 'notify_user',
          description: 'APC40 LED feedback temporarily unavailable.',
        },
      ],
    });

    // Heartbeat timeout
    this.recoveryStrategies.set(APC40_ERROR_CODES.HEARTBEAT_TIMEOUT, {
      immediate: [
        {
          type: 'reconnect',
          delay: 0,
          description: 'Immediate reconnection due to heartbeat timeout',
        },
      ],
      delayed: [],
      fallback: [
        {
          type: 'notify_user',
          description: 'APC40 connection lost. Check device connection.',
        },
      ],
    });

    // Default strategies
    this.recoveryStrategies.set('CONNECTION_DEFAULT', {
      immediate: [{ type: 'retry', delay: 1000, description: 'Connection retry' }],
      delayed: [{ type: 'reconnect', delay: APC40_TIMING.RECONNECT_DELAY, description: 'Full reconnection' }],
      fallback: [{ type: 'notify_user', description: 'Connection problem with APC40' }],
    });

    this.recoveryStrategies.set('SYSEX_DEFAULT', {
      immediate: [{ type: 'retry', delay: 100, description: 'SysEx retry' }],
      delayed: [],
      fallback: [{ type: 'notify_user', description: 'APC40 communication problem' }],
    });

    this.recoveryStrategies.set('INITIALIZATION_DEFAULT', {
      immediate: [{ type: 'retry', delay: APC40_TIMING.INITIALIZATION_DELAY, description: 'Initialization retry' }],
      delayed: [{ type: 'reset', delay: APC40_TIMING.RECONNECT_DELAY, description: 'Reset initialization' }],
      fallback: [{ type: 'notify_user', description: 'APC40 setup failed' }],
    });

    this.recoveryStrategies.set('GENERIC_DEFAULT', {
      immediate: [],
      delayed: [{ type: 'retry', delay: APC40_TIMING.RECONNECT_DELAY, description: 'Generic retry' }],
      fallback: [{ type: 'notify_user', description: 'APC40 error occurred' }],
    });
  }

  /**
   * Setup integration with central error handler
   */
  private setupErrorHandlerIntegration(): void {
    hardwareErrorHandler.addEventListener('error', (error?: HardwareError) => {
      if (!error) return;
      // Only handle APC40-related errors
      if (error.code && error.code.startsWith('APC40_')) {
        console.log(`[APC40Recovery] Handling error: ${error.code}`);
      }
    });
  }

  /**
   * Emit recovery event for APC40Controller to handle
   */
  private emitRecoveryEvent(event: string, data: any): void {
    // Use setTimeout to make this async and avoid blocking
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent(`apc40-recovery-${event}`, { detail: data })
        );
      }
    }, 0);
  }
}

/**
 * Utility functions for error code mapping
 */
export function getAPC40ErrorCode(errorMessage: string): string {
  const message = errorMessage.toLowerCase();
  
  if (message.includes('not found') || message.includes('no device')) {
    return APC40_ERROR_CODES.DEVICE_NOT_FOUND;
  }
  if (message.includes('connection') && message.includes('failed')) {
    return APC40_ERROR_CODES.CONNECTION_FAILED;
  }
  if (message.includes('initialization') && message.includes('failed')) {
    return APC40_ERROR_CODES.INITIALIZATION_FAILED;
  }
  if (message.includes('sysex')) {
    return APC40_ERROR_CODES.SYSEX_FAILED;
  }
  if (message.includes('led')) {
    return APC40_ERROR_CODES.LED_UPDATE_FAILED;
  }
  if (message.includes('heartbeat') || message.includes('timeout')) {
    return APC40_ERROR_CODES.HEARTBEAT_TIMEOUT;
  }
  
  return 'APC40_UNKNOWN_ERROR';
}

/**
 * Create APC40 error context from controller state
 */
export function createAPC40ErrorContext(
  controllerId: string,
  deviceName: string,
  options?: {
    lastHeartbeat?: number;
    reconnectAttempts?: number;
    connectionHealth?: number;
    operation?: string;
  }
): APC40ErrorContext {
  return {
    controllerId,
    deviceName,
    lastHeartbeat: options?.lastHeartbeat,
    reconnectAttempts: options?.reconnectAttempts,
    connectionHealth: options?.connectionHealth,
    operation: options?.operation,
  };
}

// Singleton instance
export const apc40ErrorRecovery = new APC40ErrorRecovery();