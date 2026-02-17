/**
 * useIntervalModeSelection.ts
 * 
 * Manages long-press interval mode selection gesture for column 3
 * Ported from iOS IntervalModeSelectionController.swift
 * 
 * Behavior:
 * - Hold column 3 for 0.5s to activate
 * - Bright pixel climbs through 6 modes every 0.7s
 * - Release to confirm selection
 * - Quick tap (< 0.5s) does nothing
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { IntervalModeType, INTERVAL_MODE_ORDER } from '@/lib/intervalMode';

// ============================================================================
// TYPES
// ============================================================================

export type TrackType = 'melody' | 'chords' | 'bass' | 'rhythm';

export interface IntervalModeSelectionState {
  // Current state
  highlightedMode: number | null;  // 0-5 index, null if not in selection mode
  isConfirmed: boolean;            // True if held past first step
  activeTrack: TrackType | null;   // Track being edited
  highlightBrightness: number;     // 0.0-1.0 for fade animations
  wasQuickTap: boolean;            // True if last gesture was quick tap
  
  // Actions
  beginHold: (track: TrackType, currentMode: IntervalModeType) => void;
  endHold: () => void;
  cancelHold: () => void;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const ACTIVATION_DELAY = 0.5;    // Time before first mode highlight (seconds)
const STEP_INTERVAL = 0.7;       // Time between mode steps (seconds)
const MODE_COUNT = 6;            // Number of interval modes
const FADE_OUT_DURATION = 0.3;   // Fade duration when cancelled (seconds)
const UPDATE_INTERVAL = 0.1;     // Poll interval for hold state (seconds)

// ============================================================================
// HOOK
// ============================================================================

export function useIntervalModeSelection(
  onModeConfirmed?: (track: TrackType, mode: IntervalModeType) => void,
  onModePreview?: (track: TrackType, mode: IntervalModeType) => void,
  onActivation?: (track: TrackType, mode: IntervalModeType) => void,
  onCancelled?: (track: TrackType) => void
): IntervalModeSelectionState {
  
  // State
  const [highlightedMode, setHighlightedMode] = useState<number | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [activeTrack, setActiveTrack] = useState<TrackType | null>(null);
  const [highlightBrightness, setHighlightBrightness] = useState(0);
  const [wasQuickTap, setWasQuickTap] = useState(false);
  
  // Refs for timer state
  const holdStartTime = useRef<number | null>(null);
  const updateTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentStep = useRef(0);
  const hasEnteredSelectionMode = useRef(false);
  const startingModeIndex = useRef(0);
  const activeTrackRef = useRef<TrackType | null>(null);  // Capture track for endHold
  
  // Update hold state (called every UPDATE_INTERVAL while holding)
  const updateHoldState = useCallback(() => {
    if (!holdStartTime.current) return;
    
    const elapsed = (Date.now() - holdStartTime.current) / 1000;
    
    if (!hasEnteredSelectionMode.current) {
      // Check if we've passed activation delay
      if (elapsed >= ACTIVATION_DELAY) {
        hasEnteredSelectionMode.current = true;
        setHighlightedMode(startingModeIndex.current);
        setHighlightBrightness(1.0);
        
        if (activeTrack && onActivation) {
          const mode = INTERVAL_MODE_ORDER[startingModeIndex.current];
          onActivation(activeTrack, mode);
        }
      }
    } else {
      // Calculate which step we're on
      const timeSinceActivation = elapsed - ACTIVATION_DELAY;
      const newStep = Math.floor(timeSinceActivation / STEP_INTERVAL);
      
      if (newStep !== currentStep.current && newStep > 0) {
        currentStep.current = newStep;
        
        // Cycle through modes
        const newModeIndex = (startingModeIndex.current + newStep) % MODE_COUNT;
        setHighlightedMode(newModeIndex);
        setIsConfirmed(true);  // Confirmed after first step
        
        if (activeTrack && onModePreview) {
          const mode = INTERVAL_MODE_ORDER[newModeIndex];
          onModePreview(activeTrack, mode);
        }
      }
      
      // Pulse brightness for visual feedback
      const pulsePhase = timeSinceActivation % STEP_INTERVAL;
      const normalizedPhase = pulsePhase / STEP_INTERVAL;
      setHighlightBrightness(0.7 + 0.3 * (1.0 - normalizedPhase));
    }
  }, [activeTrack, onActivation, onModePreview]);
  
  // Begin hold gesture
  const beginHold = useCallback((track: TrackType, currentMode: IntervalModeType) => {
    // Reset state
    if (updateTimer.current) {
      clearInterval(updateTimer.current);
    }
    
    setActiveTrack(track);
    activeTrackRef.current = track;  // Capture in ref for endHold
    holdStartTime.current = Date.now();
    hasEnteredSelectionMode.current = false;
    currentStep.current = 0;
    startingModeIndex.current = INTERVAL_MODE_ORDER.indexOf(currentMode);
    setWasQuickTap(false);
    setIsConfirmed(false);
    setHighlightedMode(null);
    setHighlightBrightness(0);
    
    console.log('[IntervalModeSelection] beginHold:', track, currentMode);
    
    // Start update timer
    updateTimer.current = setInterval(updateHoldState, UPDATE_INTERVAL * 1000);
  }, [updateHoldState]);
  
  // End hold gesture
  const endHold = useCallback(() => {
    const track = activeTrackRef.current;
    
    if (updateTimer.current) {
      clearInterval(updateTimer.current);
      updateTimer.current = null;
    }
    
    // Allow confirmation even if only activated (not just after first step)
    const shouldConfirm = hasEnteredSelectionMode.current && highlightedMode !== null;
    
    if (shouldConfirm && track && onModeConfirmed) {
      // Confirmed - apply the selected mode
      const mode = INTERVAL_MODE_ORDER[highlightedMode];
      console.log('[IntervalModeSelection] Confirming mode:', track, mode);
      onModeConfirmed(track, mode);
    } else if (hasEnteredSelectionMode.current && track && onCancelled) {
      // Entered selection but released before confirmation
      onCancelled(track);
    } else {
      // Quick tap - didn't enter selection mode
      setWasQuickTap(true);
    }
    
    // Fade out or reset
    if (hasEnteredSelectionMode.current) {
      // Animate fade out
      let step = 0;
      const fadeSteps = 10;
      const fadeInterval = setInterval(() => {
        step++;
        setHighlightBrightness(1.0 - step / fadeSteps);
        
        if (step >= fadeSteps) {
          clearInterval(fadeInterval);
          resetState();
        }
      }, (FADE_OUT_DURATION * 1000) / fadeSteps);
    } else {
      resetState();
    }
  }, [highlightedMode, onModeConfirmed, onCancelled]);
  
  // Cancel hold without callbacks
  const cancelHold = useCallback(() => {
    if (updateTimer.current) {
      clearInterval(updateTimer.current);
      updateTimer.current = null;
    }
    resetState();
  }, []);
  
  // Reset all state
  const resetState = useCallback(() => {
    setHighlightedMode(null);
    setIsConfirmed(false);
    setActiveTrack(null);
    setHighlightBrightness(0);
    setWasQuickTap(false);
    holdStartTime.current = null;
    hasEnteredSelectionMode.current = false;
    currentStep.current = 0;
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateTimer.current) {
        clearInterval(updateTimer.current);
      }
    };
  }, []);
  
  return {
    highlightedMode,
    isConfirmed,
    activeTrack,
    highlightBrightness,
    wasQuickTap,
    beginHold,
    endHold,
    cancelHold
  };
}
