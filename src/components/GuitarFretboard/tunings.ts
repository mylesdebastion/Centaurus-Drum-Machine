// Guitar Tunings Library
// Uses scientific pitch notation (note + octave number)
// Strings listed from lowest (6th string) to highest (1st string)

export interface GuitarTuning {
  name: string;
  strings: [string, string, string, string, string, string]; // 6 strings
  description: string;
  category: 'standard' | 'drop' | 'open' | 'modal' | 'alternate';
}

/**
 * Convert scientific pitch notation to MIDI note number
 * Examples: "C4" = 60, "A4" = 69, "E2" = 40
 */
export function noteToMIDI(note: string): number {
  const noteMap: Record<string, number> = {
    'C': 0, 'C#': 1, 'Db': 1,
    'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4,
    'F': 5, 'F#': 6, 'Gb': 6,
    'G': 7, 'G#': 8, 'Ab': 8,
    'A': 9, 'A#': 10, 'Bb': 10,
    'B': 11
  };

  // Extract note name and octave
  const match = note.match(/^([A-G][#b]?)(\d)$/);
  if (!match) {
    console.error(`Invalid note format: ${note}`);
    return 60; // Default to middle C
  }

  const [, noteName, octaveStr] = match;
  const octave = parseInt(octaveStr, 10);
  const noteClass = noteMap[noteName];

  if (noteClass === undefined) {
    console.error(`Unknown note: ${noteName}`);
    return 60;
  }

  // MIDI note calculation: (octave + 1) * 12 + noteClass
  // C4 (middle C) = (4 + 1) * 12 + 0 = 60
  return (octave + 1) * 12 + noteClass;
}

/**
 * Comprehensive guitar tunings library
 */
export const GUITAR_TUNINGS: GuitarTuning[] = [
  // ===== STANDARD TUNINGS =====
  {
    name: "Standard (E)",
    strings: ["E2", "A2", "D3", "G3", "B3", "E4"],
    description: "Standard guitar tuning - E A D G B E",
    category: 'standard'
  },

  // ===== DROP TUNINGS =====
  {
    name: "Drop D",
    strings: ["D2", "A2", "D3", "G3", "B3", "E4"],
    description: "Drop D - Low E dropped to D. Popular in rock and metal",
    category: 'drop'
  },
  {
    name: "Drop C",
    strings: ["C2", "G2", "C3", "F3", "A3", "D4"],
    description: "Drop C - Whole step down plus drop D. Heavy rock and metal",
    category: 'drop'
  },
  {
    name: "Drop C#",
    strings: ["C#2", "G#2", "C#3", "F#3", "A#3", "D#4"],
    description: "Drop C# - Between drop D and drop C",
    category: 'drop'
  },
  {
    name: "Drop B",
    strings: ["B1", "F#2", "B2", "E3", "G#3", "C#4"],
    description: "Drop B - Very heavy tuning for extended range",
    category: 'drop'
  },

  // ===== OPEN TUNINGS =====
  {
    name: "Open G",
    strings: ["D2", "G2", "D3", "G3", "B3", "D4"],
    description: "Open G major chord. Used by Keith Richards and blues players",
    category: 'open'
  },
  {
    name: "Open D",
    strings: ["D2", "A2", "D3", "F#3", "A3", "D4"],
    description: "Open D major chord. Popular in blues and slide guitar",
    category: 'open'
  },
  {
    name: "Open E",
    strings: ["E2", "B2", "E3", "G#3", "B3", "E4"],
    description: "Open E major chord. Used for slide guitar and blues",
    category: 'open'
  },
  {
    name: "Open A",
    strings: ["E2", "A2", "E3", "A3", "C#4", "E4"],
    description: "Open A major chord. Bright sound for slide guitar",
    category: 'open'
  },
  {
    name: "Open C",
    strings: ["C2", "G2", "C3", "G3", "C4", "E4"],
    description: "Open C major chord. Rich low end",
    category: 'open'
  },

  // ===== MODAL TUNINGS =====
  {
    name: "DADGAD",
    strings: ["D2", "A2", "D3", "G3", "A3", "D4"],
    description: "DADGAD - Celtic folk tuning with suspended sound",
    category: 'modal'
  },
  {
    name: "DADF#AD",
    strings: ["D2", "A2", "D3", "F#3", "A3", "D4"],
    description: "Open D sus4 tuning. Ambient and folk",
    category: 'modal'
  },

  // ===== ALTERNATE TUNINGS =====
  {
    name: "Half Step Down",
    strings: ["Eb2", "Ab2", "Db3", "Gb3", "Bb3", "Eb4"],
    description: "Standard tuning down half step. Used by Jimi Hendrix",
    category: 'alternate'
  },
  {
    name: "Whole Step Down (D Standard)",
    strings: ["D2", "G2", "C3", "F3", "A3", "D4"],
    description: "Standard tuning down whole step. Heavier sound",
    category: 'alternate'
  },
  {
    name: "All Fourths (E-A-D-G-C-F)",
    strings: ["E2", "A2", "D3", "G3", "C4", "F4"],
    description: "All strings tuned in perfect fourths. Symmetrical fingerings",
    category: 'alternate'
  },
  {
    name: "Nashville Tuning",
    strings: ["E3", "A3", "D4", "G3", "B3", "E4"],
    description: "High strung tuning. Octave up on bass strings",
    category: 'alternate'
  },

  // ===== BARITONE =====
  {
    name: "Baritone (B Standard)",
    strings: ["B1", "E2", "A2", "D3", "F#3", "B3"],
    description: "Baritone guitar tuning - perfect fourth below standard",
    category: 'alternate'
  },

  // ===== 7-STRING (as 6-string for compatibility) =====
  {
    name: "7-String (B-E-A-D-G-B-E)",
    strings: ["B1", "E2", "A2", "D3", "G3", "B3"],
    description: "7-string tuning (showing lowest 6 strings)",
    category: 'alternate'
  }
];

/**
 * Get MIDI note array for a tuning
 */
export function getTuningMIDINotes(tuning: GuitarTuning): number[] {
  return tuning.strings.map(noteToMIDI);
}

/**
 * Get tuning by name
 */
export function getTuningByName(name: string): GuitarTuning | undefined {
  return GUITAR_TUNINGS.find(t => t.name === name);
}

/**
 * Get all tunings in a category
 */
export function getTuningsByCategory(category: GuitarTuning['category']): GuitarTuning[] {
  return GUITAR_TUNINGS.filter(t => t.category === category);
}
