/**
 * APC40 Device Constants and Configuration
 * 
 * Contains APC40-specific device identification, MIDI values,
 * SysEx messages, and timing constants.
 */

// APC40 Device Identification
export const APC40_DEVICE_INFO = {
  VENDOR_ID: 0x09e8, // Akai Professional
  PRODUCT_IDS: {
    APC40_MK1: 0x0029,
    APC40_MK2: 0x0039,
  },
  DEVICE_NAMES: [
    'APC40',
    'APC40 mkII',
    'Akai APC40',
    'Akai APC40 mkII',
  ],
} as const;

// APC40 Mode Control (Ableton Live Mode for LED functionality)
export const APC40_MODE_SWITCH = {
  // Proven Ableton Live Mode SysEx for APC40 LED control
  ABLETON_LIVE_MODE: [0xF0, 0x47, 0x7F, 0x29, 0x60, 0x00, 0x04, 0x41, 0x09, 0x07, 0x01, 0xF7],
} as const;

/**
 * Creates APC40 Ableton Live Mode switch message
 * This mode enables LED control via MIDI Note On messages
 */
export function createModeSwitch(): number[] {
  return [...APC40_MODE_SWITCH.ABLETON_LIVE_MODE];
}

/**
 * Creates a MIDI Note On message for LED control
 * Uses proven [0x90, note, color] format instead of SysEx
 */
export function createLedControl(note: number, color: number, channel: number = 0): number[] {
  return [MIDI_MESSAGE_TYPES.NOTE_ON | channel, note, color];
}

// Connection and Timing Constants
export const APC40_TIMING = {
  CONNECTION_TIMEOUT: 5000,     // 5 seconds
  INITIALIZATION_DELAY: 100,    // 100ms after connection
  LED_UPDATE_THROTTLE: 16,      // ~60fps LED updates
  HEARTBEAT_INTERVAL: 10000,    // 10 seconds
  RECONNECT_DELAY: 2000,        // 2 seconds
  MAX_RECONNECT_ATTEMPTS: 3,
} as const;

// MIDI Message Types
export const MIDI_MESSAGE_TYPES = {
  NOTE_ON: 0x90,
  NOTE_OFF: 0x80,
  CONTROL_CHANGE: 0xB0,
  SYSEX: 0xF0,
} as const;

// APC40 Control Change (CC) Numbers for additional controls
export const APC40_CC = {
  // Track Control Knobs (CC 48-55)
  TRACK_KNOB_1: 48,
  TRACK_KNOB_2: 49,
  TRACK_KNOB_3: 50,
  TRACK_KNOB_4: 51,
  TRACK_KNOB_5: 52,
  TRACK_KNOB_6: 53,
  TRACK_KNOB_7: 54,
  TRACK_KNOB_8: 55,
  
  // Device Control Knobs (CC 16-23)
  DEVICE_KNOB_1: 16,
  DEVICE_KNOB_2: 17,
  DEVICE_KNOB_3: 18,
  DEVICE_KNOB_4: 19,
  DEVICE_KNOB_5: 20,
  DEVICE_KNOB_6: 21,
  DEVICE_KNOB_7: 22,
  DEVICE_KNOB_8: 23,
  
  // Track Selection Buttons (CC 51-58)
  TRACK_SELECT_1: 51,
  TRACK_SELECT_2: 52,
  TRACK_SELECT_3: 53,
  TRACK_SELECT_4: 54,
  TRACK_SELECT_5: 55,
  TRACK_SELECT_6: 56,
  TRACK_SELECT_7: 57,
  TRACK_SELECT_8: 58,
} as const;

// Connection Health Monitoring
export const CONNECTION_HEALTH = {
  HEALTHY: 100,
  GOOD: 75,
  WARNING: 50,
  POOR: 25,
  CRITICAL: 0,
} as const;

// Error Codes for APC40-specific issues
export const APC40_ERROR_CODES = {
  DEVICE_NOT_FOUND: 'APC40_DEVICE_NOT_FOUND',
  CONNECTION_FAILED: 'APC40_CONNECTION_FAILED',
  INITIALIZATION_FAILED: 'APC40_INITIALIZATION_FAILED',
  SYSEX_FAILED: 'APC40_SYSEX_FAILED',
  LED_UPDATE_FAILED: 'APC40_LED_UPDATE_FAILED',
  HEARTBEAT_TIMEOUT: 'APC40_HEARTBEAT_TIMEOUT',
} as const;

/**
 * Checks if a device name matches APC40 patterns
 */
export function isAPC40Device(deviceName: string): boolean {
  return APC40_DEVICE_INFO.DEVICE_NAMES.some(name => 
    deviceName.toLowerCase().includes(name.toLowerCase())
  );
}

/**
 * Validates if a MIDI note is within the APC40 clip grid range (0-39)
 */
export function isValidGridNote(note: number): boolean {
  return note >= 0 && note <= 39;
}

/**
 * Calculates connection health score based on response time and error count
 */
export function calculateConnectionHealth(
  responseTimeMs: number, 
  errorCount: number
): number {
  let health = CONNECTION_HEALTH.HEALTHY;
  
  // Deduct points for slow response times
  if (responseTimeMs > 100) health -= 20;
  if (responseTimeMs > 500) health -= 30;
  if (responseTimeMs > 1000) health -= 40;
  
  // Deduct points for errors
  health -= (errorCount * 10);
  
  return Math.max(CONNECTION_HEALTH.CRITICAL, health);
}