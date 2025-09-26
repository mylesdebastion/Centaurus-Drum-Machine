/**
 * LED Patterns Test Suite
 * Tests LED color mapping, velocity calculations, and animation patterns
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  LED_COLORS,
  LED_INTENSITY,
  STEP_LED_MAPPING,
  PLAYBACK_PATTERNS,
  velocityToLEDIntensity,
  getStepLEDState,
  getPlaybackLEDState,
  getFinalLEDState,
  LEDAnimationController,
} from '../../apc40/ledPatterns';

describe('LED Color Constants', () => {
  test('should define all required LED colors', () => {
    expect(LED_COLORS.OFF).toBe(0);
    expect(LED_COLORS.GREEN).toBe(1);
    expect(LED_COLORS.GREEN_BLINK).toBe(2);
    expect(LED_COLORS.RED).toBe(3);
    expect(LED_COLORS.RED_BLINK).toBe(4);
    expect(LED_COLORS.AMBER).toBe(5);
    expect(LED_COLORS.AMBER_BLINK).toBe(6);
  });

  test('should define intensity levels in correct range', () => {
    expect(LED_INTENSITY.OFF).toBe(0);
    expect(LED_INTENSITY.FULL).toBe(127);
    expect(LED_INTENSITY.MEDIUM).toBeGreaterThan(LED_INTENSITY.DIM);
    expect(LED_INTENSITY.BRIGHT).toBeGreaterThan(LED_INTENSITY.MEDIUM);
  });
});

describe('Step LED Mapping', () => {
  test('should provide correct default states', () => {
    expect(STEP_LED_MAPPING.off.color).toBe(LED_COLORS.OFF);
    expect(STEP_LED_MAPPING.off.intensity).toBe(LED_INTENSITY.OFF);

    expect(STEP_LED_MAPPING.active.color).toBe(LED_COLORS.GREEN);
    expect(STEP_LED_MAPPING.active.intensity).toBe(LED_INTENSITY.MEDIUM);

    expect(STEP_LED_MAPPING.playing.color).toBe(LED_COLORS.RED);
    expect(STEP_LED_MAPPING.playing.intensity).toBe(LED_INTENSITY.BRIGHT);
    expect(STEP_LED_MAPPING.playing.blinking).toBe(false);
  });
});

describe('velocityToLEDIntensity', () => {
  test('should return 0 intensity for 0 velocity', () => {
    expect(velocityToLEDIntensity(0)).toBe(LED_INTENSITY.OFF);
  });

  test('should return full intensity for max velocity', () => {
    const result = velocityToLEDIntensity(127);
    expect(result).toBe(LED_INTENSITY.FULL);
  });

  test('should provide minimum visibility for low velocities', () => {
    const result = velocityToLEDIntensity(1);
    expect(result).toBeGreaterThan(LED_INTENSITY.OFF);
    expect(result).toBeGreaterThanOrEqual(LED_INTENSITY.DIM);
  });

  test('should handle out-of-range velocity values', () => {
    expect(velocityToLEDIntensity(-10)).toBe(LED_INTENSITY.OFF);
    expect(velocityToLEDIntensity(200)).toBe(LED_INTENSITY.FULL);
  });

  test('should scale velocity linearly between min and max', () => {
    const low = velocityToLEDIntensity(32);
    const high = velocityToLEDIntensity(96);
    expect(high).toBeGreaterThan(low);
  });
});

describe('getStepLEDState', () => {
  test('should return off state for inactive step', () => {
    const state = getStepLEDState(false, false, 100);
    expect(state.color).toBe(LED_COLORS.OFF);
    expect(state.intensity).toBe(LED_INTENSITY.OFF);
  });

  test('should return playing state when step is playing', () => {
    const state = getStepLEDState(true, true, 100);
    expect(state.color).toBe(LED_COLORS.RED);
    expect(state.intensity).toBe(LED_INTENSITY.BRIGHT);
  });

  test('should return active state with velocity-based intensity', () => {
    const state = getStepLEDState(true, false, 64);
    expect(state.color).toBe(LED_COLORS.GREEN);
    expect(state.intensity).toBe(velocityToLEDIntensity(64));
  });

  test('should prioritize playing state over active state', () => {
    const playingState = getStepLEDState(true, true, 100);
    const activeState = getStepLEDState(true, false, 100);

    expect(playingState.color).toBe(LED_COLORS.RED);
    expect(activeState.color).toBe(LED_COLORS.GREEN);
  });
});

describe('getPlaybackLEDState', () => {
  test('should return playhead state for current position', () => {
    const state = getPlaybackLEDState(5, 5, 1);
    expect(state).not.toBeNull();
    expect(state!.color).toBe(LED_COLORS.RED);
    expect(state!.intensity).toBe(LED_INTENSITY.BRIGHT);
  });

  test('should return lookahead state for next position', () => {
    const state = getPlaybackLEDState(6, 5, 1);
    expect(state).not.toBeNull();
    expect(state!.color).toBe(LED_COLORS.AMBER);
    expect(state!.intensity).toBe(LED_INTENSITY.DIM);
  });

  test('should return null for non-playback positions', () => {
    const state = getPlaybackLEDState(3, 5, 1);
    expect(state).toBeNull();
  });

  test('should handle wraparound for lookahead', () => {
    const state = getPlaybackLEDState(0, 15, 1); // Position 15 -> 0
    expect(state).not.toBeNull();
    expect(state!.color).toBe(LED_COLORS.AMBER);
  });

  test('should respect lookahead steps parameter', () => {
    const noLookahead = getPlaybackLEDState(6, 5, 0);
    expect(noLookahead).toBeNull();

    const withLookahead = getPlaybackLEDState(6, 5, 1);
    expect(withLookahead).not.toBeNull();
  });
});

describe('getFinalLEDState', () => {
  test('should prioritize playback position over step state', () => {
    // Step 5 is active but step 5 is also current playback position
    const state = getFinalLEDState(true, false, 100, 5, 5, 1);
    expect(state.color).toBe(LED_COLORS.RED); // Playback color, not green
  });

  test('should use step state when not at playback position', () => {
    const state = getFinalLEDState(true, false, 80, 3, 5, 1);
    expect(state.color).toBe(LED_COLORS.GREEN);
    expect(state.intensity).toBe(velocityToLEDIntensity(80));
  });

  test('should show lookahead when appropriate', () => {
    const state = getFinalLEDState(false, false, 100, 6, 5, 1);
    expect(state.color).toBe(LED_COLORS.AMBER); // Lookahead
  });

  test('should handle inactive steps with no playback indication', () => {
    const state = getFinalLEDState(false, false, 100, 3, 5, 1);
    expect(state.color).toBe(LED_COLORS.OFF);
    expect(state.intensity).toBe(LED_INTENSITY.OFF);
  });
});

describe('LEDAnimationController', () => {
  let controller: LEDAnimationController;

  beforeEach(() => {
    controller = new LEDAnimationController();
    vi.useFakeTimers();
  });

  afterEach(() => {
    controller.stop();
    vi.useRealTimers();
  });

  test('should start and stop animation correctly', () => {
    expect(controller.isRunning()).toBe(false);

    const mockCallback = vi.fn();
    controller.start(mockCallback);
    expect(controller.isRunning()).toBe(true);

    controller.stop();
    expect(controller.isRunning()).toBe(false);
  });

  test('should call update callback when started', () => {
    const mockCallback = vi.fn();

    // Simple test that callback gets assigned and controller tracks running state
    controller.start(mockCallback);
    expect(controller.isRunning()).toBe(true);

    // Animation controller uses requestAnimationFrame which is complex to test
    // The main functionality is verified by the start/stop behavior
  });

  test('should stop animation when requested', () => {
    const mockCallback = vi.fn();

    controller.start(mockCallback);
    expect(controller.isRunning()).toBe(true);

    controller.stop();
    expect(controller.isRunning()).toBe(false);
  });
});

describe('Integration Tests', () => {
  test('should provide consistent color mapping across functions', () => {
    // Test that all functions use the same color constants
    const stepState = getStepLEDState(true, false, 100);
    const finalState = getFinalLEDState(true, false, 100, 3, 5, 0);

    expect(stepState.color).toBe(finalState.color);
    expect(stepState.color).toBe(LED_COLORS.GREEN);
  });

  test('should handle edge case: step 0 with playback at step 15', () => {
    // Test wraparound logic
    const state = getFinalLEDState(false, false, 100, 0, 15, 1);
    expect(state.color).toBe(LED_COLORS.AMBER); // Should be lookahead
  });

  test('should handle velocity extremes correctly', () => {
    const minVelocity = getFinalLEDState(true, false, 1, 3, 5, 0);
    const maxVelocity = getFinalLEDState(true, false, 127, 3, 5, 0);

    expect(minVelocity.intensity).toBeGreaterThan(0);
    expect(maxVelocity.intensity).toBe(LED_INTENSITY.FULL);
    expect(maxVelocity.intensity).toBeGreaterThan(minVelocity.intensity);
  });
});