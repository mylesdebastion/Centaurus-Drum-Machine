/**
 * Launchpad Pro MIDI Protocol Constants
 *
 * Defines SysEx headers, note mappings, and color palette for Launchpad Pro Mk3 and 2015 models.
 * Reference: research/launchpad-pro-integration-findings.md
 */

/**
 * Novation Manufacturer ID (3 bytes)
 */
export const MANUFACTURER_ID = [0x00, 0x20, 0x29] as const;

/**
 * Device IDs for Launchpad Pro models
 */
export const DEVICE_IDS = {
  MK3: [0x02, 0x0E] as const,
  LEGACY_2015: [0x02, 0x10] as const,
} as const;

/**
 * SysEx command IDs
 */
export const SYSEX_COMMANDS = {
  /** Enter Programmer Mode */
  PROGRAMMER_MODE: 0x0E,
  /** RGB LED control */
  RGB_LED: 0x0B,
} as const;

/**
 * Grid note range (8×8 grid)
 * Bottom-left pad (Row 1, Col 1): Note 0
 * Top-right pad (Row 8, Col 8): Note 119
 */
export const GRID_NOTES = {
  MIN: 0,
  MAX: 119,
  TOTAL_PADS: 64,
} as const;

/**
 * Control button note mappings
 * Top row (round buttons): 91-98
 * Right column (scene launch): 89, 79, 69, 59, 49, 39, 29, 19
 * Left column: 80, 70, 60, 50, 40, 30, 20, 10
 */
export const CONTROL_BUTTONS = {
  /** Top row round buttons */
  TOP_ROW: [91, 92, 93, 94, 95, 96, 97, 98] as const,
  /** Right column scene launch buttons */
  RIGHT_COLUMN: [89, 79, 69, 59, 49, 39, 29, 19] as const,
  /** Left column buttons */
  LEFT_COLUMN: [80, 70, 60, 50, 40, 30, 20, 10] as const,
} as const;

/**
 * Color palette constants (velocity values 0-127)
 * Using predefined palette for fast updates via Note On messages
 */
export const COLOR_PALETTE = {
  OFF: 0,
  RED_LOW: 5,
  RED_FULL: 72,
  ORANGE: 9,
  YELLOW: 13,
  GREEN_LOW: 21,
  GREEN_FULL: 87,
  BLUE_LOW: 37,
  BLUE_FULL: 79,
  WHITE: 3,
} as const;

/**
 * RGB color value range (0-63 per channel)
 * NOT 0-255! Launchpad Pro uses 6-bit RGB.
 */
export const RGB_RANGE = {
  MIN: 0,
  MAX: 63,
} as const;

/**
 * Timing constants
 */
export const TIMING = {
  /** Initialization delay after sending SysEx (ms) */
  INIT_DELAY: 100,
  /** LED update queue flush interval (ms) */
  LED_FLUSH_INTERVAL: 5,
  /** Maximum LEDs per SysEx batch message */
  MAX_BATCH_SIZE: 16,
} as const;

/**
 * MIDI message type constants
 */
export const MIDI_MESSAGE_TYPES = {
  NOTE_ON: 0x90,
  NOTE_OFF: 0x80,
  POLY_AFTERTOUCH: 0xA0,
  SYSEX_START: 0xF0,
  SYSEX_END: 0xF7,
} as const;

/**
 * Device name patterns for auto-detection
 */
export const DEVICE_NAME_PATTERNS = {
  MK3: ['Launchpad Pro MK3', 'LPProMK3'],
  LEGACY_2015: ['Launchpad Pro', 'Launchpad Pro Standalone Port'],
} as const;

/**
 * Check if MIDI device name matches Launchpad Pro Mk3
 */
export const isMk3Device = (deviceName: string): boolean => {
  return DEVICE_NAME_PATTERNS.MK3.some(pattern =>
    deviceName.includes(pattern)
  );
};

/**
 * Check if MIDI device name matches Launchpad Pro 2015
 */
export const is2015Device = (deviceName: string): boolean => {
  // Must match 2015 pattern but NOT Mk3 pattern
  const matches2015 = DEVICE_NAME_PATTERNS.LEGACY_2015.some(pattern =>
    deviceName.includes(pattern)
  );
  const matchesMk3 = isMk3Device(deviceName);
  return matches2015 && !matchesMk3;
};

/**
 * Check if note is within valid grid range
 */
export const isValidGridNote = (note: number): boolean => {
  return note >= GRID_NOTES.MIN && note <= GRID_NOTES.MAX;
};

/**
 * Check if note is a control button
 */
export const isControlButton = (note: number): boolean => {
  return (
    CONTROL_BUTTONS.TOP_ROW.includes(note as any) ||
    CONTROL_BUTTONS.RIGHT_COLUMN.includes(note as any) ||
    CONTROL_BUTTONS.LEFT_COLUMN.includes(note as any)
  );
};
