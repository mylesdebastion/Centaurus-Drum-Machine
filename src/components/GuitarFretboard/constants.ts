// Guitar Fretboard Constants and Helper Functions
// Story 9.3: Guitar Fretboard Visualizer with LED Matrix Output

export const GUITAR_CONSTANTS = {
  STRINGS: 6,
  FRETS: 25,
  TOTAL_POSITIONS: 150  // 6 × 25
};

// Standard tuning (MIDI note offsets from C)
export const STANDARD_TUNING = [
  4,  // String 6 (Low E)
  9,  // String 5 (A)
  2,  // String 4 (D)
  7,  // String 3 (G)
  11, // String 2 (B)
  4   // String 1 (High E)
];

export const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'E'];

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Create fretboard matrix (6 strings × 25 frets)
 * Each cell contains the note class (0-11) for that position
 */
export function createFretboardMatrix(): number[][] {
  return STANDARD_TUNING.map(openNote =>
    Array.from({ length: GUITAR_CONSTANTS.FRETS }, (_, fret) => (openNote + fret) % 12)
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
 * @returns MIDI note number
 */
export function getMIDINoteFromFret(string: number, fret: number): number {
  const baseNote = STANDARD_TUNING[string];
  const octave = 3 + Math.floor((baseNote + fret) / 12);
  const noteClass = (baseNote + fret) % 12;
  return octave * 12 + noteClass + 12;  // Adjust for MIDI numbering
}
