/**
 * Shared TypeScript Types for Chord Progression System
 * Epic 15 - Story 15.1: Chord Progression Service Extraction
 *
 * These types are shared across:
 * - ChordProgressionService (src/services/chordProgressionService.ts)
 * - GuitarFretboard component (src/components/GuitarFretboard/)
 * - ChordMelodyArranger module (src/components/Studio/modules/ChordMelodyArranger/)
 */

/**
 * Individual note within a chord
 * Guitar-specific: string/fret positions
 */
export interface ChordNote {
  string: number;  // 1-6 (1 = high E string, 6 = low E string)
  fret: number;    // 0-24 (0 = open string)
}

/**
 * Chord with guitar voicing
 */
export interface Chord {
  name: string;         // e.g., "Cmaj7", "Am", "G7"
  notes: ChordNote[];   // Array of fret/string positions
}

/**
 * Collection of chords forming a progression
 */
export interface ChordProgression {
  name: string;         // e.g., "Jazz ii-V-I in C"
  chords: Chord[];      // Array of chords in the progression
}

/**
 * Roman Numeral Chord Progression
 * Key-agnostic representation that adapts to any key
 *
 * Examples:
 * - "I-V-vi-IV" (Pop progression)
 * - "ii7-V7-Imaj7" (Jazz ii-V-I)
 * - "I7-IV7-V7" (Blues)
 */
export interface RomanNumeralProgression {
  name: string;                 // e.g., "Pop I-V-vi-IV"
  romanNumerals: string[];      // e.g., ["I", "V", "vi", "IV"]
  description: string;          // e.g., "Classic pop progression (Journey, Blink-182)"
  genre: string;                // e.g., "Pop", "Jazz", "Blues", "Rock"
  scaleType: 'major' | 'minor'; // Scale context for resolution
}

/**
 * Root note type (for key signatures)
 * Includes enharmonic equivalents (C#/Db, F#/Gb, etc.)
 */
export type RootNote =
  | 'C' | 'C#' | 'Db'
  | 'D' | 'D#' | 'Eb'
  | 'E'
  | 'F' | 'F#' | 'Gb'
  | 'G' | 'G#' | 'Ab'
  | 'A' | 'A#' | 'Bb'
  | 'B';

/**
 * Scale type for chord resolution
 * Used by GlobalMusicContext and ChordProgressionService
 */
export type ScaleType = 'major' | 'minor';
