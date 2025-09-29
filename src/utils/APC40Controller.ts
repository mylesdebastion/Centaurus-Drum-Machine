/**
 * APC40 MIDI Controller for IsometricSequencer Integration
 *
 * Provides bidirectional control between APC40 hardware and the 3D sequencer:
 * - Hardware button presses update sequencer pattern
 * - Sequencer pattern changes update APC40 LEDs
 * - Synchronized playhead visualization
 *
 * Based on research from: research/APC40 LED Control for Web-based Drum Sequencers.md
 * Adapted from working demo: public/apc40-demo.html
 */

export interface APC40Config {
  colorMode: 'spectrum' | 'chromatic' | 'harmonic';
  connected: boolean;
  deviceName?: string;
}

export interface APC40ButtonEvent {
  lane: number;  // 0-4 (5 rows mapped to chromatic lanes)
  step: number;  // 0-7 (8 columns mapped to first 8 steps)
  velocity: number;
}

export type APC40ButtonHandler = (event: APC40ButtonEvent) => void;

export class APC40Controller {
  private input: WebMIDI.MIDIInput | null = null;
  private output: WebMIDI.MIDIOutput | null = null;
  private midiAccess: WebMIDI.MIDIAccess | null = null;
  private connected = false;

  // State management for LED optimization
  private ledStates = new Map<string, number>();
  private updateQueue: Array<{ note: number; color: number; animationType?: number }> = [];
  private isProcessingQueue = false;

  // Configuration
  private config: APC40Config = {
    colorMode: 'spectrum',
    connected: false
  };

  // Event handlers
  private onButtonPress?: APC40ButtonHandler;
  private onButtonRelease?: APC40ButtonHandler;
  private onConnectionChange?: (connected: boolean) => void;

  constructor() {
    this.initializeEventHandlers();
  }

  /**
   * Initialize event handlers for graceful cleanup
   */
  private initializeEventHandlers(): void {
    // Handle page unload
    window.addEventListener('beforeunload', () => {
      this.disconnect();
    });
  }

  /**
   * Connect to APC40 hardware
   */
  async connect(): Promise<boolean> {
    try {
      if (!navigator.requestMIDIAccess) {
        throw new Error('Web MIDI API not supported in this browser');
      }

      this.midiAccess = await navigator.requestMIDIAccess({ sysex: true });

      // Find APC40 output
      for (const output of this.midiAccess.outputs.values()) {
        if (this.isAPC40Port(output.name)) {
          this.output = output;
          this.config.deviceName = output.name;
          console.log('🎛️ Found APC40 output:', output.name);
          break;
        }
      }

      // Find APC40 input
      for (const input of this.midiAccess.inputs.values()) {
        if (this.isAPC40Port(input.name)) {
          this.input = input;
          input.onmidimessage = this.handleMIDIMessage.bind(this);
          console.log('🎛️ Found APC40 input:', input.name);
          break;
        }
      }

      if (this.output && this.input) {
        await this.initializeDevice();
        this.connected = true;
        this.config.connected = true;
        this.notifyConnectionChange(true);
        return true;
      } else {
        throw new Error('APC40 not found. Please connect your APC40 and try again.');
      }
    } catch (error) {
      console.error('🚫 APC40 connection failed:', error);
      this.connected = false;
      this.config.connected = false;
      this.notifyConnectionChange(false);
      throw error;
    }
  }

  /**
   * Initialize APC40 device settings
   */
  private async initializeDevice(): Promise<void> {
    if (!this.output) return;

    // Switch to Ableton Live Mode (Mode 1) for full LED control
    const modeSwitch = [0xF0, 0x47, 0x7F, 0x29, 0x60, 0x00, 0x04, 0x41, 0x09, 0x07, 0x01, 0xF7];

    try {
      this.output.send(modeSwitch);
      console.log('🎛️ APC40 mode switch sent (Ableton Live Mode)');
    } catch (e) {
      console.log('⚠️ Mode switch may not be supported on this device');
    }

    // Small delay for mode switching
    await new Promise(resolve => setTimeout(resolve, 100));

    // Clear all LEDs initially
    this.clearAllLEDs();
  }

  /**
   * Check if MIDI port belongs to APC40
   */
  private isAPC40Port(portName?: string): boolean {
    if (!portName) return false;

    const apc40Names = [
      'APC40',
      'Akai APC40',
      'apc40'
    ];

    return apc40Names.some(name =>
      portName.toLowerCase().includes(name.toLowerCase())
    );
  }

  /**
   * Handle incoming MIDI messages from APC40
   */
  private handleMIDIMessage = (event: WebMIDI.MIDIMessageEvent): void => {
    const [command, note, velocity] = event.data;

    if (command === 0x90 && velocity > 0) {
      // Button press
      const buttonEvent = this.noteToButtonEvent(note, velocity);
      if (buttonEvent && this.onButtonPress) {
        this.onButtonPress(buttonEvent);
      }
    } else if (command === 0x80 || (command === 0x90 && velocity === 0)) {
      // Button release
      const buttonEvent = this.noteToButtonEvent(note, 0);
      if (buttonEvent && this.onButtonRelease) {
        this.onButtonRelease(buttonEvent);
      }
    }
  };

  /**
   * Convert MIDI note to button event
   * Maps APC40's 5x8 grid to IsometricSequencer lanes and steps
   */
  private noteToButtonEvent(note: number, velocity: number): APC40ButtonEvent | null {
    // APC40 clip launch grid: notes 0x00-0x27 (0-39)
    // 5 rows × 8 columns layout

    if (note < 0x00 || note > 0x27) {
      return null; // Outside clip launch grid
    }

    // Calculate row and column from MIDI note
    const row = Math.floor(note / 8);    // 0-4 (top to bottom on hardware)
    const column = note % 8;             // 0-7 (left to right on hardware)

    // Map to IsometricSequencer coordinates with FLIPPED MAPPING:
    // - Hardware row 0 (top) → lane 4 (rightmost/highest frequency in 3D)
    // - Hardware row 4 (bottom) → lane 0 (leftmost/lowest frequency in 3D, RED)
    // - This ensures red (lowest freq) is on bottom APC40 row, matching 3D viz leftmost lane
    const flippedLane = 4 - row; // Flip the row mapping

    return {
      lane: flippedLane,
      step: column,
      velocity
    };
  }

  /**
   * Convert lane/step to APC40 MIDI note
   */
  private buttonEventToNote(lane: number, step: number): number | null {
    if (lane < 0 || lane > 4 || step < 0 || step > 7) {
      return null;
    }

    // Apply the same flipped mapping: lane 0 (red, leftmost in 3D) → row 4 (bottom on APC40)
    const flippedRow = 4 - lane;
    return flippedRow * 8 + step;
  }

  /**
   * Update sequencer pattern on APC40 LEDs
   *
   * @param pattern - Boolean array [lane][step] indicating active notes
   * @param currentStep - Current playback step (0-15, but only 0-7 visible on APC40)
   * @param isPlaying - Whether sequencer is playing
   * @param boomwhackerColors - Array of hex colors for each chromatic lane
   * @param activeLanes - Currently visible/active lanes in the sequencer
   */
  updateSequencerLEDs(
    pattern: boolean[][],
    currentStep: number,
    isPlaying: boolean,
    boomwhackerColors: string[],
    activeLanes?: number[]
  ): void {
    if (!this.connected || !this.output) return;

    // Only show first 8 steps on APC40 (8 columns)
    const visibleSteps = 8;

    // Update each position in the 5x8 grid
    for (let lane = 0; lane < 5; lane++) {
      for (let step = 0; step < visibleSteps; step++) {
        const note = this.buttonEventToNote(lane, step);
        if (note === null) continue;

        let color: number;

        if (step === currentStep && isPlaying) {
          // Timeline indicator - bright white
          color = this.LED_COLORS.YELLOW; // Use YELLOW for timeline (shows as bright white)
        } else if (pattern[lane] && pattern[lane][step]) {
          // Active note - use color mode
          color = this.getAPC40Color(lane, 100, this.config.colorMode, boomwhackerColors);
        } else {
          // Inactive - off
          color = this.LED_COLORS.OFF;
        }

        this.setLED(note, color);
      }
    }
  }

  /**
   * Get APC40 LED color based on lane and color mode
   * Adapted from working demo's color mapping
   */
  private getAPC40Color(
    lane: number,
    velocity: number,
    mode: 'spectrum' | 'chromatic' | 'harmonic',
    boomwhackerColors?: string[]
  ): number {
    switch (mode) {
      case 'spectrum':
        // Frequency-based spectrum: 0=low freq (red), 4=high freq (violet)
        // This matches 3D viz where leftmost lane (0) is red, rightmost lane (4) is violet
        const spectrumColors = [
          this.LED_COLORS.RAINBOW.RED,      // Lane 0: lowest frequency (red, bottom APC40 row)
          this.LED_COLORS.RAINBOW.ORANGE,   // Lane 1
          this.LED_COLORS.RAINBOW.GREEN,    // Lane 2: mid frequency
          this.LED_COLORS.RAINBOW.BLUE,     // Lane 3
          this.LED_COLORS.RAINBOW.VIOLET,   // Lane 4: highest frequency (violet, top APC40 row)
        ];
        return spectrumColors[lane] || this.LED_COLORS.GREEN;

      case 'chromatic':
        // Map to chromatic scale colors
        const chromaticColors = [
          this.LED_COLORS.RAINBOW.RED,         // C
          this.LED_COLORS.RAINBOW.RED_ORANGE,  // C#
          this.LED_COLORS.RAINBOW.ORANGE,      // D
          this.LED_COLORS.RAINBOW.YELLOW,      // D#
          this.LED_COLORS.RAINBOW.GREEN,       // E
        ];
        return chromaticColors[lane] || this.LED_COLORS.GREEN;

      case 'harmonic':
        // Circle of fifths progression
        const harmonicColors = [
          this.LED_COLORS.RAINBOW.RED,         // Warm
          this.LED_COLORS.RAINBOW.ORANGE,
          this.LED_COLORS.RAINBOW.YELLOW,
          this.LED_COLORS.RAINBOW.GREEN,
          this.LED_COLORS.RAINBOW.CYAN,        // Cool
        ];
        return harmonicColors[lane] || this.LED_COLORS.GREEN;

      default:
        // Velocity-based fallback
        if (velocity > 100) return this.LED_COLORS.RED;
        else if (velocity > 70) return this.LED_COLORS.ORANGE;
        else return this.LED_COLORS.GREEN;
    }
  }

  /**
   * Set LED color for specific note
   */
  private setLED(note: number, color: number, animationType: number = 0): void {
    if (!this.output || !this.connected) return;

    const key = `${note}-${animationType}`;
    if (this.ledStates.get(key) === color) return; // Skip if already set

    this.ledStates.set(key, color);
    this.queueLEDUpdate(note, color, animationType);
  }

  /**
   * Queue LED update for batch processing
   */
  private queueLEDUpdate(note: number, color: number, animationType: number): void {
    this.updateQueue.push({ note, color, animationType });

    if (!this.isProcessingQueue) {
      this.processUpdateQueue();
    }
  }

  /**
   * Process LED update queue in batches
   */
  private async processUpdateQueue(): Promise<void> {
    this.isProcessingQueue = true;

    while (this.updateQueue.length > 0) {
      // Process in batches to prevent MIDI overflow
      const batch = this.updateQueue.splice(0, 8);

      batch.forEach(({ note, color, animationType }) => {
        const channel = animationType;
        try {
          this.output?.send([0x90 | channel, note, color]);
        } catch (e) {
          console.error('🚫 Failed to send MIDI:', e);
        }
      });

      // Small delay to prevent buffer overflow
      await new Promise(resolve => setTimeout(resolve, 5));
    }

    this.isProcessingQueue = false;
  }

  /**
   * Clear all LEDs
   */
  clearAllLEDs(): void {
    if (!this.output || !this.connected) return;

    // Clear clip launch grid (notes 0x00-0x27)
    for (let note = 0x00; note <= 0x27; note++) {
      this.setLED(note, this.LED_COLORS.OFF);
    }
  }

  /**
   * Set color mode
   */
  setColorMode(mode: 'spectrum' | 'chromatic' | 'harmonic'): void {
    this.config.colorMode = mode;
  }

  /**
   * Set button press handler
   */
  setButtonPressHandler(handler: APC40ButtonHandler): void {
    this.onButtonPress = handler;
  }

  /**
   * Set button release handler
   */
  setButtonReleaseHandler(handler: APC40ButtonHandler): void {
    this.onButtonRelease = handler;
  }

  /**
   * Set connection change handler
   */
  setConnectionChangeHandler(handler: (connected: boolean) => void): void {
    this.onConnectionChange = handler;
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get current configuration
   */
  getConfig(): APC40Config {
    return { ...this.config };
  }

  /**
   * Disconnect from APC40
   */
  disconnect(): void {
    if (this.input) {
      this.input.onmidimessage = null;
    }

    this.clearAllLEDs();
    this.connected = false;
    this.config.connected = false;
    this.input = null;
    this.output = null;
    this.notifyConnectionChange(false);
  }

  /**
   * Notify connection change
   */
  private notifyConnectionChange(connected: boolean): void {
    if (this.onConnectionChange) {
      this.onConnectionChange(connected);
    }
  }

  /**
   * LED color constants from working demo
   */
  private readonly LED_COLORS = {
    OFF: 0,
    GREEN: 1,
    GREEN_BLINK: 2,
    RED: 3,
    RED_BLINK: 4,
    ORANGE: 5,
    ORANGE_BLINK: 6,
    YELLOW: 7,
    WHITE: 6,
    BLUE: 45,
    CYAN: 14,
    MAGENTA: 53,
    PURPLE: 10,
    RAINBOW: {
      RED: 5,
      RED_ORANGE: 9,
      ORANGE: 61,
      YELLOW: 13,
      GREEN: 21,
      CYAN: 33,
      BLUE: 45,
      VIOLET: 49
    }
  } as const;
}

// Extend global Window interface for WebSocket bridge
declare global {
  interface Window {
    wledBridge?: WebSocket | null;
  }
}