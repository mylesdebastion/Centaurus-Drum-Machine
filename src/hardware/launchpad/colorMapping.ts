/**
 * Color Mapping Utilities for Launchpad Pro RGB LEDs
 *
 * Provides color generation for sequencer visualization with three modes:
 * - Spectrum: Frequency-based (red=low, green=mid, blue=high)
 * - Chromatic: Pitch-based (12 chromatic pitches)
 * - Harmonic: Circle of fifths progression
 *
 * RGB range: 0-63 per channel (Launchpad Pro spec)
 *
 * Reference: Story 8.2, AC 7
 */

import type { ColorMode } from '../../utils/colorMapping';

/**
 * Launchpad RGB color (0-63 per channel)
 */
export interface LaunchpadRGB {
  r: number; // Red (0-63)
  g: number; // Green (0-63)
  b: number; // Blue (0-63)
}

/**
 * Spectrum color palette (frequency-based)
 * Track 0 (Kick) = Red (lowest frequency)
 * Track 3 (Hi-hat) = Green (mid frequency)
 * Track 7+ (Toms) = Blue (highest frequency)
 */
const SPECTRUM_COLORS: LaunchpadRGB[] = [
  { r: 63, g: 0, b: 0 },    // Track 0: Kick (red, lowest frequency)
  { r: 63, g: 32, b: 0 },   // Track 1: Snare (orange)
  { r: 63, g: 63, b: 0 },   // Track 2: Clap (yellow)
  { r: 0, g: 63, b: 0 },    // Track 3: Hi-hat (green, mid frequency)
  { r: 0, g: 32, b: 63 },   // Track 4: Tom 1 (blue-cyan)
  { r: 0, g: 16, b: 63 },   // Track 5: Tom 2 (blue)
  { r: 32, g: 0, b: 63 },   // Track 6: Tom 3 (purple)
  { r: 63, g: 0, b: 63 },   // Track 7: Tom 4 (magenta, highest frequency)
];

/**
 * Chromatic color palette (pitch-based, 12 pitch classes)
 * C=Red, C#=Red-Orange, D=Orange, etc.
 */
const CHROMATIC_COLORS: LaunchpadRGB[] = [
  { r: 63, g: 0, b: 0 },    // C (red)
  { r: 63, g: 16, b: 0 },   // C# (red-orange)
  { r: 63, g: 32, b: 0 },   // D (orange)
  { r: 63, g: 48, b: 0 },   // D# (yellow-orange)
  { r: 63, g: 63, b: 0 },   // E (yellow)
  { r: 32, g: 63, b: 0 },   // F (yellow-green)
  { r: 0, g: 63, b: 0 },    // F# (green)
  { r: 0, g: 63, b: 32 },   // G (cyan-green)
  { r: 0, g: 48, b: 48 },   // G# (cyan)
  { r: 0, g: 32, b: 63 },   // A (blue-cyan)
  { r: 0, g: 0, b: 63 },    // A# (blue)
  { r: 32, g: 0, b: 63 },   // B (purple)
];

/**
 * Harmonic color palette (circle of fifths)
 * C → G → D → A → E → B → F# → C# → G# → D# → A# → F → C
 */
const HARMONIC_COLORS: LaunchpadRGB[] = [
  { r: 63, g: 0, b: 0 },    // C (red)
  { r: 63, g: 32, b: 0 },   // G (orange)
  { r: 63, g: 63, b: 0 },   // D (yellow)
  { r: 32, g: 63, b: 0 },   // A (yellow-green)
  { r: 0, g: 63, b: 0 },    // E (green)
  { r: 0, g: 63, b: 32 },   // B (cyan-green)
  { r: 0, g: 48, b: 48 },   // F# (cyan)
  { r: 0, g: 32, b: 63 },   // C# (blue-cyan)
  { r: 0, g: 0, b: 63 },    // G# (blue)
  { r: 32, g: 0, b: 63 },   // D# (purple)
  { r: 48, g: 0, b: 48 },   // A# (magenta-purple)
  { r: 63, g: 0, b: 32 },   // F (red-magenta)
];

/**
 * Timeline playback indicator color (white or yellow)
 */
export const PLAYBACK_COLOR: LaunchpadRGB = { r: 63, g: 63, b: 63 }; // White

/**
 * Off/inactive LED color (black)
 */
export const OFF_COLOR: LaunchpadRGB = { r: 0, g: 0, b: 0 };

/**
 * Get spectrum color for a track with velocity-based brightness
 *
 * @param trackIndex Track number (0-7)
 * @param velocity MIDI velocity (0-127)
 * @returns Launchpad RGB color (0-63 per channel)
 */
export function getSpectrumColor(trackIndex: number, velocity: number): LaunchpadRGB {
  const baseColor = SPECTRUM_COLORS[Math.min(trackIndex, SPECTRUM_COLORS.length - 1)];
  return applyVelocityBrightness(baseColor, velocity);
}

/**
 * Get chromatic color for a note/pitch with velocity-based brightness
 *
 * @param note MIDI note number or pitch class (0-127)
 * @param velocity MIDI velocity (0-127)
 * @returns Launchpad RGB color (0-63 per channel)
 */
export function getChromaticColor(note: number, velocity: number): LaunchpadRGB {
  const pitchClass = note % 12; // C=0, C#=1, ..., B=11
  const baseColor = CHROMATIC_COLORS[pitchClass];
  return applyVelocityBrightness(baseColor, velocity);
}

/**
 * Get harmonic color for a note/pitch with velocity-based brightness
 *
 * Uses circle of fifths progression for harmonic relationships.
 *
 * @param note MIDI note number or pitch class (0-127)
 * @param velocity MIDI velocity (0-127)
 * @returns Launchpad RGB color (0-63 per channel)
 */
export function getHarmonicColor(note: number, velocity: number): LaunchpadRGB {
  const pitchClass = note % 12; // C=0, C#=1, ..., B=11

  // Circle of fifths mapping: C=0, G=1, D=2, A=3, E=4, B=5, F#=6, C#=7, G#=8, D#=9, A#=10, F=11
  const circleOfFifths = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5]; // Maps pitch class to circle position
  const fifthsIndex = circleOfFifths.indexOf(pitchClass);

  const baseColor = HARMONIC_COLORS[fifthsIndex];
  return applyVelocityBrightness(baseColor, velocity);
}

/**
 * Get track color based on selected color mode
 *
 * Main entry point for sequencer LED color generation.
 *
 * @param trackIndex Track index (0-7)
 * @param velocity MIDI velocity (0-127)
 * @param mode Color mode (spectrum/chromatic/harmonic)
 * @returns Launchpad RGB color (0-63 per channel)
 */
export function getTrackColor(
  trackIndex: number,
  velocity: number,
  mode: ColorMode
): LaunchpadRGB {
  switch (mode) {
    case 'spectrum':
      return getSpectrumColor(trackIndex, velocity);
    case 'chromatic':
      // For chromatic mode with tracks, map track index to pitch class
      return getChromaticColor(trackIndex, velocity);
    case 'harmonic':
      // For harmonic mode with tracks, map track index to pitch class
      return getHarmonicColor(trackIndex, velocity);
    default:
      return getSpectrumColor(trackIndex, velocity);
  }
}

/**
 * Apply velocity-based brightness scaling to base color
 *
 * Brightness formula: brightness = velocity / 127 (0.0 to 1.0)
 *
 * @param baseColor Base Launchpad RGB color
 * @param velocity MIDI velocity (0-127)
 * @returns Scaled Launchpad RGB color
 */
export function applyVelocityBrightness(
  baseColor: LaunchpadRGB,
  velocity: number
): LaunchpadRGB {
  const brightness = velocity / 127; // 0.0 to 1.0

  return {
    r: Math.floor(baseColor.r * brightness),
    g: Math.floor(baseColor.g * brightness),
    b: Math.floor(baseColor.b * brightness),
  };
}

/**
 * Convert standard RGB (0-255) to Launchpad RGB (0-63)
 *
 * @param r Red (0-255)
 * @param g Green (0-255)
 * @param b Blue (0-255)
 * @returns Launchpad RGB (0-63 per channel)
 */
export function toLaunchpadRGB(r: number, g: number, b: number): LaunchpadRGB {
  return {
    r: Math.floor((r / 255) * 63),
    g: Math.floor((g / 255) * 63),
    b: Math.floor((b / 255) * 63),
  };
}

/**
 * Convert Launchpad RGB (0-63) to standard RGB (0-255)
 *
 * @param color Launchpad RGB (0-63 per channel)
 * @returns Standard RGB (0-255 per channel)
 */
export function fromLaunchpadRGB(color: LaunchpadRGB): { r: number; g: number; b: number } {
  return {
    r: Math.floor((color.r / 63) * 255),
    g: Math.floor((color.g / 63) * 255),
    b: Math.floor((color.b / 63) * 255),
  };
}
