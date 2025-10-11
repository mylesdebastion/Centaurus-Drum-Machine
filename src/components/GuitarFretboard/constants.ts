// Guitar Fretboard Constants and Helper Functions
// Story 9.3: Guitar Fretboard Visualizer with LED Matrix Output

import { getTuningMIDINotes, GUITAR_TUNINGS } from './tunings';

export const GUITAR_CONSTANTS = {
  STRINGS: 6,
  FRETS: 25,
  TOTAL_POSITIONS: 150  // 6 × 25
};

// Get tuning arrays (default to Standard E)
const standardTuning = GUITAR_TUNINGS[0]; // "Standard (E)"
export const STANDARD_TUNING_MIDI = getTuningMIDINotes(standardTuning);

// Standard tuning (note classes 0-11, for color mapping)
export const STANDARD_TUNING = STANDARD_TUNING_MIDI.map(midi => midi % 12);

// String names from tuning
export const STRING_NAMES = standardTuning.strings.map(note => note.replace(/[0-9]/g, ''));

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Create fretboard matrix (6 strings × 25 frets)
 * Each cell contains the note class (0-11) for that position
 * @param tuningMIDINotes - Optional array of MIDI notes for custom tuning
 */
export function createFretboardMatrix(tuningMIDINotes?: number[]): number[][] {
  const tuning = tuningMIDINotes || STANDARD_TUNING_MIDI;
  return tuning.map(openMIDI =>
    Array.from({ length: GUITAR_CONSTANTS.FRETS }, (_, fret) => (openMIDI + fret) % 12)
  );
}

/**
 * Convert string/fret position to LED index (serpentine wiring)
 * @param string - String number (0-5, where 0 = low E)
 * @param fret - Fret number (0-24)
 * @returns LED index (0-149) for serpentine wiring pattern
 */
export function fretboardToLEDIndex(string: number, fret: number): number {
  // string: 0-5 (0 = low E)
  // fret: 0-24
  if (string % 2 === 0) {
    // Even rows: left to right
    return string * 25 + fret;
  } else {
    // Odd rows: right to left (serpentine)
    return string * 25 + (24 - fret);
  }
}

/**
 * Get MIDI note number for fret position
 * @param string - String number (0-5, where 0 = low E)
 * @param fret - Fret number (0-24)
 * @param tuningMIDINotes - Optional array of MIDI notes for custom tuning
 * @returns MIDI note number
 */
export function getMIDINoteFromFret(string: number, fret: number, tuningMIDINotes?: number[]): number {
  const tuning = tuningMIDINotes || STANDARD_TUNING_MIDI;
  return tuning[string] + fret;
}
