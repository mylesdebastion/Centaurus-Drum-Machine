# Melody Generation System: Technical Deep Dive

**Epic 15 - Intelligent Chord-Aware Melody Composition**

---

## Overview

The Melody Sequencer implements a hybrid manual/automatic melody composition system that combines music theory principles with interactive visual guidance. At its core, the system creates a "brightness map" across the piano roll grid that dynamically responds to user interaction, revealing harmonically optimal melodic pathways that can be traced manually or followed automatically.

This document explains the technical implementation, music theory foundations, and visual feedback mechanisms that power the melody generation system.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Brightness Calculation System](#brightness-calculation-system)
3. [Visual Guidance Mechanisms](#visual-guidance-mechanisms)
4. [Manual Composition Workflow](#manual-composition-workflow)
5. [Automatic Melody Generation](#automatic-melody-generation)
6. [Diagonal Stagger Pattern](#diagonal-stagger-pattern)
7. [Ghost Imprints System](#ghost-imprints-system)
8. [Music Theory Foundations](#music-theory-foundations)
9. [Performance Optimizations](#performance-optimizations)

---

## Architecture Overview

### Component Hierarchy

```
ChordMelodyArranger (Parent Module)
├── ChordProgressionService (Chord management)
├── ChordTimeline (Chord visualization & playback)
└── MelodySequencer (Note composition)
    ├── IntelligentMelodyService (Brightness calculation)
    ├── Sound Engine (Audio playback)
    └── Visual Guidance System (Interactive highlighting)
```

### Data Flow

```
User Interaction (click/hover)
    ↓
Update lastInteractedPitch/Step
    ↓
Calculate brightness for all visible cells
    ↓
Apply brightness to cell borders (RGB color × brightness)
    ↓
Render updated grid with harmonic guidance
```

---

## Brightness Calculation System

### Core Algorithm (`IntelligentMelodyService.calculateNoteBrightness()`)

The brightness calculation is the **primary visual indicator** that drives both manual and automatic melody generation. Every cell in the piano roll receives a brightness value from **0.2 to 1.0** based on multiple music theory factors.

#### Brightness Hierarchy

| Brightness | Category | Description |
|-----------|----------|-------------|
| **1.0** | Placed Note | User has already placed this note |
| **0.90** | Most Recommended | Chord tone + strong beat + high density |
| **0.85** | Very Recommended | Chord tone + strong beat + medium density |
| **0.75** | Recommended | Chord tone on weak beat OR scale note on strong beat |
| **0.65** | Acceptable | Scale note + medium density |
| **0.55** | Passing Tone | Scale note on weak beat |
| **0.45** | Subtle | Weak scale note + low density |
| **0.20** | Out-of-Scale | Chromatic note (advanced usage) |

#### Calculation Factors

```typescript
calculateNoteBrightness(
  pitch: number,              // MIDI note (e.g., 60 = Middle C)
  step: number,               // Position in sequence (0-15 per page)
  currentChord: Chord | null, // Active chord from progression
  scaleNotes: number[],       // All notes in current scale
  settings: IntelligentMelodySettings, // User preferences
  lastPlacedPitch: number | null,      // Last note placed (for interval logic)
  isPlacedNote: boolean       // Is this cell already occupied?
): number
```

**Step 1: Check if note is already placed**
```typescript
if (isPlacedNote) return 1.0; // Full brightness for placed notes
```

**Step 2: Check if note is in scale**
```typescript
const noteClass = pitch % 12; // 0-11 (C, C#, D, ..., B)
const isInScale = scaleNotes.some(scaleNote => (scaleNote % 12) === noteClass);
if (!isInScale) return 0.2; // Dim chromatic notes
```

**Step 3: Determine if note is a chord tone**
```typescript
const chordTones = currentChord ? getChordTonesFromChord(currentChord) : [];
const isChordTone = chordTones.some(ct => (ct % 12) === noteClass);
```

**Step 4: Check if step is on a strong beat**
```typescript
// Strong beats: steps 0, 4, 8, 12 (downbeats in 4/4 time)
const isStrongBeat = step % 4 === 0;
```

**Step 5: Calculate base brightness**
```typescript
let baseBrightness = 0.45; // Default: subtle scale note

if (isChordTone && isStrongBeat) {
  baseBrightness = 0.85; // Chord tone on downbeat - very recommended
} else if (isChordTone) {
  baseBrightness = 0.75; // Chord tone on weak beat - recommended
} else if (isStrongBeat) {
  baseBrightness = 0.65; // Scale note on downbeat - acceptable
} else {
  baseBrightness = 0.55; // Scale note on weak beat - passing tone
}
```

**Step 6: Apply chord tone density adjustments**
```typescript
// High density: Widens gap between chord tones and scale notes
// Low density: Narrows gap (more freedom with non-chord tones)
if (settings.chordToneDensity === 'high') {
  if (isChordTone && isStrongBeat) return 0.90; // Brighten chord tones
  if (isChordTone) return 0.75;
  return 0.55; // Dim scale notes
}

if (settings.chordToneDensity === 'low') {
  if (isChordTone && isStrongBeat) return 0.75; // Dim chord tones slightly
  if (isChordTone) return 0.70;
  return 0.70; // Brighten scale notes (closer to chord tones)
}
```

**Step 7: Apply passing tone adjustments (if enabled)**

When `settings.passingTones` is enabled, stepwise motion is favored over leaps:

```typescript
const interval = Math.abs(pitch - lastPlacedPitch) % 12;

// Consonant intervals (boost brightness):
// - Unison/Octave (0): +15%
// - Perfect 5th (7): +15%
// - Perfect 4th (5): +12%
// - Major/Minor 3rd (3-4): +10%
// - Major 6th (9): +8%

// Dissonant intervals (reduce brightness):
// - Minor 2nd (1): -20%
// - Major 2nd (2): -15%
// - Tritone (6): -10%
```

**Step 8: Clamp to valid range**
```typescript
return Math.max(0.2, Math.min(1.0, baseBrightness));
```

---

## Visual Guidance Mechanisms

### Three Layers of Visual Feedback

The piano roll grid uses **three distinct visual systems** that work together to guide composition:

#### 1. **Temporal Proximity Highlighting** (Bright, Interactive)

When you hover over or place a note, the system highlights harmonically related notes at **staggered time offsets** based on pitch distance.

**Implementation** (`MelodySequencer.tsx` lines 900-930):

```typescript
// Check for hover-based highlighting (bright)
if (lastInteractedPitch !== null) {
  const pitchDistance = Math.abs(pitch - lastInteractedPitch);

  // Map pitch distance to time offset (diagonal stagger)
  let timeOffset = 0;
  let proximityMultiplier = 1.0;

  if (pitchDistance >= 6) {
    timeOffset = 2;           // Far pitches (6+ semitones) = 2 steps ahead
    proximityMultiplier = 0.75; // Dim by 25%
  } else if (pitchDistance >= 3) {
    timeOffset = 1;           // Medium pitches (3-5 semitones) = 1 step ahead
    proximityMultiplier = 0.85; // Dim by 15%
  }
  // Close pitches (0-2 semitones) = same step (timeOffset = 0)

  // Support BOTH forward and backward diagonal patterns
  const forwardStepOffset = pitch > lastInteractedPitch ? timeOffset : -timeOffset;
  const backwardStepOffset = pitch < lastInteractedPitch ? timeOffset : -timeOffset;

  const forwardExpectedStep = lastInteractedStep + forwardStepOffset;
  const backwardExpectedStep = lastInteractedStep + backwardStepOffset;

  // Check if this cell is within ±1 step of either expected position
  const isForwardClose = Math.abs(pageRelativeStep - forwardExpectedStep) <= 1;
  const isBackwardClose = Math.abs(pageRelativeStep - backwardExpectedStep) <= 1;

  const isTemporallyClose = isForwardClose || isBackwardClose;
}
```

This creates a **diagonal highlighting pattern** where:
- **Same pitch** = highlighted at the same step (repetitive notes)
- **Nearby pitches (1-2 semitones)** = highlighted at ±1 step (stepwise motion)
- **Medium pitches (3-5 semitones)** = highlighted at ±2 steps (melodic leaps)
- **Far pitches (6+ semitones)** = highlighted at ±3 steps (large intervals)

The diagonal pattern reveals **melodic pathways** where ascending/descending motion naturally progresses forward in time.

#### 2. **Ghost Imprints** (Faint, Persistent)

Already placed notes create **faint shadows** that show where their melodic paths lead, even when not actively hovering.

**Implementation** (`MelodySequencer.tsx` lines 933-983):

```typescript
// Check for "ghost" imprints from already placed notes (faint)
if (showHarmonicGuidance && !hasNote && !isTemporallyClose) {
  // Check if this empty cell is suggested by any placed note on current page
  const pageNotes = notes.filter(n => {
    const notePageRelativeStep = n.step - currentPage * STEPS_PER_PAGE;
    return notePageRelativeStep >= 0 && notePageRelativeStep < STEPS_PER_PAGE;
  });

  let maxGhostBrightness = 0;
  for (const placedNote of pageNotes) {
    const notePageRelativeStep = placedNote.step - currentPage * STEPS_PER_PAGE;
    const pitchDistance = Math.abs(pitch - placedNote.pitch);

    // Calculate expected time offset (same logic as interactive highlighting)
    let timeOffset = 0;
    if (pitchDistance >= 6) timeOffset = 2;
    else if (pitchDistance >= 3) timeOffset = 1;

    // Support BOTH forward and backward diagonal patterns
    const forwardStepOffset = pitch > placedNote.pitch ? timeOffset : -timeOffset;
    const backwardStepOffset = pitch < placedNote.pitch ? timeOffset : -timeOffset;

    const forwardExpectedStep = notePageRelativeStep + forwardStepOffset;
    const backwardExpectedStep = notePageRelativeStep + backwardStepOffset;

    const isForwardMatch = Math.abs(pageRelativeStep - forwardExpectedStep) <= 1;
    const isBackwardMatch = Math.abs(pageRelativeStep - backwardExpectedStep) <= 1;

    if (isForwardMatch || isBackwardMatch) {
      // Calculate harmonic brightness
      const ghostHarmonicBrightness = melodyService.calculateNoteBrightness(
        pitch, absoluteStep, currentChord, scaleNotes, settings,
        placedNote.pitch, false
      );

      // Reduce brightness by 30% for ghost effect (multiply by 0.7)
      const faintGhostBrightness = ghostHarmonicBrightness * 0.7;
      maxGhostBrightness = Math.max(maxGhostBrightness, faintGhostBrightness);
    }
  }
  ghostBrightness = maxGhostBrightness;
}
```

Ghost imprints:
- **Persist** even when not hovering (show the "memory" of placed notes)
- Are **70% brightness** of full harmonic calculation (faint but visible)
- **Accumulate** from multiple placed notes (brightest suggestion wins)
- Reveal the **melodic web** created by existing composition

#### 3. **Base Harmonic Brightness** (Subtle, Always Visible)

All cells have a **minimum brightness** (0.40) that shows the underlying harmonic structure without any interaction.

```typescript
let brightness = showHarmonicGuidance && isTemporallyClose
  ? melodyService.calculateNoteBrightness(...) * proximityMultiplier
  : hasNote ? 1.0
  : ghostBrightness > 0 ? ghostBrightness
  : 0.40; // Base dim brightness for non-highlighted notes
```

### Visual Amplification for Empty Cells

Empty cells (borders only) use **amplified dimness** to create stronger visual hierarchy:

```typescript
// For empty cells, amplify dimness - make less musical notes much fainter
if (!hasNote && showHarmonicGuidance) {
  // Map brightness 0.3-1.0 → 0.1-1.0 (make dim notes even dimmer)
  brightness = 0.1 + (brightness - 0.3) * (0.9 / 0.7);
  brightness = Math.max(0.1, Math.min(1.0, brightness)); // Clamp to range
}
```

This makes:
- **Bright cells** (0.8-1.0) stay bright → **Highly visible melodic paths**
- **Dim cells** (0.3-0.5) become very dim → **Visually suppressed less musical options**
- The gap between good and bad choices becomes **visually dramatic**

---

## Diagonal Stagger Pattern

### Why Diagonal Highlighting?

Traditional music notation shows melody moving **horizontally** (time) and **vertically** (pitch) simultaneously. The diagonal stagger pattern captures this natural melodic motion by highlighting notes at **time offsets proportional to pitch distance**.

### Mathematical Model

```
time_offset = f(pitch_distance)

Where:
- pitch_distance ∈ [0, ∞) semitones
- time_offset ∈ [0, 2] steps

Mapping:
- [0, 2] semitones → 0 steps (same time, stepwise motion)
- [3, 5] semitones → 1 step ahead (small melodic leap)
- [6, ∞) semitones → 2 steps ahead (large interval leap)
```

### Bidirectional Support

The system supports **both ascending and descending** melodic motion:

```typescript
// Forward diagonal (ascending melody)
const forwardStepOffset = pitch > lastInteractedPitch ? timeOffset : -timeOffset;

// Backward diagonal (descending melody)
const backwardStepOffset = pitch < lastInteractedPitch ? timeOffset : -timeOffset;
```

This allows:
- **Ascending arpeggios** (C → E → G moving right-and-up)
- **Descending scales** (G → F → E moving right-and-down)
- **Chromatic runs** (C → C# → D moving horizontally)
- **Octave leaps** (C4 → C5 moving right with 2-step offset)

### Visual Example

```
Grid layout (low pitches at top, high at bottom):
Step:  0   1   2   3   4   5   6   7
G5    [ ] [x] [ ] [ ] [ ] [ ] [ ] [ ]  ← Highlighted at step 1 (far pitch, +2 offset)
E5    [ ] [ ] [x] [ ] [ ] [ ] [ ] [ ]  ← Highlighted at step 2 (medium pitch, +1 offset)
D5    [ ] [ ] [ ] [x] [ ] [ ] [ ] [ ]  ← Highlighted at step 3 (near pitch, same offset)
C5    [●] [ ] [ ] [ ] [ ] [ ] [ ] [ ]  ← User clicked here (step 0)
```

The diagonal reveals a **melodic trajectory** ascending through the scale.

---

## Manual Composition Workflow

### User Journey

1. **Initial Exploration**
   - User hovers over cells to see harmonic brightness
   - Bright cells indicate chord tones, scale notes, and consonant intervals
   - Ghost imprints from existing notes reveal melodic continuations

2. **First Note Placement**
   - Click any cell to place a note (triggers audio playback)
   - Cell becomes fully bright (brightness = 1.0)
   - System creates ghost imprint radiating from this note

3. **Path Discovery**
   - Hover over cells near the placed note
   - Diagonal stagger pattern reveals **forward temporal paths**
   - Brightest cells show most harmonically optimal next notes
   - Ghost imprints persist, showing the "shadow" of potential melodies

4. **Melodic Path Following**
   - Click bright cells to extend the melody
   - Each new note creates additional ghost imprints
   - Multiple placed notes create a **web of melodic paths**
   - User follows the brightest paths for consonant melodies
   - User deviates to dimmer paths for tension and variety

5. **Real-Time Feedback**
   - Placed notes play immediately via sound engine
   - Playback cursor shows loop position during transport playback
   - Notes auto-route to connected visualizers (DJ Visualizer, etc.)

### Interaction Mechanics

```typescript
// On cell click
handleCellMouseDown(pageRelativeStep, pitch) {
  setLastInteractedPitch(pitch); // Update brightness reference point

  if (existingNote) {
    // Remove note (toggle off)
    setNotes(prevNotes => prevNotes.filter(n => n.step !== step));
  } else {
    // Add note
    const newNote = { step, pitch, velocity: 100, duration: stepDuration };
    setNotes(prevNotes => [...prevNotes, newNote]);
    scheduleNote(newNote);        // Play audio
    onNoteEvent?.(newNote);       // Route to visualizers
  }
}

// On cell hover
handleCellMouseEnter(pageRelativeStep, pitch) {
  setLastInteractedPitch(pitch);      // Update brightness calculation
  setLastInteractedStep(pageRelativeStep); // Update temporal offset
  setHoveredCell({ step: pageRelativeStep, pitch }); // Show white border
}
```

---

## Automatic Melody Generation

### "Moth to the Light" Algorithm

The automatic generator is a **brightness-seeking algorithm** that follows the same harmonic guidance visible to the user. It's called "moth to the light" because it's drawn to the brightest cells (highest brightness values).

### Generation Modes

#### 1. **Paused Mode** (Transport Stopped)
```typescript
if (!isPlaying) {
  // Generate once from start to end, then stop
  // Does NOT overwrite existing notes
  // Persists when user presses play
}
```

**Behavior:**
- Starts from weighted random note (root/5th/4th preferred)
- Generates step-by-step until reaching end of page
- Stops generation, leaving notes in place
- User can press play to hear the result without regeneration

#### 2. **Playing Mode** (Transport Active)
```typescript
if (isPlaying) {
  // Continuously overwrite notes
  // Loop back to beginning when reaching end
  // Pick new starting note each loop
}
```

**Behavior:**
- Clears page and picks new weighted starting note
- Generates continuously, overwriting previous notes
- Loops indefinitely, creating evolving melodies
- Visual sparkle animation shows note-to-note movement

### Weighted Starting Note Selection

Instead of requiring a manually placed starting note, the algorithm picks one using **scale degree weights**:

```typescript
// Scale degree weights (0-indexed, where 0 = root)
const degreeWeights = [
  5,   // Root (1st) - Highest priority (tonic, most stable)
  1,   // 2nd - Low priority (dissonant as starting note)
  2,   // 3rd - Medium-low (mediates tonic and dominant)
  1.5, // 4th - Medium (subdominant, less stable start)
  3,   // 5th - High (dominant, strong harmonic start)
  4,   // 6th - Very high (submediant, smooth melodic start)
  1.5, // 7th (flat) - Medium (can be unstable)
  2.5  // 7th (natural) - Medium-high (leading tone energy)
];

// Pick random note based on cumulative weights
const totalWeight = weightedNotes.reduce((sum, n) => sum + n.weight, 0);
let random = Math.random() * totalWeight;

for (const note of weightedNotes) {
  random -= note.weight;
  if (random <= 0) {
    selectedPitch = note.pitch;
    break;
  }
}
```

**Why these weights?**
- **Root (5)**: Most stable, defines the key, perfect starting point
- **6th (4)**: Smooth melodic launch pad, not too tense
- **5th (3)**: Strong dominant support, classic starting interval
- **7th (2.5)**: Leading tone energy, can create anticipation
- **3rd (2)**: Mediates between tonic and dominant
- **4th (1.5)**: Subdominant, less stable but usable
- **2nd (1)**: Dissonant starting point, avoided

### Step-by-Step Generation Process

```typescript
const generateNextNote = () => {
  // 1. Calculate next step
  let nextStep = lastNotePageRelativeStep + 1;

  // 2. Check for end-of-page behavior
  if (nextStep >= STEPS_PER_PAGE) {
    if (!isPlaying) {
      // Paused: Stop generation
      setIsAutoGenerating(false);
      return;
    } else {
      // Playing: Loop back, clear page, pick new start
      nextStep = 0;
      setNotes(prevNotes => prevNotes.filter(n => notOnCurrentPage(n)));
      lastNote = pickStartingNote();
      setNotes(prevNotes => [...prevNotes, lastNote]);
      return;
    }
  }

  // 3. Calculate brightness for all visible notes at this step
  const suggestions = visibleNotes.map(pitch => {
    // Only consider notes within diagonal pattern
    const pitchDistance = Math.abs(pitch - lastNote.pitch);
    let timeOffset = 0;
    if (pitchDistance >= 6) timeOffset = 2;
    else if (pitchDistance >= 3) timeOffset = 1;

    const forwardStepOffset = pitch > lastNote.pitch ? timeOffset : -timeOffset;
    const backwardStepOffset = pitch < lastNote.pitch ? timeOffset : -timeOffset;
    const forwardExpectedStep = lastNotePageRelativeStep + forwardStepOffset;
    const backwardExpectedStep = lastNotePageRelativeStep + backwardStepOffset;

    const isTemporallyClose =
      Math.abs(nextStep - forwardExpectedStep) <= 1 ||
      Math.abs(nextStep - backwardExpectedStep) <= 1;

    if (!isTemporallyClose) return { pitch, brightness: 0 };

    // Calculate harmonic brightness
    const brightness = melodyService.calculateNoteBrightness(
      pitch, nextAbsoluteStep, currentChord, scaleNotes,
      settings, lastNote.pitch, false
    );

    // Apply distance-based dimming
    let proximityMultiplier = pitchDistance >= 6 ? 0.75 : pitchDistance >= 3 ? 0.85 : 1.0;

    // Penalize same pitch (repetitive notes)
    const isSamePitch = pitch === lastNote.pitch;
    const finalBrightness = isSamePitch ? brightness * 0.5 : brightness * proximityMultiplier;

    return { pitch, brightness: finalBrightness };
  });

  // 4. Filter to only bright suggestions (>= 0.4 threshold)
  const brightSuggestions = suggestions.filter(s => s.brightness >= 0.4);

  if (brightSuggestions.length === 0) {
    // No good path forward - stop generation
    setIsAutoGenerating(false);
    return;
  }

  // 5. Pick weighted random note from bright suggestions
  const totalBrightness = brightSuggestions.reduce((sum, s) => sum + s.brightness, 0);
  let random = Math.random() * totalBrightness;

  for (const suggestion of brightSuggestions) {
    random -= suggestion.brightness;
    if (random <= 0) {
      selectedPitch = suggestion.pitch;
      break;
    }
  }

  // 6. Create and add the new note
  const newNote = {
    step: nextAbsoluteStep,
    pitch: selectedPitch,
    velocity: 90 + Math.floor(Math.random() * 20), // 90-110
    duration: stepDuration,
  };

  setNotes(prevNotes => [...prevNotes, newNote]);
  scheduleNote(newNote);
  onNoteEvent?.(newNote);

  // 7. Create sparkle animation (visual feedback)
  createSparkleTrail(lastNote, newNote);

  // 8. Update for next iteration
  lastNote = newNote;
};
```

### Sparkle Animation System

The automatic generator creates a **visual trail** showing the path from the last note to the next:

```typescript
// Calculate animation duration (sync to musical tempo)
const secondsPerBeat = 60 / tempo;
const intervalMs = stepDuration * secondsPerBeat * 1000;

// Create trail of sparkle particles
const stepDistance = Math.abs(newStep - lastStep);
const pitchDistance = Math.abs(newPitch - lastPitch);
const totalDistance = stepDistance + pitchDistance;
const numParticles = Math.max(3, Math.min(8, Math.ceil(totalDistance / 2)));

const sparkles = Array.from({ length: numParticles }, (_, i) => ({
  id: now + i,
  fromStep: lastStep,
  fromPitch: lastPitch,
  toStep: newStep,
  toPitch: newPitch,
  progress: 0,
  startTime: now + (i * intervalMs * 0.15), // Stagger by 15%
  duration: intervalMs, // Tempo-synced
}));
```

Particles:
- **Stagger start times** by 15% to create flowing trail effect
- **Fade in then out** based on lifecycle progress
- **Trail fade** based on time since spawn (older particles dimmer)
- **Color** matches target note color (chromatic/harmonic/spectrum)
- **Orbit animation** creates dust-like sparkle effect

---

## Ghost Imprints System

### What Are Ghost Imprints?

Ghost imprints are **faint brightness echoes** left by placed notes that persist even when not hovering. They reveal the "shadow" of potential melodic continuations.

### Why Ghost Imprints?

1. **Persistent Guidance**: User can see multiple melodic paths at once without hovering
2. **Composition Memory**: Grid "remembers" where placed notes suggest going next
3. **Path Discovery**: User discovers new melodic routes by seeing faint suggestions
4. **Musical Intuition**: Mimics how composers mentally hear "where the melody wants to go"

### Implementation Details

```typescript
// For each empty cell, check all placed notes on current page
for (const placedNote of pageNotes) {
  const noteStep = placedNote.step - currentPage * STEPS_PER_PAGE;
  const pitchDistance = Math.abs(pitch - placedNote.pitch);

  // Calculate diagonal stagger offset (same as interactive highlighting)
  let timeOffset = 0;
  if (pitchDistance >= 6) timeOffset = 2;
  else if (pitchDistance >= 3) timeOffset = 1;

  // Check if this cell is on the melodic path
  const forwardStepOffset = pitch > placedNote.pitch ? timeOffset : -timeOffset;
  const backwardStepOffset = pitch < placedNote.pitch ? timeOffset : -timeOffset;
  const forwardExpectedStep = noteStep + forwardStepOffset;
  const backwardExpectedStep = noteStep + backwardStepOffset;

  const isForwardMatch = Math.abs(currentCellStep - forwardExpectedStep) <= 1;
  const isBackwardMatch = Math.abs(currentCellStep - backwardExpectedStep) <= 1;

  if (isForwardMatch || isBackwardMatch) {
    // Calculate full harmonic brightness
    const harmonicBrightness = melodyService.calculateNoteBrightness(
      pitch, absoluteStep, currentChord, scaleNotes, settings,
      placedNote.pitch, false
    );

    // Reduce brightness by 30% for ghost effect
    const ghostBrightness = harmonicBrightness * 0.7;
    maxGhostBrightness = Math.max(maxGhostBrightness, ghostBrightness);
  }
}
```

**Key Design Decisions:**
- **70% brightness**: Faint enough to not overpower, bright enough to guide
- **Max accumulation**: If multiple notes suggest same cell, brightest wins
- **Full harmonic calculation**: Ghost uses same music theory as interactive
- **Diagonal pattern**: Ghost follows same temporal offset rules

### Visual Layers Priority

```
Priority (highest to lowest):
1. Placed notes (brightness = 1.0, colored background)
2. Interactive highlighting (brightness = 0.2-1.0, colored border, bright)
3. Ghost imprints (brightness = 0.14-0.7, colored border, faint)
4. Base brightness (brightness = 0.4, colored border, very dim)
```

---

## Music Theory Foundations

### Chord Tone vs Scale Tone Hierarchy

**Chord Tones** (notes in the current chord):
- **Strong beats** (steps 0, 4, 8, 12): brightness 0.85-0.90
- **Weak beats**: brightness 0.75
- Provide **harmonic stability** and consonance
- Most recommended for downbeats and phrase endings

**Scale Tones** (notes in the scale but not in chord):
- **Strong beats**: brightness 0.65
- **Weak beats**: brightness 0.55
- Provide **melodic interest** and color
- Good for passing motion and phrase development

**Chromatic Notes** (outside scale):
- brightness 0.20 (very dim)
- Used for **tension** and **chromaticism**
- Advanced technique (jazz, blues inflections)

### Interval Consonance/Dissonance

Based on harmonic series and psychoacoustic principles:

| Interval | Semitones | Category | Brightness Adjustment |
|----------|-----------|----------|----------------------|
| Unison/Octave | 0/12 | Perfect Consonance | +15% |
| Perfect 5th | 7 | Strong Consonance | +15% |
| Perfect 4th | 5 | Consonance | +12% |
| Major 3rd | 4 | Sweet Consonance | +10% |
| Minor 3rd | 3 | Sweet Consonance | +10% |
| Major 6th | 9 | Pleasant | +8% |
| Minor 6th | 8 | Acceptable | +5% |
| Major 2nd | 2 | Dissonance | -15% |
| Minor 2nd | 1 | Strong Dissonance | -20% |
| Tritone | 6 | Tension | -10% |

### Strong Beat Emphasis

In 4/4 time signature:
- **Steps 0, 4, 8, 12** are downbeats (1, 2, 3, 4)
- Chord tones sound best on these beats (harmonic resolution)
- Scale tones can be used but are less stable
- Weak beats (steps 1-3, 5-7, etc.) are good for passing motion

---

## Performance Optimizations

### Brightness Calculation Caching

Brightness is calculated **per-frame** for every visible cell, which could be expensive. Optimizations:

1. **Singleton Service**: `IntelligentMelodyService` is instantiated once
2. **Early Returns**: Placed notes return 1.0 immediately
3. **Short-Circuit Logic**: Out-of-scale check happens before expensive calculations
4. **Temporal Filtering**: Only cells within diagonal pattern get full calculation
5. **Memoized Values**: `useMemo` for current step info and scale notes

### Rendering Optimizations

```typescript
// Only render cells that have changed brightness
const colorStyle = hasNote
  ? { backgroundColor: brightColor, borderColor: isActive ? 'white' : brightColor }
  : { backgroundColor: 'transparent', borderColor: brightColor };

// Use CSS transitions for smooth brightness changes
className="transition-all duration-75"
```

### Ghost Imprint Optimization

Ghost calculation only runs when:
- `showHarmonicGuidance` is enabled
- Cell is empty (`!hasNote`)
- Cell is not already in temporal proximity (`!isTemporallyClose`)

This avoids redundant calculations for cells that are already bright.

---

## Conclusion

The Melody Sequencer's hybrid manual/automatic system creates a **symbiotic relationship** between user intuition and algorithmic guidance. The brightness map reveals harmonic pathways, the diagonal stagger pattern shows temporal trajectories, and ghost imprints persist as composition memory.

Whether composing manually by following the brightest paths or letting the "moth to the light" algorithm trace them automatically, the system always respects **music theory principles** while providing **visual clarity** that makes composition accessible and educational.

The result is a composition tool that teaches as it guides, revealing the hidden structure of melody while empowering users to create harmonically rich, musically satisfying sequences.
