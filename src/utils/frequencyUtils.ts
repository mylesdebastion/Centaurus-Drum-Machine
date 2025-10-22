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
  // Normalize drum name to lowercase and remove spaces/dashes for flexible matching
  const normalized = drumName.toLowerCase().replace(/[\s-]/g, '');

  const drumFrequencyMap: Record<string, number> = {
    'kick': 80,
    'snare': 550,      // Adjusted for yellow color mapping
    'hihat': 10000,    // High frequency for purple color mapping
    'closedhihat': 10000,
    'openhat': 8000,
    'openhihat': 8000,
    'perc': 1500,
    'crash': 12000,
    'ride': 4000,
    'tom': 150,
    'hitom': 200,
    'midtom': 150,
    'lotom': 100,
    'clap': 2200,      // Adjusted for green-blue/cyan color mapping
    'cowbell': 800,
    'shaker': 6000
  };

  return drumFrequencyMap[normalized] || 1000; // Default to 1kHz
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
