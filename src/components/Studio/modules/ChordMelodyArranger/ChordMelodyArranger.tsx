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
import { Music, Play, Pause, Settings } from 'lucide-react';
import { useGlobalMusic } from '@/contexts/GlobalMusicContext';
import { ChordProgressionService } from '@/services/chordProgressionService';
import { ModuleRoutingService } from '@/services/moduleRoutingService';
import { ChordBuilder } from './ChordBuilder';
import { ChordTimeline } from './ChordTimeline';
import { MelodySequencer } from './MelodySequencer';
import { OutputSelector } from './OutputSelector';
import { getNoteColor } from '@/utils/colorMapping';
import type { RomanNumeralProgression, Chord } from '@/types/chordProgression';
import type { MelodyNote } from './MelodySequencer';
import type { NoteEvent } from '@/types/moduleRouting';

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
  layout: _layout = 'desktop',
  settings: _settings = {},
  onSettingsChange: _onSettingsChange,
  onBack,
  embedded = false,
  instanceId = 'chord-melody-arranger-test', // Default for standalone testing
}) => {
  // GlobalMusicContext integration (Story 15.5)
  const { key, scale, tempo, isPlaying, updateTransportState, colorMode } = useGlobalMusic();
  const service = ChordProgressionService.getInstance();
  const routingService = ModuleRoutingService.getInstance();

  // Local state
  const [selectedProgression, setSelectedProgression] = useState<RomanNumeralProgression | null>(null);
  const [currentChords, setCurrentChords] = useState<Chord[]>([]);
  const [playbackPosition, setPlaybackPosition] = useState<number>(0);
  const [showSettings, setShowSettings] = useState(false);
  const [stepDuration, setStepDuration] = useState(0.25); // Story 15.9: Step duration in beats (0.25 = 16th, 0.5 = 8th, 1 = quarter, 2 = half, 4 = whole)
  const [outputTargets, setOutputTargets] = useState<string[]>([]); // Module routing (Story 15.4)
  const [routeNotes, setRouteNotes] = useState(true); // Route melody notes to output modules
  const [routeChords, setRouteChords] = useState(true); // Route chord events to output modules

  // Current chord tracking for MelodySequencer (Story 15.7)
  const [currentChordIndex, setCurrentChordIndex] = useState<number>(0);

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

    // Chord progression plays over 8 bars
    const beatsPerSecond = tempo / 60;
    const secondsPerBeat = 1 / beatsPerSecond;
    const totalDuration = 8 * 4 * secondsPerBeat; // 8 bars = 32 beats

    let startTime = performance.now();
    let animationFrame: number;

    const updatePosition = () => {
      const elapsed = (performance.now() - startTime) / 1000; // seconds
      const position = (elapsed % totalDuration) / totalDuration; // Loop within 0-1
      setPlaybackPosition(position);

      // Update current chord index based on playback position (Story 15.7)
      if (currentChords.length > 0) {
        const totalBars = 8;
        const barsPerChord = totalBars / currentChords.length;
        const chordIndex = Math.floor((position * totalBars) / barsPerChord);
        setCurrentChordIndex(Math.min(chordIndex, currentChords.length - 1));
      }

      animationFrame = requestAnimationFrame(updatePosition);
    };

    updatePosition();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isPlaying, tempo, currentChords.length]);

  // Transport control handlers
  const handlePlay = useCallback(() => {
    updateTransportState(true);
  }, [updateTransportState]);

  const handlePause = useCallback(() => {
    updateTransportState(false);
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
    // Send to FrequencySourceManager for DJ Visualizer (MIDI mode)
    const sourceManager = (window as any).frequencySourceManager;
    if (sourceManager) {
      const noteForColor = colorMode === 'spectrum' ? note.pitch : (note.pitch % 12);
      const noteColor = getNoteColor(noteForColor, colorMode);
      sourceManager.addMidiNote(note.pitch, note.velocity, noteColor);
      console.log('[ChordMelodyArranger] Sent note to frequencySourceManager:', note.pitch, 'color:', noteColor);
    }

    // If no output targets selected or notes routing disabled, skip module routing
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
  }, [outputTargets, instanceId, routingService, tempo, routeNotes, colorMode]);

  // Handle chord events - Route chord notes to selected output modules
  const handleChordEvent = useCallback((chord: Chord) => {
    const midiNotes = service.getChordNotes(chord);

    // Send to FrequencySourceManager for DJ Visualizer (MIDI mode)
    const sourceManager = (window as any).frequencySourceManager;
    if (sourceManager) {
      midiNotes.forEach(pitch => {
        const noteForColor = colorMode === 'spectrum' ? pitch : (pitch % 12);
        const noteColor = getNoteColor(noteForColor, colorMode);
        sourceManager.addMidiNote(pitch, 80, noteColor);
      });
      console.log('[ChordMelodyArranger] Sent chord to frequencySourceManager:', chord.name, midiNotes);
    }

    // If no output targets selected or chords routing disabled, skip module routing
    if (outputTargets.length === 0 || !routeChords) return;

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
  }, [outputTargets, instanceId, routingService, service, routeChords, colorMode]);

  return (
    <>
      <div className="flex flex-col h-full bg-gray-900 text-white">
        {/* Module Header */}
        <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${embedded ? 'p-2' : 'p-4'} border-b border-gray-700`}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Music className={`${embedded ? 'w-5 h-5' : 'w-6 h-6'} text-purple-400 flex-shrink-0`} />
          <div className="min-w-0 flex-1">
            <h2 className={`${embedded ? 'text-base' : 'text-xl'} font-bold truncate`}>{embedded ? 'Chord/Melody' : 'Chord & Melody Arranger'}</h2>
            <p className="text-xs text-gray-400 truncate">
              {progressionDisplayName} • {keyScaleDisplay}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
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
            onClick={isPlaying ? handlePause : handlePlay}
            className={`${embedded ? 'p-2' : 'p-3'} bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center`}
            aria-label={isPlaying ? 'Pause progression' : 'Play progression'}
          >
            {isPlaying ? <Pause className={`${embedded ? 'w-4 h-4' : 'w-5 h-5'}`} /> : <Play className={`${embedded ? 'w-4 h-4' : 'w-5 h-5'}`} />}
          </button>
          {!embedded && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
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

      {/* Main Content Area */}
      <div className={`flex-1 overflow-auto ${embedded ? 'p-2 space-y-2' : 'p-4 space-y-4'}`}>
        {/* Chord Builder Section */}
        <ChordBuilder
          selectedProgression={selectedProgression}
          onProgressionSelect={setSelectedProgression}
          onClearProgression={handleClearProgression}
          embedded={embedded}
        />

        {/* Chord Timeline */}
        {currentChords.length > 0 && (
          <ChordTimeline
            chords={currentChords}
            romanNumerals={selectedProgression?.romanNumerals || []}
            playbackPosition={playbackPosition}
            tempo={tempo}
            isPlaying={isPlaying}
            barCount={8}
            onChordEvent={handleChordEvent}
          />
        )}

        {/* Melody Sequencer (Story 15.3, 15.5, 15.7, 15.9) */}
        <MelodySequencer
          playbackPosition={playbackPosition}
          isPlaying={isPlaying}
          tempo={tempo}
          stepDuration={stepDuration}
          setStepDuration={setStepDuration}
          onNoteEvent={handleMelodyNote}
          instanceId={instanceId}
          outputTargets={outputTargets}
          currentChord={currentChords[currentChordIndex] || null}
          romanNumeral={selectedProgression?.romanNumerals[currentChordIndex] || ''}
        />
      </div>

      {/* Settings Panel - Module Bottom Tray */}
      {showSettings && (
        <div className="border-t border-gray-700 bg-gray-850 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Module Settings</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
          <div className="text-xs text-gray-500 text-center py-4">
            Additional module settings coming in future stories (chord voicing, loop controls, etc.)
          </div>
        </div>
      )}
    </div>
    </>
  );
};
