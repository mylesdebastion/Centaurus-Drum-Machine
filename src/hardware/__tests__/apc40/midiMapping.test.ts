/**
 * APC40 MIDI Mapping Tests
 * 
 * Tests the MIDI mapping functionality for APC40 8x5 grid to 16-step sequencer,
 * velocity mapping, LED color mapping, and grid coordinate transformations.
 */

import { describe, it, expect } from 'vitest';
import {
  createGridMapping,
  defaultGridMapping,
  velocityToIntensity,
  intensityToVelocity,
  stepStateToLedColor,
  APC40_SPECS,
  APC40_GRID_NOTES,
  VELOCITY_MAPPING,
  APC40_LED_COLORS,
  APC40_TRANSPORT,
} from '../../apc40/midiMapping';

describe('APC40 MIDI Mapping', () => {
  describe('Grid Specifications', () => {
    it('should have correct APC40 hardware specifications', () => {
      expect(APC40_SPECS.GRID_WIDTH).toBe(8);
      expect(APC40_SPECS.GRID_HEIGHT).toBe(5);
      expect(APC40_SPECS.TOTAL_GRID_BUTTONS).toBe(40);
      expect(APC40_SPECS.SEQUENCER_STEPS).toBe(16);
      expect(APC40_SPECS.SEQUENCER_TRACKS).toBe(8);
    });

    it('should have correct grid note layout', () => {
      // Verify row structure (bottom to top) - APC40 clip grid range 0-39
      expect(APC40_GRID_NOTES.ROW_0).toEqual([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]);
      expect(APC40_GRID_NOTES.ROW_1).toEqual([0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F]);
      expect(APC40_GRID_NOTES.ROW_2).toEqual([0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17]);
      expect(APC40_GRID_NOTES.ROW_3).toEqual([0x18, 0x19, 0x1A, 0x1B, 0x1C, 0x1D, 0x1E, 0x1F]);
      expect(APC40_GRID_NOTES.ROW_4).toEqual([0x20, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27]);

      // Verify total note range (0-39 for clip grid LED control)
      const allNotes = Object.values(APC40_GRID_NOTES).flat();
      expect(allNotes).toHaveLength(40);
      expect(Math.min(...allNotes)).toBe(0);
      expect(Math.max(...allNotes)).toBe(39);
    });
  });

  describe('Grid Mapping Creation', () => {
    let mapping: ReturnType<typeof createGridMapping>;

    beforeEach(() => {
      mapping = createGridMapping();
    });

    it('should create bidirectional step-to-note mappings', () => {
      // Test mapping coverage
      expect(mapping.stepToNote.size).toBe(16);
      expect(mapping.noteToStep.size).toBe(16);
      
      // Test bidirectional consistency
      for (let step = 0; step < 16; step++) {
        const note = mapping.stepToNote.get(step);
        expect(note).toBeDefined();
        expect(mapping.noteToStep.get(note!)).toBe(step);
      }
    });

    it('should create bidirectional track-to-row mappings', () => {
      // Test mapping coverage
      expect(mapping.trackToRow.size).toBe(8);
      expect(mapping.rowToTrack.size).toBe(8);
      
      // Test bidirectional consistency and inversion
      for (let track = 0; track < 8; track++) {
        const row = mapping.trackToRow.get(track);
        expect(row).toBeDefined();
        expect(mapping.rowToTrack.get(row!)).toBe(track);
        
        // Verify inversion: Track 0 maps to Row 4, Track 7 maps to Row 0
        expect(row).toBe(7 - track);
      }
    });

    it('should map steps to correct grid positions', () => {
      // Test specific step mappings - APC40 clip grid (0-39)
      const testCases = [
        { step: 0, expectedNote: 0, expectedColumn: 0, expectedRow: 0 }, // Note 0
        { step: 7, expectedNote: 7, expectedColumn: 7, expectedRow: 0 }, // Note 7
        { step: 8, expectedNote: 8, expectedColumn: 0, expectedRow: 1 }, // Note 8
        { step: 15, expectedNote: 15, expectedColumn: 7, expectedRow: 1 }, // Note 15
      ];

      testCases.forEach(({ step, expectedNote }) => {
        const actualNote = mapping.stepToNote.get(step);
        expect(actualNote).toBe(expectedNote);
      });
    });

    it('should use valid APC40 grid notes in sequential order', () => {
      // Verify all mapped notes are within the valid APC40 range (0-39)
      const mappedNotes = Array.from(mapping.stepToNote.values());

      mappedNotes.forEach(note => {
        expect(note).toBeGreaterThanOrEqual(0);
        expect(note).toBeLessThanOrEqual(39);
      });

      // Verify sequential mapping: step 0→note 0, step 1→note 1, etc.
      for (let step = 0; step < 16; step++) {
        expect(mapping.stepToNote.get(step)).toBe(step);
      }
    });
  });

  describe('Default Grid Mapping', () => {
    it('should provide consistent default mapping', () => {
      const mapping1 = createGridMapping();
      const mapping2 = defaultGridMapping;
      
      // Verify both mappings are identical
      expect(mapping1.stepToNote.size).toBe(mapping2.stepToNote.size);
      expect(mapping1.noteToStep.size).toBe(mapping2.noteToStep.size);
      
      for (let step = 0; step < 16; step++) {
        expect(mapping1.stepToNote.get(step)).toBe(mapping2.stepToNote.get(step));
      }
    });
  });

  describe('Velocity Mapping', () => {
    it('should have correct velocity constants', () => {
      expect(VELOCITY_MAPPING.OFF).toBe(0);
      expect(VELOCITY_MAPPING.LOW).toBe(32);
      expect(VELOCITY_MAPPING.MEDIUM).toBe(64);
      expect(VELOCITY_MAPPING.HIGH).toBe(96);
      expect(VELOCITY_MAPPING.MAX).toBe(127);
    });

    describe('velocityToIntensity', () => {
      it('should map MIDI velocity to intensity levels', () => {
        expect(velocityToIntensity(0)).toBe(0);     // Off
        expect(velocityToIntensity(32)).toBe(1);    // Low
        expect(velocityToIntensity(64)).toBe(2);    // Medium
        expect(velocityToIntensity(96)).toBe(3);    // High
        expect(velocityToIntensity(127)).toBe(4);   // Max
      });

      it('should handle boundary values correctly', () => {
        expect(velocityToIntensity(1)).toBe(1);     // Just above off
        expect(velocityToIntensity(33)).toBe(2);    // Just above low
        expect(velocityToIntensity(65)).toBe(3);    // Just above medium
        expect(velocityToIntensity(97)).toBe(4);    // Just above high
      });

      it('should handle edge cases', () => {
        expect(velocityToIntensity(-1)).toBe(0);    // Negative
        expect(velocityToIntensity(200)).toBe(4);   // Above max
      });
    });

    describe('intensityToVelocity', () => {
      it('should map intensity levels to MIDI velocity', () => {
        expect(intensityToVelocity(0)).toBe(VELOCITY_MAPPING.OFF);
        expect(intensityToVelocity(1)).toBe(VELOCITY_MAPPING.LOW);
        expect(intensityToVelocity(2)).toBe(VELOCITY_MAPPING.MEDIUM);
        expect(intensityToVelocity(3)).toBe(VELOCITY_MAPPING.HIGH);
        expect(intensityToVelocity(4)).toBe(VELOCITY_MAPPING.MAX);
      });

      it('should handle invalid intensity levels', () => {
        expect(intensityToVelocity(-1)).toBe(VELOCITY_MAPPING.MEDIUM); // Default
        expect(intensityToVelocity(10)).toBe(VELOCITY_MAPPING.MEDIUM); // Default
      });
    });

    it('should be bidirectionally consistent', () => {
      const testVelocities = [0, 32, 64, 96, 127];
      
      testVelocities.forEach(velocity => {
        const intensity = velocityToIntensity(velocity);
        const backToVelocity = intensityToVelocity(intensity);
        expect(backToVelocity).toBe(velocity);
      });
    });
  });

  describe('LED Color Mapping', () => {
    it('should have correct LED color constants', () => {
      expect(APC40_LED_COLORS.OFF).toBe(0);
      expect(APC40_LED_COLORS.GREEN).toBe(1);
      expect(APC40_LED_COLORS.GREEN_BLINK).toBe(2);
      expect(APC40_LED_COLORS.RED).toBe(3);
      expect(APC40_LED_COLORS.RED_BLINK).toBe(4);
      expect(APC40_LED_COLORS.AMBER).toBe(5);
      expect(APC40_LED_COLORS.AMBER_BLINK).toBe(6);
    });

    describe('stepStateToLedColor', () => {
      it('should return correct colors for step states', () => {
        // Current step states
        expect(stepStateToLedColor(true, true)).toBe(APC40_LED_COLORS.RED);      // Active + current
        expect(stepStateToLedColor(false, true)).toBe(APC40_LED_COLORS.RED_BLINK); // Inactive + current
        
        // Non-current step states
        expect(stepStateToLedColor(true, false)).toBe(APC40_LED_COLORS.GREEN);   // Active + not current
        expect(stepStateToLedColor(false, false)).toBe(APC40_LED_COLORS.OFF);    // Inactive + not current
      });

      it('should prioritize current step indication', () => {
        // Current step should always use red colors regardless of active state
        expect(stepStateToLedColor(true, true)).not.toBe(APC40_LED_COLORS.GREEN);
        expect(stepStateToLedColor(false, true)).not.toBe(APC40_LED_COLORS.OFF);
      });
    });
  });

  describe('Transport Controls', () => {
    it('should have correct transport control note assignments', () => {
      expect(APC40_TRANSPORT.PLAY).toBe(91);
      expect(APC40_TRANSPORT.STOP).toBe(92);
      expect(APC40_TRANSPORT.REC).toBe(93);
      expect(APC40_TRANSPORT.SHIFT).toBe(98);
      expect(APC40_TRANSPORT.NUDGE_PLUS).toBe(100);
      expect(APC40_TRANSPORT.NUDGE_MINUS).toBe(101);
    });

    it('should have transport notes outside grid range', () => {
      const transportNotes = Object.values(APC40_TRANSPORT);
      const gridNotes = Object.values(APC40_GRID_NOTES).flat();
      
      transportNotes.forEach(transportNote => {
        expect(gridNotes).not.toContain(transportNote);
      });
    });
  });

  describe('Grid Position Calculations', () => {
    it('should correctly map steps to sequential grid positions', () => {
      const mapping = createGridMapping();

      // Test that all steps map to sequential notes in the APC40 grid
      for (let step = 0; step < 16; step++) {
        const note = mapping.stepToNote.get(step);
        expect(note).toBeDefined();
        expect(note).toBe(step); // Sequential mapping: step i → note i

        // Verify the note is within valid APC40 grid range
        expect(note).toBeGreaterThanOrEqual(0);
        expect(note).toBeLessThanOrEqual(39);
      }

      // Verify bidirectional mapping consistency
      for (let step = 0; step < 16; step++) {
        const note = mapping.stepToNote.get(step);
        expect(mapping.noteToStep.get(note!)).toBe(step);
      }
    });

    it('should maintain consistent row ordering for tracks', () => {
      const mapping = createGridMapping();
      
      // Verify that track ordering matches expected row inversion
      for (let track = 0; track < 8; track++) {
        const expectedRow = (8 - 1) - track; // Inverted mapping
        const actualRow = mapping.trackToRow.get(track);
        expect(actualRow).toBe(expectedRow);
      }
    });
  });
});