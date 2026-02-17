/**
 * useSetToggle.ts
 * 
 * Manages set toggling for accessing all 12 chromatic notes
 * within the 6-row (melodic) or 4-row (bass) UI constraint.
 * 
 * Ported from SetToggleManager.swift
 */

import { useState, useCallback } from 'react';
import * as SetToggleManager from '@/lib/setToggleManager';

// ============================================================================
// TYPES
// ============================================================================

export type TrackType = 'melody' | 'chords' | 'bass' | 'rhythm';

export interface SetState {
  melody: number;
  chords: number;
  bass: number;
  rhythm: number;
}

export interface UseSetToggleResult {
  /** Current set for each track (1-based) */
  currentSets: SetState;
  
  /** Toggle to next set for a track */
  toggleSet: (track: TrackType) => void;
  
  /** Get visible slots for a track's current set */
  getVisibleSlots: (track: TrackType) => ReadonlyArray<number>;
  
  /** Get display string for set indicator (●, ●●, ●●●) */
  getDisplayString: (track: TrackType) => string;
  
  /** Convert local row to slot index */
  rowToSlot: (localRow: number, track: TrackType) => number;
  
  /** Convert slot index to local row (or null if not visible) */
  slotToRow: (slot: number, track: TrackType) => number | null;
  
  /** Check if slot is visible in current set */
  isSlotVisible: (slot: number, track: TrackType) => boolean;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for managing set toggling across all tracks
 * @param onSetChange - Optional callback when set changes
 */
export function useSetToggle(
  onSetChange?: (track: TrackType, newSet: number) => void
): UseSetToggleResult {
  
  // Track current set per track (1-based)
  const [currentSets, setCurrentSets] = useState<SetState>({
    melody: 1,
    chords: 1,
    bass: 1,
    rhythm: 1,
  });
  
  // Toggle to next set for a track
  const toggleSet = useCallback((track: TrackType) => {
    setCurrentSets(prev => {
      const currentSet = prev[track];
      const newSet = SetToggleManager.nextSet(currentSet, track);
      
      // Only update if set actually changed
      if (newSet === currentSet) {
        return prev;
      }
      
      // Trigger callback if provided
      if (onSetChange) {
        onSetChange(track, newSet);
      }
      
      console.log(`[SetToggle] ${track}: set ${currentSet} → ${newSet}`);
      
      return {
        ...prev,
        [track]: newSet,
      };
    });
  }, [onSetChange]);
  
  // Get visible slots for a track's current set
  const getVisibleSlots = useCallback((track: TrackType): ReadonlyArray<number> => {
    return SetToggleManager.getVisibleSlots(track, currentSets[track]);
  }, [currentSets]);
  
  // Get display string for set indicator
  const getDisplayString = useCallback((track: TrackType): string => {
    return SetToggleManager.displayString(currentSets[track]);
  }, [currentSets]);
  
  // Convert local row to slot index
  const rowToSlot = useCallback((localRow: number, track: TrackType): number => {
    return SetToggleManager.rowToSlot(localRow, track, currentSets[track]);
  }, [currentSets]);
  
  // Convert slot index to local row (or null if not visible)
  const slotToRow = useCallback((slot: number, track: TrackType): number | null => {
    return SetToggleManager.slotToRow(slot, track, currentSets[track]);
  }, [currentSets]);
  
  // Check if slot is visible in current set
  const isSlotVisible = useCallback((slot: number, track: TrackType): boolean => {
    return SetToggleManager.isSlotVisible(slot, track, currentSets[track]);
  }, [currentSets]);
  
  return {
    currentSets,
    toggleSet,
    getVisibleSlots,
    getDisplayString,
    rowToSlot,
    slotToRow,
    isSlotVisible,
  };
}
