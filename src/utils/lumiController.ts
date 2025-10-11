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
      // Reverse-engineered SysEx command format
      // Based on benob/LUMI-lights research
      const sysexData = [
        ...this.ROLI_MANUFACTURER_ID,
        0x77, // Command type (from benob's research)
        0x37, // Subcommand (LED control)
        keyIndex,
        Math.floor(r),
        Math.floor(g),
        Math.floor(b)
      ];

      this.device!.output.sendSysex(this.ROLI_MANUFACTURER_ID, sysexData.slice(3));

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

// Singleton instance
export const lumiController = new LumiController();
