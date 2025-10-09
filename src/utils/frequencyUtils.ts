/**
 * Frequency conversion utilities for MIDI and audio visualization
 */

/**
 * Convert MIDI note number to frequency in Hz
 * Uses standard MIDI tuning: A4 (note 69) = 440 Hz
 */
export const midiToFrequency = (midiNote: number): number => {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
};

/**
 * Convert frequency in Hz to MIDI note number
 */
export const frequencyToMidi = (frequency: number): number => {
  return 69 + 12 * Math.log2(frequency / 440);
};

/**
 * Get the dominant frequency for a drum instrument based on its name
 */
export const getDrumFrequency = (drumName: string): number => {
  const drumFrequencyMap: Record<string, number> = {
    'Kick': 80,
    'Snare': 550,      // Adjusted for yellow color mapping
    'Hi-Hat': 10000,
    'Open Hat': 8000,
    'Perc': 1500,
    'Crash': 12000,
    'Ride': 4000,
    'Tom': 150,
    'Hi Tom': 200,
    'Mid Tom': 150,
    'Lo Tom': 100,
    'Clap': 2200,      // Adjusted for green-blue/cyan color mapping
    'Cowbell': 800,
    'Shaker': 6000
  };

  return drumFrequencyMap[drumName] || 1000; // Default to 1kHz
};

/**
 * Convert frequency (Hz) to FFT bin index
 */
export const frequencyToBin = (
  frequency: number,
  sampleRate: number = 44100,
  fftSize: number = 2048
): number => {
  const nyquist = sampleRate / 2;
  const binCount = fftSize / 2;
  return Math.floor((frequency / nyquist) * binCount);
};

/**
 * Convert FFT bin index to frequency (Hz)
 */
export const binToFrequency = (
  bin: number,
  sampleRate: number = 44100,
  fftSize: number = 2048
): number => {
  const nyquist = sampleRate / 2;
  const binCount = fftSize / 2;
  return (bin / binCount) * nyquist;
};
