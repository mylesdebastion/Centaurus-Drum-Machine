import React from 'react';
import { RefreshCw, Grid3x3 } from 'lucide-react';
import { DrumTrack, ColorMode } from '../../types';
import { TrackRow } from './TrackRow';
import { TransportControls } from './TransportControls';
import { TrackManager } from './TrackManager';
import { audioEngine } from '../../utils/audioEngine';
import { ledCompositor } from '@/services/LEDCompositor';
import { drumMachineCapability } from '@/capabilities/drumMachineCapability';

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
  // Optional: Launchpad layout orientation toggle (Story 8.2)
  launchpadOrientation?: 'horizontal' | 'vertical';
  onToggleLaunchpadOrientation?: () => void;
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
  launchpadOrientation,
  onToggleLaunchpadOrientation
}) => {
  // Register module capability for WLED routing
  React.useEffect(() => {
    ledCompositor.registerModule(drumMachineCapability);
    console.log('[DrumMachine] Module registered with LEDCompositor');

    return () => {
      ledCompositor.unregisterModule('drum-machine');
      console.log('[DrumMachine] Module unregistered from LEDCompositor');
    };
  }, []);

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

  // Submit LED frames to WLED devices via automatic routing (Story 18.6)
  React.useEffect(() => {
    if (!isPlaying) return;

    // Generate visualization frame
    const frame = generateDrumMachineFrame(tracks, currentStep);

    // Submit to LEDCompositor (automatic routing)
    ledCompositor
      .submitFrameWithRouting({
        moduleId: 'drum-machine',
        pixelData: frame,
        timestamp: Date.now(),
      })
      .catch((error) => {
        console.error('[DrumMachine] Failed to submit LED frame:', error);
      });
  }, [currentStep, isPlaying, tracks]);

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Drum Machine</h2>
        <div className="flex items-center gap-4">
          {onToggleLaunchpadOrientation && (
            <button
              onClick={onToggleLaunchpadOrientation}
              className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
              title={`Launchpad Layout: ${launchpadOrientation || 'horizontal'}`}
            >
              <Grid3x3 className="w-4 h-4" />
              {launchpadOrientation === 'vertical' ? 'Vertical' : 'Horizontal'}
            </button>
          )}
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

/**
 * Generate LED frame from drum machine pattern (Story 18.6)
 * Format: 6 tracks × 16 steps (RGB)
 * @param tracks - Drum tracks
 * @param activeStep - Current active step
 * @returns {Uint8ClampedArray} RGB pixel data
 */
function generateDrumMachineFrame(
  tracks: DrumTrack[],
  activeStep: number
): Uint8ClampedArray {
  const numTracks = Math.min(tracks.length, 6); // Max 6 tracks for visualization
  const numSteps = 16;
  const frame = new Uint8ClampedArray(numTracks * numSteps * 3); // RGB

  for (let trackIndex = 0; trackIndex < numTracks; trackIndex++) {
    const track = tracks[trackIndex];

    for (let step = 0; step < numSteps; step++) {
      const pixelIndex = (trackIndex * numSteps + step) * 3;
      const isActive = track.steps[step];
      const isCurrentStep = step === activeStep;
      const velocity = track.velocities[step];

      if (isCurrentStep && isActive) {
        // Active step with note (bright color based on velocity)
        const intensity = Math.floor(velocity * 255);
        frame[pixelIndex] = intensity; // R
        frame[pixelIndex + 1] = intensity; // G
        frame[pixelIndex + 2] = 255; // B (full blue for active)
      } else if (isCurrentStep) {
        // Current step, no note (dim white playhead)
        frame[pixelIndex] = 50; // R
        frame[pixelIndex + 1] = 50; // G
        frame[pixelIndex + 2] = 50; // B
      } else if (isActive) {
        // Note (blue, intensity based on velocity)
        const intensity = Math.floor(velocity * 200);
        frame[pixelIndex] = 0; // R
        frame[pixelIndex + 1] = intensity / 2; // G (slight green for depth)
        frame[pixelIndex + 2] = intensity; // B
      } else {
        // Empty (black)
        frame[pixelIndex] = 0;
        frame[pixelIndex + 1] = 0;
        frame[pixelIndex + 2] = 0;
      }
    }
  }

  return frame;
}