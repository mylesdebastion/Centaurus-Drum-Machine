import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { DrumTrack, ColorMode } from '../../types';
import { TrackRow } from './TrackRow';
import { TransportControls } from './TransportControls';
import { TrackManager } from './TrackManager';
import { CompactDrumMachine } from './CompactDrumMachine';
import { audioEngine } from '../../utils/audioEngine';

interface DrumMachineProps {
  tracks: DrumTrack[];
  currentStep: number;
  isPlaying: boolean;
  tempo: number;
  colorMode: ColorMode;
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
  onAddTrack: (track: DrumTrack) => void;
  onRemoveTrack: (trackId: string) => void;
  onLoadDefaultPattern: () => void;
  embedded?: boolean; // When embedded in Studio with limited width
}

export const DrumMachine: React.FC<DrumMachineProps> = ({
  tracks,
  currentStep,
  isPlaying,
  tempo,
  colorMode,
  onStepToggle,
  onVelocityChange,
  onTrackMute,
  onTrackSolo,
  onTrackVolumeChange,
  onPlay,
  onStop,
  onTempoChange,
  onClearTrack,
  onClearAll,
  onAddTrack,
  onRemoveTrack,
  onLoadDefaultPattern,
  embedded = false
}) => {
  // Responsive layout: use compact view when container width is constrained
  const [isCompact, setIsCompact] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Use ResizeObserver to measure actual container width
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const containerWidth = entry.contentRect.width;
        // Switch to compact layout if container width < 900px
        // This handles both mobile screens AND Studio 2/3 column layouts
        const shouldBeCompact = containerWidth < 900;
        setIsCompact(shouldBeCompact);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Use compact drum machine for narrow layouts
  if (isCompact) {
    return (
      <div ref={containerRef}>
        <CompactDrumMachine
          tracks={tracks}
          currentStep={currentStep}
          isPlaying={isPlaying}
          tempo={tempo}
          colorMode={colorMode}
          onStepToggle={onStepToggle}
          onPlay={onPlay}
          onStop={onStop}
          onTempoChange={onTempoChange}
          onAddTrack={onAddTrack}
          onLoadDefaultPattern={onLoadDefaultPattern}
        />
      </div>
    );
  }
  // Initialize audio engine on play (requires user interaction for Tone.js)
  const handlePlay = async () => {
    try {
      console.log('[DrumMachine] Initializing audio engine on play...');
      await audioEngine.initialize();
      console.log('[DrumMachine] Audio engine ready, starting playback');
      onPlay();
    } catch (error) {
      console.error('[DrumMachine] Failed to initialize audio:', error);
    }
  };

  // Play drum sounds when steps are active
  React.useEffect(() => {
    if (!isPlaying) return;

    console.log('[DrumMachine] Playing step', currentStep);
    tracks.forEach((track) => {
      if (track.steps[currentStep] && !track.muted) {
        const velocity = track.velocities[currentStep] * track.volume;
        console.log('[DrumMachine] Playing drum:', track.name, 'velocity:', velocity);
        audioEngine.playDrum(track.name, velocity);

        // Send drum hit to frequency source manager for visualization
        const sourceManager = (window as any).frequencySourceManager;
        if (sourceManager) {
          sourceManager.addDrumHit(track.name, velocity);
        }
      }
    });
  }, [currentStep, isPlaying, tracks]);

  // Desktop layout with full grid
  return (
    <div ref={containerRef} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Drum Machine</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={onLoadDefaultPattern}
            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Load Default Beat
          </button>
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
        onPlay={handlePlay}
        onStop={onStop}
        onTempoChange={onTempoChange}
      />

      <TrackManager
        tracks={tracks}
        onAddTrack={onAddTrack}
        onRemoveTrack={onRemoveTrack}
        maxTracks={8}
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
            colorMode={colorMode}
            onStepToggle={(stepIndex) => onStepToggle(track.id, stepIndex)}
            onVelocityChange={(stepIndex, velocity) => onVelocityChange(track.id, stepIndex, velocity)}
            onMute={() => onTrackMute(track.id)}
            onSolo={() => onTrackSolo(track.id)}
            onVolumeChange={(volume) => onTrackVolumeChange(track.id, volume)}
            onClear={() => onClearTrack(track.id)}
            onRemove={() => onRemoveTrack(track.id)}
            canRemove={tracks.length > 1}
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