/**
 * Piano Roll Constants
 *
 * Defines the standard 88-key piano layout (A0 to C8)
 */

export const PIANO_CONSTANTS = {
  TOTAL_KEYS: 88,
  FIRST_MIDI_NOTE: 21,  // A0
  LAST_MIDI_NOTE: 108,  // C8
  DEFAULT_VISIBLE_OCTAVES: 4,  // C3-C5 (middle range)
  DEFAULT_START_OCTAVE: 3,     // Start at C3
};

// Note names for display
export const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];

// White key indices (0-11 representing C-B)
export const WHITE_KEYS = [0, 2, 4, 5, 7, 9, 11]; // C, D, E, F, G, A, B

// Black key indices (0-11 representing C-B)
export const BLACK_KEYS = [1, 3, 6, 8, 10]; // C#, D#, F#, G#, A#

/**
 * Check if a MIDI note is a white key
 */
export function isWhiteKey(midiNote: number): boolean {
  const noteClass = midiNote % 12;
  return WHITE_KEYS.includes(noteClass);
}

/**
 * Check if a MIDI note is a black key
 */
export function isBlackKey(midiNote: number): boolean {
  const noteClass = midiNote % 12;
  return BLACK_KEYS.includes(noteClass);
}

/**
 * Get note name with octave from MIDI note number
 */
export function getNoteNameWithOctave(midiNote: number): string {
  const noteClass = midiNote % 12;
  const octave = Math.floor(midiNote / 12) - 1;
  return `${NOTE_NAMES[noteClass]}${octave}`;
}

/**
 * Get white key index (0-based) for a given MIDI note
 * Returns the position among white keys only
 */
export function getWhiteKeyIndex(midiNote: number): number {
  let whiteKeyCount = 0;

  for (let i = PIANO_CONSTANTS.FIRST_MIDI_NOTE; i < midiNote; i++) {
    if (isWhiteKey(i)) {
      whiteKeyCount++;
    }
  }

  return whiteKeyCount;
}

/**
 * Get total number of white keys in the 88-key range
 */
export function getTotalWhiteKeys(): number {
  let count = 0;
  for (let i = PIANO_CONSTANTS.FIRST_MIDI_NOTE; i <= PIANO_CONSTANTS.LAST_MIDI_NOTE; i++) {
    if (isWhiteKey(i)) {
      count++;
    }
  }
  return count;
}

/**
 * Get visible MIDI note range based on octaves to display
 */
export function getVisibleNoteRange(startOctave: number, numOctaves: number): { start: number; end: number } {
  // C is note 0, so octave N starts at MIDI note (N+1)*12
  const start = (startOctave + 1) * 12;
  const end = start + (numOctaves * 12) - 1;

  return {
    start: Math.max(start, PIANO_CONSTANTS.FIRST_MIDI_NOTE),
    end: Math.min(end, PIANO_CONSTANTS.LAST_MIDI_NOTE),
  };
}

/**
 * Piano key rendering dimensions
 */
export const KEY_DIMENSIONS = {
  WHITE_KEY_ASPECT: 6,      // Height is 6x width
  BLACK_KEY_WIDTH_RATIO: 0.6,  // Black key width is 60% of white key width
  BLACK_KEY_HEIGHT_RATIO: 0.6, // Black key height is 60% of white key height
};

/**
 * LED strip mapping for WLED
 * 144 LEDs total: one LED per piano key + spacing LEDs
 */
export const LED_STRIP = {
  TOTAL_LEDS: 144,
  LEDS_PER_KEY: 144 / PIANO_CONSTANTS.TOTAL_KEYS, // ~1.64 LEDs per key

  /**
   * Map MIDI note to LED index
   * LED 0 = A0 (MIDI 21)
   * LED 87 = C8 (MIDI 108)
   */
  midiNoteToLED(midiNote: number): number {
    const keyIndex = midiNote - PIANO_CONSTANTS.FIRST_MIDI_NOTE;
    return Math.floor((keyIndex / PIANO_CONSTANTS.TOTAL_KEYS) * LED_STRIP.TOTAL_LEDS);
  },

  /**
   * Get LED range for a MIDI note (may span multiple LEDs)
   */
  getLEDRange(midiNote: number): { start: number; end: number } {
    const keyIndex = midiNote - PIANO_CONSTANTS.FIRST_MIDI_NOTE;
    const start = Math.floor((keyIndex / PIANO_CONSTANTS.TOTAL_KEYS) * LED_STRIP.TOTAL_LEDS);
    const end = Math.floor(((keyIndex + 1) / PIANO_CONSTANTS.TOTAL_KEYS) * LED_STRIP.TOTAL_LEDS);
    return { start, end: Math.max(start, end - 1) };
  }
};
