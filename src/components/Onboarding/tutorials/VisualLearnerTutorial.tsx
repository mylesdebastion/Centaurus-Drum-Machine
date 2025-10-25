import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Play, Check, Palette } from 'lucide-react';
import { setOnboardingCompleted, trackPersonaEvent } from '@/utils/personaCodes';

/**
 * VisualLearnerTutorial - Epic 22 Story 22.1
 *
 * 30-60 second tutorial for Visual Learner persona (v=v)
 * Demonstrates: Piano Roll with color modes
 */
export function VisualLearnerTutorial() {
  const navigate = useNavigate();
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);

  const handleStart = () => {
    trackPersonaEvent('tutorial_started', 'v');
    setStep(1);
  };

  const handleNext = () => {
    if (step < 3) {
      setStep((step + 1) as 1 | 2 | 3);
    }
  };

  const handleComplete = () => {
    trackPersonaEvent('tutorial_completed', 'v');
    setOnboardingCompleted('v');
    navigate('/piano');
  };

  // Step 0: Welcome
  if (step === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center">
          <div className="mb-8">
            <Eye className="w-20 h-20 text-purple-400 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-white mb-4">
              🎨 Welcome, Visual Learner!
            </h1>
            <p className="text-xl text-gray-300 mb-2">
              Learn music through patterns and colors
            </p>
            <p className="text-sm text-gray-400">
              See the relationships between notes visually
            </p>
          </div>

          <button
            onClick={handleStart}
            className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-8 py-4 rounded-lg transition-colors flex items-center justify-center gap-3 mx-auto text-lg"
          >
            <Play className="w-6 h-6" />
            Start Tutorial (30s)
          </button>

          <p className="text-gray-500 text-sm mt-6">
            You'll learn: Piano Roll → Color Modes → Pattern Recognition
          </p>
        </div>
      </div>
    );
  }

  // Step 1: Piano Roll Overview
  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-gray-800/50 rounded-xl border border-purple-500/30 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                1
              </div>
              <h2 className="text-2xl font-bold text-white">See Music as Patterns</h2>
            </div>

            <p className="text-gray-300 mb-6 text-lg">
              The <strong>Piano Roll</strong> shows all 88 piano keys in a visual grid. Music becomes shapes and patterns.
            </p>

            <div className="bg-gray-900/50 rounded-lg p-6 mb-6 border border-gray-700">
              <h3 className="text-white font-semibold mb-3">🎹 How it works:</h3>
              <ul className="text-gray-300 space-y-2 text-sm">
                <li>• <strong>Horizontal = Time</strong> - Left to right is the timeline</li>
                <li>• <strong>Vertical = Pitch</strong> - Higher notes are at the top</li>
                <li>• <strong>Click to play</strong> - Touch any key to hear the note</li>
                <li>• <strong>Visual patterns</strong> - Chords look like vertical stacks, melodies are horizontal lines</li>
              </ul>
            </div>

            <div className="bg-purple-900/30 rounded-lg p-4 mb-6 border border-purple-500/50">
              <p className="text-purple-200 text-sm">
                💡 <strong>Visual thinking:</strong> Once you see the patterns, you can recognize them in any song!
              </p>
            </div>

            <button
              onClick={handleNext}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Next: Color Modes →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Color Modes
  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-gray-800/50 rounded-xl border border-purple-500/30 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                2
              </div>
              <h2 className="text-2xl font-bold text-white">Learn with Color</h2>
            </div>

            <p className="text-gray-300 mb-6 text-lg">
              Different <strong>color modes</strong> help you understand music theory visually.
            </p>

            <div className="bg-gray-900/50 rounded-lg p-6 mb-6 border border-gray-700">
              <h3 className="text-white font-semibold mb-3">🎨 Color Modes:</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded bg-gradient-to-r from-red-500 via-yellow-500 to-purple-500 flex-shrink-0 mt-1"></div>
                  <div>
                    <strong className="text-white">Rainbow</strong>
                    <p className="text-gray-400">Each note gets its own color (great for beginners)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded bg-gradient-to-r from-blue-500 to-blue-300 flex-shrink-0 mt-1"></div>
                  <div>
                    <strong className="text-white">Scale Degrees</strong>
                    <p className="text-gray-400">Shows which notes are in the current scale (learn music theory!)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded bg-gradient-to-r from-purple-500 to-pink-500 flex-shrink-0 mt-1"></div>
                  <div>
                    <strong className="text-white">Chord Tones</strong>
                    <p className="text-gray-400">Highlights notes that fit the current chord</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-purple-900/30 rounded-lg p-4 mb-6 border border-purple-500/50">
              <p className="text-purple-200 text-sm">
                🌈 <strong>Try switching modes:</strong> Use the color selector in the Music Header to explore!
              </p>
            </div>

            <button
              onClick={handleNext}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Next: Start Exploring →
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
          <div className="w-20 h-20 rounded-full bg-purple-600 flex items-center justify-center mx-auto mb-6">
            <Check className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            🎉 You're Ready to Learn!
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            Start exploring music through visual patterns
          </p>
        </div>

        <div className="bg-gray-800/50 rounded-xl border border-purple-500/30 p-6 mb-8 text-left max-w-md mx-auto">
          <h3 className="text-white font-semibold mb-3">🚀 Next Steps:</h3>
          <ul className="text-gray-300 space-y-2 text-sm">
            <li>• Try the <strong>Piano Roll</strong> and click different keys</li>
            <li>• Switch between <strong>color modes</strong> to learn theory</li>
            <li>• Explore the <strong>Chord Arranger</strong> for visual harmony</li>
            <li>• Join a <strong>Jam Session</strong> to play with others</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
          <button
            onClick={handleComplete}
            className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-8 py-4 rounded-lg transition-colors flex items-center justify-center gap-3"
          >
            <Palette className="w-6 h-6" />
            Launch Piano Roll
          </button>
          <button
            onClick={() => {
              trackPersonaEvent('tutorial_completed', 'v');
              setOnboardingCompleted('v');
              navigate('/studio');
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-4 rounded-lg transition-colors flex items-center justify-center gap-3"
          >
            <Play className="w-6 h-6" />
            Open Studio
          </button>
        </div>

        <p className="text-gray-500 text-sm">
          All features are free. No account required.
        </p>
      </div>
    </div>
  );
}
