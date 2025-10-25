/**
 * ChordBuilder Component
 * Epic 15 - Story 15.2: ChordMelodyArranger Module UI
 *
 * Compact dropdown selector for chord progressions with genre grouping.
 * Integrates with ChordProgressionService from Story 15.1.
 * Refactored to minimize vertical space and keep melody sequencer accessible.
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { ChordProgressionService } from '@/services/chordProgressionService';
import { useGlobalMusic } from '@/contexts/GlobalMusicContext';
import type { RomanNumeralProgression } from '@/types/chordProgression';

export interface ChordBuilderProps {
  selectedProgression: RomanNumeralProgression | null;
  onProgressionSelect: (progression: RomanNumeralProgression) => void;
  onClearProgression?: () => void;
  embedded?: boolean;
}

export const ChordBuilder: React.FC<ChordBuilderProps> = ({
  selectedProgression,
  onProgressionSelect,
  onClearProgression,
  embedded = false,
}) => {
  const service = ChordProgressionService.getInstance();
  const { key } = useGlobalMusic();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [expandedGenres, setExpandedGenres] = useState<Set<string>>(new Set());

  // Get all available genres from service
  const genres = useMemo(() => service.getAvailableGenres(), [service]);

  // Group progressions by genre
  const progressionsByGenre = useMemo(() => {
    const grouped: Record<string, RomanNumeralProgression[]> = {};
    genres.forEach(genre => {
      grouped[genre] = service.getProgressionsByGenre(genre);
    });
    return grouped;
  }, [genres, service]);

  // Click-outside-to-close behavior
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Toggle genre expansion
  const toggleGenre = (genre: string) => {
    setExpandedGenres(prev => {
      const newSet = new Set(prev);
      if (newSet.has(genre)) {
        newSet.delete(genre);
      } else {
        newSet.add(genre);
      }
      return newSet;
    });
  };

  // Handle progression selection
  const handleSelect = (prog: RomanNumeralProgression) => {
    onProgressionSelect(prog);
    setIsOpen(false);
  };

  // Display text for selected progression
  const selectedDisplay = selectedProgression
    ? `${selectedProgression.name} (${selectedProgression.genre})`
    : 'Select Chord Progression...';

  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-700 ${embedded ? 'p-2' : 'p-4'}`}>
      {/* Header with Clear Button */}
      <div className={`flex items-center justify-between ${embedded ? 'mb-2' : 'mb-4'}`}>
        <h3 className={`${embedded ? 'text-sm' : 'text-lg'} font-semibold text-white`}>{embedded ? 'Chords' : 'Chord Progressions'}</h3>
        {selectedProgression && onClearProgression && (
          <button
            onClick={onClearProgression}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Clear chord progression"
            title="Clear chord progression"
          >
            <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400 transition-colors" />
          </button>
        )}
      </div>

      {/* Compact Dropdown Selector */}
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full ${embedded ? 'px-2 py-2' : 'px-4 py-3'} bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-between min-h-[44px]`}
          aria-label="Toggle chord progression selector"
        >
          <span className={`${embedded ? 'text-xs truncate' : 'text-sm'}`}>{selectedDisplay}</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown Content - Grouped by Genre */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 rounded-lg border border-gray-700 max-h-96 overflow-y-auto z-10 shadow-lg">
            {genres.map(genre => {
              const genreProgressions = progressionsByGenre[genre] || [];
              const isExpanded = expandedGenres.has(genre);

              return (
                <div key={genre} className="border-b border-gray-700 last:border-b-0">
                  {/* Genre Header */}
                  <button
                    onClick={() => toggleGenre(genre)}
                    className="w-full px-4 py-3 bg-gray-750 hover:bg-gray-700 text-left flex items-center justify-between transition-colors min-h-[44px]"
                    aria-label={`Toggle ${genre} progressions`}
                  >
                    <span className="font-semibold text-white text-sm">
                      {genre} ({genreProgressions.length})
                    </span>
                    <ChevronRight
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                  </button>

                  {/* Genre Progressions */}
                  {isExpanded && (
                    <div className="bg-gray-850">
                      {genreProgressions.map((prog, idx) => {
                        const isSelected = selectedProgression?.name === prog.name &&
                                          selectedProgression?.genre === prog.genre;

                        return (
                          <button
                            key={`${prog.genre}-${prog.name}-${idx}`}
                            onClick={() => handleSelect(prog)}
                            className={`w-full text-left px-6 py-3 transition-colors min-h-[44px] border-l-4 ${
                              isSelected
                                ? 'bg-primary-600 border-primary-400 text-white'
                                : 'bg-gray-800 border-transparent hover:bg-gray-700 text-gray-100'
                            }`}
                            aria-label={`Select ${prog.name} progression`}
                          >
                            <div className="font-semibold text-sm">{prog.name}</div>
                            <div className="text-xs text-gray-300 mt-1">{prog.description}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              {prog.romanNumerals.join(' - ')}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Current Progression Display */}
      {selectedProgression && (
        <div className="mt-4 p-3 bg-gray-700 rounded-lg border border-gray-600">
          <div className="text-xs text-gray-400 mb-1">
            Current Progression in {key} {selectedProgression.scaleType}
          </div>
          <div className="font-semibold text-white">{selectedProgression.name}</div>
          <div className="text-sm text-gray-300 mt-2">
            <span className="text-gray-400">Roman Numerals:</span>{' '}
            {selectedProgression.romanNumerals.join(' → ')}
          </div>
        </div>
      )}
    </div>
  );
};
