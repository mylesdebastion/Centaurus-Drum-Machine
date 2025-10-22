// Comprehensive Guitar Chord Library
// Pre-defined chord shapes for common keys
// Uses standard guitar voicings optimized for sound quality

import { ChordNote } from './chordProgressions';

export interface ChordShape {
  root: string;          // 'C', 'D', 'E', etc.
  quality: ChordQuality;
  notes: ChordNote[];
}

export type ChordQuality =
  | 'major'     // Major triad (1-3-5)
  | 'minor'     // Minor triad (1-b3-5)
  | '7'         // Dominant 7th (1-3-5-b7)
  | 'maj7'      // Major 7th (1-3-5-7)
  | 'm7'        // Minor 7th (1-b3-5-b7)
  | 'dim'       // Diminished (1-b3-b5)
  | '5'         // Power chord (1-5)
  | '9'         // 9th chord (1-3-5-b7-9)
  | 'm7b5';     // Half-diminished (1-b3-b5-b7)

/**
 * Get chord shape by root and quality
 * Returns undefined if chord shape is not available
 */
export function getChordShape(root: string, quality: ChordQuality): ChordShape | undefined {
  const key = `${root}-${quality}`;
  return CHORD_LIBRARY[key];
}

/**
 * Get chord display name (e.g., "Cmaj7", "Am", "E7")
 */
export function getChordDisplayName(root: string, quality: ChordQuality): string {
  const qualityMap: Record<ChordQuality, string> = {
    'major': '',
    'minor': 'm',
    '7': '7',
    'maj7': 'maj7',
    'm7': 'm7',
    'dim': 'dim',
    '5': '5',
    '9': '9',
    'm7b5': 'm7b5'
  };

  return `${root}${qualityMap[quality]}`;
}

/**
 * Comprehensive chord library with pre-defined shapes
 * Format: "ROOT-QUALITY": ChordShape
 */
const CHORD_LIBRARY: Record<string, ChordShape> = {
  // ===== C CHORDS =====
  'C-major': {
    root: 'C',
    quality: 'major',
    notes: [
      { string: 5, fret: 3 },  // A string, fret 3 = C
      { string: 4, fret: 2 },  // D string, fret 2 = E
      { string: 3, fret: 0 },  // G string, open = G
      { string: 2, fret: 1 },  // B string, fret 1 = C
      { string: 1, fret: 0 }   // High E, open = E
    ]
  },
  'C-maj7': {
    root: 'C',
    quality: 'maj7',
    notes: [
      { string: 5, fret: 3 },  // A string, fret 3 = C
      { string: 4, fret: 2 },  // D string, fret 2 = E
      { string: 3, fret: 0 },  // G string, open = G
      { string: 2, fret: 0 },  // B string, open = B
      { string: 1, fret: 0 }   // High E, open = E
    ]
  },
  'C-7': {
    root: 'C',
    quality: '7',
    notes: [
      { string: 5, fret: 3 },  // C
      { string: 4, fret: 2 },  // E
      { string: 3, fret: 3 },  // Bb
      { string: 2, fret: 1 },  // C
      { string: 1, fret: 0 }   // E
    ]
  },
  'C-5': {
    root: 'C',
    quality: '5',
    notes: [
      { string: 6, fret: 8 },  // Low E, fret 8 = C
      { string: 5, fret: 10 }  // A string, fret 10 = G
    ]
  },

  // ===== C# / Db CHORDS =====
  'C#-major': {
    root: 'C#',
    quality: 'major',
    notes: [
      { string: 6, fret: 9 },   // Low E, fret 9 = C#
      { string: 5, fret: 11 },  // A string, fret 11 = G#
      { string: 4, fret: 11 },  // D string, fret 11 = C#
      { string: 3, fret: 10 },  // G string, fret 10 = F
      { string: 2, fret: 9 }    // B string, fret 9 = G#
    ]
  },
  'C#-7': {
    root: 'C#',
    quality: '7',
    notes: [
      { string: 6, fret: 9 },
      { string: 5, fret: 11 },
      { string: 4, fret: 9 },
      { string: 3, fret: 10 }
    ]
  },

  // ===== D CHORDS =====
  'D-major': {
    root: 'D',
    quality: 'major',
    notes: [
      { string: 4, fret: 0 },  // D string, open = D
      { string: 3, fret: 2 },  // G string, fret 2 = A
      { string: 2, fret: 3 },  // B string, fret 3 = D
      { string: 1, fret: 2 }   // High E, fret 2 = F#
    ]
  },
  'D-minor': {
    root: 'D',
    quality: 'minor',
    notes: [
      { string: 4, fret: 0 },  // D
      { string: 3, fret: 2 },  // A
      { string: 2, fret: 3 },  // D
      { string: 1, fret: 1 }   // F
    ]
  },
  'D-7': {
    root: 'D',
    quality: '7',
    notes: [
      { string: 4, fret: 0 },  // D
      { string: 3, fret: 2 },  // A
      { string: 2, fret: 1 },  // C
      { string: 1, fret: 2 }   // F#
    ]
  },
  'D-maj7': {
    root: 'D',
    quality: 'maj7',
    notes: [
      { string: 4, fret: 0 },  // D
      { string: 3, fret: 2 },  // A
      { string: 2, fret: 2 },  // C#
      { string: 1, fret: 2 }   // F#
    ]
  },
  'D-m7': {
    root: 'D',
    quality: 'm7',
    notes: [
      { string: 4, fret: 0 },  // D
      { string: 3, fret: 2 },  // A
      { string: 2, fret: 1 },  // C
      { string: 1, fret: 1 }   // F
    ]
  },
  'D-5': {
    root: 'D',
    quality: '5',
    notes: [
      { string: 6, fret: 10 },
      { string: 5, fret: 12 }
    ]
  },
  'D-9': {
    root: 'D',
    quality: '9',
    notes: [
      { string: 5, fret: 5 },
      { string: 4, fret: 4 },
      { string: 3, fret: 5 },
      { string: 2, fret: 5 }
    ]
  },

  // ===== D# / Eb CHORDS =====
  'Eb-major': {
    root: 'Eb',
    quality: 'major',
    notes: [
      { string: 6, fret: 11 },
      { string: 5, fret: 13 },
      { string: 4, fret: 13 },
      { string: 3, fret: 12 }
    ]
  },

  // ===== E CHORDS =====
  'E-major': {
    root: 'E',
    quality: 'major',
    notes: [
      { string: 6, fret: 0 },  // Low E, open
      { string: 5, fret: 2 },  // A string, fret 2 = B
      { string: 4, fret: 2 },  // D string, fret 2 = E
      { string: 3, fret: 1 },  // G string, fret 1 = G#
      { string: 2, fret: 0 },  // B string, open = B
      { string: 1, fret: 0 }   // High E, open
    ]
  },
  'E-minor': {
    root: 'E',
    quality: 'minor',
    notes: [
      { string: 6, fret: 0 },  // E
      { string: 5, fret: 2 },  // B
      { string: 4, fret: 2 },  // E
      { string: 3, fret: 0 },  // G
      { string: 2, fret: 0 },  // B
      { string: 1, fret: 0 }   // E
    ]
  },
  'E-7': {
    root: 'E',
    quality: '7',
    notes: [
      { string: 6, fret: 0 },  // E
      { string: 5, fret: 2 },  // B
      { string: 4, fret: 0 },  // D
      { string: 3, fret: 1 },  // G#
      { string: 2, fret: 0 },  // B
      { string: 1, fret: 0 }   // E
    ]
  },
  'E-maj7': {
    root: 'E',
    quality: 'maj7',
    notes: [
      { string: 6, fret: 0 },
      { string: 5, fret: 2 },
      { string: 4, fret: 1 },  // D#
      { string: 3, fret: 1 },
      { string: 2, fret: 0 },
      { string: 1, fret: 0 }
    ]
  },
  'E-m7': {
    root: 'E',
    quality: 'm7',
    notes: [
      { string: 6, fret: 0 },
      { string: 5, fret: 2 },
      { string: 4, fret: 0 },
      { string: 3, fret: 0 },
      { string: 2, fret: 0 },
      { string: 1, fret: 0 }
    ]
  },
  'E-5': {
    root: 'E',
    quality: '5',
    notes: [
      { string: 6, fret: 0 },
      { string: 5, fret: 2 },
      { string: 4, fret: 2 }
    ]
  },

  // ===== F CHORDS =====
  'F-major': {
    root: 'F',
    quality: 'major',
    notes: [
      { string: 6, fret: 1 },  // F
      { string: 5, fret: 3 },  // C
      { string: 4, fret: 3 },  // F
      { string: 3, fret: 2 },  // A
      { string: 2, fret: 1 },  // C
      { string: 1, fret: 1 }   // F
    ]
  },
  'F-minor': {
    root: 'F',
    quality: 'minor',
    notes: [
      { string: 6, fret: 1 },
      { string: 5, fret: 3 },
      { string: 4, fret: 3 },
      { string: 3, fret: 1 },  // Ab
      { string: 2, fret: 1 },
      { string: 1, fret: 1 }
    ]
  },
  'F-maj7': {
    root: 'F',
    quality: 'maj7',
    notes: [
      { string: 5, fret: 3 },
      { string: 4, fret: 3 },
      { string: 3, fret: 2 },
      { string: 2, fret: 1 }
    ]
  },
  'F-7': {
    root: 'F',
    quality: '7',
    notes: [
      { string: 6, fret: 1 },
      { string: 5, fret: 3 },
      { string: 4, fret: 1 },  // Eb
      { string: 3, fret: 2 },
      { string: 2, fret: 1 }
    ]
  },
  'F-5': {
    root: 'F',
    quality: '5',
    notes: [
      { string: 6, fret: 1 },
      { string: 5, fret: 3 }
    ]
  },

  // ===== F# / Gb CHORDS =====
  'F#-major': {
    root: 'F#',
    quality: 'major',
    notes: [
      { string: 6, fret: 2 },
      { string: 5, fret: 4 },
      { string: 4, fret: 4 },
      { string: 3, fret: 3 },
      { string: 2, fret: 2 },
      { string: 1, fret: 2 }
    ]
  },
  'F#-minor': {
    root: 'F#',
    quality: 'minor',
    notes: [
      { string: 6, fret: 2 },
      { string: 5, fret: 4 },
      { string: 4, fret: 4 },
      { string: 3, fret: 2 },
      { string: 2, fret: 2 },
      { string: 1, fret: 2 }
    ]
  },
  'F#-7': {
    root: 'F#',
    quality: '7',
    notes: [
      { string: 6, fret: 2 },
      { string: 5, fret: 4 },
      { string: 4, fret: 2 },
      { string: 3, fret: 3 }
    ]
  },

  // ===== G CHORDS =====
  'G-major': {
    root: 'G',
    quality: 'major',
    notes: [
      { string: 6, fret: 3 },  // G
      { string: 5, fret: 2 },  // B
      { string: 4, fret: 0 },  // D
      { string: 3, fret: 0 },  // G
      { string: 2, fret: 0 },  // B
      { string: 1, fret: 3 }   // G
    ]
  },
  'G-minor': {
    root: 'G',
    quality: 'minor',
    notes: [
      { string: 6, fret: 3 },
      { string: 5, fret: 5 },
      { string: 4, fret: 5 },
      { string: 3, fret: 3 },
      { string: 2, fret: 3 },
      { string: 1, fret: 3 }
    ]
  },
  'G-7': {
    root: 'G',
    quality: '7',
    notes: [
      { string: 6, fret: 3 },  // G
      { string: 5, fret: 2 },  // B
      { string: 4, fret: 0 },  // D
      { string: 3, fret: 0 },  // G
      { string: 2, fret: 0 },  // B
      { string: 1, fret: 1 }   // F
    ]
  },
  'G-maj7': {
    root: 'G',
    quality: 'maj7',
    notes: [
      { string: 6, fret: 3 },
      { string: 5, fret: 2 },
      { string: 4, fret: 0 },
      { string: 3, fret: 0 },
      { string: 2, fret: 0 },
      { string: 1, fret: 2 }  // F#
    ]
  },
  'G-5': {
    root: 'G',
    quality: '5',
    notes: [
      { string: 6, fret: 3 },
      { string: 5, fret: 5 }
    ]
  },

  // ===== G# / Ab CHORDS =====
  'Ab-major': {
    root: 'Ab',
    quality: 'major',
    notes: [
      { string: 6, fret: 4 },
      { string: 5, fret: 6 },
      { string: 4, fret: 6 },
      { string: 3, fret: 5 },
      { string: 2, fret: 4 }
    ]
  },
  'Ab-7': {
    root: 'Ab',
    quality: '7',
    notes: [
      { string: 6, fret: 4 },
      { string: 5, fret: 6 },
      { string: 4, fret: 4 },
      { string: 3, fret: 5 }
    ]
  },

  // ===== A CHORDS =====
  'A-major': {
    root: 'A',
    quality: 'major',
    notes: [
      { string: 5, fret: 0 },  // A
      { string: 4, fret: 2 },  // E
      { string: 3, fret: 2 },  // A
      { string: 2, fret: 2 },  // C#
      { string: 1, fret: 0 }   // E
    ]
  },
  'A-minor': {
    root: 'A',
    quality: 'minor',
    notes: [
      { string: 5, fret: 0 },  // A
      { string: 4, fret: 2 },  // E
      { string: 3, fret: 2 },  // A
      { string: 2, fret: 1 },  // C
      { string: 1, fret: 0 }   // E
    ]
  },
  'A-7': {
    root: 'A',
    quality: '7',
    notes: [
      { string: 5, fret: 0 },  // A
      { string: 4, fret: 2 },  // E
      { string: 3, fret: 0 },  // G
      { string: 2, fret: 2 },  // C#
      { string: 1, fret: 0 }   // E
    ]
  },
  'A-maj7': {
    root: 'A',
    quality: 'maj7',
    notes: [
      { string: 5, fret: 0 },
      { string: 4, fret: 2 },
      { string: 3, fret: 1 },  // G#
      { string: 2, fret: 2 },
      { string: 1, fret: 0 }
    ]
  },
  'A-m7': {
    root: 'A',
    quality: 'm7',
    notes: [
      { string: 5, fret: 0 },
      { string: 4, fret: 2 },
      { string: 3, fret: 0 },  // G
      { string: 2, fret: 1 },
      { string: 1, fret: 0 }
    ]
  },
  'A-5': {
    root: 'A',
    quality: '5',
    notes: [
      { string: 5, fret: 0 },
      { string: 4, fret: 2 },
      { string: 3, fret: 2 }
    ]
  },
  'A-9': {
    root: 'A',
    quality: '9',
    notes: [
      { string: 5, fret: 0 },
      { string: 4, fret: 2 },
      { string: 3, fret: 2 },
      { string: 2, fret: 0 }  // B
    ]
  },

  // ===== A# / Bb CHORDS =====
  'Bb-major': {
    root: 'Bb',
    quality: 'major',
    notes: [
      { string: 6, fret: 6 },
      { string: 5, fret: 8 },
      { string: 4, fret: 8 },
      { string: 3, fret: 7 },
      { string: 2, fret: 6 }
    ]
  },
  'Bb-7': {
    root: 'Bb',
    quality: '7',
    notes: [
      { string: 6, fret: 6 },
      { string: 5, fret: 8 },
      { string: 4, fret: 6 },
      { string: 3, fret: 7 }
    ]
  },

  // ===== B CHORDS =====
  'B-major': {
    root: 'B',
    quality: 'major',
    notes: [
      { string: 5, fret: 2 },  // B
      { string: 4, fret: 4 },  // F#
      { string: 3, fret: 4 },  // B
      { string: 2, fret: 4 },  // D#
      { string: 1, fret: 2 }   // F#
    ]
  },
  'B-minor': {
    root: 'B',
    quality: 'minor',
    notes: [
      { string: 5, fret: 2 },  // B
      { string: 4, fret: 4 },  // F#
      { string: 3, fret: 4 },  // B
      { string: 2, fret: 3 },  // D
      { string: 1, fret: 2 }   // F#
    ]
  },
  'B-7': {
    root: 'B',
    quality: '7',
    notes: [
      { string: 5, fret: 2 },
      { string: 4, fret: 1 },  // A
      { string: 3, fret: 2 },
      { string: 2, fret: 0 }
    ]
  },
  'B-m7': {
    root: 'B',
    quality: 'm7',
    notes: [
      { string: 5, fret: 2 },
      { string: 4, fret: 2 },
      { string: 3, fret: 2 },
      { string: 2, fret: 0 }
    ]
  },
  'B-5': {
    root: 'B',
    quality: '5',
    notes: [
      { string: 5, fret: 2 },
      { string: 4, fret: 4 }
    ]
  },

  // ===== DIMINISHED CHORDS =====
  'B-dim': {
    root: 'B',
    quality: 'dim',
    notes: [
      { string: 5, fret: 2 },
      { string: 4, fret: 3 },
      { string: 3, fret: 1 },
      { string: 2, fret: 2 }
    ]
  },
  'D-dim': {
    root: 'D',
    quality: 'dim',
    notes: [
      { string: 4, fret: 0 },
      { string: 3, fret: 1 },
      { string: 2, fret: 0 },
      { string: 1, fret: 1 }
    ]
  },
  'F#-dim': {
    root: 'F#',
    quality: 'dim',
    notes: [
      { string: 5, fret: 0 },
      { string: 4, fret: 1 },
      { string: 3, fret: 2 },
      { string: 2, fret: 0 }
    ]
  },

  // ===== HALF-DIMINISHED (m7b5) =====
  'B-m7b5': {
    root: 'B',
    quality: 'm7b5',
    notes: [
      { string: 5, fret: 2 },
      { string: 4, fret: 3 },
      { string: 3, fret: 2 },
      { string: 2, fret: 3 }
    ]
  }
};

export default CHORD_LIBRARY;
