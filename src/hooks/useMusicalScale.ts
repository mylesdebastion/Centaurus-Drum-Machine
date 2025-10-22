import { useState, useCallback, useMemo } from 'react';

/**
 * Musical Scale Hook
 *
 * Provides reusable key/scale selection and calculation functionality
 * Used across Piano Roll, Isometric Sequencer, Guitar Fretboard, and other music visualizers
 */

// Root note positions (chromatic scale)
export const ROOT_POSITIONS: Record<string, number> = {
  'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
  'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
};

// All available root notes
export const ROOT_NOTES = Object.keys(ROOT_POSITIONS);

// Scale interval patterns (semitones from root)
export const SCALE_PATTERNS: Record<string, number[]> = {
  'major': [0, 2, 4, 5, 7, 9, 11],        // Major scale (Ionian)
  'minor': [0, 2, 3, 5, 7, 8, 10],        // Natural minor scale (Aeolian)
  'dorian': [0, 2, 3, 5, 7, 9, 10],       // Dorian mode
  'phrygian': [0, 1, 3, 5, 7, 8, 10],     // Phrygian mode
  'lydian': [0, 2, 4, 6, 7, 9, 11],       // Lydian mode
  'mixolydian': [0, 2, 4, 5, 7, 9, 10],   // Mixolydian mode
  'locrian': [0, 1, 3, 5, 6, 8, 10],      // Locrian mode
  'harmonic_minor': [0, 2, 3, 5, 7, 8, 11], // Harmonic minor
  'melodic_minor': [0, 2, 3, 5, 7, 9, 11],  // Melodic minor (ascending)
  'pentatonic_major': [0, 2, 4, 7, 9],    // Major pentatonic
  'pentatonic_minor': [0, 3, 5, 7, 10],   // Minor pentatonic
  'blues': [0, 3, 5, 6, 7, 10],           // Blues scale
  'chromatic': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], // All notes
  'circle_of_fifths': [0, 7, 2, 9, 4, 11]   // Circle of Fifths pattern (C-G-D-A-E-B)
};

// All available scales
export const SCALE_NAMES = Object.keys(SCALE_PATTERNS);

// Scale display names (formatted for UI)
export const SCALE_DISPLAY_NAMES: Record<string, string> = {
  'major': 'Major',
  'minor': 'Minor',
  'dorian': 'Dorian',
  'phrygian': 'Phrygian',
  'lydian': 'Lydian',
  'mixolydian': 'Mixolydian',
  'locrian': 'Locrian',
  'harmonic_minor': 'Harmonic Minor',
  'melodic_minor': 'Melodic Minor',
  'pentatonic_major': 'Pentatonic Major',
  'pentatonic_minor': 'Pentatonic Minor',
  'blues': 'Blues',
  'chromatic': 'Chromatic',
  'circle_of_fifths': 'Circle of Fifths'
};

export type RootNote = keyof typeof ROOT_POSITIONS;
export type ScaleName = keyof typeof SCALE_PATTERNS;

export interface UseMusicalScaleOptions {
  /** Initial root note (default: 'C') */
  initialRoot?: RootNote;
  /** Initial scale (default: 'major') */
  initialScale?: ScaleName;
}

export interface UseMusicalScaleReturn {
  /** Currently selected root note */
  selectedRoot: RootNote;
  /** Currently selected scale */
  selectedScale: ScaleName;
  /** Set the selected root note */
  setSelectedRoot: (root: RootNote) => void;
  /** Set the selected scale */
  setSelectedScale: (scale: ScaleName) => void;
  /** Get the current scale notes (0-11 representing chromatic positions) */
  getCurrentScale: () => number[];
  /** Check if a note (0-11) is in the current scale */
  isNoteInScale: (noteClass: number) => boolean;
  /** Get the display name for the current scale */
  getScaleDisplayName: () => string;
  /** Get the full key signature (e.g., "C Major") */
  getKeySignature: () => string;
  /** Get all available root notes */
  rootNotes: string[];
  /** Get all available scales */
  scaleNames: string[];
}

/**
 * Hook for managing musical scales and keys
 *
 * @example
 * ```tsx
 * const {
 *   selectedRoot,
 *   selectedScale,
 *   setSelectedRoot,
 *   setSelectedScale,
 *   getCurrentScale,
 *   isNoteInScale
 * } = useMusicalScale({ initialRoot: 'C', initialScale: 'major' });
 *
 * const scaleNotes = getCurrentScale(); // [0, 2, 4, 5, 7, 9, 11]
 * const isInKey = isNoteInScale(4); // true (E is in C major)
 * ```
 */
export function useMusicalScale(
  options: UseMusicalScaleOptions = {}
): UseMusicalScaleReturn {
  const { initialRoot = 'C', initialScale = 'major' } = options;

  const [selectedRoot, setSelectedRoot] = useState<RootNote>(initialRoot);
  const [selectedScale, setSelectedScale] = useState<ScaleName>(initialScale);

  /**
   * Calculate the current scale notes based on root and scale pattern
   * Returns array of chromatic note positions (0-11)
   */
  const getCurrentScale = useCallback((): number[] => {
    const rootPos = ROOT_POSITIONS[selectedRoot];
    const pattern = SCALE_PATTERNS[selectedScale];
    return pattern.map(interval => (rootPos + interval) % 12);
  }, [selectedRoot, selectedScale]);

  /**
   * Check if a chromatic note (0-11) is in the current scale
   */
  const isNoteInScale = useCallback((noteClass: number): boolean => {
    const scaleNotes = getCurrentScale();
    return scaleNotes.includes(noteClass % 12);
  }, [getCurrentScale]);

  /**
   * Get the display name for the current scale
   */
  const getScaleDisplayName = useCallback((): string => {
    return SCALE_DISPLAY_NAMES[selectedScale] || selectedScale;
  }, [selectedScale]);

  /**
   * Get the full key signature (e.g., "C Major")
   */
  const getKeySignature = useCallback((): string => {
    return `${selectedRoot} ${getScaleDisplayName()}`;
  }, [selectedRoot, getScaleDisplayName]);

  // Memoize available notes and scales to prevent unnecessary re-renders
  const rootNotes = useMemo(() => ROOT_NOTES, []);
  const scaleNames = useMemo(() => SCALE_NAMES, []);

  return {
    selectedRoot,
    selectedScale,
    setSelectedRoot,
    setSelectedScale,
    getCurrentScale,
    isNoteInScale,
    getScaleDisplayName,
    getKeySignature,
    rootNotes,
    scaleNames
  };
}
