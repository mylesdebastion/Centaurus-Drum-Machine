/**
 * LED Batching Performance Test Suite
 * Tests LED update batching and performance optimization
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Tone.js to avoid audio context issues
vi.mock('tone', () => ({
  Transport: {
    scheduleRepeat: vi.fn(() => 123),
    cancel: vi.fn(),
    bpm: { value: 120 },
    on: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  },
}));

// Mock the constants module with updated LED control methods
vi.mock('../../apc40/constants', () => ({
  APC40_DEVICE_INFO: { name: 'APC40' },
  APC40_TIMING: { HEARTBEAT_INTERVAL: 5000 },
  APC40_ERROR_CODES: {},
  createModeSwitch: vi.fn(() => [0xF0, 0x47, 0x7F, 0x29, 0x60, 0x00, 0x04, 0x41, 0x09, 0x07, 0x01, 0xF7]),
  createLedControl: vi.fn((note: number, color: number) => [0x90, note, color]),
  isAPC40Device: vi.fn(() => true),
  isValidGridNote: vi.fn(() => true),
  calculateConnectionHealth: vi.fn(() => 100),
  CONNECTION_HEALTH: { HEALTHY: 100 },
  MIDI_MESSAGE_TYPES: { NOTE_ON: 144, NOTE_OFF: 128 },
}));

// Mock WebMIDIApiWrapper
vi.mock('../../utils/webMidiApi', () => ({
  WebMIDIApiWrapper: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    isInitialized: vi.fn(() => true),
    enumerateDevices: vi.fn().mockResolvedValue({
      inputs: [{ name: 'APC40', addEventListener: vi.fn() }],
      outputs: [{ name: 'APC40', send: vi.fn() }],
    }),
  })),
}));

// Mock other dependencies
vi.mock('../../apc40/errorRecovery', () => ({
  apc40ErrorRecovery: {
    handleAPC40Error: vi.fn(),
    clearRecoveryState: vi.fn(),
    handleConnectionHealthDegradation: vi.fn(),
  },
  getAPC40ErrorCode: vi.fn(() => 'TEST_ERROR'),
  createAPC40ErrorContext: vi.fn(() => ({})),
}));

vi.mock('../../apc40/midiMapping', () => ({
  defaultGridMapping: {
    noteToStep: new Map([[32, 0], [33, 1]]),
    stepToNote: new Map([[0, 32], [1, 33]]),
  },
  stepStateToLedColor: vi.fn(() => 1),
  velocityToIntensity: vi.fn(() => 100),
  APC40_TRANSPORT: { PLAY: 91, STOP: 92, REC: 93 },
}));

import { APC40Controller } from '../../apc40/APC40Controller';

describe('LED Batching Performance', () => {
  let controller: APC40Controller;
  let mockMidiOutput: any;

  beforeEach(() => {
    vi.useFakeTimers();

    // Create mock MIDI output
    mockMidiOutput = {
      send: vi.fn(),
    };

    controller = new APC40Controller('test-batching');

    // Manually set up the controller for testing
    (controller as any).midiOutput = mockMidiOutput;
    (controller as any).isInitialized = true;
    (controller as any).connectionStatus = 'connected';
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Batch Queue Management', () => {
    test('should queue LED updates without sending immediately', () => {
      const batchingInfo = controller.getLEDBatchingInfo();
      expect(batchingInfo.queueSize).toBe(0);

      // Queue a single LED update
      (controller as any).queueLEDUpdate(32, 1);

      const updatedInfo = controller.getLEDBatchingInfo();
      expect(updatedInfo.queueSize).toBe(1);
      expect(updatedInfo.hasPendingUpdates).toBe(true);

      // MIDI message shouldn't be sent yet
      expect(mockMidiOutput.send).not.toHaveBeenCalled();
    });

    test('should process batch after delay timeout', () => {
      (controller as any).queueLEDUpdate(32, 1);
      (controller as any).queueLEDUpdate(33, 2);

      expect(mockMidiOutput.send).not.toHaveBeenCalled();

      // Fast-forward time past the batch delay (10ms)
      vi.advanceTimersByTime(15);

      expect(mockMidiOutput.send).toHaveBeenCalledTimes(2);

      const batchingInfo = controller.getLEDBatchingInfo();
      expect(batchingInfo.queueSize).toBe(0);
      expect(batchingInfo.hasPendingUpdates).toBe(false);
    });

    test('should process batch immediately when max size reached', () => {
      const maxBatchSize = (controller as any).MAX_BATCH_SIZE;

      // Queue updates up to max batch size
      for (let i = 0; i < maxBatchSize; i++) {
        (controller as any).queueLEDUpdate(32 + i, 1);
      }

      // Should process immediately when max size reached
      expect(mockMidiOutput.send).toHaveBeenCalledTimes(maxBatchSize);

      const batchingInfo = controller.getLEDBatchingInfo();
      expect(batchingInfo.queueSize).toBe(0);
    });

    test('should handle duplicate LED updates efficiently', () => {
      // Queue multiple updates to same LED
      (controller as any).queueLEDUpdate(32, 1);
      (controller as any).queueLEDUpdate(32, 2); // Should overwrite previous
      (controller as any).queueLEDUpdate(32, 3); // Should overwrite again

      const batchingInfo = controller.getLEDBatchingInfo();
      expect(batchingInfo.queueSize).toBe(1); // Only one LED in queue

      vi.advanceTimersByTime(15);

      // Should only send the final state (MIDI Note On format)
      expect(mockMidiOutput.send).toHaveBeenCalledTimes(1);
      expect(mockMidiOutput.send).toHaveBeenCalledWith([0x90, 32, 3]);
    });
  });

  describe('Manual Batch Control', () => {
    test('should flush batch updates immediately', () => {
      (controller as any).queueLEDUpdate(32, 1);
      (controller as any).queueLEDUpdate(33, 2);

      expect(mockMidiOutput.send).not.toHaveBeenCalled();

      // Manually flush updates
      controller.flushLEDUpdates();

      expect(mockMidiOutput.send).toHaveBeenCalledTimes(2);

      const batchingInfo = controller.getLEDBatchingInfo();
      expect(batchingInfo.queueSize).toBe(0);
      expect(batchingInfo.hasPendingUpdates).toBe(false);
    });

    test('should handle empty queue flush gracefully', () => {
      controller.flushLEDUpdates();
      expect(mockMidiOutput.send).not.toHaveBeenCalled();
    });
  });

  describe('Performance Optimization', () => {
    test('should reduce MIDI messages through LED state caching', () => {
      const sequencerState = {
        pattern: [[true, false, true, false]],
        currentStep: 0,
        isPlaying: true,
        bpm: 120,
      };

      // First update - should queue LED changes
      controller.updateSequencerState(sequencerState);
      vi.advanceTimersByTime(15); // Process batch

      const firstCallCount = mockMidiOutput.send.mock.calls.length;
      mockMidiOutput.send.mockClear();

      // Second update with same state - should not queue any changes
      controller.updateSequencerState(sequencerState);
      vi.advanceTimersByTime(15); // Process batch

      expect(mockMidiOutput.send).not.toHaveBeenCalled();
    });

    test('should track batching performance metrics', () => {
      const batchingInfo = controller.getLEDBatchingInfo();

      expect(batchingInfo.batchDelay).toBe(10); // 10ms delay
      expect(batchingInfo.maxBatchSize).toBe(16); // Max 16 LEDs per batch
      expect(typeof batchingInfo.queueSize).toBe('number');
      expect(typeof batchingInfo.hasPendingUpdates).toBe('boolean');
    });

    test('should include batching info in controller state', () => {
      const state = controller.getState();

      expect(state.data.ledBatchingEnabled).toBe(true);
      expect(typeof state.data.ledBatchQueueSize).toBe('number');
      expect(state.data.ledBatchDelay).toBe(10);
      expect(state.data.maxBatchSize).toBe(16);
    });
  });

  describe('Integration with LED Update System', () => {
    test('should batch LED updates during sequencer state changes', () => {
      const sequencerState = {
        pattern: [
          [true, false, true, false, true, false, true, false],
          [false, true, false, true, false, true, false, true],
        ],
        currentStep: 2,
        isPlaying: true,
        bpm: 120,
      };

      controller.updateSequencerState(sequencerState);

      const batchingInfo = controller.getLEDBatchingInfo();
      expect(batchingInfo.queueSize).toBeGreaterThan(0);
      expect(batchingInfo.hasPendingUpdates).toBe(true);

      // Process the batch
      vi.advanceTimersByTime(15);

      const finalInfo = controller.getLEDBatchingInfo();
      expect(finalInfo.queueSize).toBe(0);
    });

    test('should clear LED batch queue on disconnect', async () => {
      (controller as any).queueLEDUpdate(32, 1);
      (controller as any).queueLEDUpdate(33, 2);

      const batchingInfo = controller.getLEDBatchingInfo();
      expect(batchingInfo.queueSize).toBe(2);

      await controller.disconnect();

      // Should have processed the batch during disconnect
      expect(mockMidiOutput.send).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle MIDI output failures gracefully', () => {
      mockMidiOutput.send.mockImplementation(() => {
        throw new Error('MIDI send failed');
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      (controller as any).queueLEDUpdate(32, 1);
      vi.advanceTimersByTime(15);

      // Should handle the error without crashing (error is logged by sendMidiMessage)
      expect(consoleErrorSpy).toHaveBeenCalledWith('APC40Controller: MIDI send failed:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });

    test('should handle batching when MIDI output is unavailable', () => {
      (controller as any).midiOutput = null;

      // Should not throw error when no MIDI output available
      expect(() => {
        (controller as any).queueLEDUpdate(32, 1);
        vi.advanceTimersByTime(15);
      }).not.toThrow();
    });
  });

  describe('Performance Benchmarking', () => {
    test('should complete batch processing within performance target', () => {
      const startTime = performance.now();

      // Queue maximum batch size
      for (let i = 0; i < 16; i++) {
        (controller as any).queueLEDUpdate(32 + i, 1);
      }

      const endTime = performance.now();
      const batchingTime = endTime - startTime;

      // Should complete batching within 5ms
      expect(batchingTime).toBeLessThan(5);
    });

    test('should demonstrate batching efficiency gains', () => {
      const updates = [
        { note: 32, color: 1 },
        { note: 33, color: 2 },
        { note: 34, color: 1 },
        { note: 35, color: 3 },
        { note: 36, color: 1 },
      ];

      // Test batched updates
      const batchedStart = performance.now();
      updates.forEach(({ note, color }) => {
        (controller as any).queueLEDUpdate(note, color);
      });
      vi.advanceTimersByTime(15); // Process batch
      const batchedTime = performance.now() - batchedStart;

      // Batching should be efficient
      expect(mockMidiOutput.send).toHaveBeenCalledTimes(updates.length);
      expect(batchedTime).toBeLessThan(50); // Should be reasonably fast (less strict timing)
    });
  });
});