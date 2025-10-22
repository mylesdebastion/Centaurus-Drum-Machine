# Guitar Fretboard - Chord Progression Library

## Overview

The Guitar Fretboard view (`/guitar-fretboard`) now includes a comprehensive library of **17 chord progressions** spanning multiple music genres. Users can select different progressions via a dropdown menu and play them back with authentic guitar samples.

## Features

### Chord Progression Selector
- **Dropdown Menu**: Click the progression name to see all available styles
- **Live Preview**: Click any chord in the list to hear it immediately
- **Auto-Playback**: Press the Play button or hit `Space` to auto-advance through chords every 5 seconds
- **Strum Effect**: Notes play with a realistic 50ms offset to simulate guitar strumming

### Available Progressions

#### Jazz (2 progressions)
1. **Jazz ii-V-I in C** - Classic jazz turnaround with Dm7 → G7 → Cmaj7
2. **Jazz Autumn Leaves (Am)** - Am7 → D7 → Gmaj7 → Cmaj7 (inspired by the standard)

#### Blues (2 progressions)
3. **Blues in A** - 12-bar blues: A7 → D7 → E7
4. **Blues in E (Slow)** - E7 → A7 → B7 (slow blues progression)

#### Pop (2 progressions)
5. **Pop I-V-vi-IV in G** - G → D → Em → C (classic pop progression)
6. **Pop I-V-vi-IV in C** - C → G → Am → F (Axis of Awesome progression)

#### Rock (2 progressions)
7. **Rock I-IV-V in E** - E → A → B (classic rock power progression)
8. **Rock I-bVII-IV in A** - A → G → D (modal rock sound)

#### Country
9. **Country I-IV-I-V in G** - G → C → G → D (traditional country)

#### Funk (2 progressions)
10. **Funk in Em** - Em7 → Am7 (groovy two-chord vamp)
11. **Funk Vamp in A** - A9 → D9 (extended chord funk)

#### Bossa Nova / Latin
12. **Bossa Nova in Am** - Am7 → Dm7 → G7 → Cmaj7 (Brazilian feel)

#### R&B / Soul
13. **R&B I-iii-IV-V in C** - Cmaj7 → Em7 → Fmaj7 → G7 (smooth soul)

#### Folk
14. **Folk in D** - D → G → A → Bm (singer-songwriter style)

#### Reggae
15. **Reggae in C** - C → G → Am → F (offbeat reggae feel)

#### Metal / Power Chords
16. **Metal in Em (Power Chords)** - E5 → G5 → D5 → C5 (high-gain power chords)

#### Indie / Alt Rock
17. **Indie vi-IV-I-V in C** - Am → F → C → G (modern indie rock)

#### Ballad
18. **Ballad in G** - G → Em → C → D (emotional ballad progression)

## Usage

### Navigation
1. Open Guitar Fretboard view at `/guitar-fretboard`
2. Look for the "Chord Progression" panel on the right side
3. Click the dropdown button showing the current progression name
4. Select any progression from the list

### Playback Controls
- **Play/Pause Button**: Start/stop automatic chord progression (green = play, red = pause)
- **Manual Selection**: Click any chord in the list to jump to it and hear it
- **Keyboard Shortcuts**:
  - `Space`: Toggle play/pause
  - `N`: Cycle to next progression (legacy shortcut)
  - `C`: Toggle chromatic/harmonic color mode

### Visual Feedback
- **Active Chord**: Highlighted in blue
- **Scale Integration**: Fretboard shows in-scale notes based on selected key/scale
- **Brightness System**:
  - Full brightness (1.0): Currently playing chord notes
  - Bright (0.65): In-scale notes (not playing)
  - Dim (0.2): Out-of-scale notes

## Technical Details

### File Structure
```
src/components/GuitarFretboard/
├── GuitarFretboard.tsx          (Main component with dropdown)
├── FretboardCanvas.tsx          (Visual fretboard rendering)
├── chordProgressions.ts         (17 chord progression definitions)
└── constants.ts                 (Guitar tuning and MIDI mappings)
```

### Chord Definition Format
```typescript
interface ChordProgression {
  name: string;           // Display name (e.g., "Jazz ii-V-I in C")
  chords: Chord[];        // Array of chord objects
}

interface Chord {
  name: string;           // Chord name (e.g., "Dm7")
  notes: ChordNote[];     // Fret positions
}

interface ChordNote {
  string: number;         // 1-6 (1 = high E, 6 = low E)
  fret: number;           // 0-24 (0 = open string)
}
```

### Audio Engine
- **Tone.js Sampler**: Acoustic guitar samples from tonejs-instruments library
- **Reverb Effect**: Adds spatial depth with 1.8s decay
- **Strum Effect**: 50ms delay between notes for realistic strumming
- **Sample Coverage**: 11 acoustic guitar samples across the frequency range

## Future Enhancements

Potential additions:
1. More progressions (Gospel, Flamenco, Celtic, etc.)
2. Tempo control (adjust auto-advance speed)
3. Loop count selector (play progression X times)
4. Custom progression builder (user-defined chords)
5. Export chord progression to MIDI
6. Progression difficulty ratings
7. Category filters (Jazz, Rock, etc.)
8. Search/filter functionality

## Adding New Progressions

To add a new chord progression:

1. Open `src/components/GuitarFretboard/chordProgressions.ts`
2. Add a new object to the `CHORD_PROGRESSIONS` array:

```typescript
{
  name: "Your Style in Key",
  chords: [
    {
      name: "ChordName",
      notes: [
        { string: 2, fret: 1 },  // High strings to low
        { string: 3, fret: 2 },
        { string: 4, fret: 2 },
        { string: 5, fret: 0 }   // 0 = open string
      ]
    },
    // ... more chords
  ]
}
```

3. The dropdown will automatically update with the new progression

## Educational Value

This feature is excellent for:
- **Learning Progressions**: Hear how common chord progressions sound across genres
- **Practice Tool**: Play along with authentic guitar sounds
- **Composition**: Discover progressions to inspire your own music
- **Genre Study**: Compare how different styles use harmony
- **Ear Training**: Develop ability to recognize common progressions

## Integration with Scale System

The chord progression player integrates seamlessly with the scale/key selector:
- Select a key/scale (e.g., "C Major")
- Fretboard highlights in-scale notes
- Play progressions in that key
- Visual feedback shows which notes are in the selected scale

This helps musicians understand the relationship between scales and chord progressions.
