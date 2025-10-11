// Chord Progressions Data
// Story 9.3: Guitar Fretboard Visualizer with LED Matrix Output

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

export const CHORD_PROGRESSIONS: ChordProgression[] = [
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
          { string: 2, fret: 0 },
          { string: 3, fret: 0 },
          { string: 4, fret: 1 },
          { string: 5, fret: 0 },
          { string: 6, fret: 2 },
          { string: 1, fret: 0 }  // High E, open
        ]
      }
    ]
  },
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
  }
];
