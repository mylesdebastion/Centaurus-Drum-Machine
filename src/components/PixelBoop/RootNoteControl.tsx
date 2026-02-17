/**
 * RootNoteControl.tsx
 * 
 * UI component for selecting the root note (C-B, 0-11)
 */

import React from 'react';
import { colorForPitchClass } from '@/lib/intervalMode';

interface RootNoteControlProps {
  rootNote: number;  // 0-11 (C=0)
  onRootNoteChange: (note: number) => void;
  disabled?: boolean;
  className?: string;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const RootNoteControl: React.FC<RootNoteControlProps> = ({
  rootNote,
  onRootNoteChange,
  disabled = false,
  className = ''
}) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-xs font-semibold text-gray-300 uppercase">
        Root Note
      </label>
      <div className="grid grid-cols-12 gap-1">
        {NOTE_NAMES.map((noteName, index) => {
          const isActive = index === rootNote;
          const color = colorForPitchClass(index);
          
          return (
            <button
              key={index}
              onClick={() => onRootNoteChange(index)}
              disabled={disabled}
              className={`
                px-2 py-2 rounded text-xs font-bold transition-all
                ${isActive 
                  ? 'ring-2 ring-white shadow-lg scale-110' 
                  : 'hover:scale-105'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              style={{
                backgroundColor: color,
                color: index === 4 || index === 5 ? '#000' : '#fff',  // Dark text for yellow notes
              }}
              title={`${noteName} (${index})`}
            >
              {noteName}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-400">
        Current: {NOTE_NAMES[rootNote]} ({rootNote})
      </p>
    </div>
  );
};

// Compact version for smaller spaces
export const RootNoteControlCompact: React.FC<RootNoteControlProps> = ({
  rootNote,
  onRootNoteChange,
  disabled = false,
  className = ''
}) => {
  const color = colorForPitchClass(rootNote);
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label className="text-xs text-gray-400">Root:</label>
      <div className="flex gap-1">
        <button
          onClick={() => onRootNoteChange((rootNote - 1 + 12) % 12)}
          disabled={disabled}
          className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs"
        >
          ◀
        </button>
        <div
          className="px-3 py-1 rounded text-xs font-bold min-w-[40px] text-center"
          style={{
            backgroundColor: color,
            color: rootNote === 4 || rootNote === 5 ? '#000' : '#fff',
          }}
        >
          {NOTE_NAMES[rootNote]}
        </div>
        <button
          onClick={() => onRootNoteChange((rootNote + 1) % 12)}
          disabled={disabled}
          className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs"
        >
          ▶
        </button>
      </div>
    </div>
  );
};
