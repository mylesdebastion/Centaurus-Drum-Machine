/**
 * IntervalModeSelector.tsx
 * 
 * UI component for selecting interval modes (3rds, 4ths, 5ths, etc.)
 */

import React from 'react';
import { IntervalModeType, INTERVAL_MODES, INTERVAL_MODE_ORDER } from '@/lib/intervalMode';

interface IntervalModeSelectorProps {
  currentMode: IntervalModeType;
  onModeChange: (mode: IntervalModeType) => void;
  disabled?: boolean;
  className?: string;
}

export const IntervalModeSelector: React.FC<IntervalModeSelectorProps> = ({
  currentMode,
  onModeChange,
  disabled = false,
  className = ''
}) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-xs font-semibold text-gray-300 uppercase">
        Interval Mode
      </label>
      <div className="flex flex-wrap gap-2">
        {INTERVAL_MODE_ORDER.map((modeType) => {
          const mode = INTERVAL_MODES[modeType];
          const isActive = modeType === currentMode;
          
          return (
            <button
              key={modeType}
              onClick={() => onModeChange(modeType)}
              disabled={disabled}
              className={`
                px-3 py-2 rounded text-sm font-medium transition-all
                ${isActive 
                  ? 'bg-blue-500 text-white shadow-lg' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              title={`${mode.displayName} - Scale degree skip: ${mode.scaleDegreeSkip}`}
            >
              {mode.displayName}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-400">
        Current: {INTERVAL_MODES[currentMode].displayName} 
        {currentMode !== 'chromatic' && ` (skips ${INTERVAL_MODES[currentMode].scaleDegreeSkip} scale degrees)`}
      </p>
    </div>
  );
};

// Compact version for smaller spaces
export const IntervalModeSelectorCompact: React.FC<IntervalModeSelectorProps> = ({
  currentMode,
  onModeChange,
  disabled = false,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label className="text-xs text-gray-400">Mode:</label>
      <select
        value={currentMode}
        onChange={(e) => onModeChange(e.target.value as IntervalModeType)}
        disabled={disabled}
        className="bg-gray-700 text-white px-2 py-1 rounded text-sm border border-gray-600 focus:border-blue-500 focus:outline-none"
      >
        {INTERVAL_MODE_ORDER.map((modeType) => (
          <option key={modeType} value={modeType}>
            {INTERVAL_MODES[modeType].displayName}
          </option>
        ))}
      </select>
    </div>
  );
};
