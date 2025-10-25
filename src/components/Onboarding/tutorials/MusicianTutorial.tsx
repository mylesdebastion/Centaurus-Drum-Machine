import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Play, Check } from 'lucide-react';
import { setOnboardingCompleted, trackPersonaEvent } from '@/utils/personaCodes';

/**
 * MusicianTutorial - Epic 22 Story 22.1
 *
 * 30-60 second tutorial for Musician persona (v=m)
 * Demonstrates: Drum Machine module in Studio
 */
export function MusicianTutorial() {
  const navigate = useNavigate();
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);

  const handleStart = () => {
    trackPersonaEvent('tutorial_started', 'm');
    setStep(1);
  };

  const handleNext = () => {
    if (step < 3) {
      setStep((step + 1) as 1 | 2 | 3);
    }
  };

  const handleComplete = () => {
    trackPersonaEvent('tutorial_completed', 'm');
    setOnboardingCompleted('m');
    navigate('/studio');
  };

  // Step 0: Welcome
  if (step === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center">
          <div className="mb-8">
            <Music className="w-20 h-20 text-blue-400 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-white mb-4">
              🎵 Welcome, Musician!
            </h1>
            <p className="text-xl text-gray-300 mb-2">
              Let's create your first beat in 30 seconds
            </p>
            <p className="text-sm text-gray-400">
              No download, no account - just open and play
            </p>
          </div>

          <button
            onClick={handleStart}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-lg transition-colors flex items-center justify-center gap-3 mx-auto text-lg"
          >
            <Play className="w-6 h-6" />
            Start Tutorial (30s)
          </button>

          <p className="text-gray-500 text-sm mt-6">
            You'll learn: Drum Machine → Create beats → Hit Play
          </p>
        </div>
      </div>
    );
  }

  // Step 1: Studio Overview
  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-gray-800/50 rounded-xl border border-blue-500/30 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                1
              </div>
              <h2 className="text-2xl font-bold text-white">The Music Studio</h2>
            </div>

            <p className="text-gray-300 mb-6 text-lg">
              Audiolux Studio is a <strong>modular workspace</strong> where you can create music using different instruments.
            </p>

            <div className="bg-gray-900/50 rounded-lg p-6 mb-6 border border-gray-700">
              <h3 className="text-white font-semibold mb-3">✨ What you'll see:</h3>
              <ul className="text-gray-300 space-y-2 text-sm">
                <li>• <strong>Module Bar</strong> - Switch between instruments (Drums, Piano, Guitar, etc.)</li>
                <li>• <strong>Music Controls</strong> - Play/pause, tempo, global settings</li>
                <li>• <strong>Interactive Grid</strong> - Click to create patterns</li>
              </ul>
            </div>

            <button
              onClick={handleNext}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Next: Drum Machine →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Drum Machine Demo
  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-gray-800/50 rounded-xl border border-blue-500/30 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                2
              </div>
              <h2 className="text-2xl font-bold text-white">Create Your First Beat</h2>
            </div>

            <p className="text-gray-300 mb-6 text-lg">
              The <strong>Drum Machine</strong> has 4 drum sounds and a 16-step grid.
            </p>

            <div className="bg-gray-900/50 rounded-lg p-6 mb-6 border border-gray-700">
              <h3 className="text-white font-semibold mb-3">🥁 How it works:</h3>
              <ol className="text-gray-300 space-y-3 text-sm">
                <li><strong>1.</strong> Click squares in the grid to add drum hits</li>
                <li><strong>2.</strong> Each row = different drum sound (Kick, Snare, Hi-Hat, Clap)</li>
                <li><strong>3.</strong> Press <span className="bg-green-600 px-2 py-1 rounded text-white text-xs">Play</span> to hear your beat loop</li>
              </ol>
            </div>

            <div className="bg-blue-900/30 rounded-lg p-4 mb-6 border border-blue-500/50">
              <p className="text-blue-200 text-sm">
                💡 <strong>Pro tip:</strong> Try clicking every 4th step on the Kick drum row for a classic house beat!
              </p>
            </div>

            <button
              onClick={handleNext}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Next: What's Next →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Completion + CTA
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <div className="w-20 h-20 rounded-full bg-green-600 flex items-center justify-center mx-auto mb-6">
            <Check className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            🎉 You're Ready to Create!
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            The Studio has 6+ music modules to explore
          </p>
        </div>

        <div className="bg-gray-800/50 rounded-xl border border-blue-500/30 p-6 mb-8 text-left max-w-md mx-auto">
          <h3 className="text-white font-semibold mb-3">🚀 Next Steps:</h3>
          <ul className="text-gray-300 space-y-2 text-sm">
            <li>• Try the <strong>Chord Arranger</strong> module for melodies</li>
            <li>• Explore <strong>Piano Roll</strong> for visual learning</li>
            <li>• Create a <strong>Jam Session</strong> to play with friends</li>
          </ul>
        </div>

        <button
          onClick={handleComplete}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-lg transition-colors flex items-center justify-center gap-3 mx-auto text-lg mb-4"
        >
          <Play className="w-6 h-6" />
          Launch Studio
        </button>

        <p className="text-gray-500 text-sm">
          All features are free. No account required.
        </p>
      </div>
    </div>
  );
}
