/**
 * MIDI Output Manager
 *
 * Singleton class for managing Web MIDI API outputs.
 * Used for sending SysEx messages to devices like ROLI Piano M / LUMI Keys.
 */

export interface MIDIOutputDevice {
  id: string;
  name: string;
  manufacturer: string;
  state: 'connected' | 'disconnected';
}

export class MIDIOutputManager {
  private static instance: MIDIOutputManager;
  private midiAccess: any = null; // Using any to avoid WebMidi type conflicts
  private activeOutput: any = null;
  private isInitialized: boolean = false;

  private constructor() {
    console.log('[MIDIOutputManager] Constructor called');
  }

  public static getInstance(): MIDIOutputManager {
    if (!MIDIOutputManager.instance) {
      MIDIOutputManager.instance = new MIDIOutputManager();
    }
    return MIDIOutputManager.instance;
  }

  /**
   * Initialize Web MIDI API (with SysEx support)
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[MIDIOutputManager] Already initialized');
      return;
    }

    try {
      console.log('[MIDIOutputManager] Requesting MIDI access with SysEx...');
      // Request with sysex: true to allow SysEx messages
      this.midiAccess = await navigator.requestMIDIAccess({ sysex: true });
      this.isInitialized = true;
      console.log('[MIDIOutputManager] ✅ MIDI output access granted');

      // Listen for device state changes
      this.midiAccess.onstatechange = this.handleDeviceStateChange;

      // Log available output devices
      const devices = this.getDevices();
      console.log(`[MIDIOutputManager] Found ${devices.length} MIDI output devices:`, devices);
    } catch (error) {
      console.warn('[MIDIOutputManager] ⚠️ Web MIDI API not available:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Get list of available MIDI output devices
   */
  public getDevices(): MIDIOutputDevice[] {
    if (!this.midiAccess || !this.midiAccess.outputs) return [];

    const devices: MIDIOutputDevice[] = [];
    this.midiAccess.outputs.forEach((output: any) => {
      devices.push({
        id: output.id || '',
        name: output.name || 'Unknown Device',
        manufacturer: output.manufacturer || 'Unknown',
        state: output.state === 'connected' ? 'connected' : 'disconnected',
      });
    });

    return devices;
  }

  /**
   * Select and activate a MIDI output device
   */
  public selectDevice(deviceId: string): any {
    if (!this.midiAccess) {
      console.error('[MIDIOutputManager] Cannot select device: MIDI not initialized');
      return null;
    }

    const output = this.midiAccess.outputs.get(deviceId);
    if (!output) {
      console.error(`[MIDIOutputManager] Device not found: ${deviceId}`);
      return null;
    }

    this.activeOutput = output;
    console.log(`[MIDIOutputManager] ✅ Selected output: ${output.name}`);
    return output;
  }

  /**
   * Get the currently active output device
   */
  public getActiveOutput(): any {
    return this.activeOutput;
  }

  /**
   * Get the currently active device ID
   */
  public getActiveDeviceId(): string | null {
    return this.activeOutput?.id || null;
  }

  /**
   * Handle device state changes (connect/disconnect)
   */
  private handleDeviceStateChange = (event: WebMidi.MIDIConnectionEvent): void => {
    const port = event.port;
    console.log(`[MIDIOutputManager] Device ${port.state}: ${port.name}`);

    // If the active device disconnected, clear it
    if (this.activeOutput?.id === port.id && port.state === 'disconnected') {
      this.activeOutput = null;
      console.warn('[MIDIOutputManager] Active output device disconnected');
    }
  };

  /**
   * Check if MIDI output is initialized
   */
  public isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Dispose and cleanup
   */
  public dispose(): void {
    if (this.activeOutput) {
      this.activeOutput = null;
    }

    if (this.midiAccess) {
      this.midiAccess.onstatechange = null;
      this.midiAccess = null;
    }

    this.isInitialized = false;
    console.log('[MIDIOutputManager] Disposed');
  }
}

// Export singleton instance
export const midiOutputManager = MIDIOutputManager.getInstance();
