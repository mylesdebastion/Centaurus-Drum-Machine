# Set Toggling Spec - 6→12 Note Access

**Feature:** Quick switching between note sets to access all 12 chromatic notes within 6-note UI constraint

**Date:** 2026-02-17  
**Priority:** High (Tuesday demo target)  
**Related:** Column 3 interval mode selection (see INTERVAL-MODE-PORT-STATUS.md)

---

## 🎯 Problem Statement

**Constraint:** Grid shows 6 rows per melodic track (melody, chords) and 4 rows for bass

**Need:** Access to all 12 chromatic notes for full harmonic expression

**Solution:** Tap column 4 to toggle between note sets - like flipping through pages of a piano roll

---

## 🎹 Visual Layout

### Melodic Tracks (6 visible rows)

```
Row Layout (Melody/Chords tracks):
┌──────────────────────────────────────────────────────┐
│ Col 0-1 │ Col 2 │ Col 3        │ Col 4    │ Col 5+   │
│ Track   │ Solo  │ Interval Mode│ Set      │ Pattern  │
│ Mute    │       │ (hold)       │ Toggle   │ Grid     │
├─────────┼───────┼──────────────┼──────────┼──────────┤
│ Row 0   │ [S]   │ [note color] │ [●]      │ [grid]   │
│ Row 1   │ [S]   │ [note color] │ [●]      │ [grid]   │
│ Row 2   │ [S]   │ [note color] │ [●]      │ [grid]   │
│ Row 3   │ [S]   │ [note color] │ [●]      │ [grid]   │
│ Row 4   │ [S]   │ [note color] │ [●]      │ [grid]   │
│ Row 5   │ [S]   │ [note color] │ [●]      │ [grid]   │
└─────────┴───────┴──────────────┴──────────┴──────────┘
                   Hold = cycle     Tap = toggle
                   interval mode    note set
```

### Bass Track (4 visible rows)

```
Bass Track Layout:
┌──────────────────────────────────────────────────────┐
│ Col 0-1 │ Col 2 │ Col 3        │ Col 4    │ Col 5+   │
│ Track   │ Solo  │ Interval Mode│ Set      │ Pattern  │
│ Mute    │       │ (hold)       │ Toggle   │ Grid     │
├─────────┼───────┼──────────────┼──────────┼──────────┤
│ Row 0   │ [S]   │ [note color] │ [●●●]    │ [grid]   │
│ Row 1   │ [S]   │ [note color] │ [●●●]    │ [grid]   │
│ Row 2   │ [S]   │ [note color] │ [●●●]    │ [grid]   │
│ Row 3   │ [S]   │ [note color] │ [●●●]    │ [grid]   │
└─────────┴───────┴──────────────┴──────────┴──────────┘
                   Hold = cycle     Tap = cycle
                   interval mode    note set (3 states)
```

---

## 📐 Set Definitions

### Melodic Tracks (6 notes visible)

**Set 1 (default):**
- Row 0 (top): Slot 11 (highest pitch in current interval mode)
- Row 1: Slot 9
- Row 2: Slot 7
- Row 3: Slot 5
- Row 4: Slot 3
- Row 5 (bottom): Slot 1 (lowest pitch in current interval mode)

**Set 2:**
- Row 0 (top): Slot 10
- Row 1: Slot 8
- Row 2: Slot 6
- Row 3: Slot 4
- Row 4: Slot 2
- Row 5 (bottom): Slot 0 (root note)

**Visual indicator (column 4):**
- Set 1: Single dot `●` (dim track color)
- Set 2: Double dot `●●` (dim track color)

### Bass Track (4 notes visible)

**Set 1 (default):**
- Row 0: Slot 7
- Row 1: Slot 5
- Row 2: Slot 3
- Row 3: Slot 1

**Set 2:**
- Row 0: Slot 11
- Row 1: Slot 9
- Row 2: Slot 4
- Row 3: Slot 2

**Set 3:**
- Row 0: Slot 10
- Row 1: Slot 8
- Row 2: Slot 6
- Row 3: Slot 0

**Visual indicator (column 4):**
- Set 1: Single dot `●`
- Set 2: Double dot `●●`
- Set 3: Triple dot `●●●`

---

## 🔄 Interaction Design

### Tap Column 4 (Any Row in Track)

**Melodic tracks:**
1. Toggles between Set 1 ↔ Set 2
2. Visual indicator updates immediately
3. Grid shows new note set slots
4. **CRITICAL:** Existing notes remain in their slots
5. Column 3 updates colors for new visible pitches

**Bass track:**
1. Cycles through Set 1 → Set 2 → Set 3 → Set 1
2. Visual indicator updates (●/●●/●●●)
3. Grid shows new note set slots
4. **CRITICAL:** Existing notes remain in their slots
5. Column 3 updates colors for new visible pitches

### Example: Note Persistence

**Scenario:** User places notes in Set 1, then switches to Set 2

```
Melody Track - Set 1 (slots 1-3-5-7-9-11):
Row 0 (slot 11): ●──●────  (note at step 0 and 3)
Row 1 (slot 9):  ────────
Row 2 (slot 7):  ──●─────  (note at step 2)
Row 3 (slot 5):  ────────
Row 4 (slot 3):  ────────
Row 5 (slot 1):  ●───────  (note at step 0)

[User taps column 4 to switch to Set 2]

Melody Track - Set 2 (slots 0-2-4-6-8-10):
Row 0 (slot 10): ────────  (no notes - slot 10 wasn't visible in Set 1)
Row 1 (slot 8):  ────────
Row 2 (slot 6):  ────────
Row 3 (slot 4):  ────────
Row 4 (slot 2):  ────────
Row 5 (slot 0):  ────────

[User switches back to Set 1]

Melody Track - Set 1 (slots 1-3-5-7-9-11):
Row 0 (slot 11): ●──●────  (notes PRESERVED - still there!)
Row 1 (slot 9):  ────────
Row 2 (slot 7):  ──●─────  (notes PRESERVED)
Row 3 (slot 5):  ────────
Row 4 (slot 3):  ────────
Row 5 (slot 1):  ●───────  (notes PRESERVED)
```

**Key principle:** Sets are **views** into the same underlying 12-slot pattern, not separate patterns.

---

## 🎨 Visual Design

### Column 4 Indicator

**Normal state (Set 1 - melodic tracks):**
```
┌───┐
│ ● │  Single dot, dim track color (35% alpha)
└───┘
```

**Set 2 (melodic tracks):**
```
┌───┐
│●●│  Two dots horizontally, dim track color (35% alpha)
└───┘
```

**Set 1 (bass track):**
```
┌───┐
│ ● │  Single dot, dim bass color
└───┘
```

**Set 2 (bass track):**
```
┌───┐
│●●│  Two dots
└───┘
```

**Set 3 (bass track):**
```
┌───┐
│●●●│  Three dots
└───┘
```

**Active state (tap feedback):**
- Brief brightness pulse (100% → 35% over 0.2s)
- Same as iOS tap feedback

---

## 🔗 Relationship to Interval Modes

### Column 3 (Interval Mode) + Column 4 (Set Toggle) Work Together

**Example workflow:**

1. **Start:** Melody track in **3rds mode**, **Set 1**
   - Visible slots: 1, 3, 5, 7, 9, 11
   - In C major 3rds: pitches C, E, G, B, D, F (spanning octaves)
   - Column 3 shows dim colors for these pitches

2. **User holds column 3 → changes to 4ths mode**
   - Visible slots: STILL 1, 3, 5, 7, 9, 11 (slots don't change)
   - Pitches change to: C, F, B♭, E♭, A♭, D♭ (4ths intervals)
   - Column 3 colors update to show new pitches
   - Existing notes sound different pitches now (intended behavior)

3. **User taps column 4 → switches to Set 2**
   - Visible slots change to: 0, 2, 4, 6, 8, 10
   - In 4ths mode: pitches C (root), E♭, A♭, D♭, G♭, B (different slots)
   - Column 3 colors update to show Set 2 pitches
   - Notes placed in Set 1 slots (1,3,5,7,9,11) are hidden but preserved

**Key insight:** 
- **Column 3** changes the *pitch mapping* (which notes the slots represent)
- **Column 4** changes the *visible slots* (which slots you can edit)
- Both are independent controls that work together

---

## 💾 Data Model

### Track State

```typescript
interface Track {
  // Existing pattern data (12 slots × 32 steps)
  pattern: number[][];  // [slot][step] = velocity
  
  // NEW: Current visible set
  currentSet: 1 | 2 | 3;  // 1-2 for melodic, 1-2-3 for bass
  
  // Existing interval mode
  intervalMode: IntervalMode;
  
  // Existing mute/solo
  muted: boolean;
  soloed: boolean;
}
```

### Slot-to-Row Mapping Functions

```typescript
// Get visible slots for current set
function getVisibleSlots(track: TrackType, set: number): number[] {
  if (track === 'melody' || track === 'chords') {
    // 6-row tracks
    return set === 1 
      ? [11, 9, 7, 5, 3, 1]   // Set 1: odd slots (high to low)
      : [10, 8, 6, 4, 2, 0];  // Set 2: even slots (high to low)
  } else if (track === 'bass') {
    // 4-row track
    if (set === 1) return [7, 5, 3, 1];
    if (set === 2) return [11, 9, 4, 2];
    if (set === 3) return [10, 8, 6, 0];
  }
  return [];
}

// Convert row index to slot (depends on current set)
function rowToSlot(row: number, track: TrackType, set: number): number {
  const visibleSlots = getVisibleSlots(track, set);
  return visibleSlots[row];
}

// Convert slot to row index (returns null if slot not visible in current set)
function slotToRow(slot: number, track: TrackType, set: number): number | null {
  const visibleSlots = getVisibleSlots(track, set);
  const row = visibleSlots.indexOf(slot);
  return row >= 0 ? row : null;
}
```

---

## 🎮 User Experience

### Scenario 1: Building a Chord with All 12 Notes

**Goal:** Place C, E, G, B♭, D in melody track (requires both sets)

1. **Set 1 active:** Place C (slot 1), G (slot 7), D (slot 3)
2. Tap column 4 → **Set 2 active**
3. Place E (slot 4), B♭ (slot 10)
4. Tap column 4 → back to **Set 1**
5. All 5 notes visible across both sets ✓

### Scenario 2: Exploring Interval Modes Across Sets

**Goal:** Hear how 5ths mode sounds with full 12-note range

1. Hold column 3 → select **5ths mode**
2. **Set 1:** Play with slots 1-3-5-7-9-11
3. Tap column 4 → **Set 2:** Play with slots 0-2-4-6-8-10
4. Switch back and forth to compare ranges

### Scenario 3: Bass Line Across 3 Sets

**Goal:** Create walking bass line using all 12 notes

1. **Set 1 (slots 7-5-3-1):** Place low C-E pattern
2. Tap column 4 → **Set 2 (slots 11-9-4-2):** Add G-B movement
3. Tap column 4 → **Set 3 (slots 10-8-6-0):** Add F-A passing notes
4. Cycle through sets to see full pattern

---

## 🧪 Testing Checklist

### Visual Feedback
- [ ] Column 4 shows correct indicator (●/●●/●●●)
- [ ] Indicator updates immediately on tap
- [ ] Tap produces brief brightness pulse
- [ ] Column 3 colors update for new visible pitches

### Note Persistence
- [ ] Place note in Set 1, switch to Set 2, switch back → note still there
- [ ] Place notes in both sets, switch back and forth → both preserved
- [ ] Notes in non-visible slots don't show in grid but still play
- [ ] Clearing a track clears ALL slots (not just visible set)

### Interaction
- [ ] Tap any row in column 4 toggles set (not just specific row)
- [ ] Melodic tracks: 2-state toggle (Set 1 ↔ Set 2)
- [ ] Bass track: 3-state cycle (Set 1 → Set 2 → Set 3 → Set 1)
- [ ] Column 4 tap doesn't trigger note placement
- [ ] Works while playing (can switch sets during playback)

### Interval Mode Integration
- [ ] Changing interval mode doesn't change current set
- [ ] Changing set doesn't change interval mode
- [ ] Column 3 colors reflect current interval mode + current set
- [ ] Both controls independent and work together

### Edge Cases
- [ ] Switching sets while holding note (gesture in progress)
- [ ] Switching sets during undo/redo
- [ ] Switching sets during lasso selection (future)
- [ ] Switching sets during remote sync (future)

---

## 📊 Grid Rendering Updates

### Column 4 Rendering (Set Indicator)

```typescript
// Pseudo-code for column 4 rendering in each track
trackRows.forEach(({ track, start, height }) => {
  const currentSet = viewModel.getTrackSet(track);
  const trackColor = TRACK_COLORS[track];
  
  for (let localRow = 0; localRow < height; localRow++) {
    const row = start + localRow;
    
    // COLUMN 4: Set indicator (all rows show same indicator)
    let indicatorPixels: string;
    if (track === 'melody' || track === 'chords') {
      // 2-state toggle
      indicatorPixels = currentSet === 1 ? '●' : '●●';
    } else if (track === 'bass') {
      // 3-state cycle
      indicatorPixels = currentSet === 1 ? '●' : (currentSet === 2 ? '●●' : '●●●');
    }
    
    // Render indicator (dim track color, 35% alpha)
    grid[row][4] = {
      color: `${trackColor}59`,  // 35% alpha
      action: `set_toggle_${track}`,
      baseColor: trackColor
    };
  }
});
```

### Note Grid Rendering (Slot-Based)

```typescript
// Update grid rendering to use slot-based system
for (let localRow = 0; localRow < height; localRow++) {
  const row = start + localRow;
  
  // Get slot for this row (depends on current set)
  const slot = viewModel.rowToSlot(localRow, track);
  
  for (let step = 0; step < patternLength; step++) {
    const col = columnForStep(step);
    
    // Check pattern data for this SLOT (not row)
    const velocity = pattern[slot][step];
    
    // Calculate pitch for color (based on slot + interval mode)
    const pitch = intervalMode.getPitchForSlot(slot, track);
    const color = NOTE_COLORS[pitch % 12];
    
    // Render note if velocity > 0
    if (velocity > 0) {
      grid[row][col] = {
        color: velocity === 2 ? color : color + 'BA',  // Accent vs normal
        action: null,
        baseColor: color
      };
    }
  }
}
```

---

## 🚀 Implementation Plan

### Phase 1: Data Model (2-3 hours)
1. Add `currentSet` property to track state
2. Implement `getVisibleSlots()` helper
3. Implement `rowToSlot()` and `slotToRow()` converters
4. Update pattern access to use slot-based indexing

### Phase 2: Visual Rendering (2-3 hours)
1. Add column 4 set indicator rendering
2. Update note grid to use slot-based rendering
3. Update column 3 colors to reflect current set pitches
4. Add tap feedback animation

### Phase 3: Interaction (2-3 hours)
1. Add column 4 tap detection
2. Implement set toggle logic (2-state for melodic, 3-state for bass)
3. Wire up to track state
4. Test note persistence across set switches

### Phase 4: Integration Testing (1-2 hours)
1. Test with interval mode changes
2. Test during playback
3. Test with gestures (tap, hold, drag)
4. Verify iOS behavior match

**Total estimated time:** 7-11 hours

---

## 🎯 Success Criteria

- ✅ All 12 chromatic notes accessible within 6/4-note UI constraint
- ✅ Tap column 4 to toggle/cycle sets (fast, intuitive)
- ✅ Notes persist across set switches (not lost)
- ✅ Works seamlessly with column 3 interval mode selection
- ✅ Visual indicator clear and matches iOS pattern
- ✅ No performance issues during set switching
- ✅ Ready for Ryan to test chord progressions on phone

---

## 📚 References

**iOS Implementation:**
- `pixelboop-harmonic-grid/pixelboop/ViewModels/SequencerViewModel.swift`
- Slot-based pattern storage (12 slots × 32 steps)
- Set toggling in track view controller

**Related Specs:**
- `INTERVAL-MODE-PORT-STATUS.md` - Column 3 interval mode selection
- `SECTIONS-AS-CHORDS-SPEC.md` - Automated chord progressions
- `PIXELBOOP-WEB-PARITY-PLAN.md` - Overall feature parity plan

**Web App Files:**
- `src/components/PixelBoop/PixelBoopSequencer.tsx`
- `src/hooks/useIntervalMode.ts`
- `src/lib/intervalMode.ts`
