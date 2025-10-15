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
import * as Tone from 'tone';
import { Trash2, AlertCircle, Undo2, Wand2, Settings, Info } from 'lucide-react';
import { useGlobalMusic } from '@/contexts/GlobalMusicContext';
import { getNoteColor } from '@/utils/colorMapping';
import { IntelligentMelodyService, type IntelligentMelodySettings } from '@/services/intelligentMelodyService';
import type { Chord } from '@/types/chordProgression';

/**
 * MelodyNote interface
 * Represents a single note in the melody sequence
 */
export interface MelodyNote {
  step: number;        // 0-15 (16 steps)
  pitch: number;       // MIDI note number (21-108)
  velocity: number;    // 0-127
  duration: number;    // In beats (0.25 = 1/16th note)
}

export interface MelodySequencerProps {
  playbackPosition: number; // 0-1 (normalized position through sequence)
  isPlaying: boolean;
  tempo: number;
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
  const synthRef = useRef<Tone.PolySynth | null>(null);

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

  // Initialize Tone.js synth on mount
  useEffect(() => {
    // Create a simple polyphonic synth for melody playback
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.005,
        decay: 0.1,
        sustain: 0.3,
        release: 0.5,
      },
    }).toDestination();

    synth.volume.value = -10; // dB

    synthRef.current = synth;

    return () => {
      synth.dispose();
    };
  }, []);

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
  // 16-step sequencer loops every 1 bar (4 beats), not over the full progression
  useEffect(() => {
    if (!isPlaying) {
      lastStepRef.current = -1;
      return;
    }

    // Make the 16-step sequencer loop every 1 bar (instead of full 8-bar progression)
    // This gives us proper 16th note resolution (4 steps per beat)
    const loopedPosition = (playbackPosition * 8) % 1; // Loop 8 times (once per bar)
    const currentStep = Math.floor(loopedPosition * 16);

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
  }, [playbackPosition, isPlaying, notes, onNoteEvent]);

  // Schedule note playback via Tone.js
  const scheduleNote = useCallback((note: MelodyNote) => {
    const synth = synthRef.current;
    if (!synth) return;

    try {
      const noteName = Tone.Frequency(note.pitch, 'midi').toNote();
      const duration = note.duration; // In beats (0.25 = 1/16th note)
      const velocity = note.velocity / 127; // Normalize 0-1

      synth.triggerAttackRelease(noteName, duration, Tone.now(), velocity);
    } catch (error) {
      console.error('[MelodySequencer] Error playing note:', error);
    }
  }, []);

  // Toggle note on/off at given step and pitch
  const toggleNote = useCallback((step: number, pitch: number) => {
    // Update last interacted pitch for dynamic brightness
    setLastInteractedPitch(pitch);

    setNotes(prevNotes => {
      const existingIndex = prevNotes.findIndex(
        n => n.step === step && n.pitch === pitch
      );

      if (existingIndex >= 0) {
        // Remove note - no audio feedback
        return prevNotes.filter((_, i) => i !== existingIndex);
      } else {
        // Add note with default velocity and duration
        const newNote: MelodyNote = {
          step,
          pitch,
          velocity: 100, // Default velocity (~80%)
          duration: 0.25 // 1/16th note
        };

        // Play audio immediately when adding note
        scheduleNote(newNote);

        // Route to connected visualizers/modules
        if (onNoteEvent) {
          onNoteEvent(newNote);
        }

        return [...prevNotes, newNote];
      }
    });
  }, [scheduleNote, onNoteEvent]);

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
  const generateMelody = useCallback(() => {
    if (visibleNotes.length === 0) return;

    const generatedNotes: MelodyNote[] = [];

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

    // Randomly choose a pattern
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];

    // Map pattern to 16 steps with rhythmic variation
    for (let step = 0; step < 16; step++) {
      // Not every step has a note (create rhythmic variety)
      if (Math.random() > 0.3) { // 70% chance of note
        const patternIndex = pattern[step % pattern.length];
        const noteIndex = Math.min(patternIndex, visibleNotes.length - 1);
        const pitch = visibleNotes[noteIndex];

        // Vary note durations
        const durations = [0.25, 0.5, 0.25, 0.25]; // Mix of 16th and 8th notes
        const duration = durations[step % durations.length];

        // Vary velocities slightly
        const velocity = 80 + Math.floor(Math.random() * 30); // 80-110

        generatedNotes.push({
          step,
          pitch,
          velocity,
          duration,
        });
      }
    }

    setNotes(generatedNotes);
  }, [visibleNotes]);

  // Calculate current step for visual indicator
  // Loop every 1 bar (matches step triggering logic)
  const currentStep = useMemo(() => {
    const loopedPosition = (playbackPosition * 8) % 1; // Loop 8 times (once per bar)
    return Math.floor(loopedPosition * 16);
  }, [playbackPosition]);

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

  return (
    <div className="relative bg-gray-800 rounded-lg border border-gray-700 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Melody Sequencer</h3>
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
                  {Array.from({ length: 16 }).map((_, step) => {
                    const hasNote = notes.some(n => n.step === step && n.pitch === pitch);
                    const isCurrentStep = currentStep === step && isPlaying;
                    const isHovered = hoveredCell?.step === step && hoveredCell?.pitch === pitch && hasNote;

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
                          step,
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

                    return (
                      <button
                        key={step}
                        onClick={() => toggleNote(step, pitch)}
                        onMouseEnter={() => {
                          setLastInteractedPitch(pitch);
                          setHoveredCell({ step, pitch });
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
                          min-h-[32px] min-w-[32px]
                        `}
                        style={colorStyle}
                        aria-label={`${noteName}, step ${step + 1}`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Vertical playback cursor */}
        {isPlaying && (
          <div
            className="absolute top-0 bottom-0 w-1 bg-primary-400 pointer-events-none z-10 opacity-75"
            style={{
              // Loop cursor every 1 bar (matches step triggering logic)
              left: `calc(40px + ${((playbackPosition * 8) % 1) * 100}% * (16 * 36px) / 100%)`, // 40px = label width, 36px = cell + gap
              boxShadow: '0 0 8px rgba(168, 85, 247, 0.8)',
            }}
            aria-label="Playback cursor"
          />
        )}
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

      {/* Instructions */}
      <div className="mt-3 text-xs text-gray-500 text-center">
        Click cells to toggle notes • Notes auto-filter to {key} {scale} scale
        {showHarmonicGuidance && ' • Brightness shows harmonic recommendation'}
      </div>

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
