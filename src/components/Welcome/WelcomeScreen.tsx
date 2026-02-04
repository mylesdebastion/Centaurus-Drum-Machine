import React, { useState } from 'react';
import { Music, Users, Play, BookOpen, Sparkles, Gamepad2, Boxes, Grid3x3, Activity, Zap, Music2, Piano, Guitar, Database, Grid2x2 } from 'lucide-react';

interface WelcomeScreenProps {
  onStartJam: () => void;
  onJoinJam: (code: string) => void;
  onStartJamLegacy?: () => void;
  onEducationMode: () => void;
  onIsometricMode: () => void;
  onDJVisualizer: () => void;
  onWLEDExperiment: () => void;
  onWLEDManager?: () => void;
  onMIDITest: () => void;
  onPianoRoll: () => void;
  onGuitarFretboard: () => void;
  onLumiTest: () => void;
  onHeaderTest?: () => void;
  onStudio?: () => void;
  onSupabaseTest?: () => void;
  onChordMelodyTest?: () => void;
  onLaunchpadTest?: () => void;
  onPixelBoop?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStartJam,
  onJoinJam,
  onStartJamLegacy,
  onEducationMode,
  onIsometricMode,
  onDJVisualizer,
  onWLEDExperiment,
  onWLEDManager,
  onMIDITest,
  onPianoRoll,
  onGuitarFretboard,
  onLumiTest,
  onHeaderTest,
  onStudio,
  onSupabaseTest,
  onChordMelodyTest,
  onLaunchpadTest,
  onPixelBoop
}) => {
  const [joinCode, setJoinCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [pixelboopCode, setPixelboopCode] = useState('');
  const [showPixelboopInput, setShowPixelboopInput] = useState(false);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) {
      onJoinJam(joinCode.trim().toUpperCase());
    }
  };

  const handlePixelboopJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pixelboopCode.trim()) {
      window.location.href = `/pixelboop/${pixelboopCode.trim().toUpperCase()}`;
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Music Studio */}
            {onStudio && (
              <button
                onClick={onStudio}
                className="group bg-gradient-to-br from-indigo-900/50 to-blue-900/50 hover:from-indigo-800/60 hover:to-blue-800/60 p-6 rounded-xl border-2 border-indigo-500/30 hover:border-indigo-400 transition-all transform hover:scale-105 shadow-lg hover:shadow-indigo-500/20"
              >
                <div className="flex flex-col items-center gap-3 text-center">
                  <Grid3x3 className="w-12 h-12 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                  <h3 className="text-lg font-bold text-white">Music Studio</h3>
                  <p className="text-sm text-gray-300">
                    Dynamic workspace with multiple music modules
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-indigo-300">
                    <Play className="w-4 h-4" />
                    <span>Launch Studio</span>
                  </div>
                </div>
              </button>
            )}

            {/* Multiplayer Jam */}
            <div className="bg-gradient-to-br from-purple-900/50 to-violet-900/50 p-6 rounded-xl border-2 border-purple-500/30 shadow-lg">
              <div className="flex flex-col items-center gap-3 text-center">
                <Users className="w-12 h-12 text-purple-400" />
                <h3 className="text-lg font-bold text-white">Multiplayer Jam</h3>
                <p className="text-sm text-gray-300 mb-2">
                  Sync with friends using room codes and global controls
                </p>
                <div className="w-full space-y-2">
                  <button
                    onClick={onStartJam}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Create a Room
                  </button>
                  {!showJoinInput ? (
                    <button
                      onClick={() => setShowJoinInput(true)}
                      className="w-full bg-purple-700/50 hover:bg-purple-700 text-purple-200 font-semibold px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
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
                        className="flex-1 px-3 py-3 bg-purple-950/50 border border-purple-500/30 rounded-lg text-white text-sm placeholder-purple-300/50 focus:border-purple-400 focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-4 py-3 rounded-lg transition-colors"
                        disabled={!joinCode.trim()}
                      >
                        Join
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>

            {/* 3D Sequencer */}
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

            {/* DJ Visualizer */}
            <button
              onClick={onDJVisualizer}
              className="group bg-gradient-to-br from-orange-900/50 to-red-900/50 hover:from-orange-800/60 hover:to-red-800/60 p-6 rounded-xl border-2 border-orange-500/30 hover:border-orange-400 transition-all transform hover:scale-105 shadow-lg hover:shadow-orange-500/20"
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <Activity className="w-12 h-12 text-orange-400 group-hover:text-orange-300 transition-colors" />
                <h3 className="text-lg font-bold text-white">DJ Visualizer</h3>
                <p className="text-sm text-gray-300">
                  Live audio visualization with spectrum analyzer and LED output
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-orange-300">
                  <Play className="w-4 h-4" />
                  <span>Launch Visualizer</span>
                </div>
              </div>
            </button>

            {/* Piano Roll */}
            <button
              onClick={onPianoRoll}
              className="group bg-gradient-to-br from-lime-900/50 to-green-900/50 hover:from-lime-800/60 hover:to-green-800/60 p-6 rounded-xl border-2 border-lime-500/30 hover:border-lime-400 transition-all transform hover:scale-105 shadow-lg hover:shadow-lime-500/20"
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <Piano className="w-12 h-12 text-lime-400 group-hover:text-lime-300 transition-colors" />
                <h3 className="text-lg font-bold text-white">Piano Roll</h3>
                <p className="text-sm text-gray-300">
                  88-key interactive piano with MIDI input and LED output
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-lime-300">
                  <Play className="w-4 h-4" />
                  <span>Launch Piano</span>
                </div>
              </div>
            </button>

            {/* Guitar Fretboard */}
            <button
              onClick={onGuitarFretboard}
              className="group bg-gradient-to-br from-amber-900/50 to-yellow-900/50 hover:from-amber-800/60 hover:to-yellow-800/60 p-6 rounded-xl border-2 border-amber-500/30 hover:border-amber-400 transition-all transform hover:scale-105 shadow-lg hover:shadow-amber-500/20"
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <Guitar className="w-12 h-12 text-amber-400 group-hover:text-amber-300 transition-colors" />
                <h3 className="text-lg font-bold text-white">Guitar Fretboard</h3>
                <p className="text-sm text-gray-300">
                  6×25 fretboard with chord progressions and LED output
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-amber-300">
                  <Play className="w-4 h-4" />
                  <span>Launch Guitar</span>
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
            {/* Drum Machine (Legacy) */}
            {onStartJamLegacy && (
              <button
                onClick={onStartJamLegacy}
                className="group bg-gray-800/50 p-4 rounded-lg border border-gray-700 hover:border-primary-500/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Grid3x3 className="w-6 h-6 text-primary-400" />
                  <h3 className="font-semibold text-white">Drum Machine</h3>
                  <span className="text-xs bg-gray-600/30 text-gray-300 px-2 py-1 rounded">Legacy</span>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                  Classic grid-based drum sequencer with sample pads (original version)
                </p>
                <div className="flex items-center gap-2 text-sm text-primary-400 group-hover:text-primary-300">
                  <span>Launch Legacy</span>
                  <Play className="w-4 h-4" />
                </div>
              </button>
            )}

            {/* PixelBoop Sequencer */}
            {onPixelBoop && (
              <div className="bg-gradient-to-br from-cyan-900/50 to-teal-900/50 p-6 rounded-xl border-2 border-cyan-500/30 shadow-lg">
                <div className="flex flex-col items-center gap-3 text-center">
                  <Grid3x3 className="w-12 h-12 text-cyan-400" />
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">PixelBoop</h3>
                    <span className="text-xs bg-cyan-600/30 text-cyan-300 px-2 py-1 rounded">Remote Jam</span>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">
                    Gesture-based pixel sequencer with remote sync via room codes
                  </p>
                  <div className="w-full space-y-2">
                    <button
                      onClick={onPixelBoop}
                      className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Launch PixelBoop
                    </button>
                    {!showPixelboopInput ? (
                      <button
                        onClick={() => setShowPixelboopInput(true)}
                        className="w-full bg-cyan-700/50 hover:bg-cyan-700 text-cyan-200 font-semibold px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Users className="w-4 h-4" />
                        View Remote Jam
                      </button>
                    ) : (
                      <form onSubmit={handlePixelboopJoin} className="flex gap-2">
                        <input
                          type="text"
                          value={pixelboopCode}
                          onChange={(e) => setPixelboopCode(e.target.value)}
                          placeholder="Room code"
                          className="flex-1 px-3 py-3 bg-cyan-950/50 border border-cyan-500/30 rounded-lg text-white text-sm placeholder-cyan-300/50 focus:border-cyan-400 focus:outline-none"
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-4 py-3 rounded-lg transition-colors"
                          disabled={!pixelboopCode.trim()}
                        >
                          View
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            )}

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

            {/* WLED Manager */}
            {onWLEDManager && (
              <button
                onClick={onWLEDManager}
                className="group bg-gray-800/50 p-4 rounded-lg border border-gray-700 hover:border-orange-500/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Activity className="w-6 h-6 text-orange-400" />
                  <h3 className="font-semibold text-white">WLED Manager</h3>
                  <span className="text-xs bg-orange-600/30 text-orange-300 px-2 py-1 rounded">Beta</span>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                  Configure LED hardware for intelligent visualization routing
                </p>
                <div className="flex items-center gap-2 text-sm text-orange-400 group-hover:text-orange-300">
                  <span>Open Manager</span>
                  <Play className="w-4 h-4" />
                </div>
              </button>
            )}

            {/* LUMI SysEx Test */}
            <button
              onClick={onLumiTest}
              className="group bg-gray-800/50 p-4 rounded-lg border border-gray-700 hover:border-pink-500/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3 mb-3">
                <Piano className="w-6 h-6 text-pink-400" />
                <h3 className="font-semibold text-white">LUMI SysEx Test</h3>
                <span className="text-xs bg-pink-600/30 text-pink-300 px-2 py-1 rounded">Debug</span>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Test ROLI Piano M / LUMI Keys SysEx protocol in isolated environment
              </p>
              <div className="flex items-center gap-2 text-sm text-pink-400 group-hover:text-pink-300">
                <span>Launch Test</span>
                <Play className="w-4 h-4" />
              </div>
            </button>

            {/* Launchpad Pro Test */}
            {onLaunchpadTest && (
              <button
                onClick={onLaunchpadTest}
                className="group bg-gray-800/50 p-4 rounded-lg border border-gray-700 hover:border-yellow-500/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Grid2x2 className="w-6 h-6 text-yellow-400" />
                  <h3 className="font-semibold text-white">Launchpad Pro Test</h3>
                  <span className="text-xs bg-yellow-600/30 text-yellow-300 px-2 py-1 rounded">NEW</span>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                  Test Novation Launchpad Pro (Mk3/2015) MIDI connection, LED control, and button mapping
                </p>
                <div className="flex items-center gap-2 text-sm text-yellow-400 group-hover:text-yellow-300">
                  <span>Launch Test</span>
                  <Play className="w-4 h-4" />
                </div>
              </button>
            )}

            {/* Global Music Header Test */}
            {onHeaderTest && (
              <button
                onClick={onHeaderTest}
                className="group bg-gray-800/50 p-4 rounded-lg border border-gray-700 hover:border-cyan-500/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Music2 className="w-6 h-6 text-cyan-400" />
                  <h3 className="font-semibold text-white">Music Header Test</h3>
                  <span className="text-xs bg-cyan-600/30 text-cyan-300 px-2 py-1 rounded">NEW</span>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                  Test global music controls: tempo, key/scale, color mode, volume
                </p>
                <div className="flex items-center gap-2 text-sm text-cyan-400 group-hover:text-cyan-300">
                  <span>Launch Test</span>
                  <Play className="w-4 h-4" />
                </div>
              </button>
            )}

            {/* Chord Melody Arranger */}
            {onChordMelodyTest && (
              <button
                onClick={onChordMelodyTest}
                className="group bg-gray-800/50 p-4 rounded-lg border border-gray-700 hover:border-violet-500/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Music2 className="w-6 h-6 text-violet-400" />
                  <h3 className="font-semibold text-white">Chord Melody Arranger</h3>
                  <span className="text-xs bg-violet-600/30 text-violet-300 px-2 py-1 rounded">Beta</span>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                  Interactive chord progression sequencer with melody grid and harmonic guidance
                </p>
                <div className="flex items-center gap-2 text-sm text-violet-400 group-hover:text-violet-300">
                  <span>Launch Arranger</span>
                  <Play className="w-4 h-4" />
                </div>
              </button>
            )}

            {/* Supabase Connection Test */}
            {onSupabaseTest && (
              <button
                onClick={onSupabaseTest}
                className="group bg-gray-800/50 p-4 rounded-lg border border-gray-700 hover:border-teal-500/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Database className="w-6 h-6 text-teal-400" />
                  <h3 className="font-semibold text-white">Supabase Test</h3>
                  <span className="text-xs bg-teal-600/30 text-teal-300 px-2 py-1 rounded">Story 7.1</span>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                  Test Supabase Realtime connection and environment setup
                </p>
                <div className="flex items-center gap-2 text-sm text-teal-400 group-hover:text-teal-300">
                  <span>Launch Test</span>
                  <Play className="w-4 h-4" />
                </div>
              </button>
            )}

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
