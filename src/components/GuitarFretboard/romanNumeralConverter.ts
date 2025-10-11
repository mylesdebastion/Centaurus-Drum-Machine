// Roman Numeral to Chord Conversion System
// Converts Roman numeral notation to actual chord names based on selected key

import { getChordShape, getChordDisplayName, ChordQuality } from './chordLibrary';
import { Chord } from './chordProgressions';

/**
 * Roman numeral pattern for chord notation
 * Examples: I, ii, iii, IV, V, vi, vii°, V7, ii7, Imaj7
 */
export interface RomanNumeralChord {
  numeral: string;        // Raw Roman numeral (e.g., "ii", "V7", "vii°")
  scaleDegree: number;    // 1-7
  quality: ChordQuality;  // Determined by case and symbols
}

/**
 * Parse Roman numeral notation
 * Examples:
 * - "I" → major (uppercase)
 * - "ii" → minor (lowercase)
 * - "V7" → dominant 7th
 * - "Imaj7" → major 7th
 * - "vii°" → diminished
 * - "bVII" → flat 7 (borrowed chord)
 * - "bVI" → flat 6 (borrowed chord)
 */
export function parseRomanNumeral(numeral: string): RomanNumeralChord {
  // Remove whitespace
  numeral = numeral.trim();

  // Check for accidentals (b = flat, # = sharp)
  // Strip accidentals for parsing - they're handled in romanNumeralToChord function
  let workingNumeral = numeral;

  if (numeral.startsWith('b') || numeral.startsWith('#')) {
    workingNumeral = numeral.slice(1);
  }

  // Extract base numeral (I-VII)
  const numeralMap: Record<string, number> = {
    'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7,
    'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5, 'vi': 6, 'vii': 7
  };

  // Parse the base numeral
  let baseNumeral = '';
  let remaining = '';

  // Try to match Roman numerals (longest first)
  const romanRegex = /^(VII|III|VI|IV|II|V|I|vii|iii|vi|iv|ii|v|i)/;
  const match = workingNumeral.match(romanRegex);

  if (!match) {
    console.error(`Invalid Roman numeral: ${numeral}`);
    return { numeral, scaleDegree: 1, quality: 'major' };
  }

  baseNumeral = match[1];
  remaining = workingNumeral.slice(baseNumeral.length);

  let scaleDegree = numeralMap[baseNumeral];
  const isUpperCase = baseNumeral === baseNumeral.toUpperCase();

  // Apply accidentals to scale degree (for borrowed chords)
  // Store as-is - we'll handle in getNoteFromScaleDegree

  // Determine quality from suffix
  let quality: ChordQuality = isUpperCase ? 'major' : 'minor';

  if (remaining.includes('°')) {
    quality = 'dim';
  } else if (remaining.includes('ø') || remaining.includes('m7b5')) {
    quality = 'm7b5';
  } else if (remaining.includes('maj7')) {
    quality = 'maj7';
  } else if (remaining.includes('m7')) {
    quality = 'm7';
  } else if (remaining.includes('7')) {
    quality = '7';
  } else if (remaining.includes('9')) {
    quality = '9';
  } else if (remaining.includes('5')) {
    quality = '5';
  }

  return {
    numeral,
    scaleDegree,
    quality
  };
}

/**
 * Get note name for a scale degree in a given key
 * Uses chromatic intervals from root
 */
export function getNoteFromScaleDegree(
  keyRoot: string,
  scaleDegree: number,
  scaleType: 'major' | 'minor' = 'major'
): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // Map note names to chromatic positions
  const noteMap: Record<string, number> = {
    'C': 0, 'C#': 1, 'Db': 1,
    'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4,
    'F': 5, 'F#': 6, 'Gb': 6,
    'G': 7, 'G#': 8, 'Ab': 8,
    'A': 9, 'A#': 10, 'Bb': 10,
    'B': 11
  };

  const rootPosition = noteMap[keyRoot];
  if (rootPosition === undefined) {
    console.error(`Invalid key root: ${keyRoot}`);
    return 'C';
  }

  // Major scale intervals: W W H W W W H (0, 2, 4, 5, 7, 9, 11)
  // Minor scale intervals: W H W W H W W (0, 2, 3, 5, 7, 8, 10)
  const majorScaleIntervals = [0, 2, 4, 5, 7, 9, 11];
  const minorScaleIntervals = [0, 2, 3, 5, 7, 8, 10];

  const intervals = scaleType === 'major' ? majorScaleIntervals : minorScaleIntervals;
  const interval = intervals[(scaleDegree - 1) % 7];

  const targetPosition = (rootPosition + interval) % 12;
  return noteNames[targetPosition];
}

/**
 * Convert Roman numeral to actual chord based on key
 * @param romanNumeral - Roman numeral notation (e.g., "ii", "V7", "Imaj7", "bVII")
 * @param keyRoot - Root note of the key (e.g., "C", "G", "D")
 * @param scaleType - Major or minor key
 * @returns Chord object with actual guitar voicing, or undefined if not available
 */
export function romanNumeralToChord(
  romanNumeral: string,
  keyRoot: string,
  scaleType: 'major' | 'minor' = 'major'
): Chord | undefined {
  const parsed = parseRomanNumeral(romanNumeral);

  // Handle borrowed chords (bVII, bVI, etc.)
  let chordRoot: string;
  if (romanNumeral.startsWith('b')) {
    // Borrowed chord - calculate chromatically
    const noteMap: Record<string, number> = {
      'C': 0, 'C#': 1, 'Db': 1,
      'D': 2, 'D#': 3, 'Eb': 3,
      'E': 4,
      'F': 5, 'F#': 6, 'Gb': 6,
      'G': 7, 'G#': 8, 'Ab': 8,
      'A': 9, 'A#': 10, 'Bb': 10,
      'B': 11
    };
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const rootPosition = noteMap[keyRoot] ?? 0;

    // For bVII, it's 10 semitones up (flat 7)
    // For bVI, it's 8 semitones up (flat 6)
    const degreeToInterval: Record<number, number> = {
      1: 0,   // I
      2: 1,   // bII
      3: 3,   // bIII
      4: 5,   // IV
      5: 6,   // bV
      6: 8,   // bVI
      7: 10   // bVII
    };

    const interval = degreeToInterval[parsed.scaleDegree] ?? 0;
    const targetPosition = (rootPosition + interval) % 12;
    chordRoot = noteNames[targetPosition];
  } else {
    chordRoot = getNoteFromScaleDegree(keyRoot, parsed.scaleDegree, scaleType);
  }

  const chordShape = getChordShape(chordRoot, parsed.quality);

  if (!chordShape) {
    console.warn(`Chord shape not found: ${chordRoot}-${parsed.quality}`);
    return undefined;
  }

  return {
    name: getChordDisplayName(chordRoot, parsed.quality),
    notes: chordShape.notes
  };
}

/**
 * Convert array of Roman numerals to actual chords
 */
export function romanNumeralsToChords(
  romanNumerals: string[],
  keyRoot: string,
  scaleType: 'major' | 'minor' = 'major'
): Chord[] {
  return romanNumerals
    .map(rn => romanNumeralToChord(rn, keyRoot, scaleType))
    .filter((chord): chord is Chord => chord !== undefined);
}

/**
 * Get default chord quality for scale degree in major key
 * I, IV, V = major
 * ii, iii, vi = minor
 * vii° = diminished
 */
export function getDefaultMajorScaleQuality(scaleDegree: number): ChordQuality {
  switch (scaleDegree) {
    case 1: case 4: case 5:
      return 'major';
    case 2: case 3: case 6:
      return 'minor';
    case 7:
      return 'dim';
    default:
      return 'major';
  }
}

/**
 * Get default chord quality for scale degree in natural minor key
 * i, iv, v = minor
 * III, VI, VII = major
 * ii° = diminished
 */
export function getDefaultMinorScaleQuality(scaleDegree: number): ChordQuality {
  switch (scaleDegree) {
    case 1: case 4: case 5:
      return 'minor';
    case 3: case 6: case 7:
      return 'major';
    case 2:
      return 'dim';
    default:
      return 'minor';
  }
}
