/**
 * Web MIDI API abstraction layer
 * Handles browser Web MIDI API interactions with consistent interface
 */

import { hardwareErrorHandler } from './errorHandler';

export interface MIDIDevice {
  id: string;
  name: string;
  manufacturer: string;
  type: 'input' | 'output';
  state: 'connected' | 'disconnected';
}

export interface MIDIMessage {
  data: Uint8Array;
  timeStamp: number;
  type: 'noteon' | 'noteoff' | 'controlchange' | 'unknown';
  channel: number;
  note?: number;
  velocity?: number;
  controller?: number;
  value?: number;
}

export interface BrowserCompatibility {
  webMidiSupported: boolean;
  browserName: string;
  requiresHttps: boolean;
  hasSecureContext: boolean;
}

export class WebMIDIApiWrapper {
  private midiAccess: any = null;
  private devices: Map<string, MIDIDevice> = new Map();
  private eventListeners: Map<string, ((data: any) => void)[]> = new Map();

  /**
   * Check browser compatibility for Web MIDI API
   */
  static checkBrowserCompatibility(): BrowserCompatibility {
    const userAgent = navigator.userAgent.toLowerCase();
    const hasSecureContext = window.isSecureContext;

    // Browser detection
    let browserName = 'unknown';
    if (userAgent.includes('chrome')) browserName = 'chrome';
    else if (userAgent.includes('firefox')) browserName = 'firefox';
    else if (userAgent.includes('safari') && !userAgent.includes('chrome')) browserName = 'safari';
    else if (userAgent.includes('edge')) browserName = 'edge';

    const webMidiSupported = 'requestMIDIAccess' in navigator;
    const requiresHttps = webMidiSupported && !hasSecureContext;

    return {
      webMidiSupported,
      browserName,
      requiresHttps,
      hasSecureContext
    };
  }

  /**
   * Initialize Web MIDI API connection
   */
  async initialize(): Promise<void> {
    const compatibility = WebMIDIApiWrapper.checkBrowserCompatibility();

    if (!compatibility.webMidiSupported) {
      throw new Error(`Web MIDI API not supported in ${compatibility.browserName}`);
    }

    if (compatibility.requiresHttps) {
      throw new Error('Web MIDI API requires HTTPS or localhost');
    }

    try {
      this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
      this.setupDeviceListeners();
      this.enumerateDevices();
      console.log('[WebMIDIApi] Successfully initialized');
      this.emit('initialized');
    } catch (error) {
      const errorMessage = `Failed to initialize MIDI access: ${error instanceof Error ? error.message : 'Unknown error'}`;
      hardwareErrorHandler.handleConnectionError(error instanceof Error ? error : errorMessage, {
        operation: 'MIDI API initialization'
      });
      throw new Error(errorMessage);
    }
  }

  /**
   * Get all available MIDI devices
   */
  getDevices(): MIDIDevice[] {
    return Array.from(this.devices.values());
  }

  /**
   * Get specific device by ID
   */
  getDevice(id: string): MIDIDevice | undefined {
    return this.devices.get(id);
  }

  /**
   * Connect to a specific MIDI device
   */
  connectToDevice(deviceId: string): boolean {
    if (!this.midiAccess) {
      throw new Error('MIDI access not initialized');
    }

    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    if (device.type === 'input') {
      const input = this.midiAccess.inputs.get(deviceId);
      if (input) {
        input.onmidimessage = (event: any) => this.handleMidiMessage(event);
        this.emit('deviceConnected', device);
        return true;
      }
    }

    return false;
  }

  /**
   * Disconnect from a specific MIDI device
   */
  disconnectFromDevice(deviceId: string): void {
    if (!this.midiAccess) return;

    const device = this.devices.get(deviceId);
    if (device && device.type === 'input') {
      const input = this.midiAccess.inputs.get(deviceId);
      if (input) {
        input.onmidimessage = null;
        this.emit('deviceDisconnected', device);
      }
    }
  }

  /**
   * Send MIDI message to output device
   */
  sendMessage(deviceId: string, data: number[]): void {
    try {
      if (!this.midiAccess) {
        throw new Error('MIDI access not initialized');
      }

      const output = this.midiAccess.outputs.get(deviceId);
      if (output) {
        output.send(data);
      } else {
        throw new Error(`Output device ${deviceId} not found`);
      }
    } catch (error) {
      // Don't let MIDI output errors crash the application
      hardwareErrorHandler.handleMidiError(error instanceof Error ? error : 'MIDI output failed', {
        deviceId,
        messageType: 'outgoing',
        data: new Uint8Array(data)
      });
      throw error; // Re-throw for caller to handle
    }
  }

  /**
   * Add event listener
   */
  addEventListener(event: string, callback: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(event: string, callback: (data: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to all listeners
   */
  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * Setup device connection/disconnection listeners
   */
  private setupDeviceListeners(): void {
    if (!this.midiAccess) return;

    this.midiAccess.onstatechange = (event: any) => {
      const port = event.port;
      this.updateDevice(port);

      if (port.state === 'connected') {
        this.emit('deviceAdded', this.devices.get(port.id!));
      } else if (port.state === 'disconnected') {
        this.emit('deviceRemoved', this.devices.get(port.id!));
      }
    };
  }

  /**
   * Enumerate and catalog all MIDI devices
   */
  private enumerateDevices(): void {
    if (!this.midiAccess) return;

    // Process inputs
    this.midiAccess.inputs.forEach((input: any) => {
      this.updateDevice(input);
    });

    // Process outputs
    this.midiAccess.outputs.forEach((output: any) => {
      this.updateDevice(output);
    });
  }

  /**
   * Update device in registry
   */
  private updateDevice(port: any): void {
    const device: MIDIDevice = {
      id: port.id!,
      name: port.name || 'Unknown Device',
      manufacturer: port.manufacturer || 'Unknown',
      type: port.type as 'input' | 'output',
      state: port.state as 'connected' | 'disconnected'
    };

    this.devices.set(port.id!, device);
  }

  /**
   * Parse and handle incoming MIDI messages
   */
  private handleMidiMessage(event: any): void {
    try {
      const data = event.data;
      const message = this.parseMidiMessage(data, event.timeStamp);
      this.emit('message', message);
    } catch (error) {
      // Don't let MIDI parsing errors crash the application
      hardwareErrorHandler.handleMidiError(error instanceof Error ? error : 'MIDI message parsing failed', {
        messageType: 'incoming',
        data: event.data
      });
    }
  }

  /**
   * Parse raw MIDI data into structured message
   */
  private parseMidiMessage(data: Uint8Array, timeStamp: number): MIDIMessage {
    const status = data[0];
    const channel = (status & 0x0F) + 1;
    const command = status & 0xF0;

    let type: MIDIMessage['type'] = 'unknown';
    let note: number | undefined;
    let velocity: number | undefined;
    let controller: number | undefined;
    let value: number | undefined;

    switch (command) {
      case 0x90: // Note On
        type = 'noteon';
        note = data[1];
        velocity = data[2];
        // Velocity 0 is actually Note Off
        if (velocity === 0) {
          type = 'noteoff';
        }
        break;
      case 0x80: // Note Off
        type = 'noteoff';
        note = data[1];
        velocity = data[2];
        break;
      case 0xB0: // Control Change
        type = 'controlchange';
        controller = data[1];
        value = data[2];
        break;
    }

    return {
      data,
      timeStamp,
      type,
      channel,
      note,
      velocity,
      controller,
      value
    };
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.midiAccess) {
      this.midiAccess.inputs.forEach((input: any) => {
        input.onmidimessage = null;
      });
    }
    this.eventListeners.clear();
    this.devices.clear();
    this.midiAccess = null;
  }
}

// Singleton instance
export const webMidiApi = new WebMIDIApiWrapper();