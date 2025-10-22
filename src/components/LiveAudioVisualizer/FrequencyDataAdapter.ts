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
   * Get waveform data (delegates to audio manager if available, or generates synthetic waveform)
   */
  getWaveformData(): Uint8Array {
    if (this.audioManager) {
      return this.audioManager.getWaveformData();
    }
    // Generate synthetic waveform from frequency data when no audio manager available
    return this.generateSyntheticWaveform();
  }

  /**
   * Get stereo waveform data (delegates to audio manager if available, or generates synthetic)
   */
  getStereoWaveformData(): { left: Uint8Array; right: Uint8Array } {
    if (this.audioManager) {
      return this.audioManager.getStereoWaveformData();
    }
    // Generate synthetic waveform for both channels when no audio manager available
    const waveform = this.generateSyntheticWaveform();
    return {
      left: waveform,
      right: waveform
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

  /**
   * Get the source manager (for MIDI color queries)
   */
  getSourceManager(): FrequencySourceManager {
    return this.sourceManager;
  }

  /**
   * Generate synthetic waveform from frequency data
   * Creates a time-domain waveform by converting frequency spectrum to sine waves
   */
  private generateSyntheticWaveform(): Uint8Array {
    const waveformSize = 2048;
    const waveform = new Uint8Array(waveformSize);
    const frequencyData = this.sourceManager.getFrequencyData();

    // Find the top 3 strongest frequency bins to create a compound waveform
    const peaks: { index: number; amplitude: number }[] = [];
    for (let i = 0; i < frequencyData.length; i++) {
      if (frequencyData[i] > 20) { // Threshold to avoid noise
        peaks.push({ index: i, amplitude: frequencyData[i] });
      }
    }

    // Sort by amplitude and take top 3
    peaks.sort((a, b) => b.amplitude - a.amplitude);
    const topPeaks = peaks.slice(0, 3);

    if (topPeaks.length === 0) {
      // No significant frequency data, return centered flat line
      waveform.fill(128);
      return waveform;
    }

    // Generate composite waveform from top frequency components
    const tempWaveform = new Float32Array(waveformSize);

    topPeaks.forEach((peak, idx) => {
      // Convert bin index to frequency (assuming 44100 Hz sample rate, 2048 FFT size)
      const frequency = (peak.index / frequencyData.length) * (44100 / 2);
      const amplitude = peak.amplitude / 255; // Normalize to 0-1
      const weight = 1 / (idx + 1); // Decay weight for harmonics

      // Generate sine wave for this frequency component
      for (let i = 0; i < waveformSize; i++) {
        const phase = (i / waveformSize) * frequency * (waveformSize / 44100) * Math.PI * 2;
        tempWaveform[i] += Math.sin(phase) * amplitude * weight;
      }
    });

    // Normalize and convert to Uint8Array (0-255, centered at 128)
    let maxAmp = 0;
    for (let i = 0; i < waveformSize; i++) {
      maxAmp = Math.max(maxAmp, Math.abs(tempWaveform[i]));
    }

    const scale = maxAmp > 0 ? 1 / maxAmp : 1;
    for (let i = 0; i < waveformSize; i++) {
      // Convert -1..1 to 0..255 with proper scaling for dynamic range
      waveform[i] = Math.floor((tempWaveform[i] * scale * 0.8 + 1) * 127.5);
    }

    return waveform;
  }
}
