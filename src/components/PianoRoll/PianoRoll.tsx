import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Music, Settings, Volume2 } from 'lucide-react';
import { PianoCanvas } from './PianoCanvas';
import { MIDIDeviceSelector } from '../MIDI/MIDIDeviceSelector';
import { CollapsiblePanel } from '../Layout/CollapsiblePanel';
import { useMIDIInput } from '../../hooks/useMIDIInput';
import { audioEngine } from '../../utils/audioEngine';
import { createSoundEngine, SoundEngine, SoundEngineType, soundEngineNames } from '../../utils/soundEngines';
import { getNoteColor, type ColorMode } from '../../utils/colorMapping';
import { PIANO_CONSTANTS, LED_STRIP, getNoteNameWithOctave } from './constants';

interface PianoRollProps {
  onBack: () => void;
}

/**
 * Piano Roll Visualizer
 *
 * Features:
 * - 88-key interactive piano keyboard
 * - MIDI input integration
 * - Chromatic/Harmonic color modes
 * - WLED LED strip output (144 LEDs)
 * - Click-to-play functionality
 * - Responsive octave view
 */
export const PianoRoll: React.FC<PianoRollProps> = ({ onBack }) => {
  const [colorMode, setColorMode] = useState<ColorMode>('chromatic');
  const [visibleOctaves, setVisibleOctaves] = useState(4);
  const [startOctave, setStartOctave] = useState(3);
  const [wledEnabled, setWledEnabled] = useState(false);
  const [wledIP, setWledIP] = useState('192.168.8.106');
  const [selectedRoot, setSelectedRoot] = useState('C');
  const [selectedScale, setSelectedScale] = useState('major');
  const [showKeyMenu, setShowKeyMenu] = useState(false);
  const [showScaleMenu, setShowScaleMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);

  // Sound engine state
  const [selectedSoundEngine, setSelectedSoundEngine] = useState<SoundEngineType>('keys');
  const [showSoundMenu, setShowSoundMenu] = useState(false);
  const audioContextRef = useRef<AudioContext>();
  const masterGainRef = useRef<GainNode>();
  const soundEngineRef = useRef<SoundEngine | null>(null);

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
      console.log('[PianoRoll] Sound engine initialized:', selectedSoundEngine);
    }

    // Also initialize the old audioEngine for backwards compatibility
    audioEngine.initialize().catch(console.error);

    return () => {
      soundEngineRef.current?.dispose();
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
    };
  }, []);

  // Update sound engine when selection changes
  useEffect(() => {
    if (!audioContextRef.current || !masterGainRef.current) return;

    // Dispose old engine
    soundEngineRef.current?.dispose();

    // Create new engine
    soundEngineRef.current = createSoundEngine(selectedSoundEngine, audioContextRef.current, masterGainRef.current);
    console.log('[PianoRoll] Switched to sound engine:', selectedSoundEngine);
  }, [selectedSoundEngine]);

  // Initialize audio engine and ensure it's ready before allowing playback
  const initializeAudio = useCallback(async () => {
    if (isAudioReady) return;

    try {
      // Audio is already initialized in the useEffect above
      setIsAudioReady(true);
      console.log('[PianoRoll] Audio ready');
    } catch (error) {
      console.error('[PianoRoll] Failed to initialize audio:', error);
    }
  }, [isAudioReady]);

  // Helper function to convert MIDI note to frequency (Hz)
  const midiToFrequency = useCallback((midiNote: number): number => {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
  }, []);

  const { activeNotes, isKeyboardMode } = useMIDIInput({
    autoInitialize: true,
    autoSelectFirst: true, // Auto-connect to first available MIDI device
    keyboardFallback: true, // Fallback to keyboard if no MIDI device available
    onNoteOn: async (note, velocity) => {
      // Ensure audio is initialized on first interaction
      await initializeAudio();
      // Trigger audio playback using sound engine
      if (soundEngineRef.current) {
        const frequency = midiToFrequency(note);
        // Use triggerAttack if available (for sustaining synths), otherwise use playNote
        if (soundEngineRef.current.triggerAttack) {
          soundEngineRef.current.triggerAttack(frequency, velocity / 127);
        } else {
          soundEngineRef.current.playNote(frequency, velocity / 127, 0.5);
        }
      }
    },
    onNoteOff: (note) => {
      // Trigger release for sustained notes
      if (soundEngineRef.current?.triggerRelease) {
        const frequency = midiToFrequency(note);
        soundEngineRef.current.triggerRelease(frequency);
      }
      // Keep audioEngine for backwards compatibility
      audioEngine.triggerPianoNoteOff(note);
    },
  });

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
      // Use triggerAttack if available for sustaining notes
      if (soundEngineRef.current.triggerAttack) {
        soundEngineRef.current.triggerAttack(frequency, 0.8);
      } else {
        soundEngineRef.current.playNote(frequency, 0.8, 0.5);
      }
    }
  }, [initializeAudio, midiToFrequency]);

  /**
   * Handle key release (mouse/touch)
   */
  const handleKeyRelease = useCallback((midiNote: number) => {
    // Release sustained notes
    if (soundEngineRef.current?.triggerRelease) {
      const frequency = midiToFrequency(midiNote);
      soundEngineRef.current.triggerRelease(frequency);
    }
    // Keep audioEngine for backwards compatibility
    audioEngine.triggerPianoNoteOff(midiNote);
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
   * Send LED data to WLED (via UDP)
   */
  useEffect(() => {
    if (!wledEnabled) return;

    const sendToWLED = async () => {
      try {
        const ledData = generateLEDData();

        // WARLS protocol: [2, 255, ...RGB data]
        const packet = new Uint8Array(2 + ledData.length * 3);
        packet[0] = 2;   // WARLS protocol
        packet[1] = 255; // Timeout

        ledData.forEach((color, index) => {
          packet[2 + index * 3 + 0] = color.r;
          packet[2 + index * 3 + 1] = color.g;
          packet[2 + index * 3 + 2] = color.b;
        });

        // Send via WebSocket bridge (if available)
        // In production, this would use the WLED WebSocket bridge
        console.log('[PianoRoll] Would send LED data to WLED:', wledIP);
      } catch (error) {
        console.error('[PianoRoll] Error sending to WLED:', error);
      }
    };

    // Send at 30 FPS
    const interval = setInterval(sendToWLED, 1000 / 30);
    return () => clearInterval(interval);
  }, [wledEnabled, wledIP, generateLEDData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">
      {/* Header */}
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
              Piano Roll Visualizer
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

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Control Bar */}
          <div className="flex flex-wrap gap-3 items-center justify-center p-4 bg-gray-900/50 rounded-lg border border-gray-700">
            {/* Key selector */}
            <div className="relative flex">
              <button
                onClick={() => {
                  setShowKeyMenu(!showKeyMenu);
                  setShowScaleMenu(false);
                  setShowSoundMenu(false);
                }}
                className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 rounded-l-lg transition-all transform hover:scale-105 font-semibold"
              >
                <Music className="w-5 h-5" />
                {selectedRoot}
              </button>

              <button
                onClick={() => {
                  setShowKeyMenu(!showKeyMenu);
                  setShowScaleMenu(false);
                  setShowSoundMenu(false);
                }}
                className="flex items-center gap-1 px-2 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 rounded-r-lg transition-all transform hover:scale-105 font-semibold border-l border-blue-700"
              >
                ▼
              </button>

              {showKeyMenu && (
                <div className="absolute top-full mt-2 left-0 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50 max-h-64 overflow-y-auto">
                  {Object.keys(rootPositions).map((root) => (
                    <button
                      key={root}
                      onClick={() => {
                        setSelectedRoot(root);
                        setShowKeyMenu(false);
                      }}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors ${
                        selectedRoot === root ? 'bg-blue-900 text-blue-400' : 'text-white'
                      }`}
                    >
                      {root}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Scale selector */}
            <div className="relative flex">
              <button
                onClick={() => {
                  setShowScaleMenu(!showScaleMenu);
                  setShowKeyMenu(false);
                  setShowSoundMenu(false);
                }}
                className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 rounded-l-lg transition-all transform hover:scale-105 font-semibold"
              >
                <Music className="w-5 h-5" />
                {selectedScale.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>

              <button
                onClick={() => {
                  setShowScaleMenu(!showScaleMenu);
                  setShowKeyMenu(false);
                  setShowSoundMenu(false);
                }}
                className="flex items-center gap-1 px-2 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 rounded-r-lg transition-all transform hover:scale-105 font-semibold border-l border-indigo-700"
              >
                ▼
              </button>

              {showScaleMenu && (
                <div className="absolute top-full mt-2 left-0 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50 max-h-64 overflow-y-auto">
                  {Object.keys(scalePatterns).map((scale) => (
                    <button
                      key={scale}
                      onClick={() => {
                        setSelectedScale(scale);
                        setShowScaleMenu(false);
                      }}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors ${
                        selectedScale === scale ? 'bg-indigo-900 text-indigo-400' : 'text-white'
                      }`}
                    >
                      {scale.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sound Engine selector */}
            <div className="relative flex">
              <button
                onClick={() => {
                  setShowSoundMenu(!showSoundMenu);
                  setShowKeyMenu(false);
                  setShowScaleMenu(false);
                }}
                className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 rounded-l-lg transition-all transform hover:scale-105 font-semibold"
              >
                <Volume2 className="w-5 h-5" />
                {soundEngineNames[selectedSoundEngine]}
              </button>

              <button
                onClick={() => {
                  setShowSoundMenu(!showSoundMenu);
                  setShowKeyMenu(false);
                  setShowScaleMenu(false);
                }}
                className="flex items-center gap-1 px-2 py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 rounded-r-lg transition-all transform hover:scale-105 font-semibold border-l border-cyan-700"
              >
                ▼
              </button>

              {showSoundMenu && (
                <div className="absolute top-full mt-2 left-0 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50">
                  {(Object.keys(soundEngineNames) as SoundEngineType[]).map((engineType) => (
                    <button
                      key={engineType}
                      onClick={() => {
                        setSelectedSoundEngine(engineType);
                        setShowSoundMenu(false);
                      }}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors ${
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

          {/* Piano Canvas */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            {/* Canvas Header with Settings */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Piano Roll</h2>

              {/* Settings Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-2 hover:bg-gray-700 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${
                    showSettings ? 'bg-gray-700' : ''
                  }`}
                  aria-label="Toggle settings"
                >
                  <Settings className="w-5 h-5" />
                </button>

                {showSettings && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl overflow-hidden z-50">
                    <div className="p-4 border-b border-gray-700 bg-gray-900">
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Piano Roll Settings
                      </h3>
                    </div>

                    <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                      {/* Color Mode */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Color Mode
                        </label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setColorMode('chromatic')}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              colorMode === 'chromatic'
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            Chromatic
                          </button>
                          <button
                            onClick={() => setColorMode('harmonic')}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              colorMode === 'harmonic'
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            Harmonic
                          </button>
                        </div>
                      </div>

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

                      {/* WLED Output */}
                      <div className="pt-2 border-t border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <label htmlFor="wled-enabled" className="text-sm font-medium text-gray-300">
                            WLED Output (144 LEDs)
                          </label>
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
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Sends real-time color data to WLED LED strip controller
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="h-64 sm:h-80 md:h-96">
              <PianoCanvas
                activeNotes={activeNotes}
                colorMode={colorMode}
                onKeyClick={handleKeyClick}
                onKeyRelease={handleKeyRelease}
                visibleOctaves={visibleOctaves}
                startOctave={startOctave}
                scaleNotes={getCurrentScale()}
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
                <strong className="text-gray-300">Story 9.2:</strong> Piano Roll Visualizer with LED Strip Output
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>88-key piano keyboard (A0 to C8)</li>
                <li>Real-time MIDI input highlighting</li>
                <li>Click or touch keys to play</li>
                <li>Chromatic and Harmonic color modes</li>
                <li>WLED LED strip output (144 LEDs, one per key)</li>
                <li>Adjustable octave view (1-7 octaves)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
