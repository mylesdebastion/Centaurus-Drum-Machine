// Main Guitar Fretboard Component
// Story 9.3: Guitar Fretboard Visualizer with LED Matrix Output

import React, { useState, useEffect, useCallback } from 'react';
import * as Tone from 'tone';
import { Guitar, Settings } from 'lucide-react';
import { FretboardCanvas } from './FretboardCanvas';
import { MIDIDeviceSelector } from '../MIDI/MIDIDeviceSelector';
import WLEDDeviceManager from '../WLED/WLEDDeviceManager';
import { ColorMode, getNoteColor } from '../../utils/colorMapping';
import { CHORD_PROGRESSIONS } from './chordProgressions';
import { createFretboardMatrix, getMIDINoteFromFret, fretboardToLEDIndex } from './constants';
import { useMIDIInput } from '../../hooks/useMIDIInput';

interface GuitarFretboardProps {
  /**
   * Callback when user clicks the back button
   */
  onBack?: () => void;
}

export const GuitarFretboard: React.FC<GuitarFretboardProps> = ({ onBack }) => {
  const [currentProgression, setCurrentProgression] = useState(0);
  const [currentChord, setCurrentChord] = useState(0);
  const [colorMode, setColorMode] = useState<ColorMode>('chromatic');
  const [guitarSynth, setGuitarSynth] = useState<Tone.PolySynth | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const fretboardMatrix = createFretboardMatrix();
  const progression = CHORD_PROGRESSIONS[currentProgression];
  const chord = progression.chords[currentChord];

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

  // Auto-advance chords every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentChord(prev => (prev + 1) % progression.chords.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [progression]);

  // Handle fret clicks
  const handleFretClick = useCallback((string: number, fret: number) => {
    if (!guitarSynth) return;

    const midiNote = getMIDINoteFromFret(string, fret);
    const freq = Tone.Frequency(midiNote, 'midi').toFrequency();
    // PluckSynth has natural decay, use shorter duration
    guitarSynth.triggerAttackRelease(freq, '2');
  }, [guitarSynth]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'c' || e.key === 'C') {
        setColorMode(prev => prev === 'chromatic' ? 'harmonic' : 'chromatic');
      } else if (e.key === 'n' || e.key === 'N') {
        setCurrentProgression(prev => (prev + 1) % CHORD_PROGRESSIONS.length);
        setCurrentChord(0);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Generate LED matrix data (convert to hex strings for WLED)
  const generateLEDData = useCallback(() => {
    const ledData: string[] = Array(150).fill('000000');

    for (let string = 0; string < 6; string++) {
      for (let fret = 0; fret < 25; fret++) {
        const noteClass = fretboardMatrix[string][fret];
        const isActive = chord.notes.some(cn => cn.string - 1 === string && cn.fret === fret);
        const color = getNoteColor(noteClass, colorMode);
        const brightness = isActive ? 1.0 : 0.1;

        const ledIndex = fretboardToLEDIndex(string, fret);
        const r = Math.round(color.r * brightness).toString(16).padStart(2, '0');
        const g = Math.round(color.g * brightness).toString(16).padStart(2, '0');
        const b = Math.round(color.b * brightness).toString(16).padStart(2, '0');
        ledData[ledIndex] = r + g + b;
      }
    }

    return ledData;
  }, [chord, colorMode, fretboardMatrix]);

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
              <p className="text-sm text-gray-400">{progression.name} - {chord.name}</p>
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setColorMode(prev => prev === 'chromatic' ? 'harmonic' : 'chromatic')}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors min-h-[44px] text-sm"
            >
              {colorMode === 'chromatic' ? 'Chromatic' : 'Harmonic'}
            </button>
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
                activeMIDINotes={activeMIDINotes}
                colorMode={colorMode}
                onFretClick={handleFretClick}
              />
              <p className="text-sm text-gray-400 mt-2 text-center">
                Click frets to play notes | Press 'C' for color mode | Press 'N' for next progression
              </p>
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-4">
            {/* Progression Info */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Chord Progression</h3>
              <div className="space-y-2">
                {progression.chords.map((c, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded-lg transition-colors ${
                      i === currentChord
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    {c.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Settings Panels */}
            {showSettings && (
              <>
                {/* MIDI Device Selector */}
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">MIDI Input</h3>
                  <MIDIDeviceSelector />
                </div>

                {/* WLED LED Matrix */}
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">WLED LED Matrix</h3>
                  <WLEDDeviceManager
                    ledData={generateLEDData()}
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
