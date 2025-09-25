import React, { useState } from 'react';
import { Music, Users, Play, BookOpen, Sparkles } from 'lucide-react';

interface WelcomeScreenProps {
  onStartJam: () => void;
  onJoinJam: (code: string) => void;
  onEducationMode: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStartJam,
  onJoinJam,
  onEducationMode
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

        {/* Feature Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div className="bg-gray-800 p-4 sm:p-6 rounded-xl border border-gray-700 hover:border-primary-500 transition-colors">
            <Users className="w-10 h-10 sm:w-12 sm:h-12 text-primary-500 mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">Multi-User Jamming</h3>
            <p className="text-gray-400 text-xs sm:text-sm">
              Sync with friends worldwide. Low-latency networking keeps everyone in perfect time.
            </p>
          </div>
          
          <div className="bg-gray-800 p-4 sm:p-6 rounded-xl border border-gray-700 hover:border-accent-500 transition-colors">
            <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-accent-500 mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">Music Visualization</h3>
            <p className="text-gray-400 text-xs sm:text-sm">
              Watch your music come alive with colors. Connect LED matrices for physical light shows.
            </p>
          </div>
          
          <div className="bg-gray-800 p-4 sm:p-6 rounded-xl border border-gray-700 hover:border-green-500 transition-colors sm:col-span-2 lg:col-span-1">
            <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-green-500 mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">Educational Mode</h3>
            <p className="text-gray-400 text-xs sm:text-sm">
              Learn rhythm and melody through interactive lessons designed for K-12 students.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 justify-center items-center">
          <button
            onClick={onStartJam}
            className="btn-primary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 flex items-center gap-3 w-full sm:w-auto sm:min-w-[200px] justify-center touch-target"
          >
            <Play className="w-5 h-5 sm:w-6 sm:h-6" />
            Start a Jam
          </button>

          <div className="flex flex-col gap-4 items-center w-full sm:w-auto">
            {!showJoinInput ? (
              <button
                onClick={() => setShowJoinInput(true)}
                className="btn-secondary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 flex items-center gap-3 w-full sm:w-auto sm:min-w-[200px] justify-center touch-target"
              >
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                Join a Jam
              </button>
            ) : (
              <form onSubmit={handleJoinSubmit} className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Enter room code"
                  className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none w-full sm:w-auto touch-target"
                  autoFocus
                />
                <button
                  type="submit"
                  className="btn-primary px-6 py-3 w-full sm:w-auto touch-target"
                  disabled={!joinCode.trim()}
                >
                  Join
                </button>
              </form>
            )}

            <button
              onClick={onEducationMode}
              className="btn-accent text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 flex items-center gap-3 w-full sm:w-auto sm:min-w-[200px] justify-center touch-target"
            >
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
              Education Mode
            </button>
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