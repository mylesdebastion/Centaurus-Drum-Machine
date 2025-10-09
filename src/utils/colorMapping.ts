// Color mapping utilities for consistent color schemes across components

export type ColorMode = 'spectrum' | 'chromatic' | 'harmonic';

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

/**
 * Convert HSL to RGB color
 */
export const hslToRgb = (h: number, s: number, l: number): RGBColor => {
  h /= 360;
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h * 6) % 2 - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 1/6) {
    r = c; g = x; b = 0;
  } else if (1/6 <= h && h < 2/6) {
    r = x; g = c; b = 0;
  } else if (2/6 <= h && h < 3/6) {
    r = 0; g = c; b = x;
  } else if (3/6 <= h && h < 4/6) {
    r = 0; g = x; b = c;
  } else if (4/6 <= h && h < 5/6) {
    r = x; g = 0; b = c;
  } else if (5/6 <= h && h < 1) {
    r = c; g = 0; b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
};

/**
 * Convert RGB to hex color string
 */
export const rgbToHex = (color: RGBColor): string => {
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
};

/**
 * Get color for a MIDI note based on the selected color mode
 */
export const getNoteColor = (note: number, mode: ColorMode): RGBColor => {
  switch (mode) {
    case 'spectrum':
      // Map note (0-127) to spectrum (red to violet)
      // 0° = red, 60° = yellow, 120° = green, 180° = cyan, 240° = blue, 270° = violet
      const hue = (note / 127) * 270; // 0° = red, 270° = violet
      return hslToRgb(hue, 85, 55);
    
    case 'chromatic':
      // Map note to chromatic colors (12 colors repeating)
      const chromatic = (note % 12) / 12;
      const chromaticHue = chromatic * 360;
      return hslToRgb(chromaticHue, 80, 60);
    
    case 'harmonic':
      // Map based on circle of fifths
      const fifths = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5]; // Circle of fifths order
      const noteClass = note % 12;
      const fifthsIndex = fifths.indexOf(noteClass);
      const harmonicHue = (fifthsIndex / 12) * 360;
      return hslToRgb(harmonicHue, 70, 55);
    
    default:
      return { r: 255, g: 255, b: 255 };
  }
};

/**
 * Get color for drum track based on sonic frequency content and color mode
 */
export const getDrumTrackColor = (trackName: string, mode: ColorMode): string => {
  // Map drum names to their dominant frequency in Hz
  const drumFrequencyMap: Record<string, number> = {
    'Kick': 80,        // Low bass fundamental + first harmonics
    'Snare': 550,      // Adjusted for yellow color mapping
    'Hi-Hat': 10000,   // High frequency content (8-12 kHz)
    'Perc': 1500,      // Mid-high percussion
    'Crash': 12000,    // Very high cymbal wash (8-15 kHz)
    'Ride': 4000,      // High-mid cymbal ping (3-6 kHz)
    'Tom': 150,        // Mid-low tom fundamental
    'Clap': 2200       // Adjusted for green-blue/cyan color mapping
  };

  // Get the frequency for this drum (default to 1kHz if not found)
  const freqHz = drumFrequencyMap[trackName] || 1000;

  // Convert frequency to normalized value using log scale (50-8000 Hz)
  const minFreq = 50;
  const maxFreq = 8000;
  const clampedFreq = Math.max(minFreq, Math.min(maxFreq, freqHz));
  const normalizedFreq = Math.log(clampedFreq / minFreq) / Math.log(maxFreq / minFreq);

  // Get color based on frequency (using quadratic scale for better bass emphasis)
  const color = getFrequencyColor(normalizedFreq, mode, 'quadratic');
  return rgbToHex(color);
};

/**
 * Get frequency-based color for audio visualization
 */
export const getFrequencyColor = (
  frequency: number,
  mode: ColorMode,
  scaleType: 'log' | 'linear' | 'quadratic' = 'log'
): RGBColor => {
  // Map frequency (0-1) to appropriate color based on mode
  switch (mode) {
    case 'spectrum': {
      let hue;

      if (scaleType === 'quadratic') {
        // Quadratic color mapping - emphasizes bass frequencies with smooth transitions
        // This spreads out low frequencies (0-250 Hz) in red-orange while maintaining
        // smooth color transitions without discontinuities
        hue = Math.pow(frequency, 2) * 270;
      } else {
        // Linear color mapping for log and linear scale types
        hue = frequency * 270; // 0 = red (0°), 1 = violet (270°)
      }

      return hslToRgb(hue, 85, 55);
    }

    case 'chromatic':
      // For frequency data, treat as continuous spectrum
      const chromaticHue = frequency * 360;
      return hslToRgb(chromaticHue, 70, 55);

    case 'harmonic':
      // For frequency, use a warm-to-cool progression
      const harmonicHue = frequency * 240; // Blue to red range
      return hslToRgb(harmonicHue, 65, 50);

    default:
      return { r: 255, g: 255, b: 255 };
  }
};