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
  rotated: boolean; // Rotate 90° to match 3D viz orientation
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
  private input: MIDIInput | null = null;
  private output: MIDIOutput | null = null;
  private midiAccess: MIDIAccess | null = null;
  private connected = false;

  // State management for LED optimization
  private ledStates = new Map<string, number>();
  private updateQueue: Array<{ note: number; color: number; animationType?: number }> = [];
  private isProcessingQueue = false;

  // Configuration
  private config: APC40Config = {
    colorMode: 'spectrum',
    rotated: false,
    connected: false
  };

  // Pagination state for 16-step sequencer (8 steps per page)
  private currentPage = 0; // 0 = steps 0-7, 1 = steps 8-15
  private autoPageSwitch = true; // Automatically switch pages during playback

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
        if (output.name && this.isAPC40Port(output.name)) {
          this.output = output;
          this.config.deviceName = output.name;
          console.log('🎛️ Found APC40 output:', output.name);
          break;
        }
      }

      // Find APC40 input
      for (const input of this.midiAccess.inputs.values()) {
        if (input.name && this.isAPC40Port(input.name)) {
          this.input = input;
          input.onmidimessage = this.handleMIDIMessage.bind(this);
          console.log('🎛️ Found APC40 input:', input.name);
          console.log('🎛️ MIDI message handler attached successfully');
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
  private handleMIDIMessage = (event: MIDIMessageEvent): void => {
    // First - log that we received ANY MIDI message at all
    if (!event.data) return;
    console.log('🎛️ RAW MIDI received:', Array.from(event.data));

    const [command, data1, data2] = event.data;
    const channel = command & 0x0F;
    const messageType = command & 0xF0;

    // Debug: log ALL incoming MIDI messages with detailed breakdown
    const messageTypeName = {
      0x80: 'Note Off',
      0x90: 'Note On',
      0xB0: 'Control Change',
      0xC0: 'Program Change',
      0xD0: 'Channel Pressure',
      0xE0: 'Pitch Bend'
    }[messageType] || 'Unknown';

    console.log(`🎛️ APC40 MIDI: ${messageTypeName} Ch${channel} Command=0x${command.toString(16)} Data1=${data1} (0x${data1.toString(16)}) Data2=${data2}`);

    // Handle Note On/Off messages (main grid pads)
    if (messageType === 0x90 && data2 > 0) {
      // Button press

      // Check for Bank Select button presses (page switching)
      // Based on official APC40 MIDI specification
      if (data1 === 0x34 && data2 > 0) {
        // Bank Left (note 52/0x34) - previous page
        console.log(`🎛️ Bank Left pressed (note ${data1}) - switching to previous page`);
        const newPage = Math.max(0, this.currentPage - 1);
        this.setPage(newPage);
        this.autoPageSwitch = false;
        return;
      } else if (data1 === 0x35 && data2 > 0) {
        // Bank Right (note 53/0x35) - next page
        console.log(`🎛️ Bank Right pressed (note ${data1}) - switching to next page`);
        const newPage = Math.min(1, this.currentPage + 1);
        this.setPage(newPage);
        this.autoPageSwitch = false;
        return;
      } else if (data1 === 0x32 && data2 > 0) {
        // Bank Up (note 50/0x32) - could be used for other functions
        console.log(`🎛️ Bank Up pressed (note ${data1})`);
        return;
      } else if (data1 === 0x33 && data2 > 0) {
        // Bank Down (note 51/0x33) - could be used for other functions
        console.log(`🎛️ Bank Down pressed (note ${data1})`);
        return;
      }

      // Check for scene button presses (alternative page switching)
      if (data1 === 0x52 && data2 > 0) {
        // Scene button 1 - switch to page 0 (steps 0-7)
        console.log('🎛️ Scene button 1 pressed - switching to page 0');
        this.setPage(0);
        this.autoPageSwitch = false;
        return;
      } else if (data1 === 0x53 && data2 > 0) {
        // Scene button 2 - switch to page 1 (steps 8-15)
        console.log('🎛️ Scene button 2 pressed - switching to page 1');
        this.setPage(1);
        this.autoPageSwitch = false;
        return;
      }

      const buttonEvent = this.noteToButtonEvent(data1, data2);
      if (buttonEvent && this.onButtonPress) {
        this.onButtonPress(buttonEvent);
      }
    } else if (messageType === 0x80 || (messageType === 0x90 && data2 === 0)) {
      // Button release
      const buttonEvent = this.noteToButtonEvent(data1, 0);
      if (buttonEvent && this.onButtonRelease) {
        this.onButtonRelease(buttonEvent);
      }
    } else if (messageType === 0xB0) {
      // Control Change messages (knobs, faders, other controls)
      console.log(`🎛️ Control Change: CC${data1} = ${data2} (channel ${channel})`);

      // Check if CC messages are used for bank select
      if (data1 === 47 && data2 > 63) {
        // CC 47 high value might be bank select right
        console.log('🎛️ Possible Bank Select Right via CC47');
        const newPage = Math.min(1, this.currentPage + 1);
        this.setPage(newPage);
        this.autoPageSwitch = false;
      } else if (data1 === 47 && data2 < 64) {
        // CC 47 low value might be bank select left
        console.log('🎛️ Possible Bank Select Left via CC47');
        const newPage = Math.max(0, this.currentPage - 1);
        this.setPage(newPage);
        this.autoPageSwitch = false;
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
    const row = Math.floor(note / 8);    // 0-4 (BOTTOM to TOP on hardware - row 0 is BOTTOM!)
    const column = note % 8;             // 0-7 (left to right on hardware)

    if (this.config.rotated) {
      // Rotated 90° mode: rows become steps, columns become lanes
      // - Hardware columns (0-7 left to right) → lanes (0-7)
      // - Hardware rows (0-4 bottom to top) → steps (0-4)
      // Now using all 8 columns for 8 lanes (was limited to 5)

      return {
        lane: column, // Columns become lanes (0-7 for 8 lanes)
        step: row + (this.currentPage * 8), // Rows become steps (5 rows visible at once)
        velocity
      };
    } else {
      // Normal mode: Map to IsometricSequencer coordinates
      // - Hardware row 0 (BOTTOM) → lane 0 (leftmost/lowest frequency in 3D, RED)
      // - Hardware row 4 (TOP) → lane 4 (rightmost/highest frequency in 3D, VIOLET)
      // - This ensures red (lowest freq) is on BOTTOM APC40 row (row 0), matching 3D viz leftmost lane
      const lane = row; // Direct mapping - no flip needed since row 0 is already bottom

      return {
        lane: lane,
        step: column + (this.currentPage * 8), // Add page offset to step
        velocity
      };
    }
  }

  /**
   * Convert lane/step to APC40 MIDI note
   */
  private buttonEventToNote(lane: number, step: number): number | null {
    // In rotated mode, we support 8 lanes (0-7); in normal mode, 5 lanes (0-4)
    const maxLane = this.config.rotated ? 7 : 4;

    if (lane < 0 || lane > maxLane || step < 0 || step > 15) {
      return null;
    }

    // Convert step to current page display (only show 8 steps at a time)
    const pageStep = step % 8;
    const stepPage = Math.floor(step / 8);

    // Only show steps that are on the current page
    if (stepPage !== this.currentPage) {
      return null;
    }

    if (this.config.rotated) {
      // Rotated mode: lanes are columns, steps are rows
      const column = lane; // Lane becomes column
      const row = pageStep; // Step becomes row
      return row * 8 + column;
    } else {
      // Normal mode: lanes are rows, steps are columns
      // Direct mapping: lane 0 (red, leftmost in 3D) → row 0 (bottom on APC40)
      const row = lane;
      return row * 8 + pageStep;
    }
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

    // Auto-switch pages based on current step during playback
    if (this.autoPageSwitch && isPlaying) {
      const requiredPage = Math.floor(currentStep / 8);
      if (requiredPage !== this.currentPage) {
        this.currentPage = requiredPage;
      }
    }

    // Calculate the step offset for the current page
    const pageOffset = this.currentPage * 8;
    const visibleSteps = 8;

    // In rotated mode, we show 8 lanes; in normal mode, 5 lanes
    const maxLane = this.config.rotated ? 8 : 5;

    // Update each position in the grid
    for (let lane = 0; lane < maxLane; lane++) {
      for (let step = 0; step < visibleSteps; step++) {
        const actualStep = step + pageOffset; // Convert to actual step in pattern
        const note = this.buttonEventToNote(lane, actualStep);
        if (note === null) continue;

        let color: number;

        if (actualStep === currentStep && isPlaying) {
          // Timeline indicator - white
          color = this.LED_COLORS.WHITE;
        } else if (pattern[lane] && pattern[lane][actualStep]) {
          // Active note - use color mode
          // Map APC40 lane to actual chromatic lane for correct color
          const chromaticLane = activeLanes ? activeLanes[lane] : lane;
          color = this.getAPC40Color(chromaticLane, 100, this.config.colorMode, boomwhackerColors);
        } else {
          // Inactive - off
          color = this.LED_COLORS.OFF;
        }

        this.setLED(note, color);
      }
    }

    // Add page indicators using the top row of scene launch buttons
    this.updatePageIndicators();
  }

  /**
   * Update page indicators using scene launch buttons and bank select buttons
   */
  private updatePageIndicators(): void {
    if (!this.connected || !this.output) return;

    // Scene launch buttons are notes 0x52-0x56 (82-86)
    // Use first two scene buttons for page indicators
    const sceneButton1 = 0x52; // Page 1 indicator (steps 0-7)
    const sceneButton2 = 0x53; // Page 2 indicator (steps 8-15)

    // Bank Select buttons based on official APC40 MIDI specification
    const bankLeft = 0x34;  // Bank Left (note 52)
    const bankRight = 0x35; // Bank Right (note 53)

    // Set page indicators on scene buttons
    this.setLED(sceneButton1, this.currentPage === 0 ? this.LED_COLORS.GREEN : this.LED_COLORS.OFF);
    this.setLED(sceneButton2, this.currentPage === 1 ? this.LED_COLORS.GREEN : this.LED_COLORS.OFF);

    // Set bank select button indicators (dim when at boundaries)
    this.setLED(bankLeft, this.currentPage > 0 ? this.LED_COLORS.ORANGE : this.LED_COLORS.OFF);
    this.setLED(bankRight, this.currentPage < 1 ? this.LED_COLORS.ORANGE : this.LED_COLORS.OFF);
  }

  /**
   * Manually switch to a specific page
   */
  setPage(page: number): void {
    if (page >= 0 && page <= 1) {
      const oldPage = this.currentPage;
      this.currentPage = page;
      console.log(`🎛️ APC40 page switched from ${oldPage} to ${this.currentPage} (steps ${this.currentPage * 8}-${this.currentPage * 8 + 7})`);
    }
  }

  /**
   * Get current page
   */
  getCurrentPage(): number {
    return this.currentPage;
  }

  /**
   * Toggle auto page switching
   */
  setAutoPageSwitch(enabled: boolean): void {
    this.autoPageSwitch = enabled;
  }

  /**
   * Get APC40 LED color based on lane and color mode
   * Adapted from working demo's color mapping
   */
  private getAPC40Color(
    lane: number,
    velocity: number,
    mode: 'spectrum' | 'chromatic' | 'harmonic',
    _boomwhackerColors?: string[]
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
        // Map to full chromatic scale colors (12 semitones)
        const chromaticColors = [
          this.LED_COLORS.RAINBOW.RED,         // C (0)
          this.LED_COLORS.RAINBOW.RED_ORANGE,  // C# (1)
          this.LED_COLORS.RAINBOW.ORANGE,      // D (2)
          this.LED_COLORS.RAINBOW.YELLOW,      // D# (3)
          this.LED_COLORS.RAINBOW.YELLOW,      // E (4) - should be yellow, not green
          this.LED_COLORS.RAINBOW.GREEN,       // F (5) - lime green
          this.LED_COLORS.RAINBOW.GREEN,       // F# (6)
          this.LED_COLORS.RAINBOW.CYAN,        // G (7) - deep green/cyan
          this.LED_COLORS.RAINBOW.CYAN,        // G# (8)
          this.LED_COLORS.RAINBOW.BLUE,        // A (9)
          this.LED_COLORS.RAINBOW.BLUE,        // A# (10)
          this.LED_COLORS.RAINBOW.VIOLET,      // B (11)
        ];
        return chromaticColors[lane % 12] || this.LED_COLORS.GREEN;

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
        const channel = animationType ?? 0;
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
   * Set rotation mode (90° to match 3D viz orientation)
   */
  setRotation(rotated: boolean): void {
    this.config.rotated = rotated;
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

// wledBridge property is declared in src/types/window.d.ts