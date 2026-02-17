/**
 * intervalMode.ts
 * 
 * Interval mode for note layout on grid rows.
 * Uses DIATONIC intervals (scale-based) for unique pitches per row.
 * Ported from iOS IntervalMode.swift
 */

// ============================================================================
// TYPES
// ============================================================================

export type IntervalModeType = 'thirds' | 'fourths' | 'fifths' | 'sevenths' | 'ninths' | 'chromatic';
export type ScaleType = 'major' | 'minor' | 'penta';

export interface IntervalMode {
  type: IntervalModeType;
  scaleDegreeSkip: number;
  displayName: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Scale intervals (semitones from root) */
const SCALE_INTERVALS: Record<ScaleType, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],           // C D E F G A B
  minor: [0, 2, 3, 5, 7, 8, 10],           // C D Eb F G Ab Bb
  penta: [0, 2, 4, 7, 9],                  // C D E G A (5 notes)
};

/** All available interval modes */
export const INTERVAL_MODES: Record<IntervalModeType, IntervalMode> = {
  thirds: {
    type: 'thirds',
    scaleDegreeSkip: 2,      // 1→3→5→7→2→4→6
    displayName: '3RDS'
  },
  fourths: {
    type: 'fourths',
    scaleDegreeSkip: 3,      // 1→4→7→3→6→2→5
    displayName: '4THS'
  },
  fifths: {
    type: 'fifths',
    scaleDegreeSkip: 4,      // 1→5→2→6→3→7→4
    displayName: '5THS'
  },
  sevenths: {
    type: 'sevenths',
    scaleDegreeSkip: 6,      // 1→7→6→5→4→3→2
    displayName: '7THS'
  },
  ninths: {
    type: 'ninths',
    scaleDegreeSkip: 2,      // Like 3rds but we add octave
    displayName: '9THS'
  },
  chromatic: {
    type: 'chromatic',
    scaleDegreeSkip: 0,      // Special case - use semitones
    displayName: 'CHROM'
  }
};

/** Ordered list of interval modes for cycling */
export const INTERVAL_MODE_ORDER: IntervalModeType[] = [
  'thirds',
  'fourths',
  'fifths',
  'sevenths',
  'ninths',
  'chromatic'
];

// ============================================================================
// INTERVAL MODE UTILITIES
// ============================================================================

/**
 * Get the next interval mode in the cycle
 */
export function nextIntervalMode(current: IntervalModeType): IntervalModeType {
  const currentIndex = INTERVAL_MODE_ORDER.indexOf(current);
  const nextIndex = (currentIndex + 1) % INTERVAL_MODE_ORDER.length;
  return INTERVAL_MODE_ORDER[nextIndex];
}

/**
 * Get the previous interval mode in the cycle
 */
export function prevIntervalMode(current: IntervalModeType): IntervalModeType {
  const currentIndex = INTERVAL_MODE_ORDER.indexOf(current);
  const prevIndex = (currentIndex - 1 + INTERVAL_MODE_ORDER.length) % INTERVAL_MODE_ORDER.length;
  return INTERVAL_MODE_ORDER[prevIndex];
}

// ============================================================================
// PITCH CALCULATION (DIATONIC INTERVALS)
// ============================================================================

/**
 * Get scale intervals for a given scale type
 */
function intervalsForScale(scale: ScaleType): number[] {
  return SCALE_INTERVALS[scale];
}

/**
 * Calculate MIDI pitch for a given row within a track using diatonic intervals
 * 
 * @param localRow - Row index within the track (0 = top, height-1 = bottom)
 * @param trackHeight - Number of rows in the track (6 for melody/chords, 4 for bass)
 * @param intervalMode - The interval mode type to use
 * @param rootNote - The root note of the current key (0-11, where 0=C)
 * @param scale - The scale to use (major, minor, pentatonic)
 * @returns MIDI pitch (unique per row, can span multiple octaves)
 */
export function pitchForRow(
  localRow: number,
  trackHeight: number,
  intervalMode: IntervalModeType,
  rootNote: number = 0,
  scale: ScaleType = 'major'
): number {
  // Bottom row (highest localRow) = root note
  const rowsFromBottom = trackHeight - 1 - localRow;
  
  if (intervalMode === 'chromatic') {
    // Chromatic mode: each row is 1 semitone apart
    return rootNote + rowsFromBottom;
  }
  
  // Get scale intervals
  const scaleIntervals = intervalsForScale(scale);
  const scaleSize = scaleIntervals.length;
  
  // Diatonic mode: use scale degrees
  const mode = INTERVAL_MODES[intervalMode];
  const degreeSkip = mode.scaleDegreeSkip;
  
  // Calculate which scale degree this row represents
  // Start from degree 0 (root), skip by degreeSkip for each row up
  const scaleDegreeIndex = (rowsFromBottom * degreeSkip) % scaleSize;
  const octaveOffset = Math.floor((rowsFromBottom * degreeSkip) / scaleSize);
  
  // Get the semitone offset for this scale degree
  const semitoneInScale = scaleIntervals[scaleDegreeIndex];
  
  // Calculate final pitch
  let pitch = rootNote + semitoneInScale + (octaveOffset * 12);
  
  // For 9ths mode, add an extra octave for rows beyond the first
  if (intervalMode === 'ninths' && rowsFromBottom > 0) {
    pitch += 12;
  }
  
  return pitch;
}

/**
 * Get pitch class (0-11) for color mapping
 * This maps any MIDI pitch to its chromatic color
 */
export function pitchClassForRow(
  localRow: number,
  trackHeight: number,
  intervalMode: IntervalModeType,
  rootNote: number = 0,
  scale: ScaleType = 'major'
): number {
  const pitch = pitchForRow(localRow, trackHeight, intervalMode, rootNote, scale);
  return ((pitch % 12) + 12) % 12;  // Ensure positive result
}

/**
 * Get all pitches for a track in the current interval mode
 */
export function pitchesForTrack(
  trackHeight: number,
  intervalMode: IntervalModeType,
  rootNote: number = 0,
  scale: ScaleType = 'major'
): number[] {
  return Array.from({ length: trackHeight }, (_, localRow) =>
    pitchForRow(localRow, trackHeight, intervalMode, rootNote, scale)
  );
}

/**
 * Get color for a pitch class (0-11) using chromatic color mapping
 */
export function colorForPitchClass(pitchClass: number): string {
  const NOTE_COLORS: Record<number, string> = {
    0: '#ff0000',   // C - Red
    1: '#ff4500',   // C# - Orange-Red
    2: '#ff8c00',   // D - Dark Orange
    3: '#ffc800',   // D# - Orange
    4: '#ffff00',   // E - Yellow
    5: '#9acd32',   // F - Yellow-Green
    6: '#00ff00',   // F# - Green
    7: '#00ffaa',   // G - Spring Green
    8: '#00ffff',   // G# - Cyan
    9: '#00aaff',   // A - Sky Blue
    10: '#0055ff',  // A# - Blue
    11: '#8a2be2',  // B - Blue-Violet
  };
  
  return NOTE_COLORS[pitchClass] || '#808080';
}

/**
 * Get color for a row using interval mode and scale
 */
export function colorForRow(
  localRow: number,
  trackHeight: number,
  intervalMode: IntervalModeType,
  rootNote: number = 0,
  scale: ScaleType = 'major'
): string {
  const pitchClass = pitchClassForRow(localRow, trackHeight, intervalMode, rootNote, scale);
  return colorForPitchClass(pitchClass);
}

// ============================================================================
// DEBUG UTILITIES
// ============================================================================

/**
 * Debug: print pitches for verification
 */
export function debugPitches(
  trackHeight: number,
  intervalMode: IntervalModeType,
  rootNote: number = 0,
  scale: ScaleType = 'major'
): void {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const mode = INTERVAL_MODES[intervalMode];
  
  console.log(`Interval mode: ${mode.displayName}, root: ${noteNames[rootNote]}, scale: ${scale}`);
  
  for (let row = 0; row < trackHeight; row++) {
    const pitch = pitchForRow(row, trackHeight, intervalMode, rootNote, scale);
    const pitchClass = pitchClassForRow(row, trackHeight, intervalMode, rootNote, scale);
    const octave = Math.floor(pitch / 12);
    const color = colorForRow(row, trackHeight, intervalMode, rootNote, scale);
    
    console.log(`  Row ${row}: pitch=${pitch}, note=${noteNames[pitchClass]}${octave}, color=${color}`);
  }
}
