import React, { useState } from 'react';
import { Play, Pause, Square, ChevronDown, ChevronUp, Plus, RefreshCw } from 'lucide-react';
import { DrumTrack, ColorMode } from '../../types';
import { getDrumTrackColor } from '../../utils/colorMapping';
import { getAvailableInstruments, createEmptyTrack } from '../../utils/drumPatterns';

interface CompactDrumMachineProps {
  tracks: DrumTrack[];
  currentStep: number;
  isPlaying: boolean;
  tempo: number;
  colorMode: ColorMode;
  onStepToggle: (trackId: string, stepIndex: number) => void;
  onPlay: () => void;
  onStop: () => void;
  onTempoChange: (tempo: number) => void;
  onAddTrack: (track: DrumTrack) => void;
  onRemoveTrack: (trackId: string) => void;
  onLoadDefaultPattern: () => void;
}

export const CompactDrumMachine: React.FC<CompactDrumMachineProps> = ({
  tracks,
  currentStep,
  isPlaying,
  tempo,
  colorMode,
  onStepToggle,
  onPlay,
  onStop,
  onTempoChange,
  onAddTrack,
  onRemoveTrack,
  onLoadDefaultPattern
}) => {
  const [selectedTrack, setSelectedTrack] = useState(0);
  const [showAllTracks, setShowAllTracks] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const currentTrack = tracks[selectedTrack];
  const dynamicColor = getDrumTrackColor(currentTrack?.name || '', colorMode);
  const availableInstruments = getAvailableInstruments(tracks);
  const canAddMore = tracks.length < 8;

  const handleAddTrack = (instrumentId: string) => {
    try {
      const newTrack = createEmptyTrack(instrumentId);
      onAddTrack(newTrack);
      setShowAddMenu(false);
    } catch (error) {
      console.error('Failed to add track:', error);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      {/* Header with controls */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Drum Machine</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onLoadDefaultPattern}
            className="p-1 text-blue-400 hover:text-blue-300 rounded transition-colors"
            title="Load default beat"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          {canAddMore && availableInstruments.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="p-1 text-green-400 hover:text-green-300 rounded transition-colors"
                title="Add track"
              >
                <Plus className="w-4 h-4" />
              </button>

              {showAddMenu && (
                <div className="absolute top-full right-0 mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-10 min-w-[140px]">
                  <div className="p-2">
                    {availableInstruments.slice(0, 4).map((instrument) => (
                      <button
                        key={instrument.id}
                        onClick={() => handleAddTrack(instrument.id)}
                        className="w-full text-left px-2 py-1 text-xs hover:bg-gray-600 rounded transition-colors"
                      >
                        {instrument.name}
                      </button>
                    ))}
                    {tracks.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveTrack(track.id);
                          if (selectedTrack >= tracks.length - 1) {
                            setSelectedTrack(Math.max(0, tracks.length - 2));
                          }
                        }}
                        className="ml-auto text-red-400 hover:text-red-300 text-xs"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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
                    style={{ backgroundColor: getDrumTrackColor(track.name, colorMode) }}
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
                    style={{ backgroundColor: getDrumTrackColor(track.name, colorMode) }}
                  />
                  <span className="text-sm font-medium">{track.name}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Click outside to close add menu */}
      {showAddMenu && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowAddMenu(false)}
        />
      )}

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
                  ? `${dynamicColor}${Math.round(currentTrack.velocities[i] * 255).toString(16).padStart(2, '0')}`
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