import React, { useState, useEffect, useRef } from 'react';
import { GlobalMusicHeader } from '../GlobalMusicHeader';
import { DrumMachine } from '../DrumMachine/DrumMachine';
import { useGlobalMusic } from '../../contexts/GlobalMusicContext';
import { Users, Music, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { DrumTrack } from '../../types';
import { createDefaultPattern } from '../../utils/drumPatterns';

/**
 * New Jam Session (Epic 4)
 * Clean slate collaborative music session with global music controls
 * Gradually integrating modules with GlobalMusicContext
 */
interface JamSessionProps {
  sessionCode: string;
  onLeaveSession: () => void;
}

export const JamSession: React.FC<JamSessionProps> = ({
  sessionCode,
  onLeaveSession,
}) => {
  const music = useGlobalMusic();
  const [activeTab, setActiveTab] = useState<'drum' | 'piano' | 'users'>('drum');
  const [showDrumMachine, setShowDrumMachine] = useState(true);

  // Drum Machine state
  const [tracks, setTracks] = useState<DrumTrack[]>(() => createDefaultPattern());
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playbackTimerRef = useRef<number | null>(null);

  // Playback timer - synced with global tempo
  useEffect(() => {
    if (isPlaying) {
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
  }, [isPlaying, music.tempo]);

  // Drum Machine handlers
  const handlePlay = () => setIsPlaying(true);
  const handleStop = () => {
    setIsPlaying(false);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Global Music Header */}
      <GlobalMusicHeader />

      {/* Session Header */}
      <div className="bg-gray-800/50 border-b border-gray-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onLeaveSession}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Leave Session"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400 hover:text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Jam Session</h1>
              <p className="text-sm text-gray-400">Session Code: {sessionCode}</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('drum')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'drum'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Music className="w-4 h-4" />
              <span className="hidden sm:inline">Drums</span>
            </button>
            <button
              onClick={() => setActiveTab('piano')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'piano'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Music className="w-4 h-4" />
              <span className="hidden sm:inline">Piano</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'users'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Users</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'drum' && (
            <div className="space-y-4">
              {/* Drum Machine Toggle */}
              <div className="bg-gray-800 rounded-lg border border-gray-700">
                <button
                  onClick={() => setShowDrumMachine(!showDrumMachine)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Music className="w-6 h-6 text-primary-400" />
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-white">Drum Machine</h3>
                      <p className="text-sm text-gray-400">
                        16-step sequencer • Synced to global tempo ({music.tempo} BPM)
                      </p>
                    </div>
                  </div>
                  {showDrumMachine ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {showDrumMachine && (
                  <div className="p-4 border-t border-gray-700">
                    <DrumMachine
                      tracks={tracks}
                      currentStep={currentStep}
                      isPlaying={isPlaying}
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
                    />
                  </div>
                )}
              </div>

              {/* Integration Status */}
              <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 animate-pulse" />
                  <div>
                    <h4 className="text-sm font-semibold text-green-200 mb-1">
                      ✅ Drum Machine Integrated
                    </h4>
                    <ul className="text-xs text-green-300/70 space-y-0.5">
                      <li>• Tempo synced with global header ({music.tempo} BPM)</li>
                      <li>• Color mode: {music.colorMode}</li>
                      <li>• Master volume: {Math.round(music.masterVolume * 100)}%</li>
                      <li>• Audio engine: Persistent across navigation</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'piano' && (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
              <div className="text-center">
                <Music className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Piano Roll</h2>
                <p className="text-gray-400 mb-6">
                  Piano roll integration coming soon. Will use global tempo, key, and scale.
                </p>
                <div className="bg-gray-700/50 rounded-lg p-4 max-w-md mx-auto text-left">
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">
                    Global Controls Active:
                  </h3>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>✓ Tempo sync from header</li>
                    <li>✓ Key/Scale highlighting</li>
                    <li>✓ Master volume control</li>
                    <li>✓ Color mode (chromatic/harmonic)</li>
                    <li>✓ MIDI input from header settings</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
              <div className="text-center">
                <Users className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Collaborative Users</h2>
                <p className="text-gray-400 mb-6">
                  Multi-user collaboration coming soon (Epic 6: Shared Sessions)
                </p>
                <div className="bg-gray-700/50 rounded-lg p-4 max-w-md mx-auto">
                  <div className="flex items-center gap-3 p-3 bg-gray-600 rounded-lg">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      Y
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-white font-semibold">You (Host)</div>
                      <div className="text-xs text-gray-400">Connected</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Development Info */}
      <div className="fixed bottom-4 right-4 bg-blue-900/90 border border-blue-700 rounded-lg p-4 max-w-sm shadow-xl">
        <h3 className="text-sm font-semibold text-blue-200 mb-2">✅ Epic 4 Integration Active</h3>
        <p className="text-xs text-blue-100 mb-2">
          DrumMachine now connected to Global Music Controls.
        </p>
        <div className="text-xs text-blue-200/70 space-y-1">
          <div>• Try adjusting tempo in header</div>
          <div>• Change key/scale and color mode</div>
          <div>• Open Hardware Settings modal</div>
          <div className="pt-2 border-t border-blue-700/50">
            Legacy version:{' '}
            <button
              onClick={() => (window.location.href = '/jam-legacy')}
              className="underline hover:text-blue-100"
            >
              /jam-legacy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
