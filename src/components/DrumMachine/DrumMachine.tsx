import React from 'react';
import { DrumTrack } from '../../types';
import { TrackRow } from './TrackRow';
import { TransportControls } from './TransportControls';

interface DrumMachineProps {
  tracks: DrumTrack[];
  currentStep: number;
  isPlaying: boolean;
  tempo: number;
  onStepToggle: (trackId: string, stepIndex: number) => void;
  onVelocityChange: (trackId: string, stepIndex: number, velocity: number) => void;
  onTrackMute: (trackId: string) => void;
  onTrackSolo: (trackId: string) => void;
  onTrackVolumeChange: (trackId: string, volume: number) => void;
  onPlay: () => void;
  onStop: () => void;
  onTempoChange: (tempo: number) => void;
  onClearTrack: (trackId: string) => void;
  onClearAll: () => void;
}

export const DrumMachine: React.FC<DrumMachineProps> = ({
  tracks,
  currentStep,
  isPlaying,
  tempo,
  onStepToggle,
  onVelocityChange,
  onTrackMute,
  onTrackSolo,
  onTrackVolumeChange,
  onPlay,
  onStop,
  onTempoChange,
  onClearTrack,
  onClearAll
}) => {
  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Drum Machine</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={onClearAll}
            className="text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      <TransportControls
        isPlaying={isPlaying}
        tempo={tempo}
        onPlay={onPlay}
        onStop={onStop}
        onTempoChange={onTempoChange}
      />

      {/* Step Numbers */}
      <div className="flex items-center mb-4">
        <div className="w-32"></div> {/* Track label space */}
        <div className="flex gap-2">
          {Array.from({ length: 16 }, (_, i) => (
            <div
              key={i}
              className={`w-12 h-6 flex items-center justify-center text-xs font-mono ${
                i % 4 === 0 ? 'text-primary-400' : 'text-gray-500'
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Tracks */}
      <div className="space-y-3">
        {tracks.map((track) => (
          <TrackRow
            key={track.id}
            track={track}
            currentStep={currentStep}
            isPlaying={isPlaying}
            onStepToggle={(stepIndex) => onStepToggle(track.id, stepIndex)}
            onVelocityChange={(stepIndex, velocity) => onVelocityChange(track.id, stepIndex, velocity)}
            onMute={() => onTrackMute(track.id)}
            onSolo={() => onTrackSolo(track.id)}
            onVolumeChange={(volume) => onTrackVolumeChange(track.id, volume)}
            onClear={() => onClearTrack(track.id)}
          />
        ))}
      </div>

      {/* Pattern Info */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>16-step pattern • 4/4 time signature</span>
          <span>Current step: {currentStep + 1}/16</span>
        </div>
      </div>
    </div>
  );
};