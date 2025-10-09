/**
 * Frequency Data Adapter
 *
 * Provides a unified interface for the VisualizationEngine to get frequency
 * data from multiple sources (microphone, MIDI, drums) through the
 * FrequencySourceManager.
 */

import { AudioInputManager } from './AudioInputManager';
import { FrequencySourceManager } from '../../utils/frequencySourceManager';

export class FrequencyDataAdapter {
  private audioManager: AudioInputManager | null = null;
  private sourceManager: FrequencySourceManager;

  constructor(sourceManager: FrequencySourceManager) {
    this.sourceManager = sourceManager;
  }

  setAudioManager(manager: AudioInputManager | null): void {
    this.audioManager = manager;
    this.sourceManager.setAudioManager(manager);
  }

  /**
   * Get mixed frequency data from all active sources
   */
  getFrequencyData(): Uint8Array {
    return this.sourceManager.getFrequencyData();
  }

  /**
   * Get waveform data (delegates to audio manager if available)
   */
  getWaveformData(): Uint8Array {
    if (this.audioManager) {
      return this.audioManager.getWaveformData();
    }
    // Return empty data if no audio manager
    return new Uint8Array(2048);
  }

  /**
   * Get stereo waveform data (delegates to audio manager if available)
   */
  getStereoWaveformData(): { left: Uint8Array; right: Uint8Array } {
    if (this.audioManager) {
      return this.audioManager.getStereoWaveformData();
    }
    // Return empty data if no audio manager
    return {
      left: new Uint8Array(2048),
      right: new Uint8Array(2048)
    };
  }

  /**
   * Get RMS level (delegates to audio manager if available)
   */
  getRMS(): number {
    if (this.audioManager) {
      return this.audioManager.getRMS();
    }
    return 0;
  }

  /**
   * Get peak frequency (delegates to audio manager if available)
   */
  getPeakFrequency(): { frequency: number; amplitude: number } {
    if (this.audioManager) {
      return this.audioManager.getPeakFrequency();
    }
    return { frequency: 0, amplitude: 0 };
  }
}
