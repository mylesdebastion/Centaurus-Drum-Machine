import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sliders, Play, Check, Grid3x3 } from 'lucide-react';
import { setOnboardingCompleted, trackPersonaEvent } from '@/utils/personaCodes';

/**
 * ProducerTutorial - Epic 22 Story 22.1
 *
 * 30-60 second tutorial for Producer/Beatmaker persona (v=p)
 * Demonstrates: Studio modular system
 */
export function ProducerTutorial() {
  const navigate = useNavigate();
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);

  const handleStart = () => {
    trackPersonaEvent('tutorial_started', 'p');
    setStep(1);
  };

  const handleNext = () => {
    if (step < 3) {
      setStep((step + 1) as 1 | 2 | 3);
    }
  };

  const handleComplete = () => {
    trackPersonaEvent('tutorial_completed', 'p');
    setOnboardingCompleted('p');
    navigate('/studio');
  };

  // Step 0: Welcome
  if (step === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center">
          <div className="mb-8">
            <Sliders className="w-20 h-20 text-orange-400 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-white mb-4">
              🎛️ Welcome, Producer!
            </h1>
            <p className="text-xl text-gray-300 mb-2">
              Professional browser DAW - work anywhere
            </p>
            <p className="text-sm text-gray-400">
              No installation, MIDI support, portable production
            </p>
          </div>

          <button
            onClick={handleStart}
            className="bg-orange-600 hover:bg-orange-500 text-white font-semibold px-8 py-4 rounded-lg transition-colors flex items-center justify-center gap-3 mx-auto text-lg"
          >
            <Play className="w-6 h-6" />
            Start Tutorial (45s)
          </button>

          <p className="text-gray-500 text-sm mt-6">
            You'll learn: Modular System → MIDI Integration → Workflow
          </p>
        </div>
      </div>
    );
  }

  // Step 1: Modular Studio System
  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-gray-800/50 rounded-xl border border-orange-500/30 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold">
                1
              </div>
              <h2 className="text-2xl font-bold text-white">Modular Workflow</h2>
            </div>

            <p className="text-gray-300 mb-6 text-lg">
              Audiolux Studio is a <strong>modular browser DAW</strong> with 6+ production modules.
            </p>

            <div className="bg-gray-900/50 rounded-lg p-6 mb-6 border border-gray-700">
              <h3 className="text-white font-semibold mb-3">🎛️ Available Modules:</h3>
              <ul className="text-gray-300 space-y-2 text-sm">
                <li>• <strong>Drum Machine</strong> - 16-step sequencer with sample pads</li>
                <li>• <strong>Melody Sequencer</strong> - Piano roll for melodic patterns</li>
                <li>• <strong>Chord Arranger</strong> - Visual chord progression tool</li>
                <li>• <strong>Piano Roll</strong> - 88-key interface with MIDI input</li>
                <li>• <strong>Sample Pad</strong> - Trigger custom samples on grid</li>
                <li>• <strong>Instrument Rack</strong> - Layer multiple sounds (coming soon)</li>
              </ul>
            </div>

            <div className="bg-orange-900/30 rounded-lg p-4 mb-6 border border-orange-500/50">
              <p className="text-orange-200 text-sm">
                💡 <strong>Producer tip:</strong> Switch between modules using the top bar. Your work persists across modules!
              </p>
            </div>

            <button
              onClick={handleNext}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Next: MIDI Integration →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: MIDI + Hardware Integration
  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-gray-800/50 rounded-xl border border-orange-500/30 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold">
                2
              </div>
              <h2 className="text-2xl font-bold text-white">MIDI Support</h2>
            </div>

            <p className="text-gray-300 mb-6 text-lg">
              Connect your <strong>MIDI controllers</strong> directly to the browser - no drivers needed.
            </p>

            <div className="bg-gray-900/50 rounded-lg p-6 mb-6 border border-gray-700">
              <h3 className="text-white font-semibold mb-3">🎹 Supported Hardware:</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <strong className="text-white">MIDI Keyboards</strong>
                  <p className="text-gray-400">Play notes directly into Piano Roll or Melody Sequencer</p>
                </div>
                <div>
                  <strong className="text-white">Pad Controllers</strong>
                  <p className="text-gray-400">Trigger drum samples in real-time (Launchpad, APC40)</p>
                </div>
                <div>
                  <strong className="text-white">LUMI Keys</strong>
                  <p className="text-gray-400">LED feedback shows which notes to play (visual learning)</p>
                </div>
              </div>
            </div>

            <div className="bg-orange-900/30 rounded-lg p-4 mb-6 border border-orange-500/50">
              <p className="text-orange-200 text-sm">
                🔌 <strong>Web MIDI API:</strong> Just plug in your controller and grant browser permissions. It works!
              </p>
            </div>

            <button
              onClick={handleNext}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Next: Start Producing →
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
          <div className="w-20 h-20 rounded-full bg-orange-600 flex items-center justify-center mx-auto mb-6">
            <Check className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            🎉 Ready to Produce!
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            Start creating beats in your browser DAW
          </p>
        </div>

        <div className="bg-gray-800/50 rounded-xl border border-orange-500/30 p-6 mb-8 text-left max-w-md mx-auto">
          <h3 className="text-white font-semibold mb-3">🚀 Production Workflow:</h3>
          <ol className="text-gray-300 space-y-2 text-sm">
            <li><strong>1.</strong> Start with <strong>Drum Machine</strong> to lay down a beat</li>
            <li><strong>2.</strong> Add chords using <strong>Chord Arranger</strong></li>
            <li><strong>3.</strong> Layer melody with <strong>Melody Sequencer</strong></li>
            <li><strong>4.</strong> Refine with <strong>Piano Roll</strong> (MIDI input)</li>
            <li><strong>5.</strong> Adjust global tempo/key in Music Header</li>
          </ol>
        </div>

        <div className="bg-orange-900/30 rounded-lg p-4 mb-6 max-w-md mx-auto border border-orange-500/50">
          <p className="text-orange-200 text-sm">
            💼 <strong>Portable workflow:</strong> Work on your laptop, finish on your tablet. Everything syncs in the browser!
          </p>
        </div>

        <button
          onClick={handleComplete}
          className="bg-orange-600 hover:bg-orange-500 text-white font-semibold px-8 py-4 rounded-lg transition-colors flex items-center justify-center gap-3 mx-auto text-lg mb-4"
        >
          <Grid3x3 className="w-6 h-6" />
          Launch Studio
        </button>

        <p className="text-gray-500 text-sm">
          Free tier available. Upgrade to Pro for more features.
        </p>
      </div>
    </div>
  );
}
