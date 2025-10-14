import React, { useState, useEffect, useRef } from 'react';
import { DrumMachine } from '../../DrumMachine/DrumMachine';
import { useGlobalMusic } from '../../../contexts/GlobalMusicContext';
import { DrumTrack } from '../../../types';
import { createDefaultPattern } from '../../../utils/drumPatterns';

/**
 * DrumMachineModule - Wrapper for DrumMachine in Studio (Story 4.7)
 * Manages state internally and integrates with GlobalMusicContext
 */

interface DrumMachineModuleProps {
  layout?: 'mobile' | 'desktop';
  settings?: Record<string, any>;
  onSettingsChange?: (settings: Record<string, any>) => void;
  embedded?: boolean;
}

export const DrumMachineModule: React.FC<DrumMachineModuleProps> = ({ embedded = false }) => {
  const music = useGlobalMusic();

  // Drum Machine state
  const [tracks, setTracks] = useState<DrumTrack[]>(() => createDefaultPattern());
  const [currentStep, setCurrentStep] = useState(0);
  const [localIsPlaying, setLocalIsPlaying] = useState(false);
  const playbackTimerRef = useRef<number | null>(null);

  // Sync with global transport state (Epic 14 - Module Adapter Pattern)
  // Global play button controls all modules, but module buttons control only themselves
  useEffect(() => {
    setLocalIsPlaying(music.isPlaying);
  }, [music.isPlaying]);

  // Reset step when playback stops
  useEffect(() => {
    if (!localIsPlaying) {
      setCurrentStep(0);
    }
  }, [localIsPlaying]);

  // Playback timer - synced with tempo
  useEffect(() => {
    if (localIsPlaying) {
      const stepDuration = (60 / music.tempo / 4) * 1000; // 16th note duration
      playbackTimerRef.current = window.setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % 16);
      }, stepDuration);
    } else if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }

    return () => {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
    };
  }, [localIsPlaying, music.tempo]);

  // Drum Machine handlers - module-specific control
  const handlePlay = () => {
    setLocalIsPlaying(true);
  };

  const handleStop = () => {
    setLocalIsPlaying(false);
    setCurrentStep(0);
  };

  const handleStepToggle = (trackId: string, stepIndex: number) => {
    setTracks((prev) =>
      prev.map((track) =>
        track.id === trackId
          ? { ...track, steps: track.steps.map((s, i) => (i === stepIndex ? !s : s)) }
          : track
      )
    );
  };

  const handleVelocityChange = (trackId: string, stepIndex: number, velocity: number) => {
    setTracks((prev) =>
      prev.map((track) =>
        track.id === trackId
          ? {
              ...track,
              velocities: track.velocities.map((v, i) => (i === stepIndex ? velocity : v)),
            }
          : track
      )
    );
  };

  const handleTrackMute = (trackId: string) => {
    setTracks((prev) =>
      prev.map((track) =>
        track.id === trackId ? { ...track, muted: !track.muted } : track
      )
    );
  };

  const handleTrackSolo = (trackId: string) => {
    setTracks((prev) =>
      prev.map((track) =>
        track.id === trackId ? { ...track, solo: !track.solo } : track
      )
    );
  };

  const handleTrackVolumeChange = (trackId: string, volume: number) => {
    setTracks((prev) =>
      prev.map((track) => (track.id === trackId ? { ...track, volume } : track))
    );
  };

  const handleClearTrack = (trackId: string) => {
    setTracks((prev) =>
      prev.map((track) =>
        track.id === trackId
          ? {
              ...track,
              steps: new Array(16).fill(false),
              velocities: new Array(16).fill(0.8),
            }
          : track
      )
    );
  };

  const handleClearAll = () => {
    setTracks((prev) =>
      prev.map((track) => ({
        ...track,
        steps: new Array(16).fill(false),
        velocities: new Array(16).fill(0.8),
      }))
    );
  };

  const handleAddTrack = (track: DrumTrack) => {
    setTracks((prev) => [...prev, track]);
  };

  const handleRemoveTrack = (trackId: string) => {
    setTracks((prev) => prev.filter((track) => track.id !== trackId));
  };

  const handleLoadDefaultPattern = () => {
    setTracks(createDefaultPattern());
  };

  return (
    <DrumMachine
      tracks={tracks}
      currentStep={currentStep}
      isPlaying={localIsPlaying}
      tempo={music.tempo}
      colorMode={music.colorMode}
      onStepToggle={handleStepToggle}
      onVelocityChange={handleVelocityChange}
      onTrackMute={handleTrackMute}
      onTrackSolo={handleTrackSolo}
      onTrackVolumeChange={handleTrackVolumeChange}
      onPlay={handlePlay}
      onStop={handleStop}
      onTempoChange={music.updateTempo}
      onClearTrack={handleClearTrack}
      onClearAll={handleClearAll}
      onAddTrack={handleAddTrack}
      onRemoveTrack={handleRemoveTrack}
      onLoadDefaultPattern={handleLoadDefaultPattern}
      embedded={embedded}
    />
  );
};
