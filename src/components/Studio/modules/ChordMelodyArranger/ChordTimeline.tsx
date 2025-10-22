/**
 * ChordTimeline Component
 * Epic 15 - Story 15.2: ChordMelodyArranger Module UI
 *
 * Visual timeline grid showing chord progression across multiple bars.
 * Animated playback cursor synced with global tempo (60fps).
 * Clickable chord buttons with audio playback and colored note dots.
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as Tone from 'tone';
import { useGlobalMusic } from '@/contexts/GlobalMusicContext';
import { ChordProgressionService } from '@/services/chordProgressionService';
import { getNoteColor } from '@/utils/colorMapping';
import type { Chord } from '@/types/chordProgression';

export interface ChordTimelineProps {
  chords: Chord[];
  romanNumerals: string[];  // Roman numerals for the progression (e.g., ["I", "V", "vi", "IV"])
  playbackPosition: number; // 0-1 (normalized position through timeline)
  tempo: number;            // BPM from GlobalMusicContext
  isPlaying: boolean;       // Playing state from GlobalMusicContext
  barCount?: number;        // Number of bars to display (default: 8)
  onChordEvent?: (chord: Chord) => void; // Callback for chord routing to output modules
}

export const ChordTimeline: React.FC<ChordTimelineProps> = ({
  chords,
  romanNumerals,
  playbackPosition,
  tempo,
  isPlaying,
  barCount = 8,
  onChordEvent,
}) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const chordSynthRef = useRef<Tone.PolySynth | null>(null);
  const { colorMode } = useGlobalMusic();
  const service = ChordProgressionService.getInstance();
  const [activeChordIndex, setActiveChordIndex] = useState<number | null>(null);
  const lastPlayedBarRef = useRef<number>(-1);

  // Initialize Tone.js synth for chord playback
  useEffect(() => {
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.01,
        decay: 0.3,
        sustain: 0.4,
        release: 1.0,
      },
    }).toDestination();
    synth.volume.value = -12; // Slightly quieter
    chordSynthRef.current = synth;

    return () => {
      synth.dispose();
    };
  }, []);

  // Get unique note colors for a chord (adapted from GuitarFretboard pattern)
  const getChordNoteColors = useCallback((chord: Chord) => {
    const noteClasses = new Set<number>();
    const noteColors: Array<{ noteClass: number; color: { r: number; g: number; b: number } }> = [];

    // Get MIDI notes from chord
    const midiNotes = service.getChordNotes(chord);

    midiNotes.forEach(midiNote => {
      const noteClass = midiNote % 12;

      if (!noteClasses.has(noteClass)) {
        noteClasses.add(noteClass);
        // Use note class for chromatic/harmonic, full MIDI note for spectrum
        const noteForColor = noteClass;
        const color = getNoteColor(noteForColor, colorMode);
        noteColors.push({ noteClass, color });
      }
    });

    return noteColors.sort((a, b) => a.noteClass - b.noteClass);
  }, [service, colorMode]);

  // Play chord with audio feedback (adapted from GuitarFretboard pattern)
  const playChord = useCallback((chord: Chord, chordIndex: number) => {
    if (!chordSynthRef.current) return;

    const midiNotes = service.getChordNotes(chord);
    const frequencies = midiNotes.map(midiNote =>
      Tone.Frequency(midiNote, 'midi').toFrequency()
    );

    // Strum effect: play notes slightly offset for realism
    frequencies.forEach((freq, i) => {
      setTimeout(() => {
        chordSynthRef.current?.triggerAttackRelease(freq, '2n');
      }, i * 30); // 30ms strum delay between notes
    });

    // Route chord to output modules
    if (onChordEvent) {
      onChordEvent(chord);
    }

    // Visual feedback
    setActiveChordIndex(chordIndex);
    setTimeout(() => setActiveChordIndex(null), 300);
  }, [service, onChordEvent]);

  // Animate playback cursor at 60fps using requestAnimationFrame
  useEffect(() => {
    if (!isPlaying || !cursorRef.current) {
      return;
    }

    let animationFrame: number;
    const animate = () => {
      if (cursorRef.current) {
        const position = playbackPosition * 100; // Convert to percentage
        cursorRef.current.style.left = `${position}%`;
      }
      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isPlaying, playbackPosition]);

  // Reset cursor position when stopped
  useEffect(() => {
    if (!isPlaying && cursorRef.current) {
      cursorRef.current.style.left = '0%';
      lastPlayedBarRef.current = -1; // Reset bar tracking
    }
  }, [isPlaying]);

  // Automatic chord playback during timeline playback
  useEffect(() => {
    if (!isPlaying || chords.length === 0) {
      return;
    }

    // Calculate which bar we're currently in (0-based index)
    const currentBar = Math.floor(playbackPosition * barCount);

    // Only trigger chord if we've crossed into a new bar
    if (currentBar !== lastPlayedBarRef.current && currentBar < barCount) {
      lastPlayedBarRef.current = currentBar;

      // Get the chord for this bar (cycling through progression)
      const chord = chords[currentBar % chords.length];
      if (chord) {
        playChord(chord, currentBar);
      }
    }
  }, [isPlaying, playbackPosition, barCount, chords, playChord]);

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Chord Timeline</h3>
        <span className="text-xs text-gray-400">{barCount} bars • {tempo} BPM</span>
      </div>

      {/* Timeline Grid Container */}
      <div className="relative">
        {/* Timeline Grid */}
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${Math.min(barCount, 8)}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: barCount }).map((_, idx) => {
            // Cycle through chords if we have more bars than chords
            const chord = chords[idx % chords.length];
            const romanNumeral = romanNumerals[idx % romanNumerals.length];
            const noteColors = chord ? getChordNoteColors(chord) : [];
            const isActive = activeChordIndex === idx;

            return (
              <button
                key={idx}
                onClick={() => {
                  if (chord) {
                    playChord(chord, idx);
                  }
                }}
                className={`
                  bg-gray-700 border border-gray-600 rounded-lg p-3 text-center relative overflow-hidden
                  transition-all duration-200
                  ${chord ? 'hover:bg-gray-650 hover:border-primary-500 cursor-pointer' : 'cursor-default'}
                  ${isActive ? 'bg-primary-600 border-primary-400 scale-105' : ''}
                  min-h-[100px] flex flex-col items-center justify-center
                `}
                disabled={!chord}
                aria-label={chord ? `Play ${chord.name} chord` : 'Empty bar'}
              >
                {/* Bar Number */}
                <div className="text-xs text-gray-400 mb-1 font-medium">
                  Bar {idx + 1}
                </div>

                {/* Chord Name */}
                <div className={`font-semibold text-lg ${isActive ? 'text-white' : 'text-primary-400'}`}>
                  {chord?.name || '—'}
                </div>

                {/* Roman Numeral */}
                {romanNumeral && (
                  <div className="text-xs text-gray-400 font-medium mt-1">
                    {romanNumeral}
                  </div>
                )}

                {/* Colored Note Dots (like GuitarFretboard) */}
                {chord && noteColors.length > 0 && (
                  <div className="flex gap-1 justify-center mt-1">
                    {noteColors.map((nc, colorIdx) => (
                      <div
                        key={colorIdx}
                        className="w-3 h-3 rounded-full border border-gray-800"
                        style={{
                          backgroundColor: `rgb(${nc.color.r}, ${nc.color.g}, ${nc.color.b})`,
                        }}
                        title={`Note class ${nc.noteClass}`}
                      />
                    ))}
                  </div>
                )}

                {/* Visual indicator for clickability */}
                {chord && (
                  <div className="text-[10px] text-gray-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to play
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Playback Cursor - Animated at 60fps */}
        {isPlaying && (
          <div
            ref={cursorRef}
            className="absolute top-0 bottom-0 w-1 bg-primary-400 shadow-lg pointer-events-none z-10 transition-opacity"
            style={{
              left: '0%',
              boxShadow: '0 0 8px rgba(168, 85, 247, 0.6)',
            }}
            aria-label="Playback cursor"
          />
        )}
      </div>

      {/* Playback Info (when playing) */}
      {isPlaying && (
        <div className="mt-3 text-xs text-gray-400 text-center">
          Playing at {tempo} BPM • Position: {Math.round(playbackPosition * 100)}%
        </div>
      )}

      {/* Empty State */}
      {chords.length === 0 && (
        <div className="text-center text-gray-400 py-12">
          <p className="text-sm">Select a chord progression from the list above to begin.</p>
        </div>
      )}
    </div>
  );
};
