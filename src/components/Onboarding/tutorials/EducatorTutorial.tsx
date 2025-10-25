import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Play, Check, Users } from 'lucide-react';
import { setOnboardingCompleted, trackPersonaEvent } from '@/utils/personaCodes';

/**
 * EducatorTutorial - Epic 22 Story 22.1
 *
 * 30-60 second tutorial for Educator persona (v=e)
 * Demonstrates: Chord Arranger + Jam Session for teaching
 */
export function EducatorTutorial() {
  const navigate = useNavigate();
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);

  const handleStart = () => {
    trackPersonaEvent('tutorial_started', 'e');
    setStep(1);
  };

  const handleNext = () => {
    if (step < 3) {
      setStep((step + 1) as 1 | 2 | 3);
    }
  };

  const handleComplete = () => {
    trackPersonaEvent('tutorial_completed', 'e');
    setOnboardingCompleted('e');
    navigate('/studio');
  };

  // Step 0: Welcome
  if (step === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center">
          <div className="mb-8">
            <BookOpen className="w-20 h-20 text-green-400 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-white mb-4">
              📚 Welcome, Educator!
            </h1>
            <p className="text-xl text-gray-300 mb-2">
              Teach music visually with interactive tools
            </p>
            <p className="text-sm text-gray-400">
              No software installation - students can join from any device
            </p>
          </div>

          <button
            onClick={handleStart}
            className="bg-green-600 hover:bg-green-500 text-white font-semibold px-8 py-4 rounded-lg transition-colors flex items-center justify-center gap-3 mx-auto text-lg"
          >
            <Play className="w-6 h-6" />
            Start Tutorial (45s)
          </button>

          <p className="text-gray-500 text-sm mt-6">
            You'll learn: Chord Arranger → Jam Sessions → Invite Students
          </p>
        </div>
      </div>
    );
  }

  // Step 1: Chord Arranger for Teaching
  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-gray-800/50 rounded-xl border border-green-500/30 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
                1
              </div>
              <h2 className="text-2xl font-bold text-white">Visual Music Theory</h2>
            </div>

            <p className="text-gray-300 mb-6 text-lg">
              The <strong>Chord Arranger</strong> teaches harmony and progression in a visual, interactive way.
            </p>

            <div className="bg-gray-900/50 rounded-lg p-6 mb-6 border border-gray-700">
              <h3 className="text-white font-semibold mb-3">🎹 Perfect for teaching:</h3>
              <ul className="text-gray-300 space-y-2 text-sm">
                <li>• <strong>Chord Progressions</strong> - Common patterns (I-IV-V, I-V-vi-IV)</li>
                <li>• <strong>Melody Creation</strong> - Harmonic guidance grid shows safe notes</li>
                <li>• <strong>Visual Feedback</strong> - Color-coded notes, real-time playback</li>
                <li>• <strong>Accessibility</strong> - Students can SEE music, not just hear it</li>
              </ul>
            </div>

            <div className="bg-green-900/30 rounded-lg p-4 mb-6 border border-green-500/50">
              <p className="text-green-200 text-sm">
                💡 <strong>For Deaf/HOH students:</strong> Visual feedback means music is inclusive for everyone in your classroom!
              </p>
            </div>

            <button
              onClick={handleNext}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Next: Jam Sessions →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Jam Session for Collaboration
  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-gray-800/50 rounded-xl border border-green-500/30 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
                2
              </div>
              <h2 className="text-2xl font-bold text-white">Invite Your Students</h2>
            </div>

            <p className="text-gray-300 mb-6 text-lg">
              Create a <strong>Jam Session</strong> to collaborate in real-time with your class.
            </p>

            <div className="bg-gray-900/50 rounded-lg p-6 mb-6 border border-gray-700">
              <h3 className="text-white font-semibold mb-3">👥 How it works:</h3>
              <ol className="text-gray-300 space-y-3 text-sm">
                <li><strong>1.</strong> Click "Create a Room" to get a 6-character code</li>
                <li><strong>2.</strong> Students enter the code on their devices (no account needed!)</li>
                <li><strong>3.</strong> Everyone syncs to the same playback and controls</li>
                <li><strong>4.</strong> You can teach concepts live while students follow along</li>
              </ol>
            </div>

            <div className="bg-green-900/30 rounded-lg p-4 mb-6 border border-green-500/50">
              <p className="text-green-200 text-sm">
                🎓 <strong>Classroom tip:</strong> Share your screen while students follow on tablets/laptops. Everyone stays in sync!
              </p>
            </div>

            <button
              onClick={handleNext}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Next: Get Started →
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
            🎉 Ready to Teach!
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            Start a jam session or explore the Studio
          </p>
        </div>

        <div className="bg-gray-800/50 rounded-xl border border-green-500/30 p-6 mb-8 text-left max-w-md mx-auto">
          <h3 className="text-white font-semibold mb-3">🚀 Next Steps:</h3>
          <ul className="text-gray-300 space-y-2 text-sm">
            <li>• Try the <strong>Chord Arranger</strong> to teach progressions</li>
            <li>• Create a <strong>Jam Session</strong> for your next class</li>
            <li>• Share the session code with students (6 characters)</li>
            <li>• Explore <strong>Drum Machine</strong> and <strong>Piano Roll</strong> modules</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
          <button
            onClick={handleComplete}
            className="bg-green-600 hover:bg-green-500 text-white font-semibold px-8 py-4 rounded-lg transition-colors flex items-center justify-center gap-3"
          >
            <Play className="w-6 h-6" />
            Open Studio
          </button>
          <button
            onClick={() => {
              trackPersonaEvent('tutorial_completed', 'e');
              setOnboardingCompleted('e');
              navigate('/jam');
            }}
            className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-8 py-4 rounded-lg transition-colors flex items-center justify-center gap-3"
          >
            <Users className="w-6 h-6" />
            Create Jam Session
          </button>
        </div>

        <p className="text-gray-500 text-sm">
          All features are free. No account required.
        </p>
      </div>
    </div>
  );
}
