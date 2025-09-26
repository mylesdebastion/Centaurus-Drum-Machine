/**
 * LED Pattern and Color Mapping System for APC40
 *
 * Provides LED color definitions, state-to-color mapping, and animation patterns
 * for real-time visual feedback during sequencer playback.
 */

export interface LEDState {
  color: number;
  intensity: number;
  blinking?: boolean;
}

export interface StepLEDState {
  off: LEDState;
  active: LEDState;
  playing: LEDState;
  velocity: LEDState;
}

/**
 * APC40 LED Color Constants
 * Based on SysEx mode color values
 */
export const LED_COLORS = {
  OFF: 0,
  GREEN: 1,
  GREEN_BLINK: 2,
  RED: 3,
  RED_BLINK: 4,
  AMBER: 5,
  AMBER_BLINK: 6,
} as const;

/**
 * LED Intensity Levels (0-127)
 * Higher values = brighter LEDs
 */
export const LED_INTENSITY = {
  OFF: 0,
  DIM: 32,
  MEDIUM: 64,
  BRIGHT: 96,
  FULL: 127,
} as const;

/**
 * Step State to LED Color Mapping
 * Defines how different sequencer step states map to LED colors
 */
export const STEP_LED_MAPPING: StepLEDState = {
  // Empty/inactive step
  off: {
    color: LED_COLORS.OFF,
    intensity: LED_INTENSITY.OFF,
  },

  // Step has been activated/programmed
  active: {
    color: LED_COLORS.GREEN,
    intensity: LED_INTENSITY.MEDIUM,
  },

  // Currently playing step (playhead position)
  playing: {
    color: LED_COLORS.RED,
    intensity: LED_INTENSITY.BRIGHT,
    blinking: false,
  },

  // Velocity-based intensity for active steps
  velocity: {
    color: LED_COLORS.GREEN,
    intensity: LED_INTENSITY.MEDIUM, // Will be calculated based on velocity
  },
};

/**
 * Playback Position Animation Patterns
 */
export const PLAYBACK_PATTERNS = {
  // Static red for current step
  SOLID_PLAYHEAD: {
    color: LED_COLORS.RED,
    intensity: LED_INTENSITY.BRIGHT,
  },

  // Blinking red for current step
  BLINK_PLAYHEAD: {
    color: LED_COLORS.RED_BLINK,
    intensity: LED_INTENSITY.BRIGHT,
  },

  // Amber for upcoming step (lookahead)
  LOOKAHEAD: {
    color: LED_COLORS.AMBER,
    intensity: LED_INTENSITY.DIM,
  },
} as const;

/**
 * Convert velocity value (0-127) to LED intensity
 * @param velocity MIDI velocity value (0-127)
 * @returns LED intensity value (0-127)
 */
export function velocityToLEDIntensity(velocity: number): number {
  // Clamp velocity to valid range
  const clampedVelocity = Math.max(0, Math.min(127, velocity));

  // Map velocity to intensity with minimum threshold
  // Ensure even quiet notes are visible (minimum 25% intensity)
  const minIntensity = LED_INTENSITY.DIM;
  const maxIntensity = LED_INTENSITY.FULL;

  if (clampedVelocity === 0) return LED_INTENSITY.OFF;

  const normalizedVelocity = clampedVelocity / 127;
  return Math.round(minIntensity + (normalizedVelocity * (maxIntensity - minIntensity)));
}

/**
 * Get LED state for a sequencer step based on its current state
 * @param stepActive Whether the step is programmed/active
 * @param isPlaying Whether this step is currently playing
 * @param velocity Step velocity (0-127), used for intensity mapping
 * @returns LEDState configuration for the step
 */
export function getStepLEDState(
  stepActive: boolean,
  isPlaying: boolean,
  velocity: number = 100
): LEDState {
  // Playing step takes precedence
  if (isPlaying) {
    return {
      color: STEP_LED_MAPPING.playing.color,
      intensity: STEP_LED_MAPPING.playing.intensity,
      blinking: STEP_LED_MAPPING.playing.blinking,
    };
  }

  // Active step with velocity-based intensity
  if (stepActive) {
    return {
      color: STEP_LED_MAPPING.active.color,
      intensity: velocityToLEDIntensity(velocity),
    };
  }

  // Inactive step
  return {
    color: STEP_LED_MAPPING.off.color,
    intensity: STEP_LED_MAPPING.off.intensity,
  };
}

/**
 * Get LED state for playback position indication
 * @param stepIndex Current step index
 * @param playbackPosition Current playback position
 * @param lookaheadSteps Number of steps to show lookahead (default: 1)
 * @returns LEDState for playback position indication, or null if no special state
 */
export function getPlaybackLEDState(
  stepIndex: number,
  playbackPosition: number,
  lookaheadSteps: number = 1
): LEDState | null {
  // Current playback position
  if (stepIndex === playbackPosition) {
    return {
      color: PLAYBACK_PATTERNS.SOLID_PLAYHEAD.color,
      intensity: PLAYBACK_PATTERNS.SOLID_PLAYHEAD.intensity,
    };
  }

  // Lookahead positions
  const nextPosition = (playbackPosition + 1) % 16; // Assuming 16-step sequences
  if (lookaheadSteps > 0 && stepIndex === nextPosition) {
    return {
      color: PLAYBACK_PATTERNS.LOOKAHEAD.color,
      intensity: PLAYBACK_PATTERNS.LOOKAHEAD.intensity,
    };
  }

  return null;
}

/**
 * Combine step state and playback position to get final LED state
 * Playback position indication takes precedence over step state
 */
export function getFinalLEDState(
  stepActive: boolean,
  isPlaying: boolean,
  velocity: number,
  stepIndex: number,
  playbackPosition: number,
  lookaheadSteps: number = 1
): LEDState {
  // Check for playback position indication first
  const playbackState = getPlaybackLEDState(stepIndex, playbackPosition, lookaheadSteps);
  if (playbackState) {
    return playbackState;
  }

  // Fall back to step state
  return getStepLEDState(stepActive, isPlaying, velocity);
}

/**
 * LED Animation Controller for smooth transitions
 */
export class LEDAnimationController {
  private animationFrameId: number | null = null;
  private lastUpdateTime: number = 0;
  private readonly updateInterval: number = 50; // 20Hz update rate

  constructor() {
    this.lastUpdateTime = performance.now();
  }

  /**
   * Start LED animation loop
   */
  start(updateCallback: () => void): void {
    const animate = (currentTime: number) => {
      if (currentTime - this.lastUpdateTime >= this.updateInterval) {
        updateCallback();
        this.lastUpdateTime = currentTime;
      }

      this.animationFrameId = requestAnimationFrame(animate);
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * Stop LED animation loop
   */
  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Check if animation is currently running
   */
  isRunning(): boolean {
    return this.animationFrameId !== null;
  }
}