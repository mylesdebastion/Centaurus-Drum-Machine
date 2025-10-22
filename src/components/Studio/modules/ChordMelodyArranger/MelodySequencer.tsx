/**
 * MelodySequencer Component
 * Epic 15 - Story 15.3: Melody Arranger Component
 *
 * 16-step piano roll sequencer with scale-aware note filtering.
 * Syncs playback with chord progression timeline at 60fps.
 *
 * Features:
 * - 16-step horizontal grid (time axis)
 * - 2-octave vertical pitch range (filtered to current scale)
 * - Click/tap to toggle notes on/off
 * - Audio playback via Tone.js melody synth
 * - Real-time playback cursor animation
 * - Auto-filter notes on key/scale change
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Trash2, AlertCircle, Undo2, Wand2, Settings, Info, Volume2, ChevronDown, Sparkles, Square } from 'lucide-react';
import { useGlobalMusic } from '@/contexts/GlobalMusicContext';
import { getNoteColor } from '@/utils/colorMapping';
import { IntelligentMelodyService, type IntelligentMelodySettings } from '@/services/intelligentMelodyService';
import { createSoundEngine, SoundEngine, SoundEngineType, soundEngineNames } from '@/utils/soundEngines';
import type { Chord } from '@/types/chordProgression';

/**
 * MelodyNote interface
 * Represents a single note in the melody sequence
 */
export interface MelodyNote {
  step: number;        // 0-63 (64 steps across 4 pages) - Story 15.9
  pitch: number;       // MIDI note number (21-108)
  velocity: number;    // 0-127
  duration: number;    // In beats (0.25 = 1/16th note, can be > 0.25 for tied/sustained notes)
  tiedSteps?: number;  // Number of grid cells this note spans (for visual rendering of sustained notes)
}

export interface MelodySequencerProps {
  playbackPosition: number; // 0-1 (normalized position through sequence)
  isPlaying: boolean;
  tempo: number;
  stepDuration: number; // Story 15.9: Duration of each step in beats (0.25 = 16th, 0.5 = 8th, 1 = quarter, 2 = half, 4 = whole)
  setStepDuration?: (duration: number) => void; // Allow MelodySequencer to control step duration
  onNoteEvent?: (note: MelodyNote) => void; // For module routing (Story 15.4)
  instanceId?: string; // Module instance ID for routing
  outputTargets?: string[]; // Connected output modules
  currentChord?: Chord | null; // Active chord from ChordTimeline (Story 15.7)
  romanNumeral?: string; // Current Roman numeral (for educational display)
}

/**
 * Calculate scale notes for the given key and scale
 * Returns MIDI note numbers for 2 octaves in descending order (for UI display)
 */
function calculateScaleNotes(key: string, scale: string, octaves: number): number[] {
  // Scale intervals (semitones from root)
  const scaleIntervals: Record<string, number[]> = {
    'major': [0, 2, 4, 5, 7, 9, 11],
    'minor': [0, 2, 3, 5, 7, 8, 10],
    'dorian': [0, 2, 3, 5, 7, 9, 10],
    'phrygian': [0, 1, 3, 5, 7, 8, 10],
    'lydian': [0, 2, 4, 6, 7, 9, 11],
    'mixolydian': [0, 2, 4, 5, 7, 9, 10],
    'locrian': [0, 1, 3, 5, 6, 8, 10],
    'harmonic_minor': [0, 2, 3, 5, 7, 8, 11],
    'melodic_minor': [0, 2, 3, 5, 7, 9, 11],
    'pentatonic_major': [0, 2, 4, 7, 9],
    'pentatonic_minor': [0, 3, 5, 7, 10],
    'blues': [0, 3, 5, 6, 7, 10],
    'chromatic': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  };

  // Root note MIDI numbers (C4 = 60)
  const rootNotes: Record<string, number> = {
    'C': 60, 'C#': 61, 'Db': 61, 'D': 62, 'D#': 63, 'Eb': 63,
    'E': 64, 'F': 65, 'F#': 66, 'Gb': 66, 'G': 67, 'G#': 68,
    'Ab': 68, 'A': 69, 'A#': 70, 'Bb': 70, 'B': 71
  };

  const rootMidi = rootNotes[key] || 60; // Default to C4
  const intervals = scaleIntervals[scale.toLowerCase()] || scaleIntervals['major'];

  const notes: number[] = [];
  for (let octave = 0; octave < octaves; octave++) {
    intervals.forEach(interval => {
      notes.push(rootMidi + (octave * 12) + interval);
    });
  }

  return notes.sort((a, b) => a - b); // Ascending order (low notes = lower indices)
}

/**
 * Get note name from MIDI number (e.g., 60 → "C4")
 */
function getNoteNameFromMidi(midiNote: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midiNote / 12) - 1;
  const noteName = noteNames[midiNote % 12];
  return `${noteName}${octave}`;
}

export const MelodySequencer: React.FC<MelodySequencerProps> = ({
  playbackPosition,
  isPlaying,
  tempo: _tempo,
  stepDuration,
  setStepDuration,
  onNoteEvent,
  instanceId: _instanceId = 'melody-sequencer',
  outputTargets: _outputTargets = [],
  currentChord = null,
  romanNumeral = '',
}) => {
  const { key, scale, colorMode } = useGlobalMusic();
  const melodyService = IntelligentMelodyService.getInstance();

  const [notes, setNotes] = useState<MelodyNote[]>([]);
  const [visibleNotes, setVisibleNotes] = useState<number[]>([]);
  const [scaleNotes, setScaleNotes] = useState<number[]>([]);
  const lastStepRef = useRef<number>(-1);
  const soundEngineRef = useRef<SoundEngine | null>(null);
  const audioContextRef = useRef<AudioContext>();
  const masterGainRef = useRef<GainNode>();

  // Sound engine selection
  const [selectedSoundEngine, setSelectedSoundEngine] = useState<SoundEngineType>('keys');
  const [showSoundMenu, setShowSoundMenu] = useState(false);
  const [showGenerateMenu, setShowGenerateMenu] = useState(false);

  // Story 15.9: Multi-page sequencer state
  const [currentPage, setCurrentPage] = useState<number>(0); // 0-3 (pages 1-4)
  const [activePages, setActivePages] = useState<boolean[]>([true, false, false, false]); // Page 1 active by default
  const [generateScope, setGenerateScope] = useState<'current' | 'all'>('current'); // Current page or all active pages
  const STEPS_PER_PAGE = 16;
  const TOTAL_PAGES = 4;

  // Drag state for note tying/sustain (click + drag to create long notes)
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    startStep: number;
    startPitch: number;
    currentStep: number;
  } | null>(null);

  // Intelligent melody settings (Story 15.7)
  const [settings, setSettings] = useState<IntelligentMelodySettings>(
    IntelligentMelodyService.getDefaultSettings()
  );
  const [showSettings, setShowSettings] = useState(false);
  const [showHarmonicGuidance, setShowHarmonicGuidance] = useState(true);

  // Auto-melody generation state
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const autoGenerateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sparkle animation state (moth flying to the light)
  const [sparkleParticles, setSparkleParticles] = useState<Array<{
    id: number;
    fromStep: number;
    fromPitch: number;
    toStep: number;
    toPitch: number;
    progress: number; // 0-1
    startTime: number;
    duration: number; // Animation duration in milliseconds (synced to step duration)
  }>>([]);
  const sparkleAnimationRef = useRef<number | null>(null);

  // Inline warning state (anti-modal pattern)
  const [outOfScaleWarning, setOutOfScaleWarning] = useState<{
    count: number;
    key: string;
    scale: string;
    removedNotes: MelodyNote[];
  } | null>(null);

  // Undo state for clear operation (toast pattern)
  const [clearUndoState, setClearUndoState] = useState<{
    notes: MelodyNote[];
    timestamp: number;
  } | null>(null);

  // Initialize audio context and sound engine on mount
  useEffect(() => {
    audioContextRef.current = new AudioContext();
    masterGainRef.current = audioContextRef.current.createGain();
    masterGainRef.current.connect(audioContextRef.current.destination);
    masterGainRef.current.gain.value = 0.5;

    // Initialize sound engine
    if (audioContextRef.current && masterGainRef.current) {
      soundEngineRef.current = createSoundEngine(selectedSoundEngine, audioContextRef.current, masterGainRef.current);
      console.log('[MelodySequencer] Sound engine initialized:', selectedSoundEngine);
    }

    return () => {
      soundEngineRef.current?.dispose();
      audioContextRef.current?.close();
    };
  }, []);

  // Update sound engine when selection changes
  useEffect(() => {
    if (!audioContextRef.current || !masterGainRef.current) return;

    // Dispose old engine
    soundEngineRef.current?.dispose();

    // Create new engine
    soundEngineRef.current = createSoundEngine(selectedSoundEngine, audioContextRef.current, masterGainRef.current);
    console.log('[MelodySequencer] Switched to sound engine:', selectedSoundEngine);
  }, [selectedSoundEngine]);

  // Calculate scale notes when key/scale changes (2 octaves)
  useEffect(() => {
    const calculatedScaleNotes = calculateScaleNotes(key, scale, 2);
    setVisibleNotes(calculatedScaleNotes);

    // Store full scale notes (all octaves) for brightness calculations
    const fullScaleNotes: number[] = [];
    for (let octave = 0; octave < 10; octave++) {
      calculatedScaleNotes.forEach(note => {
        const noteClass = note % 12;
        fullScaleNotes.push(noteClass + (octave * 12));
      });
    }
    setScaleNotes(fullScaleNotes);

    // Check for out-of-scale notes - Show inline warning (anti-modal pattern)
    const outOfScaleNotes = notes.filter(note => !calculatedScaleNotes.includes(note.pitch));

    if (outOfScaleNotes.length > 0) {
      // Show inline warning instead of blocking modal
      setOutOfScaleWarning({
        count: outOfScaleNotes.length,
        key,
        scale,
        removedNotes: [],
      });
    } else {
      setOutOfScaleWarning(null);
    }
  }, [key, scale, notes]);

  // Auto-dismiss out-of-scale warning after 10 seconds
  useEffect(() => {
    if (!outOfScaleWarning) return;

    const timeout = setTimeout(() => {
      setOutOfScaleWarning(null);
    }, 10000);

    return () => clearTimeout(timeout);
  }, [outOfScaleWarning]);

  // Auto-dismiss clear undo state after 5 seconds
  useEffect(() => {
    if (!clearUndoState) return;

    const timeout = setTimeout(() => {
      setClearUndoState(null);
    }, 5000);

    return () => clearTimeout(timeout);
  }, [clearUndoState]);

  // Step triggering logic - Fires when playback crosses step boundaries
  // Story 15.9: 64-step sequencer loops based on stepDuration setting
  useEffect(() => {
    if (!isPlaying) {
      lastStepRef.current = -1;
      return;
    }

    // Calculate loop position based on step duration
    // Total sequence duration = (number of active steps) × stepDuration × secondsPerBeat
    const secondsPerBeat = 60 / _tempo;
    const progressionDuration = 8 * 4 * secondsPerBeat; // Full 8-bar progression = 32 beats

    // Calculate effective loop length based on active pages
    const activePageCount = activePages.filter(active => active).length;
    const totalActiveSteps = activePageCount * STEPS_PER_PAGE;
    const sequencerDuration = totalActiveSteps * stepDuration * secondsPerBeat; // Total sequence duration in seconds

    // How many times does the sequencer loop fit in the full progression?
    const loopsPerProgression = progressionDuration / sequencerDuration;

    // Map playback position to sequencer loop position (0-1)
    const loopedPosition = (playbackPosition * loopsPerProgression) % 1;

    // Map to step index (0-63) but only within active pages
    const rawStep = Math.floor(loopedPosition * totalActiveSteps);

    // Convert raw step to actual page + step by skipping inactive pages
    let currentStep = 0;
    let activePagesSeen = 0;
    for (let pageIndex = 0; pageIndex < TOTAL_PAGES; pageIndex++) {
      if (activePages[pageIndex]) {
        if (activePagesSeen * STEPS_PER_PAGE + STEPS_PER_PAGE > rawStep) {
          currentStep = pageIndex * STEPS_PER_PAGE + (rawStep - activePagesSeen * STEPS_PER_PAGE);
          break;
        }
        activePagesSeen++;
      }
    }

    // Only trigger if we've moved to a new step
    if (currentStep !== lastStepRef.current) {
      lastStepRef.current = currentStep;

      // Find all notes at the current step
      const stepNotes = notes.filter(n => n.step === currentStep);

      // Play each note
      stepNotes.forEach(note => {
        scheduleNote(note);
        onNoteEvent?.(note); // Emit for module routing (Story 15.4)
      });
    }
  }, [playbackPosition, isPlaying, notes, onNoteEvent, stepDuration, _tempo, activePages, STEPS_PER_PAGE, TOTAL_PAGES]);

  // Schedule note playback via sound engine
  const scheduleNote = useCallback((note: MelodyNote) => {
    const soundEngine = soundEngineRef.current;
    if (!soundEngine) return;

    try {
      const frequency = 440 * Math.pow(2, (note.pitch - 69) / 12); // MIDI to frequency
      const velocity = note.velocity / 127; // Normalize 0-1

      // Convert duration from beats to seconds
      const secondsPerBeat = 60 / _tempo;
      const durationInSeconds = note.duration * secondsPerBeat;

      soundEngine.playNote(frequency, velocity, durationInSeconds);
    } catch (error) {
      console.error('[MelodySequencer] Error playing note:', error);
    }
  }, [_tempo]);

  // Handle mouse down on cell - Start drag or toggle note
  const handleCellMouseDown = useCallback((pageRelativeStep: number, pitch: number) => {
    // Update last interacted pitch for dynamic brightness
    setLastInteractedPitch(pitch);

    // Convert page-relative step to absolute step (0-63)
    const absoluteStep = currentPage * STEPS_PER_PAGE + pageRelativeStep;

    // Check if clicking on existing note
    const existingNote = notes.find(n => n.step === absoluteStep && n.pitch === pitch);

    if (existingNote) {
      // Clicking existing note - remove it
      setNotes(prevNotes => prevNotes.filter(n => !(n.step === absoluteStep && n.pitch === pitch)));
    } else {
      // Start drag to create tied note
      setDragState({
        isDragging: true,
        startStep: pageRelativeStep,
        startPitch: pitch,
        currentStep: pageRelativeStep,
      });
    }
  }, [currentPage, STEPS_PER_PAGE, notes]);

  // Handle mouse enter on cell during drag
  const handleCellMouseEnter = useCallback((pageRelativeStep: number, pitch: number) => {
    if (dragState?.isDragging && pitch === dragState.startPitch) {
      // Only allow horizontal dragging on same pitch
      setDragState(prev => prev ? { ...prev, currentStep: pageRelativeStep } : null);
    }
  }, [dragState]);

  // Handle mouse up - Complete drag and create tied note
  const handleCellMouseUp = useCallback(() => {
    if (!dragState?.isDragging) return;

    const startStep = Math.min(dragState.startStep, dragState.currentStep);
    const endStep = Math.max(dragState.startStep, dragState.currentStep);
    const tiedSteps = endStep - startStep + 1; // Number of cells spanned
    const absoluteStartStep = currentPage * STEPS_PER_PAGE + startStep;

    // Remove any existing notes in the range being tied
    setNotes(prevNotes => {
      const filteredNotes = prevNotes.filter(n => {
        if (n.pitch !== dragState.startPitch) return true;
        const notePageRelativeStep = n.step - currentPage * STEPS_PER_PAGE;
        return notePageRelativeStep < startStep || notePageRelativeStep > endStep;
      });

      // Create new tied note
      const newNote: MelodyNote = {
        step: absoluteStartStep,
        pitch: dragState.startPitch,
        velocity: 100,
        duration: tiedSteps * stepDuration, // Duration = number of cells × step duration
        tiedSteps, // Store for visual rendering
      };

      // Play audio immediately
      scheduleNote(newNote);

      // Route to connected visualizers/modules
      if (onNoteEvent) {
        onNoteEvent(newNote);
      }

      return [...filteredNotes, newNote];
    });

    // Clear drag state
    setDragState(null);
  }, [dragState, currentPage, STEPS_PER_PAGE, stepDuration, scheduleNote, onNoteEvent]);

  // Remove out-of-scale notes (triggered by inline warning button)
  const removeOutOfScaleNotes = useCallback(() => {
    if (!outOfScaleWarning) return;

    const scaleNotes = calculateScaleNotes(outOfScaleWarning.key, outOfScaleWarning.scale, 2);
    const removedNotes = notes.filter(note => !scaleNotes.includes(note.pitch));

    setNotes(prevNotes => prevNotes.filter(note => scaleNotes.includes(note.pitch)));
    setOutOfScaleWarning({
      ...outOfScaleWarning,
      removedNotes, // Store for undo
    });

    // Auto-dismiss after showing undo option
    setTimeout(() => setOutOfScaleWarning(null), 5000);
  }, [outOfScaleWarning, notes]);

  // Undo out-of-scale note removal
  const undoRemoveOutOfScale = useCallback(() => {
    if (!outOfScaleWarning?.removedNotes.length) return;

    setNotes(prevNotes => [...prevNotes, ...outOfScaleWarning.removedNotes]);
    setOutOfScaleWarning(null);
  }, [outOfScaleWarning]);

  // Clear all notes with undo (toast pattern)
  const clearAllNotes = useCallback(() => {
    if (notes.length === 0) return;

    // Store notes for undo
    setClearUndoState({
      notes: [...notes],
      timestamp: Date.now(),
    });

    setNotes([]);
  }, [notes]);

  // Undo clear operation
  const undoClear = useCallback(() => {
    if (!clearUndoState) return;

    setNotes(clearUndoState.notes);
    setClearUndoState(null);
  }, [clearUndoState]);

  // Generate melodic pattern based on current key/scale
  // Story 15.9: Support generating on current page or all active pages
  const generateMelody = useCallback(() => {
    if (visibleNotes.length === 0) return;

    // Simple melodic algorithm:
    // 1. Use notes from visible scale
    // 2. Create stepwise motion with occasional leaps
    // 3. Prefer consonant intervals
    // 4. Add rhythmic variety

    const patterns = [
      // Pattern 1: Ascending scale run
      [0, 1, 2, 3, 4, 5, 6, 7],
      // Pattern 2: Arpeggiated triad (1-3-5-8)
      [0, 2, 4, 7],
      // Pattern 3: Stepwise with return
      [0, 1, 2, 1, 0, 1, 2, 3],
      // Pattern 4: Octave jumps
      [0, 7, 1, 6, 2, 5, 3, 4],
    ];

    // Determine which pages to generate on
    const pagesToGenerate = generateScope === 'current'
      ? [currentPage]
      : activePages.map((active, index) => active ? index : -1).filter(i => i >= 0);

    // Keep existing notes on pages we're not regenerating
    const existingNotes = notes.filter(note => {
      const notePage = Math.floor(note.step / STEPS_PER_PAGE);
      return !pagesToGenerate.includes(notePage);
    });

    const generatedNotes: MelodyNote[] = [...existingNotes];

    // Generate for each target page
    pagesToGenerate.forEach(pageIndex => {
      // Randomly choose a pattern for this page
      const pattern = patterns[Math.floor(Math.random() * patterns.length)];

      // Map pattern to 16 steps with rhythmic variation
      for (let pageRelativeStep = 0; pageRelativeStep < STEPS_PER_PAGE; pageRelativeStep++) {
        // Not every step has a note (create rhythmic variety)
        if (Math.random() > 0.3) { // 70% chance of note
          const patternIndex = pattern[pageRelativeStep % pattern.length];
          const noteIndex = Math.min(patternIndex, visibleNotes.length - 1);
          const pitch = visibleNotes[noteIndex];

          // Use current step duration setting for all generated notes
          const duration = stepDuration;

          // Vary velocities slightly
          const velocity = 80 + Math.floor(Math.random() * 30); // 80-110

          // Convert to absolute step
          const absoluteStep = pageIndex * STEPS_PER_PAGE + pageRelativeStep;

          generatedNotes.push({
            step: absoluteStep,
            pitch,
            velocity,
            duration,
          });
        }
      }
    });

    setNotes(generatedNotes);
  }, [visibleNotes, currentPage, generateScope, activePages, notes, STEPS_PER_PAGE]);

  // Calculate current step for visual indicator (Story 15.9)
  // Maps playback position to absolute step based on active pages
  const currentStepInfo = useMemo(() => {
    const secondsPerBeat = 60 / _tempo;
    const progressionDuration = 8 * 4 * secondsPerBeat; // 8 bars = 32 beats

    // Calculate based on active pages
    const activePageCount = activePages.filter(active => active).length;
    const totalActiveSteps = activePageCount * STEPS_PER_PAGE;
    const sequencerDuration = totalActiveSteps * stepDuration * secondsPerBeat; // Total sequence duration in seconds
    const loopsPerProgression = progressionDuration / sequencerDuration;
    const loopedPosition = (playbackPosition * loopsPerProgression) % 1;

    // Calculate continuous step position (for smooth cursor animation)
    const continuousStep = loopedPosition * totalActiveSteps;
    const rawStep = Math.floor(continuousStep);
    const fractionalProgress = continuousStep - rawStep; // 0-1 progress within current step

    // Convert raw step to actual page + step by skipping inactive pages
    let absoluteStep = 0;
    let pageRelativeStep = 0;
    let playbackPage = 0;
    let activePagesSeen = 0;

    for (let pageIndex = 0; pageIndex < TOTAL_PAGES; pageIndex++) {
      if (activePages[pageIndex]) {
        if (activePagesSeen * STEPS_PER_PAGE + STEPS_PER_PAGE > rawStep) {
          absoluteStep = pageIndex * STEPS_PER_PAGE + (rawStep - activePagesSeen * STEPS_PER_PAGE);
          pageRelativeStep = rawStep - activePagesSeen * STEPS_PER_PAGE;
          playbackPage = pageIndex;
          break;
        }
        activePagesSeen++;
      }
    }

    return {
      absoluteStep,
      pageRelativeStep,
      playbackPage,
      fractionalProgress, // 0-1 smooth progress within current step
    };
  }, [playbackPosition, stepDuration, _tempo, STEPS_PER_PAGE, activePages, TOTAL_PAGES]);

  // Track last interacted note (placed or hovered) for dynamic brightness
  const [lastInteractedPitch, setLastInteractedPitch] = useState<number | null>(null);
  const [lastInteractedStep, setLastInteractedStep] = useState<number | null>(null);
  // Track hovered cell for white border on specific note
  const [hoveredCell, setHoveredCell] = useState<{ step: number; pitch: number } | null>(null);

  // Get last placed note pitch (for passing tone logic)
  const lastPlacedPitch = useMemo(() => {
    if (notes.length === 0) return null;
    const sortedNotes = [...notes].sort((a, b) => b.step - a.step);
    return sortedNotes[0]?.pitch || null;
  }, [notes]);

  // Educational feedback message
  const settingsFeedback = useMemo(() => {
    return melodyService.getSettingsFeedbackMessage(settings);
  }, [settings, melodyService]);

  // Add global mouse up listener for drag completion
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      handleCellMouseUp();
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [handleCellMouseUp]);

  /**
   * Pick a starting note based on scale degree weights
   * Priority: Root (1), 5th (5), 4th (4), 7th (7), 3rd (3), 6th (6), 2nd (2)
   */
  const pickStartingNote = useCallback((): MelodyNote => {
    if (visibleNotes.length === 0) {
      throw new Error('No visible notes available');
    }

    // Scale degree weights (0-indexed, so degree 0 = root)
    // Root=5, 5th=4, 4th=3, 7th=2.5, 3rd=2, 6th=1.5, 2nd=1
    const degreeWeights = [5, 1, 2, 1.5, 3, 4, 1.5, 2.5]; // For 7-note scales

    // Calculate weighted probabilities for each visible note
    const weightedNotes = visibleNotes.map((pitch, index) => {
      const scaleDegree = index % degreeWeights.length;
      const weight = degreeWeights[scaleDegree];
      return { pitch, weight };
    });

    // Pick random note based on weights
    const totalWeight = weightedNotes.reduce((sum, n) => sum + n.weight, 0);
    let random = Math.random() * totalWeight;
    let selectedPitch = weightedNotes[0].pitch;

    for (const note of weightedNotes) {
      random -= note.weight;
      if (random <= 0) {
        selectedPitch = note.pitch;
        break;
      }
    }

    // Create starting note at step 0 of current page
    const startingNote: MelodyNote = {
      step: currentPage * STEPS_PER_PAGE,
      pitch: selectedPitch,
      velocity: 90 + Math.floor(Math.random() * 20), // 90-110
      duration: stepDuration,
    };

    console.log('[Auto-Melody] Picked starting note:', getNoteNameFromMidi(selectedPitch), 'at step', startingNote.step);
    return startingNote;
  }, [visibleNotes, currentPage, STEPS_PER_PAGE, stepDuration]);

  /**
   * Auto-melody generation - Intelligently walks through harmonic suggestions
   * Two modes:
   * 1. Playing mode: Continuously overwrites, loops back to start when reaching end
   * 2. Paused mode: Generates once from start to end, then stays there
   */
  const startAutoMelodyGeneration = useCallback(() => {
    if (isAutoGenerating) return;
    if (visibleNotes.length === 0) return; // Need scale notes

    console.log('[Auto-Melody] Starting generation, isPlaying:', isPlaying);
    setIsAutoGenerating(true);

    // Create or use existing starting note
    let lastNote: MelodyNote;
    const existingNotes = notes.filter(n => {
      const pageRelativeStep = n.step - currentPage * STEPS_PER_PAGE;
      return pageRelativeStep >= 0 && pageRelativeStep < STEPS_PER_PAGE;
    });

    if (existingNotes.length > 0 && !isPlaying) {
      // Paused mode: Continue from last note on current page
      const sortedNotes = [...existingNotes].sort((a, b) => b.step - a.step);
      lastNote = sortedNotes[0];
      console.log('[Auto-Melody] Paused mode: Continuing from existing note');
    } else {
      // Playing mode OR no existing notes: Start from beginning with weighted random note
      lastNote = pickStartingNote();

      // Clear all notes on current page if in playing mode
      if (isPlaying) {
        setNotes(prevNotes => prevNotes.filter(n => {
          const notePage = Math.floor(n.step / STEPS_PER_PAGE);
          return notePage !== currentPage;
        }));
      }

      // Add starting note
      setNotes(prevNotes => [...prevNotes, lastNote]);
      scheduleNote(lastNote);
      if (onNoteEvent) onNoteEvent(lastNote);

      console.log('[Auto-Melody] Starting from new note:', lastNote);
    }

    const generateNextNote = () => {
      console.log('[Auto-Melody] generateNextNote called, lastNote:', lastNote);

      // Check if the last note is on the current page
      const lastNotePageRelativeStep = lastNote.step - currentPage * STEPS_PER_PAGE;

      // If the last note is not on the current page, stop generation
      if (lastNotePageRelativeStep < 0 || lastNotePageRelativeStep >= STEPS_PER_PAGE) {
        console.log('[Auto-Melody] Last note not on current page, stopping');
        setIsAutoGenerating(false);
        if (autoGenerateIntervalRef.current) {
          clearInterval(autoGenerateIntervalRef.current);
          autoGenerateIntervalRef.current = null;
        }
        return;
      }

      let nextStep = lastNotePageRelativeStep + 1;
      console.log('[Auto-Melody] Next step:', nextStep);

      // If we've reached the end of the current page
      if (nextStep >= STEPS_PER_PAGE) {
        console.log('[Auto-Melody] Reached end of page');

        // Paused mode: Stop generation when reaching the end
        if (!isPlaying) {
          console.log('[Auto-Melody] Paused mode: Stopping at end of page');
          setIsAutoGenerating(false);
          if (autoGenerateIntervalRef.current) {
            clearInterval(autoGenerateIntervalRef.current);
            autoGenerateIntervalRef.current = null;
          }
          return;
        }

        // Playing mode: Loop back to beginning
        console.log('[Auto-Melody] Playing mode: Looping back to start');
        nextStep = 0; // Reset to first step

        // Clear all notes on current page and start fresh
        setNotes(prevNotes => prevNotes.filter(n => {
          const notePage = Math.floor(n.step / STEPS_PER_PAGE);
          return notePage !== currentPage;
        }));

        // Pick new starting note
        lastNote = pickStartingNote();
        setNotes(prevNotes => [...prevNotes, lastNote]);
        scheduleNote(lastNote);
        if (onNoteEvent) onNoteEvent(lastNote);

        console.log('[Auto-Melody] Restarted from new note:', lastNote);
        return; // Wait for next interval to continue from new starting note
      }

      const nextAbsoluteStep = currentPage * STEPS_PER_PAGE + nextStep;

      // Check if there's already a note at this step (skip it)
      const existingNoteAtStep = notes.some(n => n.step === nextAbsoluteStep);
      if (existingNoteAtStep) {
        // Find the note at this step to continue from
        const noteAtStep = notes.find(n => n.step === nextAbsoluteStep);
        if (noteAtStep) {
          lastNote = noteAtStep;
        }
        return;
      }

      // Calculate brightness for all visible notes at this step
      const suggestions: { pitch: number; brightness: number }[] = visibleNotes.map(pitch => {
        // Calculate diagonal stagger position
        const pitchDistance = Math.abs(pitch - lastNote.pitch);
        let timeOffset = 0;
        if (pitchDistance >= 6) {
          timeOffset = 2;
        } else if (pitchDistance >= 3) {
          timeOffset = 1;
        }

        const forwardStepOffset = pitch > lastNote.pitch ? timeOffset : -timeOffset;
        const backwardStepOffset = pitch < lastNote.pitch ? timeOffset : -timeOffset;

        const forwardExpectedStep = lastNotePageRelativeStep + forwardStepOffset;
        const backwardExpectedStep = lastNotePageRelativeStep + backwardStepOffset;

        const isForwardClose = Math.abs(nextStep - forwardExpectedStep) <= 1;
        const isBackwardClose = Math.abs(nextStep - backwardExpectedStep) <= 1;
        const isTemporallyClose = isForwardClose || isBackwardClose;

        // Only consider notes that are within the diagonal pattern
        if (!isTemporallyClose) {
          return { pitch, brightness: 0 };
        }

        // Calculate harmonic brightness
        const brightness = melodyService.calculateNoteBrightness(
          pitch,
          nextAbsoluteStep,
          currentChord,
          scaleNotes,
          settings,
          lastNote.pitch,
          false
        );

        // Apply distance-based dimming
        let proximityMultiplier = 1.0;
        if (pitchDistance >= 6) {
          proximityMultiplier = 0.75;
        } else if (pitchDistance >= 3) {
          proximityMultiplier = 0.85;
        }

        // Penalize same pitch (repetitive notes)
        const isSamePitch = pitch === lastNote.pitch;
        const finalBrightness = isSamePitch ? brightness * proximityMultiplier * 0.5 : brightness * proximityMultiplier;

        return { pitch, brightness: finalBrightness };
      });

      // Log all suggestions with their brightness values
      const sortedSuggestions = [...suggestions].sort((a, b) => b.brightness - a.brightness);
      console.log('[Auto-Melody] Top 5 suggestions:', sortedSuggestions.slice(0, 5));

      // Filter to only bright suggestions (above threshold)
      // Using 0.4 threshold instead of 0.6 to be less restrictive
      const brightSuggestions = suggestions.filter(s => s.brightness >= 0.4);
      console.log('[Auto-Melody] Bright suggestions (>= 0.4):', brightSuggestions.length, 'out of', suggestions.length);

      if (brightSuggestions.length === 0) {
        // No good suggestions, stop generation
        console.log('[Auto-Melody] No bright suggestions found, stopping');
        setIsAutoGenerating(false);
        if (autoGenerateIntervalRef.current) {
          clearInterval(autoGenerateIntervalRef.current);
          autoGenerateIntervalRef.current = null;
        }
        return;
      }

      // Pick a random note from the brightest suggestions (weighted by brightness)
      const totalBrightness = brightSuggestions.reduce((sum, s) => sum + s.brightness, 0);
      let random = Math.random() * totalBrightness;
      let selectedPitch = brightSuggestions[0].pitch;

      for (const suggestion of brightSuggestions) {
        random -= suggestion.brightness;
        if (random <= 0) {
          selectedPitch = suggestion.pitch;
          break;
        }
      }

      // Create the new note
      const newNote: MelodyNote = {
        step: nextAbsoluteStep,
        pitch: selectedPitch,
        velocity: 90 + Math.floor(Math.random() * 20), // 90-110
        duration: stepDuration,
      };

      console.log('[Auto-Melody] Created new note:', newNote);

      // Create sparkle trail animation from last note to new note
      // lastNotePageRelativeStep already calculated above
      const newNotePageRelativeStep = newNote.step - currentPage * STEPS_PER_PAGE;

      // Calculate animation duration based on step timing (sync to musical tempo)
      const secondsPerBeat = 60 / _tempo;
      const intervalMs = stepDuration * secondsPerBeat * 1000;

      // Create trail of sparkle particles crossing intermediate notes
      // Calculate total distance (Manhattan distance: steps + pitch)
      const stepDistance = Math.abs(newNotePageRelativeStep - lastNotePageRelativeStep);
      const pitchDistance = Math.abs(newNote.pitch - lastNote.pitch);
      const totalDistance = stepDistance + pitchDistance;

      // Create multiple sparkle particles along the path
      // More particles for longer distances, minimum 3, maximum 8
      const numParticles = Math.max(3, Math.min(8, Math.ceil(totalDistance / 2)));

      const now = performance.now();
      const newParticles = Array.from({ length: numParticles }, (_, i) => ({
        id: now + i, // Unique ID for each particle
        fromStep: lastNotePageRelativeStep,
        fromPitch: lastNote.pitch,
        toStep: newNotePageRelativeStep,
        toPitch: newNote.pitch,
        progress: 0,
        startTime: now + (i * intervalMs * 0.15), // Stagger start times (15% of interval per particle)
        duration: intervalMs, // All particles take same duration once started
      }));

      setSparkleParticles(prev => [...prev, ...newParticles]);

      // Add note to the sequence
      setNotes(prevNotes => [...prevNotes, newNote]);

      // Play the note immediately
      scheduleNote(newNote);

      // Route to output
      if (onNoteEvent) {
        onNoteEvent(newNote);
      }

      // Update last note for next iteration
      lastNote = newNote;
      console.log('[Auto-Melody] Updated lastNote for next iteration:', lastNote);
    };

    // Generate notes in sync with step duration (moth drawn to the light)
    // Calculate interval based on step duration and tempo
    const secondsPerBeat = 60 / _tempo;
    const intervalMs = stepDuration * secondsPerBeat * 1000; // Convert to milliseconds
    console.log('[Auto-Melody] Generation interval:', intervalMs, 'ms (based on step duration:', stepDuration, 'beats @ tempo:', _tempo, 'BPM)');

    autoGenerateIntervalRef.current = setInterval(generateNextNote, intervalMs);
  }, [isAutoGenerating, notes, currentPage, STEPS_PER_PAGE, visibleNotes, melodyService, currentChord, scaleNotes, settings, stepDuration, scheduleNote, onNoteEvent, _tempo]);

  /**
   * Stop auto-melody generation
   */
  const stopAutoMelodyGeneration = useCallback(() => {
    setIsAutoGenerating(false);
    if (autoGenerateIntervalRef.current) {
      clearInterval(autoGenerateIntervalRef.current);
      autoGenerateIntervalRef.current = null;
    }
    // Clear sparkle particles
    setSparkleParticles([]);
  }, []);

  // Sparkle animation loop - Updates particle positions
  useEffect(() => {
    if (sparkleParticles.length === 0) return;

    const animateSparkles = () => {
      const now = performance.now();

      setSparkleParticles(prevParticles => {
        const updatedParticles = prevParticles.map(particle => {
          const elapsed = now - particle.startTime;
          // Use particle-specific duration (synced to step timing)
          const progress = Math.min(elapsed / particle.duration, 1);

          return { ...particle, progress };
        }).filter(particle => particle.progress < 1); // Remove completed particles

        return updatedParticles;
      });

      if (sparkleParticles.some(p => p.progress < 1)) {
        sparkleAnimationRef.current = requestAnimationFrame(animateSparkles);
      }
    };

    sparkleAnimationRef.current = requestAnimationFrame(animateSparkles);

    return () => {
      if (sparkleAnimationRef.current) {
        cancelAnimationFrame(sparkleAnimationRef.current);
      }
    };
  }, [sparkleParticles.length]); // Re-run when particles are added

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (autoGenerateIntervalRef.current) {
        clearInterval(autoGenerateIntervalRef.current);
      }
      if (sparkleAnimationRef.current) {
        cancelAnimationFrame(sparkleAnimationRef.current);
      }
    };
  }, []);

  return (
    <div className="relative bg-gray-800 rounded-lg border border-gray-700 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Melody Sequencer (64 steps)</h3>
          {currentChord && romanNumeral && (
            <p className="text-xs text-gray-400 mt-0.5">
              Current chord: {romanNumeral} ({currentChord.name})
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </span>

          {/* Sound Engine Selector */}
          <div className="relative">
            <button
              onClick={() => setShowSoundMenu(!showSoundMenu)}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium rounded-lg transition-colors min-h-[44px]"
              aria-label="Select sound engine"
            >
              <Volume2 className="w-4 h-4" />
              {soundEngineNames[selectedSoundEngine]}
              <span className="text-xs">▼</span>
            </button>

            {showSoundMenu && (
              <div className="absolute top-full mt-2 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50">
                {(Object.keys(soundEngineNames) as SoundEngineType[]).map((engineType) => (
                  <button
                    key={engineType}
                    onClick={() => {
                      setSelectedSoundEngine(engineType);
                      setShowSoundMenu(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                      selectedSoundEngine === engineType
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {soundEngineNames[engineType]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Step Duration Controls */}
          {setStepDuration && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">Step:</span>
              {[
                { value: 0.125, label: '32nd' },
                { value: 0.25, label: '16th' },
                { value: 0.5, label: '8th' },
                { value: 1, label: 'Quarter' },
                { value: 2, label: 'Half' },
                { value: 4, label: 'Whole' }
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setStepDuration(value)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors min-h-[36px] ${
                    stepDuration === value
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  aria-label={`${label} note step duration`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => setShowHarmonicGuidance(!showHarmonicGuidance)}
            className={`p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
              showHarmonicGuidance
                ? 'bg-primary-600 hover:bg-primary-700 text-white'
                : 'hover:bg-gray-700 text-gray-400'
            }`}
            aria-label="Toggle harmonic guidance"
            title="Toggle harmonic guidance (brightness suggestions)"
          >
            <Info className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Toggle settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Auto-Melody Generation Button (Moth drawn to the light) */}
          <button
            onClick={isAutoGenerating ? stopAutoMelodyGeneration : startAutoMelodyGeneration}
            className={`p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
              isAutoGenerating
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
            aria-label={isAutoGenerating ? 'Stop auto-melody generation' : 'Start auto-melody generation (moth to the light)'}
            title={
              isAutoGenerating
                ? 'Stop auto-melody generation'
                : 'Moth to the Light - Auto-generate melody with intelligent weighted starting note selection'
            }
          >
            {isAutoGenerating ? <Square className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          </button>

          {/* Generate Button with Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                generateMelody();
                setShowGenerateMenu(false);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded-lg transition-colors min-h-[44px]"
              aria-label={`Generate melody on ${generateScope === 'current' ? 'current page' : 'all active pages'}`}
            >
              <Wand2 className="w-4 h-4" />
              Generate ({generateScope === 'current' ? 'Current' : 'All Active'})
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowGenerateMenu(!showGenerateMenu);
                }}
                className="ml-1 hover:bg-primary-800 rounded p-0.5 transition-colors"
                aria-label="Toggle generation scope"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </button>

            {showGenerateMenu && (
              <div className="absolute top-full mt-2 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50 min-w-[180px]">
                <button
                  onClick={() => {
                    setGenerateScope('current');
                    setShowGenerateMenu(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                    generateScope === 'current'
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Current Page
                </button>
                <button
                  onClick={() => {
                    setGenerateScope('all');
                    setShowGenerateMenu(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                    generateScope === 'all'
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  All Active Pages
                </button>
              </div>
            )}
          </div>
          <button
            onClick={clearAllNotes}
            disabled={notes.length === 0}
            className="p-2 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Clear all notes"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Page Navigation (Story 15.9) */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-gray-400">Page:</span>
        {Array.from({ length: TOTAL_PAGES }, (_, pageIndex) => {
          // Check if this page has any notes
          const pageStartStep = pageIndex * STEPS_PER_PAGE;
          const pageEndStep = pageStartStep + STEPS_PER_PAGE;
          const hasNotes = notes.some(note =>
            note.step >= pageStartStep && note.step < pageEndStep
          );

          // Check if playback is on this page
          const isPlayingPage = currentStepInfo.playbackPage === pageIndex && isPlaying;
          const isActive = activePages[pageIndex];

          return (
            <div key={pageIndex} className="flex flex-col items-center gap-1">
              {/* Active/inactive toggle */}
              <button
                onClick={() => {
                  const newActivePages = [...activePages];
                  newActivePages[pageIndex] = !newActivePages[pageIndex];
                  setActivePages(newActivePages);
                }}
                className={`w-3 h-3 rounded-full border-2 transition-colors ${
                  isActive
                    ? 'bg-green-500 border-green-500'
                    : 'bg-transparent border-gray-500'
                }`}
                aria-label={`Toggle page ${pageIndex + 1} ${isActive ? 'inactive' : 'active'}`}
                title={isActive ? 'Page active (click to disable)' : 'Page inactive (click to enable)'}
              />
              {/* Page select button */}
              <button
                onClick={() => setCurrentPage(pageIndex)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors min-h-[32px] min-w-[32px] ${
                  currentPage === pageIndex
                    ? 'bg-primary-600 text-white'
                    : hasNotes
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                } ${isPlayingPage ? 'ring-2 ring-green-500' : ''} ${!isActive ? 'opacity-50' : ''}`}
                aria-label={`Page ${pageIndex + 1}`}
              >
                {pageIndex + 1}
              </button>
            </div>
          );
        })}
      </div>

      {/* Piano Roll Grid */}
      <div className="relative overflow-x-auto bg-gray-900 rounded-lg p-2">
        <div className="inline-flex flex-col gap-1">
          {/* Rows (pitches) - Display in reverse order (high notes at top) */}
          {[...visibleNotes].reverse().map((pitch) => {
            const noteName = getNoteNameFromMidi(pitch);

            return (
              <div key={pitch} className="flex items-center gap-1">
                {/* Note label */}
                <div className="w-10 text-xs text-gray-400 font-mono text-right flex-shrink-0">
                  {noteName}
                </div>

                {/* Step cells */}
                <div className="flex gap-1">
                  {Array.from({ length: STEPS_PER_PAGE }).map((_, pageRelativeStep) => {
                    // Convert page-relative step to absolute step for note lookup
                    const absoluteStep = currentPage * STEPS_PER_PAGE + pageRelativeStep;
                    const hasNote = notes.some(n => n.step === absoluteStep && n.pitch === pitch);
                    const isCurrentStep = currentStepInfo.pageRelativeStep === pageRelativeStep &&
                                         currentStepInfo.playbackPage === currentPage && isPlaying;
                    const isHovered = hoveredCell?.step === pageRelativeStep && hoveredCell?.pitch === pitch && hasNote;

                    // Get note color based on colorMode (chromatic/harmonic/spectrum)
                    // ALWAYS use colorMode for consistency (Story 15.7 requirement)
                    // For spectrum mode: use full MIDI pitch, for others: use pitch class (0-11)
                    const noteForColor = (colorMode as string) === 'spectrum' ? pitch : (pitch % 12);
                    const noteColor = getNoteColor(noteForColor, colorMode);

                    // Calculate brightness using IntelligentMelodyService (Story 15.7)
                    // Staggered temporal proximity - notes further away in pitch are highlighted at different time offsets
                    // This creates a diagonal highlighting pattern

                    // Check for hover-based highlighting (bright)
                    let isTemporallyClose = false;
                    let proximityMultiplier = 1.0; // Dim notes that are further away
                    if (lastInteractedStep !== null && lastInteractedPitch !== null) {
                      // Calculate pitch distance in semitones
                      const pitchDistance = Math.abs(pitch - lastInteractedPitch);

                      // Map pitch distance to time offset (diagonal stagger)
                      // Closer pitches (0-2 semitones) = same step (±1)
                      // Further pitches (3-5 semitones) = offset by 1 step
                      // Even further (6+ semitones) = offset by 2 steps
                      let timeOffset = 0;
                      if (pitchDistance >= 6) {
                        timeOffset = 2;
                        proximityMultiplier = 0.75; // Dim notes that are far away (6+ semitones)
                      } else if (pitchDistance >= 3) {
                        timeOffset = 1;
                        proximityMultiplier = 0.85; // Slightly dim medium distance notes (3-5 semitones)
                      }

                      // Calculate temporal window based on pitch distance
                      // Support BOTH forward and backward diagonal patterns
                      const forwardStepOffset = pitch > lastInteractedPitch ? timeOffset : -timeOffset;
                      const backwardStepOffset = pitch < lastInteractedPitch ? timeOffset : -timeOffset;

                      const forwardExpectedStep = lastInteractedStep + forwardStepOffset;
                      const backwardExpectedStep = lastInteractedStep + backwardStepOffset;

                      // Check if this cell is within ±1 step of either expected position
                      const isForwardClose = Math.abs(pageRelativeStep - forwardExpectedStep) <= 1;
                      const isBackwardClose = Math.abs(pageRelativeStep - backwardExpectedStep) <= 1;

                      isTemporallyClose = isForwardClose || isBackwardClose;
                    }

                    // Check for "ghost" imprints from already placed notes (faint)
                    let ghostBrightness = 0;
                    if (showHarmonicGuidance && !hasNote && !isTemporallyClose) {
                      // Check if this empty cell is suggested by any placed note on current page
                      const pageNotes = notes.filter(n => {
                        const notePageRelativeStep = n.step - currentPage * STEPS_PER_PAGE;
                        return notePageRelativeStep >= 0 && notePageRelativeStep < STEPS_PER_PAGE;
                      });

                      let maxGhostBrightness = 0;
                      for (const placedNote of pageNotes) {
                        const notePageRelativeStep = placedNote.step - currentPage * STEPS_PER_PAGE;
                        const pitchDistance = Math.abs(pitch - placedNote.pitch);

                        // Calculate expected time offset for this placed note
                        let timeOffset = 0;
                        if (pitchDistance >= 6) {
                          timeOffset = 2;
                        } else if (pitchDistance >= 3) {
                          timeOffset = 1;
                        }

                        // Support BOTH forward and backward diagonal patterns for ghost imprints
                        const forwardStepOffset = pitch > placedNote.pitch ? timeOffset : -timeOffset;
                        const backwardStepOffset = pitch < placedNote.pitch ? timeOffset : -timeOffset;

                        const forwardExpectedStep = notePageRelativeStep + forwardStepOffset;
                        const backwardExpectedStep = notePageRelativeStep + backwardStepOffset;

                        // Check if this cell matches either ghost pattern
                        const isForwardMatch = Math.abs(pageRelativeStep - forwardExpectedStep) <= 1;
                        const isBackwardMatch = Math.abs(pageRelativeStep - backwardExpectedStep) <= 1;

                        if (isForwardMatch || isBackwardMatch) {
                          // Calculate harmonic brightness for this ghost suggestion
                          const ghostHarmonicBrightness = melodyService.calculateNoteBrightness(
                            pitch,
                            absoluteStep,
                            currentChord,
                            scaleNotes,
                            settings,
                            placedNote.pitch,
                            false // Not a placed note
                          );

                          // Reduce brightness for ghost effect (multiply by 0.7 to make it fainter but still visible)
                          const faintGhostBrightness = ghostHarmonicBrightness * 0.7;
                          maxGhostBrightness = Math.max(maxGhostBrightness, faintGhostBrightness);
                        }
                      }
                      ghostBrightness = maxGhostBrightness;
                    }

                    let brightness = showHarmonicGuidance && isTemporallyClose
                      ? melodyService.calculateNoteBrightness(
                          pitch,
                          absoluteStep,
                          currentChord,
                          scaleNotes,
                          settings,
                          lastInteractedPitch || lastPlacedPitch, // Prioritize last interaction
                          hasNote // Placed notes get 1.0 brightness
                        ) * proximityMultiplier // Dim notes that are further away in pitch
                      : hasNote ? 1.0
                      : ghostBrightness > 0 ? ghostBrightness // Faint ghost imprint with harmonic logic
                      : 0.40; // Base dim brightness for non-highlighted notes

                    // Dim repetitive notes (same pitch in temporally adjacent cells) - less musical
                    // BUT exclude the hovered cell itself (it should be brightest as the reference point)
                    const isHoveredCell = lastInteractedStep === pageRelativeStep && pitch === (lastInteractedPitch || lastPlacedPitch);
                    if (showHarmonicGuidance && isTemporallyClose && !hasNote && !isHoveredCell) {
                      const isSamePitchAsInteracted = pitch === (lastInteractedPitch || lastPlacedPitch);
                      if (isSamePitchAsInteracted) {
                        brightness = brightness * 0.5; // Reduce brightness by 50% for repetitive notes
                      }
                    }

                    // For empty cells (borders only), amplify dimness - make less musical notes much fainter
                    // This creates stronger visual hierarchy for harmonic guidance
                    if (!hasNote && showHarmonicGuidance) {
                      // Map brightness 0.3-1.0 → 0.1-1.0 (make dim notes even dimmer)
                      brightness = 0.1 + (brightness - 0.3) * (0.9 / 0.7);
                      brightness = Math.max(0.1, Math.min(1.0, brightness)); // Clamp to range
                    }

                    // Apply brightness multiplier to RGB color
                    const brightColor = `rgb(${Math.floor(noteColor.r * brightness)}, ${Math.floor(noteColor.g * brightness)}, ${Math.floor(noteColor.b * brightness)})`;

                    // Empty cells: colored border (with brightness), transparent background
                    // Placed notes: colored background (with brightness), colored border
                    // Active/playing notes OR hovered notes: white border
                    const colorStyle = hasNote
                      ? {
                          backgroundColor: brightColor, // Colored background for placed notes
                          borderColor: (isCurrentStep || isHovered) ? 'rgb(255, 255, 255)' : brightColor, // White border when playing or hovered
                          borderWidth: '2px',
                          borderStyle: 'solid',
                        }
                      : {
                          backgroundColor: 'transparent', // Transparent background for empty cells
                          borderColor: brightColor, // Colored border shows harmonic guidance
                          borderWidth: '2px',
                          borderStyle: 'solid',
                        };

                    // Check if this cell is being dragged over
                    const isDraggedOver = dragState?.isDragging &&
                                         pitch === dragState.startPitch &&
                                         ((dragState.startStep <= dragState.currentStep && pageRelativeStep >= dragState.startStep && pageRelativeStep <= dragState.currentStep) ||
                                          (dragState.startStep > dragState.currentStep && pageRelativeStep >= dragState.currentStep && pageRelativeStep <= dragState.startStep));

                    return (
                      <button
                        key={pageRelativeStep}
                        onMouseDown={() => handleCellMouseDown(pageRelativeStep, pitch)}
                        onMouseEnter={() => {
                          setLastInteractedPitch(pitch);
                          setLastInteractedStep(pageRelativeStep);
                          setHoveredCell({ step: pageRelativeStep, pitch });
                          handleCellMouseEnter(pageRelativeStep, pitch);
                        }}
                        onMouseLeave={() => {
                          setLastInteractedPitch(lastPlacedPitch);
                          setLastInteractedStep(null);
                          setHoveredCell(null);
                        }}
                        className={`
                          w-8 h-8 rounded-md transition-all duration-75
                          ${hasNote
                            ? 'shadow-md hover:brightness-110'
                            : 'hover:brightness-125'
                          }
                          ${isCurrentStep ? 'ring-2 ring-primary-400 scale-105' : ''}
                          ${isDraggedOver ? 'ring-2 ring-white' : ''}
                          min-h-[32px] min-w-[32px]
                        `}
                        style={colorStyle}
                        aria-label={`${noteName}, page ${currentPage + 1}, step ${pageRelativeStep + 1}`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Vertical playback cursor - Only show on currently visible page */}
        {isPlaying && currentStepInfo.playbackPage === currentPage && (
          <div
            className="absolute top-0 bottom-0 w-1 bg-primary-400 pointer-events-none z-10 opacity-75"
            style={{
              // Position cursor based on continuous playback position within current step
              // Formula: label_width + (step_index * cell_width) + (fractional_progress * cell_width)
              // This creates smooth animation that aligns with the step cells
              left: `${40 + (currentStepInfo.pageRelativeStep * 36) + (currentStepInfo.fractionalProgress * 36)}px`,
              boxShadow: '0 0 8px rgba(168, 85, 247, 0.8)',
            }}
            aria-label="Playback cursor"
          />
        )}

        {/* Tied Note Overlays - Render sustained notes as thin horizontal lines */}
        {notes
          .filter(note => {
            // Only render tied notes (tiedSteps > 1) on the current page
            const notePageRelativeStep = note.step - currentPage * STEPS_PER_PAGE;
            return note.tiedSteps && note.tiedSteps > 1 &&
                   notePageRelativeStep >= 0 && notePageRelativeStep < STEPS_PER_PAGE;
          })
          .map(note => {
            const notePageRelativeStep = note.step - currentPage * STEPS_PER_PAGE;
            const pitchIndex = [...visibleNotes].reverse().findIndex(p => p === note.pitch);

            if (pitchIndex === -1) return null; // Note pitch not visible (out of scale)

            // Calculate position
            const CELL_SIZE = 32; // w-8 h-8 = 32px
            const GAP_SIZE = 4; // gap-1 = 4px
            const LABEL_WIDTH = 40; // w-10 = 40px
            const ROW_HEIGHT = CELL_SIZE + GAP_SIZE;
            const CELL_WIDTH = CELL_SIZE + GAP_SIZE;

            // Position line inside the cells (centered vertically)
            const left = LABEL_WIDTH + notePageRelativeStep * CELL_WIDTH + 4; // +4px padding from left edge
            const top = pitchIndex * ROW_HEIGHT + (CELL_SIZE / 2) - 1; // Center vertically (line is 2px tall)
            const width = (note.tiedSteps || 1) * CELL_WIDTH - GAP_SIZE - 8; // -8px padding (4px each side)

            // Get note color
            const noteForColor = (colorMode as string) === 'spectrum' ? note.pitch : (note.pitch % 12);
            const noteColor = getNoteColor(noteForColor, colorMode);
            const colorStr = `rgb(${noteColor.r}, ${noteColor.g}, ${noteColor.b})`;

            return (
              <div
                key={`tied-${note.step}-${note.pitch}`}
                className="absolute pointer-events-none"
                style={{
                  left: `${left}px`,
                  top: `${top}px`,
                  width: `${width}px`,
                  height: '3px', // Thin horizontal line
                  backgroundColor: colorStr,
                  borderRadius: '1.5px', // Rounded caps
                  opacity: 0.85,
                  zIndex: 5, // Above grid cells but below playback cursor
                  boxShadow: `0 0 4px ${colorStr}`, // Subtle glow
                }}
                aria-label={`Tied note: ${getNoteNameFromMidi(note.pitch)}, ${note.tiedSteps} steps`}
              />
            );
          })}

        {/* Sparkle Dust Particles - Moth flying to the light */}
        {sparkleParticles.map(particle => {
          const fromPitchIndex = [...visibleNotes].reverse().findIndex(p => p === particle.fromPitch);
          const toPitchIndex = [...visibleNotes].reverse().findIndex(p => p === particle.toPitch);

          if (fromPitchIndex === -1 || toPitchIndex === -1) return null;

          // Constants (same as tied notes)
          const CELL_SIZE = 32;
          const GAP_SIZE = 4;
          const LABEL_WIDTH = 40;
          const ROW_HEIGHT = CELL_SIZE + GAP_SIZE;
          const CELL_WIDTH = CELL_SIZE + GAP_SIZE;

          // Calculate from/to positions (center of cells)
          const fromX = LABEL_WIDTH + particle.fromStep * CELL_WIDTH + (CELL_SIZE / 2);
          const fromY = fromPitchIndex * ROW_HEIGHT + (CELL_SIZE / 2);
          const toX = LABEL_WIDTH + particle.toStep * CELL_WIDTH + (CELL_SIZE / 2);
          const toY = toPitchIndex * ROW_HEIGHT + (CELL_SIZE / 2);

          // Interpolate position based on progress (with easing)
          const easeProgress = particle.progress < 0.5
            ? 2 * particle.progress * particle.progress
            : 1 - Math.pow(-2 * particle.progress + 2, 2) / 2;

          const currentX = fromX + (toX - fromX) * easeProgress;
          const currentY = fromY + (toY - fromY) * easeProgress;

          // Get note color for sparkle
          const noteForColor = colorMode === 'spectrum' ? particle.toPitch : (particle.toPitch % 12);
          const noteColor = getNoteColor(noteForColor, colorMode);

          // Trail fade-out effect:
          // - Particles that started earlier should be dimmer (trail effect)
          // - Calculate time since this particle started relative to the first particle
          const now = performance.now();
          const timeSinceStart = now - particle.startTime;
          const trailFade = timeSinceStart > 0 ? Math.max(0.3, 1 - (timeSinceStart / (particle.duration * 1.5))) : 1;

          // Fade in then out (standard particle lifecycle)
          let opacity = particle.progress < 0.5
            ? particle.progress * 2 // Fade in
            : (1 - particle.progress) * 2; // Fade out

          // Apply trail fade-out multiplier (creates smooth dissipation behind leading edge)
          opacity = opacity * trailFade;

          return (
            <div
              key={particle.id}
              className="absolute pointer-events-none"
              style={{
                left: `${currentX}px`,
                top: `${currentY}px`,
                width: '12px',
                height: '12px',
                transform: 'translate(-50%, -50%)',
                zIndex: 15, // Above everything
              }}
              aria-label="Sparkle animation"
            >
              {/* Multiple sparkles for dust effect */}
              {[0, 1, 2, 3].map(i => {
                const angle = (i / 4) * Math.PI * 2 + (particle.progress * Math.PI * 4);
                const distance = 6 + Math.sin(particle.progress * Math.PI * 2) * 3;
                const offsetX = Math.cos(angle) * distance;
                const offsetY = Math.sin(angle) * distance;

                return (
                  <div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      left: `${6 + offsetX}px`,
                      top: `${6 + offsetY}px`,
                      width: '4px',
                      height: '4px',
                      backgroundColor: `rgb(${noteColor.r}, ${noteColor.g}, ${noteColor.b})`,
                      opacity: opacity * 0.9,
                      boxShadow: `0 0 8px rgba(${noteColor.r}, ${noteColor.g}, ${noteColor.b}, ${opacity})`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                );
              })}
              {/* Central bright spark */}
              <div
                className="absolute rounded-full"
                style={{
                  left: '6px',
                  top: '6px',
                  width: '6px',
                  height: '6px',
                  backgroundColor: '#ffffff',
                  opacity: opacity,
                  boxShadow: `0 0 12px rgba(255, 255, 255, ${opacity}), 0 0 6px rgba(${noteColor.r}, ${noteColor.g}, ${noteColor.b}, ${opacity})`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Instructions */}
      <div className="mt-3 text-xs text-gray-500 text-center">
        Click cells to toggle notes • Drag horizontally to create tied/sustained notes • Notes auto-filter to {key} {scale} scale
        {showHarmonicGuidance && ' • Brightness shows harmonic recommendation'}
      </div>

      {/* Inline Warning: Out-of-Scale Notes (Anti-Modal Pattern) */}
      {outOfScaleWarning && outOfScaleWarning.removedNotes.length === 0 && (
        <div className="mt-3 flex items-start gap-3 px-3 py-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-yellow-300 font-medium">
              {outOfScaleWarning.count} {outOfScaleWarning.count === 1 ? 'note is' : 'notes are'} outside the {outOfScaleWarning.key} {outOfScaleWarning.scale} scale
            </p>
            <p className="text-xs text-yellow-400/80 mt-1">
              These notes won't sound in-key. You can remove them or keep them for chromatic variation.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={removeOutOfScaleNotes}
              className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-medium rounded-lg transition-colors"
            >
              Remove
            </button>
            <button
              onClick={() => setOutOfScaleWarning(null)}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium rounded-lg transition-colors"
            >
              Keep
            </button>
          </div>
        </div>
      )}

      {/* Inline Toast: Removed Notes with Undo */}
      {outOfScaleWarning && outOfScaleWarning.removedNotes.length > 0 && (
        <div className="mt-3 flex items-center gap-3 px-3 py-2 bg-green-900/20 border border-green-700 rounded-lg">
          <AlertCircle className="w-4 h-4 text-green-400" />
          <span className="text-sm text-green-300 flex-1">
            Removed {outOfScaleWarning.removedNotes.length} out-of-scale {outOfScaleWarning.removedNotes.length === 1 ? 'note' : 'notes'}
          </span>
          <button
            onClick={undoRemoveOutOfScale}
            className="flex items-center gap-1.5 px-3 py-1 bg-green-700 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors"
          >
            <Undo2 className="w-3 h-3" />
            Undo
          </button>
        </div>
      )}

      {/* Toast: Clear Undo (Gmail-Style Pattern) */}
      {clearUndoState && notes.length === 0 && (
        <div className="mt-3 flex items-center gap-3 px-3 py-2 bg-blue-900/20 border border-blue-700 rounded-lg">
          <AlertCircle className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-blue-300 flex-1">
            Cleared {clearUndoState.notes.length} {clearUndoState.notes.length === 1 ? 'note' : 'notes'}
          </span>
          <button
            onClick={undoClear}
            className="flex items-center gap-1.5 px-3 py-1 bg-blue-700 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors"
          >
            <Undo2 className="w-3 h-3" />
            Undo
          </button>
        </div>
      )}

      {/* Empty state */}
      {notes.length === 0 && !clearUndoState && (
        <div className="mt-4 text-center text-gray-400 py-4">
          <p className="text-sm">Click any cell to add a note</p>
        </div>
      )}

      {/* Intelligent Melody Settings Panel (Story 15.7) - Overlay Tray */}
      {showSettings && (
        <div className="absolute bottom-0 left-0 right-0 bg-gray-850/95 backdrop-blur-sm border-t border-gray-700 rounded-b-lg shadow-2xl max-h-[50vh] overflow-y-auto z-10">
          <div className="sticky top-0 bg-gray-850 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white">Intelligent Melody Settings</h4>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSettings(IntelligentMelodyService.getDefaultSettings())}
                className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 hover:bg-gray-700 rounded"
              >
                Close
              </button>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {/* Educational Feedback */}
            <div className="flex items-start gap-2 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
              <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-300">{settingsFeedback}</p>
            </div>

            {/* Chord Tone Density */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Chord Tone Density
              </label>
              <p className="text-xs text-gray-500 mb-2">
                How often chord tones appear vs scale notes (affects brightness gap)
              </p>
              <div className="flex gap-2">
                {(['high', 'medium', 'low'] as const).map((density) => (
                  <button
                    key={density}
                    onClick={() => setSettings({ ...settings, chordToneDensity: density })}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      settings.chordToneDensity === density
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {density.charAt(0).toUpperCase() + density.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Melodic Contour */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Melodic Contour
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Overall shape of the generated melody
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(['arch', 'valley', 'ascending', 'descending', 'wave', 'random'] as const).map((contour) => (
                  <button
                    key={contour}
                    onClick={() => setSettings({ ...settings, melodicContour: contour })}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      settings.melodicContour === contour
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {contour.charAt(0).toUpperCase() + contour.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Passing Tones */}
            <div>
              <label className="flex items-center justify-between">
                <div>
                  <span className="block text-xs font-medium text-gray-300">Passing Tones</span>
                  <p className="text-xs text-gray-500 mt-1">
                    Favor stepwise motion over leaps (brighter stepwise notes)
                  </p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, passingTones: !settings.passingTones })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.passingTones ? 'bg-primary-600' : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      settings.passingTones ? 'transform translate-x-6' : ''
                    }`}
                  />
                </button>
              </label>
            </div>

            {/* Rhythmic Pattern */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Rhythmic Pattern (for generation)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['groove1', 'groove2', 'groove3', 'triplet', 'sparse', 'mixed'] as const).map((pattern) => (
                  <button
                    key={pattern}
                    onClick={() => setSettings({ ...settings, rhythmicPattern: pattern })}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      settings.rhythmicPattern === pattern
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {pattern.charAt(0).toUpperCase() + pattern.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Velocity Shaping */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Velocity Shaping (for generation)
              </label>
              <div className="flex gap-2">
                {(['arc', 'crescendo', 'decrescendo', 'uniform'] as const).map((shaping) => (
                  <button
                    key={shaping}
                    onClick={() => setSettings({ ...settings, velocityShaping: shaping })}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      settings.velocityShaping === shaping
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {shaping.charAt(0).toUpperCase() + shaping.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Note Density */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Note Density: {Math.round(settings.noteDensity * 100)}%
              </label>
              <p className="text-xs text-gray-500 mb-2">
                How many steps have notes when generating
              </p>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={settings.noteDensity * 100}
                onChange={(e) =>
                  setSettings({ ...settings, noteDensity: parseInt(e.target.value) / 100 })
                }
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-primary"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
