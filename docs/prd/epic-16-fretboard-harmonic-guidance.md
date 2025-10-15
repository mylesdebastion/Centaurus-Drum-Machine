# Epic 16: Fretboard Harmonic Guidance System - Brownfield Enhancement

## Epic Goal

Bring the proven brightness-based harmonic guidance system from MelodySequencer to the Guitar Fretboard module, enabling guitar players to discover melodic pathways through interactive visual feedback and persistent ghost imprints that reveal harmonically optimal fret positions.

## Epic Description

### Existing System Context

**Current Guitar Fretboard Functionality:**
- Interactive fretboard visualization (6 strings × 25 frets)
- Click-to-play note placement with Tone.js guitar samples
- MIDI input integration (hardware MIDI + keyboard fallback)
- Chord progression playback with automatic advancing
- 3-tier brightness system (triggered: 1.0, in-scale: 0.65, out-of-scale: 0.2)
- Cross-module MIDI communication via midiEventBus
- LED matrix output via LED Compositor
- Multiple guitar tunings support (standard, drop D, DADGAD, open tunings)
- Color mode integration (chromatic/harmonic/spectrum)

**Current Technology Stack:**
- React + TypeScript + Tone.js
- Existing `IntelligentMelodyService` (singleton, battle-tested in MelodySequencer)
- `ChordProgressionService` (Roman numeral chord resolution)
- Global Music Context (key/scale/tempo synchronization)
- Module Routing System (cross-module note events)
- LED Compositor (30 FPS frame submission)

**Current Integration Points:**
- `FretboardCanvas` component renders fretboard grid with click handlers
- `handleFretClick` creates notes and manages `clickedNotes` Set
- `allActiveNotes` merges clicked notes with MIDI input and cross-module notes
- `generateLEDData` creates brightness map for LED output
- Module adapter pattern (standalone vs embedded in Studio)

### Enhancement Details

**What's Being Added:**

This epic ports the **Melody Generation System** (documented in `docs/technical/melody-generation-system.md`) from the piano roll paradigm to the guitar fretboard topology. The system consists of:

**1. Brightness Calculation System**
- Leverage existing `IntelligentMelodyService.calculateNoteBrightness()` (0.2-1.0 range)
- Adapt for guitar-specific constraints (string topology, fretting ergonomics)
- Apply brightness to fret cell borders (colored outlines)
- Same music theory hierarchy:
  - Chord tones on strong beats: 0.85-0.90
  - Chord tones on weak beats: 0.75
  - Scale tones on strong beats: 0.65
  - Scale tones on weak beats: 0.55
  - Out-of-scale notes: 0.20

**2. Three-Layer Visual Feedback**

**Layer 1: Interactive Temporal Proximity Highlighting**
- Hover over fret position → highlights harmonically related frets
- Diagonal stagger pattern adapted for **string-to-string motion**:
  - Same pitch (unison) → Same column, different strings
  - Nearby pitches (1-2 semitones) → Adjacent frets on same/adjacent strings
  - Medium pitches (3-5 semitones) → 1-2 frets ahead on adjacent strings
  - Far pitches (6+ semitones) → 2-3 frets ahead with string jumps
- Apply brightness × proximity multiplier (far pitches dimmed 25%)
- Support bidirectional patterns (ascending/descending motion)

**Layer 2: Ghost Imprints (Faint, Persistent)**
- Clicked/played frets create **faint shadows** (70% brightness)
- Persist even when not hovering (composition memory)
- Reveal melodic pathways across strings and fret positions
- Accumulate from multiple placed notes (brightest wins)

**Layer 3: Base Harmonic Brightness (Always Visible)**
- All frets have minimum brightness (0.40) showing harmonic structure
- Visual amplification for empty frets (dim notes become very faint)
- Creates dramatic visual hierarchy between good/bad choices

**3. Guitar-Specific Adaptations**

**String Topology Constraints:**
- Map pitch distance → string jump patterns
  - 0-2 semitones: Same string or adjacent string
  - 3-5 semitones: 1-2 string jumps
  - 6+ semitones: Large string jumps
- Handle overlapping pitch ranges (same note on multiple strings → brightest position wins)
- Respect open strings as "anchor points" (always available, no fret stretch)

**Fretting Ergonomics:**
- Max 4-fret span within single position (standard hand stretch)
- Position shift detection (highlight natural position boundaries)
- Favor lower fret positions for beginner-friendliness (open position emphasis)
- CAGED system integration (highlight root shapes within each position)

**Tuning Awareness:**
- Adapt brightness calculations for alternate tunings
- Recalculate fretboard matrix when tuning changes
- Maintain harmonic relationships across tuning changes

**4. Interaction Mechanics**

**Desktop:**
- **Click fret** → Place note, create ghost imprint
- **Hover fret** → Show interactive temporal proximity highlighting
- **Both systems active simultaneously** → Ghost imprints + hover highlighting

**Mobile/Touch:**
- **Tap fret** → Place note, create ghost imprint
- **Tap-and-hold** → Show hover-style highlighting at touch point
- Ghost imprints persist as primary guidance (no hover state on touch)

**5. Visual Rendering**

Update `FretboardCanvas.tsx`:
- Apply brightness to fret cell **border colors** (not background)
- Placed notes: Full brightness background + white border
- Empty cells: Transparent background + brightness-adjusted colored border
- Use RGB color × brightness formula: `rgb(r * brightness, g * brightness, b * brightness)`
- Transition smooth brightness changes (`transition-all duration-75`)

**How It Integrates:**

The enhancement leverages existing architecture with minimal coupling:

1. **IntelligentMelodyService** (already exists):
   - Import singleton instance
   - Call `calculateNoteBrightness(pitch, step, currentChord, scaleNotes, settings, lastPlacedPitch, isPlacedNote)`
   - No changes needed to service (guitar module is new consumer)

2. **FretboardCanvas Rendering**:
   - Add brightness calculation loop for all visible frets
   - Calculate temporal proximity (diagonal stagger for strings)
   - Calculate ghost imprints from `clickedNotes` Set
   - Apply visual amplification for empty cells
   - Render with updated border colors

3. **State Management**:
   - Add `lastInteractedFret: { string: number; fret: number } | null`
   - Add `hoveredFret: { string: number; fret: number } | null`
   - Add `showHarmonicGuidance: boolean` (settings toggle)
   - Existing `clickedNotes` Set (already tracks placed notes for 2 seconds)

4. **Settings Integration**:
   - Add "Harmonic Guidance" toggle in settings panel
   - Add IntelligentMelodySettings controls (chord tone density, passing tones)
   - Use GlobalMusicContext for key/scale/tempo when in Studio
   - Use local state when standalone

5. **Performance Optimization**:
   - Calculate brightness only for visible frets (6 strings × 25 frets = 150 cells)
   - Early return for placed notes (brightness = 1.0)
   - Short-circuit out-of-scale checks (brightness = 0.2)
   - Temporal filtering (only calculate brightness for frets within diagonal pattern)
   - Use `useMemo` for current chord and scale notes

**Success Criteria:**

1. **Interactive Highlighting Works**:
   - Hover/tap fret → See bright harmonically related frets across strings
   - Diagonal stagger pattern reveals string-to-string melodic pathways
   - Brightness accurately reflects chord tones, scale notes, and intervals

2. **Ghost Imprints Persist**:
   - Click/play fret → Faint shadows appear showing next likely frets
   - Multiple placed notes create accumulated web of pathways
   - Ghost brightness = 70% of full harmonic calculation

3. **Visual Hierarchy is Dramatic**:
   - Bright frets (0.8-1.0) are highly visible
   - Dim frets (0.3-0.5) are visually suppressed
   - Empty cell amplification creates strong contrast

4. **Guitar-Specific Logic Works**:
   - String topology constraints respected (string jumps map to pitch distance)
   - Fretting ergonomics guide hand position (4-fret max span)
   - Open strings highlighted as anchor points
   - Alternate tunings work correctly

5. **Educational Value is Clear**:
   - Users can trace melodic pathways by following brightest frets
   - Chord tones on strong beats are obvious (brightest)
   - Scale tones provide secondary pathways
   - System teaches voice leading and melodic motion

## Stories

### Story 16.1: Brightness Calculation Infrastructure

**Goal**: Integrate IntelligentMelodyService with GuitarFretboard and implement core brightness calculation for all fret positions.

**Tasks**:
- Import IntelligentMelodyService singleton in GuitarFretboard.tsx
- Add state for harmonic guidance settings (IntelligentMelodySettings)
- Implement brightness calculation loop for 6 strings × 25 frets
- Map fret position (string, fret) → MIDI pitch → brightness value
- Handle chord progression timing (brightness changes with current chord)
- Add settings toggle for "Show Harmonic Guidance" (default: true)

**Acceptance Criteria**:
- [ ] IntelligentMelodyService integrated without modifications
- [ ] Brightness values calculated for all visible frets
- [ ] Brightness updates when chord changes
- [ ] Settings toggle controls visibility
- [ ] Performance profiling shows <16ms per frame (60 FPS)

---

### Story 16.2: Interactive Temporal Proximity Highlighting

**Goal**: Implement hover/click-based highlighting that reveals harmonically related frets using diagonal stagger pattern adapted for string topology.

**Tasks**:
- Add `lastInteractedFret` and `hoveredFret` state
- Implement string-to-string diagonal stagger logic
- Calculate temporal proximity based on pitch distance
- Apply proximity multiplier for far pitches (0.75 for 6+ semitones)
- Support bidirectional patterns (ascending/descending)
- Add hover/touch handlers to FretboardCanvas cells

**Acceptance Criteria**:
- [ ] Hover fret → See bright related frets across strings
- [ ] Pitch distance correctly maps to string jumps
- [ ] Near pitches (1-2 semitones) highlight adjacent frets
- [ ] Far pitches (6+ semitones) highlight 2-3 frets ahead with string jumps
- [ ] Bidirectional support (ascending and descending motion)
- [ ] Touch devices use tap-and-hold for hover effect

---

### Story 16.3: Ghost Imprints System

**Goal**: Implement persistent faint shadows from placed/clicked frets that reveal melodic continuations even when not actively hovering.

**Tasks**:
- Calculate ghost brightness for all empty frets
- Check all placed notes in `clickedNotes` Set
- For each placed note, calculate diagonal stagger pattern
- Apply 70% brightness reduction for ghost effect
- Accumulate max brightness when multiple ghosts overlap
- Optimize to skip cells already in temporal proximity (avoid redundant calc)

**Acceptance Criteria**:
- [ ] Clicked frets create faint shadows on related frets
- [ ] Ghost brightness = 70% of full harmonic calculation
- [ ] Multiple placed notes accumulate (brightest wins)
- [ ] Ghosts persist for duration of note (2 seconds in current implementation)
- [ ] Ghosts visible even when not hovering
- [ ] Performance: Ghost calculation skipped for temporally close cells

---

### Story 16.4: Visual Rendering and Amplification

**Goal**: Apply brightness-adjusted colors to fret cell borders with visual amplification that creates dramatic hierarchy between good and bad musical choices.

**Tasks**:
- Update FretboardCanvas cell rendering with border color brightness
- Implement visual amplification formula for empty cells
- Apply smooth CSS transitions (`transition-all duration-75`)
- Handle placed notes (full brightness background + white border)
- Handle empty cells (transparent background + brightness-adjusted border)
- Ensure color mode integration (chromatic/harmonic/spectrum)

**Acceptance Criteria**:
- [ ] Fret borders show brightness-adjusted colors
- [ ] Bright cells (0.8-1.0) are highly visible
- [ ] Dim cells (0.3-0.5) are visually suppressed
- [ ] Visual amplification creates dramatic contrast
- [ ] Placed notes have full brightness + white border
- [ ] Smooth transitions between brightness states (75ms)
- [ ] Works with all color modes (chromatic/harmonic/spectrum)

---

### Story 16.5: Guitar-Specific Ergonomics and Tuning Support

**Goal**: Adapt brightness system for guitar-specific constraints including string topology, fretting ergonomics, CAGED system, and alternate tunings.

**Tasks**:
- Implement string jump logic (pitch distance → string distance)
- Add position shift detection (4-fret max span boundary)
- Highlight open strings as anchor points (no stretch required)
- Add CAGED root shape highlighting (optional educational feature)
- Recalculate fretboard matrix when tuning changes
- Verify brightness calculations for all tuning presets (standard, drop D, DADGAD, open tunings)

**Acceptance Criteria**:
- [ ] String jumps map correctly to pitch distance
- [ ] Position boundaries visible (4-fret max span)
- [ ] Open strings highlighted as anchors
- [ ] CAGED root shapes optionally highlighted
- [ ] Tuning changes recalculate brightness correctly
- [ ] All tuning presets work (standard, drop D, DADGAD, open G/D/C, etc.)
- [ ] Brightness respects physical ergonomics (favors lower positions)

---

### Story 16.6: Settings Panel and Educational Tooltips

**Goal**: Add user-facing controls for harmonic guidance settings with educational tooltips explaining how each setting affects visual feedback.

**Tasks**:
- Add "Harmonic Guidance" settings card in settings panel
- Add chord tone density slider (high/medium/low)
- Add passing tones toggle (stepwise motion vs leaps)
- Add brightness preview (show example frets at different brightness levels)
- Add educational tooltips for each setting
- Add keyboard shortcut to toggle harmonic guidance ('H' key)

**Acceptance Criteria**:
- [ ] Settings panel has "Harmonic Guidance" card
- [ ] Chord tone density control updates brightness calculations
- [ ] Passing tones toggle affects interval-based brightness
- [ ] Brightness preview shows visual hierarchy
- [ ] Tooltips explain musical concepts (chord tones, passing tones, etc.)
- [ ] 'H' keyboard shortcut toggles guidance on/off
- [ ] Settings persist in localStorage

---

## Compatibility Requirements

- [x] Existing fret click handlers remain unchanged (toggle note on/off)
- [x] MIDI input integration unaffected (cross-module notes still highlight)
- [x] Chord progression playback continues working
- [x] LED matrix output continues receiving brightness data
- [x] Module adapter pattern preserved (standalone vs Studio)
- [x] Color mode integration unchanged (chromatic/harmonic/spectrum)
- [x] Performance target: <16ms per frame (60 FPS sustained)

## Risk Mitigation

**Primary Risk**: Visual clutter from too many simultaneous highlighting systems (clicked notes, MIDI input, cross-module notes, ghost imprints, hover highlighting).

**Mitigation**:
- Clear visual priority hierarchy:
  1. Placed notes (full brightness background + white border)
  2. Interactive highlighting (bright colored border)
  3. Ghost imprints (faint colored border)
  4. Base brightness (very dim colored border)
- Settings toggle allows disabling harmonic guidance entirely
- Visual amplification suppresses dim frets (dramatic contrast)
- Performance monitoring ensures smooth 60 FPS rendering

**Rollback Plan**:
- Harmonic guidance is **opt-in via settings toggle**
- Default to OFF for first release (user explicitly enables)
- Existing brightness system (triggered/in-scale/out-of-scale) continues working
- Can revert to pre-enhancement state by toggling setting OFF

## Definition of Done

- [x] All 6 stories completed with acceptance criteria met
- [x] Interactive highlighting works (hover/tap reveals melodic paths)
- [x] Ghost imprints persist from placed notes
- [x] Visual hierarchy is dramatic (bright vs dim frets)
- [x] Guitar-specific logic respects string topology and ergonomics
- [x] Alternate tunings work correctly
- [x] Settings panel provides user control
- [x] Performance sustained at 60 FPS
- [x] Existing GuitarFretboard functionality verified (no regressions)
- [x] Integration points tested (MIDI input, chord progression, LED output)
- [x] Manual testing completed across multiple tunings and chord progressions
- [x] Educational value validated (users can trace melodic pathways)
