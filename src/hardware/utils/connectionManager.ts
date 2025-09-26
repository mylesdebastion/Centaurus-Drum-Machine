/**
 * Connection Manager
 * Handles device connection lifecycle with retry logic and error recovery
 */

import { webMidiApi, type MIDIDevice, type BrowserCompatibility } from './webMidiApi';
import { hardwareErrorHandler } from './errorHandler';

export interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error' | 'unsupported' | 'requires_https';
  device: MIDIDevice | null;
  lastError: string | null;
  reconnectAttempts: number;
  compatibility: BrowserCompatibility | null;
}

export interface ConnectionManagerOptions {
  maxReconnectAttempts: number;
  reconnectBaseDelay: number;
  reconnectMaxDelay: number;
}

export class ConnectionManager {
  private state: ConnectionState = {
    status: 'disconnected',
    device: null,
    lastError: null,
    reconnectAttempts: 0,
    compatibility: null
  };

  private options: ConnectionManagerOptions = {
    maxReconnectAttempts: 5,
    reconnectBaseDelay: 1000,
    reconnectMaxDelay: 30000
  };

  private reconnectTimeout: number | null = null;
  private eventListeners: Map<string, ((state: ConnectionState) => void)[]> = new Map();

  constructor(options?: Partial<ConnectionManagerOptions>) {
    this.options = { ...this.options, ...options };
    this.setupWebMidiListeners();
    this.checkInitialCompatibility();
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return { ...this.state };
  }

  /**
   * Initialize connection to first available device
   */
  async connect(deviceId?: string): Promise<void> {
    this.clearReconnectTimeout();

    try {
      // Check browser compatibility first
      const compatibility = (webMidiApi.constructor as any).checkBrowserCompatibility();
      this.state.compatibility = compatibility;

      if (!compatibility.webMidiSupported) {
        const error = `Web MIDI not supported in ${compatibility.browserName}`;
        hardwareErrorHandler.handleCompatibilityError(error, {
          browserName: compatibility.browserName,
          feature: 'Web MIDI API'
        });
        this.updateState({
          status: 'unsupported',
          lastError: error
        });
        return;
      }

      if (compatibility.requiresHttps) {
        const error = 'Web MIDI requires HTTPS or localhost';
        hardwareErrorHandler.handleCompatibilityError(error, {
          browserName: compatibility.browserName,
          feature: 'Secure Context'
        });
        this.updateState({
          status: 'requires_https',
          lastError: error
        });
        return;
      }

      this.updateState({ status: 'connecting', lastError: null });

      // Initialize Web MIDI API if not already done
      await webMidiApi.initialize();

      // Connect to specific device or find first available
      const device = deviceId
        ? webMidiApi.getDevice(deviceId)
        : webMidiApi.getDevices().find(d => d.type === 'input' && d.state === 'connected');

      if (!device) {
        const error = 'No MIDI devices available';
        hardwareErrorHandler.handleConnectionError(error, {
          operation: 'Device enumeration',
          reconnectAttempt: this.state.reconnectAttempts
        });
        throw new Error(error);
      }

      const connected = webMidiApi.connectToDevice(device.id);
      if (connected) {
        console.log(`[ConnectionManager] Successfully connected to ${device.name}`);
        this.updateState({
          status: 'connected',
          device,
          reconnectAttempts: 0,
          lastError: null
        });
      } else {
        const error = `Failed to connect to device: ${device.name}`;
        hardwareErrorHandler.handleConnectionError(error, {
          deviceId: device.id,
          operation: 'Device connection',
          reconnectAttempt: this.state.reconnectAttempts
        });
        throw new Error(error);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';

      // Log error but don't let it propagate to avoid affecting audio engine
      hardwareErrorHandler.handleConnectionError(errorMessage, {
        deviceId: deviceId,
        operation: 'Connection attempt',
        reconnectAttempt: this.state.reconnectAttempts
      });

      this.updateState({
        status: 'error',
        lastError: errorMessage
      });

      // Schedule reconnect if within attempt limits
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from current device
   */
  disconnect(): void {
    this.clearReconnectTimeout();

    if (this.state.device) {
      webMidiApi.disconnectFromDevice(this.state.device.id);
    }

    this.updateState({
      status: 'disconnected',
      device: null,
      lastError: null,
      reconnectAttempts: 0
    });
  }

  /**
   * Retry connection with current or specified device
   */
  async retry(deviceId?: string): Promise<void> {
    this.state.reconnectAttempts = 0;
    await this.connect(deviceId);
  }

  /**
   * Add state change listener
   */
  addEventListener(event: 'stateChange', callback: (state: ConnectionState) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove state change listener
   */
  removeEventListener(event: 'stateChange', callback: (state: ConnectionState) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Setup Web MIDI API event listeners
   */
  private setupWebMidiListeners(): void {
    webMidiApi.addEventListener('initialized', () => {
      console.log('[ConnectionManager] Web MIDI API initialized');
    });

    webMidiApi.addEventListener('deviceAdded', (device: MIDIDevice) => {
      console.log('[ConnectionManager] Device added:', device.name);

      // Auto-connect if currently disconnected and no device connected
      if (this.state.status === 'disconnected' || this.state.status === 'error') {
        this.connect(device.id);
      }
    });

    webMidiApi.addEventListener('deviceRemoved', (device: MIDIDevice) => {
      console.log('[ConnectionManager] Device removed:', device.name);

      // If current device was removed, try to reconnect
      if (this.state.device && this.state.device.id === device.id) {
        this.updateState({
          status: 'error',
          device: null,
          lastError: `Device ${device.name} was disconnected`
        });
        this.scheduleReconnect();
      }
    });

    webMidiApi.addEventListener('deviceConnected', (device: MIDIDevice) => {
      console.log('[ConnectionManager] Device connected:', device.name);
    });

    webMidiApi.addEventListener('deviceDisconnected', (device: MIDIDevice) => {
      console.log('[ConnectionManager] Device disconnected:', device.name);
    });
  }

  /**
   * Check initial browser compatibility
   */
  private checkInitialCompatibility(): void {
    const compatibility = (webMidiApi.constructor as any).checkBrowserCompatibility();
    this.state.compatibility = compatibility;

    if (!compatibility.webMidiSupported) {
      this.updateState({
        status: 'unsupported',
        lastError: `Web MIDI not supported in ${compatibility.browserName}`
      });
    } else if (compatibility.requiresHttps) {
      this.updateState({
        status: 'requires_https',
        lastError: 'Web MIDI requires HTTPS or localhost'
      });
    }
  }

  /**
   * Update connection state and notify listeners
   */
  private updateState(updates: Partial<ConnectionState>): void {
    this.state = { ...this.state, ...updates };
    this.emit('stateChange', this.state);
  }

  /**
   * Schedule automatic reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.state.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.log('[ConnectionManager] Max reconnect attempts reached');
      return;
    }

    this.state.reconnectAttempts++;

    // Exponential backoff: baseDelay * 2^(attempts-1), capped at maxDelay
    const delay = Math.min(
      this.options.reconnectBaseDelay * Math.pow(2, this.state.reconnectAttempts - 1),
      this.options.reconnectMaxDelay
    );

    console.log(`[ConnectionManager] Scheduling reconnect attempt ${this.state.reconnectAttempts} in ${delay}ms`);

    this.reconnectTimeout = window.setTimeout(() => {
      console.log(`[ConnectionManager] Attempting reconnect ${this.state.reconnectAttempts}/${this.options.maxReconnectAttempts}`);
      this.connect();
    }, delay);
  }

  /**
   * Clear pending reconnection timeout
   */
  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      window.clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.clearReconnectTimeout();
    this.eventListeners.clear();
    webMidiApi.dispose();
  }
}

// Singleton instance
export const connectionManager = new ConnectionManager();