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
}

export const FretboardCanvas: React.FC<FretboardCanvasProps> = ({
  activeChord,
  activeMIDINotes,
  colorMode,
  onFretClick,
  scaleNotes = [],
  rootNote
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

    // Collect all currently active note classes (0-11) for interval-based brightness
    const activeNoteClasses = new Set<number>();

    // From MIDI notes
    activeMIDINotes.forEach(midiNote => {
      activeNoteClasses.add(midiNote % 12);
    });

    // From chord notes
    activeChord.forEach(cn => {
      const stringIndex = GUITAR_CONSTANTS.STRINGS - cn.string;
      const noteClass = fretboardMatrix[stringIndex][cn.fret];
      activeNoteClasses.add(noteClass);
    });

    /**
     * Calculate harmonic brightness based on scale degree importance
     * @param noteClass - Note class (0-11)
     * @returns brightness value (0-1)
     */
    const getHarmonicBrightness = (noteClass: number): number => {
      // If no scale or root info, use default
      if (scaleNotes.length === 0 || rootNote === undefined) {
        return 0.5; // Medium brightness for unknown scales
      }

      // Check if note is in scale
      if (!scaleNotes.includes(noteClass)) {
        return 0.1; // Out of scale - very dim
      }

      // Calculate scale degree (interval from root)
      const interval = (noteClass - rootNote + 12) % 12;

      // Map scale degree to brightness based on harmonic importance
      switch (interval) {
        case 0:  // Root (1st) - Tonic
          return 0.8;
        case 7:  // Perfect 5th - Dominant
          return 0.7;
        case 4:  // Major 3rd - Mediant
        case 3:  // Minor 3rd
          return 0.6;
        case 11: // Major 7th - Leading tone
        case 10: // Minor 7th
          return 0.5;
        case 2:  // Major 2nd
        case 5:  // Perfect 4th
        case 9:  // Major 6th
          return 0.45;
        default:
          return 0.4; // Other scale tones
      }
    };

    /**
     * Calculate EXAGGERATED brightness based on interval from active notes
     * This helps guide players toward musical intervals in real-time
     * @param noteClass - Note class (0-11)
     * @returns brightness value (0-1)
     */
    const getIntervalBasedBrightness = (noteClass: number): number => {
      if (activeNoteClasses.size === 0) {
        return getHarmonicBrightness(noteClass); // Fallback to scale-based
      }

      // Find the brightest interval relationship to any active note
      let maxBrightness = 0;

      activeNoteClasses.forEach(activeNote => {
        const interval = (noteClass - activeNote + 12) % 12;

        // Exaggerated brightness scale emphasizing consonance/dissonance
        let brightness: number;
        switch (interval) {
          case 0:  // Unison/Octave - Perfect consonance
            brightness = 1.0;
            break;
          case 7:  // Perfect 5th - Very consonant
            brightness = 0.9;
            break;
          case 5:  // Perfect 4th - Consonant
            brightness = 0.85;
            break;
          case 4:  // Major 3rd - Consonant
            brightness = 0.8;
            break;
          case 3:  // Minor 3rd - Consonant
            brightness = 0.75;
            break;
          case 9:  // Major 6th - Consonant
            brightness = 0.7;
            break;
          case 8:  // Minor 6th - Somewhat consonant
            brightness = 0.65;
            break;
          case 2:  // Major 2nd - Neutral
            brightness = 0.6;
            break;
          case 10: // Minor 7th - Somewhat dissonant
            brightness = 0.5;
            break;
          case 11: // Major 7th - Dissonant
            brightness = 0.4;
            break;
          case 6:  // Tritone - Very dissonant
            brightness = 0.2;
            break;
          case 1:  // Minor 2nd - Very dissonant
            brightness = 0.15;
            break;
          default:
            brightness = 0.3;
        }

        maxBrightness = Math.max(maxBrightness, brightness);
      });

      return maxBrightness;
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

        const color = getNoteColor(noteClass, colorMode);

        // Real-time interval guide brightness system:
        // When notes are active (clicked/played):
        //   - Active note: 1.0 (100%)
        //   - Octave: 1.0 (100%) - Perfect consonance
        //   - Perfect 5th: 0.9 (90%) - Very consonant
        //   - Perfect 4th: 0.85 (85%)
        //   - Major 3rd: 0.8 (80%)
        //   - Minor 3rd: 0.75 (75%)
        //   - Tritone: 0.2 (20%) - Very dissonant
        //   - Minor 2nd: 0.15 (15%) - Very dissonant
        // When no notes are active, uses scale-based harmonic brightness
        let brightness: number;

        if (isChordNote || isMIDIActive) {
          brightness = 1.0; // Active notes at full brightness
        } else {
          brightness = getIntervalBasedBrightness(noteClass);
        }

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

  }, [activeChord, activeMIDINotes, colorMode, fretboardMatrix, scaleNotes, rootNote]);

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
