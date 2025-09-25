import React, { useState } from 'react';
import { Play, Pause, Square, ChevronDown, ChevronUp } from 'lucide-react';
import { DrumTrack } from '../../types';

interface CompactDrumMachineProps {
  tracks: DrumTrack[];
  currentStep: number;
  isPlaying: boolean;
  tempo: number;
  onStepToggle: (trackId: string, stepIndex: number) => void;
  onPlay: () => void;
  onStop: () => void;
  onTempoChange: (tempo: number) => void;
}

export const CompactDrumMachine: React.FC<CompactDrumMachineProps> = ({
  tracks,
  currentStep,
  isPlaying,
  tempo,
  onStepToggle,
  onPlay,
  onStop,
  onTempoChange
}) => {
  const [selectedTrack, setSelectedTrack] = useState(0);
  const [showAllTracks, setShowAllTracks] = useState(false);

  const currentTrack = tracks[selectedTrack];

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      {/* Compact Transport */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={isPlaying ? onStop : onPlay}
            className={`p-2 rounded-lg transition-colors ${
              isPlaying
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button
            onClick={onStop}
            className="p-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
          >
            <Square className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-300">BPM:</span>
          <input
            type="number"
            value={tempo}
            onChange={(e) => onTempoChange(parseInt(e.target.value) || 120)}
            min="60"
            max="200"
            className="w-16 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-center text-white text-sm focus:border-primary-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Track Selector */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Tracks</h3>
          <button
            onClick={() => setShowAllTracks(!showAllTracks)}
            className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1"
          >
            {showAllTracks ? 'Show Less' : 'Show All'}
            {showAllTracks ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showAllTracks ? (
          <div className="grid grid-cols-2 gap-2">
            {tracks.map((track, index) => (
              <button
                key={track.id}
                onClick={() => setSelectedTrack(index)}
                className={`p-2 rounded-lg text-left transition-colors ${
                  selectedTrack === index
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: track.color }}
                  />
                  <span className="text-sm font-medium">{track.name}</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tracks.map((track, index) => (
              <button
                key={track.id}
                onClick={() => setSelectedTrack(index)}
                className={`flex-shrink-0 px-3 py-2 rounded-lg transition-colors ${
                  selectedTrack === index
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: track.color }}
                  />
                  <span className="text-sm font-medium">{track.name}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Current Track Steps */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-300">
            {currentTrack.name} - {currentTrack.instrument}
          </span>
          <span className="text-xs text-gray-400">
            Step {currentStep + 1}/16
          </span>
        </div>

        {/* Mobile-optimized step grid */}
        <div className="grid grid-cols-4 gap-2 mb-2">
          {Array.from({ length: 16 }, (_, i) => (
            <button
              key={i}
              onClick={() => onStepToggle(currentTrack.id, i)}
              className={`aspect-square rounded-lg border-2 transition-all duration-150 cursor-pointer flex items-center justify-center text-xs font-mono ${
                currentTrack.steps[i]
                  ? 'border-primary-500 bg-primary-600 shadow-lg shadow-primary-500/30'
                  : 'border-gray-600 bg-gray-800 hover:bg-gray-700'
              } ${
                isPlaying && currentStep === i ? 'animate-pulse-beat' : ''
              }`}
              style={{
                backgroundColor: currentTrack.steps[i]
                  ? `${currentTrack.color}${Math.round(currentTrack.velocities[i] * 255).toString(16).padStart(2, '0')}`
                  : undefined
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Step indicators for beats */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <span className="text-xs text-primary-400 font-medium">1</span>
          <span className="text-xs text-primary-400 font-medium">2</span>
          <span className="text-xs text-primary-400 font-medium">3</span>
          <span className="text-xs text-primary-400 font-medium">4</span>
        </div>
      </div>
    </div>
  );
};