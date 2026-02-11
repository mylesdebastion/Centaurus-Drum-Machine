import React, { useState } from 'react';

interface Props {
  onBack: () => void;
}

export const FlashCardsSimple: React.FC<Props> = ({ onBack }) => {
  const [card, setCard] = useState(0);

  const cards = [
    { title: "🎯 THE 3 RULES", content: "1. Eyes on screen\n2. Count 1-2-3-4\n3. Freeze on stop" },
    { title: "📍 STEP 1", content: "Keep the Beat\nEveryone = RED (C)\nHit on EVERY beat" },
    { title: "📍 STEP 2", content: "Teams Take Turns\n🌅 Sunrise: Red/Orange/Yellow\n🌊 Ocean: Green/Blue" },
    { title: "📍 STEP 3", content: "Only YOUR Note\nYour color glows = PLAY\nNo glow = STAY QUIET" },
    { title: "📍 STEP 4", content: "Advanced Rhythm\n(Twinkle Pattern)\nDouble notes + rests" },
    { title: "🚨 HELP", content: "Can't focus? Cover boomwhacker\nPlaying too early? Watch pixel reach END\nMissing notes? Count in head" },
    { title: "✅ SUCCESS!", content: "You did great if you:\n☑️ Watched screen\n☑️ Played on YOUR turn\n☑️ Quiet on empty beats" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-4 opacity-70">
          Card {card + 1} / {cards.length}
        </div>
        
        <div className="bg-white/20 rounded-2xl p-8 shadow-2xl mb-6">
          <h1 className="text-4xl font-bold mb-6 text-center">{cards[card].title}</h1>
          <div className="text-2xl whitespace-pre-line text-center">{cards[card].content}</div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => setCard(c => Math.max(c - 1, 0))}
            disabled={card === 0}
            className="flex-1 py-4 text-xl font-bold rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-30 transition-all"
          >
            ◀ Previous
          </button>
          <button
            onClick={onBack}
            className="px-8 py-4 text-xl font-bold rounded-xl bg-gray-600 hover:bg-gray-500 transition-all"
          >
            Exit
          </button>
          <button
            onClick={() => setCard(c => Math.min(c + 1, cards.length - 1))}
            disabled={card === cards.length - 1}
            className="flex-1 py-4 text-xl font-bold rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-30 transition-all"
          >
            Next ▶
          </button>
        </div>
      </div>
    </div>
  );
};
