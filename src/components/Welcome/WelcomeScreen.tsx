import React, { useState } from 'react';
import { Music, Users, Play, BookOpen, Sparkles, Gamepad2, Boxes, Grid3x3, Activity, Zap, Music2, Piano } from 'lucide-react';

interface WelcomeScreenProps {
  onStartJam: () => void;
  onJoinJam: (code: string) => void;
  onEducationMode: () => void;
  onIsometricMode: () => void;
  onDJVisualizer: () => void;
  onWLEDExperiment: () => void;
  onMIDITest: () => void;
  onPianoRoll: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStartJam,
  onJoinJam,
  onEducationMode,
  onIsometricMode,
  onDJVisualizer,
  onWLEDExperiment,
  onMIDITest,
  onPianoRoll
}) => {
  const [joinCode, setJoinCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) {
      onJoinJam(joinCode.trim().toUpperCase());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-4xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Music className="w-16 h-16 sm:w-20 sm:h-20 text-primary-500" />
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-accent-400 absolute -top-2 -right-2 animate-pulse" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
            Audiolux Jam Session
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 mb-2">
            Real-time collaborative music making with synchronized visuals
          </p>
          <p className="text-sm sm:text-base text-gray-400">
            No account needed. Just open the app and start playing.
          </p>
        </div>

        {/* Action Buttons Section */}
        <div className="mb-12 sm:mb-16">
          <div className="grid sm:grid-cols-3 gap-4">
            {/* 3D Sequencer - Primary */}
            <button
              onClick={onIsometricMode}
              className="group bg-gradient-to-br from-cyan-900/50 to-purple-900/50 hover:from-cyan-800/60 hover:to-purple-800/60 p-6 rounded-xl border-2 border-cyan-500/30 hover:border-cyan-400 transition-all transform hover:scale-105 shadow-lg hover:shadow-cyan-500/20"
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <Boxes className="w-12 h-12 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
                <h3 className="text-lg font-bold text-white">3D Sequencer</h3>
                <p className="text-sm text-gray-300">
                  Interactive isometric music sequencer with visual feedback
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-cyan-300">
                  <Play className="w-4 h-4" />
                  <span>Start Creating</span>
                </div>
              </div>
            </button>

            {/* Drum Machine */}
            <button
              onClick={onStartJam}
              className="group bg-gradient-to-br from-primary-900/50 to-accent-900/50 hover:from-primary-800/60 hover:to-accent-800/60 p-6 rounded-xl border-2 border-primary-500/30 hover:border-primary-400 transition-all transform hover:scale-105 shadow-lg hover:shadow-primary-500/20"
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <Grid3x3 className="w-12 h-12 text-primary-400 group-hover:text-primary-300 transition-colors" />
                <h3 className="text-lg font-bold text-white">Drum Machine</h3>
                <p className="text-sm text-gray-300">
                  Classic grid-based drum sequencer with sample pads
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-primary-300">
                  <Music className="w-4 h-4" />
                  <span>Beat Maker</span>
                </div>
              </div>
            </button>

            {/* Education Mode */}
            <button
              onClick={onEducationMode}
              className="group bg-gradient-to-br from-green-900/50 to-emerald-900/50 hover:from-green-800/60 hover:to-emerald-800/60 p-6 rounded-xl border-2 border-green-500/30 hover:border-green-400 transition-all transform hover:scale-105 shadow-lg hover:shadow-green-500/20"
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <BookOpen className="w-12 h-12 text-green-400 group-hover:text-green-300 transition-colors" />
                <h3 className="text-lg font-bold text-white">Education Mode</h3>
                <p className="text-sm text-gray-300">
                  Interactive lessons for rhythm and melody (K-12)
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-green-300">
                  <BookOpen className="w-4 h-4" />
                  <span>Learn Music</span>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Why This Platform Section */}
        <div className="mb-12 sm:mb-16">
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-gray-200">
            Why Audiolux?
          </h2>
          <p className="text-center text-sm text-gray-400 mb-8">
            Innovative features that make music creation accessible and visual
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-gray-800/50 p-4 sm:p-6 rounded-xl border border-gray-700/50">
              <Users className="w-10 h-10 sm:w-12 sm:h-12 text-primary-500 mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">Multi-User Jamming</h3>
              <p className="text-gray-400 text-xs sm:text-sm">
                Sync with friends worldwide. Low-latency networking keeps everyone in perfect time.
              </p>
            </div>

            <div className="bg-gray-800/50 p-4 sm:p-6 rounded-xl border border-gray-700/50">
              <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-accent-500 mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">Music Visualization</h3>
              <p className="text-gray-400 text-xs sm:text-sm">
                LED strips represent instruments or notes for participants to follow in sync with the music creation.
              </p>
            </div>

            <div className="bg-gray-800/50 p-4 sm:p-6 rounded-xl border border-gray-700/50 sm:col-span-2 lg:col-span-1">
              <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-green-500 mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">Educational Focus</h3>
              <p className="text-gray-400 text-xs sm:text-sm">
                Learn rhythm and melody through interactive lessons designed for K-12 students.
              </p>
            </div>
          </div>
        </div>

        {/* Experiments Section */}
        <div className="border-t border-gray-700/50 pt-8">
          <h2 className="text-lg sm:text-xl font-bold text-center mb-4 text-gray-400">
            Experiments
          </h2>
          <p className="text-center text-sm text-gray-500 mb-6">
            Beta features and experimental tools
          </p>

          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {/* Piano Roll Visualizer */}
            <button
              onClick={onPianoRoll}
              className="group bg-gray-800/50 p-4 rounded-lg border border-gray-700 hover:border-green-500/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3 mb-3">
                <Piano className="w-6 h-6 text-green-400" />
                <h3 className="font-semibold text-white">Piano Roll</h3>
                <span className="text-xs bg-green-600/30 text-green-300 px-2 py-1 rounded">New</span>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                88-key interactive piano with MIDI input and WLED LED strip output
              </p>
              <div className="flex items-center gap-2 text-sm text-green-400 group-hover:text-green-300">
                <span>Launch Piano</span>
                <Play className="w-4 h-4" />
              </div>
            </button>

            {/* MIDI Input Test */}
            <button
              onClick={onMIDITest}
              className="group bg-gray-800/50 p-4 rounded-lg border border-gray-700 hover:border-blue-500/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3 mb-3">
                <Music2 className="w-6 h-6 text-blue-400" />
                <h3 className="font-semibold text-white">MIDI Input Engine</h3>
                <span className="text-xs bg-blue-600/30 text-blue-300 px-2 py-1 rounded">Test</span>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Test Web MIDI API with live note visualization and keyboard fallback mode
              </p>
              <div className="flex items-center gap-2 text-sm text-blue-400 group-hover:text-blue-300">
                <span>Launch Test</span>
                <Play className="w-4 h-4" />
              </div>
            </button>

            {/* WLED Direct Test */}
            <button
              onClick={onWLEDExperiment}
              className="group bg-gray-800/50 p-4 rounded-lg border border-gray-700 hover:border-purple-500/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3 mb-3">
                <Zap className="w-6 h-6 text-purple-400" />
                <h3 className="font-semibold text-white">WLED Direct Test</h3>
                <span className="text-xs bg-purple-600/30 text-purple-300 px-2 py-1 rounded">Experiment</span>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Test direct mobile → WLED WebSocket connection without bridge
              </p>
              <div className="flex items-center gap-2 text-sm text-purple-400 group-hover:text-purple-300">
                <span>Launch Test</span>
                <Play className="w-4 h-4" />
              </div>
            </button>

            {/* DJ Visualizer */}
            <button
              onClick={onDJVisualizer}
              className="group bg-gray-800/50 p-4 rounded-lg border border-gray-700 hover:border-orange-500/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3 mb-3">
                <Activity className="w-6 h-6 text-orange-400" />
                <h3 className="font-semibold text-white">DJ Visualizer</h3>
                <span className="text-xs bg-orange-600/30 text-orange-300 px-2 py-1 rounded">Beta</span>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Live audio visualization with spectrum analyzer, ripple effects, and LED matrix output
              </p>
              <div className="flex items-center gap-2 text-sm text-orange-400 group-hover:text-orange-300">
                <span>Launch Visualizer</span>
                <Play className="w-4 h-4" />
              </div>
            </button>

            {/* Multiplayer Jam */}
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <Users className="w-6 h-6 text-purple-400" />
                <h3 className="font-semibold text-white">Multiplayer Jam</h3>
                <span className="text-xs bg-purple-600/30 text-purple-300 px-2 py-1 rounded">Beta</span>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Sync with friends using room codes
              </p>
              <div className="space-y-2">
                <button
                  onClick={onStartJam}
                  className="btn-primary w-full text-sm px-4 py-2 flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Create a Jam Room
                </button>
                {!showJoinInput ? (
                  <button
                    onClick={() => setShowJoinInput(true)}
                    className="btn-secondary w-full text-sm px-4 py-2 flex items-center justify-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    Join a Room
                  </button>
                ) : (
                  <form onSubmit={handleJoinSubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      placeholder="Room code"
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="btn-primary px-4 py-2 text-sm"
                      disabled={!joinCode.trim()}
                    >
                      Join
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* APC40 Demo */}
            <a
              href="/apc40-demo.html"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-gray-800/50 p-4 rounded-lg border border-gray-700 hover:border-pink-500/50 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <Gamepad2 className="w-6 h-6 text-pink-400" />
                <h3 className="font-semibold text-white">APC40 Demo</h3>
                <span className="text-xs bg-pink-600/30 text-pink-300 px-2 py-1 rounded">Hardware</span>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Test MIDI controller integration
              </p>
              <div className="flex items-center gap-2 text-sm text-pink-400 group-hover:text-pink-300">
                <span>Open Demo</span>
                <Play className="w-4 h-4" />
              </div>
            </a>
          </div>
        </div>

        {/* Quick Info */}
        <div className="mt-8 sm:mt-12 text-center">
          <p className="text-gray-500 text-xs sm:text-sm">
            Compatible with MIDI controllers • LED integration • Web Audio API
          </p>
        </div>
      </div>
    </div>
  );
};