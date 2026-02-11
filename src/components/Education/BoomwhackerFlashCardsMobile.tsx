import React, { useState, useEffect } from 'react';

interface Props {
  onBack: () => void;
}

export const BoomwhackerFlashCardsMobile: React.FC<Props> = ({ onBack }) => {
  const [currentCard, setCurrentCard] = useState(0);
  const totalCards = 7;

  // Touch navigation
  useEffect(() => {
    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = endX - startX;
      const diffY = Math.abs(endY - startY);

      // Swipe or tap
      if (diffY < 100) {
        if (diffX < -50) setCurrentCard(c => Math.min(c + 1, totalCards - 1));
        else if (diffX > 50) setCurrentCard(c => Math.max(c - 1, 0));
        else if (Math.abs(diffX) < 10) {
          const w = window.innerWidth;
          if (endX < w / 3) setCurrentCard(c => Math.max(c - 1, 0));
          else if (endX > w * 2 / 3) setCurrentCard(c => Math.min(c + 1, totalCards - 1));
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true});
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setCurrentCard(c => Math.max(c - 1, 0));
      if (e.key === 'ArrowRight') setCurrentCard(c => Math.min(c + 1, totalCards - 1));
      if (e.key === 'Escape') onBack();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onBack]);

  const cards = [
    // Card 0: Rules
    <div key={0} className="text-center space-y-5">
      <h1 className="text-4xl font-bold">🎯 THE 3 RULES</h1>
      <div className="space-y-4">
        <div className="bg-black/30 rounded-xl p-5">
          <div className="text-6xl mb-3">👀</div>
          <h2 className="text-2xl font-bold text-yellow-300 mb-2">EYES ON SCREEN</h2>
          <p className="text-xl">Your color glows = GO</p>
          <p className="text-xl">No glow = WAIT</p>
        </div>
        <div className="bg-black/30 rounded-xl p-5">
          <div className="text-6xl mb-3">👂</div>
          <h2 className="text-2xl font-bold text-yellow-300 mb-2">COUNT 1-2-3-4</h2>
          <p className="text-xl">Flashes = get ready</p>
        </div>
        <div className="bg-black/30 rounded-xl p-5">
          <div className="text-6xl mb-3">🛑</div>
          <h2 className="text-2xl font-bold text-yellow-300 mb-2">FREEZE ON STOP</h2>
          <p className="text-xl">Still between patterns</p>
        </div>
      </div>
    </div>,

    // Card 1: Step 1
    <div key={1} className="text-center space-y-4">
      <h1 className="text-4xl font-bold">📍 STEP 1</h1>
      <h2 className="text-3xl font-bold text-yellow-300">Keep the Beat</h2>
      <div className="bg-black/30 rounded-xl p-6">
        <p className="text-5xl mb-3">🔴</p>
        <p className="text-2xl font-bold">Everyone = RED (C)</p>
        <p className="text-xl mt-2">Hit on EVERY beat</p>
      </div>
      <div className="bg-black/30 rounded-xl p-5 text-left">
        <p className="text-xl mb-2"><strong>Watch for:</strong></p>
        <p className="text-lg">• Gentle flashes</p>
        <p className="text-lg">• Screen: 1, 2, 3, 4, START!</p>
        <p className="text-lg">• Red pixels</p>
      </div>
    </div>,

    // Card 2: Step 2
    <div key={2} className="text-center space-y-4">
      <h1 className="text-4xl font-bold">📍 STEP 2</h1>
      <h2 className="text-2xl font-bold text-yellow-300">Teams Take Turns</h2>
      <div className="bg-gradient-to-r from-red-500 to-yellow-500 text-black rounded-xl p-4 font-bold">
        🌅 SUNRISE<br/>Red • Orange • Yellow
      </div>
      <div className="bg-gradient-to-r from-green-400 to-blue-500 text-black rounded-xl p-4 font-bold">
        🌊 OCEAN<br/>Green • Blue
      </div>
      <div className="bg-black/30 rounded-xl p-5 text-xl">
        <p><strong>Pattern:</strong></p>
        <p>1. Sunrise GO</p>
        <p>2. <strong>WAIT</strong></p>
        <p>3. Ocean GO</p>
        <p>4. <strong>WAIT</strong></p>
        <p>REPEAT!</p>
      </div>
    </div>,

    // Card 3: Step 3
    <div key={3} className="text-center space-y-4">
      <h1 className="text-4xl font-bold">📍 STEP 3</h1>
      <h2 className="text-2xl font-bold text-yellow-300">Only YOUR Note</h2>
      <div className="bg-black/30 rounded-xl p-6">
        <p className="text-xl mb-3">Each person = ONE color</p>
        <p className="text-3xl font-bold text-yellow-300 my-4">⭐</p>
        <p className="text-xl">Your color glows = PLAY</p>
        <p className="text-xl">No glow = STAY QUIET</p>
        <p className="text-xl mt-4">Count beats even when silent</p>
      </div>
    </div>,

    // Card 4: Step 4
    <div key={4} className="text-center space-y-4">
      <h1 className="text-4xl font-bold">📍 STEP 4</h1>
      <h2 className="text-2xl font-bold text-yellow-300">Advanced Rhythm</h2>
      <p className="text-xl">(Twinkle Pattern)</p>
      <div className="bg-black/30 rounded-xl p-6 space-y-3">
        <p className="text-xl"><strong>New:</strong> Double notes + rests</p>
        <p className="text-lg">C-C, A-A (two in a row)</p>
        <p className="text-lg">Some beats = silent</p>
      </div>
      <div className="bg-black/30 rounded-xl p-5 text-lg text-left">
        <p className="mb-2"><strong>Remember:</strong></p>
        <p>• Watch screen, not friends</p>
        <p>• Your light = your turn</p>
        <p>• No light = count silently</p>
        <p>• 4 flashes = ready</p>
      </div>
    </div>,

    // Card 5: Troubleshooting
    <div key={5} className="text-center space-y-3">
      <h1 className="text-4xl font-bold">🚨 HELP</h1>
      <div className="space-y-3 text-left">
        <div className="bg-black/30 rounded-xl p-4">
          <p className="text-lg font-bold text-yellow-300">Can't focus?</p>
          <p className="text-lg">→ Cover boomwhacker with hand</p>
        </div>
        <div className="bg-black/30 rounded-xl p-4">
          <p className="text-lg font-bold text-yellow-300">Playing too early?</p>
          <p className="text-lg">→ Watch pixel reach END</p>
        </div>
        <div className="bg-black/30 rounded-xl p-4">
          <p className="text-lg font-bold text-yellow-300">Missing notes?</p>
          <p className="text-lg">→ Count "1, 2, 3, 4" in head</p>
        </div>
        <div className="bg-black/30 rounded-xl p-4">
          <p className="text-lg font-bold text-yellow-300">Distracted?</p>
          <p className="text-lg">→ Look ONLY at screen</p>
        </div>
      </div>
    </div>,

    // Card 6: Success
    <div key={6} className="text-center space-y-5">
      <h1 className="text-5xl font-bold">✅ SUCCESS!</h1>
      <h2 className="text-2xl text-yellow-300">You did great if you:</h2>
      <div className="space-y-3 text-xl">
        <div className="bg-white/10 rounded-xl p-4">☑️ Watched screen</div>
        <div className="bg-white/10 rounded-xl p-4">☑️ Played on YOUR turn</div>
        <div className="bg-white/10 rounded-xl p-4">☑️ Quiet on empty beats</div>
        <div className="bg-white/10 rounded-xl p-4">☑️ Stopped with music</div>
        <div className="bg-white/10 rounded-xl p-4">☑️ Kept steady beat</div>
      </div>
      <div className="bg-black/30 rounded-xl p-6 mt-6">
        <p className="text-2xl font-bold mb-2">🎉 Remember</p>
        <p className="text-xl">Music is a team sport!</p>
        <p className="text-lg mt-2">Listening = as important as playing</p>
      </div>
    </div>
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white flex flex-col relative">
      {/* Tap indicators */}
      <div className="absolute top-1/2 left-4 transform -translate-y-1/2 text-white/20 text-5xl pointer-events-none">
        {currentCard > 0 && '‹'}
      </div>
      <div className="absolute top-1/2 right-4 transform -translate-y-1/2 text-white/20 text-5xl pointer-events-none">
        {currentCard < totalCards - 1 && '›'}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 pb-20 overflow-y-auto">
        <div className="text-center text-lg mb-4 opacity-70">
          {currentCard + 1} / {totalCards}
        </div>
        <div className="bg-white/15 backdrop-blur rounded-2xl p-6 shadow-2xl border-2 border-white/20 max-w-2xl mx-auto">
          {cards[currentCard]}
        </div>
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 flex gap-2 p-3 bg-black/50 backdrop-blur border-t-2 border-white/20">
        <button
          onClick={() => setCurrentCard(c => Math.max(c - 1, 0))}
          disabled={currentCard === 0}
          className="flex-1 py-4 text-xl font-bold rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          ◀
        </button>
        <button
          onClick={onBack}
          className="px-6 py-4 text-xl font-bold rounded-xl bg-gray-600 hover:bg-gray-500 transition-all active:scale-95"
        >
          Exit
        </button>
        <button
          onClick={() => setCurrentCard(c => Math.min(c + 1, totalCards - 1))}
          disabled={currentCard === totalCards - 1}
          className="flex-1 py-4 text-xl font-bold rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          ▶
        </button>
      </div>
    </div>
  );
};
