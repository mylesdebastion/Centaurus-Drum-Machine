/**
 * ChordMelodyArranger Component
 * Epic 15 - Story 15.2: ChordMelodyArranger Module UI
 *
 * Main container for chord progression composition module.
 * Integrates ChordProgressionService, GlobalMusicContext, and provides transport controls.
 *
 * Features:
 * - Genre-based chord progression selection
 * - Visual timeline with playback cursor
 * - Transport controls (play/pause/stop)
 * - Auto-transpose on key changes
 * - Melody arranger placeholder (Story 15.3)
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Music, Play, Pause, Square, Settings } from 'lucide-react';
import { useGlobalMusic } from '@/contexts/GlobalMusicContext';
import { ChordProgressionService } from '@/services/chordProgressionService';
import { ModuleRoutingService } from '@/services/moduleRoutingService';
import { ChordBuilder } from './ChordBuilder';
import { ChordTimeline } from './ChordTimeline';
import { MelodySequencer } from './MelodySequencer';
import { OutputSelector } from './OutputSelector';
import type { RomanNumeralProgression, Chord } from '@/types/chordProgression';
import type { MelodyNote } from './MelodySequencer';
import type { NoteEvent, ChordEvent } from '@/types/moduleRouting';

/**
 * ModuleComponentProps interface (will be defined in Story 15.6)
 * For now, defining inline for development
 */
export interface ModuleComponentProps {
  layout?: 'mobile' | 'desktop';
  settings?: Record<string, any>;
  onSettingsChange?: (settings: Record<string, any>) => void;
  onBack?: () => void;
  embedded?: boolean;
  instanceId?: string; // Unique instance ID for module routing (Story 15.4)
}

export const ChordMelodyArranger: React.FC<ModuleComponentProps> = ({
  layout = 'desktop',
  settings = {},
  onSettingsChange,
  onBack,
  embedded = false,
  instanceId = 'chord-melody-arranger-test', // Default for standalone testing
}) => {
  // GlobalMusicContext integration (Story 15.5)
  const { key, scale, tempo, isPlaying, updateTransportState } = useGlobalMusic();
  const service = ChordProgressionService.getInstance();
  const routingService = ModuleRoutingService.getInstance();

  // Local state
  const [selectedProgression, setSelectedProgression] = useState<RomanNumeralProgression | null>(null);
  const [currentChords, setCurrentChords] = useState<Chord[]>([]);
  const [playbackPosition, setPlaybackPosition] = useState<number>(0);
  const [showSettings, setShowSettings] = useState(false);
  const [barCount] = useState(8); // Configurable via settings (future enhancement)
  const [outputTargets, setOutputTargets] = useState<string[]>([]); // Module routing (Story 15.4)
  const [routeNotes, setRouteNotes] = useState(true); // Route melody notes to output modules
  const [routeChords, setRouteChords] = useState(true); // Route chord events to output modules

  // Automatically resolve chords when progression or key changes
  useEffect(() => {
    if (selectedProgression) {
      const resolved = service.resolveRomanNumerals(selectedProgression, key as any);
      setCurrentChords(resolved.chords);
    } else {
      setCurrentChords([]);
    }
  }, [selectedProgression, key, service]);

  // Clear chord progression handler
  const handleClearProgression = useCallback(() => {
    setSelectedProgression(null);
    setCurrentChords([]);
  }, []);

  // Playback loop - Updates playback position based on tempo
  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const beatsPerSecond = tempo / 60;
    const secondsPerBar = 4 / beatsPerSecond; // Assuming 4/4 time signature
    const totalDuration = barCount * secondsPerBar; // Total duration in seconds

    let startTime = performance.now();
    let animationFrame: number;

    const updatePosition = () => {
      const elapsed = (performance.now() - startTime) / 1000; // seconds
      const position = (elapsed % totalDuration) / totalDuration; // Loop within 0-1
      setPlaybackPosition(position);

      animationFrame = requestAnimationFrame(updatePosition);
    };

    updatePosition();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isPlaying, tempo, barCount]);

  // Transport control handlers
  const handlePlay = useCallback(() => {
    updateTransportState(true);
  }, [updateTransportState]);

  const handlePause = useCallback(() => {
    updateTransportState(false);
  }, [updateTransportState]);

  const handleStop = useCallback(() => {
    updateTransportState(false);
    setPlaybackPosition(0);
  }, [updateTransportState]);

  // Memoize progression display name with current key/scale (Story 15.5)
  const progressionDisplayName = useMemo(() => {
    if (!selectedProgression) return 'No progression selected';
    return `${selectedProgression.name} in ${key} ${selectedProgression.scaleType}`;
  }, [selectedProgression, key]);

  // Memoize key/scale display for header
  const keyScaleDisplay = useMemo(() => {
    return `${key} ${scale}`;
  }, [key, scale]);

  // Handle melody note events - Route to selected output modules (Story 15.4)
  const handleMelodyNote = useCallback((note: MelodyNote) => {
    // If no output targets selected or notes routing disabled, just play locally
    if (outputTargets.length === 0 || !routeNotes) return;

    // Emit note-on event
    const noteOnEvent: NoteEvent = {
      type: 'note-on',
      pitch: note.pitch,
      velocity: note.velocity,
      timestamp: performance.now(),
      sourceInstanceId: instanceId,
    };

    routingService.routeNoteEvent(noteOnEvent, outputTargets);

    // Schedule note-off event based on note duration
    const durationMs = (note.duration / (tempo / 60)) * 1000; // Convert beats to ms
    setTimeout(() => {
      const noteOffEvent: NoteEvent = {
        type: 'note-off',
        pitch: note.pitch,
        velocity: 0,
        timestamp: performance.now(),
        sourceInstanceId: instanceId,
      };
      routingService.routeNoteEvent(noteOffEvent, outputTargets);
    }, durationMs);
  }, [outputTargets, instanceId, routingService, tempo, routeNotes]);

  // Handle chord events - Route chord notes to selected output modules
  const handleChordEvent = useCallback((chord: Chord) => {
    // If no output targets selected or chords routing disabled, skip routing
    if (outputTargets.length === 0 || !routeChords) return;

    const midiNotes = service.getChordNotes(chord);

    // Emit note-on events for all chord notes
    midiNotes.forEach(pitch => {
      const noteOnEvent: NoteEvent = {
        type: 'note-on',
        pitch,
        velocity: 80, // Standard chord velocity
        timestamp: performance.now(),
        sourceInstanceId: instanceId,
      };
      routingService.routeNoteEvent(noteOnEvent, outputTargets);
    });

    // Schedule note-off events after 1 second (chord duration)
    setTimeout(() => {
      midiNotes.forEach(pitch => {
        const noteOffEvent: NoteEvent = {
          type: 'note-off',
          pitch,
          velocity: 0,
          timestamp: performance.now(),
          sourceInstanceId: instanceId,
        };
        routingService.routeNoteEvent(noteOffEvent, outputTargets);
      });
    }, 1000); // 1 second chord duration
  }, [outputTargets, instanceId, routingService, service, routeChords]);

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Module Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <Music className="w-6 h-6 text-purple-400" />
          <div>
            <h2 className="text-xl font-bold">Chord & Melody Arranger</h2>
            <p className="text-xs text-gray-400">
              {progressionDisplayName} • Key: {keyScaleDisplay}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <OutputSelector
            sourceInstanceId={instanceId}
            selectedTargets={outputTargets}
            onTargetsChange={setOutputTargets}
            routeNotes={routeNotes}
            routeChords={routeChords}
            onRouteNotesChange={setRouteNotes}
            onRouteChordsChange={setRouteChords}
          />
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Toggle settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          {!embedded && onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors min-h-[44px]"
            >
              Back
            </button>
          )}
        </div>
      </div>

      {/* Transport Controls */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-700 bg-gray-850">
        <button
          onClick={isPlaying ? handlePause : handlePlay}
          className="p-3 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label={isPlaying ? 'Pause chord progression' : 'Play chord progression'}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
        <button
          onClick={handleStop}
          className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Stop chord progression"
        >
          <Square className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">Tempo:</span>
          <span className="font-semibold text-white">{tempo} BPM</span>
        </div>
        {isPlaying && (
          <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-400">Playing</span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Chord Builder Section */}
        <ChordBuilder
          selectedProgression={selectedProgression}
          onProgressionSelect={setSelectedProgression}
          onClearProgression={handleClearProgression}
        />

        {/* Chord Timeline */}
        {currentChords.length > 0 && (
          <ChordTimeline
            chords={currentChords}
            romanNumerals={selectedProgression?.romanNumerals || []}
            playbackPosition={playbackPosition}
            tempo={tempo}
            isPlaying={isPlaying}
            barCount={barCount}
            onChordEvent={handleChordEvent}
          />
        )}

        {/* Melody Sequencer (Story 15.3, 15.5) */}
        <MelodySequencer
          playbackPosition={playbackPosition}
          isPlaying={isPlaying}
          tempo={tempo}
          onNoteEvent={handleMelodyNote}
          instanceId={instanceId}
          outputTargets={outputTargets}
        />
      </div>

      {/* Settings Panel (Collapsible) */}
      {showSettings && (
        <div className="border-t border-gray-700 bg-gray-850 p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Settings</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Timeline Length</label>
              <div className="flex gap-2">
                {[4, 8, 16].map((count) => (
                  <button
                    key={count}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      barCount === count
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {count} bars
                  </button>
                ))}
              </div>
            </div>
            <div className="text-xs text-gray-500">
              More settings coming in future stories (chord voicing, loop controls, etc.)
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
