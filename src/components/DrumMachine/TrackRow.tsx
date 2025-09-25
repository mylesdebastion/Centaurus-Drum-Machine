import React, { useState } from 'react';
import { Volume2, VolumeX, Headphones, Trash2, MoveVertical as MoreVertical, Eraser } from 'lucide-react';
import { DrumTrack, ColorMode } from '../../types';
import { getDrumTrackColor } from '../../utils/colorMapping';

interface TrackRowProps {
  track: DrumTrack;
  currentStep: number;
  isPlaying: boolean;
  colorMode: ColorMode;
  onStepToggle: (stepIndex: number) => void;
  onVelocityChange: (stepIndex: number, velocity: number) => void;
  onMute: () => void;
  onSolo: () => void;
  onVolumeChange: (volume: number) => void;
  onClear: () => void;
  onRemove: () => void;
  canRemove: boolean;
}

export const TrackRow: React.FC<TrackRowProps> = ({
  track,
  currentStep,
  isPlaying,
  colorMode,
  onStepToggle,
  onVelocityChange,
  onMute,
  onSolo,
  onVolumeChange,
  onClear,
  onRemove,
  canRemove
}) => {
  const [showVelocity, setShowVelocity] = useState(false);
  
  // Get dynamic color based on visualizer color mode
  const dynamicColor = getDrumTrackColor(track.name, colorMode);

  return (
    <div className="track-row">
      {/* Track Info */}
      <div className="w-32 flex flex-col">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: dynamicColor }}
          />
          <span className="font-medium text-sm">{track.name}</span>
        </div>
        <span className="text-xs text-gray-400">{track.instrument}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 mr-4">
        <button
          onClick={onMute}
          className={`p-1 rounded transition-colors ${
            track.muted
              ? 'text-red-400 bg-red-400/20'
              : 'text-gray-400 hover:text-white'
          }`}
          title="Mute"
        >
          {track.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          onClick={onSolo}
          className={`p-1 rounded transition-colors ${
            track.solo
              ? 'text-yellow-400 bg-yellow-400/20'
              : 'text-gray-400 hover:text-white'
          }`}
          title="Solo"
        >
          <Headphones className="w-4 h-4" />
        </button>

        <button
          onClick={() => setShowVelocity(!showVelocity)}
          className="p-1 text-gray-400 hover:text-white rounded transition-colors"
          title="Show velocity"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        <button
          onClick={onClear}
          className="p-1 text-gray-400 hover:text-red-400 rounded transition-colors"
          title="Clear track"
        >
          <Eraser className="w-4 h-4" />
        </button>

        {canRemove && (
          <button
            onClick={onRemove}
            className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
            title="Remove track"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Steps */}
      <div className="flex gap-2 flex-1">
        {track.steps.map((active, index) => (
          <div key={index} className="relative">
            <button
              onClick={() => onStepToggle(index)}
              className={`step-button ${active ? 'active' : ''} ${
                isPlaying && currentStep === index ? 'playing' : ''
              }`}
              style={{
                backgroundColor: active
                  ? `${dynamicColor}${Math.round(track.velocities[index] * 255).toString(16).padStart(2, '0')}`
                  : undefined
              }}
            >
              {active && (
                <div
                  className="w-2 h-2 rounded-full bg-white"
                  style={{
                    opacity: track.velocities[index]
                  }}
                />
              )}
            </button>

            {/* Velocity Control */}
            {showVelocity && active && (
              <div className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2">
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={track.velocities[index]}
                  onChange={(e) => onVelocityChange(index, parseFloat(e.target.value))}
                  className="w-12 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Volume Control */}
      <div className="w-20 ml-4">
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={track.volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </div>
  );
};