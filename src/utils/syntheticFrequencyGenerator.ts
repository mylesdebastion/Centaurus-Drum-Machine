/**
 * Synthetic Frequency Data Generator
 *
 * Creates artificial frequency spectrum data from note/drum events
 * without requiring audio analysis. Useful for visualizing MIDI events
 * or drum patterns in headless mode.
 */

import { midiToFrequency, getDrumFrequency, frequencyToBin } from './frequencyUtils';

export interface NoteEvent {
  frequency: number;  // Hz
  velocity: number;   // 0-1
  timestamp: number;  // ms
  midiNote?: number;  // MIDI note number (0-127) for color mapping
  color?: { r: number; g: number; b: number };  // RGB color for this note
}

export interface SyntheticFrequencyConfig {
  fftSize: number;           // Size of FFT (typically 2048)
  sampleRate: number;        // Audio sample rate (typically 44100)
  decayTime: number;         // How long notes persist (ms)
  peakWidth: number;         // Bandwidth of frequency peak (bins)
  harmonics: boolean;        // Include harmonic overtones
  harmonicCount: number;     // Number of harmonics to generate
  harmonicDecay: number;     // How much each harmonic diminishes (0-1)
}

export const DEFAULT_SYNTHETIC_CONFIG: SyntheticFrequencyConfig = {
  fftSize: 2048,
  sampleRate: 44100,
  decayTime: 500,      // 500ms decay
  peakWidth: 3,        // 3-bin width for smooth peaks
  harmonics: true,
  harmonicCount: 5,
  harmonicDecay: 0.5,  // Each harmonic is 50% of previous
};

export class SyntheticFrequencyGenerator {
  private config: SyntheticFrequencyConfig;
  private activeNotes: NoteEvent[] = [];
  private frequencyData: Uint8Array;

  constructor(config: SyntheticFrequencyConfig = DEFAULT_SYNTHETIC_CONFIG) {
    this.config = config;
    this.frequencyData = new Uint8Array(config.fftSize / 2);
  }

  /**
   * Add a MIDI note event
   */
  addMidiNote(midiNote: number, velocity: number, color?: { r: number; g: number; b: number }): void {
    const frequency = midiToFrequency(midiNote);
    this.activeNotes.push({
      frequency,
      velocity,
      timestamp: Date.now(),
      midiNote,
      color
    });

    // Debug: Log when notes with colors are added
    if (color) {
      console.log('[SyntheticFreqGen] Added MIDI note', midiNote, 'with color:', color, 'freq:', frequency.toFixed(1), 'Hz');
    }
  }

  /**
   * Add a drum hit event
   */
  addDrumHit(drumName: string, velocity: number): void {
    const frequency = getDrumFrequency(drumName);
    this.addNote(frequency, velocity);
  }

  /**
   * Add a raw frequency event
   */
  addNote(frequency: number, velocity: number): void {
    this.activeNotes.push({
      frequency,
      velocity,
      timestamp: Date.now()
    });
  }

  /**
   * Generate synthetic frequency data based on active notes
   */
  getFrequencyData(): Uint8Array {
    const now = Date.now();
    const { fftSize, sampleRate, decayTime, peakWidth, harmonics, harmonicCount, harmonicDecay } = this.config;
    const bufferLength = fftSize / 2;

    // Clear frequency data
    this.frequencyData.fill(0);

    // Remove expired notes
    this.activeNotes = this.activeNotes.filter(note => {
      const age = now - note.timestamp;
      return age < decayTime;
    });

    // Generate frequency peaks for each active note
    this.activeNotes.forEach(note => {
      const age = now - note.timestamp;
      const decay = 1 - (age / decayTime); // Linear decay
      const amplitude = note.velocity * decay * 255;

      // Add fundamental frequency
      this.addFrequencyPeak(note.frequency, amplitude, peakWidth, bufferLength, sampleRate, fftSize);

      // Add harmonic overtones
      if (harmonics) {
        for (let h = 2; h <= harmonicCount + 1; h++) {
          const harmonicFreq = note.frequency * h;
          const harmonicAmp = amplitude * Math.pow(harmonicDecay, h - 1);
          this.addFrequencyPeak(harmonicFreq, harmonicAmp, peakWidth, bufferLength, sampleRate, fftSize);
        }
      }
    });

    return this.frequencyData;
  }

  /**
   * Add a Gaussian-shaped frequency peak at the specified frequency
   */
  private addFrequencyPeak(
    frequency: number,
    amplitude: number,
    width: number,
    bufferLength: number,
    sampleRate: number,
    fftSize: number
  ): void {
    const centerBin = frequencyToBin(frequency, sampleRate, fftSize);

    // Don't add peaks outside the valid range
    if (centerBin < 0 || centerBin >= bufferLength) return;

    // Add Gaussian distribution around center bin
    for (let offset = -width; offset <= width; offset++) {
      const bin = centerBin + offset;
      if (bin >= 0 && bin < bufferLength) {
        // Gaussian falloff
        const distance = Math.abs(offset);
        const falloff = Math.exp(-Math.pow(distance / width, 2));
        const binAmplitude = amplitude * falloff;

        // Add to existing value (allow peaks to sum)
        this.frequencyData[bin] = Math.min(255, this.frequencyData[bin] + binAmplitude);
      }
    }
  }

  /**
   * Clear all active notes
   */
  clear(): void {
    this.activeNotes = [];
    this.frequencyData.fill(0);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SyntheticFrequencyConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.fftSize) {
      this.frequencyData = new Uint8Array(config.fftSize / 2);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): SyntheticFrequencyConfig {
    return { ...this.config };
  }

  /**
   * Get color for a frequency bin (for MIDI mode visualization)
   * Returns the color of the active note closest to this frequency
   */
  getColorForBin(bin: number): { r: number; g: number; b: number } | null {
    const { sampleRate, fftSize } = this.config;
    const binFrequency = (bin * sampleRate) / fftSize;

    // Find the closest active note with a color
    let closestNote: NoteEvent | null = null;
    let minDistance = Infinity;

    for (const note of this.activeNotes) {
      if (note.color) {
        const distance = Math.abs(Math.log2(note.frequency) - Math.log2(binFrequency));
        if (distance < minDistance) {
          minDistance = distance;
          closestNote = note;
        }
      }
    }

    // Debug: Log color queries for debugging
    if (bin % 100 === 0) {
      console.log('[SyntheticFreqGen] getColorForBin', bin, '(', binFrequency.toFixed(1), 'Hz)',
                  '-> activeNotes:', this.activeNotes.length,
                  '-> closestNote:', closestNote ? closestNote.frequency.toFixed(1) + 'Hz' : 'none',
                  '-> minDist:', closestNote ? minDistance.toFixed(3) : 'N/A',
                  '-> hasColor:', closestNote ? !!closestNote.color : false);
    }

    // Return color if found a close note (within 1 semitone)
    const result = (closestNote && minDistance < 0.1) ? closestNote.color || null : null;

    // Debug: Log when we actually return a color
    if (result && bin % 20 === 0) {
      console.log('[SyntheticFreqGen] 🎨 Returning color for bin', bin, ':', result);
    }

    return result;
  }

  /**
   * Get all active notes (for debugging)
   */
  getActiveNotes(): NoteEvent[] {
    return [...this.activeNotes];
  }
}
