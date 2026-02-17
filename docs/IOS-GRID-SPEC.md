# iOS PixelBoop Grid Specification

**Source:** `pixelboop-harmonic-grid/shared/logic/GridConstants.swift`  
**Purpose:** Exact grid layout for web port parity

---

## Grid Dimensions

- **Total:** 44 columns × 24 rows
- **Pixel Size:** Variable (fills screen)

---

## Column Layout

| Columns | Purpose |
|---------|---------|
| 0 | Mute button (per track) |
| 1 | Solo button (per track) |
| 2 | TX indicator (MIDI transmit activity) |
| 3 | Interval mode indicator (note colors, v2+) |
| 4-35 | Pattern steps (32 steps) |
| 36-43 | Song sections (8 sections) |

---

## Row Layout

| Row(s) | Purpose |
|--------|---------|
| 0 | Top control bar (BPM, scale selector, root note, etc.) |
| 1 | Step markers (beat indicators) |
| 2-7 | **Melody track** (6 rows) |
| 8-13 | **Chords track** (6 rows) |
| 14-17 | **Bass track** (4 rows) |
| 18-21 | **Rhythm track** (4 rows) |
| 22 | Key automation indicators / Overview row 1 |
| 23 | Bottom control bar (play, clear, WLED, Link, etc.) |

---

## Track Details

### Melody (rows 2-7)
- 6 rows = 6 visible notes (maps to 12 chromatic via set toggling)
- Column 3: Interval mode indicator (dim note colors)
- Column 4: Set toggle indicator (v3+)

### Chords (rows 8-13)
- 6 rows = 6 visible notes
- Same column 3/4 behavior as melody

### Bass (rows 14-17)
- 4 rows = 4 visible notes (maps to 12 via 3-set toggle)
- Same column 3/4 behavior

### Rhythm (rows 18-21)
- 4 rows = 4 drum sounds (from active bank)
- 4 drum banks available
- No interval mode or set toggling

---

## Control Bar - Row 0 (Top)

| Cols | Function |
|------|----------|
| 0-3 | USB/BT MIDI indicators |
| 4-6 | Clear button |
| 7 | Scale: Major |
| 8 | Scale: Minor |
| 9 | Scale: Pentatonic |
| 11-22 | Root note selector (C through B) |
| 26 | BPM down |
| 27 | BPM display (tap for tempo) |
| 28 | BPM up |
| 30 | Pattern length down |
| 31 | Pattern length display |
| 32 | Pattern length up |
| 36-37 | USB MIDI indicator |
| 38-43 | (unused or device-specific) |

---

## Control Bar - Row 23 (Bottom)

| Cols | Function |
|------|----------|
| 0-3 | WLED button (gradient, 4 cols) |
| 4 | Gap |
| 5-7 | Link button (Ableton Link, 3 cols) |
| 8 | Gap |
| 9-10 | Mode button (2 cols) |
| 11+ | Play/stop and other controls |
| 36-37 | Section play button |
| 38-43 | Clear all sections button |

---

## Song Sections (cols 36-43)

- 8 section columns
- Rows 2-21: Section thumbnails (mini pattern preview)
- Row 22: Section indicators
- Tap to switch active section
- Hold 1s to copy, tap another to paste additively

---

## Row 22 - Key Automation

- Shows key markers for automated root note changes
- Each step can have a key marker (colored by root note)
- Tap to paint key changes
- Hold Mode button to toggle visualization mode

---

## Interval Mode Indicator (Column 3)

When v2+:
- Shows dim note color for that row's pitch class
- 50% alpha when not selecting
- 35% alpha for non-highlighted rows during selection
- White pixel for currently highlighted mode during hold

---

## Set Toggle Indicator (Column 4)

When v3+:
- Shows dots at bottom of track
- Melody/Chords: 1-2 dots (2 sets)
- Bass: 1-3 dots (3 sets)
- Tap to cycle sets

---

## Gestures

### Tap
- Single note placement

### Hold (400ms+)
- Accent note
- Column 3: Interval mode selection
- Column 0: Preset selection

### Horizontal Swipe
- Melody: Run (repeated notes)
- Chords: Arpeggio generator
- Bass: Walking bass
- Rhythm: Roll/fill

### Vertical Swipe
- Melody/Chords: Chord stack
- Bass: Ba-dum (root + interval)
- Rhythm: Multi-drum hit

### Diagonal Swipe
- Phrase/fill patterns

### Hold + Horizontal
- Sustain (hold note across steps)

---

## Colors

### Note Colors (Chromatic Wheel)
```
C  = #ff0000 (Red)
C# = #ff4500 (Orange-Red)
D  = #ff8c00 (Dark Orange)
D# = #ffc800 (Yellow-Orange)
E  = #ffff00 (Yellow)
F  = #9acd32 (Yellow-Green)
F# = #00ff00 (Green)
G  = #00ffaa (Cyan-Green)
G# = #00ffff (Cyan)
A  = #00aaff (Sky Blue)
A# = #0055ff (Blue)
B  = #8a2be2 (Purple)
```

### Track Colors
```
Melody = #f7dc6f (Gold)
Chords = #4ecdc4 (Teal)
Bass   = #45b7d1 (Blue)
Rhythm = #ff6b6b (Red)
```

---

## Key Differences from Current Web

1. **Sections missing** - Web has no cols 36-43 section area
2. **Control bar layout** - Web has different button positions
3. **Row 22 key automation** - Missing from web
4. **Gesture system** - Walking bass, arpeggio generator not fully ported
5. **Preset selection** - Missing from web
6. **Drum banks** - Web only has one bank

---

## Implementation Priority

1. ✅ Basic grid structure (44×24)
2. ❌ Section columns (36-43)
3. ❌ Control bar parity (rows 0, 23)
4. ❌ Row 22 key automation
5. ✅ Track positions (rows 2-21)
6. ✅ Column 3 interval indicators
7. ❌ Column 4 set indicators
8. ❌ Full gesture system
9. ❌ Preset selection
10. ❌ Drum banks
