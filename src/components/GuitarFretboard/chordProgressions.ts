// Chord Progressions Data
// Story 9.3: Guitar Fretboard Visualizer with LED Matrix Output

import { romanNumeralsToChords } from './romanNumeralConverter';

export interface ChordNote {
  string: number;  // 1-6 (1 = high E, 6 = low E)
  fret: number;    // 0-24
}

export interface Chord {
  name: string;
  notes: ChordNote[];
}

export interface ChordProgression {
  name: string;
  chords: Chord[];
}

/**
 * Roman Numeral Chord Progression
 * Uses Roman numerals that adapt to the selected key
 */
export interface RomanNumeralProgression {
  name: string;
  romanNumerals: string[];  // e.g., ["I", "V", "vi", "IV"]
  description: string;
  genre: string;
  scaleType: 'major' | 'minor';
}

/**
 * Resolve Roman numeral progression to actual chords based on key
 */
export function resolveProgression(
  progression: RomanNumeralProgression,
  keyRoot: string
): ChordProgression {
  const chords = romanNumeralsToChords(
    progression.romanNumerals,
    keyRoot,
    progression.scaleType
  );

  return {
    name: `${progression.name} in ${keyRoot}`,
    chords
  };
}

export const CHORD_PROGRESSIONS: ChordProgression[] = [
  // ===== JAZZ =====
  {
    name: "Jazz ii-V-I in C",
    chords: [
      {
        name: "Dm7",
        notes: [
          { string: 2, fret: 1 },  // B string, fret 1
          { string: 3, fret: 1 },  // G string, fret 1
          { string: 4, fret: 2 },  // D string, fret 2
          { string: 5, fret: 3 }   // A string, fret 3
        ]
      },
      {
        name: "G7",
        notes: [
          { string: 2, fret: 1 },  // B string, fret 1
          { string: 3, fret: 0 },  // G string, open
          { string: 4, fret: 0 },  // D string, open
          { string: 5, fret: 0 },  // A string, open
          { string: 6, fret: 2 }   // Low E string, fret 2
        ]
      },
      {
        name: "Cmaj7",
        notes: [
          { string: 2, fret: 0 },  // B string, open
          { string: 3, fret: 3 },  // G string, fret 3
          { string: 4, fret: 2 },  // D string, fret 2
          { string: 5, fret: 0 },  // A string, open
          { string: 6, fret: 0 }   // Low E string, open
        ]
      }
    ]
  },
  {
    name: "Jazz Autumn Leaves (Am)",
    chords: [
      {
        name: "Am7",
        notes: [
          { string: 2, fret: 1 },
          { string: 3, fret: 0 },
          { string: 4, fret: 2 },
          { string: 5, fret: 0 }
        ]
      },
      {
        name: "D7",
        notes: [
          { string: 2, fret: 1 },
          { string: 3, fret: 2 },
          { string: 4, fret: 0 },
          { string: 5, fret: 0 }
        ]
      },
      {
        name: "Gmaj7",
        notes: [
          { string: 2, fret: 0 },
          { string: 3, fret: 0 },
          { string: 4, fret: 0 },
          { string: 5, fret: 2 },
          { string: 6, fret: 3 }
        ]
      },
      {
        name: "Cmaj7",
        notes: [
          { string: 2, fret: 0 },
          { string: 3, fret: 0 },
          { string: 4, fret: 2 },
          { string: 5, fret: 3 }
        ]
      }
    ]
  },

  // ===== BLUES =====
  {
    name: "Blues in A",
    chords: [
      {
        name: "A7",
        notes: [
          { string: 2, fret: 0 },
          { string: 3, fret: 2 },
          { string: 4, fret: 0 },
          { string: 5, fret: 2 },
          { string: 6, fret: 0 }
        ]
      },
      {
        name: "D7",
        notes: [
          { string: 2, fret: 2 },
          { string: 3, fret: 1 },
          { string: 4, fret: 2 },
          { string: 5, fret: 0 },
          { string: 6, fret: 2 }
        ]
      },
      {
        name: "E7",
        notes: [
          { string: 6, fret: 0 },  // Low E, open
          { string: 5, fret: 2 },  // A string, fret 2 = B
          { string: 4, fret: 0 },  // D string, open = D
          { string: 3, fret: 1 },  // G string, fret 1 = G#
          { string: 2, fret: 0 },  // B string, open = B
          { string: 1, fret: 0 }   // High E, open
        ]
      }
    ]
  },
  {
    name: "Blues in E (Slow)",
    chords: [
      {
        name: "E7",
        notes: [
          { string: 6, fret: 0 },  // Low E, open
          { string: 5, fret: 2 },  // A string, fret 2 = B
          { string: 4, fret: 0 },  // D string, open = D
          { string: 3, fret: 1 },  // G string, fret 1 = G#
          { string: 2, fret: 0 },  // B string, open = B
          { string: 1, fret: 0 }   // High E, open
        ]
      },
      {
        name: "A7",
        notes: [
          { string: 2, fret: 2 },
          { string: 3, fret: 0 },
          { string: 4, fret: 2 },
          { string: 5, fret: 0 }
        ]
      },
      {
        name: "B7",
        notes: [
          { string: 2, fret: 0 },
          { string: 3, fret: 2 },
          { string: 4, fret: 1 },
          { string: 5, fret: 2 }
        ]
      }
    ]
  },

  // ===== POP =====
  {
    name: "Pop I-V-vi-IV in G",
    chords: [
      {
        name: "G",
        notes: [
          { string: 2, fret: 3 },
          { string: 3, fret: 0 },
          { string: 4, fret: 0 },
          { string: 5, fret: 0 },
          { string: 6, fret: 2 },
          { string: 1, fret: 3 }
        ]
      },
      {
        name: "D",
        notes: [
          { string: 2, fret: 2 },
          { string: 3, fret: 3 },
          { string: 4, fret: 2 },
          { string: 5, fret: 0 },
          { string: 6, fret: 0 }
        ]
      },
      {
        name: "Em",
        notes: [
          { string: 2, fret: 0 },
          { string: 3, fret: 0 },
          { string: 4, fret: 0 },
          { string: 5, fret: 2 },
          { string: 6, fret: 2 }
        ]
      },
      {
        name: "C",
        notes: [
          { string: 2, fret: 0 },
          { string: 3, fret: 1 },
          { string: 4, fret: 0 },
          { string: 5, fret: 2 },
          { string: 6, fret: 3 }
        ]
      }
    ]
  },
  {
    name: "Pop I-V-vi-IV in C",
    chords: [
      {
        name: "C",
        notes: [
          { string: 2, fret: 1 },
          { string: 3, fret: 0 },
          { string: 4, fret: 2 },
          { string: 5, fret: 3 }
        ]
      },
      {
        name: "G",
        notes: [
          { string: 2, fret: 0 },
          { string: 3, fret: 0 },
          { string: 4, fret: 0 },
          { string: 5, fret: 2 },
          { string: 6, fret: 3 }
        ]
      },
      {
        name: "Am",
        notes: [
          { string: 2, fret: 1 },
          { string: 3, fret: 2 },
          { string: 4, fret: 2 },
          { string: 5, fret: 0 }
        ]
      },
      {
        name: "F",
        notes: [
          { string: 2, fret: 1 },
          { string: 3, fret: 2 },
          { string: 4, fret: 3 },
          { string: 5, fret: 3 }
        ]
      }
    ]
  },

  // ===== ROCK =====
  {
    name: "Rock I-IV-V in E",
    chords: [
      {
        name: "E",
        notes: [
          { string: 6, fret: 0 },  // Low E, open
          { string: 5, fret: 2 },  // A string, fret 2 = B
          { string: 4, fret: 2 },  // D string, fret 2 = E
          { string: 3, fret: 1 },  // G string, fret 1 = G#
          { string: 2, fret: 0 },  // B string, open = B
          { string: 1, fret: 0 }   // High E, open
        ]
      },
      {
        name: "A",
        notes: [
          { string: 2, fret: 2 },
          { string: 3, fret: 2 },
          { string: 4, fret: 2 },
          { string: 5, fret: 0 }
        ]
      },
      {
        name: "B",
        notes: [
          { string: 2, fret: 4 },
          { string: 3, fret: 4 },
          { string: 4, fret: 4 },
          { string: 5, fret: 2 }
        ]
      }
    ]
  },
  {
    name: "Rock I-bVII-IV in A",
    chords: [
      {
        name: "A",
        notes: [
          { string: 2, fret: 2 },
          { string: 3, fret: 2 },
          { string: 4, fret: 2 },
          { string: 5, fret: 0 }
        ]
      },
      {
        name: "G",
        notes: [
          { string: 2, fret: 0 },
          { string: 3, fret: 0 },
          { string: 4, fret: 0 },
          { string: 5, fret: 2 },
          { string: 6, fret: 3 }
        ]
      },
      {
        name: "D",
        notes: [
          { string: 2, fret: 3 },
          { string: 3, fret: 2 },
          { string: 4, fret: 0 },
          { string: 5, fret: 0 }
        ]
      }
    ]
  },

  // ===== COUNTRY =====
  {
    name: "Country I-IV-I-V in G",
    chords: [
      {
        name: "G",
        notes: [
          { string: 2, fret: 0 },
          { string: 3, fret: 0 },
          { string: 4, fret: 0 },
          { string: 5, fret: 2 },
          { string: 6, fret: 3 }
        ]
      },
      {
        name: "C",
        notes: [
          { string: 2, fret: 1 },
          { string: 3, fret: 0 },
          { string: 4, fret: 2 },
          { string: 5, fret: 3 }
        ]
      },
      {
        name: "G",
        notes: [
          { string: 2, fret: 0 },
          { string: 3, fret: 0 },
          { string: 4, fret: 0 },
          { string: 5, fret: 2 },
          { string: 6, fret: 3 }
        ]
      },
      {
        name: "D",
        notes: [
          { string: 2, fret: 3 },
          { string: 3, fret: 2 },
          { string: 4, fret: 0 },
          { string: 5, fret: 0 }
        ]
      }
    ]
  },

  // ===== FUNK =====
  {
    name: "Funk in Em",
    chords: [
      {
        name: "Em7",
        notes: [
          { string: 2, fret: 0 },
          { string: 3, fret: 0 },
          { string: 4, fret: 0 },
          { string: 5, fret: 2 },
          { string: 6, fret: 0 }
        ]
      },
      {
        name: "Am7",
        notes: [
          { string: 2, fret: 1 },
          { string: 3, fret: 0 },
          { string: 4, fret: 2 },
          { string: 5, fret: 0 }
        ]
      }
    ]
  },
  {
    name: "Funk Vamp in A",
    chords: [
      {
        name: "A9",
        notes: [
          { string: 2, fret: 0 },
          { string: 3, fret: 2 },
          { string: 4, fret: 2 },
          { string: 5, fret: 0 }
        ]
      },
      {
        name: "D9",
        notes: [
          { string: 2, fret: 3 },
          { string: 3, fret: 2 },
          { string: 4, fret: 2 },
          { string: 5, fret: 0 }
        ]
      }
    ]
  },

  // ===== BOSSA NOVA / LATIN =====
  {
    name: "Bossa Nova in Am",
    chords: [
      {
        name: "Am7",
        notes: [
          { string: 2, fret: 1 },
          { string: 3, fret: 0 },
          { string: 4, fret: 2 },
          { string: 5, fret: 0 }
        ]
      },
      {
        name: "Dm7",
        notes: [
          { string: 2, fret: 1 },
          { string: 3, fret: 2 },
          { string: 4, fret: 0 },
          { string: 5, fret: 0 }
        ]
      },
      {
        name: "G7",
        notes: [
          { string: 2, fret: 0 },
          { string: 3, fret: 0 },
          { string: 4, fret: 0 },
          { string: 5, fret: 2 },
          { string: 6, fret: 3 }
        ]
      },
      {
        name: "Cmaj7",
        notes: [
          { string: 2, fret: 0 },
          { string: 3, fret: 0 },
          { string: 4, fret: 2 },
          { string: 5, fret: 3 }
        ]
      }
    ]
  },

  // ===== R&B / SOUL =====
  {
    name: "R&B I-iii-IV-V in C",
    chords: [
      {
        name: "Cmaj7",
        notes: [
          { string: 2, fret: 0 },
          { string: 3, fret: 0 },
          { string: 4, fret: 2 },
          { string: 5, fret: 3 }
        ]
      },
      {
        name: "Em7",
        notes: [
          { string: 2, fret: 0 },
          { string: 3, fret: 0 },
          { string: 4, fret: 0 },
          { string: 5, fret: 2 }
        ]
      },
      {
        name: "Fmaj7",
        notes: [
          { string: 2, fret: 1 },
          { string: 3, fret: 2 },
          { string: 4, fret: 3 },
          { string: 5, fret: 3 }
        ]
      },
      {
        name: "G7",
        notes: [
          { string: 2, fret: 0 },
          { string: 3, fret: 0 },
          { string: 4, fret: 0 },
          { string: 5, fret: 2 },
          { string: 6, fret: 3 }
        ]
      }
    ]
  },

  // ===== FOLK =====
  {
    name: "Folk in D",
    chords: [
      {
        name: "D",
        notes: [
          { string: 2, fret: 3 },
          { string: 3, fret: 2 },
          { string: 4, fret: 0 },
          { string: 5, fret: 0 }
        ]
      },
      {
        name: "G",
        notes: [
          { string: 2, fret: 0 },
          { string: 3, fret: 0 },
          { string: 4, fret: 0 },
          { string: 5, fret: 2 },
          { string: 6, fret: 3 }
        ]
      },
      {
        name: "A",
        notes: [
          { string: 2, fret: 2 },
          { string: 3, fret: 2 },
          { string: 4, fret: 2 },
          { string: 5, fret: 0 }
        ]
      },
      {
        name: "Bm",
        notes: [
          { string: 2, fret: 3 },
          { string: 3, fret: 4 },
          { string: 4, fret: 4 },
          { string: 5, fret: 2 }
        ]
      }
    ]
  },

  // ===== REGGAE =====
  {
    name: "Reggae in C",
    chords: [
      {
        name: "C",
        notes: [
          { string: 2, fret: 1 },
          { string: 3, fret: 0 },
          { string: 4, fret: 2 },
          { string: 5, fret: 3 }
        ]
      },
      {
        name: "G",
        notes: [
          { string: 2, fret: 0 },
          { string: 3, fret: 0 },
          { string: 4, fret: 0 },
          { string: 5, fret: 2 },
          { string: 6, fret: 3 }
        ]
      },
      {
        name: "Am",
        notes: [
          { string: 2, fret: 1 },
          { string: 3, fret: 2 },
          { string: 4, fret: 2 },
          { string: 5, fret: 0 }
        ]
      },
      {
        name: "F",
        notes: [
          { string: 2, fret: 1 },
          { string: 3, fret: 2 },
          { string: 4, fret: 3 },
          { string: 5, fret: 3 }
        ]
      }
    ]
  },

  // ===== METAL / POWER CHORDS =====
  {
    name: "Metal in Em (Power Chords)",
    chords: [
      {
        name: "E5",
        notes: [
          { string: 5, fret: 7 },
          { string: 6, fret: 0 }
        ]
      },
      {
        name: "G5",
        notes: [
          { string: 5, fret: 10 },
          { string: 6, fret: 3 }
        ]
      },
      {
        name: "D5",
        notes: [
          { string: 5, fret: 5 },
          { string: 6, fret: 10 }
        ]
      },
      {
        name: "C5",
        notes: [
          { string: 5, fret: 3 },
          { string: 6, fret: 8 }
        ]
      }
    ]
  },

  // ===== INDIE / ALT ROCK =====
  {
    name: "Indie vi-IV-I-V in C",
    chords: [
      {
        name: "Am",
        notes: [
          { string: 2, fret: 1 },
          { string: 3, fret: 2 },
          { string: 4, fret: 2 },
          { string: 5, fret: 0 }
        ]
      },
      {
        name: "F",
        notes: [
          { string: 2, fret: 1 },
          { string: 3, fret: 2 },
          { string: 4, fret: 3 },
          { string: 5, fret: 3 }
        ]
      },
      {
        name: "C",
        notes: [
          { string: 2, fret: 1 },
          { string: 3, fret: 0 },
          { string: 4, fret: 2 },
          { string: 5, fret: 3 }
        ]
      },
      {
        name: "G",
        notes: [
          { string: 2, fret: 0 },
          { string: 3, fret: 0 },
          { string: 4, fret: 0 },
          { string: 5, fret: 2 },
          { string: 6, fret: 3 }
        ]
      }
    ]
  },

  // ===== BALLAD =====
  {
    name: "Ballad in G",
    chords: [
      {
        name: "G",
        notes: [
          { string: 2, fret: 0 },
          { string: 3, fret: 0 },
          { string: 4, fret: 0 },
          { string: 5, fret: 2 },
          { string: 6, fret: 3 }
        ]
      },
      {
        name: "Em",
        notes: [
          { string: 2, fret: 0 },
          { string: 3, fret: 0 },
          { string: 4, fret: 2 },
          { string: 5, fret: 2 },
          { string: 6, fret: 0 }
        ]
      },
      {
        name: "C",
        notes: [
          { string: 2, fret: 1 },
          { string: 3, fret: 0 },
          { string: 4, fret: 2 },
          { string: 5, fret: 3 }
        ]
      },
      {
        name: "D",
        notes: [
          { string: 2, fret: 3 },
          { string: 3, fret: 2 },
          { string: 4, fret: 0 },
          { string: 5, fret: 0 }
        ]
      }
    ]
  }
];

/**
 * Roman Numeral Chord Progressions
 * These adapt to any key selected by the user
 */
export const ROMAN_NUMERAL_PROGRESSIONS: RomanNumeralProgression[] = [
  // ===== POP =====
  {
    name: "Pop I-V-vi-IV",
    romanNumerals: ["I", "V", "vi", "IV"],
    description: "Classic pop progression (Journey, Blink-182, Axis of Awesome)",
    genre: "Pop",
    scaleType: 'major'
  },
  {
    name: "Pop vi-IV-I-V",
    romanNumerals: ["vi", "IV", "I", "V"],
    description: "Sad pop progression (Avicii - Wake Me Up)",
    genre: "Pop",
    scaleType: 'major'
  },

  // ===== JAZZ =====
  {
    name: "Jazz ii-V-I",
    romanNumerals: ["ii7", "V7", "Imaj7"],
    description: "Most common jazz progression",
    genre: "Jazz",
    scaleType: 'major'
  },
  {
    name: "Jazz Autumn Leaves",
    romanNumerals: ["ii7", "V7", "Imaj7", "IVmaj7"],
    description: "Classic jazz standard progression",
    genre: "Jazz",
    scaleType: 'minor'
  },

  // ===== BLUES =====
  {
    name: "12-Bar Blues",
    romanNumerals: ["I7", "I7", "I7", "I7", "IV7", "IV7", "I7", "I7", "V7", "IV7", "I7", "V7"],
    description: "Classic 12-bar blues (simplified to 4 chords for display)",
    genre: "Blues",
    scaleType: 'major'
  },
  {
    name: "Blues I-IV-V",
    romanNumerals: ["I7", "IV7", "V7"],
    description: "Essential blues progression",
    genre: "Blues",
    scaleType: 'major'
  },

  // ===== ROCK =====
  {
    name: "Rock I-IV-V",
    romanNumerals: ["I", "IV", "V"],
    description: "Basic rock progression (Wild Thing, Louie Louie)",
    genre: "Rock",
    scaleType: 'major'
  },
  {
    name: "Rock I-bVII-IV",
    romanNumerals: ["I", "bVII", "IV"],
    description: "Mixolydian rock sound (Sweet Child O' Mine)",
    genre: "Rock",
    scaleType: 'major'
  },
  {
    name: "Rock i-VI-III-VII",
    romanNumerals: ["i", "VI", "III", "VII"],
    description: "Minor rock progression (Andalusian cadence)",
    genre: "Rock",
    scaleType: 'minor'
  },

  // ===== COUNTRY =====
  {
    name: "Country I-IV-I-V",
    romanNumerals: ["I", "IV", "I", "V"],
    description: "Classic country progression",
    genre: "Country",
    scaleType: 'major'
  },

  // ===== R&B / SOUL =====
  {
    name: "R&B I-iii-IV-V",
    romanNumerals: ["Imaj7", "iii7", "IVmaj7", "V7"],
    description: "Smooth R&B progression",
    genre: "R&B",
    scaleType: 'major'
  },

  // ===== FUNK =====
  {
    name: "Funk i-iv",
    romanNumerals: ["i7", "iv7"],
    description: "Modal funk vamp (Dorian sound)",
    genre: "Funk",
    scaleType: 'minor'
  },

  // ===== BOSSA NOVA =====
  {
    name: "Bossa Nova ii-V-I",
    romanNumerals: ["ii7", "V7", "Imaj7"],
    description: "Brazilian bossa nova feel",
    genre: "Bossa Nova",
    scaleType: 'major'
  },

  // ===== FOLK =====
  {
    name: "Folk I-V-vi-IV",
    romanNumerals: ["I", "V", "vi", "IV"],
    description: "Folk ballad progression",
    genre: "Folk",
    scaleType: 'major'
  },

  // ===== REGGAE =====
  {
    name: "Reggae I-V-vi-IV",
    romanNumerals: ["I", "V", "vi", "IV"],
    description: "Classic reggae progression",
    genre: "Reggae",
    scaleType: 'major'
  },

  // ===== METAL =====
  {
    name: "Metal i-VI-III-VII",
    romanNumerals: ["i5", "VI5", "III5", "VII5"],
    description: "Power chord progression",
    genre: "Metal",
    scaleType: 'minor'
  },
  {
    name: "Metal i-bVI-bVII",
    romanNumerals: ["i5", "bVI5", "bVII5"],
    description: "Classic metal progression",
    genre: "Metal",
    scaleType: 'minor'
  },

  // ===== INDIE =====
  {
    name: "Indie I-IV-vi-V",
    romanNumerals: ["I", "IV", "vi", "V"],
    description: "Modern indie progression",
    genre: "Indie",
    scaleType: 'major'
  },

  // ===== BALLAD =====
  {
    name: "Ballad I-vi-IV-V",
    romanNumerals: ["I", "vi", "IV", "V"],
    description: "Classic 50s/60s ballad (doo-wop progression)",
    genre: "Ballad",
    scaleType: 'major'
  }
];
