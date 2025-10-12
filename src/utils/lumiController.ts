/**
 * LUMI Controller - Proof of Concept
 * Controls ROLI Piano M (LUMI Keys) lights via reverse-engineered SysEx
 *
 * Based on research from: benob/LUMI-lights
 * SysEx Protocol: F0 00 21 10 ... F7 (ROLI Manufacturer ID)
 *
 * IMPORTANT: This is a temporary proof of concept using reverse-engineered protocol.
 * May break with firmware updates.
 */

export interface LumiDevice {
  id: string;
  name: string;
  output: any; // WebMidi MIDIOutput
}

export class LumiController {
  private device: LumiDevice | null = null;
  private enabled: boolean = false;

  // LUMI device specifications
  private readonly KEYS_PER_BLOCK = 24; // 2 octaves
  private readonly LUMI_START_NOTE = 48; // C3 (MIDI note 48)

  // ROLI SysEx header
  private readonly ROLI_MANUFACTURER_ID = [0x00, 0x21, 0x10];
  private readonly LUMI_DEVICE_ID = 0x37;

  /**
   * Calculate checksum for SysEx message (from LUMI-lights protocol)
   */
  private calculateChecksum(bytes: number[], size: number): number {
    let c = size;
    for (const b of bytes) {
      c = (c * 3 + b) & 0xff;
    }
    return c & 0x7f;
  }

  /**
   * Encode RGB color to LUMI format (from LUMI-lights protocol)
   * @returns 5-byte color encoding
   */
  private encodeColor(r: number, g: number, b: number): number[] {
    const v1 = ((b & 0x3) << 5) | 0x4;
    const v2 = ((b >> 2) & 0x3f) | (g & 1);
    const v3 = g >> 1;
    const v4 = r & 0x7f;
    const v5 = (r >> 7) | 0x7e;
    return [v1, v2, v3, v4, v5];
  }

  /**
   * Connect to LUMI device
   * @param output WebMidi output device
   */
  connect(output: any): void {
    if (!output) {
      console.warn('[LumiController] No output device provided');
      return;
    }

    this.device = {
      id: output.id,
      name: output.name,
      output: output
    };

    console.log('[LumiController] Connected to:', output.name);

    // Clear all lights on connection
    if (this.enabled) {
      this.clearAllLights();
    }
  }

  /**
   * Disconnect from LUMI device
   */
  disconnect(): void {
    if (this.device) {
      this.clearAllLights();
      this.device = null;
      console.log('[LumiController] Disconnected');
    }
  }

  /**
   * Enable/disable LUMI light control
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;

    if (!enabled && this.device) {
      this.clearAllLights();
    }

    console.log('[LumiController] Light control:', enabled ? 'enabled' : 'disabled');
  }

  /**
   * Check if controller is ready
   */
  isReady(): boolean {
    return this.device !== null && this.enabled;
  }

  /**
   * Set color for a specific key by index
   * @param keyIndex Key index (0-23 for 24-key LUMI)
   * @param r Red (0-255)
   * @param g Green (0-255)
   * @param b Blue (0-255)
   */
  setKeyColor(keyIndex: number, r: number, g: number, b: number): void {
    if (!this.isReady()) return;
    if (keyIndex < 0 || keyIndex >= this.KEYS_PER_BLOCK) return;

    try {
      // LUMI SysEx protocol: F0 <mfr> 77 <device-id> <command> <checksum> F7
      // Command format: 10 20 [color-5-bytes] 03 (global key color)

      const encodedColor = this.encodeColor(r, g, b);

      // Build command: 10 20 [color] 03
      const command = [
        0x10,           // Command type
        0x20,           // Global key color
        ...encodedColor, // 5-byte encoded color
        0x03            // Command end
      ];

      // Calculate checksum
      const checksum = this.calculateChecksum(command, 8);

      // Full SysEx message: F0 00 21 10 77 37 [command] [checksum] F7
      const sysexMessage = [
        0xF0,                          // SysEx start
        ...this.ROLI_MANUFACTURER_ID,  // 00 21 10 (ROLI)
        0x77,                          // Message type
        this.LUMI_DEVICE_ID,           // 37 (LUMI)
        ...command,                    // Command bytes
        checksum,                      // Calculated checksum
        0xF7                           // SysEx end
      ];

      // Send via WebMIDI
      this.device!.output.send(sysexMessage);

      console.log(`[LumiController] Set key ${keyIndex} to RGB(${r},${g},${b})`);
      console.log(`[LumiController] SysEx:`, sysexMessage.map(b => b.toString(16).padStart(2, '0')).join(' '));

    } catch (error) {
      console.warn('[LumiController] Failed to send SysEx:', error);
    }
  }

  /**
   * Light up a key based on MIDI note number
   * @param midiNote MIDI note number (48-71 for 24-key LUMI starting at C3)
   * @param velocity Note velocity (0-127)
   */
  lightUpNote(midiNote: number, velocity: number = 127): void {
    if (!this.isReady()) return;

    const keyIndex = midiNote - this.LUMI_START_NOTE;

    // Only light keys within LUMI range
    if (keyIndex < 0 || keyIndex >= this.KEYS_PER_BLOCK) return;

    // Map velocity to brightness
    const brightness = Math.floor((velocity / 127) * 255);

    // Cyan color for active notes (matching Piano Visualizer theme)
    this.setKeyColor(keyIndex, 0, brightness, brightness);
  }

  /**
   * Turn off a specific note
   * @param midiNote MIDI note number
   */
  turnOffNote(midiNote: number): void {
    if (!this.isReady()) return;

    const keyIndex = midiNote - this.LUMI_START_NOTE;

    if (keyIndex < 0 || keyIndex >= this.KEYS_PER_BLOCK) return;

    this.setKeyColor(keyIndex, 0, 0, 0);
  }

  /**
   * Clear all lights (turn off all LEDs)
   */
  clearAllLights(): void {
    if (!this.device) return;

    for (let i = 0; i < this.KEYS_PER_BLOCK; i++) {
      this.setKeyColor(i, 0, 0, 0);
    }

    console.log('[LumiController] All lights cleared');
  }

  /**
   * Set LUMI scale (requires scale sync)
   * Based on research from benob/LUMI-lights SysEx protocol
   *
   * @param scale Scale name (major, minor, chromatic, etc.)
   */
  setScale(scale: string): void {
    if (!this.device) return;

    try {
      // Map Piano Roll scale names to LUMI scale bytes
      const scaleMapping: { [key: string]: number[] } = {
        // Standard scales
        'chromatic': [0x42, 0x04],
        'major': [0x02, 0x00],
        'minor': [0x22, 0x00],

        // Modes - Using major as fallback (LUMI may not support all modes via SysEx)
        'dorian': [0x02, 0x00],          // Fallback to major
        'phrygian': [0x22, 0x00],        // Fallback to minor
        'lydian': [0x02, 0x00],          // Fallback to major
        'mixolydian': [0x02, 0x00],      // Fallback to major
        'locrian': [0x22, 0x00],         // Fallback to minor

        // Harmonic/melodic minor
        'harmonic_minor': [0x22, 0x00],  // Fallback to minor
        'melodic_minor': [0x22, 0x00],   // Fallback to minor

        // Pentatonic
        'pentatonic_major': [0x02, 0x00], // Fallback to major
        'pentatonic_minor': [0x22, 0x00], // Fallback to minor

        // Blues
        'blues': [0x22, 0x00],            // Fallback to minor
      };

      const scaleBytes = scaleMapping[scale.toLowerCase()] || scaleMapping['chromatic'];

      // SysEx command: F0 00 21 10 77 00 [command] [checksum] F7
      // Command format: 10 60 [scale-2-bytes] 00 00 00 00
      const command = [0x10, 0x60, ...scaleBytes, 0x00, 0x00, 0x00, 0x00];
      const checksum = this.calculateChecksum(command, command.length);

      const sysexMessage = [
        0xF0,                          // SysEx start
        ...this.ROLI_MANUFACTURER_ID,  // 00 21 10 (ROLI)
        0x77,                          // Message type
        0x00,                          // Topology index (0x00 = all blocks)
        ...command,                    // Command bytes
        checksum,                      // Calculated checksum
        0xF7                           // SysEx end
      ];

      this.device.output.send(sysexMessage);
      console.log(`[LumiController] Set scale to: ${scale}`);

    } catch (error) {
      console.warn('[LumiController] Failed to set scale:', error);
    }
  }

  /**
   * Set LUMI root key (requires scale sync)
   *
   * @param rootKey Root key name (C, C#, D, D#, E, F, F#, G, G#, A, A#, B)
   */
  setRootKey(rootKey: string): void {
    if (!this.device) return;

    try {
      // Map root key names to LUMI key bytes
      const keyMapping: { [key: string]: number[] } = {
        'C': [0x03, 0x00], 'C#': [0x23, 0x00],
        'D': [0x43, 0x00], 'D#': [0x63, 0x00],
        'E': [0x03, 0x01], 'F': [0x23, 0x01],
        'F#': [0x43, 0x01], 'G': [0x63, 0x01],
        'G#': [0x03, 0x02], 'A': [0x23, 0x02],
        'A#': [0x43, 0x02], 'B': [0x63, 0x02]
      };

      const keyBytes = keyMapping[rootKey] || keyMapping['C'];

      // SysEx command: F0 00 21 10 77 00 [command] [checksum] F7
      // Command format: 10 30 [key-2-bytes] 00 00 00 00
      const command = [0x10, 0x30, ...keyBytes, 0x00, 0x00, 0x00, 0x00];
      const checksum = this.calculateChecksum(command, command.length);

      const sysexMessage = [
        0xF0,                          // SysEx start
        ...this.ROLI_MANUFACTURER_ID,  // 00 21 10 (ROLI)
        0x77,                          // Message type
        0x00,                          // Topology index (0x00 = all blocks)
        ...command,                    // Command bytes
        checksum,                      // Calculated checksum
        0xF7                           // SysEx end
      ];

      this.device.output.send(sysexMessage);
      console.log(`[LumiController] Set root key to: ${rootKey}`);

    } catch (error) {
      console.warn('[LumiController] Failed to set root key:', error);
    }
  }

  /**
   * Set LUMI color mode (0-3)
   * Mode 1 (index 0) recommended for compatibility with MIDI Note On/Off
   *
   * @param mode Color mode index (0 = Mode 1, 1 = Mode 2, 2 = Mode 3, 3 = Mode 4)
   */
  setColorMode(mode: number): void {
    if (!this.device) return;
    if (mode < 0 || mode > 3) return;

    try {
      // BitArray encoding for color mode command
      // This matches the benob/LUMI-lights protocol
      const bits = new BitArray();
      bits.append(0x10, 7);           // Command type
      bits.append(0x40, 7);           // Color mode command
      bits.append(0b00010, 5);        // Header
      bits.append(mode & 3, 2);       // Mode (0-3)

      const command = bits.get();
      const checksum = this.calculateChecksum(command, command.length);

      const sysexMessage = [
        0xF0,                          // SysEx start
        ...this.ROLI_MANUFACTURER_ID,  // 00 21 10 (ROLI)
        0x77,                          // Message type
        0x00,                          // Topology index (0x00 = all blocks)
        ...command,                    // Command bytes (8 bytes)
        checksum,                      // Calculated checksum
        0xF7                           // SysEx end
      ];

      this.device.output.send(sysexMessage);
      console.log(`[LumiController] Set color mode to: ${mode + 1}`);

    } catch (error) {
      console.warn('[LumiController] Failed to set color mode:', error);
    }
  }

  /**
   * Check if a device name looks like a LUMI/Piano M device
   */
  static isLumiDevice(deviceName: string): boolean {
    const name = deviceName.toLowerCase();
    return name.includes('lumi') ||
           name.includes('piano m') ||
           name.includes('roli');
  }

  /**
   * Get device info
   */
  getDeviceInfo(): { name: string; connected: boolean; enabled: boolean } | null {
    if (!this.device) return null;

    return {
      name: this.device.name,
      connected: true,
      enabled: this.enabled
    };
  }
}

/**
 * BitArray helper class for LUMI SysEx encoding
 * Based on benob/LUMI-lights implementation
 */
class BitArray {
  private values: number[] = [];
  private num_bits: number = 0;

  append(value: number, size: number = 7) {
    let current = Math.floor(this.num_bits / 7);
    let used_bits = Math.floor(this.num_bits % 7);
    let packed = 0;

    if (used_bits > 0) {
      packed = this.values[this.values.length - 1];
      this.values.pop();
    }

    this.num_bits += size;

    while (size > 0) {
      packed |= (value << used_bits) & 127;
      size -= (7 - used_bits);
      value >>= (7 - used_bits);
      this.values.push(packed);
      packed = 0;
      used_bits = 0;
    }
  }

  get(size: number = 32): number[] {
    while (this.values.length < 8) {
      this.values.push(0);
    }
    return this.values;
  }
}

// Singleton instance
export const lumiController = new LumiController();
