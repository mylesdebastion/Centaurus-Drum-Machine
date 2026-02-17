# Slot-Based Pattern Storage Implementation

## Overview
Implemented 12-slot pattern storage for melody, chords, and bass tracks to enable set toggling without losing note data when switching between visible sets.

## Changes Made

### 1. SetToggleManager Integration
**File:** `src/components/PixelBoop/PixelBoopSequencer.tsx`

Added `useSetToggle` hook instantiation:
```typescript
const setToggle = useSetToggle((track, newSet) => {
  console.log(`[PixelBoop] Set toggled: ${track} → set ${newSet}`);
  showTooltip(`${track}_set_${newSet}`);
});
```

### 2. Pattern Storage (Already 12-slot)
Pattern storage was already using 12 slots:
```typescript
const emptyTrack = (): number[][] => Array(12).fill(null).map(() => Array(32).fill(0));
```

### 3. Note Placement (applyGesture)
**Status:** Partially updated
- Currently treats note index as slot index (works for chromatic mode)
- TODO: In interval mode, need to map pitch → row → slot

**Current implementation:**
```typescript
const slot = note; // In pure chromatic: note index = slot index
newTrack[slot][step] = normalizedVelocity;
```

### 4. Grid Rendering
**Updated to use slot-based reading:**

```typescript
// Convert localRow → slot based on current set
const slot = setToggle.rowToSlot(localRow, track);
let velocity = tracks[track][slot][step];
```

**Changes:**
- Reads from correct slot based on current set
- Shows notes only if they're in visible slots for current set
- Sustain calculations updated to use `activeSlot` instead of `activeNote`
- Ghost notes updated to check slots instead of note indices

### 5. Playback System
**Updated to iterate through ALL slots:**

```typescript
const numSlots = track === 'rhythm' ? 4 : 12;

for (let slot = 0; slot < numSlots; slot++) {
  const velocity = tracks[track][slot][step];
  
  if (velocity > 0) {
    // Calculate pitch from slot index
    const localRow = setToggle.slotToRow(slot, track);
    if (localRow !== null) {
      // Visible slot - use interval mode
      pitch = melodyInterval.getPitchForRow(localRow, trackHeights[track]);
    } else {
      // Hidden slot - use chromatic fallback
      pitch = baseNotes[track] + slot;
    }
  }
}
```

**Key feature:** Notes in hidden sets still play during playback!

### 6. Helper Functions
**Updated `getNoteForRow`:**
```typescript
const getLocalRow = (row: number, track: TrackType): number => {
  const trackStarts: Record<TrackType, number> = { melody: 2, chords: 8, bass: 14, rhythm: 18 };
  const start = trackStarts[track];
  return row - start;
};

const getNoteForRow = (row: number, track: TrackType): number => {
  const localRow = getLocalRow(row, track);
  return setToggle.rowToSlot(localRow, track);
};
```

### 7. Set Toggle Action Handler
**Added action handling:**
```typescript
else if (action.startsWith('set_toggle_')) {
  const track = action.split('_')[2] as SetTrackType;
  setToggle.toggleSet(track);
  const setNum = setToggle.currentSets[track];
  showTooltip(`${track}_set_${setNum}`);
}
```

## Slot Mappings

### Melodic Tracks (6 visible rows)
- **Set 1 (odd):** [11, 9, 7, 5, 3, 1] (row 0 → slot 11, row 5 → slot 1)
- **Set 2 (even):** [10, 8, 6, 4, 2, 0] (row 0 → slot 10, row 5 → slot 0)

### Bass Track (4 visible rows)
- **Set 1:** [7, 5, 3, 1] - primary bass notes
- **Set 2:** [11, 9, 4, 2] - extended range
- **Set 3:** [10, 8, 6, 0] - remaining slots

### Rhythm Track
- **No set toggling:** [3, 2, 1, 0] (sequential)

## Testing Checklist

- [x] Build passes: `npm run build`
- [ ] Pattern storage uses 12 slots for melody/chords/bass
- [ ] Notes placed in set 1 persist when switching to set 2
- [ ] Notes placed in set 2 are visible when switching back
- [ ] All notes (visible and hidden) play during playback
- [ ] Key/scale changes affect all 12 slots
- [ ] No data loss on set toggle
- [ ] Set indicator shows in column 4 (v3 mode)

## Known Issues / TODOs

1. **Gesture System Integration:**
   - Currently treats note pitch as slot index (works for chromatic)
   - Need to properly map pitch → row → slot in interval mode
   - Gestures (arpeggios, runs, etc.) generate pitch classes, not row indices

2. **Set Indicator Visual:**
   - Column 4 rendering exists but needs testing
   - Should show ● (set 1), ●● (set 2), or ●●● (set 3 for bass)

3. **Hidden Slot Playback:**
   - Currently uses chromatic fallback for hidden slots
   - Should calculate pitch based on which set the slot belongs to

4. **Backward Compatibility:**
   - Need migration logic for old 6-row format patterns
   - Currently checks adjacent slots for backward compat

5. **Network Sync:**
   - Pattern edits broadcast using slot indices
   - Need to verify remote clients handle set toggling correctly

## Next Steps

1. Test basic note placement and set toggling
2. Verify playback of hidden notes
3. Add set indicator tooltips
4. Implement proper gesture→slot mapping for interval mode
5. Add pattern migration for old data
6. Test network synchronization with set toggling

## Version Control
- **Branch:** `feature/slot-based-data`
- **Base:** Previous work on interval modes (v2)
- **Target:** v3 set toggling feature

## References
- iOS SetToggleManager: `~/Documents/GitHub/pixelboop-harmonic-grid/pixelboop/Models/SetToggleManager.swift`
- iOS SequencerViewModel: `~/Documents/GitHub/pixelboop-harmonic-grid/pixelboop/ViewModels/SequencerViewModel.swift`
- Web SetToggleManager: `src/lib/setToggleManager.ts`
- Web useSetToggle hook: `src/hooks/useSetToggle.ts`
