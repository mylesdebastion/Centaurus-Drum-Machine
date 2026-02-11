import React, { useState } from 'react';

interface Props {
  onBack: () => void;
}

export const FlashCardsSimple: React.FC<Props> = ({ onBack }) => {
  const [card, setCard] = useState(0);

  const cards = [
    {
      title: "🎯 THE 3 RULES",
      content: (
        <div className="space-y-8">
          <div className="flex items-center gap-6">
            <span className="text-8xl">👀</span>
            <span className="text-5xl font-bold">Eyes on screen</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-8xl">🔢</span>
            <span className="text-5xl font-bold">Count 1-2-3-4-5-6-7-8</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-8xl">🛑</span>
            <span className="text-5xl font-bold">FREEZE on STOP</span>
          </div>
        </div>
      )
    },
    {
      title: "STEP 1: Keep the Beat",
      content: (
        <div className="space-y-12">
          <div className="flex items-center justify-center gap-8">
            <div className="w-32 h-32 rounded-3xl bg-red-600 shadow-2xl flex items-center justify-center">
              <span className="text-6xl font-black text-white">C</span>
            </div>
            <span className="text-6xl font-bold">Everyone has RED</span>
          </div>
          <div className="text-center space-y-6">
            <div className="text-8xl font-black text-red-500">HIT EVERY BEAT!</div>
            <div className="flex justify-center gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((beat) => (
                <div key={beat} className="w-20 h-20 rounded-xl bg-red-600 shadow-lg flex items-center justify-center">
                  <span className="text-3xl font-black text-white">{beat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      title: "STEP 2: Teams Take Turns",
      content: (
        <div className="space-y-12">
          {/* Team Sunrise */}
          <div className="bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <span className="text-8xl">🌅</span>
                <span className="text-6xl font-black text-white drop-shadow-lg">SUNRISE</span>
              </div>
              <div className="flex gap-4">
                <div className="w-24 h-24 rounded-2xl bg-red-600 border-4 border-white shadow-xl flex items-center justify-center">
                  <span className="text-4xl font-black text-white">C</span>
                </div>
                <div className="w-24 h-24 rounded-2xl bg-orange-500 border-4 border-white shadow-xl flex items-center justify-center">
                  <span className="text-4xl font-black text-white">D</span>
                </div>
                <div className="w-24 h-24 rounded-2xl bg-yellow-400 border-4 border-white shadow-xl flex items-center justify-center">
                  <span className="text-4xl font-black text-white">E</span>
                </div>
              </div>
            </div>
            <div className="mt-6 text-center">
              <div className="text-5xl font-black text-white drop-shadow-lg">Beats 1 & 5</div>
            </div>
          </div>

          {/* Team Ocean */}
          <div className="bg-gradient-to-r from-green-600 via-blue-500 to-purple-600 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <span className="text-8xl">🌊</span>
                <span className="text-6xl font-black text-white drop-shadow-lg">OCEAN</span>
              </div>
              <div className="flex gap-4">
                <div className="w-24 h-24 rounded-2xl bg-green-600 border-4 border-white shadow-xl flex items-center justify-center">
                  <span className="text-4xl font-black text-white">F</span>
                </div>
                <div className="w-24 h-24 rounded-2xl bg-blue-500 border-4 border-white shadow-xl flex items-center justify-center">
                  <span className="text-4xl font-black text-white">G</span>
                </div>
                <div className="w-24 h-24 rounded-2xl bg-purple-600 border-4 border-white shadow-xl flex items-center justify-center">
                  <span className="text-4xl font-black text-white">A</span>
                </div>
              </div>
            </div>
            <div className="mt-6 text-center">
              <div className="text-5xl font-black text-white drop-shadow-lg">Beats 3 & 7</div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "STEP 3: Only YOUR Note",
      content: (
        <div className="space-y-12">
          <div className="bg-gradient-to-r from-yellow-400 via-green-400 to-blue-400 rounded-3xl p-10 shadow-2xl">
            <div className="text-center space-y-6">
              <div className="text-7xl font-black text-gray-900">YOUR color GLOWS = PLAY</div>
              <div className="text-8xl">✨💥✨</div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-3xl p-10 shadow-2xl border-4 border-gray-600">
            <div className="text-center space-y-6">
              <div className="text-7xl font-black text-gray-400">No glow?</div>
              <div className="text-8xl">🤫</div>
              <div className="text-7xl font-black text-gray-400">COUNT SILENTLY</div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "STEP 4: Advanced Rhythm",
      content: (
        <div className="space-y-12">
          <div className="text-center">
            <div className="text-6xl font-black mb-8">⭐ Twinkle Pattern ⭐</div>
          </div>
          
          <div className="space-y-8">
            {/* C plays beats 1 & 2 (double) */}
            <div className="bg-red-600 rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="w-24 h-24 rounded-2xl bg-white shadow-xl flex items-center justify-center">
                  <span className="text-5xl font-black text-red-600">C</span>
                </div>
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-xl bg-white/90 shadow-lg flex items-center justify-center">
                    <span className="text-3xl font-black text-red-600">1</span>
                  </div>
                  <div className="w-20 h-20 rounded-xl bg-white/90 shadow-lg flex items-center justify-center">
                    <span className="text-3xl font-black text-red-600">2</span>
                  </div>
                </div>
                <div className="text-5xl font-black text-white">DOUBLE!</div>
              </div>
            </div>

            {/* G plays beats 4 & 8 */}
            <div className="bg-blue-600 rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="w-24 h-24 rounded-2xl bg-white shadow-xl flex items-center justify-center">
                  <span className="text-5xl font-black text-blue-600">G</span>
                </div>
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-xl bg-white/20 border-2 border-white/40 shadow-lg flex items-center justify-center">
                    <span className="text-3xl font-black text-white/40">3</span>
                  </div>
                  <div className="w-20 h-20 rounded-xl bg-white/90 shadow-lg flex items-center justify-center">
                    <span className="text-3xl font-black text-blue-600">4</span>
                  </div>
                  <div className="w-20 h-20 rounded-xl bg-white/20 border-2 border-white/40 shadow-lg flex items-center justify-center">
                    <span className="text-3xl font-black text-white/40">7</span>
                  </div>
                  <div className="w-20 h-20 rounded-xl bg-white/90 shadow-lg flex items-center justify-center">
                    <span className="text-3xl font-black text-blue-600">8</span>
                  </div>
                </div>
              </div>
            </div>

            {/* A plays beats 5 & 6 (double) */}
            <div className="bg-purple-600 rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="w-24 h-24 rounded-2xl bg-white shadow-xl flex items-center justify-center">
                  <span className="text-5xl font-black text-purple-600">A</span>
                </div>
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-xl bg-white/90 shadow-lg flex items-center justify-center">
                    <span className="text-3xl font-black text-purple-600">5</span>
                  </div>
                  <div className="w-20 h-20 rounded-xl bg-white/90 shadow-lg flex items-center justify-center">
                    <span className="text-3xl font-black text-purple-600">6</span>
                  </div>
                </div>
                <div className="text-5xl font-black text-white">DOUBLE!</div>
              </div>
            </div>

            {/* Empty beats reminder */}
            <div className="bg-gray-800 rounded-3xl p-6 shadow-2xl border-4 border-gray-600 text-center">
              <div className="text-5xl font-black text-gray-400">Beat 3 & 7 = ⬜ REST</div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "🚨 TROUBLESHOOTING",
      content: (
        <div className="space-y-10">
          <div className="bg-yellow-500/20 border-4 border-yellow-500 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center gap-6">
              <span className="text-7xl">😵</span>
              <div>
                <div className="text-4xl font-bold text-yellow-300 mb-2">Can't focus?</div>
                <div className="text-4xl font-bold text-white">Cover your boomwhacker</div>
              </div>
            </div>
          </div>

          <div className="bg-red-500/20 border-4 border-red-500 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center gap-6">
              <span className="text-7xl">⏰</span>
              <div>
                <div className="text-4xl font-bold text-red-300 mb-2">Playing too early?</div>
                <div className="text-4xl font-bold text-white">Watch pixel reach THE END</div>
              </div>
            </div>
          </div>

          <div className="bg-blue-500/20 border-4 border-blue-500 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center gap-6">
              <span className="text-7xl">🎯</span>
              <div>
                <div className="text-4xl font-bold text-blue-300 mb-2">Missing your note?</div>
                <div className="text-4xl font-bold text-white">COUNT in your head!</div>
              </div>
            </div>
          </div>

          <div className="bg-purple-500/20 border-4 border-purple-500 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center gap-6">
              <span className="text-7xl">🛑</span>
              <div>
                <div className="text-4xl font-bold text-purple-300 mb-2">See STOP?</div>
                <div className="text-4xl font-bold text-white">FREEZE immediately!</div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "✅ YOU DID IT!",
      content: (
        <div className="space-y-10">
          <div className="text-center">
            <div className="text-9xl mb-6">🎉🎊🎉</div>
            <div className="text-7xl font-black bg-gradient-to-r from-yellow-400 via-green-400 to-blue-400 text-transparent bg-clip-text">
              SUCCESS!
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-6 bg-green-500/30 border-4 border-green-500 rounded-2xl p-6 shadow-xl">
              <div className="text-6xl">✅</div>
              <div className="text-5xl font-bold text-white">Watched the screen</div>
            </div>

            <div className="flex items-center gap-6 bg-green-500/30 border-4 border-green-500 rounded-2xl p-6 shadow-xl">
              <div className="text-6xl">✅</div>
              <div className="text-5xl font-bold text-white">Played YOUR turn</div>
            </div>

            <div className="flex items-center gap-6 bg-green-500/30 border-4 border-green-500 rounded-2xl p-6 shadow-xl">
              <div className="text-6xl">✅</div>
              <div className="text-5xl font-bold text-white">Quiet on empty beats</div>
            </div>
          </div>

          <div className="text-center mt-8">
            <div className="text-6xl font-black text-yellow-400">
              ⭐ MUSIC MASTER! ⭐
            </div>
          </div>
        </div>
      )
    }
  ];

  const handlePrevious = () => {
    setCard(c => Math.max(c - 1, 0));
  };

  const handleNext = () => {
    setCard(c => Math.min(c + 1, cards.length - 1));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'Escape') onBack();
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-4 sm:p-8"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="max-w-7xl mx-auto h-screen flex flex-col">
        {/* Card Counter */}
        <div className="text-center mb-4">
          <div className="inline-block bg-white/20 rounded-full px-8 py-3 backdrop-blur-sm">
            <span className="text-3xl font-bold">
              Card {card + 1} / {cards.length}
            </span>
          </div>
        </div>
        
        {/* Card Content */}
        <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-3xl p-8 sm:p-12 shadow-2xl mb-6 overflow-y-auto">
          <h1 className="text-6xl sm:text-7xl font-black mb-12 text-center bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 text-transparent bg-clip-text">
            {cards[card].title}
          </h1>
          <div className="text-3xl">
            {cards[card].content}
          </div>
        </div>

        {/* Navigation */}
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={handlePrevious}
            disabled={card === 0}
            className="py-6 text-3xl font-bold rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 shadow-xl"
            style={{ minHeight: '80px' }}
          >
            ◀ Previous
          </button>
          <button
            onClick={onBack}
            className="py-6 text-3xl font-bold rounded-2xl bg-gray-700 hover:bg-gray-600 transition-all active:scale-95 shadow-xl"
            style={{ minHeight: '80px' }}
          >
            Exit
          </button>
          <button
            onClick={handleNext}
            disabled={card === cards.length - 1}
            className="py-6 text-3xl font-bold rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 shadow-xl"
            style={{ minHeight: '80px' }}
          >
            Next ▶
          </button>
        </div>
      </div>
    </div>
  );
};
