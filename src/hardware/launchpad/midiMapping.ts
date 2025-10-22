/**
 * Launchpad Pro MIDI Note Mapping Utilities
 *
 * Converts between MIDI note numbers and grid coordinates.
 * Row-based mapping with 16-note increments per row.
 * Reference: research/launchpad-pro-integration-findings.md#46-75
 */

import { GRID_NOTES } from './constants';

/**
 * Grid coordinate interface
 */
export interface GridCoordinates {
  /** Row number (1-8, bottom to top) */
  row: number;
  /** Column number (1-8, left to right) */
  col: number;
}

/**
 * Convert MIDI note number to grid coordinates
 *
 * Mapping formula:
 * - Row = floor(note / 16) + 1
 * - Col = (note % 16) + 1
 *
 * Example:
 * - Note 0 (bottom-left) → {row: 1, col: 1}
 * - Note 119 (top-right) → {row: 8, col: 8}
 *
 * @param note MIDI note number (0-119)
 * @returns Grid coordinates {row, col} (1-indexed)
 */
export const noteToGridCoordinates = (note: number): GridCoordinates | null => {
  if (note < GRID_NOTES.MIN || note > GRID_NOTES.MAX) {
    return null;
  }

  const row = Math.floor(note / 16) + 1;
  const col = (note % 16) + 1;

  // Launchpad Pro only uses columns 1-8 (notes 0-7, 16-23, 32-39, etc.)
  if (col > 8) {
    return null;
  }

  return { row, col };
};

/**
 * Convert grid coordinates to MIDI note number
 *
 * Formula: note = (row - 1) * 16 + (col - 1)
 *
 * Example:
 * - {row: 1, col: 1} → Note 0 (bottom-left)
 * - {row: 8, col: 8} → Note 119 (top-right)
 *
 * @param row Row number (1-8)
 * @param col Column number (1-8)
 * @returns MIDI note number (0-119) or null if invalid
 */
export const gridCoordinatesToNote = (row: number, col: number): number | null => {
  // Validate input range
  if (row < 1 || row > 8 || col < 1 || col > 8) {
    return null;
  }

  const note = (row - 1) * 16 + (col - 1);

  // Verify note is in valid range
  if (note < GRID_NOTES.MIN || note > GRID_NOTES.MAX) {
    return null;
  }

  return note;
};

/**
 * Create lookup table for fast step-to-note conversion
 * Assumes standard 8×8 grid layout (64 steps)
 *
 * Step order: left-to-right, bottom-to-top
 * Step 0 → Note 0 (row 1, col 1)
 * Step 63 → Note 119 (row 8, col 8)
 */
export const createStepToNoteMap = (): Map<number, number> => {
  const map = new Map<number, number>();

  for (let step = 0; step < GRID_NOTES.TOTAL_PADS; step++) {
    const row = Math.floor(step / 8) + 1; // 8 columns per row
    const col = (step % 8) + 1;
    const note = gridCoordinatesToNote(row, col);
    if (note !== null) {
      map.set(step, note);
    }
  }

  return map;
};

/**
 * Create lookup table for fast note-to-step conversion
 */
export const createNoteToStepMap = (): Map<number, number> => {
  const map = new Map<number, number>();

  for (let step = 0; step < GRID_NOTES.TOTAL_PADS; step++) {
    const row = Math.floor(step / 8) + 1;
    const col = (step % 8) + 1;
    const note = gridCoordinatesToNote(row, col);
    if (note !== null) {
      map.set(note, step);
    }
  }

  return map;
};

/**
 * Default grid mapping (8×8 layout)
 */
export interface GridMapping {
  stepToNote: Map<number, number>;
  noteToStep: Map<number, number>;
}

/**
 * Initialize default 8×8 grid mapping
 */
export const createDefaultGridMapping = (): GridMapping => {
  return {
    stepToNote: createStepToNoteMap(),
    noteToStep: createNoteToStepMap(),
  };
};
