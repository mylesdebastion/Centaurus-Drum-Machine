/**
 * MIDI Input Manager
 *
 * Singleton class for managing Web MIDI API integration.
 * Handles device enumeration, MIDI message parsing, and event distribution.
 */

export interface MIDIDevice {
  id: string;
  name: string;
  manufacturer: string;
  state: 'connected' | 'disconnected';
}

export interface MIDINoteMessage {
  type: 'noteOn' | 'noteOff';
  note: number;      // MIDI note number (0-127)
  velocity: number;  // 0-127
  timestamp: number;
}

export interface MIDIControlChangeMessage {
  type: 'controlChange';
  controller: number; // CC number (0-127)
  value: number;      // 0-127
  timestamp: number;
}

export type MIDIMessage = MIDINoteMessage | MIDIControlChangeMessage;

export type MIDIMessageListener = (message: MIDIMessage) => void;

export class MIDIInputManager {
  private static instance: MIDIInputManager;
  private midiAccess: WebMidi.MIDIAccess | null = null;
  private activeInput: WebMidi.MIDIInput | null = null;
  private listeners: Set<MIDIMessageListener> = new Set();
  private keyboardFallbackEnabled: boolean = false;
  private isInitialized: boolean = false;
  private activeNotes: Set<number> = new Set(); // Track currently playing notes

  private constructor() {
    console.log('[MIDIInputManager] Constructor called');
  }

  public static getInstance(): MIDIInputManager {
    if (!MIDIInputManager.instance) {
      MIDIInputManager.instance = new MIDIInputManager();
    }
    return MIDIInputManager.instance;
  }

  /**
   * Initialize Web MIDI API
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[MIDIInputManager] Already initialized');
      return;
    }

    try {
      console.log('[MIDIInputManager] Requesting MIDI access...');
      this.midiAccess = await navigator.requestMIDIAccess();
      this.isInitialized = true;
      console.log('[MIDIInputManager] ✅ MIDI access granted');

      // Listen for device state changes (connect/disconnect)
      this.midiAccess.onstatechange = this.handleDeviceStateChange;

      // Log available devices
      const devices = this.getDevices();
      console.log(`[MIDIInputManager] Found ${devices.length} MIDI input devices:`, devices);
    } catch (error) {
      console.warn('[MIDIInputManager] ⚠️ Web MIDI API not available:', error);
      console.warn('[MIDIInputManager] Falling back to keyboard input mode');
      this.isInitialized = false;
    }
  }

  /**
   * Get list of available MIDI input devices
   */
  public getDevices(): MIDIDevice[] {
    if (!this.midiAccess) return [];

    const devices: MIDIDevice[] = [];
    this.midiAccess.inputs.forEach((input) => {
      devices.push({
        id: input.id || '',
        name: input.name || 'Unknown Device',
        manufacturer: input.manufacturer || 'Unknown',
        state: input.state === 'connected' ? 'connected' : 'disconnected',
      });
    });

    return devices;
  }

  /**
   * Select and activate a MIDI input device
   */
  public selectDevice(deviceId: string): void {
    if (!this.midiAccess) {
      console.error('[MIDIInputManager] Cannot select device: MIDI not initialized');
      return;
    }

    const input = this.midiAccess.inputs.get(deviceId);
    if (!input) {
      console.error(`[MIDIInputManager] Device not found: ${deviceId}`);
      return;
    }

    // Disconnect previous device
    if (this.activeInput) {
      this.activeInput.onmidimessage = null;
      console.log('[MIDIInputManager] Disconnected previous device');
    }

    // Connect new device
    this.activeInput = input;
    this.activeInput.onmidimessage = this.handleMIDIMessage;
    console.log(`[MIDIInputManager] ✅ Connected to: ${input.name}`);
  }

  /**
   * Get the currently active device ID
   */
  public getActiveDeviceId(): string | null {
    return this.activeInput?.id || null;
  }

  /**
   * Handle incoming MIDI messages
   */
  private handleMIDIMessage = (event: WebMidi.MIDIMessageEvent): void => {
    const [status, data1, data2] = event.data;
    const messageType = status & 0xF0; // Upper 4 bits = message type
    // const channel = status & 0x0F;  // Lower 4 bits = channel (unused for now)

    // Note On (0x90)
    if (messageType === 0x90 && data2 > 0) {
      const message: MIDINoteMessage = {
        type: 'noteOn',
        note: data1,
        velocity: data2,
        timestamp: event.timeStamp,
      };
      this.activeNotes.add(data1);
      this.notifyListeners(message);
      console.log(`[MIDIInputManager] Note ON: ${data1} (velocity: ${data2})`);
    }
    // Note Off (0x80) or Note On with velocity 0
    else if (messageType === 0x80 || (messageType === 0x90 && data2 === 0)) {
      const message: MIDINoteMessage = {
        type: 'noteOff',
        note: data1,
        velocity: 0,
        timestamp: event.timeStamp,
      };
      this.activeNotes.delete(data1);
      this.notifyListeners(message);
      console.log(`[MIDIInputManager] Note OFF: ${data1}`);
    }
    // Control Change (0xB0)
    else if (messageType === 0xB0) {
      const message: MIDIControlChangeMessage = {
        type: 'controlChange',
        controller: data1,
        value: data2,
        timestamp: event.timeStamp,
      };
      this.notifyListeners(message);
      console.log(`[MIDIInputManager] CC: ${data1} = ${data2}`);
    }
  };

  /**
   * Handle device state changes (connect/disconnect)
   */
  private handleDeviceStateChange = (event: WebMidi.MIDIConnectionEvent): void => {
    const port = event.port;
    console.log(`[MIDIInputManager] Device ${port.state}: ${port.name}`);

    // If the active device disconnected, clear it
    if (this.activeInput?.id === port.id && port.state === 'disconnected') {
      this.activeInput = null;
      console.warn('[MIDIInputManager] Active device disconnected');
    }
  };

  /**
   * Add a listener for MIDI messages
   */
  public addListener(listener: MIDIMessageListener): void {
    this.listeners.add(listener);
    console.log(`[MIDIInputManager] Listener added (total: ${this.listeners.size})`);
  }

  /**
   * Remove a listener
   */
  public removeListener(listener: MIDIMessageListener): void {
    this.listeners.delete(listener);
    console.log(`[MIDIInputManager] Listener removed (total: ${this.listeners.size})`);
  }

  /**
   * Notify all listeners of a MIDI message
   */
  private notifyListeners(message: MIDIMessage): void {
    this.listeners.forEach((listener) => {
      try {
        listener(message);
      } catch (error) {
        console.error('[MIDIInputManager] Error in listener:', error);
      }
    });

    // Integrate with FrequencySourceManager (if available)
    if (message.type === 'noteOn' || message.type === 'noteOff') {
      this.integrateWithFrequencySource(message);
    }

    // Integrate with audioEngine (if available)
    this.integrateWithAudioEngine(message);
  }

  /**
   * Integration with FrequencySourceManager (Story 4.1)
   */
  private integrateWithFrequencySource(message: MIDINoteMessage): void {
    const frequencySourceManager = (window as any).frequencySourceManager;
    if (!frequencySourceManager) return;

    if (message.type === 'noteOn') {
      const velocity = message.velocity / 127; // Normalize to 0-1
      frequencySourceManager.addMidiNote(message.note, velocity);
    }
  }

  /**
   * Integration with Tone.js audioEngine (for playback)
   * Default instrument: piano (can be extended for guitar/other instruments)
   */
  private integrateWithAudioEngine(message: MIDIMessage): void {
    const audioEngineInstance = (window as any).audioEngine;
    if (!audioEngineInstance) return;

    if (message.type === 'noteOn') {
      const velocity = message.velocity / 127; // Normalize to 0-1
      // Default to piano synth (can be made configurable later)
      audioEngineInstance.triggerPianoNoteOn(message.note, velocity);
    } else if (message.type === 'noteOff') {
      audioEngineInstance.triggerPianoNoteOff(message.note);
    }
  }

  /**
   * Enable keyboard fallback mode (QWERTY → MIDI)
   * Useful for testing without MIDI hardware
   */
  public enableKeyboardFallback(): void {
    if (this.keyboardFallbackEnabled) return;

    this.keyboardFallbackEnabled = true;
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    console.log('[MIDIInputManager] ✅ Keyboard fallback mode enabled');
  }

  /**
   * Disable keyboard fallback mode
   */
  public disableKeyboardFallback(): void {
    if (!this.keyboardFallbackEnabled) return;

    this.keyboardFallbackEnabled = false;
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    console.log('[MIDIInputManager] Keyboard fallback mode disabled');
  }

  /**
   * Handle keyboard keydown (for fallback mode)
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.keyboardFallbackEnabled || event.repeat) return;

    const note = this.keyToMIDINote(event.key);
    if (note === null) return;

    // Don't trigger if already playing
    if (this.activeNotes.has(note)) return;

    const message: MIDINoteMessage = {
      type: 'noteOn',
      note,
      velocity: 100,
      timestamp: performance.now(),
    };
    this.activeNotes.add(note);
    this.notifyListeners(message);
  };

  /**
   * Handle keyboard keyup (for fallback mode)
   */
  private handleKeyUp = (event: KeyboardEvent): void => {
    if (!this.keyboardFallbackEnabled) return;

    const note = this.keyToMIDINote(event.key);
    if (note === null) return;

    const message: MIDINoteMessage = {
      type: 'noteOff',
      note,
      velocity: 0,
      timestamp: performance.now(),
    };
    this.activeNotes.delete(note);
    this.notifyListeners(message);
  };

  /**
   * Map QWERTY keyboard keys to MIDI notes
   * Layout: A-K = white keys, W-U = black keys (one octave starting at C4)
   */
  private keyToMIDINote(key: string): number | null {
    const keyMap: { [key: string]: number } = {
      // White keys (C4-C5)
      'a': 60, // C4 (middle C)
      's': 62, // D4
      'd': 64, // E4
      'f': 65, // F4
      'g': 67, // G4
      'h': 69, // A4
      'j': 71, // B4
      'k': 72, // C5

      // Black keys (C#4-A#4)
      'w': 61, // C#4
      'e': 63, // D#4
      't': 66, // F#4
      'y': 68, // G#4
      'u': 70, // A#4

      // Lower octave (C3-C4)
      'z': 48, // C3
      'x': 50, // D3
      'c': 52, // E3
      'v': 53, // F3
      'b': 55, // G3
      'n': 57, // A3
      'm': 59, // B3
    };

    return keyMap[key.toLowerCase()] ?? null;
  }

  /**
   * Get currently active notes
   */
  public getActiveNotes(): Set<number> {
    return new Set(this.activeNotes); // Return a copy
  }

  /**
   * Check if MIDI is initialized
   */
  public isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Dispose and cleanup
   */
  public dispose(): void {
    if (this.activeInput) {
      this.activeInput.onmidimessage = null;
      this.activeInput = null;
    }

    if (this.midiAccess) {
      this.midiAccess.onstatechange = null;
      this.midiAccess = null;
    }

    this.disableKeyboardFallback();
    this.listeners.clear();
    this.activeNotes.clear();
    this.isInitialized = false;

    console.log('[MIDIInputManager] Disposed');
  }
}

// Export singleton instance
export const midiInputManager = MIDIInputManager.getInstance();
