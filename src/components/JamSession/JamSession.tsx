import React, { useState, useEffect, useRef } from 'react';
import { GlobalMusicHeader } from '../GlobalMusicHeader';
import { DrumMachine } from '../DrumMachine/DrumMachine';
import { useGlobalMusic } from '../../contexts/GlobalMusicContext';
import { Users, Music, ArrowLeft, ChevronDown, ChevronUp, LogOut } from 'lucide-react';
import { DrumTrack } from '../../types';
import { createDefaultPattern } from '../../utils/drumPatterns';
import { supabaseSessionService } from '../../services/supabaseSession';
import { ConnectionStatus } from './ConnectionStatus';
import { UserList } from './UserList';
import type { Participant, ConnectionStatus as StatusType, DrumStepEvent } from '../../types/session';

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
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // Supabase session state
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<StatusType>('disconnected');

  // Drum Machine state
  const [tracks, setTracks] = useState<DrumTrack[]>(() => createDefaultPattern());
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playbackTimerRef = useRef<number | null>(null);

  // Debounce timer for drum step broadcasts (Story 17.1)
  const drumStepDebounceTimerRef = useRef<number | null>(null);

  // Subscribe to Supabase session updates
  useEffect(() => {
    console.log('[JamSession] Setting up Supabase subscriptions');

    // Subscribe to presence updates (participant list)
    const unsubscribePresence = supabaseSessionService.onPresenceSync((newParticipants) => {
      console.log('[JamSession] Presence sync:', newParticipants);
      setParticipants(newParticipants);
    });

    // Subscribe to connection status changes
    const unsubscribeStatus = supabaseSessionService.onConnectionStatusChange((status) => {
      console.log('[JamSession] Connection status:', status);
      setConnectionStatus(status);
    });

    // Subscribe to tempo changes from other participants
    const unsubscribeTempo = supabaseSessionService.onTempoChange((tempo) => {
      console.log('[JamSession] Remote tempo change:', tempo);
      music.updateTempo(tempo);
    });

    // Subscribe to playback control from other participants
    const unsubscribePlayback = supabaseSessionService.onPlaybackChange((playing) => {
      console.log('[JamSession] Remote playback change:', playing);
      setIsPlaying(playing);
      if (!playing) {
        setCurrentStep(0); // Reset to beginning on stop
      }
    });

    // Subscribe to key/scale changes from other participants
    const unsubscribeKeyScale = supabaseSessionService.onKeyScaleChange((key, scale) => {
      console.log('[JamSession] Remote key/scale change:', key, scale);
      music.updateKey(key);
      music.updateScale(scale);
    });

    // Subscribe to drum step changes from other participants (Story 17.1)
    const unsubscribeDrumStep = supabaseSessionService.onDrumStep((data: DrumStepEvent) => {
      console.log('[JamSession] Remote drum step change:', data);
      setTracks((prev) =>
        prev.map((track, trackIndex) =>
          trackIndex === data.track
            ? {
                ...track,
                steps: track.steps.map((s, stepIndex) => (stepIndex === data.step ? data.enabled : s)),
                velocities: track.velocities.map((v, stepIndex) => (stepIndex === data.step ? data.velocity / 100 : v)),
              }
            : track
        )
      );
    });

    // Get initial connection status
    setConnectionStatus(supabaseSessionService.connectionStatus);

    // Cleanup subscriptions on unmount
    return () => {
      console.log('[JamSession] Cleaning up Supabase subscriptions');
      unsubscribePresence();
      unsubscribeStatus();
      unsubscribeTempo();
      unsubscribePlayback();
      unsubscribeKeyScale();
      unsubscribeDrumStep();
    };
  }, [music]);

  // Broadcast tempo changes to other participants
  useEffect(() => {
    if (supabaseSessionService.isInSession()) {
      supabaseSessionService.broadcastTempo(music.tempo);
    }
  }, [music.tempo]);

  // Broadcast key/scale changes to other participants
  useEffect(() => {
    if (supabaseSessionService.isInSession()) {
      supabaseSessionService.broadcastKeyScale(music.key, music.scale);
    }
  }, [music.key, music.scale]);

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
  const handlePlay = () => {
    setIsPlaying(true);

    // Broadcast playback state to session
    if (supabaseSessionService.isInSession()) {
      supabaseSessionService.broadcastPlayback(true);
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentStep(0);

    // Broadcast playback state to session
    if (supabaseSessionService.isInSession()) {
      supabaseSessionService.broadcastPlayback(false);
    }
  };

  const handleStepToggle = (trackId: string, stepIndex: number) => {
    setTracks((prev) => {
      const newTracks = prev.map((track) =>
        track.id === trackId
          ? { ...track, steps: track.steps.map((s, i) => (i === stepIndex ? !s : s)) }
          : track
      );

      // Broadcast step change to session (Story 17.1)
      if (supabaseSessionService.isInSession()) {
        const trackIndex = prev.findIndex((t) => t.id === trackId);
        const track = prev[trackIndex];
        const enabled = !track.steps[stepIndex];
        const velocity = Math.round(track.velocities[stepIndex] * 100);

        // Debounce broadcasts to prevent flooding (50ms window)
        if (drumStepDebounceTimerRef.current) {
          clearTimeout(drumStepDebounceTimerRef.current);
        }

        drumStepDebounceTimerRef.current = window.setTimeout(() => {
          supabaseSessionService.broadcastDrumStep({
            track: trackIndex,
            step: stepIndex,
            enabled,
            velocity,
          });
          drumStepDebounceTimerRef.current = null;
        }, 50);
      }

      return newTracks;
    });
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
              onClick={() => setShowLeaveConfirm(true)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Leave Session"
              title="Leave Session"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400 hover:text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Jam Session</h1>
              <p className="text-sm text-gray-400">
                Code: {sessionCode} • {participants.length} {participants.length === 1 ? 'participant' : 'participants'}
              </p>
            </div>
          </div>

          {/* Connection Status & Actions */}
          <div className="flex items-center gap-3">
            <ConnectionStatus status={connectionStatus} compact />
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-red-900/20 border border-red-700/50 text-red-200 hover:bg-red-900/30 rounded-lg transition-colors text-sm"
              title="Leave Session"
            >
              <LogOut className="w-4 h-4" />
              <span>Leave</span>
            </button>
          </div>
        </div>
      </div>

      {/* Leave Confirmation Modal */}
      {showLeaveConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            onClick={() => setShowLeaveConfirm(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-2xl max-w-md w-full p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Leave Session?</h2>
              <p className="text-gray-400 mb-6">
                Are you sure you want to leave this jam session? Other participants will be notified.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLeaveConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Stay
                </button>
                <button
                  onClick={onLeaveSession}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                >
                  Leave
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Tab Navigation */}
      <div className="bg-gray-800/30 border-b border-gray-700 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-2 py-2">

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
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-6 h-6 text-green-400" />
                  <h2 className="text-xl font-bold text-white">Participants</h2>
                </div>
                <p className="text-sm text-gray-400">
                  Real-time participant list. Others will see when you join or leave.
                </p>
              </div>

              <UserList
                participants={participants}
                myPeerId={supabaseSessionService.myPeerId}
              />

              {/* Epic 7 Status */}
              <div className="mt-6 bg-green-900/20 border border-green-700/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 animate-pulse" />
                  <div>
                    <h4 className="text-sm font-semibold text-green-200 mb-1">
                      ✅ Epic 7: Jam Session Backend Active
                    </h4>
                    <ul className="text-xs text-green-300/70 space-y-0.5">
                      <li>• Real-time presence tracking via Supabase</li>
                      <li>• Tempo sync across all participants</li>
                      <li>• Connection status: {connectionStatus}</li>
                      <li>• Session code: {sessionCode}</li>
                    </ul>
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
