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
}

export const FretboardCanvas: React.FC<FretboardCanvasProps> = ({
  activeChord,
  activeMIDINotes,
  colorMode,
  onFretClick
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

    // Draw fretboard grid
    for (let string = 0; string < GUITAR_CONSTANTS.STRINGS; string++) {
      for (let fret = 0; fret < GUITAR_CONSTANTS.FRETS; fret++) {
        const noteClass = fretboardMatrix[string][fret];

        // Check if chord note is active (convert from 1-indexed to 0-indexed string)
        const isChordNote = activeChord.some(
          cn => cn.string - 1 === string && cn.fret === fret
        );

        // Check if MIDI note is active for this fret position
        const midiNote = getMIDINoteFromFret(string, fret);
        const isMIDIActive = activeMIDINotes.has(midiNote);

        const color = getNoteColor(noteClass, colorMode);
        const brightness = (isChordNote || isMIDIActive) ? 1.0 : 0.1;

        const x = fret * fretWidth + fretWidth / 2;
        const y = (string + 1) * stringHeight;

        // Draw fret circle
        ctx.fillStyle = `rgb(${color.r * brightness}, ${color.g * brightness}, ${color.b * brightness})`;
        ctx.beginPath();
        ctx.arc(x, y, fretWidth / 3, 0, Math.PI * 2);
        ctx.fill();

        // Draw white ring for active notes
        if (isChordNote || isMIDIActive) {
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, fretWidth / 4, 0, Math.PI * 2);
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

  }, [activeChord, activeMIDINotes, colorMode, fretboardMatrix]);

  // Handle fret clicks
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const fretWidth = canvas.width / GUITAR_CONSTANTS.FRETS;
    const stringHeight = canvas.height / (GUITAR_CONSTANTS.STRINGS + 1);

    const fret = Math.floor(x / fretWidth);
    const string = Math.floor(y / stringHeight) - 1;

    if (string >= 0 && string < GUITAR_CONSTANTS.STRINGS && fret >= 0 && fret < GUITAR_CONSTANTS.FRETS) {
      onFretClick(string, fret);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={1200}
      height={400}
      onClick={handleCanvasClick}
      className="w-full h-auto cursor-pointer"
    />
  );
};
