import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useMIDIInput } from '../../hooks/useMIDIInput';
import { MIDIDeviceSelector } from './MIDIDeviceSelector';
import { getNoteColor } from '../../utils/colorMapping';
import { audioEngine } from '../../utils/audioEngine';

interface MIDITestProps {
  onBack: () => void;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function getNoteNameWithOctave(midiNote: number): string {
  const noteClass = midiNote % 12;
  const octave = Math.floor(midiNote / 12) - 1;
  return `${NOTE_NAMES[noteClass]}${octave}`;
}

/**
 * MIDI Test Component
 *
 * Demonstrates the Web MIDI Input Engine with:
 * - Device selection
 * - Live note visualization
 * - Keyboard fallback mode
 * - Audio playback
 */
export const MIDITest: React.FC<MIDITestProps> = ({ onBack }) => {
  const { activeNotes, isKeyboardMode } = useMIDIInput({
    autoInitialize: true,
    autoSelectFirst: true, // Auto-connect to first available MIDI device
    keyboardFallback: true, // Fallback to keyboard if no MIDI device available
  });

  // Initialize audio engine on mount
  useEffect(() => {
    audioEngine.initialize().catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Welcome
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-white">
            MIDI Input Engine Test
          </h1>
          <p className="text-gray-400">
            Connect a MIDI device or use keyboard fallback to test the MIDI input system
          </p>
        </div>

        {/* MIDI Device Selector */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">MIDI Setup</h2>
          <MIDIDeviceSelector showKeyboardToggle={true} />
        </div>

        {/* Active Notes Visualization */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Active Notes {isKeyboardMode && <span className="text-sm text-primary-400">(Keyboard Mode)</span>}
          </h2>

          {activeNotes.size === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="mb-2">No notes playing</p>
              <p className="text-sm">
                {isKeyboardMode
                  ? 'Press keys on your QWERTY keyboard to trigger notes'
                  : 'Play notes on your MIDI device to see them here'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from(activeNotes)
                .sort((a, b) => a - b)
                .map((midiNote) => {
                  const noteClass = midiNote % 12;
                  const color = getNoteColor(noteClass, 'chromatic');
                  return (
                    <div
                      key={midiNote}
                      className="relative aspect-square rounded-lg border-2 border-white/20 flex items-center justify-center animate-pulse"
                      style={{
                        backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
                      }}
                    >
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white drop-shadow-lg">
                          {getNoteNameWithOctave(midiNote)}
                        </div>
                        <div className="text-xs text-white/80">
                          MIDI {midiNote}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Info Panel */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">About This Test</h2>
          <div className="space-y-3 text-sm text-gray-300">
            <p>
              <strong className="text-white">Story 9.1:</strong> Web MIDI Input Engine
            </p>
            <p>
              This experiment demonstrates the foundation for multi-instrument MIDI visualization.
              The same MIDI engine will be used by the Piano Roll (Story 9.2) and Guitar Fretboard (Story 9.3).
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <div>
                <h3 className="font-semibold text-white mb-2">Features Tested:</h3>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Web MIDI API device enumeration</li>
                  <li>MIDI message parsing (note on/off)</li>
                  <li>Event system (publish/subscribe)</li>
                  <li>Keyboard fallback mode (QWERTY → MIDI)</li>
                  <li>Tone.js audio playback</li>
                  <li>Real-time note visualization</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Next Steps:</h3>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Story 9.2: Piano Roll Visualizer</li>
                  <li>Story 9.3: Guitar Fretboard Visualizer</li>
                  <li>Story 9.4: /jam Multi-Instrument Integration</li>
                  <li>WLED LED strip/matrix output</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
