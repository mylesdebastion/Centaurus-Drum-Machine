// Main Guitar Fretboard Component
// Story 9.3: Guitar Fretboard Visualizer with LED Matrix Output

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as Tone from 'tone';
import { Guitar, Settings, Play, Pause } from 'lucide-react';
import { FretboardCanvas } from './FretboardCanvas';
import { MIDIDeviceSelector } from '../MIDI/MIDIDeviceSelector';
import WLEDDeviceManager from '../WLED/WLEDDeviceManager';
import { ColorMode, getNoteColor } from '../../utils/colorMapping';
import { ChordProgressionService } from '@/services/chordProgressionService';
import { IntelligentMelodyService } from '@/services/intelligentMelodyService';
import type { IntelligentMelodySettings } from '@/services/intelligentMelodyService';
import { createFretboardMatrix, getMIDINoteFromFret, fretboardToLEDIndex, GUITAR_CONSTANTS } from './constants';
import { useMIDIInput } from '../../hooks/useMIDIInput';
import { useMusicalScale, ROOT_POSITIONS } from '../../hooks/useMusicalScale';
import { ScaleSelector } from '../Music/ScaleSelector';
import { GUITAR_TUNINGS, getTuningMIDINotes, type GuitarTuning } from './tunings';
import { useModuleContext } from '../../hooks/useModuleContext';
import { useGlobalMusic } from '../../contexts/GlobalMusicContext';
import { ledCompositor } from '../../services/LEDCompositor';
import { midiEventBus } from '../../utils/midiEventBus';
import { ModuleRoutingService } from '@/services/moduleRoutingService';
import type { NoteEvent } from '@/types/moduleRouting';

interface GuitarFretboardProps {
  /**
   * Callback when user clicks the back button
   */
  onBack?: () => void;
  /**
   * Whether this module is embedded in Studio (affects layout)
   */
  embedded?: boolean;
  /**
   * Module instance ID for routing (when embedded in Studio)
   */
  instanceId?: string;
}

export const GuitarFretboard: React.FC<GuitarFretboardProps> = ({
  onBack,
  embedded = false,
  instanceId = 'guitar-fretboard-standalone'
}) => {
  // Module Adapter Pattern - Context Detection (Epic 14, Story 14.4)
  const context = useModuleContext();
  const globalMusic = useGlobalMusic();
  const isStandalone = context === 'standalone';

  // Local state (used when standalone)
  const [currentProgressionIndex, setCurrentProgressionIndex] = useState(0);
  const [currentChord, setCurrentChord] = useState(0);
  const [chordProgressionEnabled, setChordProgressionEnabled] = useState(false); // Start with no chord selected
  const [localColorMode, setLocalColorMode] = useState<ColorMode>('chromatic');
  const [guitarSynth, setGuitarSynth] = useState<Tone.PolySynth | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [localIsPlaying, setLocalIsPlaying] = useState(false); // Local playback state
  const [showProgressionMenu, setShowProgressionMenu] = useState(false);
  const [selectedTuning, setSelectedTuning] = useState<GuitarTuning>(GUITAR_TUNINGS[0]); // Standard tuning
  const [showTuningMenu, setShowTuningMenu] = useState(false);

  // Track clicked notes for interval guide (separate from chord diagram notes)
  const [clickedNotes, setClickedNotes] = useState<Set<number>>(new Set());

  // Harmonic guidance state (Story 16.1)
  const [showHarmonicGuidance, setShowHarmonicGuidance] = useState(true); // Default: ON
  const [_intelligentMelodySettings, _setIntelligentMelodySettings] = useState<IntelligentMelodySettings>(
    IntelligentMelodyService.getDefaultSettings()
  ); // Reserved for Task 3 brightness calculation and Story 16.6 settings panel

  // Temporal proximity highlighting state (Story 16.2)
  const [lastInteractedFret, setLastInteractedFret] = useState<{ string: number; fret: number } | null>(null);

  // Musical scale hook (for local state when standalone)
  const {
    selectedRoot: localSelectedRoot,
    selectedScale: localSelectedScale,
    setSelectedRoot: setLocalSelectedRoot,
    setSelectedScale: setLocalSelectedScale,
    getCurrentScale: _getLocalCurrentScale, // Not used - we implement our own getCurrentScale
    getKeySignature,
    rootNotes,
    scaleNames
  } = useMusicalScale({ initialRoot: 'C', initialScale: 'major' });

  // Graceful Degradation - State Resolution
  const colorMode = isStandalone ? localColorMode : globalMusic.colorMode;
  const selectedRoot = isStandalone ? localSelectedRoot : globalMusic.key;
  const selectedScale = isStandalone ? localSelectedScale : globalMusic.scale;

  // Sync with global transport state when in Studio (Epic 14)
  // Global play button controls all modules, but module buttons control only themselves
  useEffect(() => {
    if (!isStandalone) {
      setLocalIsPlaying(globalMusic.isPlaying);
    }
  }, [globalMusic.isPlaying, isStandalone]);

  // Helper to get current scale notes (handles both local and global)
  const getCurrentScale = useCallback(() => {
    // Scale interval patterns (semitones from root)
    const scalePatterns: Record<string, number[]> = {
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

    const rootPos = ROOT_POSITIONS[selectedRoot];
    const pattern = scalePatterns[selectedScale] || scalePatterns['major'];
    return pattern.map(interval => (rootPos + interval) % 12);
  }, [selectedRoot, selectedScale]);

  // State update helpers (Epic 14 - Module Adapter Pattern)
  const updateColorMode = useCallback((mode: ColorMode) => {
    if (isStandalone) {
      setLocalColorMode(mode);
    } else {
      globalMusic.updateColorMode(mode);
    }
  }, [isStandalone, globalMusic]);

  const updateKey = useCallback((key: string) => {
    if (isStandalone) {
      setLocalSelectedRoot(key);
    } else {
      globalMusic.updateKey(key);
    }
  }, [isStandalone, globalMusic, setLocalSelectedRoot]);

  const updateScale = useCallback((scale: string) => {
    if (isStandalone) {
      setLocalSelectedScale(scale);
    } else {
      globalMusic.updateScale(scale);
    }
  }, [isStandalone, globalMusic, setLocalSelectedScale]);

  // Get current tuning MIDI notes
  const currentTuningMIDI = getTuningMIDINotes(selectedTuning);
  const fretboardMatrix = createFretboardMatrix(currentTuningMIDI);

  // Get ChordProgressionService singleton
  const chordService = ChordProgressionService.getInstance();

  // Get IntelligentMelodyService singleton (Story 16.1)
  const melodyService = IntelligentMelodyService.getInstance();
  console.log('[GuitarFretboard] IntelligentMelodyService initialized:', melodyService);

  // Get all Roman numeral progressions from service
  const ROMAN_NUMERAL_PROGRESSIONS = chordService.getAllRomanNumeralProgressions();

  // Resolve Roman numeral progression to actual chords based on selected key
  const selectedRomanProgression = ROMAN_NUMERAL_PROGRESSIONS[currentProgressionIndex];
  const progression = chordService.resolveRomanNumerals(selectedRomanProgression, selectedRoot as any);
  const chord = progression.chords[currentChord] || { name: 'C', notes: [] };

  // Log when tuning changes (disabled to reduce console spam)
  // useEffect(() => {
  //   console.group(`🎸 Tuning Changed: ${selectedTuning.name}`);
  //   console.log(`📝 Category: ${selectedTuning.category}`);
  //   console.log(`🎵 Strings (low to high): ${selectedTuning.strings.join(' - ')}`);
  //   console.log(`🎹 MIDI Notes: [${currentTuningMIDI.join(', ')}]`);
  //   console.log(`💬 Description: ${selectedTuning.description}`);
  //   console.groupEnd();
  // }, [selectedTuning, currentTuningMIDI]);

  /**
   * Calculate harmonic brightness for a specific fret position (Story 16.1 - Task 3)
   * Uses IntelligentMelodyService to determine how harmonically optimal a note is
   * based on the current chord, scale, and placed notes.
   *
   * @param string - Guitar string index (0-5, where 0=low E, 5=high E)
   * @param fret - Fret number (0-24)
   * @returns Brightness value (0.2-1.0), where higher = more harmonically optimal
   */
  const calculateFretBrightness = useCallback((string: number, fret: number): number => {
    // Early return if harmonic guidance is disabled
    if (!showHarmonicGuidance) {
      // Use existing 3-tier system: chord=1.0, in-scale=0.65, out-of-scale=0.2
      const midiNote = getMIDINoteFromFret(string, fret, currentTuningMIDI);
      const noteClass = midiNote % 12;
      const scaleNotes = getCurrentScale();
      const isInScale = scaleNotes.includes(noteClass);

      // Check if note is actively placed (clicked notes)
      const isPlaced = clickedNotes.has(midiNote);

      if (isPlaced) return 1.0;  // Placed notes full brightness
      if (isInScale) return 0.65; // Scale notes
      return 0.2;  // Out-of-scale
    }

    // Calculate MIDI note from fret position
    const midiNote = getMIDINoteFromFret(string, fret, currentTuningMIDI);

    // Check if note is already placed (clicked)
    const isPlaced = clickedNotes.has(midiNote);

    // Get current musical context
    const scaleNotes = getCurrentScale();
    const currentChordObj = chord; // From progression.chords[currentChord]

    // Use step 0 (strong beat) for maximum chord tone emphasis (per story dev notes)
    const step = 0;

    // Call IntelligentMelodyService.calculateNoteBrightness()
    // Pass chord directly - service has getChordTonesFromChord() to extract MIDI notes
    const brightness = melodyService.calculateNoteBrightness(
      midiNote,
      step,
      currentChordObj,
      scaleNotes,
      _intelligentMelodySettings,
      null,  // lastPlacedPitch - not yet implemented (Story 16.3)
      isPlaced
    );

    return brightness;
  }, [
    showHarmonicGuidance,
    getCurrentScale,
    currentTuningMIDI,
    clickedNotes,
    chord,
    melodyService,
    _intelligentMelodySettings
  ]);

  /**
   * Calculate temporal proximity brightness for hover highlighting (Story 16.2)
   * Shows harmonically related frets when hovering over a fret position
   *
   * @param string - Current string index (0-5)
   * @param fret - Current fret number (0-24)
   * @param interactedFret - The fret position being hovered over
   * @returns Brightness multiplier (0.0-1.0) or null if not temporally close
   */
  const calculateTemporalProximityBrightness = useCallback((
    string: number,
    fret: number,
    interactedFret: { string: number; fret: number } | null
  ): number | null => {
    if (!interactedFret || !showHarmonicGuidance) return null;

    // Don't highlight the hovered fret itself (it's already highlighted)
    if (string === interactedFret.string && fret === interactedFret.fret) {
      return null;
    }

    // Get MIDI pitches
    const currentPitch = getMIDINoteFromFret(string, fret, currentTuningMIDI);
    const lastPitch = getMIDINoteFromFret(
      interactedFret.string,
      interactedFret.fret,
      currentTuningMIDI
    );

    const pitchDifference = currentPitch - lastPitch;
    const pitchDistance = Math.abs(pitchDifference);

    // Calculate expected fret offset and proximity multiplier
    let expectedFretOffset = 0;
    let proximityMultiplier = 1.0;

    if (pitchDistance >= 6) {
      // Large interval (6+ semitones) -> 2-3 frets ahead/behind
      expectedFretOffset = 2;
      proximityMultiplier = 0.75;
    } else if (pitchDistance >= 3) {
      // Medium interval (3-5 semitones) -> 1-2 frets ahead/behind
      expectedFretOffset = 1;
      proximityMultiplier = 0.85;
    }
    // else: Stepwise motion (0-2 semitones) -> same fret column, no offset

    // Bidirectional support: ascending vs descending
    const isAscending = pitchDifference > 0;
    const fretOffset = isAscending ? expectedFretOffset : -expectedFretOffset;
    const expectedFret = interactedFret.fret + fretOffset;

    // Check if current fret is within tolerance (±1 fret)
    const isTemporallyClose = Math.abs(fret - expectedFret) <= 1;

    if (!isTemporallyClose) return null;

    // Calculate harmonic brightness using IntelligentMelodyService
    const scaleNotes = getCurrentScale();
    const harmonicBrightness = melodyService.calculateNoteBrightness(
      currentPitch,
      0, // Use step 0 (strong beat)
      chord,
      scaleNotes,
      _intelligentMelodySettings,
      lastPitch, // Pass last pitch for interval-based adjustments
      false // Not a placed note
    );

    return harmonicBrightness * proximityMultiplier;
  }, [
    showHarmonicGuidance,
    getCurrentScale,
    currentTuningMIDI,
    chord,
    melodyService,
    _intelligentMelodySettings
  ]);

  // Use the MIDI input hook with auto-connect and keyboard fallback
  const { activeNotes: activeMIDINotes, isKeyboardMode } = useMIDIInput({
    autoInitialize: true,
    autoSelectFirst: true, // Auto-connect to first available MIDI device
    keyboardFallback: true, // Fallback to keyboard if no MIDI device available
    onNoteOn: (note, velocity) => {
      // Play note via Tone.js
      if (guitarSynth) {
        const freq = Tone.Frequency(note, 'midi').toFrequency();
        guitarSynth.triggerAttack(freq, undefined, velocity / 127);
      }
    },
    onNoteOff: (note) => {
      // Release note
      if (guitarSynth) {
        const freq = Tone.Frequency(note, 'midi').toFrequency();
        guitarSynth.triggerRelease(freq);
      }
    },
  });

  // Initialize Tone.js guitar sampler with real acoustic guitar samples
  useEffect(() => {
    // Create reverb for spatial depth
    const reverb = new Tone.Reverb({
      decay: 1.8,
      wet: 0.25
    }).toDestination();

    // Use Tone.Sampler with real acoustic guitar samples
    // From Tonejs-Instruments library - verified available samples
    const sampler = new Tone.Sampler({
      urls: {
        A2: "A2.mp3",
        A3: "A3.mp3",
        A4: "A4.mp3",
        C3: "C3.mp3",
        C4: "C4.mp3",
        C5: "C5.mp3",
        "D#3": "Ds3.mp3",
        "D#4": "Ds4.mp3",
        "F#2": "Fs2.mp3",
        "F#3": "Fs3.mp3",
        "F#4": "Fs4.mp3",
      },
      baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/guitar-acoustic/",
      onload: () => {
        console.log('🎸 Acoustic guitar samples loaded successfully');
      },
      volume: -4,
      release: 1
    }).connect(reverb);

    setGuitarSynth(sampler as any);

    return () => {
      sampler.dispose();
      reverb.dispose();
    };
  }, []);

  // Auto-advance chords every 5 seconds (only when playing)
  useEffect(() => {
    if (!localIsPlaying) return;

    const interval = setInterval(() => {
      setCurrentChord(prev => (prev + 1) % progression.chords.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [progression, localIsPlaying]);

  /**
   * Play the current chord notes
   */
  const playChord = useCallback((chordNotes: typeof chord.notes) => {
    if (!guitarSynth) return;

    const midiNotes: number[] = [];
    const frequencies = chordNotes.map(cn => {
      // Convert from guitar string notation (1-6, where 1=high E, 6=low E)
      // to array index (0-5, where 0=low E, 5=high E)
      const stringIndex = GUITAR_CONSTANTS.STRINGS - cn.string;
      const midiNote = getMIDINoteFromFret(stringIndex, cn.fret, currentTuningMIDI);
      midiNotes.push(midiNote);
      return Tone.Frequency(midiNote, 'midi').toFrequency();
    });

    // Send MIDI to visualizer (Studio inter-module communication)
    const sourceManager = (window as any).frequencySourceManager;
    if (sourceManager) {
      midiNotes.forEach((midiNote, i) => {
        const noteClass = midiNote % 12;
        const noteColor = getNoteColor(noteClass, colorMode);
        setTimeout(() => {
          sourceManager.addMidiNote(midiNote, 102, noteColor); // velocity ~80%
        }, i * 50); // Stagger with strum effect
      });
    }

    // Emit MIDI events to event bus for cross-module communication (Epic 14)
    midiNotes.forEach((midiNote, i) => {
      const noteForColor = colorMode === 'spectrum' ? midiNote : (midiNote % 12);
      const noteColor = getNoteColor(noteForColor, colorMode);

      setTimeout(() => {
        // Note on
        midiEventBus.emitNoteOn({
          note: midiNote,
          velocity: 102, // ~80%
          timestamp: performance.now(),
          source: 'guitar-fretboard',
          color: noteColor
        });

        // Note off after 2 seconds (matching guitar sustain)
        setTimeout(() => {
          midiEventBus.emitNoteOff(midiNote, 'guitar-fretboard');
        }, 2000);
      }, i * 50); // Stagger with strum effect
    });

    // Strum effect: play notes slightly offset
    frequencies.forEach((freq, i) => {
      setTimeout(() => {
        guitarSynth.triggerAttackRelease(freq, '2');
      }, i * 50); // 50ms strum delay between notes
    });
  }, [guitarSynth, currentTuningMIDI, colorMode]);

  /**
   * Play current chord when it changes (if playing mode is active)
   */
  useEffect(() => {
    if (localIsPlaying && guitarSynth) {
      playChord(chord.notes);
    }
  }, [currentChord, localIsPlaying, guitarSynth, playChord, chord.notes]);

  /**
   * Toggle play/pause for chord progression (module-specific control)
   * This controls only this module, not other modules
   */
  const togglePlayPause = useCallback(() => {
    const newPlayingState = !localIsPlaying;
    setLocalIsPlaying(newPlayingState);

    // Enable chord progression when starting playback
    if (newPlayingState) {
      setChordProgressionEnabled(true);
      // Play chord immediately when starting
      if (guitarSynth) {
        playChord(chord.notes);
      }
    }
  }, [localIsPlaying, guitarSynth, playChord, chord.notes]);

  // Handle fret clicks
  const handleFretClick = useCallback((string: number, fret: number) => {
    if (!guitarSynth) return;

    // Update last interacted fret for temporal proximity highlighting (Story 16.2)
    setLastInteractedFret({ string, fret });

    // Calculate MIDI note from fret position
    const midiNote = getMIDINoteFromFret(string, fret, currentTuningMIDI);
    const freq = Tone.Frequency(midiNote, 'midi').toFrequency();

    // Add note to clicked notes Set for interval guide
    setClickedNotes(prev => new Set(prev).add(midiNote));

    // Play the note with 2-second sustain
    guitarSynth.triggerAttackRelease(freq, '2');

    // Send MIDI to visualizer (Studio inter-module communication)
    const sourceManager = (window as any).frequencySourceManager;
    if (sourceManager) {
      const noteClass = midiNote % 12;
      const noteColor = getNoteColor(noteClass, colorMode);
      sourceManager.addMidiNote(midiNote, 102, noteColor); // velocity ~80% (102/127)
    }

    // Emit MIDI event to event bus for cross-module communication (Epic 14)
    const noteForColor = colorMode === 'spectrum' ? midiNote : (midiNote % 12);
    const noteColor = getNoteColor(noteForColor, colorMode);
    midiEventBus.emitNoteOn({
      note: midiNote,
      velocity: 102, // ~80%
      timestamp: performance.now(),
      source: 'guitar-fretboard',
      color: noteColor
    });

    // Remove note from clicked notes after 2 seconds (matching sustain)
    setTimeout(() => {
      setClickedNotes(prev => {
        const next = new Set(prev);
        next.delete(midiNote);
        return next;
      });
      // Emit note off
      midiEventBus.emitNoteOff(midiNote, 'guitar-fretboard');
    }, 2000); // 2 second sustain
  }, [guitarSynth, currentTuningMIDI, selectedTuning, colorMode]);

  /**
   * Handle fret hover for temporal proximity highlighting (Story 16.2)
   */
  const handleFretHover = useCallback((string: number, fret: number) => {
    setLastInteractedFret({ string, fret });
  }, []);

  /**
   * Handle fret hover leave (Story 16.2)
   * Note: We intentionally DON'T clear lastInteractedFret here,
   * so the temporal proximity highlighting persists after hover leaves
   */
  const handleFretHoverLeave = useCallback(() => {
    // Intentionally empty - highlighting persists
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'c' || e.key === 'C') {
        // Cycle through all three color modes: chromatic -> harmonic -> spectrum -> chromatic
        const nextMode = colorMode === 'chromatic' ? 'harmonic' : colorMode === 'harmonic' ? 'spectrum' : 'chromatic';
        updateColorMode(nextMode);
      } else if (e.key === 'n' || e.key === 'N') {
        setCurrentProgressionIndex(prev => (prev + 1) % ROMAN_NUMERAL_PROGRESSIONS.length);
        setCurrentChord(0);
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [togglePlayPause, updateColorMode, colorMode]);

  // Cross-module MIDI listening (Epic 14 - Inter-Module Communication)
  // Listen to MIDI notes from other modules (Piano, Drums) via MIDI event bus
  const [crossModuleNotes, setCrossModuleNotes] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Subscribe to note-on events
    const unsubscribeOn = midiEventBus.onNoteOn((event) => {
      // Ignore notes from guitar itself to avoid feedback
      if (event.source === 'guitar-fretboard') return;

      setCrossModuleNotes(prev => {
        const next = new Set(prev);
        next.add(event.note);
        return next;
      });
    });

    // Subscribe to note-off events
    const unsubscribeOff = midiEventBus.onNoteOff((note, source) => {
      // Ignore notes from guitar itself
      if (source === 'guitar-fretboard') return;

      setCrossModuleNotes(prev => {
        const next = new Set(prev);
        next.delete(note);
        return next;
      });
    });

    // Cleanup on unmount
    return () => {
      unsubscribeOn();
      unsubscribeOff();
    };
  }, []);

  // ModuleRoutingService integration (Epic 15 - Module Routing System)
  // Subscribe to note events from other modules
  // NOTE: Module registration is handled by useModuleManager, not here!
  const [crossModuleRoutedNotes, setCrossModuleRoutedNotes] = useState<Set<number>>(new Set());
  const routingService = ModuleRoutingService.getInstance();

  useEffect(() => {
    // Subscribe to note events from ModuleRoutingService
    // Registration is already handled by useModuleManager when module is added to Studio
    const unsubscribe = routingService.subscribeToNoteEvents(
      instanceId,
      (event: NoteEvent) => {
        console.log('[GuitarFretboard] Received note event:', event);

        if (event.type === 'note-on') {
          setCrossModuleRoutedNotes(prev => {
            const next = new Set(prev);
            next.add(event.pitch);
            return next;
          });
        } else if (event.type === 'note-off') {
          setCrossModuleRoutedNotes(prev => {
            const next = new Set(prev);
            next.delete(event.pitch);
            return next;
          });
        }
      }
    );

    console.log('[GuitarFretboard] Subscribed to ModuleRoutingService:', instanceId);

    // Cleanup on unmount - only unsubscribe, don't unregister (useModuleManager handles that)
    return () => {
      unsubscribe();
      console.log('[GuitarFretboard] Unsubscribed from ModuleRoutingService:', instanceId);
    };
  }, [instanceId, routingService]);

  // Combine clicked notes with MIDI input notes and cross-module notes for interval guide
  const allActiveNotes = useMemo(() => {
    const combined = new Set(activeMIDINotes);
    clickedNotes.forEach(note => combined.add(note));
    crossModuleNotes.forEach(note => combined.add(note));
    crossModuleRoutedNotes.forEach(note => combined.add(note));
    return combined;
  }, [activeMIDINotes, clickedNotes, crossModuleNotes, crossModuleRoutedNotes]);

  /**
   * Get unique note colors for a chord based on active color mode
   * Returns array of {noteClass, color} for visual indicators
   */
  const getChordNoteColors = useCallback((chordNotes: typeof chord.notes) => {
    const noteClasses = new Set<number>();
    const noteColors: Array<{ noteClass: number; color: { r: number; g: number; b: number } }> = [];

    chordNotes.forEach(cn => {
      const stringIndex = GUITAR_CONSTANTS.STRINGS - cn.string;
      const midiNote = getMIDINoteFromFret(stringIndex, cn.fret, currentTuningMIDI);
      const noteClass = midiNote % 12;

      // Only add unique note classes
      if (!noteClasses.has(noteClass)) {
        noteClasses.add(noteClass);
        // Spectrum mode: use full MIDI note range (low=red, high=purple)
        // Chromatic/Harmonic: use note class (repeating colors per octave)
        const noteForColor = colorMode === 'spectrum' ? midiNote : noteClass;
        const color = getNoteColor(noteForColor, colorMode);
        noteColors.push({ noteClass, color });
      }
    });

    // Sort by note class for consistent ordering
    return noteColors.sort((a, b) => a.noteClass - b.noteClass);
  }, [currentTuningMIDI, colorMode]);

  // Generate LED matrix data for LED Compositor (Epic 14, Story 14.4)
  const generateLEDData = useCallback((): { hex: string[], rgb: Uint8ClampedArray } => {
    const ledDataHex: string[] = Array(150).fill('000000');
    const ledDataRGB = new Uint8ClampedArray(150 * 3);
    const currentScaleNotes = getCurrentScale();

    for (let string = 0; string < 6; string++) {
      for (let fret = 0; fret < 25; fret++) {
        const noteClass = fretboardMatrix[string][fret];
        // Convert from guitar string notation (1-6) to array index (0-5)
        // Only highlight chord notes if chord progression is enabled
        const isActive = chordProgressionEnabled && chord.notes.some(cn => GUITAR_CONSTANTS.STRINGS - cn.string === string && cn.fret === fret);

        // Spectrum mode: use full MIDI note range (low=red, high=purple)
        // Chromatic/Harmonic: use note class (repeating colors per octave)
        const midiNote = getMIDINoteFromFret(string, fret, currentTuningMIDI);
        const noteForColor = colorMode === 'spectrum' ? midiNote : noteClass;
        const color = getNoteColor(noteForColor, colorMode);

        // 3-tier brightness system:
        // - Triggered: 1.0 (full brightness)
        // - In-scale (not triggered): 0.65 (bright)
        // - Out-of-scale: 0.2 (dim but colored)
        let brightness = 0.2; // Default: out-of-scale
        const isInScale = currentScaleNotes.includes(noteClass);

        if (isActive) {
          brightness = 1.0; // Triggered
        } else if (isInScale) {
          brightness = 0.65; // In-scale but not triggered
        }

        const ledIndex = fretboardToLEDIndex(string, fret);
        const r = Math.round(color.r * brightness);
        const g = Math.round(color.g * brightness);
        const b = Math.round(color.b * brightness);

        // Hex format for legacy WLED support
        ledDataHex[ledIndex] = r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');

        // RGB format for LED Compositor
        ledDataRGB[ledIndex * 3 + 0] = r;
        ledDataRGB[ledIndex * 3 + 1] = g;
        ledDataRGB[ledIndex * 3 + 2] = b;
      }
    }

    return { hex: ledDataHex, rgb: ledDataRGB };
  }, [chord, colorMode, fretboardMatrix, getCurrentScale, chordProgressionEnabled]);

  // Submit frames to LED Compositor (Epic 14, Story 14.7)
  // Continuously update LED output at 30 FPS
  useEffect(() => {
    const submitToCompositor = () => {
      const ledData = generateLEDData();

      // Submit to LED Compositor
      ledCompositor.submitFrame({
        moduleId: 'guitar-fretboard',
        deviceId: 'wled-guitar-matrix', // Fixed device ID for guitar LED matrix
        timestamp: performance.now(),
        pixelData: ledData.rgb,
        visualizationMode: 'note-per-led', // Guitar fretboard = 150 note-per-led addressing
      });
    };

    // Submit at 30 FPS (compositor handles rate limiting)
    const interval = setInterval(submitToCompositor, 1000 / 30);
    return () => clearInterval(interval);
  }, [generateLEDData]);

  // Embedded mode: compact layout without full-page wrapper
  if (embedded) {
    return (
      <div className="space-y-4">
        {/* Compact Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Guitar className="w-5 h-5 text-primary-500" />
            <div>
              <h2 className="text-lg font-bold text-white">Guitar Fretboard</h2>
              <p className="text-xs text-gray-400">
                {progression.name} - {chord.name}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Toggle settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Fretboard Canvas */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <FretboardCanvas
            activeChord={chordProgressionEnabled ? chord.notes : []}
            activeMIDINotes={allActiveNotes}
            colorMode={colorMode}
            onFretClick={handleFretClick}
            scaleNotes={getCurrentScale()}
            rootNote={ROOT_POSITIONS[selectedRoot]}
            calculateBrightness={calculateFretBrightness}
            hoveredFret={lastInteractedFret}
            onFretHover={handleFretHover}
            onFretHoverLeave={handleFretHoverLeave}
            calculateTemporalProximity={calculateTemporalProximityBrightness}
          />
        </div>

        {/* Chord Progression Controls */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-300">Chord Progression</h3>
            <button
              onClick={togglePlayPause}
              className={`p-2 rounded-lg transition-colors ${
                localIsPlaying
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
              aria-label={localIsPlaying ? 'Pause' : 'Play'}
            >
              {localIsPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
          </div>

          {/* Progression Selector */}
          <div className="relative mb-3">
            <button
              onClick={() => setShowProgressionMenu(!showProgressionMenu)}
              className="w-full flex items-center justify-between px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <div className="flex flex-col items-start">
                <span className="font-medium text-sm">{selectedRomanProgression.name}</span>
                <span className="text-xs text-gray-400">{selectedRomanProgression.romanNumerals.join(' - ')}</span>
              </div>
              <span className="text-xs ml-2">▼</span>
            </button>

            {showProgressionMenu && (
              <div className="absolute top-full mt-2 left-0 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50 max-h-64 overflow-y-auto">
                {ROMAN_NUMERAL_PROGRESSIONS.map((prog, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentProgressionIndex(index);
                      setCurrentChord(0);
                      setShowProgressionMenu(false);
                      // Stop playback when changing progression
                      if (localIsPlaying) {
                        setLocalIsPlaying(false);
                      }
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0 ${
                      currentProgressionIndex === index
                        ? 'bg-primary-900 text-primary-400'
                        : 'text-white'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{prog.name}</span>
                      <span className="text-xs text-gray-400">{prog.romanNumerals.join(' - ')}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Chord List - Horizontal scrollable row */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {progression.chords.map((c, i) => {
              const noteColors = getChordNoteColors(c.notes);
              return (
                <button
                  key={i}
                  onClick={() => {
                    setChordProgressionEnabled(true); // Enable chord progression when manually selecting
                    setCurrentChord(i);
                    if (guitarSynth) playChord(c.notes);
                  }}
                  className={`flex-shrink-0 p-2 rounded-lg transition-colors min-w-[64px] ${
                    i === currentChord
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="font-medium text-sm mb-1">{c.name}</span>
                    <span className="text-xs opacity-75 mb-2">{selectedRomanProgression.romanNumerals[i]}</span>
                    {/* Color indicators showing notes in the chord */}
                    <div className="flex gap-1">
                      {noteColors.map((nc, idx) => (
                        <div
                          key={idx}
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: `rgb(${nc.color.r}, ${nc.color.g}, ${nc.color.b})`
                          }}
                          title={`Note ${nc.noteClass}`}
                        />
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Settings (when expanded) */}
        {showSettings && (
          <>
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Guitar Tuning</h3>
              <div className="relative mb-3">
                <button
                  onClick={() => setShowTuningMenu(!showTuningMenu)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-sm">{selectedTuning.name}</span>
                    <span className="text-xs text-gray-400">{selectedTuning.strings.join(' ')}</span>
                  </div>
                  <span className="text-xs ml-2">▼</span>
                </button>

                {showTuningMenu && (
                  <div className="absolute top-full mt-2 left-0 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50 max-h-64 overflow-y-auto">
                    {GUITAR_TUNINGS.map((tuning, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedTuning(tuning);
                          setShowTuningMenu(false);
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0 ${
                          selectedTuning.name === tuning.name
                            ? 'bg-primary-900 text-primary-400'
                            : 'text-white'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{tuning.name}</span>
                          <span className="text-xs text-gray-400">{tuning.strings.join(' ')}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-3">MIDI Input</h3>
              <MIDIDeviceSelector />
            </div>

            <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-3">WLED LED Matrix</h3>
              <WLEDDeviceManager
                ledData={generateLEDData().hex}
                layout="desktop"
                storageKey="wled-guitar-fretboard"
                deviceType="matrix"
              />
            </div>
          </>
        )}
      </div>
    );
  }

  // Standalone mode: full-page layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Go back"
              >
                ←
              </button>
            )}
            <Guitar className="w-6 h-6 text-primary-500" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Guitar Fretboard</h1>
              <p className="text-sm text-gray-400">
                {progression.name} - {chord.name} | {getKeySignature()}
              </p>
            </div>
            <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-lg">
              Beta
            </span>
            {isKeyboardMode && (
              <span className="px-2 py-1 bg-primary-600/30 text-primary-300 text-xs font-medium rounded-lg">
                Keyboard Mode
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Scale/Key Selector - Only show in standalone mode */}
            {isStandalone && (
              <ScaleSelector
                selectedRoot={selectedRoot}
                selectedScale={selectedScale}
                rootNotes={rootNotes}
                scaleNames={scaleNames}
                onRootChange={updateKey}
                onScaleChange={updateScale}
                rootColor="blue"
                scaleColor="indigo"
                showIcon={false}
              />
            )}

            {/* Color Mode Toggle - Only show in standalone mode */}
            {isStandalone && (
              <div className="flex gap-1">
                <button
                  onClick={() => updateColorMode('chromatic')}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    colorMode === 'chromatic'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Chromatic
                </button>
                <button
                  onClick={() => updateColorMode('harmonic')}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    colorMode === 'harmonic'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Harmonic
                </button>
                <button
                  onClick={() => updateColorMode('spectrum')}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    colorMode === 'spectrum'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Spectrum
                </button>
              </div>
            )}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Fretboard Canvas */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
              <FretboardCanvas
                activeChord={chordProgressionEnabled ? chord.notes : []}
                activeMIDINotes={allActiveNotes}
                colorMode={colorMode}
                onFretClick={handleFretClick}
                scaleNotes={getCurrentScale()}
                rootNote={ROOT_POSITIONS[selectedRoot]}
                calculateBrightness={calculateFretBrightness}
                hoveredFret={lastInteractedFret}
                onFretHover={handleFretHover}
                onFretHoverLeave={handleFretHoverLeave}
                calculateTemporalProximity={calculateTemporalProximityBrightness}
              />
              <p className="text-sm text-gray-400 mt-2 text-center">
                Click or hover frets to see melodic pathways | Press 'C' for color mode | Press 'N' for next progression | Press 'Space' to play/pause
              </p>
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-4">
            {/* Progression Info */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-300">Chord Progression</h3>
                <button
                  onClick={togglePlayPause}
                  className={`p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                    localIsPlaying
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                  aria-label={localIsPlaying ? 'Pause' : 'Play'}
                >
                  {localIsPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
              </div>

              {/* Progression Style Selector */}
              <div className="relative mb-3">
                <button
                  onClick={() => setShowProgressionMenu(!showProgressionMenu)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors min-h-[44px] text-sm"
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{selectedRomanProgression.name}</span>
                    <span className="text-xs text-gray-400">{selectedRomanProgression.romanNumerals.join(' - ')}</span>
                  </div>
                  <span className="text-xs ml-2">▼</span>
                </button>

                {showProgressionMenu && (
                  <div className="absolute top-full mt-2 left-0 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50 max-h-96 overflow-y-auto">
                    {ROMAN_NUMERAL_PROGRESSIONS.map((prog, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setCurrentProgressionIndex(index);
                          setCurrentChord(0);
                          setShowProgressionMenu(false);
                          // Stop playback when changing progression
                          if (localIsPlaying) {
                            setLocalIsPlaying(false);
                          }
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors min-h-[44px] border-b border-gray-700 last:border-b-0 ${
                          currentProgressionIndex === index
                            ? 'bg-primary-900 text-primary-400'
                            : 'text-white'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{prog.name}</span>
                          <span className="text-xs text-gray-400">{prog.romanNumerals.join(' - ')}</span>
                          <span className="text-xs text-gray-500 mt-1">{prog.genre} • {prog.description}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Chord List - Horizontal scrollable row */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {progression.chords.map((c, i) => {
                  const noteColors = getChordNoteColors(c.notes);
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setChordProgressionEnabled(true); // Enable chord progression when manually selecting
                        setCurrentChord(i);
                        if (guitarSynth) playChord(c.notes);
                      }}
                      className={`flex-shrink-0 p-2 rounded-lg transition-colors min-w-[64px] ${
                        i === currentChord
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <span className="font-medium text-sm mb-1">{c.name}</span>
                        <span className="text-xs opacity-75 mb-2">{selectedRomanProgression.romanNumerals[i]}</span>
                        {/* Color indicators showing notes in the chord */}
                        <div className="flex gap-1">
                          {noteColors.map((nc, idx) => (
                            <div
                              key={idx}
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor: `rgb(${nc.color.r}, ${nc.color.g}, ${nc.color.b})`
                              }}
                              title={`Note ${nc.noteClass}`}
                            />
                          ))}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Settings Panels */}
            {showSettings && (
              <>
                {/* Harmonic Guidance Toggle (Story 16.1) */}
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">Harmonic Guidance</h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showHarmonicGuidance}
                      onChange={(e) => setShowHarmonicGuidance(e.target.checked)}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className="text-sm text-white">Show Harmonic Guidance</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    Highlight harmonically optimal fret positions based on current chord and scale
                  </p>
                </div>

                {/* Tuning Selector */}
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">Guitar Tuning</h3>

                  <div className="relative mb-3">
                    <button
                      onClick={() => setShowTuningMenu(!showTuningMenu)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors min-h-[44px] text-sm"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{selectedTuning.name}</span>
                        <span className="text-xs text-gray-400">{selectedTuning.strings.join(' ')}</span>
                      </div>
                      <span className="text-xs ml-2">▼</span>
                    </button>

                    {showTuningMenu && (
                      <div className="absolute top-full mt-2 left-0 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50 max-h-96 overflow-y-auto">
                        {GUITAR_TUNINGS.map((tuning, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setSelectedTuning(tuning);
                              setShowTuningMenu(false);
                            }}
                            className={`w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors min-h-[44px] border-b border-gray-700 last:border-b-0 ${
                              selectedTuning.name === tuning.name
                                ? 'bg-primary-900 text-primary-400'
                                : 'text-white'
                            }`}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">{tuning.name}</span>
                              <span className="text-xs text-gray-400">{tuning.strings.join(' ')}</span>
                              <span className="text-xs text-gray-500 mt-1">{tuning.description}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-gray-500">
                    <p className="mb-1">Category: <span className="text-gray-400 capitalize">{selectedTuning.category}</span></p>
                    <p>{selectedTuning.description}</p>
                  </div>
                </div>

                {/* MIDI Device Selector */}
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">MIDI Input</h3>
                  <MIDIDeviceSelector />
                </div>

                {/* WLED LED Matrix */}
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">WLED LED Matrix</h3>
                  <WLEDDeviceManager
                    ledData={generateLEDData().hex}
                    layout="desktop"
                    storageKey="wled-guitar-fretboard"
                    deviceType="matrix"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
