/**
 * useIntervalMode.ts
 * 
 * React hook for managing interval mode state and calculations
 */

import { useState, useCallback, useMemo } from 'react';
import {
  IntervalModeType,
  ScaleType,
  nextIntervalMode,
  pitchForRow,
  pitchClassForRow,
  colorForRow,
  pitchesForTrack,
  INTERVAL_MODES
} from '@/lib/intervalMode';

// ============================================================================
// TYPES
// ============================================================================

export interface IntervalModeState {
  // Current settings
  intervalMode: IntervalModeType;
  rootNote: number;  // 0-11 (C=0)
  scale: ScaleType;
  
  // Actions
  setIntervalMode: (mode: IntervalModeType) => void;
  cycleIntervalMode: () => void;
  setRootNote: (note: number) => void;
  setScale: (scale: ScaleType) => void;
  
  // Pitch calculations
  getPitchForRow: (localRow: number, trackHeight: number) => number;
  getPitchClassForRow: (localRow: number, trackHeight: number) => number;
  getColorForRow: (localRow: number, trackHeight: number) => string;
  getPitchesForTrack: (trackHeight: number) => number[];
  
  // Display
  displayName: string;
}

// ============================================================================
// HOOK
// ============================================================================

export function useIntervalMode(
  initialMode: IntervalModeType = 'thirds',
  initialRoot: number = 0,
  initialScale: ScaleType = 'major'
): IntervalModeState {
  const [intervalMode, setIntervalMode] = useState<IntervalModeType>(initialMode);
  const [rootNote, setRootNote] = useState<number>(initialRoot);
  const [scale, setScale] = useState<ScaleType>(initialScale);
  
  // Cycle to next interval mode
  const cycleIntervalMode = useCallback(() => {
    setIntervalMode(current => nextIntervalMode(current));
  }, []);
  
  // Memoized pitch calculation functions (bound to current state)
  const getPitchForRow = useCallback((localRow: number, trackHeight: number) => {
    return pitchForRow(localRow, trackHeight, intervalMode, rootNote, scale);
  }, [intervalMode, rootNote, scale]);
  
  const getPitchClassForRow = useCallback((localRow: number, trackHeight: number) => {
    return pitchClassForRow(localRow, trackHeight, intervalMode, rootNote, scale);
  }, [intervalMode, rootNote, scale]);
  
  const getColorForRow = useCallback((localRow: number, trackHeight: number) => {
    return colorForRow(localRow, trackHeight, intervalMode, rootNote, scale);
  }, [intervalMode, rootNote, scale]);
  
  const getPitchesForTrack = useCallback((trackHeight: number) => {
    return pitchesForTrack(trackHeight, intervalMode, rootNote, scale);
  }, [intervalMode, rootNote, scale]);
  
  // Display name
  const displayName = useMemo(() => {
    return INTERVAL_MODES[intervalMode].displayName;
  }, [intervalMode]);
  
  return {
    // State
    intervalMode,
    rootNote,
    scale,
    
    // Actions
    setIntervalMode,
    cycleIntervalMode,
    setRootNote,
    setScale,
    
    // Calculations
    getPitchForRow,
    getPitchClassForRow,
    getColorForRow,
    getPitchesForTrack,
    
    // Display
    displayName
  };
}

// ============================================================================
// MULTI-TRACK HOOK (for separate interval modes per track)
// ============================================================================

export interface TrackIntervalModeState {
  melody: IntervalModeState;
  chords: IntervalModeState;
  bass: IntervalModeState;
  rhythm: IntervalModeState;  // Rhythm track typically doesn't use intervals
}

export function useMultiTrackIntervalMode(
  initialRoot: number = 0,
  initialScale: ScaleType = 'major'
): TrackIntervalModeState {
  const melody = useIntervalMode('thirds', initialRoot, initialScale);
  const chords = useIntervalMode('thirds', initialRoot, initialScale);
  const bass = useIntervalMode('thirds', initialRoot, initialScale);
  const rhythm = useIntervalMode('chromatic', initialRoot, initialScale);
  
  return {
    melody,
    chords,
    bass,
    rhythm
  };
}
