# Roman Numeral Chord Progression System

## Overview

The Guitar Fretboard now features a **dynamic chord progression system** that uses Roman numeral notation. Unlike the previous hard-coded approach, chord progressions now **automatically adapt to any selected key**, making it easy to transpose songs and explore different tonalities.

## Key Features

### ✅ Implemented

1. **Dynamic Key Transposition** - Change the root note (C, D, E, F, G, A, B) and all chords update automatically
2. **Roman Numeral Notation** - Uses standard music theory notation (I, ii, iii, IV, V, vi, vii°)
3. **19 Pre-defined Progressions** - Covering Pop, Jazz, Blues, Rock, Country, R&B, Funk, Bossa Nova, Folk, Reggae, Metal, Indie, and Ballad genres
4. **Comprehensive Chord Library** - 80+ chord voicings across all 12 keys
5. **Visual Display** - Shows both Roman numerals and resolved chord names
6. **Borrowed Chords** - Supports chromatic harmony (bVII, bVI, etc.)
7. **Multiple Chord Qualities** - Major, minor, 7th, maj7, m7, dim, power chords (5), 9th, and m7b5

## How It Works

### Roman Numeral System

Roman numerals represent **scale degrees** relative to a key:

**Major Key:**
- **I** = Root (major)
- **ii** = 2nd degree (minor)
- **iii** = 3rd degree (minor)
- **IV** = 4th degree (major)
- **V** = 5th degree (major)
- **vi** = 6th degree (minor)
- **vii°** = 7th degree (diminished)

**Minor Key:**
- **i** = Root (minor)
- **ii°** = 2nd degree (diminished)
- **III** = 3rd degree (major)
- **iv** = 4th degree (minor)
- **v** = 5th degree (minor)
- **VI** = 6th degree (major)
- **VII** = 7th degree (major)

### Chord Quality Notation

- **Uppercase** (I, IV, V) = Major chords
- **Lowercase** (ii, iii, vi) = Minor chords
- **7** = Dominant 7th (V7)
- **maj7** = Major 7th (Imaj7)
- **m7** = Minor 7th (ii7)
- **°** = Diminished (vii°)
- **5** = Power chord (I5)
- **9** = 9th chord (V9)
- **b** = Flat/borrowed chord (bVII)

## Examples

### Pop I-V-vi-IV Progression

**In C Major:**
- I → C
- V → G
- vi → Am
- IV → F

**In G Major:**
- I → G
- V → D
- vi → Em
- IV → C

**In D Major:**
- I → D
- V → A
- vi → Bm
- IV → G

### Jazz ii-V-I Progression

**In C Major:**
- ii7 → Dm7
- V7 → G7
- Imaj7 → Cmaj7

**In F Major:**
- ii7 → Gm7
- V7 → C7
- Imaj7 → Fmaj7

### Blues I-IV-V Progression

**In A Major:**
- I7 → A7
- IV7 → D7
- V7 → E7

**In E Major:**
- I7 → E7
- IV7 → A7
- V7 → B7

## Available Progressions

### Pop (2 progressions)
1. **Pop I-V-vi-IV** - Classic pop progression (Journey, Blink-182)
2. **Pop vi-IV-I-V** - Sad pop progression (Avicii - Wake Me Up)

### Jazz (2 progressions)
1. **Jazz ii-V-I** - Most common jazz progression
2. **Jazz Autumn Leaves** - Classic jazz standard progression

### Blues (2 progressions)
1. **12-Bar Blues** - Classic 12-bar blues structure
2. **Blues I-IV-V** - Essential blues progression

### Rock (3 progressions)
1. **Rock I-IV-V** - Basic rock progression (Wild Thing, Louie Louie)
2. **Rock I-bVII-IV** - Mixolydian rock sound (Sweet Child O' Mine)
3. **Rock i-VI-III-VII** - Minor rock progression (Andalusian cadence)

### Country (1 progression)
1. **Country I-IV-I-V** - Classic country progression

### R&B (1 progression)
1. **R&B I-iii-IV-V** - Smooth R&B progression

### Funk (1 progression)
1. **Funk i-iv** - Modal funk vamp (Dorian sound)

### Bossa Nova (1 progression)
1. **Bossa Nova ii-V-I** - Brazilian bossa nova feel

### Folk (1 progression)
1. **Folk I-V-vi-IV** - Folk ballad progression

### Reggae (1 progression)
1. **Reggae I-V-vi-IV** - Classic reggae progression

### Metal (2 progressions)
1. **Metal i-VI-III-VII** - Power chord progression
2. **Metal i-bVI-bVII** - Classic metal progression

### Indie (1 progression)
1. **Indie I-IV-vi-V** - Modern indie progression

### Ballad (1 progression)
1. **Ballad I-vi-IV-V** - Classic 50s/60s ballad (doo-wop progression)

## Usage

### Changing Keys

1. Go to `/guitar-fretboard`
2. Use the **Key/Root selector** in the header
3. Select any root note (C, D, E, F, G, A, B)
4. **All chord progressions automatically update** to the new key!

### Selecting Progressions

1. Click the **chord progression dropdown**
2. Browse by genre
3. See Roman numerals, genre, and description
4. Click to select - chords resolve immediately

### Playing Progressions

1. Click **Play button** to start auto-progression
2. Chords change every 5 seconds
3. Click **Pause** to stop
4. Click individual chord buttons to manually select

## Technical Implementation

### File Structure

```
src/components/GuitarFretboard/
├── chordLibrary.ts             # 80+ chord voicings
├── romanNumeralConverter.ts    # Conversion logic
├── chordProgressions.ts        # 19 progression definitions
├── GuitarFretboard.tsx         # Updated UI
└── constants.ts                # Fretboard utilities
```

### Key Functions

#### `parseRomanNumeral(numeral: string): RomanNumeralChord`
Parses Roman numeral notation into scale degree and chord quality.

```typescript
parseRomanNumeral("V7")
// Returns: { numeral: "V7", scaleDegree: 5, quality: "7" }
```

#### `getNoteFromScaleDegree(keyRoot: string, scaleDegree: number, scaleType: 'major' | 'minor'): string`
Converts scale degree to actual note name based on key.

```typescript
getNoteFromScaleDegree("C", 5, "major")
// Returns: "G"

getNoteFromScaleDegree("D", 5, "major")
// Returns: "A"
```

#### `romanNumeralToChord(romanNumeral: string, keyRoot: string, scaleType: 'major' | 'minor'): Chord`
Converts Roman numeral to actual guitar chord with voicing.

```typescript
romanNumeralToChord("V7", "C", "major")
// Returns: { name: "G7", notes: [guitar voicing] }
```

#### `resolveProgression(progression: RomanNumeralProgression, keyRoot: string): ChordProgression`
Resolves entire progression to actual chords.

```typescript
const progression = {
  name: "Pop I-V-vi-IV",
  romanNumerals: ["I", "V", "vi", "IV"],
  scaleType: "major"
};

resolveProgression(progression, "G")
// Returns: { name: "Pop I-V-vi-IV in G", chords: [G, D, Em, C] }
```

### Chord Library

The chord library contains pre-defined guitar voicings optimized for:
- **Sound quality** - Standard fingerings used by guitarists
- **Playability** - Ergonomic hand positions
- **Consistency** - Similar voicings across keys

#### Supported Chord Types

- **Major** (C, D, E, F, G, A, B, etc.)
- **Minor** (Cm, Dm, Em, etc.)
- **Dominant 7th** (C7, G7, A7, etc.)
- **Major 7th** (Cmaj7, Gmaj7, etc.)
- **Minor 7th** (Cm7, Dm7, Em7, etc.)
- **Diminished** (Bdim, F#dim, etc.)
- **Power Chords** (C5, G5, A5, etc.)
- **9th** (C9, D9, A9, etc.)
- **Half-diminished** (Bm7b5, etc.)

## Benefits

### 1. **Musical Flexibility**
Change keys instantly without redefining chord voicings.

### 2. **Educational Value**
Learn music theory - see how Roman numerals map to actual chords.

### 3. **Transposition Made Easy**
Find the best key for your voice or instrument.

### 4. **Standardized Notation**
Uses universal Roman numeral system recognized by all musicians.

### 5. **Extensibility**
Easy to add new progressions - just define Roman numerals!

## Adding New Progressions

To add a new progression:

```typescript
// In chordProgressions.ts
export const ROMAN_NUMERAL_PROGRESSIONS: RomanNumeralProgression[] = [
  // ... existing progressions
  {
    name: "Your Custom Progression",
    romanNumerals: ["I", "IV", "vi", "V"],
    description: "Your description here",
    genre: "Your Genre",
    scaleType: 'major' // or 'minor'
  }
];
```

That's it! The progression will automatically:
- Appear in the dropdown
- Transpose to any key
- Use correct chord voicings
- Display Roman numerals and chord names

## Future Enhancements

Potential additions:
1. **Custom Progression Builder** - Let users create their own progressions
2. **Progression Sharing** - Share progressions via URL or export
3. **More Chord Types** - Sus chords, add9, 6th chords, etc.
4. **Alternate Voicings** - Multiple fingerings per chord
5. **Capo Support** - Transpose with capo position
6. **Tempo Control** - Adjustable chord change speed
7. **Swing/Feel Options** - Shuffle, straight, bossa feel
8. **Chord Substitutions** - Suggest alternative chords

## References

- **Roman Numeral Analysis**: [Wikipedia](https://en.wikipedia.org/wiki/Roman_numeral_analysis)
- **Chord Progressions**: [Music Theory for Songwriters](https://www.hooktheory.com/)
- **Guitar Chord Voicings**: Standard guitarist fingerings
- **Jazz Theory**: The Jazz Theory Book (Mark Levine)

## Integration

The Roman numeral system integrates with:
- ✅ **Scale Selector** - Key changes update all progressions
- ✅ **Audio Playback** - All chords play with correct voicings
- ✅ **Fretboard Visualization** - Chord notes light up on fretboard
- ✅ **WLED Output** - LED colors match chord notes
- ✅ **MIDI Input** - Play along with resolved chords

## Summary

The Roman numeral chord progression system transforms the Guitar Fretboard into a powerful **songwriting and learning tool**. By decoupling progression patterns from specific keys, we've created a flexible, educational, and musically intuitive system that scales to any key with zero configuration.

**Try it out:** Select "Pop I-V-vi-IV" and change the key from C → D → G → A. Watch all 4 chords transpose perfectly! 🎸🎵
