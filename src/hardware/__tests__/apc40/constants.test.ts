/**
 * APC40 Constants Tests
 * 
 * Tests APC40 device identification, SysEx message creation,
 * timing constants, and utility functions.
 */

import { describe, it, expect } from 'vitest';
import {
  APC40_DEVICE_INFO,
  APC40_SYSEX,
  APC40_TIMING,
  APC40_CC,
  APC40_ERROR_CODES,
  CONNECTION_HEALTH,
  MIDI_MESSAGE_TYPES,
  createModeSwitch,
  createLedControl,
  isAPC40Device,
  isValidGridNote,
  calculateConnectionHealth,
} from '../../apc40/constants';
import { APC40_GRID_NOTES } from '../../apc40/midiMapping';

describe('APC40 Constants', () => {
  describe('Device Information', () => {
    it('should have correct device identification constants', () => {
      expect(APC40_DEVICE_INFO.VENDOR_ID).toBe(0x09e8); // Akai Professional
      expect(APC40_DEVICE_INFO.PRODUCT_IDS.APC40_MK1).toBe(0x0029);
      expect(APC40_DEVICE_INFO.PRODUCT_IDS.APC40_MK2).toBe(0x0039);
    });

    it('should have comprehensive device name patterns', () => {
      const deviceNames = APC40_DEVICE_INFO.DEVICE_NAMES;
      expect(deviceNames).toContain('APC40');
      expect(deviceNames).toContain('APC40 mkII');
      expect(deviceNames).toContain('Akai APC40');
      expect(deviceNames).toContain('Akai APC40 mkII');
      expect(deviceNames).toHaveLength(4);
    });
  });

  describe('Mode Switch Messages', () => {
    it('should have correct Ableton Live Mode SysEx', () => {
      const modeSwitch = createModeSwitch();
      expect(modeSwitch).toEqual([0xF0, 0x47, 0x7F, 0x29, 0x60, 0x00, 0x04, 0x41, 0x09, 0x07, 0x01, 0xF7]);
    });
  });

  describe('MIDI Message Creation', () => {
    describe('createLedControl', () => {
      it('should create correct MIDI Note On message for LED control', () => {
        const note = 0;
        const color = 1;
        const message = createLedControl(note, color);
        const expected = [0x90, 0, 1]; // MIDI Note On, note 0, velocity/color 1
        expect(message).toEqual(expected);
      });

      it('should handle all valid note and color combinations', () => {
        const testCases = [
          { note: 0, color: 0 },  // First grid button, off
          { note: 39, color: 6 },  // Last grid button, amber blink
          { note: 20, color: 3 },  // Middle button, red
        ];

        testCases.forEach(({ note, color }) => {
          const message = createLedControl(note, color);
          expect(message[0]).toBe(0x90); // MIDI Note On
          expect(message[1]).toBe(note);  // Note number
          expect(message[2]).toBe(color); // Velocity/color
        });
      });

      it('should create valid MIDI message structure', () => {
        const message = createLedControl(20, 3);
        expect(message[0]).toBe(0x90); // MIDI Note On
        expect(message).toHaveLength(3); // Standard MIDI message length
      });

      it('should handle channel parameter', () => {
        const message = createLedControl(0, 1, 5); // Channel 5
        const expected = [0x95, 0, 1]; // MIDI Note On channel 5, note 0, velocity 1
        expect(message).toEqual(expected);
      });
    });
  });

  describe('Timing Constants', () => {
    it('should have reasonable timing values', () => {
      expect(APC40_TIMING.CONNECTION_TIMEOUT).toBe(5000);
      expect(APC40_TIMING.INITIALIZATION_DELAY).toBe(100);
      expect(APC40_TIMING.LED_UPDATE_THROTTLE).toBe(16);
      expect(APC40_TIMING.HEARTBEAT_INTERVAL).toBe(10000);
      expect(APC40_TIMING.RECONNECT_DELAY).toBe(2000);
      expect(APC40_TIMING.MAX_RECONNECT_ATTEMPTS).toBe(3);
    });

    it('should have timing values that make sense relative to each other', () => {
      // Initialization delay should be much less than connection timeout
      expect(APC40_TIMING.INITIALIZATION_DELAY).toBeLessThan(APC40_TIMING.CONNECTION_TIMEOUT);
      
      // LED throttle should allow for smooth 60fps updates
      expect(APC40_TIMING.LED_UPDATE_THROTTLE).toBeLessThanOrEqual(16);
      
      // Reconnect delay should be less than heartbeat interval
      expect(APC40_TIMING.RECONNECT_DELAY).toBeLessThan(APC40_TIMING.HEARTBEAT_INTERVAL);
    });
  });

  describe('MIDI Message Types', () => {
    it('should have correct MIDI message type constants', () => {
      expect(MIDI_MESSAGE_TYPES.NOTE_ON).toBe(0x90);
      expect(MIDI_MESSAGE_TYPES.NOTE_OFF).toBe(0x80);
      expect(MIDI_MESSAGE_TYPES.CONTROL_CHANGE).toBe(0xB0);
      expect(MIDI_MESSAGE_TYPES.SYSEX).toBe(0xF0);
    });
  });

  describe('Control Change Numbers', () => {
    it('should have correct track control knob CC numbers', () => {
      expect(APC40_CC.TRACK_KNOB_1).toBe(48);
      expect(APC40_CC.TRACK_KNOB_2).toBe(49);
      expect(APC40_CC.TRACK_KNOB_3).toBe(50);
      expect(APC40_CC.TRACK_KNOB_4).toBe(51);
      expect(APC40_CC.TRACK_KNOB_5).toBe(52);
      expect(APC40_CC.TRACK_KNOB_6).toBe(53);
      expect(APC40_CC.TRACK_KNOB_7).toBe(54);
      expect(APC40_CC.TRACK_KNOB_8).toBe(55);
    });

    it('should have correct device control knob CC numbers', () => {
      expect(APC40_CC.DEVICE_KNOB_1).toBe(16);
      expect(APC40_CC.DEVICE_KNOB_2).toBe(17);
      expect(APC40_CC.DEVICE_KNOB_3).toBe(18);
      expect(APC40_CC.DEVICE_KNOB_4).toBe(19);
      expect(APC40_CC.DEVICE_KNOB_5).toBe(20);
      expect(APC40_CC.DEVICE_KNOB_6).toBe(21);
      expect(APC40_CC.DEVICE_KNOB_7).toBe(22);
      expect(APC40_CC.DEVICE_KNOB_8).toBe(23);
    });

    it('should have sequential CC number ranges', () => {
      // Track knobs should be sequential
      const trackKnobs = [
        APC40_CC.TRACK_KNOB_1, APC40_CC.TRACK_KNOB_2, APC40_CC.TRACK_KNOB_3, APC40_CC.TRACK_KNOB_4,
        APC40_CC.TRACK_KNOB_5, APC40_CC.TRACK_KNOB_6, APC40_CC.TRACK_KNOB_7, APC40_CC.TRACK_KNOB_8
      ];
      for (let i = 1; i < trackKnobs.length; i++) {
        expect(trackKnobs[i]).toBe(trackKnobs[i - 1] + 1);
      }

      // Device knobs should be sequential
      const deviceKnobs = [
        APC40_CC.DEVICE_KNOB_1, APC40_CC.DEVICE_KNOB_2, APC40_CC.DEVICE_KNOB_3, APC40_CC.DEVICE_KNOB_4,
        APC40_CC.DEVICE_KNOB_5, APC40_CC.DEVICE_KNOB_6, APC40_CC.DEVICE_KNOB_7, APC40_CC.DEVICE_KNOB_8
      ];
      for (let i = 1; i < deviceKnobs.length; i++) {
        expect(deviceKnobs[i]).toBe(deviceKnobs[i - 1] + 1);
      }
    });
  });

  describe('Connection Health', () => {
    it('should have correct connection health constants', () => {
      expect(CONNECTION_HEALTH.HEALTHY).toBe(100);
      expect(CONNECTION_HEALTH.GOOD).toBe(75);
      expect(CONNECTION_HEALTH.WARNING).toBe(50);
      expect(CONNECTION_HEALTH.POOR).toBe(25);
      expect(CONNECTION_HEALTH.CRITICAL).toBe(0);
    });

    it('should have descending health values', () => {
      expect(CONNECTION_HEALTH.HEALTHY).toBeGreaterThan(CONNECTION_HEALTH.GOOD);
      expect(CONNECTION_HEALTH.GOOD).toBeGreaterThan(CONNECTION_HEALTH.WARNING);
      expect(CONNECTION_HEALTH.WARNING).toBeGreaterThan(CONNECTION_HEALTH.POOR);
      expect(CONNECTION_HEALTH.POOR).toBeGreaterThan(CONNECTION_HEALTH.CRITICAL);
    });
  });

  describe('Error Codes', () => {
    it('should have descriptive error codes', () => {
      expect(APC40_ERROR_CODES.DEVICE_NOT_FOUND).toBe('APC40_DEVICE_NOT_FOUND');
      expect(APC40_ERROR_CODES.CONNECTION_FAILED).toBe('APC40_CONNECTION_FAILED');
      expect(APC40_ERROR_CODES.INITIALIZATION_FAILED).toBe('APC40_INITIALIZATION_FAILED');
      expect(APC40_ERROR_CODES.SYSEX_FAILED).toBe('APC40_SYSEX_FAILED');
      expect(APC40_ERROR_CODES.LED_UPDATE_FAILED).toBe('APC40_LED_UPDATE_FAILED');
      expect(APC40_ERROR_CODES.HEARTBEAT_TIMEOUT).toBe('APC40_HEARTBEAT_TIMEOUT');
    });

    it('should have consistent error code naming', () => {
      const errorCodes = Object.values(APC40_ERROR_CODES);
      errorCodes.forEach(code => {
        expect(code).toMatch(/^APC40_[A-Z_]+$/);
      });
    });
  });

  describe('Utility Functions', () => {
    describe('isAPC40Device', () => {
      it('should identify APC40 device names correctly', () => {
        expect(isAPC40Device('APC40')).toBe(true);
        expect(isAPC40Device('APC40 mkII')).toBe(true);
        expect(isAPC40Device('Akai APC40')).toBe(true);
        expect(isAPC40Device('Akai APC40 mkII')).toBe(true);
      });

      it('should handle case insensitive matching', () => {
        expect(isAPC40Device('apc40')).toBe(true);
        expect(isAPC40Device('APC40 MKII')).toBe(true);
        expect(isAPC40Device('akai apc40')).toBe(true);
      });

      it('should reject non-APC40 device names', () => {
        expect(isAPC40Device('APC mini')).toBe(false);
        expect(isAPC40Device('MPK49')).toBe(false);
        expect(isAPC40Device('Launchpad')).toBe(false);
        expect(isAPC40Device('')).toBe(false);
        expect(isAPC40Device('PC40')).toBe(false);
      });

      it('should handle partial matches in device names', () => {
        expect(isAPC40Device('USB APC40 mkII Audio Device')).toBe(true);
        expect(isAPC40Device('Akai Professional APC40')).toBe(true);
      });
    });

    describe('isValidGridNote', () => {
      it('should validate grid note range correctly', () => {
        expect(isValidGridNote(0)).toBe(true);  // First grid note
        expect(isValidGridNote(39)).toBe(true);  // Last grid note
        expect(isValidGridNote(20)).toBe(true);  // Middle grid note
      });

      it('should reject notes outside grid range', () => {
        expect(isValidGridNote(-1)).toBe(false); // Below range
        expect(isValidGridNote(40)).toBe(false); // Above range
        expect(isValidGridNote(50)).toBe(false);  // Way above
        expect(isValidGridNote(127)).toBe(false); // Way above
      });

      it('should handle edge cases', () => {
        expect(isValidGridNote(-1)).toBe(false);
        expect(isValidGridNote(NaN)).toBe(false);
        expect(isValidGridNote(Infinity)).toBe(false);
      });
    });

    describe('calculateConnectionHealth', () => {
      it('should return healthy score for good conditions', () => {
        const health = calculateConnectionHealth(50, 0); // Fast response, no errors
        expect(health).toBe(CONNECTION_HEALTH.HEALTHY);
      });

      it('should deduct points for slow response times', () => {
        expect(calculateConnectionHealth(150, 0)).toBe(80);  // >100ms: -20 points
        expect(calculateConnectionHealth(600, 0)).toBe(50);  // >500ms: -50 points
        expect(calculateConnectionHealth(1200, 0)).toBe(10); // >1000ms: -90 points
      });

      it('should deduct points for errors', () => {
        expect(calculateConnectionHealth(50, 1)).toBe(90);  // 1 error: -10 points
        expect(calculateConnectionHealth(50, 2)).toBe(80);  // 2 errors: -20 points
        expect(calculateConnectionHealth(50, 5)).toBe(50);  // 5 errors: -50 points
      });

      it('should combine response time and error penalties', () => {
        const health = calculateConnectionHealth(600, 2); // >500ms + 2 errors
        expect(health).toBe(30); // 100 - 50 (slow) - 20 (errors) = 30
      });

      it('should not go below critical threshold', () => {
        const health = calculateConnectionHealth(5000, 20); // Very bad conditions
        expect(health).toBe(CONNECTION_HEALTH.CRITICAL);
        expect(health).toBeGreaterThanOrEqual(0);
      });

      it('should handle edge cases gracefully', () => {
        expect(calculateConnectionHealth(0, 0)).toBe(CONNECTION_HEALTH.HEALTHY);
        expect(calculateConnectionHealth(-1, -1)).toBeGreaterThanOrEqual(CONNECTION_HEALTH.CRITICAL);
      });
    });
  });

  describe('Constants Integration', () => {
    it('should have consistent value relationships', () => {
      // Grid notes should be within MIDI range
      const allGridNotes = Object.values(APC40_GRID_NOTES).flat();
      allGridNotes.forEach(note => {
        expect(note).toBeGreaterThanOrEqual(0);
        expect(note).toBeLessThanOrEqual(127);
      });

      // Health values should be within 0-100 range
      Object.values(CONNECTION_HEALTH).forEach(health => {
        expect(health).toBeGreaterThanOrEqual(0);
        expect(health).toBeLessThanOrEqual(100);
      });
    });

    it('should have unique error codes', () => {
      const errorCodes = Object.values(APC40_ERROR_CODES);
      const uniqueCodes = new Set(errorCodes);
      expect(uniqueCodes.size).toBe(errorCodes.length);
    });

    it('should have logical timing relationships', () => {
      // LED throttle should enable smooth updates
      const maxFPS = 1000 / APC40_TIMING.LED_UPDATE_THROTTLE;
      expect(maxFPS).toBeGreaterThanOrEqual(60);

      // Heartbeat should be longer than typical operation timeouts
      expect(APC40_TIMING.HEARTBEAT_INTERVAL).toBeGreaterThan(APC40_TIMING.CONNECTION_TIMEOUT);
    });
  });
});