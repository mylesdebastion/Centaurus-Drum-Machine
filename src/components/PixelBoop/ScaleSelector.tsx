/**
 * ScaleSelector.tsx
 * 
 * UI component for selecting scale type (Major, Minor, Pentatonic)
 */

import React from 'react';
import { ScaleType } from '@/lib/intervalMode';

interface ScaleSelectorProps {
  scale: ScaleType;
  onScaleChange: (scale: ScaleType) => void;
  disabled?: boolean;
  className?: string;
}

const SCALES: { value: ScaleType; label: string; description: string }[] = [
  { value: 'major', label: 'MAJOR', description: 'Major scale (7 notes)' },
  { value: 'minor', label: 'MINOR', description: 'Natural minor scale (7 notes)' },
  { value: 'penta', label: 'PENTA', description: 'Pentatonic scale (5 notes)' },
];

export const ScaleSelector: React.FC<ScaleSelectorProps> = ({
  scale,
  onScaleChange,
  disabled = false,
  className = ''
}) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-xs font-semibold text-gray-300 uppercase">
        Scale
      </label>
      <div className="flex gap-2">
        {SCALES.map(({ value, label, description }) => {
          const isActive = value === scale;
          
          return (
            <button
              key={value}
              onClick={() => onScaleChange(value)}
              disabled={disabled}
              className={`
                px-4 py-2 rounded text-sm font-medium transition-all
                ${isActive 
                  ? 'bg-green-500 text-white shadow-lg' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              title={description}
            >
              {label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-400">
        {SCALES.find(s => s.value === scale)?.description}
      </p>
    </div>
  );
};

// Compact version for smaller spaces
export const ScaleSelectorCompact: React.FC<ScaleSelectorProps> = ({
  scale,
  onScaleChange,
  disabled = false,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label className="text-xs text-gray-400">Scale:</label>
      <select
        value={scale}
        onChange={(e) => onScaleChange(e.target.value as ScaleType)}
        disabled={disabled}
        className="bg-gray-700 text-white px-2 py-1 rounded text-sm border border-gray-600 focus:border-green-500 focus:outline-none"
      >
        {SCALES.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
};
