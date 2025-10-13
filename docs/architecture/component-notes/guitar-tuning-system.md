# Guitar Tuning System

## Overview

The Guitar Fretboard now features a comprehensive tuning system with **18 predefined tunings** across multiple categories. The system uses **scientific pitch notation** (e.g., "E2", "A2", "D3") for human-readable, unambiguous note representation.

## Features

### ✅ Implemented

1. **18 Pre-defined Tunings** across 5 categories
2. **Scientific Pitch Notation** - Human-readable (E2 A2 D3 G3 B3 E4)
3. **Dropdown Selector** in Settings panel
4. **Real-time Switching** - Change tunings on the fly
5. **Automatic MIDI Conversion** - Notes automatically converted to correct MIDI numbers
6. **Visual Verification** - See note names with octaves in the dropdown

### Tuning Categories

#### 1. Standard (1 tuning)
- **Standard (E)**: E2 A2 D3 G3 B3 E4

#### 2. Drop Tunings (4 tunings)
- **Drop D**: D2 A2 D3 G3 B3 E4
- **Drop C#**: C#2 G#2 C#3 F#3 A#3 D#4
- **Drop C**: C2 G2 C3 F3 A3 D4
- **Drop B**: B1 F#2 B2 E3 G#3 C#4

#### 3. Open Tunings (5 tunings)
- **Open G**: D2 G2 D3 G3 B3 D4 (Keith Richards, blues)
- **Open D**: D2 A2 D3 F#3 A3 D4 (Blues, slide guitar)
- **Open E**: E2 B2 E3 G#3 B3 E4 (Slide guitar, blues)
- **Open A**: E2 A2 E3 A3 C#4 E4 (Bright slide sound)
- **Open C**: C2 G2 C3 G3 C4 E4 (Rich low end)

#### 4. Modal Tunings (2 tunings)
- **DADGAD**: D2 A2 D3 G3 A3 D4 (Celtic folk, suspended sound)
- **DADF#AD**: D2 A2 D3 F#3 A3 D4 (Open D sus4, ambient)

#### 5. Alternate Tunings (6 tunings)
- **Half Step Down**: Eb2 Ab2 Db3 Gb3 Bb3 Eb4 (Jimi Hendrix)
- **Whole Step Down (D Standard)**: D2 G2 C3 F3 A3 D4 (Heavier sound)
- **All Fourths (E-A-D-G-C-F)**: E2 A2 D3 G3 C4 F4 (Symmetrical fingerings)
- **Nashville Tuning**: E3 A3 D4 G3 B3 E4 (High strung, octave up on bass)
- **Baritone (B Standard)**: B1 E2 A2 D3 F#3 B3 (Perfect fourth below standard)
- **7-String (B-E-A-D-G-B-E)**: B1 E2 A2 D3 G3 B3 (Showing lowest 6 strings)

## Usage

### Accessing Tunings

1. Go to `/guitar-fretboard`
2. Click the **Settings** button (gear icon)
3. Look for **"Guitar Tuning"** section
4. Click the dropdown to see all available tunings
5. Select any tuning - fretboard updates immediately!

### Tuning Display

Each tuning shows:
- **Name**: "Drop D", "Open G", etc.
- **Notes**: "D2 A2 D3 G3 B3 E4" (from low string to high string)
- **Description**: Usage context and genre
- **Category**: Standard, Drop, Open, Modal, or Alternate

## Technical Implementation

### Scientific Pitch Notation

Uses standard musical notation:
- **Note name + Octave number**: "E2", "A2", "D3"
- **C4 = Middle C**: MIDI note 60
- **Unambiguous**: E2 (low E) vs E4 (high E) is clear

### MIDI Conversion

Automatic conversion formula:
```typescript
MIDI Note = (octave + 1) × 12 + noteClass
```

Examples:
- E2 = (2 + 1) × 12 + 4 = 40
- A2 = (2 + 1) × 12 + 9 = 45
- D3 = (3 + 1) × 12 + 2 = 50

### File Structure

```typescript
// tunings.ts
export interface GuitarTuning {
  name: string;
  strings: [string, string, string, string, string, string];
  description: string;
  category: 'standard' | 'drop' | 'open' | 'modal' | 'alternate';
}

export const GUITAR_TUNINGS: GuitarTuning[] = [
  {
    name: "Standard (E)",
    strings: ["E2", "A2", "D3", "G3", "B3", "E4"],
    description: "Standard guitar tuning - E A D G B E",
    category: 'standard'
  },
  // ... 17 more tunings
];
```

### Functions

```typescript
// Convert note name to MIDI number
noteToMIDI("E2") // Returns: 40

// Get MIDI array for a tuning
getTuningMIDINotes(tuning) // Returns: [40, 45, 50, 55, 59, 64]

// Get tuning by name
getTuningByName("Drop D") // Returns: GuitarTuning object

// Filter by category
getTuningsByCategory("open") // Returns: [Open G, Open D, Open E, ...]
```

## Benefits

### 1. **Human-Readable**
```
✅ "E2 A2 D3 G3 B3 E4" - Clear and verifiable
❌ "[40, 45, 50, 55, 59, 64]" - Hard to verify
```

### 2. **Unambiguous**
- E2 clearly means low E (string 6)
- E4 clearly means high E (string 1)
- No confusion about octaves

### 3. **Easy to Add New Tunings**
Just add a new object to the array:
```typescript
{
  name: "My Custom Tuning",
  strings: ["D2", "A2", "D3", "G3", "C4", "D4"],
  description: "Description here",
  category: 'alternate'
}
```

### 4. **Matches Music Software Standards**
- TuxGuitar uses this format
- Standard in music notation software
- Compatible with MIDI specification

## Verification

You can visually verify each tuning in the dropdown:

**Standard Tuning:**
```
String 6 (low):  E2  (40 MIDI) ✓
String 5:        A2  (45 MIDI) ✓
String 4:        D3  (50 MIDI) ✓
String 3:        G3  (55 MIDI) ✓
String 2:        B3  (59 MIDI) ✓
String 1 (high): E4  (64 MIDI) ✓
```

**Drop D:**
```
String 6 (low):  D2  (38 MIDI) ✓  (one whole step down)
String 5:        A2  (45 MIDI) ✓  (same)
String 4:        D3  (50 MIDI) ✓  (same)
String 3:        G3  (55 MIDI) ✓  (same)
String 2:        B3  (59 MIDI) ✓  (same)
String 1 (high): E4  (64 MIDI) ✓  (same)
```

## Integration

The tuning system integrates with:
- ✅ **Fretboard Canvas**: Visual display updates
- ✅ **Audio Playback**: Notes play at correct pitch
- ✅ **Chord Progressions**: Chords adapt to tuning
- ✅ **MIDI Input**: Incoming MIDI notes map correctly
- ✅ **WLED Output**: LED colors match correct notes

## Future Enhancements

Potential additions:
1. **Custom Tuning Editor**: Let users create their own tunings
2. **Tuning Presets Per Song**: Save tuning with chord progressions
3. **Tuning History**: Remember recent tunings
4. **Tuning Categories Filter**: Filter dropdown by category
5. **Instrument Types**: Bass (4-string), Mandolin (4-string), Ukulele (4-string)
6. **Tuning Search**: Search by note or name

## Files

- `src/components/GuitarFretboard/tunings.ts` - Tuning definitions and utilities
- `src/components/GuitarFretboard/constants.ts` - Updated to use tuning system
- `src/components/GuitarFretboard/GuitarFretboard.tsx` - UI dropdown implementation
- `docs/guitar-tuning-system.md` - This documentation

## References

- **Wikipedia**: [List of Guitar Tunings](https://en.wikipedia.org/wiki/List_of_guitar_tunings)
- **TuxGuitar**: Open-source guitar tab editor using similar format
- **Scientific Pitch Notation**: [Wikipedia](https://en.wikipedia.org/wiki/Scientific_pitch_notation)
- **MIDI Note Numbers**: [MIDI Association](https://www.midi.org/specifications)
