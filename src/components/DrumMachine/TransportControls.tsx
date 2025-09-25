import React from 'react';
import { Play, Pause, Square, RotateCcw } from 'lucide-react';

interface TransportControlsProps {
  isPlaying: boolean;
  tempo: number;
  onPlay: () => void;
  onStop: () => void;
  onTempoChange: (tempo: number) => void;
}

export const TransportControls: React.FC<TransportControlsProps> = ({
  isPlaying,
  tempo,
  onPlay,
  onStop,
  onTempoChange
}) => {
  return (
    <div className="flex items-center gap-4 mb-6 p-4 bg-gray-700 rounded-lg">
      {/* Transport Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={isPlaying ? onStop : onPlay}
          className={`p-3 rounded-lg transition-colors ${
            isPlaying
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
        </button>

        <button
          onClick={onStop}
          className="p-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
        >
          <Square className="w-6 h-6" />
        </button>

        <button
          onClick={() => {/* Reset to beginning */}}
          className="p-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
        >
          <RotateCcw className="w-6 h-6" />
        </button>
      </div>

      {/* Tempo Control */}
      <div className="flex items-center gap-3 ml-8">
        <label className="text-sm font-medium text-gray-300">BPM:</label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onTempoChange(Math.max(60, tempo - 5))}
            className="w-8 h-8 bg-gray-600 hover:bg-gray-500 rounded text-white text-sm"
          >
            -
          </button>
          <input
            type="number"
            value={tempo}
            onChange={(e) => onTempoChange(parseInt(e.target.value) || 120)}
            min="60"
            max="200"
            className="w-16 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-center text-white focus:border-primary-500 focus:outline-none"
          />
          <button
            onClick={() => onTempoChange(Math.min(200, tempo + 5))}
            className="w-8 h-8 bg-gray-600 hover:bg-gray-500 rounded text-white text-sm"
          >
            +
          </button>
        </div>
      </div>

      {/* Metronome */}
      <div className="flex items-center gap-2 ml-8">
        <input
          type="checkbox"
          id="metronome"
          className="w-4 h-4 text-primary-600 bg-gray-600 border-gray-500 rounded focus:ring-primary-500"
        />
        <label htmlFor="metronome" className="text-sm text-gray-300">
          Metronome
        </label>
      </div>

      {/* Swing */}
      <div className="flex items-center gap-2 ml-8">
        <label className="text-sm text-gray-300">Swing:</label>
        <input
          type="range"
          min="0"
          max="0.3"
          step="0.05"
          defaultValue="0"
          className="w-20 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </div>
  );
};