/**
 * Tone.js Timing Synchronization Test Suite
 * Tests LED timing sync with Tone.js Transport system
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  LEDTimingSync,
  type TimingSyncConfig,
  type SequencerSyncState,
  type LEDUpdateEvent,
} from '../../apc40/timingSync';

// Mock Tone.js module to avoid audio context issues in tests
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

// Mock APC40Controller for testing
const mockAPC40Controller = {
  id: 'test-controller',
  name: 'Test APC40',
  connectionStatus: 'connected',
  capabilities: { hasLEDs: true, hasVelocityPads: true },
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  sendEvent: vi.fn(),
} as any;

describe('LEDTimingSync', () => {
  let timingSync: LEDTimingSync;
  let mockCallback: ReturnType<typeof vi.fn>;

  const testConfig: TimingSyncConfig = {
    lookaheadTime: 25,
    updateInterval: '16n',
    maxLatency: 50,
    enableLookahead: true,
  };

  const testSequencerState: SequencerSyncState = {
    isPlaying: false,
    currentStep: 0,
    bpm: 120,
    pattern: [[true, false, true, false], [false, true, false, true]],
    totalSteps: 16,
  };

  beforeEach(() => {
    vi.useFakeTimers();
    mockCallback = vi.fn();
    timingSync = new LEDTimingSync(mockAPC40Controller, testConfig);
  });

  afterEach(() => {
    timingSync.dispose();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Configuration', () => {
    test('should initialize with default config', () => {
      const defaultSync = new LEDTimingSync(mockAPC40Controller);
      const config = defaultSync.getConfig();

      expect(config.lookaheadTime).toBe(25);
      expect(config.updateInterval).toBe('16n');
      expect(config.maxLatency).toBe(50);
      expect(config.enableLookahead).toBe(true);

      defaultSync.dispose();
    });

    test('should accept custom configuration', () => {
      const customConfig = {
        lookaheadTime: 50,
        updateInterval: '8n',
        maxLatency: 100,
        enableLookahead: false,
      };

      const customSync = new LEDTimingSync(mockAPC40Controller, customConfig);
      const config = customSync.getConfig();

      expect(config.lookaheadTime).toBe(50);
      expect(config.updateInterval).toBe('8n');
      expect(config.maxLatency).toBe(100);
      expect(config.enableLookahead).toBe(false);

      customSync.dispose();
    });

    test('should update configuration', () => {
      timingSync.updateConfig({ lookaheadTime: 100, maxLatency: 200 });
      const config = timingSync.getConfig();

      expect(config.lookaheadTime).toBe(100);
      expect(config.maxLatency).toBe(200);
      expect(config.updateInterval).toBe('16n'); // Unchanged
    });
  });

  describe('Sync Control', () => {
    test('should start synchronization', () => {
      expect(timingSync.isSync()).toBe(false);

      timingSync.startSync(testSequencerState);
      expect(timingSync.isSync()).toBe(true);
    });

    test('should stop synchronization', () => {
      timingSync.startSync(testSequencerState);
      expect(timingSync.isSync()).toBe(true);

      timingSync.stopSync();
      expect(timingSync.isSync()).toBe(false);
    });

    test('should prevent double start', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      timingSync.startSync(testSequencerState);
      timingSync.startSync(testSequencerState); // Second call should warn

      expect(consoleSpy).toHaveBeenCalledWith(
        'LEDTimingSync: Already active, stopping previous sync'
      );

      consoleSpy.mockRestore();
    });

    test('should handle stop when not started', () => {
      expect(() => timingSync.stopSync()).not.toThrow();
      expect(timingSync.isSync()).toBe(false);
    });
  });

  describe('Update Events', () => {
    test('should register LED update callbacks', () => {
      const unsubscribe = timingSync.onLEDUpdate(mockCallback);

      timingSync.startSync(testSequencerState);

      // Verify callback was registered (it should be called on start)
      expect(mockCallback).toHaveBeenCalled();

      unsubscribe();
    });

    test('should unsubscribe callbacks', () => {
      const unsubscribe = timingSync.onLEDUpdate(mockCallback);
      unsubscribe();

      timingSync.startSync(testSequencerState);

      // Callback should not be called after unsubscribe
      expect(mockCallback).not.toHaveBeenCalled();
    });

    test('should send transport_start event on sync start', () => {
      timingSync.onLEDUpdate(mockCallback);
      timingSync.startSync(testSequencerState);

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'transport_start',
          stepIndex: 0,
          bpm: 120,
        })
      );
    });

    test('should send transport_stop event on sync stop', () => {
      timingSync.onLEDUpdate(mockCallback);
      timingSync.startSync(testSequencerState);
      mockCallback.mockClear();

      timingSync.stopSync();

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'transport_stop',
        })
      );
    });
  });

  describe('Sequencer State Updates', () => {
    beforeEach(() => {
      timingSync.startSync(testSequencerState);
      mockCallback.mockClear();
    });

    test('should update sequencer state', () => {
      timingSync.onLEDUpdate(mockCallback);

      timingSync.updateSequencerState({
        currentStep: 5,
        bpm: 140,
      });

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'step_change',
          stepIndex: 5,
          bpm: 140,
        })
      );
    });

    test('should not trigger callback if step unchanged', () => {
      timingSync.onLEDUpdate(mockCallback);

      timingSync.updateSequencerState({
        bpm: 140, // Only BPM changed, no step change
      });

      expect(mockCallback).not.toHaveBeenCalled();
    });

    test('should handle BPM changes in sequencer state', () => {
      // Test that BPM updates don't throw errors
      expect(() => {
        timingSync.updateSequencerState({ bpm: 140 });
      }).not.toThrow();
    });
  });

  describe('Performance Metrics', () => {
    test('should initialize metrics with zero values', () => {
      const metrics = timingSync.getSyncMetrics();

      expect(metrics.updateCount).toBe(0);
      expect(metrics.averageLatency).toBe(0);
      expect(metrics.maxLatency).toBe(0);
      expect(metrics.syncErrors).toBe(0);
    });

    test('should reset metrics', () => {
      // Start sync to generate some metrics
      timingSync.startSync(testSequencerState);

      // Simulate some updates (would be done by Tone.js in real scenario)
      // Here we just update the internal state
      timingSync.resetMetrics();

      const metrics = timingSync.getSyncMetrics();
      expect(metrics.updateCount).toBe(0);
      expect(metrics.averageLatency).toBe(0);
      expect(metrics.totalLatency).toBe(0);
      expect(metrics.maxLatency).toBe(0);
      expect(metrics.syncErrors).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle callback errors gracefully', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error');
      });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      timingSync.onLEDUpdate(errorCallback);
      timingSync.startSync(testSequencerState);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'LEDTimingSync: Error in update callback:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Lookahead Calculation', () => {
    test('should include lookahead steps when enabled', () => {
      timingSync.onLEDUpdate(mockCallback);
      timingSync.startSync(testSequencerState);

      // Update to trigger step change with lookahead
      timingSync.updateSequencerState({ currentStep: 5 });

      const lastCall = mockCallback.mock.calls[mockCallback.mock.calls.length - 1][0];
      expect(lastCall.lookaheadSteps).toBeDefined();
      expect(Array.isArray(lastCall.lookaheadSteps)).toBe(true);
    });

    test('should not include lookahead steps when disabled', () => {
      const noLookaheadConfig = { ...testConfig, enableLookahead: false };
      const noLookaheadSync = new LEDTimingSync(mockAPC40Controller, noLookaheadConfig);

      noLookaheadSync.onLEDUpdate(mockCallback);
      noLookaheadSync.startSync(testSequencerState);

      // Update to trigger step change without lookahead
      noLookaheadSync.updateSequencerState({ currentStep: 5 });

      const lastCall = mockCallback.mock.calls[mockCallback.mock.calls.length - 1][0];
      expect(lastCall.lookaheadSteps).toBeUndefined();

      noLookaheadSync.dispose();
    });
  });

  describe('Disposal', () => {
    test('should dispose cleanly', () => {
      timingSync.startSync(testSequencerState);
      expect(timingSync.isSync()).toBe(true);

      timingSync.dispose();

      expect(timingSync.isSync()).toBe(false);
    });
  });

  describe('Integration Edge Cases', () => {
    test('should handle wrap-around steps correctly', () => {
      timingSync.onLEDUpdate(mockCallback);
      timingSync.startSync({ ...testSequencerState, currentStep: 15 });

      // Update to step 0 (wrap around)
      timingSync.updateSequencerState({ currentStep: 0 });

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          stepIndex: 0,
        })
      );
    });

    test('should handle different total step counts', () => {
      const customState = { ...testSequencerState, totalSteps: 32 };
      timingSync.startSync(customState);

      expect(timingSync.isSync()).toBe(true);
    });

    test('should handle invalid sequencer states gracefully', () => {
      const invalidState = {
        ...testSequencerState,
        currentStep: -1, // Invalid step
        bpm: 0, // Invalid BPM
      };

      expect(() => timingSync.startSync(invalidState)).not.toThrow();
    });
  });
});

describe('LEDUpdateEvent Types', () => {
  test('should define correct event types', () => {
    const eventTypes = ['step_change', 'transport_start', 'transport_stop', 'transport_pause'];

    // This test validates our TypeScript interface definitions
    eventTypes.forEach(type => {
      const event: LEDUpdateEvent = {
        type: type as LEDUpdateEvent['type'],
        stepIndex: 0,
        timestamp: performance.now(),
        bpm: 120,
      };

      expect(event.type).toBe(type);
    });
  });

  test('should include required fields in all events', () => {
    const event: LEDUpdateEvent = {
      type: 'step_change',
      stepIndex: 5,
      timestamp: 1234567890,
      bpm: 128,
      lookaheadSteps: [6, 7],
    };

    expect(event.type).toBe('step_change');
    expect(event.stepIndex).toBe(5);
    expect(event.timestamp).toBe(1234567890);
    expect(event.bpm).toBe(128);
    expect(event.lookaheadSteps).toEqual([6, 7]);
  });
});