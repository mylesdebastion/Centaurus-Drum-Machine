/**
 * Layout Mapping Utilities for Launchpad Pro Grid
 *
 * Provides bidirectional coordinate conversion between:
 * - Sequencer step coordinates (track, step)
 * - MIDI note numbers (0-119 for 8×8 grid)
 *
 * Supports two layout orientations:
 * - **Horizontal**: Columns = steps (timeline), Rows = tracks (frequency)
 * - **Vertical**: Columns = time steps, Rows = pitches
 *
 * Reference: Story 8.2, AC 4-5
 */

/**
 * Step coordinates (sequencer space)
 */
export interface StepCoordinates {
  track: number; // Track index (0-7)
  step: number;  // Step index (0-7)
}

/**
 * Converts step coordinates to MIDI note (horizontal layout)
 *
 * Horizontal Layout (Drum Sequencer):
 * - Columns = steps (0-7, left-to-right timeline)
 * - Rows = tracks (0-7, bottom-to-top frequency)
 *
 * Grid Layout Visualization:
 * ```
 * Row 7 (Track 7 - Hat):    0   1   2   3   4   5   6   7
 * Row 6 (Track 6):         16  17  18  19  20  21  22  23
 * Row 5 (Track 5):         32  33  34  35  36  37  38  39
 * Row 4 (Track 4):         48  49  50  51  52  53  54  55
 * Row 3 (Track 3):         64  65  66  67  68  69  70  71
 * Row 2 (Track 2):         80  81  82  83  84  85  86  87
 * Row 1 (Track 1):         96  97  98  99 100 101 102 103
 * Row 0 (Track 0 - Kick): 112 113 114 115 116 117 118 119
 * ```
 *
 * @param trackIndex Track number (0-7, bottom = kick, top = hi-hat)
 * @param stepIndex Step number (0-7, left-to-right timeline)
 * @returns MIDI note number (0-119)
 *
 * @example
 * stepToNote_Horizontal(0, 0) // 112 (Kick, Step 0)
 * stepToNote_Horizontal(7, 7) // 7 (Hat, Step 7)
 */
export function stepToNote_Horizontal(trackIndex: number, stepIndex: number): number {
  if (trackIndex < 0 || trackIndex > 7 || stepIndex < 0 || stepIndex > 7) {
    throw new Error(`Invalid coordinates: track=${trackIndex}, step=${stepIndex} (valid range: 0-7)`);
  }

  // Formula: note = (7 - trackIndex) * 16 + stepIndex
  // Track 0 (Kick) = row 7 (notes 112-119)
  // Track 7 (Hat) = row 0 (notes 0-7)
  return (7 - trackIndex) * 16 + stepIndex;
}

/**
 * Converts MIDI note to step coordinates (horizontal layout)
 *
 * Reverse mapping of stepToNote_Horizontal.
 *
 * @param note MIDI note number (0-119)
 * @returns Step coordinates {track, step}
 *
 * @example
 * noteToStep_Horizontal(112) // {track: 0, step: 0} (Kick, Step 0)
 * noteToStep_Horizontal(7) // {track: 7, step: 7} (Hat, Step 7)
 */
export function noteToStep_Horizontal(note: number): StepCoordinates {
  if (note < 0 || note > 119 || note % 16 > 7) {
    throw new Error(`Invalid note for horizontal grid: ${note} (valid: 0-7, 16-23, ..., 112-119)`);
  }

  const row = Math.floor(note / 16); // Row 0-7
  const col = note % 16; // Column 0-7

  const trackIndex = 7 - row; // Invert row to track (row 7 = track 0)
  const stepIndex = col;

  return { track: trackIndex, step: stepIndex };
}

/**
 * Converts step coordinates to MIDI note (vertical layout)
 *
 * Vertical Layout (Isometric Notes):
 * - Columns = time steps (0-7, left-to-right)
 * - Rows = pitches (0-7, bottom-to-top)
 *
 * Grid Layout Visualization:
 * ```
 * Row 7 (Pitch 7):   112 113 114 115 116 117 118 119
 * Row 6 (Pitch 6):    96  97  98  99 100 101 102 103
 * Row 5 (Pitch 5):    80  81  82  83  84  85  86  87
 * Row 4 (Pitch 4):    64  65  66  67  68  69  70  71
 * Row 3 (Pitch 3):    48  49  50  51  52  53  54  55
 * Row 2 (Pitch 2):    32  33  34  35  36  37  38  39
 * Row 1 (Pitch 1):    16  17  18  19  20  21  22  23
 * Row 0 (Pitch 0):     0   1   2   3   4   5   6   7
 * ```
 *
 * @param pitchIndex Pitch number (0-7, bottom-to-top)
 * @param timeIndex Time step number (0-7, left-to-right)
 * @returns MIDI note number (0-119)
 *
 * @example
 * stepToNote_Vertical(0, 0) // 0 (Pitch 0, Time 0)
 * stepToNote_Vertical(7, 7) // 119 (Pitch 7, Time 7)
 */
export function stepToNote_Vertical(pitchIndex: number, timeIndex: number): number {
  if (pitchIndex < 0 || pitchIndex > 7 || timeIndex < 0 || timeIndex > 7) {
    throw new Error(`Invalid coordinates: pitch=${pitchIndex}, time=${timeIndex} (valid range: 0-7)`);
  }

  // Formula: note = pitchIndex * 16 + timeIndex
  // Pitch 0 = row 0 (notes 0-7)
  // Pitch 7 = row 7 (notes 112-119)
  return pitchIndex * 16 + timeIndex;
}

/**
 * Converts MIDI note to step coordinates (vertical layout)
 *
 * Reverse mapping of stepToNote_Vertical.
 *
 * @param note MIDI note number (0-119)
 * @returns Step coordinates {track: pitchIndex, step: timeIndex}
 *
 * @example
 * noteToStep_Vertical(0) // {track: 0, step: 0} (Pitch 0, Time 0)
 * noteToStep_Vertical(119) // {track: 7, step: 7} (Pitch 7, Time 7)
 */
export function noteToStep_Vertical(note: number): StepCoordinates {
  if (note < 0 || note > 119 || note % 16 > 7) {
    throw new Error(`Invalid note for vertical grid: ${note} (valid: 0-7, 16-23, ..., 112-119)`);
  }

  const pitchIndex = Math.floor(note / 16); // Row 0-7 = pitch 0-7
  const timeIndex = note % 16; // Column 0-7

  return { track: pitchIndex, step: timeIndex };
}

/**
 * Validate if a MIDI note is within valid 8×8 grid range
 *
 * Valid notes: 0-7, 16-23, 32-39, 48-55, 64-71, 80-87, 96-103, 112-119
 * Invalid notes: 8-15, 24-31, 40-47, 56-63, 72-79, 88-95, 104-111, 120-127
 *
 * @param note MIDI note number
 * @returns true if note is valid grid position
 */
export function isValidGridNote(note: number): boolean {
  return note >= 0 && note <= 119 && note % 16 <= 7;
}
