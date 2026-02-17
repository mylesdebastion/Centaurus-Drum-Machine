/**
 * setToggleManager.ts
 * 
 * Set toggling for 6→12 note access.
 * Maps visible rows to pattern slots based on current set.
 * 
 * Ported from SetToggleManager.swift
 */

export type TrackType = 'melody' | 'chords' | 'bass' | 'rhythm';

// ============================================================================
// SET SLOT MAPPINGS
// ============================================================================

/**
 * Melodic tracks (6 visible rows)
 * Set 1: Odd slots (11, 9, 7, 5, 3, 1) - high to low
 * Set 2: Even slots (10, 8, 6, 4, 2, 0) - high to low
 */
const MELODIC_SET_1: ReadonlyArray<number> = [11, 9, 7, 5, 3, 1];
const MELODIC_SET_2: ReadonlyArray<number> = [10, 8, 6, 4, 2, 0];

/**
 * Bass track (4 visible rows)
 * Set 1: Primary bass notes (7, 5, 3, 1) - fifths and thirds
 * Set 2: Extended range (11, 9, 4, 2)
 * Set 3: Remaining slots (10, 8, 6, 0)
 */
const BASS_SET_1: ReadonlyArray<number> = [7, 5, 3, 1];
const BASS_SET_2: ReadonlyArray<number> = [11, 9, 4, 2];
const BASS_SET_3: ReadonlyArray<number> = [10, 8, 6, 0];

/**
 * Rhythm track (4 visible rows)
 * No set toggling - sequential slots
 */
const RHYTHM_SLOTS: ReadonlyArray<number> = [3, 2, 1, 0];

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get the visible slots for a track's current set
 * @param track - The track type
 * @param set - The current set (1-based: 1, 2, or 3 for bass)
 * @returns Array of slot indices, ordered high to low (row 0 = highest)
 */
export function getVisibleSlots(track: TrackType, set: number): ReadonlyArray<number> {
  switch (track) {
    case 'melody':
    case 'chords':
      return set === 1 ? MELODIC_SET_1 : MELODIC_SET_2;
    
    case 'bass':
      switch (set) {
        case 1: return BASS_SET_1;
        case 2: return BASS_SET_2;
        case 3: return BASS_SET_3;
        default: return BASS_SET_1;
      }
    
    case 'rhythm':
      // Rhythm doesn't use set toggling - return sequential slots
      return RHYTHM_SLOTS;
  }
}

/**
 * Convert a visual row (within track) to a pattern slot
 * @param localRow - Row index within the track (0 = top, height-1 = bottom)
 * @param track - The track type
 * @param set - The current set (1-based)
 * @returns The pattern slot index (0-11)
 */
export function rowToSlot(localRow: number, track: TrackType, set: number): number {
  // Rhythm track doesn't use set toggling
  if (track === 'rhythm') {
    return Math.max(0, Math.min(3, localRow));
  }
  
  const slots = getVisibleSlots(track, set);
  
  // CRITICAL: Bounds check to prevent crashes
  if (localRow < 0 || localRow >= slots.length) {
    console.warn(
      `[SetToggleManager] Invalid localRow ${localRow} for track ${track}, set ${set}`
    );
    // Return safe default based on track type
    return track === 'bass' ? (localRow < 2 ? 7 : 1) : (localRow < 3 ? 11 : 1);
  }
  
  return slots[localRow];
}

/**
 * Convert a pattern slot to a visual row (within track)
 * @param slot - The pattern slot index (0-11)
 * @param track - The track type
 * @param set - The current set (1-based)
 * @returns The row index within the track, or null if slot not visible in this set
 */
export function slotToRow(slot: number, track: TrackType, set: number): number | null {
  const slots = getVisibleSlots(track, set);
  const index = slots.indexOf(slot);
  return index >= 0 ? index : null;
}

/**
 * Check if a slot is visible in the current set
 * @param slot - The pattern slot index (0-11)
 * @param track - The track type
 * @param set - The current set (1-based)
 * @returns True if the slot is visible in this set
 */
export function isSlotVisible(slot: number, track: TrackType, set: number): boolean {
  return slotToRow(slot, track, set) !== null;
}

/**
 * Get the maximum number of sets for a track
 * @param track - The track type
 * @returns Number of available sets (2 for melodic, 3 for bass, 1 for rhythm)
 */
export function maxSets(track: TrackType): number {
  switch (track) {
    case 'melody':
    case 'chords':
      return 2;
    case 'bass':
      return 3;
    case 'rhythm':
      return 1;  // No set toggling for rhythm
  }
}

/**
 * Get the next set (cycling through available sets)
 * @param currentSet - The current set (1-based)
 * @param track - The track type
 * @returns The next set (wraps around)
 */
export function nextSet(currentSet: number, track: TrackType): number {
  const max = maxSets(track);
  if (max <= 1) return 1;
  return (currentSet % max) + 1;
}

/**
 * Get display string for set indicator
 * @param set - The current set (1-based)
 * @returns Dot string representation (●, ●●, or ●●●)
 */
export function displayString(set: number): string {
  switch (set) {
    case 1: return '●';
    case 2: return '●●';
    case 3: return '●●●';
    default: return '●';
  }
}
