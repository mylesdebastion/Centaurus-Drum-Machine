import React, { useState, useEffect } from 'react';
import { Header } from '../Layout/Header';
import { DrumMachine } from '../DrumMachine/DrumMachine';
import { Visualizer } from '../Visualizer/Visualizer';
import { UserList } from './UserList';
import { DrumTrack, VisualizerSettings, User, MIDINote } from '../../types';

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

  const [tracks, setTracks] = useState<DrumTrack[]>([
    {
      id: '1',
      name: 'Kick',
      instrument: 'Bass Drum',
      steps: new Array(16).fill(false),
      velocities: new Array(16).fill(0.8),
      muted: false,
      solo: false,
      volume: 0.8,
      color: '#ef4444'
    },
    {
      id: '2',
      name: 'Snare',
      instrument: 'Snare Drum',
      steps: new Array(16).fill(false),
      velocities: new Array(16).fill(0.8),
      muted: false,
      solo: false,
      volume: 0.8,
      color: '#f59e0b'
    },
    {
      id: '3',
      name: 'Hi-Hat',
      instrument: 'Closed Hi-Hat',
      steps: new Array(16).fill(false),
      velocities: new Array(16).fill(0.6),
      muted: false,
      solo: false,
      volume: 0.7,
      color: '#10b981'
    },
    {
      id: '4',
      name: 'Perc',
      instrument: 'Percussion',
      steps: new Array(16).fill(false),
      velocities: new Array(16).fill(0.7),
      muted: false,
      solo: false,
      volume: 0.6,
      color: '#8b5cf6'
    }
  ]);

  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(120);
  const [isConnected, setIsConnected] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [midiNotes, setMidiNotes] = useState<MIDINote[]>([]);

  const [visualizerSettings, setVisualizerSettings] = useState<VisualizerSettings>({
    colorMode: 'spectrum',
    brightness: 0.8,
    ledMatrixEnabled: false,
    ledMatrixIP: ''
  });

  // Simulate playback
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

  return (
    <div className="min-h-screen bg-gray-900">
      <Header
        sessionCode={sessionCode}
        userCount={users.length}
        isConnected={isConnected}
        onSettingsClick={() => setShowSettings(!showSettings)}
      />

      <div className="p-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <DrumMachine
              tracks={tracks}
              currentStep={currentStep}
              isPlaying={isPlaying}
              tempo={tempo}
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
      </div>
    </div>
  );
};