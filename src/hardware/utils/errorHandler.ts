/**
 * Hardware Error Handler
 * Centralized error handling for MIDI and hardware operations
 */

export interface HardwareError {
  type: 'connection' | 'midi' | 'compatibility' | 'device' | 'unknown';
  code: string;
  message: string;
  originalError?: Error;
  timestamp: number;
  context?: Record<string, any>;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByType: Record<string, number>;
  recentErrors: HardwareError[];
  lastErrorTime: number | null;
}

export class HardwareErrorHandler {
  private errors: HardwareError[] = [];
  private maxStoredErrors = 50;
  private listeners: Map<string, ((error: HardwareError) => void)[]> = new Map();

  /**
   * Handle and log hardware error
   */
  handleError(error: Error | string, context?: {
    type?: HardwareError['type'];
    code?: string;
    deviceId?: string;
    operation?: string;
    retryCount?: number;
  }): HardwareError {
    const hardwareError: HardwareError = {
      type: context?.type || 'unknown',
      code: context?.code || 'UNKNOWN_ERROR',
      message: error instanceof Error ? error.message : error,
      originalError: error instanceof Error ? error : undefined,
      timestamp: Date.now(),
      context: {
        deviceId: context?.deviceId,
        operation: context?.operation,
        retryCount: context?.retryCount,
        userAgent: navigator.userAgent,
        url: window.location.href
      }
    };

    // Store error
    this.errors.push(hardwareError);
    if (this.errors.length > this.maxStoredErrors) {
      this.errors.shift();
    }

    // Log error following existing console logging patterns
    this.logError(hardwareError);

    // Emit error event
    this.emit('error', hardwareError);

    return hardwareError;
  }

  /**
   * Handle connection-specific errors
   */
  handleConnectionError(error: Error | string, context?: {
    deviceId?: string;
    reconnectAttempt?: number;
    operation?: string;
  }): HardwareError {
    return this.handleError(error, {
      type: 'connection',
      code: 'CONNECTION_ERROR',
      ...context,
      retryCount: context?.reconnectAttempt
    });
  }

  /**
   * Handle MIDI message errors
   */
  handleMidiError(error: Error | string, context?: {
    deviceId?: string;
    messageType?: string;
    data?: Uint8Array;
  }): HardwareError {
    return this.handleError(error, {
      type: 'midi',
      code: 'MIDI_ERROR',
      deviceId: context?.deviceId,
      operation: `MIDI ${context?.messageType}`,
      ...context
    });
  }

  /**
   * Handle browser compatibility errors
   */
  handleCompatibilityError(error: Error | string, context?: {
    browserName?: string;
    feature?: string;
  }): HardwareError {
    return this.handleError(error, {
      type: 'compatibility',
      code: 'COMPATIBILITY_ERROR',
      operation: `Browser compatibility check: ${context?.feature}`,
      ...context
    });
  }

  /**
   * Handle device-specific errors
   */
  handleDeviceError(error: Error | string, context?: {
    deviceId?: string;
    deviceName?: string;
    operation?: string;
  }): HardwareError {
    return this.handleError(error, {
      type: 'device',
      code: 'DEVICE_ERROR',
      ...context
    });
  }

  /**
   * Get error metrics and statistics
   */
  getMetrics(): ErrorMetrics {
    const errorsByType: Record<string, number> = {};

    this.errors.forEach(error => {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
    });

    return {
      totalErrors: this.errors.length,
      errorsByType,
      recentErrors: this.errors.slice(-10), // Last 10 errors
      lastErrorTime: this.errors.length > 0
        ? this.errors[this.errors.length - 1].timestamp
        : null
    };
  }

  /**
   * Get recent errors by type
   */
  getRecentErrorsByType(type: HardwareError['type'], limit = 5): HardwareError[] {
    return this.errors
      .filter(error => error.type === type)
      .slice(-limit);
  }

  /**
   * Check if error indicates need for user action
   */
  requiresUserAction(error: HardwareError): boolean {
    switch (error.type) {
      case 'compatibility':
        return true; // User needs to switch browser or enable HTTPS
      case 'connection':
        return error.code === 'NO_DEVICES_AVAILABLE' ||
               error.code === 'HTTPS_REQUIRED';
      default:
        return false;
    }
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(error: HardwareError): string {
    switch (error.type) {
      case 'compatibility':
        if (error.message.includes('HTTPS')) {
          return 'Hardware controllers require HTTPS. Please use a secure connection.';
        }
        if (error.message.includes('not supported')) {
          return 'Your browser doesn\'t support Web MIDI. Try Chrome, Firefox, or Edge.';
        }
        return 'Browser compatibility issue detected.';

      case 'connection':
        if (error.message.includes('No MIDI devices')) {
          return 'No hardware controllers detected. Check device connections.';
        }
        if (error.message.includes('Failed to connect')) {
          return 'Failed to connect to hardware controller.';
        }
        return 'Hardware connection problem.';

      case 'midi':
        return 'MIDI communication error occurred.';

      case 'device':
        return `Device error: ${error.message}`;

      default:
        return 'Hardware system error occurred.';
    }
  }

  /**
   * Clear all stored errors
   */
  clearErrors(): void {
    this.errors = [];
    this.emit('errorsCleared');
  }

  /**
   * Add error event listener
   */
  addEventListener(event: 'error' | 'errorsCleared', callback: (error?: HardwareError) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * Remove error event listener
   */
  removeEventListener(event: 'error' | 'errorsCleared', callback: (error?: HardwareError) => void): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Log error following existing console logging patterns
   */
  private logError(error: HardwareError): void {
    const prefix = '[HardwareError]';
    const timestamp = new Date(error.timestamp).toISOString();

    console.error(`${prefix} ${error.type.toUpperCase()}: ${error.message}`, {
      code: error.code,
      timestamp,
      context: error.context,
      ...(error.originalError && {
        originalError: {
          message: error.originalError.message,
          stack: error.originalError.stack
        }
      })
    });

    // Additional development logging
    if (typeof window !== 'undefined' && (window as any).__DEV__) {
      console.group(`🔧 ${prefix} Development Details`);
      console.error('Full Error Object:', error);
      if (error.originalError) {
        console.error('Original Error:', error.originalError);
      }
      console.error('Context:', error.context);
      console.groupEnd();
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data?: any): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * Get error statistics for debugging
   */
  getDebugInfo(): string {
    const metrics = this.getMetrics();
    const lines = [
      '=== Hardware Error Handler Debug Info ===',
      `Total Errors: ${metrics.totalErrors}`,
      `Error Types: ${Object.entries(metrics.errorsByType)
        .map(([type, count]) => `${type}(${count})`)
        .join(', ')}`,
      `Last Error: ${metrics.lastErrorTime
        ? new Date(metrics.lastErrorTime).toISOString()
        : 'None'}`,
      '',
      'Recent Errors:',
      ...metrics.recentErrors.map((error, index) =>
        `${index + 1}. [${error.type}] ${error.code}: ${error.message}`
      )
    ];

    return lines.join('\n');
  }
}

// Singleton instance
export const hardwareErrorHandler = new HardwareErrorHandler();