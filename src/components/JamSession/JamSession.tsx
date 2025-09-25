import React, { useState, useEffect } from 'react';
import { Header } from '../Layout/Header';
import { DrumMachine } from '../DrumMachine/DrumMachine';
import { CompactDrumMachine } from '../DrumMachine/CompactDrumMachine';
import { Visualizer } from '../Visualizer/Visualizer';
import { CompactVisualizer } from '../Visualizer/CompactVisualizer';
import { UserList } from './UserList';
import { MobileNavigation } from '../Layout/MobileNavigation';
import { ResponsiveContainer } from '../Layout/ResponsiveContainer';
import { DrumTrack, VisualizerSettings, User, MIDINote } from '../../types';
import { createDefaultPattern, createEmptyTrack } from '../../utils/drumPatterns';

interface JamSessionProps {
  sessionCode: string;
  onLeaveSession: () => void;
}

export const JamSession: React.FC<JamSessionProps> = ({
  sessionCode,
  onLeaveSession
}) => {
  const [users, setUsers] = useState<User[]>([
    { id: '1', name: 'You', color: '#3b82f6', isHost: true },
    { id: '2', name: 'Alex', color: '#ef4444', isHost: false },
    { id: '3', name: 'Sam', color: '#10b981', isHost: false }
  ]);

  const [tracks, setTracks] = useState<DrumTrack[]>(() => createDefaultPattern());

  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(120);
  const [isConnected, setIsConnected] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [midiNotes, setMidiNotes] = useState<MIDINote[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [activeView, setActiveView] = useState<'drum' | 'visualizer' | 'users' | 'settings'>('drum');

  const [visualizerSettings, setVisualizerSettings] = useState<VisualizerSettings>({
    colorMode: 'spectrum',
    brightness: 0.8,
    ledMatrixEnabled: false,
    ledMatrixIP: ''
  });

  // Simulate playback
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % 16);
      
      // Simulate MIDI notes for active steps
      tracks.forEach((track, trackIndex) => {
        if (track.steps[currentStep] && !track.muted) {
          const note: MIDINote = {
            note: 36 + trackIndex * 2, // MIDI note numbers
            velocity: track.velocities[currentStep],
            channel: 10, // Drum channel
            timestamp: Date.now(),
            userId: '1'
          };
          
          setMidiNotes(prev => [...prev.slice(-10), note]); // Keep last 10 notes
        }
      });
    }, (60 / tempo / 4) * 1000); // 16th note timing

    return () => clearInterval(interval);
  }, [isPlaying, tempo, currentStep, tracks]);

  const handleStepToggle = (trackId: string, stepIndex: number) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId
        ? {
            ...track,
            steps: track.steps.map((step, index) => 
              index === stepIndex ? !step : step
            )
          }
        : track
    ));
  };

  const handleVelocityChange = (trackId: string, stepIndex: number, velocity: number) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId
        ? {
            ...track,
            velocities: track.velocities.map((vel, index) => 
              index === stepIndex ? velocity : vel
            )
          }
        : track
    ));
  };

  const handleTrackMute = (trackId: string) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId ? { ...track, muted: !track.muted } : track
    ));
  };

  const handleTrackSolo = (trackId: string) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId ? { ...track, solo: !track.solo } : track
    ));
  };

  const handleTrackVolumeChange = (trackId: string, volume: number) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId ? { ...track, volume } : track
    ));
  };

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const handleTempoChange = (newTempo: number) => {
    setTempo(Math.max(60, Math.min(200, newTempo)));
  };

  const handleClearTrack = (trackId: string) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId
        ? {
            ...track,
            steps: new Array(16).fill(false),
            velocities: new Array(16).fill(0.8)
          }
        : track
    ));
  };

  const handleClearAll = () => {
    setTracks(prev => prev.map(track => ({
      ...track,
      steps: new Array(16).fill(false),
      velocities: new Array(16).fill(0.8)
    })));
  };

  const handleAddTrack = (track: DrumTrack) => {
    setTracks(prev => [...prev, track]);
  };

  const handleRemoveTrack = (trackId: string) => {
    setTracks(prev => prev.filter(track => track.id !== trackId));
    // Reset selected track if it was removed
    if (tracks.findIndex(t => t.id === trackId) <= selectedTrack) {
      setSelectedTrack(Math.max(0, selectedTrack - 1));
    }
  };

  const handleLoadDefaultPattern = () => {
    setTracks(createDefaultPattern());
    setSelectedTrack(0);
  };

  const renderMobileView = () => {
    switch (activeView) {
      case 'drum':
        return (
          <CompactDrumMachine
            tracks={tracks}
            currentStep={currentStep}
            isPlaying={isPlaying}
            tempo={tempo}
            colorMode={visualizerSettings.colorMode}
            onStepToggle={handleStepToggle}
            onPlay={handlePlay}
            onStop={handleStop}
            onTempoChange={handleTempoChange}
            onAddTrack={handleAddTrack}
            onRemoveTrack={handleRemoveTrack}
            onLoadDefaultPattern={handleLoadDefaultPattern}
          />
        );
      case 'visualizer':
        return (
          <CompactVisualizer
            settings={visualizerSettings}
            onSettingsChange={setVisualizerSettings}
            midiNotes={midiNotes}
          />
        );
      case 'users':
        return (
          <div className="space-y-4">
            <UserList
              users={users}
              currentUserId="1"
              onUserKick={(userId) => {
                setUsers(prev => prev.filter(user => user.id !== userId));
              }}
            />
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <h3 className="text-lg font-semibold mb-3">Session Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Room Code:</span>
                  <span className="font-mono text-primary-400">{sessionCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tempo:</span>
                  <span>{tempo} BPM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Time Signature:</span>
                  <span>4/4</span>
                </div>
              </div>
              <button
                onClick={onLeaveSession}
                className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Leave Session
              </button>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Visualizer Settings</label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Color Mode</label>
                    <select
                      value={visualizerSettings.colorMode}
                      onChange={(e) => setVisualizerSettings({
                        ...visualizerSettings,
                        colorMode: e.target.value as any
                      })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-primary-500 focus:outline-none"
                    >
                      <option value="spectrum">Spectrum</option>
                      <option value="chromatic">Chromatic</option>
                      <option value="harmonic">Harmonic</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Brightness: {Math.round(visualizerSettings.brightness * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={visualizerSettings.brightness}
                      onChange={(e) => setVisualizerSettings({
                        ...visualizerSettings,
                        brightness: parseFloat(e.target.value)
                      })}
                      className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  return (
    <ResponsiveContainer className="min-h-screen bg-gray-900">
      <Header
        sessionCode={sessionCode}
        userCount={users.length}
        isConnected={isConnected}
        onSettingsClick={() => setShowSettings(!showSettings)}
      />

      <div className="p-4 md:p-6">
        {isMobile ? (
          <div className="space-y-4">
            {renderMobileView()}
          </div>
        ) : (
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              <DrumMachine
                tracks={tracks}
                currentStep={currentStep}
                isPlaying={isPlaying}
                tempo={tempo}
                colorMode={visualizerSettings.colorMode}
                onStepToggle={handleStepToggle}
                onVelocityChange={handleVelocityChange}
                onTrackMute={handleTrackMute}
                onTrackSolo={handleTrackSolo}
                onTrackVolumeChange={handleTrackVolumeChange}
                onPlay={handlePlay}
                onStop={handleStop}
                onTempoChange={handleTempoChange}
                onClearTrack={handleClearTrack}
                onClearAll={handleClearAll}
               onAddTrack={handleAddTrack}
               onRemoveTrack={handleRemoveTrack}
               onLoadDefaultPattern={handleLoadDefaultPattern}
              />

              <Visualizer
                settings={visualizerSettings}
                onSettingsChange={setVisualizerSettings}
                midiNotes={midiNotes}
              />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <UserList
                users={users}
                currentUserId="1"
                onUserKick={(userId) => {
                  setUsers(prev => prev.filter(user => user.id !== userId));
                }}
              />

              {/* Session Info */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Session Info</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Room Code:</span>
                    <span className="font-mono text-primary-400">{sessionCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tempo:</span>
                    <span>{tempo} BPM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Time Signature:</span>
                    <span>4/4</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Pattern Length:</span>
                    <span>16 steps</span>
                  </div>
                </div>
                
                <button
                  onClick={onLeaveSession}
                  className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Leave Session
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Navigation */}
      {isMobile && (
        <MobileNavigation
          activeView={activeView}
          onViewChange={setActiveView}
          userCount={users.length}
        />
      )}
    </ResponsiveContainer>
  );
};