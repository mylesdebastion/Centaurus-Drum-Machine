/**
 * Pattern generators for IsometricSequencer
 * Used by both standalone IsometricSequencer and Education Mode
 */

/**
 * Generate a Twinkle Twinkle Little Star pattern
 * @param scale - Array of note indices in the current scale (e.g., [0, 2, 4, 5, 7, 9, 11] for C major)
 * @returns 12-lane × 16-step boolean matrix
 */
export function generateTwinkle(scale: number[]): boolean[][] {
  // Clear current pattern
  const newPattern: boolean[][] = Array(12).fill(null).map(() => Array(16).fill(false));

  // Twinkle Twinkle Little Star melody in scale degrees (1-indexed)
  // "Twinkle twinkle little star, how I wonder what you are"
  // C C G G A A G - F F E E D D C
  // Scale degrees: 1 1 5 5 6 6 5 - 4 4 3 3 2 2 1
  const scaleDegrees = [
    1, 1, 5, 5, 6, 6, 5, 0, // Twinkle twinkle little star (0 = rest)
    4, 4, 3, 3, 2, 2, 1, 0  // How I wonder what you are
  ];

  // Map scale degrees to actual notes in current scale
  scaleDegrees.forEach((degree, step) => {
    if (degree > 0 && degree <= scale.length) {
      const noteIndex = scale[degree - 1]; // Convert 1-indexed to 0-indexed
      newPattern[noteIndex][step] = true;
    }
  });

  return newPattern;
}

/**
 * Generate ascending scale pattern (C to B, left to right)
 * Warm-up exercise for students to hit boomwhackers in order
 * @param scale - Array of note indices in the current scale
 * @returns 12-lane × 16-step boolean matrix
 */
export function generateAscending(scale: number[]): boolean[][] {
  const newPattern: boolean[][] = Array(12).fill(null).map(() => Array(16).fill(false));

  // Play scale with 1 rest between each note (beginner warm-up)
  // For C major: C (rest) D (rest) E (rest) F (rest) G (rest) A (rest) B (rest)
  // 7 notes + 7 rests = 14 steps, fits perfectly in 16 steps
  let currentStep = 0;
  for (let i = 0; i < scale.length && currentStep < 16; i++) {
    const noteIndex = scale[i];
    newPattern[noteIndex][currentStep] = true;
    currentStep += 2; // Skip 1 step for rest
  }

  return newPattern;
}

/**
 * Generate up/down scale pattern (C to B and back)
 * Warm-up exercise: ascending then descending
 * @param scale - Array of note indices in the current scale
 * @returns 12-lane × 16-step boolean matrix
 */
export function generateUpDown(scale: number[]): boolean[][] {
  const newPattern: boolean[][] = Array(12).fill(null).map(() => Array(16).fill(false));

  const scaleLength = scale.length;
  let currentStep = 0;

  // Ascending: play full scale (C D E F G A B)
  for (let i = 0; i < scaleLength && currentStep < 16; i++) {
    const noteIndex = scale[i];
    newPattern[noteIndex][currentStep] = true;
    currentStep++;
  }

  // Descending: start from second-to-last note to avoid double top note
  // Play B A G F E D C (reverse, excluding the top note we just played)
  for (let i = scaleLength - 2; i >= 0 && currentStep < 16; i--) {
    const noteIndex = scale[i];
    newPattern[noteIndex][currentStep] = true;
    currentStep++;
  }

  return newPattern;
}

/**
 * Get C major scale (for workshop mode default)
 * @returns Array of note indices for C major scale [C, D, E, F, G, A, B]
 */
export function getCMajorScale(): number[] {
  // C major scale indices in chromatic scale
  return [0, 2, 4, 5, 7, 9, 11]; // C, D, E, F, G, A, B
}
