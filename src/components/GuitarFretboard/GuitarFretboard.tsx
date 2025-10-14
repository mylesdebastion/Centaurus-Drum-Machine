// Main Guitar Fretboard Component
// Story 9.3: Guitar Fretboard Visualizer with LED Matrix Output

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as Tone from 'tone';
import { Guitar, Settings, Play, Pause } from 'lucide-react';
import { FretboardCanvas } from './FretboardCanvas';
import { MIDIDeviceSelector } from '../MIDI/MIDIDeviceSelector';
import WLEDDeviceManager from '../WLED/WLEDDeviceManager';
import { ColorMode, getNoteColor } from '../../utils/colorMapping';
import {
  ROMAN_NUMERAL_PROGRESSIONS,
  resolveProgression
} from './chordProgressions';
import { createFretboardMatrix, getMIDINoteFromFret, fretboardToLEDIndex, GUITAR_CONSTANTS } from './constants';
import { useMIDIInput } from '../../hooks/useMIDIInput';
import { useMusicalScale, ROOT_POSITIONS } from '../../hooks/useMusicalScale';
import { ScaleSelector } from '../Music/ScaleSelector';
import { GUITAR_TUNINGS, getTuningMIDINotes, type GuitarTuning } from './tunings';
import { useModuleContext } from '../../hooks/useModuleContext';
import { useGlobalMusic } from '../../contexts/GlobalMusicContext';
import { ledCompositor } from '../../services/LEDCompositor';

interface GuitarFretboardProps {
  /**
   * Callback when user clicks the back button
   */
  onBack?: () => void;
  /**
   * Whether this module is embedded in Studio (affects layout)
   */
  embedded?: boolean;
}

export const GuitarFretboard: React.FC<GuitarFretboardProps> = ({ onBack, embedded = false }) => {
  // Module Adapter Pattern - Context Detection (Epic 14, Story 14.4)
  const context = useModuleContext();
  const globalMusic = useGlobalMusic();
  const isStandalone = context === 'standalone';

  // Local state (used when standalone)
  const [currentProgressionIndex, setCurrentProgressionIndex] = useState(0);
  const [currentChord, setCurrentChord] = useState(0);
  const [localColorMode, setLocalColorMode] = useState<ColorMode>('chromatic');
  const [guitarSynth, setGuitarSynth] = useState<Tone.PolySynth | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [localIsPlaying, setLocalIsPlaying] = useState(false); // Local playback state
  const [showProgressionMenu, setShowProgressionMenu] = useState(false);
  const [selectedTuning, setSelectedTuning] = useState<GuitarTuning>(GUITAR_TUNINGS[0]); // Standard tuning
  const [showTuningMenu, setShowTuningMenu] = useState(false);

  // Track clicked notes for interval guide (separate from chord diagram notes)
  const [clickedNotes, setClickedNotes] = useState<Set<number>>(new Set());

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
  const updateColorMode = useCallback((mode: 'chromatic' | 'harmonic') => {
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

  // Resolve Roman numeral progression to actual chords based on selected key
  const selectedRomanProgression = ROMAN_NUMERAL_PROGRESSIONS[currentProgressionIndex];
  const progression = resolveProgression(selectedRomanProgression, selectedRoot) || {
    name: 'Loading...',
    chords: [{ name: 'C', notes: [] }],
    romanNumerals: ['I']
  };
  const chord = progression.chords[currentChord] || { name: 'C', notes: [] };

  // Log when tuning changes
  useEffect(() => {
    console.group(`🎸 Tuning Changed: ${selectedTuning.name}`);
    console.log(`📝 Category: ${selectedTuning.category}`);
    console.log(`🎵 Strings (low to high): ${selectedTuning.strings.join(' - ')}`);
    console.log(`🎹 MIDI Notes: [${currentTuningMIDI.join(', ')}]`);
    console.log(`💬 Description: ${selectedTuning.description}`);
    console.groupEnd();
  }, [selectedTuning, currentTuningMIDI]);

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
        setTimeout(() => {
          sourceManager.addMidiNote(midiNote, 102); // velocity ~80%
        }, i * 50); // Stagger with strum effect
      });
    }

    // Strum effect: play notes slightly offset
    frequencies.forEach((freq, i) => {
      setTimeout(() => {
        guitarSynth.triggerAttackRelease(freq, '2');
      }, i * 50); // 50ms strum delay between notes
    });
  }, [guitarSynth, currentTuningMIDI]);

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

    // Play chord immediately when starting
    if (newPlayingState && guitarSynth) {
      playChord(chord.notes);
    }
  }, [localIsPlaying, guitarSynth, playChord, chord.notes]);

  // Handle fret clicks
  const handleFretClick = useCallback((string: number, fret: number) => {
    if (!guitarSynth) return;

    // Calculate MIDI note from fret position
    const midiNote = getMIDINoteFromFret(string, fret, currentTuningMIDI);
    const freq = Tone.Frequency(midiNote, 'midi').toFrequency();

    // Convert MIDI note to note name
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midiNote / 12) - 1;
    const noteName = noteNames[midiNote % 12];
    const fullNoteName = `${noteName}${octave}`;

    // Get string names for context
    const stringNames = ['E (low)', 'A', 'D', 'G', 'B', 'E (high)'];
    const openStringNote = selectedTuning.strings[string];

    // Log comprehensive debugging info
    console.group(`🎸 Fret Click: String ${string + 1}, Fret ${fret}`);
    console.log(`📍 Position: ${stringNames[string]} string, fret ${fret}`);
    console.log(`🎚️ Tuning: ${selectedTuning.name}`);
    console.log(`🎵 Open String: ${openStringNote} (MIDI ${currentTuningMIDI[string]})`);
    console.log(`🎹 Calculated Note: ${fullNoteName} (MIDI ${midiNote})`);
    console.log(`🔊 Frequency: ${freq.toFixed(2)} Hz`);
    console.log(`🎼 Tuning Array: [${selectedTuning.strings.join(', ')}]`);
    console.log(`🎯 Interval Guide: Note will be tracked for brightness system`);
    console.groupEnd();

    // Add note to clicked notes Set for interval guide
    setClickedNotes(prev => new Set(prev).add(midiNote));

    // Play the note with 2-second sustain
    guitarSynth.triggerAttackRelease(freq, '2');

    // Send MIDI to visualizer (Studio inter-module communication)
    const sourceManager = (window as any).frequencySourceManager;
    if (sourceManager) {
      sourceManager.addMidiNote(midiNote, 102); // velocity ~80% (102/127)
    }

    // Remove note from clicked notes after 2 seconds (matching sustain)
    setTimeout(() => {
      setClickedNotes(prev => {
        const next = new Set(prev);
        next.delete(midiNote);
        return next;
      });
    }, 2000); // 2 second sustain
  }, [guitarSynth, currentTuningMIDI, selectedTuning]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'c' || e.key === 'C') {
        updateColorMode(colorMode === 'chromatic' ? 'harmonic' : 'chromatic');
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

  // Combine clicked notes with MIDI input notes for interval guide
  const allActiveNotes = useMemo(() => {
    const combined = new Set(activeMIDINotes);
    clickedNotes.forEach(note => combined.add(note));
    return combined;
  }, [activeMIDINotes, clickedNotes]);

  // Generate LED matrix data for LED Compositor (Epic 14, Story 14.4)
  const generateLEDData = useCallback((): { hex: string[], rgb: Uint8ClampedArray } => {
    const ledDataHex: string[] = Array(150).fill('000000');
    const ledDataRGB = new Uint8ClampedArray(150 * 3);
    const currentScaleNotes = getCurrentScale();

    for (let string = 0; string < 6; string++) {
      for (let fret = 0; fret < 25; fret++) {
        const noteClass = fretboardMatrix[string][fret];
        // Convert from guitar string notation (1-6) to array index (0-5)
        const isActive = chord.notes.some(cn => GUITAR_CONSTANTS.STRINGS - cn.string === string && cn.fret === fret);
        const color = getNoteColor(noteClass, colorMode);

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
  }, [chord, colorMode, fretboardMatrix, getCurrentScale]);

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
            activeChord={chord.notes}
            activeMIDINotes={allActiveNotes}
            colorMode={colorMode}
            onFretClick={handleFretClick}
            scaleNotes={getCurrentScale()}
            rootNote={ROOT_POSITIONS[selectedRoot]}
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

          {/* Chord List */}
          <div className="space-y-2">
            {progression.chords.map((c, i) => (
              <button
                key={i}
                onClick={() => {
                  setCurrentChord(i);
                  if (guitarSynth) playChord(c.notes);
                }}
                className={`w-full p-2 rounded-lg transition-colors text-left ${
                  i === currentChord
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-xs opacity-75">{selectedRomanProgression.romanNumerals[i]}</span>
                </div>
              </button>
            ))}
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

            {/* Chromatic/Harmonic Toggle - Only show in standalone mode */}
            {isStandalone && (
              <button
                onClick={() => updateColorMode(colorMode === 'chromatic' ? 'harmonic' : 'chromatic')}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors min-h-[44px] text-sm"
              >
                {colorMode === 'chromatic' ? 'Chromatic' : 'Harmonic'}
              </button>
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
                activeChord={chord.notes}
                activeMIDINotes={allActiveNotes}
                colorMode={colorMode}
                onFretClick={handleFretClick}
                scaleNotes={getCurrentScale()}
                rootNote={ROOT_POSITIONS[selectedRoot]}
              />
              <p className="text-sm text-gray-400 mt-2 text-center">
                Click frets to see interval guide | Press 'C' for color mode | Press 'N' for next progression | Press 'Space' to play/pause
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
              <div className="space-y-2">
                {progression.chords.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setCurrentChord(i);
                      if (guitarSynth) playChord(c.notes);
                    }}
                    className={`w-full p-2 rounded-lg transition-colors text-left min-h-[44px] ${
                      i === currentChord
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{c.name}</span>
                      <span className="text-xs opacity-75">{selectedRomanProgression.romanNumerals[i]}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Settings Panels */}
            {showSettings && (
              <>
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
