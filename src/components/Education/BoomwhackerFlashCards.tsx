import React, { useState, useEffect } from 'react';

interface BoomwhackerFlashCardsProps {
  onBack: () => void;
}

export const BoomwhackerFlashCards: React.FC<BoomwhackerFlashCardsProps> = ({ onBack }) => {
  const [currentCard, setCurrentCard] = useState(0);
  const totalCards = 7;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextCard();
      if (e.key === 'ArrowLeft') previousCard();
      if (e.key === 'Escape') onBack();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentCard]);

  // Touch swipe navigation
  useEffect(() => {
    let touchStartX = 0;
    let touchEndX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    };

    const handleSwipe = () => {
      if (touchEndX < touchStartX - 50) {
        nextCard(); // Swipe left = next
      }
      if (touchEndX > touchStartX + 50) {
        previousCard(); // Swipe right = previous
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentCard]);

  const nextCard = () => {
    if (currentCard < totalCards - 1) {
      setCurrentCard(currentCard + 1);
      window.scrollTo(0, 0);
    }
  };

  const previousCard = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1);
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white flex flex-col">
      {/* Main Content */}
      <div className="flex-1 p-5 pb-24 overflow-y-auto">
        {/* Card Counter */}
        <div className="text-center text-lg mb-3 opacity-80">
          Card {currentCard + 1} of {totalCards}
        </div>

        {/* Card 0: Pre-Lesson */}
        {currentCard === 0 && (
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-8 shadow-2xl border-2 border-white/20 animate-fadeIn">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-center drop-shadow-lg">
              🎯 BEFORE YOU START
            </h1>
            <h2 className="text-3xl font-bold mb-6 border-b-2 border-white/30 pb-3">
              The 3 Rules of Boomwhacker Success
            </h2>
            
            <div className="space-y-6">
              <div className="bg-black/30 rounded-lg p-5">
                <h3 className="text-2xl font-bold text-yellow-400 mb-3">1. 👀 EYES ON THE SCREEN</h3>
                <ul className="space-y-2 text-xl ml-4">
                  <li>• Your color will light up when it's YOUR turn</li>
                  <li>• If your color isn't glowing = WAIT</li>
                </ul>
              </div>
              
              <div className="bg-black/30 rounded-lg p-5">
                <h3 className="text-2xl font-bold text-yellow-400 mb-3">2. 👂 LISTEN FOR THE COUNT</h3>
                <ul className="space-y-2 text-xl ml-4">
                  <li>• Count in your head: 1, 2, 3, 4...</li>
                  <li>• Gentle flashes = get ready!</li>
                </ul>
              </div>
              
              <div className="bg-black/30 rounded-lg p-5">
                <h3 className="text-2xl font-bold text-yellow-400 mb-3">3. 🛑 FREEZE WHEN MUSIC STOPS</h3>
                <ul className="space-y-2 text-xl ml-4">
                  <li>• Boomwhacker stays still</li>
                  <li>• No playing between patterns</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Card 1: Step 1 */}
        {currentCard === 1 && (
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-8 shadow-2xl border-2 border-white/20 animate-fadeIn">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-center drop-shadow-lg">
              📍 STEP 1
            </h1>
            <h2 className="text-3xl font-bold mb-6 border-b-2 border-white/30 pb-3">
              Keep the Steady Beat
            </h2>
            
            <div className="bg-black/30 rounded-lg p-6 mb-6">
              <h3 className="text-2xl font-bold text-yellow-400 mb-4">Your Job</h3>
              <p className="text-2xl mb-3">🔴 <strong>Everyone has RED (C)</strong></p>
              <p className="text-2xl"><strong>Hit your boomwhacker on EVERY beat</strong></p>
            </div>
            
            <h3 className="text-2xl font-bold text-yellow-400 mb-3">Watch For</h3>
            <ul className="space-y-3 text-xl ml-4 mb-6">
              <li>• Gentle flashes = count-in starting</li>
              <li>• Screen shows: 1, 2, 3, 4, START!</li>
              <li>• Red pixels moving toward you</li>
            </ul>
            
            <h3 className="text-2xl font-bold text-yellow-400 mb-3">Remember</h3>
            <ul className="space-y-3 text-xl ml-4">
              <li>✅ Hit when red pixel reaches the end</li>
              <li>❌ Don't play between rounds</li>
              <li>🛑 Freeze when music stops</li>
            </ul>
          </div>
        )}

        {/* Card 2: Step 2 */}
        {currentCard === 2 && (
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-8 shadow-2xl border-2 border-white/20 animate-fadeIn">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-center drop-shadow-lg">
              📍 STEP 2
            </h1>
            <h2 className="text-3xl font-bold mb-6 border-b-2 border-white/30 pb-3">
              Team Sunrise vs Team Ocean
            </h2>
            
            <div className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-black rounded-lg p-5 mb-4 font-bold text-xl">
              🌅 TEAM SUNRISE (Warm Colors)<br/>
              Red (C) • Orange (D) • Yellow (E)
            </div>
            
            <div className="bg-gradient-to-r from-yellow-400 via-green-500 to-blue-500 text-black rounded-lg p-5 mb-6 font-bold text-xl">
              🌊 TEAM OCEAN (Cool Colors)<br/>
              Yellow-Green (F) • Green (G) • Blue (A)
            </div>
            
            <div className="bg-black/30 rounded-lg p-6 mb-6">
              <h3 className="text-2xl font-bold text-yellow-400 mb-4">The Pattern</h3>
              <ol className="space-y-2 text-xl ml-6 list-decimal">
                <li>Sunrise plays together (beat 1)</li>
                <li><strong>WAIT</strong> (beat 2)</li>
                <li>Ocean plays together (beat 3)</li>
                <li><strong>WAIT</strong> (beat 4)</li>
                <li>REPEAT!</li>
              </ol>
            </div>
            
            <h3 className="text-2xl font-bold text-yellow-400 mb-3">Remember</h3>
            <ul className="space-y-3 text-xl ml-4">
              <li>• Call and response = taking turns</li>
              <li>• If it's not your team = boomwhacker stays QUIET</li>
              <li>• Watch the screen to know whose turn!</li>
            </ul>
          </div>
        )}

        {/* Card 3: Step 3 */}
        {currentCard === 3 && (
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-8 shadow-2xl border-2 border-white/20 animate-fadeIn">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-center drop-shadow-lg">
              📍 STEP 3
            </h1>
            <h2 className="text-3xl font-bold mb-6 border-b-2 border-white/30 pb-3">
              Play Only YOUR Note
            </h2>
            
            <div className="bg-black/30 rounded-lg p-6 mb-6">
              <h3 className="text-2xl font-bold text-yellow-400 mb-4">Your Color, Your Turn</h3>
              <p className="text-xl mb-2">Each person has <strong>ONE</strong> color</p>
              <p className="text-xl">Only play when <strong>YOUR</strong> color lights up</p>
            </div>
            
            <h3 className="text-2xl font-bold text-yellow-400 mb-3">The Challenge</h3>
            <p className="text-2xl mb-4">⭐ <strong>Empty beats matter!</strong></p>
            <ul className="space-y-3 text-xl ml-4 mb-6">
              <li>• Some beats = your color glows → PLAY</li>
              <li>• Some beats = NO glow → STAY QUIET</li>
              <li>• Count the beats even when you don't play</li>
            </ul>
            
            <h3 className="text-2xl font-bold text-yellow-400 mb-3">Watch For</h3>
            <ul className="space-y-3 text-xl ml-4">
              <li>• Your specific color on screen</li>
              <li>• Timeline showing when each note happens</li>
              <li>• Playhead (moving line) showing "now"</li>
            </ul>
          </div>
        )}

        {/* Card 4: Step 4 */}
        {currentCard === 4 && (
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-8 shadow-2xl border-2 border-white/20 animate-fadeIn">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-center drop-shadow-lg">
              📍 STEP 4
            </h1>
            <h2 className="text-3xl font-bold mb-6 border-b-2 border-white/30 pb-3">
              Advanced Rhythm
            </h2>
            <h3 className="text-2xl text-center mb-6">(Twinkle Pattern)</h3>
            
            <div className="bg-black/30 rounded-lg p-6 mb-6">
              <h3 className="text-2xl font-bold text-yellow-400 mb-4">What's New</h3>
              <p className="text-2xl mb-3"><strong>Double notes</strong> + <strong>Rests</strong></p>
              <p className="text-xl mb-2">Some colors play TWICE in a row</p>
              <p className="text-xl">Some beats are SILENT for everyone</p>
            </div>
            
            <h3 className="text-2xl font-bold text-yellow-400 mb-3">Extra Challenges</h3>
            <ul className="space-y-3 text-xl ml-4 mb-6">
              <li>• <strong>Double hits:</strong> C-C, A-A (two notes in a row)</li>
              <li>• <strong>Staying together:</strong> Match the tempo</li>
              <li>• <strong>Not rushing:</strong> Keep the steady beat</li>
              <li>• <strong>Stopping cleanly:</strong> Freeze when music stops</li>
            </ul>
            
            <h3 className="text-2xl font-bold text-yellow-400 mb-3">Remember</h3>
            <ul className="space-y-3 text-xl ml-4">
              <li>• Watch the screen, not your friends</li>
              <li>• Your light = your turn</li>
              <li>• No light = count silently</li>
              <li>• 4 flashes = get ready to start</li>
            </ul>
          </div>
        )}

        {/* Card 5: Troubleshooting */}
        {currentCard === 5 && (
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-8 shadow-2xl border-2 border-white/20 animate-fadeIn">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-center drop-shadow-lg">
              🚨 TROUBLESHOOTING
            </h1>
            <h2 className="text-3xl font-bold mb-6 border-b-2 border-white/30 pb-3">
              If you're struggling:
            </h2>
            
            <div className="space-y-4">
              <div className="bg-black/30 rounded-lg p-5">
                <h3 className="text-2xl font-bold text-yellow-400 mb-2">Can't focus?</h3>
                <p className="text-xl">→ Cover your boomwhacker with one hand between rounds</p>
              </div>
              
              <div className="bg-black/30 rounded-lg p-5">
                <h3 className="text-2xl font-bold text-yellow-400 mb-2">Playing too early?</h3>
                <p className="text-xl">→ Watch the pixel reach the END before you hit</p>
              </div>
              
              <div className="bg-black/30 rounded-lg p-5">
                <h3 className="text-2xl font-bold text-yellow-400 mb-2">Missing your note?</h3>
                <p className="text-xl">→ Count "1, 2, 3, 4" in your head to stay on track</p>
              </div>
              
              <div className="bg-black/30 rounded-lg p-5">
                <h3 className="text-2xl font-bold text-yellow-400 mb-2">Getting distracted?</h3>
                <p className="text-xl">→ Look ONLY at the screen, not at other students</p>
              </div>
              
              <div className="bg-black/30 rounded-lg p-5">
                <h3 className="text-2xl font-bold text-yellow-400 mb-2">Forgot the pattern?</h3>
                <p className="text-xl">→ The screen shows you! Your color glows when it's your turn</p>
              </div>
            </div>
          </div>
        )}

        {/* Card 6: Success Checklist */}
        {currentCard === 6 && (
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-8 shadow-2xl border-2 border-white/20 animate-fadeIn">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-center drop-shadow-lg">
              ✅ SUCCESS!
            </h1>
            <h2 className="text-3xl font-bold mb-6 border-b-2 border-white/30 pb-3">
              You did great if you:
            </h2>
            
            <div className="space-y-4 mb-8">
              <div className="bg-white/10 rounded-lg p-4 text-2xl">☑️ Watched the screen the whole time</div>
              <div className="bg-white/10 rounded-lg p-4 text-2xl">☑️ Only played when YOUR color lit up</div>
              <div className="bg-white/10 rounded-lg p-4 text-2xl">☑️ Stayed quiet during empty beats</div>
              <div className="bg-white/10 rounded-lg p-4 text-2xl">☑️ Stopped when the music stopped</div>
              <div className="bg-white/10 rounded-lg p-4 text-2xl">☑️ Kept the steady beat (didn't rush!)</div>
            </div>
            
            <div className="bg-black/30 rounded-lg p-6 text-center">
              <h2 className="text-3xl font-bold mb-4">🎉 Remember</h2>
              <p className="text-2xl mb-3">Music is a team sport!</p>
              <p className="text-xl">Listening and waiting are just as important as playing!</p>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 flex gap-3 p-4 bg-black/50 backdrop-blur-md border-t-2 border-white/20">
        <button
          onClick={previousCard}
          disabled={currentCard === 0}
          className="flex-1 px-6 py-4 text-xl font-bold rounded-2xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 shadow-lg"
        >
          ◀ Previous
        </button>
        <button
          onClick={onBack}
          className="px-6 py-4 text-xl font-bold rounded-2xl bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-700 hover:to-gray-600 transition-all transform active:scale-95 shadow-lg"
        >
          Exit
        </button>
        <button
          onClick={nextCard}
          disabled={currentCard === totalCards - 1}
          className="flex-1 px-6 py-4 text-xl font-bold rounded-2xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 shadow-lg"
        >
          Next ▶
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in;
        }
      `}</style>
    </div>
  );
};