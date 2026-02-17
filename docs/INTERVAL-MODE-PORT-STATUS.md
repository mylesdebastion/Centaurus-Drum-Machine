# Interval Mode Port Status

**Goal:** Port iOS PixelBoop interval mode selection to web app (column 3 hold gesture)

**Date:** 2026-02-17  
**Status:** 🟡 IN PROGRESS (30% complete)

---

## ✅ Completed

1. **Core interval mode library** (`src/lib/intervalMode.ts`)
   - Diatonic pitch calculation
   - Scale support (major, minor, penta)
   - Chromatic color mapping
   - ✅ Tested and working

2. **React hooks**
   - `useIntervalMode.ts` - Per-track interval mode state
   - `useIntervalModeSelection.ts` - Hold gesture controller (NEW)
   - ✅ TypeScript compilation passing

3. **Removed wrong implementation**
   - ❌ Row 22 button approach removed (violated pixel-grid philosophy)
   - ✅ Ready for proper column 3 integration

---

## 🚧 In Progress

4. **Grid rendering updates needed**
   - [ ] Add column 3 interval mode indicator rendering
   - [ ] Show dim note colors (35% alpha) for current interval mode
   - [ ] Show climbing white pixel during hold gesture
   - [ ] Update note colors in real-time during preview

5. **Touch handler updates needed**
   - [ ] Detect column 3 touch events
   - [ ] Call `intervalModeSelection.beginHold()` on touch start
   - [ ] Call `intervalModeSelection.endHold()` on touch end
   - [ ] Prevent conflict with existing gestures

---

## 📋 TODO (Remaining Work)

### High Priority (Core Feature)

**File:** `src/components/PixelBoop/PixelBoopSequencer.tsx`

#### A. Grid Rendering (Column 3)

Location: Inside `renderGrid` function, track rows loop

```typescript
// Pseudo-code for what needs to be added:
trackRows.forEach(({ track, start, height }) => {
  for (let localRow = 0; localRow < height; localRow++) {
    const row = start + localRow;
    
    // COLUMN 3: Interval mode indicator
    const col = 3;
    
    // Determine which interval mode to display
    let displayMode: IntervalModeType;
    if (intervalModeSelection.activeTrack === track && 
        intervalModeSelection.highlightedMode !== null) {
      // During hold: show preview mode
      displayMode = INTERVAL_MODE_ORDER[intervalModeSelection.highlightedMode];
    } else {
      // Normal: show current mode
      if (track === 'melody') displayMode = melodyInterval.intervalMode;
      else if (track === 'chords') displayMode = chordsInterval.intervalMode;
      else if (track === 'bass') displayMode = bassInterval.intervalMode;
    }
    
    // Calculate pitch class for color
    const pitchClass = melodyInterval.getPitchClassForRow(localRow, height);
    const noteColor = NOTE_COLORS[pitchClass];
    
    // Show climbing pixel during selection
    if (intervalModeSelection.activeTrack === track && 
        intervalModeSelection.highlightedMode !== null) {
      const highlightedRow = intervalModeSelection.highlightedMode % height;
      
      if (localRow === highlightedRow) {
        // Climbing white pixel
        const brightness = intervalModeSelection.highlightBrightness;
        grid[row][col] = { 
          color: `rgb(${brightness * 255}, ${brightness * 255}, ${brightness * 255})`,
          action: `interval_mode_${track}`,
          baseColor: '#ffffff'
        };
      } else {
        // Dimmed note colors
        grid[row][col] = { 
          color: `${noteColor}40`,  // 25% alpha
          action: `interval_mode_${track}`,
          baseColor: noteColor
        };
      }
    } else {
      // Normal state: dim note colors (35% alpha)
      grid[row][col] = { 
        color: `${noteColor}59`,  // 35% alpha
        action: `interval_mode_${track}`,
        baseColor: noteColor
      };
    }
  }
});
```

#### B. Touch Handlers (Column 3)

Location: `handleMouseDown`, `handleTouchStart` functions

```typescript
// In handleMouseDown/handleTouchStart:
if (colIdx === 3) {
  const track = getTrackForRow(rowIdx);
  if (track && track !== 'rhythm') {
    // Get current interval mode for this track
    let currentMode: IntervalModeType;
    if (track === 'melody') currentMode = melodyInterval.intervalMode;
    else if (track === 'chords') currentMode = chordsInterval.intervalMode;
    else if (track === 'bass') currentMode = bassInterval.intervalMode;
    
    // Begin hold gesture
    intervalModeSelection.beginHold(track, currentMode);
    return;  // Don't trigger other gestures
  }
}

// In handleMouseUp/handleTouchEnd:
if (intervalModeSelection.activeTrack) {
  intervalModeSelection.endHold();
  return;  // Don't trigger other gestures
}
```

#### C. Helper Functions

```typescript
// Get track for a row index
const getTrackForRow = (row: number): TrackType | null => {
  if (row >= 2 && row <= 7) return 'melody';
  if (row >= 8 && row <= 13) return 'chords';
  if (row >= 14 && row <= 17) return 'bass';
  if (row >= 18 && row <= 21) return 'rhythm';
  return null;
};
```

---

## 🔬 Testing Checklist

Once implementation is complete:

- [ ] Column 3 shows dim note colors for current interval mode
- [ ] Note colors change when interval mode changes
- [ ] Hold column 3 for 0.5s activates selection mode
- [ ] White pixel appears and climbs through 6 positions
- [ ] Each climb step takes ~0.7 seconds
- [ ] Note colors update in real-time during climb (preview)
- [ ] Release after 0.5s but before first step = cancels (no change)
- [ ] Release after first step = confirms new mode
- [ ] Quick tap (< 0.5s) does nothing
- [ ] Works independently for melody, chords, and bass tracks
- [ ] Rhythm track (no pitch) doesn't show interval indicator

---

## 📚 Reference Files

**iOS Implementation:**
- `~/Documents/GitHub/pixelboop-harmonic-grid/pixelboop/ViewModels/IntervalModeSelectionController.swift`
- `~/Documents/GitHub/pixelboop-harmonic-grid/pixelboop/Views/PixelGridUIView.swift` (lines 1336-1480)

**Web App:**
- `src/lib/intervalMode.ts` - Core pitch calculation
- `src/hooks/useIntervalMode.ts` - Per-track state
- `src/hooks/useIntervalModeSelection.ts` - Hold gesture controller
- `src/components/PixelBoop/PixelBoopSequencer.tsx` - Main component

---

## 💡 Implementation Notes

### Key Insights from iOS Code:

1. **Column 3 is dual-purpose:**
   - Normal: Shows note colors for current interval mode (dim)
   - Playing: Brightens when notes trigger
   - Holding: Shows climbing pixel animation

2. **Preview is visual-only:**
   - Note colors update during hold
   - Audio doesn't change until release
   - Grid pitches recalculate in real-time

3. **Hold timing is critical:**
   - 0.5s activation delay prevents accidental triggers
   - 0.7s step interval is comfortable for deliberate selection
   - Brightness pulse provides feedback

4. **Track-specific state:**
   - Each track remembers its own interval mode
   - Selection happens per-track (not global)
   - Rhythm track excluded (percussion, not pitched)

---

## 🎯 Success Criteria

**Matches iOS behavior exactly:**
- ✅ All controls accessible through pixel grid taps/holds
- ✅ No meta-menus or external UI
- ✅ Visual feedback matches iOS timing and appearance
- ✅ Works on mobile touch screens
- ✅ Ready for Ryan to test on phone browser

---

## ⏱️ Estimated Time Remaining

- Grid rendering updates: **2-3 hours**
- Touch handler integration: **1-2 hours**
- Testing and refinement: **1-2 hours**
- **Total:** 4-7 hours remaining

---

## 🚀 Next Session Goals

1. Add column 3 rendering to grid
2. Wire up touch handlers for column 3
3. Test hold gesture behavior
4. Verify visual feedback matches iOS
5. Commit to dev branch with screenshot/video evidence
6. Deploy to jam.audiolux.app for Ryan testing
