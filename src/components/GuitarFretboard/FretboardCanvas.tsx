// Fretboard Canvas Component
// Story 9.3: Guitar Fretboard Visualizer with LED Matrix Output

import React, { useRef, useEffect } from 'react';
import { getNoteColor, ColorMode } from '../../utils/colorMapping';
import { createFretboardMatrix, GUITAR_CONSTANTS, STRING_NAMES, getMIDINoteFromFret } from './constants';
import { ChordNote } from './chordProgressions';

interface FretboardCanvasProps {
  activeChord: ChordNote[];
  activeMIDINotes: Set<number>;  // MIDI note numbers
  colorMode: ColorMode;
  onFretClick: (string: number, fret: number) => void;
  scaleNotes?: number[];  // Optional: scale notes for highlighting (0-11)
  rootNote?: number;      // Optional: root note of the scale (0-11)
  calculateBrightness?: (string: number, fret: number) => number; // Story 16.1: Harmonic guidance brightness
  hoveredFret?: { string: number; fret: number } | null; // Story 16.2: Temporal proximity highlighting
  onFretHover?: (string: number, fret: number) => void; // Story 16.2: Hover handler
  onFretHoverLeave?: () => void; // Story 16.2: Hover leave handler
  calculateTemporalProximity?: (string: number, fret: number, interactedFret: { string: number; fret: number } | null) => number | null; // Story 16.2: Temporal proximity brightness
}

export const FretboardCanvas: React.FC<FretboardCanvasProps> = ({
  activeChord,
  activeMIDINotes,
  colorMode,
  onFretClick,
  scaleNotes = [],
  rootNote,
  calculateBrightness, // Story 16.1: Optional brightness calculation from parent
  hoveredFret = null, // Story 16.2: Temporal proximity highlighting
  onFretHover, // Story 16.2: Hover handler
  onFretHoverLeave, // Story 16.2: Hover leave handler
  calculateTemporalProximity // Story 16.2: Temporal proximity brightness
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fretboardMatrix = createFretboardMatrix();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const fretWidth = width / GUITAR_CONSTANTS.FRETS;
    const stringHeight = height / (GUITAR_CONSTANTS.STRINGS + 1);

    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    /**
     * Simple fallback brightness when no harmonic guidance is provided
     * Returns basic in-scale vs out-of-scale brightness
     */
    const getSimpleBrightness = (noteClass: number): number => {
      // Check if note is in scale
      const isInScale = scaleNotes.length > 0 && scaleNotes.includes(noteClass);
      return isInScale ? 0.5 : 0.2; // In-scale: medium, out-of-scale: dim
    };

    // Draw fretboard grid
    for (let string = 0; string < GUITAR_CONSTANTS.STRINGS; string++) {
      for (let fret = 0; fret < GUITAR_CONSTANTS.FRETS; fret++) {
        const noteClass = fretboardMatrix[string][fret];

        // Check if chord note is active
        // Convert from guitar string notation (1-6, where 1=high E, 6=low E)
        // to array index (0-5, where 0=low E, 5=high E)
        const isChordNote = activeChord.some(
          cn => GUITAR_CONSTANTS.STRINGS - cn.string === string && cn.fret === fret
        );

        // Check if MIDI note is active for this fret position
        const midiNote = getMIDINoteFromFret(string, fret);
        const isMIDIActive = activeMIDINotes.has(midiNote);

        // Get color
        // Spectrum mode: use full MIDI note range (low=red, high=purple)
        // Chromatic/Harmonic: use note class (repeating colors per octave)
        const noteForColor = colorMode === 'spectrum' ? midiNote : noteClass;
        const color = getNoteColor(noteForColor, colorMode);

        // Story 16.1 & 16.2: Brightness calculation with temporal proximity support
        let brightness: number;

        if (isChordNote || isMIDIActive) {
          brightness = 1.0; // Active notes at full brightness
        } else if (calculateTemporalProximity && hoveredFret) {
          // Story 16.2: Check for temporal proximity first (hover highlighting takes priority)
          const temporalBrightness = calculateTemporalProximity(string, fret, hoveredFret);
          if (temporalBrightness !== null) {
            brightness = temporalBrightness;
          } else if (calculateBrightness) {
            // Fall back to base harmonic guidance if not temporally close
            brightness = calculateBrightness(string, fret);
          } else {
            brightness = getSimpleBrightness(noteClass);
          }
        } else if (calculateBrightness) {
          // Use harmonic guidance brightness from parent (Story 16.1)
          brightness = calculateBrightness(string, fret);
        } else {
          // Simple fallback: in-scale (0.5) vs out-of-scale (0.2)
          brightness = getSimpleBrightness(noteClass);
        }

        const x = fret * fretWidth + fretWidth / 2;
        const y = (string + 1) * stringHeight;

        const noteRadius = fretWidth / 3;

        // Draw fret circle
        ctx.fillStyle = `rgb(${color.r * brightness}, ${color.g * brightness}, ${color.b * brightness})`;
        ctx.beginPath();
        ctx.arc(x, y, noteRadius, 0, Math.PI * 2);
        ctx.fill();

        // Draw white ring outline for active notes (same size as note circle)
        if (isChordNote || isMIDIActive) {
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(x, y, noteRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    // Draw fret markers (traditional guitar dots)
    const fretMarkers = {
      single: [3, 5, 7, 9, 15, 17, 19, 21],
      double: [12, 24]
    };

    const markerY = height / 2; // Center of fretboard
    const markerRadius = fretWidth / 6;

    // Single dot markers
    ctx.fillStyle = 'rgba(150, 150, 150, 0.3)'; // Subtle gray
    fretMarkers.single.forEach(fret => {
      if (fret < GUITAR_CONSTANTS.FRETS) {
        const x = fret * fretWidth + fretWidth / 2;
        ctx.beginPath();
        ctx.arc(x, markerY, markerRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Double dot markers (one above, one below center)
    fretMarkers.double.forEach(fret => {
      if (fret < GUITAR_CONSTANTS.FRETS) {
        const x = fret * fretWidth + fretWidth / 2;
        const offset = stringHeight * 1.1; // Positioned to fit between strings

        // Upper dot
        ctx.beginPath();
        ctx.arc(x, markerY - offset, markerRadius, 0, Math.PI * 2);
        ctx.fill();

        // Lower dot
        ctx.beginPath();
        ctx.arc(x, markerY + offset, markerRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw fret numbers
    ctx.fillStyle = '#ccc';
    ctx.font = '14px Inter';
    ctx.textAlign = 'center';
    for (let fret = 0; fret < GUITAR_CONSTANTS.FRETS; fret++) {
      ctx.fillText(String(fret), fret * fretWidth + fretWidth / 2, height - 10);
    }

    // Draw string labels
    ctx.textAlign = 'right';
    for (let string = 0; string < GUITAR_CONSTANTS.STRINGS; string++) {
      ctx.fillText(STRING_NAMES[string], 30, (string + 1) * stringHeight + 5);
    }

  }, [activeChord, activeMIDINotes, colorMode, fretboardMatrix, scaleNotes, rootNote, calculateBrightness, hoveredFret, calculateTemporalProximity]);

  // Handle fret clicks
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    // Get click position relative to displayed canvas
    const displayX = e.clientX - rect.left;
    const displayY = e.clientY - rect.top;

    // Scale from displayed size to internal canvas size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = displayX * scaleX;
    const y = displayY * scaleY;

    const fretWidth = canvas.width / GUITAR_CONSTANTS.FRETS;
    const stringHeight = canvas.height / (GUITAR_CONSTANTS.STRINGS + 1);

    const fret = Math.floor(x / fretWidth);
    // Use Math.round instead of Math.floor to find the nearest string
    // Strings are drawn at (string + 1) * stringHeight, so we need to round to nearest
    const string = Math.round(y / stringHeight) - 1;

    // Debug: Log ALL clicks to see what's being calculated
    console.group('🖱️ Canvas Click Debug');
    console.log(`Display click: x=${displayX.toFixed(1)}, y=${displayY.toFixed(1)}`);
    console.log(`Display size: ${rect.width.toFixed(1)} x ${rect.height.toFixed(1)}`);
    console.log(`Scale factors: x=${scaleX.toFixed(2)}, y=${scaleY.toFixed(2)}`);
    console.log(`Scaled click: x=${x.toFixed(1)}, y=${y.toFixed(1)}`);
    console.log(`Canvas internal size: ${canvas.width} x ${canvas.height}`);
    console.log(`Fret width: ${fretWidth.toFixed(1)}, String height: ${stringHeight.toFixed(1)}`);
    console.log(`Calculated: String ${string}, Fret ${fret}`);
    console.log(`Valid range: String 0-${GUITAR_CONSTANTS.STRINGS - 1}, Fret 0-${GUITAR_CONSTANTS.FRETS - 1}`);

    if (string >= 0 && string < GUITAR_CONSTANTS.STRINGS && fret >= 0 && fret < GUITAR_CONSTANTS.FRETS) {
      console.log('✅ Click accepted - calling onFretClick');
      console.groupEnd();
      onFretClick(string, fret);
    } else {
      console.log('❌ Click rejected - out of bounds');
      if (string < 0) console.log(`   → String ${string} is below 0 (clicking in top padding?)`);
      if (string >= GUITAR_CONSTANTS.STRINGS) console.log(`   → String ${string} is above max`);
      if (fret < 0) console.log(`   → Fret ${fret} is below 0`);
      if (fret >= GUITAR_CONSTANTS.FRETS) console.log(`   → Fret ${fret} is above max`);
      console.groupEnd();
    }
  };

  // Handle mouse move for hover highlighting (Story 16.2)
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onFretHover) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const displayX = e.clientX - rect.left;
    const displayY = e.clientY - rect.top;

    // Scale from displayed size to internal canvas size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = displayX * scaleX;
    const y = displayY * scaleY;

    const fretWidth = canvas.width / GUITAR_CONSTANTS.FRETS;
    const stringHeight = canvas.height / (GUITAR_CONSTANTS.STRINGS + 1);

    const fret = Math.floor(x / fretWidth);
    const string = Math.round(y / stringHeight) - 1;

    if (string >= 0 && string < GUITAR_CONSTANTS.STRINGS && fret >= 0 && fret < GUITAR_CONSTANTS.FRETS) {
      onFretHover(string, fret);
    }
  };

  // Handle mouse leave for hover highlighting (Story 16.2)
  const handleMouseLeave = () => {
    if (onFretHoverLeave) {
      onFretHoverLeave();
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={1200}
      height={400}
      onClick={handleCanvasClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="w-full h-auto cursor-pointer"
    />
  );
};
