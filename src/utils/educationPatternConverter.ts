/**
 * Converts IsometricSequencer's internal pattern format (boolean[][])
 * to EducationConfig format (Record<string, boolean[]>).
 *
 * @param pattern - 12-lane × 16-step boolean matrix (C to B chromatic)
 * @param visibleLanes - Note names to include in output (defaults to C major scale)
 * @returns Pattern object with note names as keys
 *
 * @example
 * const isometricPattern = generateAscending(); // boolean[][]
 * const educationPattern = convertToEducationPattern(isometricPattern);
 * // Returns: { C: [...], D: [...], E: [...], F: [...], G: [...], A: [...], B: [...] }
 */
export function convertToEducationPattern(
  pattern: boolean[][],
  visibleLanes: string[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
): Record<string, boolean[]> {
  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const result: Record<string, boolean[]> = {};

  for (let laneIndex = 0; laneIndex < pattern.length; laneIndex++) {
    const noteName = NOTE_NAMES[laneIndex];
    if (visibleLanes.includes(noteName)) {
      result[noteName] = pattern[laneIndex];
    }
  }

  return result;
}
