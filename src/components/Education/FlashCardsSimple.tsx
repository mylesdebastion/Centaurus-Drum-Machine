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
        <div className="flex flex-col justify-evenly h-full gap-[clamp(0.5rem,2vh,1.5rem)]">
          <div className="flex items-center gap-[clamp(0.75rem,3vw,2rem)]">
            <span style={{ fontSize: 'clamp(2rem, 8vw, 4rem)' }}>👀</span>
            <span style={{ fontSize: 'clamp(1.25rem, 5vw, 2.5rem)' }} className="font-bold leading-tight">
              Eyes on screen
            </span>
          </div>
          <div className="flex items-center gap-[clamp(0.75rem,3vw,2rem)]">
            <span style={{ fontSize: 'clamp(2rem, 8vw, 4rem)' }}>🔢</span>
            <span style={{ fontSize: 'clamp(1.25rem, 5vw, 2.5rem)' }} className="font-bold leading-tight">
              Count 1-2-3-4
            </span>
          </div>
          <div className="flex items-center gap-[clamp(0.75rem,3vw,2rem)]">
            <span style={{ fontSize: 'clamp(2rem, 8vw, 4rem)' }}>🛑</span>
            <span style={{ fontSize: 'clamp(1.25rem, 5vw, 2.5rem)' }} className="font-bold leading-tight">
              FREEZE on STOP
            </span>
          </div>
        </div>
      )
    },
    {
      title: "STEP 1: Keep the Beat",
      content: (
        <div className="flex flex-col justify-evenly h-full gap-[clamp(1rem,3vh,2rem)]">
          <div className="flex items-center justify-center gap-[clamp(1rem,4vw,2rem)]">
            <div 
              className="rounded-2xl bg-red-600 shadow-2xl flex items-center justify-center"
              style={{ 
                width: 'clamp(3rem, 12vw, 6rem)',
                height: 'clamp(3rem, 12vw, 6rem)'
              }}
            >
              <span style={{ fontSize: 'clamp(1.5rem, 6vw, 3rem)' }} className="font-black text-white">C</span>
            </div>
            <span style={{ fontSize: 'clamp(1.25rem, 5vw, 2.5rem)' }} className="font-bold leading-tight">
              Everyone has RED
            </span>
          </div>
          <div className="text-center space-y-[clamp(0.5rem,2vh,1rem)]">
            <div 
              style={{ fontSize: 'clamp(1.5rem, 6vw, 3.5rem)' }}
              className="font-black text-red-500 leading-tight"
            >
              HIT EVERY BEAT!
            </div>
            <div className="flex justify-center gap-[clamp(0.25rem,1vw,0.5rem)] flex-wrap">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((beat) => (
                <div 
                  key={beat}
                  className="rounded-lg bg-red-600 shadow-lg flex items-center justify-center"
                  style={{
                    width: 'clamp(2rem, 8vw, 3.5rem)',
                    height: 'clamp(2rem, 8vw, 3.5rem)'
                  }}
                >
                  <span 
                    style={{ fontSize: 'clamp(0.875rem, 3.5vw, 1.5rem)' }}
                    className="font-black text-white"
                  >
                    {beat}
                  </span>
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
        <div className="flex flex-col justify-evenly h-full gap-[clamp(0.75rem,2vh,1.5rem)]">
          {/* Team Sunrise */}
          <div className="bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 rounded-2xl p-[clamp(0.75rem,2vw,1.5rem)] shadow-2xl">
            <div className="flex items-center justify-between gap-[clamp(0.5rem,2vw,1rem)]">
              <div className="flex items-center gap-[clamp(0.5rem,2vw,1rem)]">
                <span style={{ fontSize: 'clamp(1.5rem, 6vw, 3rem)' }}>🌅</span>
                <span 
                  style={{ fontSize: 'clamp(1.25rem, 4.5vw, 2.25rem)' }}
                  className="font-black text-white drop-shadow-lg leading-tight"
                >
                  SUNRISE
                </span>
              </div>
              <div className="flex gap-[clamp(0.25rem,1vw,0.5rem)]">
                {[{ note: 'C', bg: 'bg-red-600' }, { note: 'D', bg: 'bg-orange-500' }, { note: 'E', bg: 'bg-yellow-400' }].map(({ note, bg }) => (
                  <div 
                    key={note}
                    className={`rounded-xl ${bg} border-2 border-white shadow-xl flex items-center justify-center`}
                    style={{
                      width: 'clamp(2rem, 8vw, 3.5rem)',
                      height: 'clamp(2rem, 8vw, 3.5rem)'
                    }}
                  >
                    <span 
                      style={{ fontSize: 'clamp(0.875rem, 3.5vw, 1.5rem)' }}
                      className="font-black text-white"
                    >
                      {note}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-[clamp(0.25rem,1vh,0.5rem)] text-center">
              <div 
                style={{ fontSize: 'clamp(1rem, 3.5vw, 1.75rem)' }}
                className="font-black text-white drop-shadow-lg"
              >
                Beats 1 & 5
              </div>
            </div>
          </div>

          {/* Team Ocean */}
          <div className="bg-gradient-to-r from-green-600 via-blue-500 to-purple-600 rounded-2xl p-[clamp(0.75rem,2vw,1.5rem)] shadow-2xl">
            <div className="flex items-center justify-between gap-[clamp(0.5rem,2vw,1rem)]">
              <div className="flex items-center gap-[clamp(0.5rem,2vw,1rem)]">
                <span style={{ fontSize: 'clamp(1.5rem, 6vw, 3rem)' }}>🌊</span>
                <span 
                  style={{ fontSize: 'clamp(1.25rem, 4.5vw, 2.25rem)' }}
                  className="font-black text-white drop-shadow-lg leading-tight"
                >
                  OCEAN
                </span>
              </div>
              <div className="flex gap-[clamp(0.25rem,1vw,0.5rem)]">
                {[{ note: 'F', bg: 'bg-green-600' }, { note: 'G', bg: 'bg-blue-500' }, { note: 'A', bg: 'bg-purple-600' }].map(({ note, bg }) => (
                  <div 
                    key={note}
                    className={`rounded-xl ${bg} border-2 border-white shadow-xl flex items-center justify-center`}
                    style={{
                      width: 'clamp(2rem, 8vw, 3.5rem)',
                      height: 'clamp(2rem, 8vw, 3.5rem)'
                    }}
                  >
                    <span 
                      style={{ fontSize: 'clamp(0.875rem, 3.5vw, 1.5rem)' }}
                      className="font-black text-white"
                    >
                      {note}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-[clamp(0.25rem,1vh,0.5rem)] text-center">
              <div 
                style={{ fontSize: 'clamp(1rem, 3.5vw, 1.75rem)' }}
                className="font-black text-white drop-shadow-lg"
              >
                Beats 3 & 7
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "STEP 3: Only YOUR Note",
      content: (
        <div className="flex flex-col justify-evenly h-full gap-[clamp(0.75rem,2vh,1.5rem)]">
          <div className="bg-gradient-to-r from-yellow-400 via-green-400 to-blue-400 rounded-2xl p-[clamp(1rem,3vw,2rem)] shadow-2xl">
            <div className="text-center space-y-[clamp(0.5rem,1.5vh,1rem)]">
              <div 
                style={{ fontSize: 'clamp(1.25rem, 5vw, 2.5rem)' }}
                className="font-black text-gray-900 leading-tight"
              >
                YOUR color GLOWS = PLAY
              </div>
              <div style={{ fontSize: 'clamp(1.5rem, 6vw, 3rem)' }}>✨💥✨</div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-2xl p-[clamp(1rem,3vw,2rem)] shadow-2xl border-4 border-gray-600">
            <div className="text-center space-y-[clamp(0.5rem,1.5vh,1rem)]">
              <div 
                style={{ fontSize: 'clamp(1.25rem, 5vw, 2.5rem)' }}
                className="font-black text-gray-400 leading-tight"
              >
                No glow?
              </div>
              <div style={{ fontSize: 'clamp(1.5rem, 6vw, 3rem)' }}>🤫</div>
              <div 
                style={{ fontSize: 'clamp(1.25rem, 5vw, 2.5rem)' }}
                className="font-black text-gray-400 leading-tight"
              >
                COUNT SILENTLY
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "STEP 4: Advanced Rhythm",
      content: (
        <div className="flex flex-col justify-evenly h-full gap-[clamp(0.5rem,1.5vh,1rem)]">
          <div className="text-center">
            <div style={{ fontSize: 'clamp(1.25rem, 4.5vw, 2rem)' }} className="font-black">
              ⭐ Twinkle Pattern ⭐
            </div>
          </div>
          
          <div className="space-y-[clamp(0.5rem,1.5vh,1rem)]">
            {/* C plays beats 1 & 2 (double) */}
            <div className="bg-red-600 rounded-2xl p-[clamp(0.5rem,1.5vw,1rem)] shadow-2xl">
              <div className="flex items-center justify-between gap-[clamp(0.5rem,2vw,1rem)]">
                <div 
                  className="rounded-xl bg-white shadow-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 'clamp(2rem, 8vw, 3rem)',
                    height: 'clamp(2rem, 8vw, 3rem)'
                  }}
                >
                  <span 
                    style={{ fontSize: 'clamp(1rem, 4vw, 1.75rem)' }}
                    className="font-black text-red-600"
                  >
                    C
                  </span>
                </div>
                <div className="flex gap-[clamp(0.25rem,1vw,0.5rem)]">
                  {[1, 2].map(beat => (
                    <div 
                      key={beat}
                      className="rounded-lg bg-white/90 shadow-lg flex items-center justify-center"
                      style={{
                        width: 'clamp(1.75rem, 7vw, 2.75rem)',
                        height: 'clamp(1.75rem, 7vw, 2.75rem)'
                      }}
                    >
                      <span 
                        style={{ fontSize: 'clamp(0.875rem, 3.5vw, 1.25rem)' }}
                        className="font-black text-red-600"
                      >
                        {beat}
                      </span>
                    </div>
                  ))}
                </div>
                <div 
                  style={{ fontSize: 'clamp(1rem, 3.5vw, 1.5rem)' }}
                  className="font-black text-white leading-tight"
                >
                  DOUBLE!
                </div>
              </div>
            </div>

            {/* G plays beats 4 & 8 */}
            <div className="bg-blue-600 rounded-2xl p-[clamp(0.5rem,1.5vw,1rem)] shadow-2xl">
              <div className="flex items-center justify-between gap-[clamp(0.5rem,2vw,1rem)]">
                <div 
                  className="rounded-xl bg-white shadow-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 'clamp(2rem, 8vw, 3rem)',
                    height: 'clamp(2rem, 8vw, 3rem)'
                  }}
                >
                  <span 
                    style={{ fontSize: 'clamp(1rem, 4vw, 1.75rem)' }}
                    className="font-black text-blue-600"
                  >
                    G
                  </span>
                </div>
                <div className="flex gap-[clamp(0.25rem,1vw,0.5rem)]">
                  {[{ beat: 3, active: false }, { beat: 4, active: true }, { beat: 7, active: false }, { beat: 8, active: true }].map(({ beat, active }) => (
                    <div 
                      key={beat}
                      className={`rounded-lg shadow-lg flex items-center justify-center ${active ? 'bg-white/90' : 'bg-white/20 border-2 border-white/40'}`}
                      style={{
                        width: 'clamp(1.75rem, 7vw, 2.75rem)',
                        height: 'clamp(1.75rem, 7vw, 2.75rem)'
                      }}
                    >
                      <span 
                        style={{ fontSize: 'clamp(0.875rem, 3.5vw, 1.25rem)' }}
                        className={`font-black ${active ? 'text-blue-600' : 'text-white/40'}`}
                      >
                        {beat}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* A plays beats 5 & 6 (double) */}
            <div className="bg-purple-600 rounded-2xl p-[clamp(0.5rem,1.5vw,1rem)] shadow-2xl">
              <div className="flex items-center justify-between gap-[clamp(0.5rem,2vw,1rem)]">
                <div 
                  className="rounded-xl bg-white shadow-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 'clamp(2rem, 8vw, 3rem)',
                    height: 'clamp(2rem, 8vw, 3rem)'
                  }}
                >
                  <span 
                    style={{ fontSize: 'clamp(1rem, 4vw, 1.75rem)' }}
                    className="font-black text-purple-600"
                  >
                    A
                  </span>
                </div>
                <div className="flex gap-[clamp(0.25rem,1vw,0.5rem)]">
                  {[5, 6].map(beat => (
                    <div 
                      key={beat}
                      className="rounded-lg bg-white/90 shadow-lg flex items-center justify-center"
                      style={{
                        width: 'clamp(1.75rem, 7vw, 2.75rem)',
                        height: 'clamp(1.75rem, 7vw, 2.75rem)'
                      }}
                    >
                      <span 
                        style={{ fontSize: 'clamp(0.875rem, 3.5vw, 1.25rem)' }}
                        className="font-black text-purple-600"
                      >
                        {beat}
                      </span>
                    </div>
                  ))}
                </div>
                <div 
                  style={{ fontSize: 'clamp(1rem, 3.5vw, 1.5rem)' }}
                  className="font-black text-white leading-tight"
                >
                  DOUBLE!
                </div>
              </div>
            </div>

            {/* Empty beats reminder */}
            <div className="bg-gray-800 rounded-2xl p-[clamp(0.5rem,1.5vw,1rem)] shadow-2xl border-4 border-gray-600 text-center">
              <div 
                style={{ fontSize: 'clamp(1rem, 3.5vw, 1.5rem)' }}
                className="font-black text-gray-400 leading-tight"
              >
                Beat 3 & 7 = REST ⬜
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "🚨 TROUBLESHOOTING",
      content: (
        <div className="flex flex-col justify-evenly h-full gap-[clamp(0.5rem,1.5vh,1rem)]">
          <div className="bg-yellow-500/20 border-4 border-yellow-500 rounded-2xl p-[clamp(0.5rem,1.5vw,1rem)] shadow-2xl">
            <div className="flex items-center gap-[clamp(0.5rem,2vw,1rem)]">
              <span style={{ fontSize: 'clamp(1.5rem, 6vw, 2.5rem)' }}>😵</span>
              <div className="flex-1 min-w-0">
                <div 
                  style={{ fontSize: 'clamp(0.875rem, 3vw, 1.25rem)' }}
                  className="font-bold text-yellow-300 leading-tight"
                >
                  Can't focus?
                </div>
                <div 
                  style={{ fontSize: 'clamp(0.875rem, 3vw, 1.25rem)' }}
                  className="font-bold text-white leading-tight"
                >
                  Cover your boomwhacker
                </div>
              </div>
            </div>
          </div>

          <div className="bg-red-500/20 border-4 border-red-500 rounded-2xl p-[clamp(0.5rem,1.5vw,1rem)] shadow-2xl">
            <div className="flex items-center gap-[clamp(0.5rem,2vw,1rem)]">
              <span style={{ fontSize: 'clamp(1.5rem, 6vw, 2.5rem)' }}>⏰</span>
              <div className="flex-1 min-w-0">
                <div 
                  style={{ fontSize: 'clamp(0.875rem, 3vw, 1.25rem)' }}
                  className="font-bold text-red-300 leading-tight"
                >
                  Playing too early?
                </div>
                <div 
                  style={{ fontSize: 'clamp(0.875rem, 3vw, 1.25rem)' }}
                  className="font-bold text-white leading-tight"
                >
                  Watch pixel reach THE END
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-500/20 border-4 border-blue-500 rounded-2xl p-[clamp(0.5rem,1.5vw,1rem)] shadow-2xl">
            <div className="flex items-center gap-[clamp(0.5rem,2vw,1rem)]">
              <span style={{ fontSize: 'clamp(1.5rem, 6vw, 2.5rem)' }}>🎯</span>
              <div className="flex-1 min-w-0">
                <div 
                  style={{ fontSize: 'clamp(0.875rem, 3vw, 1.25rem)' }}
                  className="font-bold text-blue-300 leading-tight"
                >
                  Missing your note?
                </div>
                <div 
                  style={{ fontSize: 'clamp(0.875rem, 3vw, 1.25rem)' }}
                  className="font-bold text-white leading-tight"
                >
                  COUNT in your head!
                </div>
              </div>
            </div>
          </div>

          <div className="bg-purple-500/20 border-4 border-purple-500 rounded-2xl p-[clamp(0.5rem,1.5vw,1rem)] shadow-2xl">
            <div className="flex items-center gap-[clamp(0.5rem,2vw,1rem)]">
              <span style={{ fontSize: 'clamp(1.5rem, 6vw, 2.5rem)' }}>🛑</span>
              <div className="flex-1 min-w-0">
                <div 
                  style={{ fontSize: 'clamp(0.875rem, 3vw, 1.25rem)' }}
                  className="font-bold text-purple-300 leading-tight"
                >
                  See STOP?
                </div>
                <div 
                  style={{ fontSize: 'clamp(0.875rem, 3vw, 1.25rem)' }}
                  className="font-bold text-white leading-tight"
                >
                  FREEZE immediately!
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "✅ YOU DID IT!",
      content: (
        <div className="flex flex-col justify-evenly h-full gap-[clamp(0.75rem,2vh,1.5rem)]">
          <div className="text-center">
            <div style={{ fontSize: 'clamp(2rem, 8vw, 4rem)' }} className="mb-[clamp(0.5rem,1vh,1rem)]">
              🎉🎊🎉
            </div>
            <div 
              style={{ fontSize: 'clamp(1.75rem, 6vw, 3rem)' }}
              className="font-black bg-gradient-to-r from-yellow-400 via-green-400 to-blue-400 text-transparent bg-clip-text leading-tight"
            >
              SUCCESS!
            </div>
          </div>

          <div className="space-y-[clamp(0.5rem,1.5vh,1rem)]">
            <div className="flex items-center gap-[clamp(0.5rem,2vw,1rem)] bg-green-500/30 border-4 border-green-500 rounded-xl p-[clamp(0.5rem,1.5vw,1rem)] shadow-xl">
              <div style={{ fontSize: 'clamp(1.5rem, 5vw, 2.25rem)' }}>✅</div>
              <div 
                style={{ fontSize: 'clamp(1rem, 3.5vw, 1.75rem)' }}
                className="font-bold text-white leading-tight"
              >
                Watched the screen
              </div>
            </div>

            <div className="flex items-center gap-[clamp(0.5rem,2vw,1rem)] bg-green-500/30 border-4 border-green-500 rounded-xl p-[clamp(0.5rem,1.5vw,1rem)] shadow-xl">
              <div style={{ fontSize: 'clamp(1.5rem, 5vw, 2.25rem)' }}>✅</div>
              <div 
                style={{ fontSize: 'clamp(1rem, 3.5vw, 1.75rem)' }}
                className="font-bold text-white leading-tight"
              >
                Played YOUR turn
              </div>
            </div>

            <div className="flex items-center gap-[clamp(0.5rem,2vw,1rem)] bg-green-500/30 border-4 border-green-500 rounded-xl p-[clamp(0.5rem,1.5vw,1rem)] shadow-xl">
              <div style={{ fontSize: 'clamp(1.5rem, 5vw, 2.25rem)' }}>✅</div>
              <div 
                style={{ fontSize: 'clamp(1rem, 3.5vw, 1.75rem)' }}
                className="font-bold text-white leading-tight"
              >
                Quiet on empty beats
              </div>
            </div>
          </div>

          <div className="text-center">
            <div 
              style={{ fontSize: 'clamp(1.25rem, 4.5vw, 2rem)' }}
              className="font-black text-yellow-400 leading-tight"
            >
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
      className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-[clamp(0.5rem,2vw,2rem)]"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="max-w-7xl mx-auto h-screen flex flex-col" style={{ height: '100dvh' }}>
        {/* Card Counter */}
        <div className="text-center mb-[clamp(0.5rem,1vh,1rem)] flex-shrink-0">
          <div className="inline-block bg-white/20 rounded-full px-[clamp(1rem,3vw,2rem)] py-[clamp(0.5rem,1vh,0.75rem)] backdrop-blur-sm">
            <span style={{ fontSize: 'clamp(1rem, 3.5vw, 1.5rem)' }} className="font-bold">
              Card {card + 1} / {cards.length}
            </span>
          </div>
        </div>
        
        {/* Card Content - uses flex-grow to fill available space */}
        <div className="flex-grow bg-white/10 backdrop-blur-sm rounded-3xl p-[clamp(1rem,3vw,3rem)] shadow-2xl mb-[clamp(0.5rem,1vh,1rem)] flex flex-col min-h-0">
          <h1 
            style={{ fontSize: 'clamp(1.5rem, 5vw, 2.75rem)' }}
            className="font-black mb-[clamp(1rem,2vh,2rem)] text-center bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 text-transparent bg-clip-text leading-tight flex-shrink-0"
          >
            {cards[card].title}
          </h1>
          <div className="flex-grow flex flex-col min-h-0">
            {cards[card].content}
          </div>
        </div>

        {/* Navigation */}
        <div className="grid grid-cols-3 gap-[clamp(0.5rem,1.5vw,1rem)] flex-shrink-0">
          <button
            onClick={handlePrevious}
            disabled={card === 0}
            style={{ 
              fontSize: 'clamp(1rem, 3vw, 1.5rem)',
              minHeight: 'clamp(3rem, 8vh, 5rem)'
            }}
            className="py-[clamp(0.75rem,2vh,1.5rem)] font-bold rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 shadow-xl"
          >
            ◀ Previous
          </button>
          <button
            onClick={onBack}
            style={{ 
              fontSize: 'clamp(1rem, 3vw, 1.5rem)',
              minHeight: 'clamp(3rem, 8vh, 5rem)'
            }}
            className="py-[clamp(0.75rem,2vh,1.5rem)] font-bold rounded-2xl bg-gray-700 hover:bg-gray-600 transition-all active:scale-95 shadow-xl"
          >
            Exit
          </button>
          <button
            onClick={handleNext}
            disabled={card === cards.length - 1}
            style={{ 
              fontSize: 'clamp(1rem, 3vw, 1.5rem)',
              minHeight: 'clamp(3rem, 8vh, 5rem)'
            }}
            className="py-[clamp(0.75rem,2vh,1.5rem)] font-bold rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 shadow-xl"
          >
            Next ▶
          </button>
        </div>
      </div>
    </div>
  );
};
