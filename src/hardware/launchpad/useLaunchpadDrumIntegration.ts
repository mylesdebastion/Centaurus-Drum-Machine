/**
 * Launchpad Pro Drum Sequencer Integration Hook
 *
 * Integrates LaunchpadProController with drum sequencer for:
 * - Button press → step toggle
 * - Pattern changes → LED updates
 * - Playback position → timeline indicator
 * - Layout orientation → grid mapping
 *
 * Reference: Story 8.2, AC 1-6
 */

import { useEffect, useRef, useCallback } from 'react';
import type { DrumTrack, ColorMode } from '../../types';
import type { HardwareController } from '../core/types';
import { LayoutManager, type LayoutOrientation } from './LayoutManager';
import { getTrackColor, PLAYBACK_COLOR, OFF_COLOR } from './colorMapping';
import { isValidGridNote } from './constants';

export interface UseLaunchpadDrumIntegrationOptions {
  controller: HardwareController | undefined;
  tracks: DrumTrack[];
  currentStep: number;
  isPlaying: boolean;
  colorMode: ColorMode;
  onStepToggle: (trackId: string, stepIndex: number) => void;
  onVelocityChange: (trackId: string, stepIndex: number, velocity: number) => void;
}

/**
 * Integration hook for Launchpad Pro with drum sequencer
 */
export function useLaunchpadDrumIntegration(options: UseLaunchpadDrumIntegrationOptions): {
  layoutManager: LayoutManager;
  toggleOrientation: () => void;
  orientation: LayoutOrientation;
} {
  const {
    controller,
    tracks,
    currentStep,
    isPlaying,
    colorMode,
    onStepToggle,
    onVelocityChange,
  } = options;

  const layoutManagerRef = useRef<LayoutManager>(new LayoutManager());
  const layoutManager = layoutManagerRef.current;

  const previousStepRef = useRef<number>(-1);

  /**
   * Handle button press from Launchpad
   */
  const handleButtonPress = useCallback(
    (note: number, velocity: number) => {
      // Validate grid note
      if (!isValidGridNote(note)) {
        console.warn(`[LaunchpadDrum] Invalid grid note: ${note}`);
        return;
      }

      try {
        // Convert note to step coordinates
        const { track: trackIndex, step: stepIndex } = layoutManager.getStepForNote(note);

        // Validate track exists
        if (trackIndex < 0 || trackIndex >= tracks.length) {
          console.warn(`[LaunchpadDrum] Track ${trackIndex} out of range (0-${tracks.length - 1})`);
          return;
        }

        // Only handle first 8 steps (0-7) for 8×8 grid
        if (stepIndex < 0 || stepIndex >= 8) {
          console.warn(`[LaunchpadDrum] Step ${stepIndex} out of range (0-7)`);
          return;
        }

        const track = tracks[trackIndex];

        // Toggle step in sequencer
        onStepToggle(track.id, stepIndex);

        // Update velocity if step is now active
        const isNowActive = !track.steps[stepIndex]; // Will be toggled
        if (isNowActive) {
          const normalizedVelocity = velocity / 127; // 0.0 to 1.0
          onVelocityChange(track.id, stepIndex, normalizedVelocity);
        }

        console.log(
          `[LaunchpadDrum] Toggled step - Track: ${track.name}, Step: ${stepIndex}, Velocity: ${velocity}`
        );
      } catch (error) {
        console.error('[LaunchpadDrum] Error handling button press:', error);
      }
    },
    [layoutManager, tracks, onStepToggle, onVelocityChange]
  );

  /**
   * Register button press handler with controller
   */
  useEffect(() => {
    if (!controller) return;

    // Create event handler wrapper to extract note and velocity from event
    const eventHandler = (event: any) => {
      const { note, velocity } = event.data || {};
      if (typeof note === 'number' && typeof velocity === 'number') {
        handleButtonPress(note, velocity);
      }
    };

    // Register via event system
    controller.addEventListener('step_toggle', eventHandler);

    return () => {
      controller.removeEventListener('step_toggle', eventHandler);
    };
  }, [controller, handleButtonPress]);

  /**
   * Update LEDs when pattern changes or orientation changes
   */
  const updateAllLEDs = useCallback(() => {
    if (!controller || typeof (controller as any).setLED !== 'function') return;

    const setLED = (controller as any).setLED.bind(controller);

    // Clear all LEDs first
    for (let note = 0; note <= 119; note++) {
      if (isValidGridNote(note)) {
        setLED(note, 0, 0, 0);
      }
    }

    // Update LEDs for first 8 tracks and first 8 steps
    const maxTracks = Math.min(tracks.length, 8);
    const maxSteps = 8;

    for (let trackIndex = 0; trackIndex < maxTracks; trackIndex++) {
      const track = tracks[trackIndex];

      for (let stepIndex = 0; stepIndex < maxSteps; stepIndex++) {
        const note = layoutManager.getNoteForStep(trackIndex, stepIndex);
        const isActive = track.steps[stepIndex];

        if (isActive) {
          const velocity = Math.floor(track.velocities[stepIndex] * 127); // 0.0-1.0 → 0-127
          const color = getTrackColor(trackIndex, velocity, colorMode);
          setLED(note, color.r, color.g, color.b);
        } else {
          setLED(note, OFF_COLOR.r, OFF_COLOR.g, OFF_COLOR.b);
        }
      }
    }
  }, [controller, tracks, layoutManager, colorMode]);

  /**
   * Update playback position indicator
   */
  const updatePlaybackIndicator = useCallback(() => {
    if (!controller || typeof (controller as any).setLED !== 'function') return;
    if (!isPlaying) return;

    const setLED = (controller as any).setLED.bind(controller);

    // Clear previous position (if within 8-step range)
    if (previousStepRef.current >= 0 && previousStepRef.current < 8) {
      const maxTracks = Math.min(tracks.length, 8);
      for (let trackIndex = 0; trackIndex < maxTracks; trackIndex++) {
        const track = tracks[trackIndex];
        const note = layoutManager.getNoteForStep(trackIndex, previousStepRef.current);
        const isActive = track.steps[previousStepRef.current];

        if (isActive) {
          const velocity = Math.floor(track.velocities[previousStepRef.current] * 127);
          const color = getTrackColor(trackIndex, velocity, colorMode);
          setLED(note, color.r, color.g, color.b);
        } else {
          setLED(note, OFF_COLOR.r, OFF_COLOR.g, OFF_COLOR.b);
        }
      }
    }

    // Set current position (if within 8-step range)
    if (currentStep >= 0 && currentStep < 8) {
      const maxTracks = Math.min(tracks.length, 8);
      for (let trackIndex = 0; trackIndex < maxTracks; trackIndex++) {
        const note = layoutManager.getNoteForStep(trackIndex, currentStep);
        // Use playback color for current step
        setLED(note, PLAYBACK_COLOR.r, PLAYBACK_COLOR.g, PLAYBACK_COLOR.b);
      }

      previousStepRef.current = currentStep;
    }
  }, [controller, tracks, currentStep, isPlaying, layoutManager, colorMode]);

  /**
   * Update all LEDs when pattern changes
   */
  useEffect(() => {
    updateAllLEDs();
  }, [updateAllLEDs]);

  /**
   * Update playback indicator when step advances
   */
  useEffect(() => {
    updatePlaybackIndicator();
  }, [updatePlaybackIndicator]);

  /**
   * Handle orientation changes
   */
  useEffect(() => {
    const handleOrientationChanged = () => {
      console.log(`[LaunchpadDrum] Orientation changed to ${layoutManager.orientation}`);
      updateAllLEDs();
    };

    layoutManager.onOrientationChanged(handleOrientationChanged);

    return () => {
      layoutManager.offOrientationChanged(handleOrientationChanged);
    };
  }, [layoutManager, updateAllLEDs]);

  /**
   * Clear LEDs on unmount
   */
  useEffect(() => {
    return () => {
      if (controller && typeof (controller as any).clearAllLEDs === 'function') {
        (controller as any).clearAllLEDs();
      }
    };
  }, [controller]);

  return {
    layoutManager,
    toggleOrientation: () => layoutManager.toggleOrientation(),
    orientation: layoutManager.orientation,
  };
}
