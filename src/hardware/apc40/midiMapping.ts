/**
 * APC40 MIDI Mapping Implementation
 * 
 * Maps APC40 8x5 button grid to 16-step drum sequencer patterns.
 * Uses 2 columns (8x2=16 buttons) of the APC40 grid for step control.
 */

// APC40 Hardware Specifications
export const APC40_SPECS = {
  GRID_WIDTH: 8,
  GRID_HEIGHT: 5,
  TOTAL_GRID_BUTTONS: 40,
  SEQUENCER_STEPS: 16,
  SEQUENCER_TRACKS: 8,
} as const;

// APC40 MIDI Note Numbers (Clip Grid Layout for LED Control)
// APC40 clip grid uses notes 0-39 for LED control (proven working range)
// Layout: Bottom row = 0-7, Next row = 8-15, etc.
export const APC40_GRID_NOTES = {
  // Row 0 (bottom row) - Notes 0-7
  ROW_0: [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07],
  // Row 1 - Notes 8-15
  ROW_1: [0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F],
  // Row 2 - Notes 16-23
  ROW_2: [0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17],
  // Row 3 - Notes 24-31
  ROW_3: [0x18, 0x19, 0x1A, 0x1B, 0x1C, 0x1D, 0x1E, 0x1F],
  // Row 4 (top row) - Notes 32-39
  ROW_4: [0x20, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27],
} as const;

// Sequencer Grid Mapping Strategy
// Map 16-step sequencer to APC40 using 2 columns (8x2=16)
// Column 0 = Steps 1-8, Column 1 = Steps 9-16
export interface GridMapping {
  stepToNote: Map<number, number>;
  noteToStep: Map<number, number>;
  trackToRow: Map<number, number>;
  rowToTrack: Map<number, number>;
}

/**
 * Creates the mapping between sequencer steps and APC40 MIDI notes
 */
export function createGridMapping(): GridMapping {
  const stepToNote = new Map<number, number>();
  const noteToStep = new Map<number, number>();
  const trackToRow = new Map<number, number>();
  const rowToTrack = new Map<number, number>();

  // Map 8 tracks to 8 rows (each row represents a drum track)
  for (let track = 0; track < APC40_SPECS.SEQUENCER_TRACKS; track++) {
    // APC40 grid is bottom-to-top, but our tracks are top-to-bottom
    // So we invert: Track 0 maps to Row 4, Track 7 maps to Row 0
    const row = (APC40_SPECS.SEQUENCER_TRACKS - 1) - track;
    trackToRow.set(track, row);
    rowToTrack.set(row, track);
  }

  // Map 16 sequencer steps to first 16 APC40 grid notes (0-15)
  // This ensures no collisions and uses the correct note range (0-39)
  for (let step = 0; step < APC40_SPECS.SEQUENCER_STEPS; step++) {
    const midiNote = step; // Simple sequential mapping: step 0→note 0, step 1→note 1, etc.
    stepToNote.set(step, midiNote);
    noteToStep.set(midiNote, step);
  }

  return {
    stepToNote,
    noteToStep,
    trackToRow,
    rowToTrack,
  };
}


// Velocity Mapping for Step Intensity
export const VELOCITY_MAPPING = {
  OFF: 0,
  LOW: 32,
  MEDIUM: 64,
  HIGH: 96,
  MAX: 127,
} as const;

/**
 * Maps MIDI velocity (0-127) to step intensity level
 */
export function velocityToIntensity(velocity: number): number {
  if (velocity <= 0) return 0; // Off (includes negative values)
  if (velocity <= 32) return 1; // Low
  if (velocity <= 64) return 2; // Medium
  if (velocity <= 96) return 3; // High
  return 4; // Max
}

/**
 * Maps step intensity level to MIDI velocity
 */
export function intensityToVelocity(intensity: number): number {
  switch (intensity) {
    case 0: return VELOCITY_MAPPING.OFF;
    case 1: return VELOCITY_MAPPING.LOW;
    case 2: return VELOCITY_MAPPING.MEDIUM;
    case 3: return VELOCITY_MAPPING.HIGH;
    case 4: return VELOCITY_MAPPING.MAX;
    default: return VELOCITY_MAPPING.MEDIUM;
  }
}

// APC40 Transport and Utility Controls
export const APC40_TRANSPORT = {
  PLAY: 91,
  STOP: 92,
  REC: 93,
  SHIFT: 98,
  NUDGE_PLUS: 100,
  NUDGE_MINUS: 101,
} as const;

// APC40 LED Color Values (for SysEx LED control)
export const APC40_LED_COLORS = {
  OFF: 0,
  GREEN: 1,
  GREEN_BLINK: 2,
  RED: 3,
  RED_BLINK: 4,
  AMBER: 5,
  AMBER_BLINK: 6,
} as const;

/**
 * Maps sequencer step state to APC40 LED color
 */
export function stepStateToLedColor(isActive: boolean, isCurrentStep: boolean): number {
  if (isCurrentStep) {
    return isActive ? APC40_LED_COLORS.RED : APC40_LED_COLORS.RED_BLINK;
  }
  return isActive ? APC40_LED_COLORS.GREEN : APC40_LED_COLORS.OFF;
}

// Default grid mapping instance
export const defaultGridMapping = createGridMapping();