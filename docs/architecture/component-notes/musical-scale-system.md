# Musical Scale System - Modular Components

## Overview

This document describes the reusable musical scale/key system that has been extracted from the Piano Roll and Isometric Sequencer components and made available throughout the application.

## Components Created

### 1. `useMusicalScale` Hook
**Location**: `src/hooks/useMusicalScale.ts`

A comprehensive React hook for managing musical scales and keys.

**Features**:
- 14 scale patterns (Major, Minor, Dorian, Phrygian, Lydian, Mixolydian, Locrian, Harmonic Minor, Melodic Minor, Pentatonic Major, Pentatonic Minor, Blues, Chromatic, Circle of Fifths)
- 12 root notes (C, C#, D, D#, E, F, F#, G, G#, A, A#, B)
- Scale calculation based on root + pattern
- Note-in-scale checking
- Key signature formatting

**Usage**:
```tsx
import { useMusicalScale } from '../../hooks/useMusicalScale';

const {
  selectedRoot,
  selectedScale,
  setSelectedRoot,
  setSelectedScale,
  getCurrentScale,
  isNoteInScale,
  getKeySignature,
  rootNotes,
  scaleNames
} = useMusicalScale({ initialRoot: 'C', initialScale: 'major' });

// Get current scale notes (0-11)
const scaleNotes = getCurrentScale(); // [0, 2, 4, 5, 7, 9, 11] for C Major

// Check if note is in scale
const isInKey = isNoteInScale(4); // true (E is in C major)

// Get full key signature
const keyName = getKeySignature(); // "C Major"
```

### 2. `ScaleSelector` Component
**Location**: `src/components/Music/ScaleSelector.tsx`

A reusable UI component for selecting root notes and scales.

**Features**:
- Dropdown menus for root and scale selection
- Customizable colors (rootColor, scaleColor)
- Optional icon display
- Touch-friendly (44px minimum hit targets)
- Consistent with existing design system

**Usage**:
```tsx
import { ScaleSelector } from '../Music/ScaleSelector';
import { useMusicalScale } from '../../hooks/useMusicalScale';

const { selectedRoot, selectedScale, setSelectedRoot, setSelectedScale, rootNotes, scaleNames } = useMusicalScale();

<ScaleSelector
  selectedRoot={selectedRoot}
  selectedScale={selectedScale}
  rootNotes={rootNotes}
  scaleNames={scaleNames}
  onRootChange={setSelectedRoot}
  onScaleChange={setSelectedScale}
  rootColor="blue"
  scaleColor="indigo"
  showIcon={true}
/>
```

## Integration: Guitar Fretboard

The Guitar Fretboard view has been enhanced with the following features:

### Scale-Based Note Highlighting

The fretboard now uses a **3-tier brightness system**:
- **1.0 (Full brightness)**: Triggered notes (chord notes, MIDI notes)
- **0.65 (Bright)**: In-scale notes (not triggered)
- **0.2 (Dim)**: Out-of-scale notes

This matches the behavior from Piano Roll and provides clear visual feedback for what notes are in the current key/scale.

### Chord Progression Audio Integration

**New Features**:
- **Play/Pause Button**: Start/stop automatic chord progression playback
- **Manual Chord Selection**: Click any chord to jump to it and hear it
- **Strum Effect**: Notes in each chord play with a 50ms offset for realistic guitar strumming
- **Keyboard Shortcuts**:
  - `Space`: Play/Pause chord progression
  - `C`: Toggle chromatic/harmonic color mode
  - `N`: Next chord progression

**Audio Engine**:
- Uses Tone.js with acoustic guitar samples
- Sampler with reverb for spatial depth
- Automatic chord playback every 5 seconds when playing
- Manual playback on chord selection

## File Structure

```
src/
├── hooks/
│   ├── useMusicalScale.ts       (New: Musical scale hook)
│   └── index.ts                 (Updated: Export new hook)
│
├── components/
│   ├── Music/                   (New directory)
│   │   ├── ScaleSelector.tsx    (New: Reusable scale selector UI)
│   │   └── index.ts             (New: Export ScaleSelector)
│   │
│   ├── GuitarFretboard/
│   │   ├── GuitarFretboard.tsx  (Updated: Added scale system + audio)
│   │   └── FretboardCanvas.tsx  (Updated: Added scale highlighting)
│   │
│   ├── PianoRoll/
│   │   └── PianoRoll.tsx        (Kept for backward compatibility)
│   │
│   └── IsometricSequencer/
│       └── IsometricSequencer.tsx (Kept for backward compatibility)
│
└── docs/
    └── musical-scale-system.md  (This file)
```

## Backward Compatibility

The Piano Roll and Isometric Sequencer components **retain their original implementations** and continue to work exactly as before. The new modular system is available for:
- New components
- Future refactoring
- Consistent scale/key behavior across the app

## Benefits

1. **DRY Principle**: No more duplicated scale logic across components
2. **Consistency**: All views use the same scale patterns and calculations
3. **Maintainability**: Single source of truth for musical scale data
4. **Extensibility**: Easy to add new scales or features to all components at once
5. **Reusability**: Can be used in any future music visualizer or tool

## Next Steps (Optional)

To further improve the codebase, consider:
1. Refactor Piano Roll to use `useMusicalScale` and `ScaleSelector`
2. Refactor Isometric Sequencer to use `useMusicalScale` and `ScaleSelector`
3. Add unit tests for `useMusicalScale` hook
4. Add visual tests for `ScaleSelector` component
5. Extend with additional scales (Whole Tone, Diminished, etc.)
6. Add chord detection based on selected scale

## Implementation Details

### 3-Tier Brightness System

All components using the scale system now implement:

```typescript
// Default: out-of-scale (dim but colored)
let brightness = 0.2;

// Check if note is in current scale
const isInScale = scaleNotes.includes(noteClass);

if (isTriggered) {
  brightness = 1.0; // Full brightness
} else if (isInScale) {
  brightness = 0.65; // Bright (in-key)
}
```

This provides excellent visual feedback and helps musicians learn scales and improvise within keys.
