import React, { useEffect, useState } from 'react';
import { useGlobalMusic } from '../contexts/GlobalMusicContext';
import { GlobalMusicHeader } from './GlobalMusicHeader';
import { ArrowLeft } from 'lucide-react';

/**
 * Test component for GlobalMusicHeader
 * Displays all global music state values to verify header controls are working
 */
interface GlobalMusicHeaderTestProps {
  onBack: () => void;
}

export const GlobalMusicHeaderTest: React.FC<GlobalMusicHeaderTestProps> = ({ onBack }) => {
  const music = useGlobalMusic();
  const [stateHistory, setStateHistory] = useState<string[]>([]);

  // Track state changes
  useEffect(() => {
    const stateSnapshot = `${new Date().toLocaleTimeString()}: Tempo=${music.tempo}, Key=${music.key}, Scale=${music.scale}, ColorMode=${music.colorMode}, Volume=${Math.round(music.masterVolume * 100)}%`;
    setStateHistory(prev => [stateSnapshot, ...prev.slice(0, 9)]); // Keep last 10 changes
  }, [music.tempo, music.key, music.scale, music.colorMode, music.masterVolume]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Global Music Header */}
      <GlobalMusicHeader />

      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </button>

        {/* Header */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">GlobalMusicHeader Test</h1>
          <p className="text-gray-400">
            Use the header controls above to test all functionality. Changes will appear below in real-time.
          </p>
        </div>

        {/* Current State */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Current Global Music State</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Tempo</div>
              <div className="text-2xl font-bold text-primary-400">{music.tempo} BPM</div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Key Signature</div>
              <div className="text-2xl font-bold text-blue-400">{music.getKeySignature()}</div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Color Mode</div>
              <div className="text-2xl font-bold text-accent-400 capitalize">{music.colorMode}</div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Master Volume</div>
              <div className="text-2xl font-bold text-green-400">{Math.round(music.masterVolume * 100)}%</div>
            </div>
          </div>
        </div>

        {/* Musical Scale Info */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Musical Scale Information</h2>

          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-400">Scale Notes (Chromatic Positions)</div>
              <div className="text-lg text-white font-mono">
                {music.getCurrentScale().join(', ')}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-400">Test Notes in Scale</div>
              <div className="flex flex-wrap gap-2 mt-2">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(note => {
                  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
                  const isInScale = music.isNoteInScale(note);
                  return (
                    <div
                      key={note}
                      className={`px-3 py-1.5 rounded-lg font-semibold ${
                        isInScale
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      {noteNames[note]}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* State Change History */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">State Change History</h2>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {stateHistory.length === 0 ? (
              <div className="text-gray-500 text-center py-4">
                No changes yet. Try adjusting the header controls above.
              </div>
            ) : (
              stateHistory.map((change, index) => (
                <div
                  key={index}
                  className={`p-2 rounded ${
                    index === 0 ? 'bg-primary-900 text-primary-200' : 'bg-gray-700 text-gray-300'
                  } font-mono text-sm`}
                >
                  {change}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Testing Instructions */}
        <div className="bg-blue-900 border border-blue-700 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-200 mb-3">Testing Instructions</h3>
          <ul className="space-y-2 text-blue-100 text-sm">
            <li>✓ <strong>Tempo Control:</strong> Try the tap tempo button (4 taps), input a value, or use keyboard arrows</li>
            <li>✓ <strong>Key/Scale:</strong> Change the root note and scale using the dropdowns</li>
            <li>✓ <strong>Color Mode:</strong> Toggle between Chromatic and Harmonic modes</li>
            <li>✓ <strong>Volume Slider:</strong> Adjust volume, try mute/unmute button</li>
            <li>✓ <strong>Responsive:</strong> Resize your browser window to test mobile/tablet/desktop layouts</li>
            <li>✓ <strong>Persistence:</strong> Refresh the page - your settings should be saved!</li>
          </ul>
        </div>
      </div>
      </div>
    </div>
  );
};
