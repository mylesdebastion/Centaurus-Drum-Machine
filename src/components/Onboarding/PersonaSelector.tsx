import { useNavigate } from 'react-router-dom';
import { Music, BookOpen, Eye, Sliders } from 'lucide-react';
import { PersonaCode, getPersonaConfig } from '@/utils/personaCodes';

/**
 * PersonaSelector - Epic 22 Story 22.1
 *
 * Shows 4 persona cards for Week 1 launch:
 * - Musician (m)
 * - Educator (e)
 * - Visual Learner (v)
 * - Producer (p)
 */
export function PersonaSelector() {
  const navigate = useNavigate();

  const handlePersonaSelect = (code: PersonaCode) => {
    // Navigate to root with persona code (OnboardingRouter will show tutorial)
    navigate(`/?v=${code}`);
  };

  const personaCards: Array<{
    code: PersonaCode;
    icon: typeof Music;
    gradient: string;
    borderColor: string;
  }> = [
    {
      code: 'm',
      icon: Music,
      gradient: 'from-blue-900/50 to-indigo-900/50',
      borderColor: 'border-blue-500/30 hover:border-blue-400',
    },
    {
      code: 'e',
      icon: BookOpen,
      gradient: 'from-green-900/50 to-emerald-900/50',
      borderColor: 'border-green-500/30 hover:border-green-400',
    },
    {
      code: 'v',
      icon: Eye,
      gradient: 'from-purple-900/50 to-violet-900/50',
      borderColor: 'border-purple-500/30 hover:border-purple-400',
    },
    {
      code: 'p',
      icon: Sliders,
      gradient: 'from-orange-900/50 to-red-900/50',
      borderColor: 'border-orange-500/30 hover:border-orange-400',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
            Welcome to Audiolux
          </h1>
          <p className="text-xl text-gray-300 mb-2">
            Choose your path to get started
          </p>
          <p className="text-sm text-gray-400">
            We'll show you features tailored to your needs
          </p>
        </div>

        {/* Persona Cards */}
        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          {personaCards.map(({ code, icon: Icon, gradient, borderColor }) => {
            const persona = getPersonaConfig(code);
            return (
              <button
                key={code}
                onClick={() => handlePersonaSelect(code)}
                className={`group bg-gradient-to-br ${gradient} p-8 rounded-xl border-2 ${borderColor} transition-all transform hover:scale-105 shadow-lg text-left`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0">
                    <Icon className="w-12 h-12 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {persona.emoji} {persona.title}
                    </h3>
                    <p className="text-gray-300 text-sm mb-3">
                      {persona.subtitle}
                    </p>
                    <div className="text-xs text-gray-400">
                      <strong>You want to:</strong> {persona.messagingFocus}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-white/70 group-hover:text-white transition-colors">
                  → Start 30-second tutorial
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-gray-500 text-sm mb-4">
            Not sure? Just pick one - you can explore all features later!
          </p>
          <button
            onClick={() => navigate('/playground')}
            className="text-primary-400 hover:text-primary-300 text-sm transition-colors"
          >
            🧪 Skip to Developer Playground
          </button>
        </div>
      </div>
    </div>
  );
}
