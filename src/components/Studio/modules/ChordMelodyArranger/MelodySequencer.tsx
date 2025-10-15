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
import { Trash2, AlertCircle, Undo2, Wand2, Settings, Info, Volume2 } from 'lucide-react';
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
      const duration = note.duration; // In beats

      soundEngine.playNote(frequency, velocity, duration);
    } catch (error) {
      console.error('[MelodySequencer] Error playing note:', error);
    }
  }, []);

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

          // Vary note durations
          const durations = [0.25, 0.5, 0.25, 0.25]; // Mix of 16th and 8th notes
          const duration = durations[pageRelativeStep % durations.length];

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
          {/* Generation scope dropdown */}
          <select
            value={generateScope}
            onChange={(e) => setGenerateScope(e.target.value as 'current' | 'all')}
            className="px-2 py-1.5 bg-gray-700 text-white text-xs rounded-lg border border-gray-600 hover:bg-gray-600 transition-colors min-h-[44px]"
            aria-label="Generation scope"
          >
            <option value="current">Current Page</option>
            <option value="all">All Active</option>
          </select>
          <button
            onClick={generateMelody}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded-lg transition-colors min-h-[44px]"
            aria-label="Generate melody"
          >
            <Wand2 className="w-4 h-4" />
            Generate
          </button>
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
                    // Use lastInteractedPitch for dynamic brightness updates as user interacts
                    let brightness = showHarmonicGuidance
                      ? melodyService.calculateNoteBrightness(
                          pitch,
                          absoluteStep,
                          currentChord,
                          scaleNotes,
                          settings,
                          lastInteractedPitch || lastPlacedPitch, // Prioritize last interaction
                          hasNote // Placed notes get 1.0 brightness
                        )
                      : hasNote ? 1.0 : 0.65; // Fallback: full brightness if placed, else in-scale default

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
                          setHoveredCell({ step: pageRelativeStep, pitch });
                          handleCellMouseEnter(pageRelativeStep, pitch);
                        }}
                        onMouseLeave={() => {
                          setLastInteractedPitch(lastPlacedPitch);
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

        {/* Tied Note Overlays - Render sustained notes as stretched rectangles */}
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

            const left = LABEL_WIDTH + notePageRelativeStep * CELL_WIDTH;
            const top = pitchIndex * ROW_HEIGHT;
            const width = (note.tiedSteps || 1) * CELL_WIDTH - GAP_SIZE; // Subtract last gap

            // Get note color
            const noteForColor = (colorMode as string) === 'spectrum' ? note.pitch : (note.pitch % 12);
            const noteColor = getNoteColor(noteForColor, colorMode);
            const colorStr = `rgb(${noteColor.r}, ${noteColor.g}, ${noteColor.b})`;

            return (
              <div
                key={`tied-${note.step}-${note.pitch}`}
                className="absolute pointer-events-none rounded-md shadow-lg"
                style={{
                  left: `${left}px`,
                  top: `${top}px`,
                  width: `${width}px`,
                  height: `${CELL_SIZE}px`,
                  backgroundColor: colorStr,
                  border: `2px solid ${colorStr}`,
                  opacity: 0.9,
                  zIndex: 5, // Above grid cells but below playback cursor
                }}
                aria-label={`Tied note: ${getNoteNameFromMidi(note.pitch)}, ${note.tiedSteps} steps`}
              />
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
