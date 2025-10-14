/**
 * Visualization Mode Types & Compatibility
 *
 * Epic 14, Story 14.7 - LED Compositor Implementation
 * Design document: docs/architecture/led-compositor-design.md (Section A.3)
 *
 * Categorizes visualization addressing patterns for compatibility detection
 */

import { LEDFrame } from './ledFrame';

/**
 * Visualization addressing modes
 *
 * Different modules use different LED addressing schemes:
 * - note-per-led: Direct 1:1 note-to-LED mapping (Piano: 88 LEDs, Guitar: 150 LEDs)
 * - full-strip-wave: Full strip patterns like audio ripples or spectrums
 * - grid-pattern: 2D grid visualizations (IsometricSequencer APC40)
 * - beat-flash: Reactive flashes triggered by beats (DrumMachine)
 */
export type VisualizationMode =
  | 'note-per-led'      // Direct note-to-LED mapping (Piano: 88, Guitar: 150)
  | 'full-strip-wave'   // Full strip patterns (Audio ripple, spectrum)
  | 'grid-pattern'      // 2D grid patterns (Isometric sequencer)
  | 'beat-flash';       // Reactive flashes (Drum machine)

/**
 * Compatibility matrix - defines which visualization modes can be blended
 *
 * Compatible modes CAN be blended visually:
 * - Piano (note-per-led) + Audio ripple (full-strip-wave) = ✅ Both visible
 * - Drum (beat-flash) + Audio spectrum (full-strip-wave) = ✅ Both visible
 *
 * Incompatible modes CANNOT be blended (causes confusion):
 * - Piano (88 note-per-led) + Guitar (150 note-per-led) = ❌ Different addressing
 *
 * When incompatible modes detected, compositor falls back to toggle mode (latest frame only)
 */
export const COMPATIBILITY_MATRIX: Record<VisualizationMode, VisualizationMode[]> = {
  // note-per-led can blend with wave patterns and beat flashes
  'note-per-led': ['full-strip-wave', 'beat-flash'],

  // full-strip-wave is most versatile, compatible with all modes
  'full-strip-wave': ['note-per-led', 'grid-pattern', 'beat-flash', 'full-strip-wave'],

  // grid-pattern can blend with waves and beat flashes
  'grid-pattern': ['full-strip-wave', 'beat-flash'],

  // beat-flash can blend with notes, waves, and grids
  'beat-flash': ['note-per-led', 'full-strip-wave', 'grid-pattern'],
};

/**
 * Check if two visualization modes are compatible for blending
 *
 * @param mode1 - First visualization mode
 * @param mode2 - Second visualization mode
 * @returns true if modes can be blended, false if toggle mode required
 *
 * @example
 * ```typescript
 * checkModeCompatibility('note-per-led', 'full-strip-wave'); // true
 * checkModeCompatibility('note-per-led', 'note-per-led');    // false (special case)
 * ```
 */
export function checkModeCompatibility(mode1: VisualizationMode, mode2: VisualizationMode): boolean {
  // Special case: Two note-per-led modes require pixel count check (handled separately)
  if (mode1 === 'note-per-led' && mode2 === 'note-per-led') {
    return false; // Must use checkNotePerLedCompatibility() instead
  }

  // Check if mode2 is in mode1's compatibility list
  return COMPATIBILITY_MATRIX[mode1]?.includes(mode2) ?? false;
}

/**
 * Special compatibility check for note-per-led visualizations
 *
 * Two note-per-led modes are ONLY compatible if they have the same pixel count.
 * Example:
 * - Piano (88 pixels) + Piano (88 pixels) = ✅ Compatible (same count)
 * - Piano (88 pixels) + Guitar (150 pixels) = ❌ Incompatible (different addressing)
 *
 * @param frame1 - First LED frame
 * @param frame2 - Second LED frame
 * @returns true if both frames have same pixel count, false otherwise
 *
 * @example
 * ```typescript
 * const pianoFrame = { pixelData: new Uint8ClampedArray(88 * 3), visualizationMode: 'note-per-led', ... };
 * const guitarFrame = { pixelData: new Uint8ClampedArray(150 * 3), visualizationMode: 'note-per-led', ... };
 *
 * checkNotePerLedCompatibility(pianoFrame, guitarFrame); // false (88 ≠ 150)
 * ```
 */
export function checkNotePerLedCompatibility(frame1: LEDFrame, frame2: LEDFrame): boolean {
  // Only applies to note-per-led modes
  if (frame1.visualizationMode !== 'note-per-led' || frame2.visualizationMode !== 'note-per-led') {
    return true; // Not a note-per-led comparison, use checkModeCompatibility() instead
  }

  // Pixel counts must match (length / 3 because RGB triplets)
  return frame1.pixelData.length === frame2.pixelData.length;
}
