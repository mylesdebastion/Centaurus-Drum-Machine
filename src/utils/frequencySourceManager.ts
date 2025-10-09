/**
 * Frequency Source Manager
 *
 * Manages multiple frequency data sources (microphone, MIDI, drums)
 * and provides mixing/toggling between them for visualization.
 */

import { SyntheticFrequencyGenerator } from './syntheticFrequencyGenerator';
import { AudioInputManager } from '../components/LiveAudioVisualizer/AudioInputManager';

export type FrequencySourceType = 'microphone' | 'midi' | 'drums';

export type FrequencyMixMode =
  | 'mic-only'
  | 'midi-only'
  | 'drums-only'
  | 'mic+midi'
  | 'mic+drums'
  | 'midi+drums'
  | 'all';

export interface FrequencySourceConfig {
  mixMode: FrequencyMixMode;
  microphoneEnabled: boolean;
  midiEnabled: boolean;
  drumsEnabled: boolean;
  microphoneGain: number;    // 0-1 multiplier
  midiGain: number;          // 0-1 multiplier
  drumsGain: number;         // 0-1 multiplier
}

export const DEFAULT_SOURCE_CONFIG: FrequencySourceConfig = {
  mixMode: 'mic-only',
  microphoneEnabled: true,
  midiEnabled: false,
  drumsEnabled: false,
  microphoneGain: 1.0,
  midiGain: 1.0,
  drumsGain: 1.0,
};

export class FrequencySourceManager {
  private config: FrequencySourceConfig;
  private midiGenerator: SyntheticFrequencyGenerator;
  private drumGenerator: SyntheticFrequencyGenerator;
  private audioManager: AudioInputManager | null = null;
  private mixedFrequencyData: Uint8Array;
  private fftSize: number = 2048;

  constructor(config: FrequencySourceConfig = DEFAULT_SOURCE_CONFIG) {
    this.config = config;
    this.midiGenerator = new SyntheticFrequencyGenerator();
    this.drumGenerator = new SyntheticFrequencyGenerator();
    this.mixedFrequencyData = new Uint8Array(this.fftSize / 2);
  }

  /**
   * Set the audio input manager for microphone input
   */
  setAudioManager(manager: AudioInputManager | null): void {
    this.audioManager = manager;
  }

  /**
   * Add a MIDI note event to the synthetic generator
   */
  addMidiNote(midiNote: number, velocity: number): void {
    this.midiGenerator.addMidiNote(midiNote, velocity);
  }

  /**
   * Add a drum hit event to the synthetic generator
   */
  addDrumHit(drumName: string, velocity: number): void {
    this.drumGenerator.addDrumHit(drumName, velocity);
  }

  /**
   * Get the mixed frequency data based on current configuration
   */
  getFrequencyData(): Uint8Array {
    const { mixMode, microphoneGain, midiGain, drumsGain } = this.config;

    // Clear mixed data
    this.mixedFrequencyData.fill(0);

    // Determine which sources to include based on mix mode
    const includeMic = mixMode.includes('mic') && this.audioManager;
    const includeMidi = mixMode.includes('midi') || mixMode === 'all';
    const includeDrums = mixMode.includes('drums') || mixMode === 'all';

    // Get data from active sources
    const micData = includeMic ? this.audioManager!.getFrequencyData() : null;
    const midiData = includeMidi ? this.midiGenerator.getFrequencyData() : null;
    const drumData = includeDrums ? this.drumGenerator.getFrequencyData() : null;

    // Mix the sources
    const bufferLength = this.mixedFrequencyData.length;
    for (let i = 0; i < bufferLength; i++) {
      let value = 0;

      if (micData && includeMic) {
        value += micData[i] * microphoneGain;
      }

      if (midiData && includeMidi) {
        value += midiData[i] * midiGain;
      }

      if (drumData && includeDrums) {
        value += drumData[i] * drumsGain;
      }

      // Clamp to valid range
      this.mixedFrequencyData[i] = Math.min(255, Math.max(0, value));
    }

    return this.mixedFrequencyData;
  }

  /**
   * Set the mix mode
   */
  setMixMode(mode: FrequencyMixMode): void {
    this.config.mixMode = mode;

    // Update enabled flags based on mix mode
    this.config.microphoneEnabled = mode.includes('mic');
    this.config.midiEnabled = mode.includes('midi') || mode === 'all';
    this.config.drumsEnabled = mode.includes('drums') || mode === 'all';
  }

  /**
   * Set gain for a specific source
   */
  setSourceGain(source: FrequencySourceType, gain: number): void {
    const clampedGain = Math.max(0, Math.min(2, gain)); // Allow 0-2x gain

    switch (source) {
      case 'microphone':
        this.config.microphoneGain = clampedGain;
        break;
      case 'midi':
        this.config.midiGain = clampedGain;
        break;
      case 'drums':
        this.config.drumsGain = clampedGain;
        break;
    }
  }

  /**
   * Clear all synthetic generators
   */
  clearSynthetic(): void {
    this.midiGenerator.clear();
    this.drumGenerator.clear();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<FrequencySourceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): FrequencySourceConfig {
    return { ...this.config };
  }

  /**
   * Get the MIDI generator (for advanced configuration)
   */
  getMidiGenerator(): SyntheticFrequencyGenerator {
    return this.midiGenerator;
  }

  /**
   * Get the drum generator (for advanced configuration)
   */
  getDrumGenerator(): SyntheticFrequencyGenerator {
    return this.drumGenerator;
  }
}
