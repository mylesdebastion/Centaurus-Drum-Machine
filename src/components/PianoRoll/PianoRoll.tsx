import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ArrowLeft, Music, Settings, Volume2, Play, Square } from 'lucide-react';
import { PianoCanvas } from './PianoCanvas';
import { MIDIDeviceSelector } from '../MIDI/MIDIDeviceSelector';
import { CollapsiblePanel } from '../Layout/CollapsiblePanel';
import { useMIDIInput } from '../../hooks/useMIDIInput';
import { audioEngine } from '../../utils/audioEngine';
import { createSoundEngine, SoundEngine, SoundEngineType, soundEngineNames } from '../../utils/soundEngines';
import { getNoteColor, type ColorMode } from '../../utils/colorMapping';
import { PIANO_CONSTANTS, LED_STRIP, getNoteNameWithOctave } from './constants';
import { CHORD_PROGRESSIONS } from '../GuitarFretboard/chordProgressions';
import { getMIDINoteFromFret } from '../GuitarFretboard/constants';
import { lumiController } from '../../utils/lumiController';
import { midiOutputManager } from '../../utils/midiOutputManager';
import { useModuleContext } from '../../hooks/useModuleContext';
import { useGlobalMusic } from '../../contexts/GlobalMusicContext';
import { ledCompositor } from '../../services/LEDCompositor';
import { midiEventBus } from '../../utils/midiEventBus';
import { ModuleRoutingService } from '../../services/moduleRoutingService';
import type { NoteEvent } from '../../types/moduleRouting';

interface PianoRollProps {
  onBack: () => void;
  instanceId?: string; // Module instance ID for routing (when embedded in Studio)
  layout?: 'mobile' | 'desktop'; // Layout mode (for module adapter pattern)
  settings?: Record<string, any>; // Module settings (for module adapter pattern)
  onSettingsChange?: (settings: Record<string, any>) => void; // Settings callback
  embedded?: boolean; // Whether embedded in Studio
}

/**
 * Piano Visualizer
 *
 * Features:
 * - 88-key interactive piano keyboard
 * - MIDI input with auto-connect and keyboard fallback
 * - Chord progression playback (13 progressions from Guitar Fretboard)
 * - Multiple sound engines (Keys, Synth, Electric, Bass)
 * - Chromatic/Harmonic color modes
 * - WLED LED strip output (144 LEDs)
 * - Click-to-play functionality
 * - Responsive octave view
 */
export const PianoRoll: React.FC<PianoRollProps> = ({
  onBack,
  instanceId = 'piano-roll-standalone',
  layout: _layout, // Reserved for module adapter pattern
  settings: _settings, // Reserved for module adapter pattern
  onSettingsChange: _onSettingsChange, // Reserved for module adapter pattern
  embedded: _embedded = false // Reserved for module adapter pattern
}) => {
  // Module Adapter Pattern - Context Detection (Epic 14, Story 14.3)
  const context = useModuleContext();
  const globalMusic = useGlobalMusic();
  const isStandalone = context === 'standalone';
  const routingService = ModuleRoutingService.getInstance();

  // Graceful Degradation - State Resolution
  // When standalone: use local state
  // When in Studio/Jam: use global state from GlobalMusicContext
  const [localColorMode, setLocalColorMode] = useState<ColorMode>('chromatic');
  const [localSelectedRoot, setLocalSelectedRoot] = useState('C');
  const [localSelectedScale, setLocalSelectedScale] = useState('major');

  // Resolved state (graceful degradation)
  const colorMode = isStandalone ? localColorMode : globalMusic.colorMode;
  const selectedRoot = isStandalone ? localSelectedRoot : globalMusic.key;
  const selectedScale = isStandalone ? localSelectedScale : globalMusic.scale;

  // Sync with global transport state when in Studio (Epic 14)
  // Global play button controls all modules, but module buttons control only themselves
  useEffect(() => {
    if (!isStandalone) {
      setLocalIsPlayingChords(globalMusic.isPlaying);
    }
  }, [globalMusic.isPlaying, isStandalone]);

  // Local-only state (not part of global context)
  const [visibleOctaves, setVisibleOctaves] = useState(4);
  const [startOctave, setStartOctave] = useState(3);
  const [wledEnabled, setWledEnabled] = useState(false);
  const [wledIP, setWledIP] = useState('192.168.8.106');
  const [lumiEnabled, setLumiEnabled] = useState(false);
  const [midiOutputDevices, setMidiOutputDevices] = useState<any[]>([]);
  const [selectedOutputId, setSelectedOutputId] = useState<string | null>(null);
  const [showKeyMenu, setShowKeyMenu] = useState(false);
  const [showScaleMenu, setShowScaleMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);

  // Chord progression state
  const [selectedProgressionIndex, setSelectedProgressionIndex] = useState(0);
  const [selectedChordIndex, setSelectedChordIndex] = useState(0);
  const [showProgressionMenu, setShowProgressionMenu] = useState(false);
  const [chordProgressionEnabled, setChordProgressionEnabled] = useState(false);
  const [localIsPlayingChords, setLocalIsPlayingChords] = useState(false);

  // Sound engine state
  const [selectedSoundEngine, setSelectedSoundEngine] = useState<SoundEngineType>('keys');
  const [showSoundMenu, setShowSoundMenu] = useState(false);
  const audioContextRef = useRef<AudioContext>();
  const masterGainRef = useRef<GainNode>();
  const soundEngineRef = useRef<SoundEngine | null>(null);
  const noteReleaseTimeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const previousLumiNotesRef = useRef<Set<number>>(new Set());

  // State update helpers (Epic 14 - Module Adapter Pattern)
  // Updates local state if standalone, global state if embedded
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
  }, [isStandalone, globalMusic]);

  const updateScale = useCallback((scale: string) => {
    if (isStandalone) {
      setLocalSelectedScale(scale);
    } else {
      globalMusic.updateScale(scale);
    }
  }, [isStandalone, globalMusic]);

  // Root note positions (chromatic scale)
  const rootPositions: Record<string, number> = {
    'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
    'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
  };

  // Scale interval patterns (semitones from root)
  const scalePatterns: Record<string, number[]> = {
    'major': [0, 2, 4, 5, 7, 9, 11],        // Major scale (Ionian)
    'minor': [0, 2, 3, 5, 7, 8, 10],        // Natural minor scale (Aeolian)
    'dorian': [0, 2, 3, 5, 7, 9, 10],       // Dorian mode
    'phrygian': [0, 1, 3, 5, 7, 8, 10],     // Phrygian mode
    'lydian': [0, 2, 4, 6, 7, 9, 11],       // Lydian mode
    'mixolydian': [0, 2, 4, 5, 7, 9, 10],   // Mixolydian mode
    'locrian': [0, 1, 3, 5, 6, 8, 10],      // Locrian mode
    'harmonic_minor': [0, 2, 3, 5, 7, 8, 11], // Harmonic minor
    'melodic_minor': [0, 2, 3, 5, 7, 9, 11],  // Melodic minor (ascending)
    'pentatonic_major': [0, 2, 4, 7, 9],    // Major pentatonic
    'pentatonic_minor': [0, 3, 5, 7, 10],   // Minor pentatonic
    'blues': [0, 3, 5, 6, 7, 10],           // Blues scale
    'chromatic': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] // All notes
  };

  // Get current scale notes
  const getCurrentScale = useCallback(() => {
    const rootPos = rootPositions[selectedRoot];
    const pattern = scalePatterns[selectedScale];
    return pattern.map(interval => (rootPos + interval) % 12);
  }, [selectedRoot, selectedScale]);

  // Get chord notes as MIDI numbers (convert from guitar string/fret positions)
  const getChordMIDINotes = useCallback(() => {
    if (!chordProgressionEnabled) return new Set<number>();

    const progression = CHORD_PROGRESSIONS[selectedProgressionIndex];
    const chord = progression.chords[selectedChordIndex];
    const midiNotes = new Set<number>();

    // Convert guitar positions to MIDI notes
    // Guitar strings are numbered 1-6 (1=high E, 6=low E)
    // getMIDINoteFromFret expects 0-5 (0=low E, 5=high E)
    chord.notes.forEach((note) => {
      // Convert guitar string numbering (1-6) to array index (0-5)
      const stringIndex = 6 - note.string; // Reverse: string 6 -> index 0, string 1 -> index 5
      const midiNote = getMIDINoteFromFret(stringIndex, note.fret);
      midiNotes.add(midiNote);
    });

    return midiNotes;
  }, [chordProgressionEnabled, selectedProgressionIndex, selectedChordIndex]);

  // Play chord notes (all notes at once)
  const playCurrentChord = useCallback(() => {
    if (!soundEngineRef.current) return;

    const chordNotes = Array.from(getChordMIDINotes());

    // Send MIDI to visualizer (Studio inter-module communication)
    const sourceManager = (window as any).frequencySourceManager;
    if (sourceManager) {
      chordNotes.forEach((midiNote) => {
        const noteClass = midiNote % 12;
        const noteColor = getNoteColor(noteClass, colorMode);
        sourceManager.addMidiNote(midiNote, 89, noteColor); // velocity ~70% (89/127)
      });
    }

    // Emit MIDI events to event bus for cross-module communication (Epic 14)
    chordNotes.forEach((midiNote) => {
      const noteForColor = colorMode === 'spectrum' ? midiNote : (midiNote % 12);
      const noteColor = getNoteColor(noteForColor, colorMode);
      midiEventBus.emitNoteOn({
        note: midiNote,
        velocity: 89, // ~70%
        timestamp: performance.now(),
        source: 'piano-roll',
        color: noteColor
      });
    });

    // Trigger chord attack with error handling
    chordNotes.forEach((midiNote) => {
      const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);
      try {
        if (soundEngineRef.current?.triggerAttack) {
          soundEngineRef.current.triggerAttack(frequency, 0.7);
        } else {
          soundEngineRef.current?.playNote(frequency, 0.7, 1.0);
        }
      } catch (error) {
        // Silently catch disposed engine errors
        console.warn('[PianoVisualizer] Sound engine error (may be disposed):', error);
      }
    });

    // Release notes after 1 second
    const releaseTimeout = setTimeout(() => {
      if (soundEngineRef.current?.triggerRelease) {
        chordNotes.forEach((midiNote) => {
          const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);
          try {
            soundEngineRef.current?.triggerRelease?.(frequency);
          } catch (error) {
            // Silently catch disposed engine errors
            console.warn('[PianoVisualizer] Sound engine error (may be disposed):', error);
          }
        });
      }
      // Emit note-off events
      chordNotes.forEach((midiNote) => {
        midiEventBus.emitNoteOff(midiNote, 'piano-roll');
      });
      // Remove this timeout from tracking set
      noteReleaseTimeoutsRef.current.delete(releaseTimeout);
    }, 1000);

    // Track this timeout so we can clear it if needed
    noteReleaseTimeoutsRef.current.add(releaseTimeout);
  }, [getChordMIDINotes, colorMode]);

  // Auto-advance chords when playing
  useEffect(() => {
    if (!localIsPlayingChords || !chordProgressionEnabled) return;

    // Play current chord immediately
    playCurrentChord();

    // Set interval to advance chords
    const interval = setInterval(() => {
      const progression = CHORD_PROGRESSIONS[selectedProgressionIndex];
      setSelectedChordIndex((prev) => {
        const nextIndex = (prev + 1) % progression.chords.length;
        return nextIndex;
      });
    }, 2000); // Change chord every 2 seconds

    return () => clearInterval(interval);
  }, [localIsPlayingChords, chordProgressionEnabled, selectedProgressionIndex, playCurrentChord, selectedChordIndex]);

  // Initialize audio context and sound engine
  useEffect(() => {
    audioContextRef.current = new AudioContext();
    masterGainRef.current = audioContextRef.current.createGain();
    masterGainRef.current.connect(audioContextRef.current.destination);
    masterGainRef.current.gain.value = 0.5;

    // Initialize sound engine
    if (audioContextRef.current && masterGainRef.current) {
      soundEngineRef.current = createSoundEngine(selectedSoundEngine, audioContextRef.current, masterGainRef.current);
      setIsAudioReady(true);
      console.log('[PianoVisualizer] Sound engine initialized:', selectedSoundEngine);
    }

    // Also initialize the old audioEngine for backwards compatibility
    audioEngine.initialize().catch(console.error);

    // Initialize MIDI output for LUMI
    midiOutputManager.initialize().then(() => {
      const devices = midiOutputManager.getDevices();
      setMidiOutputDevices(devices);

      // Auto-select first LUMI device or first available device
      if (devices.length > 0) {
        const lumiDevice = devices.find(d =>
          d.name.toLowerCase().includes('lumi') ||
          d.name.toLowerCase().includes('piano m') ||
          d.name.toLowerCase().includes('roli')
        );
        const deviceToSelect = lumiDevice || devices[0];
        setSelectedOutputId(deviceToSelect.id);
        const output = midiOutputManager.selectDevice(deviceToSelect.id);
        if (output) {
          lumiController.connect(output);
          console.log('[PianoVisualizer] Auto-connected to MIDI output:', deviceToSelect.name);
        }
      }
    }).catch(error => {
      console.warn('[PianoVisualizer] MIDI output not available:', error);
    });

    return () => {
      // Clear all pending note release timeouts
      noteReleaseTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      noteReleaseTimeoutsRef.current.clear();

      // Dispose sound engine
      soundEngineRef.current?.dispose();

      // Close audio context
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }

      // Disconnect LUMI
      lumiController.disconnect();
    };
  }, []);

  // Update sound engine when selection changes
  useEffect(() => {
    if (!audioContextRef.current || !masterGainRef.current) return;

    // Stop chord playback to prevent using disposed engine
    setLocalIsPlayingChords(false);

    // Clear all pending note release timeouts
    noteReleaseTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    noteReleaseTimeoutsRef.current.clear();

    // Dispose old engine
    soundEngineRef.current?.dispose();

    // Create new engine
    soundEngineRef.current = createSoundEngine(selectedSoundEngine, audioContextRef.current, masterGainRef.current);
    console.log('[PianoVisualizer] Switched to sound engine:', selectedSoundEngine);
  }, [selectedSoundEngine]);

  // Initialize audio engine and ensure it's ready before allowing playback
  const initializeAudio = useCallback(async () => {
    if (isAudioReady) return;

    try {
      // Audio is already initialized in the useEffect above
      setIsAudioReady(true);
      console.log('[PianoVisualizer] Audio ready');
    } catch (error) {
      console.error('[PianoVisualizer] Failed to initialize audio:', error);
    }
  }, [isAudioReady]);

  // Helper function to convert MIDI note to frequency (Hz)
  const midiToFrequency = useCallback((midiNote: number): number => {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
  }, []);

  const { activeNotes: localActiveNotes, isKeyboardMode } = useMIDIInput({
    autoInitialize: true,
    autoSelectFirst: true, // Auto-connect to first available MIDI device
    keyboardFallback: true, // Fallback to keyboard if no MIDI device available
    onNoteOn: async (note, velocity) => {
      // Ensure audio is initialized on first interaction
      await initializeAudio();
      // Trigger audio playback using sound engine
      if (soundEngineRef.current) {
        const frequency = midiToFrequency(note);
        try {
          // Use triggerAttack if available (for sustaining synths), otherwise use playNote
          if (soundEngineRef.current.triggerAttack) {
            soundEngineRef.current.triggerAttack(frequency, velocity / 127);
          } else {
            soundEngineRef.current.playNote(frequency, velocity / 127, 0.5);
          }
        } catch (error) {
          console.warn('[PianoVisualizer] Sound engine error on note on:', error);
        }
      }
    },
    onNoteOff: (note) => {
      // Trigger release for sustained notes
      if (soundEngineRef.current?.triggerRelease) {
        const frequency = midiToFrequency(note);
        try {
          soundEngineRef.current.triggerRelease(frequency);
        } catch (error) {
          console.warn('[PianoVisualizer] Sound engine error on note off:', error);
        }
      }
      // Keep audioEngine for backwards compatibility
      audioEngine.triggerPianoNoteOff(note);
    },
  });

  // Cross-module MIDI listening (Epic 14 - Inter-Module Communication)
  // Listen to MIDI notes from other modules (Guitar, Drums) via MIDI event bus
  const [crossModuleNotes, setCrossModuleNotes] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Subscribe to note-on events (old event bus)
    const unsubscribeOn = midiEventBus.onNoteOn((event) => {
      // Ignore notes from piano itself to avoid feedback
      if (event.source === 'piano-roll') return;

      setCrossModuleNotes(prev => {
        const next = new Set(prev);
        next.add(event.note);
        return next;
      });
    });

    // Subscribe to note-off events (old event bus)
    const unsubscribeOff = midiEventBus.onNoteOff((note, source) => {
      // Ignore notes from piano itself
      if (source === 'piano-roll') return;

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
  useEffect(() => {
    // Subscribe to note events from ModuleRoutingService
    // Registration is already handled by useModuleManager when module is added to Studio
    const unsubscribe = routingService.subscribeToNoteEvents(
      instanceId,
      (event: NoteEvent) => {
        // Handle incoming note events from other modules
        console.log('[PianoRoll] Received note event:', event);

        if (event.type === 'note-on') {
          setCrossModuleNotes(prev => {
            const next = new Set(prev);
            next.add(event.pitch);
            return next;
          });
        } else if (event.type === 'note-off') {
          setCrossModuleNotes(prev => {
            const next = new Set(prev);
            next.delete(event.pitch);
            return next;
          });
        }
      }
    );

    console.log('[PianoRoll] Subscribed to ModuleRoutingService:', instanceId);

    // Cleanup on unmount - only unsubscribe, don't unregister (useModuleManager handles that)
    return () => {
      unsubscribe();
      console.log('[PianoRoll] Unsubscribed from ModuleRoutingService:', instanceId);
    };
  }, [instanceId, routingService]);

  // Merge local MIDI input with cross-module MIDI notes
  const activeNotes = useMemo(() => {
    const merged = new Set<number>(localActiveNotes);
    crossModuleNotes.forEach(note => merged.add(note));
    return merged;
  }, [localActiveNotes, crossModuleNotes]);

  // Initialize audio engine on mount
  useEffect(() => {
    initializeAudio();
  }, [initializeAudio]);

  /**
   * Handle key click (mouse/touch)
   */
  const handleKeyClick = useCallback(async (midiNote: number) => {
    // Ensure audio is initialized on first user interaction
    await initializeAudio();
    if (soundEngineRef.current) {
      const frequency = midiToFrequency(midiNote);
      try {
        // Use triggerAttack if available for sustaining notes
        if (soundEngineRef.current.triggerAttack) {
          soundEngineRef.current.triggerAttack(frequency, 0.8);
        } else {
          soundEngineRef.current.playNote(frequency, 0.8, 0.5);
        }
      } catch (error) {
        console.warn('[PianoVisualizer] Sound engine error on key click:', error);
      }
    }

    // Send MIDI to visualizer (Studio inter-module communication)
    const sourceManager = (window as any).frequencySourceManager;
    if (sourceManager) {
      // Spectrum mode: use full MIDI note range (low=red, high=purple)
      // Chromatic/Harmonic: use note class (repeating colors per octave)
      const noteForColor = colorMode === 'spectrum' ? midiNote : (midiNote % 12);
      const noteColor = getNoteColor(noteForColor, colorMode);
      sourceManager.addMidiNote(midiNote, 102, noteColor); // velocity ~80% (102/127)
    }

    // Emit MIDI event to event bus for cross-module communication (Epic 14)
    const noteForColor = colorMode === 'spectrum' ? midiNote : (midiNote % 12);
    const noteColor = getNoteColor(noteForColor, colorMode);
    midiEventBus.emitNoteOn({
      note: midiNote,
      velocity: 102, // ~80%
      timestamp: performance.now(),
      source: 'piano-roll',
      color: noteColor
    });
  }, [initializeAudio, midiToFrequency, colorMode]);

  /**
   * Handle key release (mouse/touch)
   */
  const handleKeyRelease = useCallback((midiNote: number) => {
    // Release sustained notes
    if (soundEngineRef.current?.triggerRelease) {
      const frequency = midiToFrequency(midiNote);
      try {
        soundEngineRef.current.triggerRelease(frequency);
      } catch (error) {
        console.warn('[PianoVisualizer] Sound engine error on key release:', error);
      }
    }
    // Keep audioEngine for backwards compatibility
    audioEngine.triggerPianoNoteOff(midiNote);

    // Emit note-off to event bus for cross-module communication (Epic 14)
    midiEventBus.emitNoteOff(midiNote, 'piano-roll');
  }, [midiToFrequency]);

  /**
   * Generate WLED LED strip data
   */
  const generateLEDData = useCallback((): { r: number; g: number; b: number }[] => {
    const ledData: { r: number; g: number; b: number }[] = [];
    const currentScaleNotes = getCurrentScale();

    for (let ledIndex = 0; ledIndex < LED_STRIP.TOTAL_LEDS; ledIndex++) {
      // Map LED index to MIDI note
      const keyIndex = Math.floor((ledIndex / LED_STRIP.TOTAL_LEDS) * PIANO_CONSTANTS.TOTAL_KEYS);
      const midiNote = keyIndex + PIANO_CONSTANTS.FIRST_MIDI_NOTE;

      // Get color for this note
      const noteClass = midiNote % 12; // Note class: 0=C, 1=C#, 2=D, etc.
      const color = getNoteColor(noteClass, colorMode);

      // 3-tier brightness system:
      // - Triggered: 1.0 (full brightness)
      // - In-key (not triggered): 0.65 (bright)
      // - Out-of-key: 0.2 (dim but colored)
      let brightness = 0.2; // Default: out-of-key (dim but colored)
      const isActive = activeNotes.has(midiNote);
      if (isActive) {
        brightness = 1.0; // Triggered
      } else if (currentScaleNotes.includes(noteClass)) {
        brightness = 0.65; // In-key but not triggered
      }

      ledData.push({
        r: Math.round(color.r * brightness),
        g: Math.round(color.g * brightness),
        b: Math.round(color.b * brightness),
      });
    }

    return ledData;
  }, [activeNotes, colorMode, getCurrentScale]);

  /**
   * Send LED data to LED Compositor (Epic 14, Story 14.7)
   * Replaces direct WLED output with compositor submission
   */
  useEffect(() => {
    if (!wledEnabled) return;

    const sendToCompositor = () => {
      try {
        const ledData = generateLEDData();

        // Convert {r, g, b}[] to Uint8ClampedArray [R, G, B, R, G, B, ...]
        const pixelData = new Uint8ClampedArray(ledData.length * 3);
        ledData.forEach((color, index) => {
          pixelData[index * 3 + 0] = color.r;
          pixelData[index * 3 + 1] = color.g;
          pixelData[index * 3 + 2] = color.b;
        });

        // Submit frame to LED Compositor
        ledCompositor.submitFrame({
          moduleId: 'piano-roll',
          deviceId: `wled-${wledIP.replace(/\./g, '-')}`, // Convert IP to device ID
          timestamp: performance.now(),
          pixelData,
          visualizationMode: 'note-per-led', // 88-key piano = note-per-led addressing
        });
      } catch (error) {
        console.error('[PianoVisualizer] Error submitting to LED Compositor:', error);
      }
    };

    // Send at 30 FPS (compositor handles rate limiting internally)
    const interval = setInterval(sendToCompositor, 1000 / 30);
    return () => clearInterval(interval);
  }, [wledEnabled, wledIP, generateLEDData]);

  /**
   * Sync active notes with LUMI lights
   * PROOF OF CONCEPT - Using reverse-engineered SysEx protocol
   */
  useEffect(() => {
    lumiController.setEnabled(lumiEnabled);

    // Initialize LUMI with current scale/key when enabled
    if (lumiEnabled && lumiController.isReady()) {
      console.log('[PianoVisualizer] Syncing LUMI with current scale/key');
      lumiController.setScale(selectedScale);
      lumiController.setRootKey(selectedRoot);
      lumiController.setColorMode(0); // Mode 1 for best compatibility
    }
  }, [lumiEnabled, selectedScale, selectedRoot]);

  /**
   * Sync scale changes to LUMI
   */
  useEffect(() => {
    if (lumiEnabled && lumiController.isReady()) {
      lumiController.setScale(selectedScale);
    }
  }, [selectedScale, lumiEnabled]);

  /**
   * Sync root key changes to LUMI
   */
  useEffect(() => {
    if (lumiEnabled && lumiController.isReady()) {
      lumiController.setRootKey(selectedRoot);
    }
  }, [selectedRoot, lumiEnabled]);

  useEffect(() => {
    if (!lumiEnabled) return;

    const currentNotes = new Set(activeNotes);

    // Turn off notes that are no longer active
    previousLumiNotesRef.current.forEach(note => {
      if (!currentNotes.has(note)) {
        lumiController.turnOffNote(note);
      }
    });

    // Light up all currently active notes
    currentNotes.forEach(note => {
      lumiController.lightUpNote(note, 127);
    });

    // Update previous notes for next comparison
    previousLumiNotesRef.current = currentNotes;
  }, [activeNotes, lumiEnabled]);

  return (
    <div className={isStandalone ? "min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col" : ""}>
      {/* Header - Only show in standalone mode */}
      {isStandalone && (
        <div className="p-4 border-b border-gray-700">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>

            <div className="flex items-center gap-3">
              <Music className="w-6 h-6 text-primary-400" />
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                Piano Visualizer
              </h1>
              <div className="flex items-center gap-2">
                {isKeyboardMode && (
                  <span className="text-xs bg-primary-600/30 text-primary-300 px-2 py-1 rounded">
                    Keyboard Mode
                  </span>
                )}
                {isAudioReady ? (
                  <span className="text-xs bg-green-600/30 text-green-300 px-2 py-1 rounded flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    Audio Ready
                  </span>
                ) : (
                  <span className="text-xs bg-yellow-600/30 text-yellow-300 px-2 py-1 rounded flex items-center gap-1">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                    Initializing...
                  </span>
                )}
              </div>
            </div>

            <div className="w-20" /> {/* Spacer for centering */}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={isStandalone ? "flex-1 p-4 overflow-auto" : ""}>
        <div className={`max-w-7xl mx-auto ${isStandalone ? 'space-y-4' : 'space-y-2'}`}>
          {/* Piano Visualizer Container */}
          <div className={`bg-gray-800 rounded-lg border border-gray-700 ${isStandalone ? 'p-4' : 'p-2'}`}>
            {/* Canvas Header with Controls */}
            <div className={`flex items-center justify-between ${isStandalone ? 'mb-4' : 'mb-2'} flex-wrap gap-3`}>
              {isStandalone && <h2 className="text-lg font-semibold text-white">Piano Visualizer</h2>}

              {/* Main Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Key Selector - Only show in standalone mode */}
                {isStandalone && (
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowKeyMenu(!showKeyMenu);
                      setShowScaleMenu(false);
                      setShowProgressionMenu(false);
                      setShowSoundMenu(false);
                    }}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all text-sm font-semibold"
                  >
                    Key: {selectedRoot}
                    <span className="text-xs ml-1">▼</span>
                  </button>

                  {showKeyMenu && (
                    <div className="absolute top-full mt-2 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50 grid grid-cols-3 gap-1 p-2 min-w-[200px]">
                      {Object.keys(rootPositions).map((root) => (
                        <button
                          key={root}
                          onClick={() => {
                            updateKey(root);
                            setShowKeyMenu(false);
                          }}
                          className={`px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors ${
                            selectedRoot === root ? 'bg-primary-900 text-primary-400' : 'text-white'
                          }`}
                        >
                          {root}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                )}

                {/* Scale Selector - Only show in standalone mode */}
                {isStandalone && (
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowScaleMenu(!showScaleMenu);
                      setShowKeyMenu(false);
                      setShowProgressionMenu(false);
                      setShowSoundMenu(false);
                    }}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all text-sm font-semibold capitalize"
                  >
                    {selectedScale.replace('_', ' ')}
                    <span className="text-xs ml-1">▼</span>
                  </button>

                  {showScaleMenu && (
                    <div className="absolute top-full mt-2 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50 max-h-64 overflow-y-auto min-w-[200px]">
                      {Object.keys(scalePatterns).map((scale) => (
                        <button
                          key={scale}
                          onClick={() => {
                            updateScale(scale);
                            setShowScaleMenu(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-700 transition-colors capitalize ${
                            selectedScale === scale ? 'bg-primary-900 text-primary-400' : 'text-white'
                          }`}
                        >
                          {scale.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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

                {/* Divider - Only show in standalone mode */}
                {isStandalone && (
                <div className="w-px h-8 bg-gray-600"></div>
                )}

                {/* Chord Progression Controls */}
                {/* Play/Stop Button - Module-specific control */}
                <button
                  onClick={() => {
                    const newPlayingState = !localIsPlayingChords;
                    setLocalIsPlayingChords(newPlayingState);

                    // Enable chords when play is clicked
                    if (newPlayingState) {
                      setChordProgressionEnabled(true);
                    }
                  }}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-all text-sm font-semibold ${
                    localIsPlayingChords
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {localIsPlayingChords ? (
                    <>
                      <Square className="w-4 h-4" />
                      Stop Chords
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Play Chords
                    </>
                  )}
                </button>

                {/* Chord Progression Selector */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowProgressionMenu(!showProgressionMenu);
                      setShowSoundMenu(false);
                      setShowKeyMenu(false);
                      setShowScaleMenu(false);
                    }}
                    className="flex items-center gap-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-all text-sm font-semibold"
                  >
                    <Music className="w-4 h-4" />
                    Progression: {CHORD_PROGRESSIONS[selectedProgressionIndex].name}
                    <span className="text-xs">▼</span>
                  </button>

                  {showProgressionMenu && (
                    <div className="absolute top-full mt-2 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50 max-h-64 overflow-y-auto min-w-[250px]">
                      {CHORD_PROGRESSIONS.map((progression, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSelectedProgressionIndex(index);
                            setSelectedChordIndex(0);
                            setShowProgressionMenu(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-700 transition-colors ${
                            selectedProgressionIndex === index ? 'bg-purple-900 text-purple-400' : 'text-white'
                          }`}
                        >
                          {progression.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Current Chord Display + Navigation */}
                {chordProgressionEnabled && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        const progression = CHORD_PROGRESSIONS[selectedProgressionIndex];
                        setSelectedChordIndex((prev) =>
                          prev > 0 ? prev - 1 : progression.chords.length - 1
                        );
                      }}
                      className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
                    >
                      ◄
                    </button>
                    <div className="px-3 py-2 bg-gray-700 rounded-lg text-sm font-medium min-w-[60px] text-center">
                      {CHORD_PROGRESSIONS[selectedProgressionIndex].chords[selectedChordIndex].name}
                    </div>
                    <button
                      onClick={() => {
                        const progression = CHORD_PROGRESSIONS[selectedProgressionIndex];
                        setSelectedChordIndex((prev) =>
                          prev < progression.chords.length - 1 ? prev + 1 : 0
                        );
                      }}
                      className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
                    >
                      ►
                    </button>
                  </div>
                )}

                {/* Divider */}
                <div className="w-px h-8 bg-gray-600"></div>

                {/* Sound Engine selector */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowSoundMenu(!showSoundMenu);
                      setShowProgressionMenu(false);
                      setShowKeyMenu(false);
                      setShowScaleMenu(false);
                    }}
                    className="flex items-center gap-1 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-all text-sm font-semibold"
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
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-700 transition-colors ${
                            selectedSoundEngine === engineType ? 'bg-cyan-900 text-cyan-400' : 'text-white'
                          }`}
                        >
                          {soundEngineNames[engineType]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Settings Toggle Button */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 hover:bg-gray-700 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${
                  showSettings ? 'bg-gray-700' : ''
                }`}
                aria-label="Toggle settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>

            <div className={isStandalone ? "h-64 sm:h-80 md:h-96" : "h-48 sm:h-56"}>
              <PianoCanvas
                activeNotes={activeNotes}
                colorMode={colorMode}
                onKeyClick={handleKeyClick}
                onKeyRelease={handleKeyRelease}
                visibleOctaves={visibleOctaves}
                startOctave={startOctave}
                scaleNotes={
                  chordProgressionEnabled
                    ? Array.from(getChordMIDINotes()).map(note => note % 12)
                    : getCurrentScale()
                }
              />
            </div>

            {/* Active Notes Display */}
            {activeNotes.size > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex flex-wrap gap-2">
                  {Array.from(activeNotes)
                    .sort((a, b) => a - b)
                    .map((note) => (
                      <div
                        key={note}
                        className="px-3 py-1 rounded-full text-sm font-medium bg-primary-600/30 text-primary-200"
                      >
                        {getNoteNameWithOctave(note)}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Settings Panels */}
          {showSettings && (
            <>
              {/* Visualizer Settings */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Visualizer Settings</h3>

                <div className="space-y-4">
                  {/* Visible Octaves */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Visible Octaves: <span className="text-primary-400">{visibleOctaves}</span>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="7"
                      step="1"
                      value={visibleOctaves}
                      onChange={(e) => setVisibleOctaves(Number(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>1</span>
                      <span>7</span>
                    </div>
                  </div>

                  {/* Start Octave */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Start Octave: <span className="text-primary-400">C{startOctave}</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="7"
                      step="1"
                      value={startOctave}
                      onChange={(e) => setStartOctave(Number(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>C0</span>
                      <span>C7</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* WLED Output Settings */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-300">WLED Output (144 LEDs)</h3>
                  <input
                    type="checkbox"
                    id="wled-enabled"
                    checked={wledEnabled}
                    onChange={(e) => setWledEnabled(e.target.checked)}
                    className="w-5 h-5 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {wledEnabled && (
                  <input
                    type="text"
                    value={wledIP}
                    onChange={(e) => setWledIP(e.target.value)}
                    placeholder="WLED IP (e.g., 192.168.8.106)"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 mb-2"
                  />
                )}
                <p className="text-xs text-gray-500">
                  Sends real-time color data to WLED LED strip controller
                </p>
              </div>

              {/* LUMI/Piano M Output Settings */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-300">ROLI Piano M / LUMI Keys</h3>
                  <input
                    type="checkbox"
                    id="lumi-enabled"
                    checked={lumiEnabled}
                    onChange={(e) => setLumiEnabled(e.target.checked)}
                    className="w-5 h-5 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* MIDI Output Device Selector */}
                {midiOutputDevices.length > 0 && (
                  <div className="mb-2">
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      MIDI Output Device
                    </label>
                    <select
                      value={selectedOutputId || ''}
                      onChange={(e) => {
                        const deviceId = e.target.value;
                        setSelectedOutputId(deviceId);
                        const output = midiOutputManager.selectDevice(deviceId);
                        if (output) {
                          lumiController.connect(output);
                          console.log('[PianoVisualizer] Switched to MIDI output:', deviceId);
                        }
                      }}
                      className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {midiOutputDevices.map((device) => (
                        <option key={device.id} value={device.id}>
                          {device.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <p className="text-xs text-gray-500">
                  <strong className="text-orange-400">PROOF OF CONCEPT:</strong> Controls LUMI lights via reverse-engineered SysEx. Requires LUMI device connected via WebMIDI.
                </p>
              </div>
            </>
          )}

          {/* MIDI Setup Panel */}
          <CollapsiblePanel title="MIDI Setup" defaultOpen={true} mobileOnly={true}>
            <MIDIDeviceSelector showKeyboardToggle={true} />
          </CollapsiblePanel>

          {/* Info Panel */}
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="w-5 h-5 text-gray-400" />
              <h3 className="text-sm font-semibold text-white">About This Visualizer</h3>
            </div>
            <div className="text-xs text-gray-400 space-y-2">
              <p>
                <strong className="text-gray-300">Story 9.2:</strong> Piano Visualizer with LED Strip Output & Chord Progressions
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>88-key interactive piano keyboard (A0 to C8)</li>
                <li>Real-time MIDI input with auto-connect</li>
                <li>Chord progression playback (13 progressions)</li>
                <li>Multiple sound engines (Keys, Synth, Electric, Bass)</li>
                <li>Chromatic and Harmonic color modes</li>
                <li>WLED LED strip output (144 LEDs)</li>
                <li>Adjustable octave view (1-7 octaves)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
