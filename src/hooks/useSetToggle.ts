/**
 * useSetToggle.ts
 * 
 * Manages set toggling for tracks (6→12 note access)
 * Ported from iOS SetToggleManager.swift
 * 
 * Set mapping:
 * - Melody/Chords: 2 sets (6 notes each) = 12 chromatic notes
 * - Bass: 3 sets (4 notes each) = 12 chromatic notes
 * - Rhythm: No sets (12 drums, no toggling)
 * 
 * Visual encoding (column 4):
 * - Set 1: Single dot (●)
 * - Set 2: Two dots (●●)
 * - Set 3: Three dots (●●●) - bass only
 */

import { useState, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type TrackType = 'melody' | 'chords' | 'bass' | 'rhythm';

export interface SetState {
  melody: number;  // 1 or 2
  chords: number;  // 1 or 2
  bass: number;    // 1, 2, or 3
  rhythm: number;  // Always 1 (no sets)
}

export interface SetToggleState {
  currentSets: SetState;
  toggleSet: (track: TrackType) => void;
  rowToSlot: (localRow: number, track: TrackType) => number;
  getSetIndicator: (track: TrackType) => string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Track heights (number of visible rows)
const TRACK_HEIGHTS: Record<TrackType, number> = {
  melody: 6,
  chords: 6,
  bass: 4,
  rhythm: 4
};

// Set counts per track
const SET_COUNTS: Record<TrackType, number> = {
  melody: 2,
  chords: 2,
  bass: 3,
  rhythm: 1
};

// ============================================================================
// SET MAPPING LOGIC
// ============================================================================

/**
 * Map visual row (0-5 or 0-3) to chromatic slot (0-11) based on current set
 * 
 * Melody/Chords (6 rows, 2 sets):
 * - Set 1: rows 0-5 → slots 0, 2, 4, 6, 8, 10 (even)
 * - Set 2: rows 0-5 → slots 1, 3, 5, 7, 9, 11 (odd)
 * 
 * Bass (4 rows, 3 sets):
 * - Set 1: rows 0-3 → slots 0, 3, 6, 9
 * - Set 2: rows 0-3 → slots 1, 4, 7, 10
 * - Set 3: rows 0-3 → slots 2, 5, 8, 11
 */
function mapRowToSlot(localRow: number, track: TrackType, set: number): number {
  const height = TRACK_HEIGHTS[track];
  
  if (track === 'rhythm') {
    // Rhythm: direct mapping (no sets)
    return localRow;
  }
  
  if (track === 'bass') {
    // Bass: 3 sets of 4 notes each
    // Set 1: 0, 3, 6, 9
    // Set 2: 1, 4, 7, 10
    // Set 3: 2, 5, 8, 11
    const setOffset = set - 1;  // 0, 1, or 2
    return (localRow * 3) + setOffset;
  }
  
  // Melody/Chords: 2 sets of 6 notes each
  // Set 1: even slots (0, 2, 4, 6, 8, 10)
  // Set 2: odd slots (1, 3, 5, 7, 9, 11)
  const setOffset = set - 1;  // 0 or 1
  return (localRow * 2) + setOffset;
}

/**
 * Get visual indicator string for set display
 */
function getIndicatorForSet(track: TrackType, set: number): string {
  if (track === 'rhythm') {
    return '';  // No set indicator for rhythm
  }
  
  if (track === 'bass') {
    // Bass: 1-3 dots
    return '●'.repeat(set);
  }
  
  // Melody/Chords: 1-2 dots
  return '●'.repeat(set);
}

// ============================================================================
// HOOK
// ============================================================================

export function useSetToggle(): SetToggleState {
  const [currentSets, setCurrentSets] = useState<SetState>({
    melody: 1,
    chords: 1,
    bass: 1,
    rhythm: 1
  });
  
  const toggleSet = useCallback((track: TrackType) => {
    if (track === 'rhythm') {
      return;  // Rhythm doesn't have sets
    }
    
    setCurrentSets(prev => {
      const maxSet = SET_COUNTS[track];
      const nextSet = (prev[track] % maxSet) + 1;
      
      console.log(`[SetToggle] ${track}: set ${prev[track]} → ${nextSet}`);
      
      return {
        ...prev,
        [track]: nextSet
      };
    });
  }, []);
  
  const rowToSlot = useCallback((localRow: number, track: TrackType): number => {
    const set = currentSets[track];
    return mapRowToSlot(localRow, track, set);
  }, [currentSets]);
  
  const getSetIndicator = useCallback((track: TrackType): string => {
    const set = currentSets[track];
    return getIndicatorForSet(track, set);
  }, [currentSets]);
  
  return {
    currentSets,
    toggleSet,
    rowToSlot,
    getSetIndicator
  };
}
