import React, { useRef, useEffect, useState } from 'react';
import {
  PIANO_CONSTANTS,
  BLACK_KEYS,
  isWhiteKey,
  getVisibleNoteRange,
} from './constants';
import { getNoteColor, type ColorMode } from '../../utils/colorMapping';

interface PianoCanvasProps {
  /** Currently active MIDI notes */
  activeNotes: Set<number>;

  /** Color mode (chromatic or harmonic) */
  colorMode: ColorMode;

  /** Callback when a key is clicked */
  onKeyClick?: (midiNote: number) => void;

  /** Callback when a key is released */
  onKeyRelease?: (midiNote: number) => void;

  /** Number of octaves to display (default: 4) */
  visibleOctaves?: number;

  /** Starting octave (default: 3 for C3) */
  startOctave?: number;

  /** Additional CSS classes */
  className?: string;
}

interface KeyGeometry {
  midiNote: number;
  x: number;
  y: number;
  width: number;
  height: number;
  isBlack: boolean;
}

/**
 * Piano Canvas Component
 *
 * Renders an interactive piano keyboard with:
 * - White and black keys with proper spacing
 * - MIDI note highlighting with chromatic/harmonic colors
 * - Click-to-play functionality
 * - Responsive sizing
 */
export const PianoCanvas: React.FC<PianoCanvasProps> = ({
  activeNotes,
  colorMode,
  onKeyClick,
  onKeyRelease,
  visibleOctaves = PIANO_CONSTANTS.DEFAULT_VISIBLE_OCTAVES,
  startOctave = PIANO_CONSTANTS.DEFAULT_START_OCTAVE,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [keyGeometries, setKeyGeometries] = useState<KeyGeometry[]>([]);
  const [pressedKeys, setPressedKeys] = useState<Set<number>>(new Set());

  // Calculate visible note range
  const { start: startNote, end: endNote } = getVisibleNoteRange(startOctave, visibleOctaves);

  /**
   * Draw the piano keyboard
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match display size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = rect.width;
    const height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate dimensions
    const visibleWhiteKeys: number[] = [];
    for (let note = startNote; note <= endNote; note++) {
      if (isWhiteKey(note)) {
        visibleWhiteKeys.push(note);
      }
    }

    const whiteKeyWidth = width / visibleWhiteKeys.length;
    const whiteKeyHeight = height * 0.85;
    const blackKeyWidth = whiteKeyWidth * 0.6;
    const blackKeyHeight = whiteKeyHeight * 0.6;

    const geometries: KeyGeometry[] = [];

    // Draw white keys first
    visibleWhiteKeys.forEach((midiNote, index) => {
      const x = index * whiteKeyWidth;
      const noteClass = midiNote % 12; // Note class: 0=C, 1=C#, 2=D, etc.
      const isActive = activeNotes.has(midiNote);
      const isPressed = pressedKeys.has(midiNote);

      // Get color
      const color = getNoteColor(noteClass, colorMode);
      const brightness = isActive || isPressed ? 1.0 : 0.15;

      ctx.fillStyle = `rgb(${color.r * brightness}, ${color.g * brightness}, ${color.b * brightness})`;
      ctx.fillRect(x, height - whiteKeyHeight, whiteKeyWidth, whiteKeyHeight);

      // Border
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, height - whiteKeyHeight, whiteKeyWidth, whiteKeyHeight);

      // Note label (only show C notes for cleaner look)
      if (noteClass === 0) {
        const octave = Math.floor(midiNote / 12) - 1;
        ctx.fillStyle = isActive || isPressed ? '#fff' : '#666';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`C${octave}`, x + whiteKeyWidth / 2, height - 10);
      }

      // Store geometry
      geometries.push({
        midiNote,
        x,
        y: height - whiteKeyHeight,
        width: whiteKeyWidth,
        height: whiteKeyHeight,
        isBlack: false,
      });
    });

    // Draw black keys on top
    visibleWhiteKeys.forEach((midiNote, index) => {
      const noteClass = midiNote % 12;

      // Check if there's a black key to the right
      const nextNoteClass = (noteClass + 1) % 12;
      if (BLACK_KEYS.includes(nextNoteClass)) {
        const blackMidiNote = midiNote + 1;
        if (blackMidiNote <= endNote) {
          const x = (index + 1) * whiteKeyWidth - blackKeyWidth / 2;
          const blackNoteClass = blackMidiNote % 12; // Note class: 0=C, 1=C#, 2=D, etc.
          const isActive = activeNotes.has(blackMidiNote);
          const isPressed = pressedKeys.has(blackMidiNote);

          // Get color
          const color = getNoteColor(blackNoteClass, colorMode);
          const brightness = isActive || isPressed ? 1.0 : 0.2;

          ctx.fillStyle = `rgb(${color.r * brightness}, ${color.g * brightness}, ${color.b * brightness})`;
          ctx.fillRect(x, height - whiteKeyHeight, blackKeyWidth, blackKeyHeight);

          // Border
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, height - whiteKeyHeight, blackKeyWidth, blackKeyHeight);

          // Store geometry
          geometries.push({
            midiNote: blackMidiNote,
            x,
            y: height - whiteKeyHeight,
            width: blackKeyWidth,
            height: blackKeyHeight,
            isBlack: true,
          });
        }
      }
    });

    setKeyGeometries(geometries);
  }, [activeNotes, colorMode, startNote, endNote, pressedKeys, startOctave, visibleOctaves]);

  /**
   * Handle mouse/touch down
   */
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check black keys first (they're on top)
    for (let i = keyGeometries.length - 1; i >= 0; i--) {
      const key = keyGeometries[i];
      if (!key.isBlack) continue;

      if (x >= key.x && x <= key.x + key.width && y >= key.y && y <= key.y + key.height) {
        setPressedKeys((prev) => new Set(prev).add(key.midiNote));
        onKeyClick?.(key.midiNote);
        return;
      }
    }

    // Check white keys
    for (const key of keyGeometries) {
      if (key.isBlack) continue;

      if (x >= key.x && x <= key.x + key.width && y >= key.y && y <= key.y + key.height) {
        setPressedKeys((prev) => new Set(prev).add(key.midiNote));
        onKeyClick?.(key.midiNote);
        return;
      }
    }
  };

  /**
   * Handle mouse/touch up
   */
  const handlePointerUp = () => {
    // Release all pressed keys
    pressedKeys.forEach((midiNote) => {
      onKeyRelease?.(midiNote);
    });
    setPressedKeys(new Set());
  };

  /**
   * Handle mouse leave (release all keys)
   */
  const handlePointerLeave = () => {
    pressedKeys.forEach((midiNote) => {
      onKeyRelease?.(midiNote);
    });
    setPressedKeys(new Set());
  };

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      style={{ touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
    />
  );
};
