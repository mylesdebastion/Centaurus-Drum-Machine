import React, { useState } from 'react';
import { Music } from 'lucide-react';
import { RootNote, ScaleName, SCALE_DISPLAY_NAMES } from '../../hooks/useMusicalScale';

/**
 * Scale Selector Component
 *
 * Reusable UI component for selecting musical root notes and scales
 * Used across Piano Roll, Isometric Sequencer, Guitar Fretboard, etc.
 */

export interface ScaleSelectorProps {
  /** Currently selected root note */
  selectedRoot: RootNote;
  /** Currently selected scale */
  selectedScale: ScaleName;
  /** Available root notes */
  rootNotes: string[];
  /** Available scale names */
  scaleNames: string[];
  /** Callback when root note changes */
  onRootChange: (root: RootNote) => void;
  /** Callback when scale changes */
  onScaleChange: (scale: ScaleName) => void;
  /** Optional: Custom button color (default: blue) */
  rootColor?: string;
  /** Optional: Custom button color for scale (default: indigo) */
  scaleColor?: string;
  /** Optional: Show icon on buttons (default: true) */
  showIcon?: boolean;
}

/**
 * ScaleSelector - Reusable key/scale picker component
 *
 * @example
 * ```tsx
 * const { selectedRoot, selectedScale, setSelectedRoot, setSelectedScale, rootNotes, scaleNames } = useMusicalScale();
 *
 * <ScaleSelector
 *   selectedRoot={selectedRoot}
 *   selectedScale={selectedScale}
 *   rootNotes={rootNotes}
 *   scaleNames={scaleNames}
 *   onRootChange={setSelectedRoot}
 *   onScaleChange={setSelectedScale}
 * />
 * ```
 */
export const ScaleSelector: React.FC<ScaleSelectorProps> = ({
  selectedRoot,
  selectedScale,
  rootNotes,
  scaleNames,
  onRootChange,
  onScaleChange,
  rootColor = 'blue',
  scaleColor = 'indigo',
  showIcon = true
}) => {
  const [showKeyMenu, setShowKeyMenu] = useState(false);
  const [showScaleMenu, setShowScaleMenu] = useState(false);

  // Get display name for scale
  const getScaleDisplayName = (scale: string): string => {
    return SCALE_DISPLAY_NAMES[scale as ScaleName] || scale.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <>
      {/* Root Note Selector */}
      <div className="relative flex">
        <button
          onClick={() => {
            setShowKeyMenu(!showKeyMenu);
            setShowScaleMenu(false);
          }}
          className={`flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-${rootColor}-600 to-${rootColor}-500 hover:from-${rootColor}-700 hover:to-${rootColor}-600 rounded-l-lg transition-all transform hover:scale-105 font-semibold min-h-[44px]`}
          style={{
            backgroundImage: `linear-gradient(to right, rgb(37 99 235), rgb(59 130 246))` // blue-600 to blue-500 fallback
          }}
        >
          {showIcon && <Music className="w-5 h-5" />}
          {selectedRoot}
        </button>

        <button
          onClick={() => {
            setShowKeyMenu(!showKeyMenu);
            setShowScaleMenu(false);
          }}
          className={`flex items-center gap-1 px-2 py-3 bg-gradient-to-r from-${rootColor}-600 to-${rootColor}-500 hover:from-${rootColor}-700 hover:to-${rootColor}-600 rounded-r-lg transition-all transform hover:scale-105 font-semibold border-l border-${rootColor}-700 min-h-[44px]`}
          style={{
            backgroundImage: `linear-gradient(to right, rgb(37 99 235), rgb(59 130 246))`, // blue-600 to blue-500 fallback
            borderLeftColor: 'rgb(29 78 216)' // blue-700 fallback
          }}
        >
          ▼
        </button>

        {showKeyMenu && (
          <div className="absolute top-full mt-2 left-0 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50 max-h-64 overflow-y-auto">
            {rootNotes.map((root) => (
              <button
                key={root}
                onClick={() => {
                  onRootChange(root as RootNote);
                  setShowKeyMenu(false);
                }}
                className={`w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors min-h-[44px] ${
                  selectedRoot === root ? `bg-${rootColor}-900 text-${rootColor}-400` : 'text-white'
                }`}
                style={selectedRoot === root ? {
                  backgroundColor: 'rgb(30 58 138)', // blue-900 fallback
                  color: 'rgb(96 165 250)' // blue-400 fallback
                } : undefined}
              >
                {root}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Scale Selector */}
      <div className="relative flex">
        <button
          onClick={() => {
            setShowScaleMenu(!showScaleMenu);
            setShowKeyMenu(false);
          }}
          className={`flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-${scaleColor}-600 to-${scaleColor}-500 hover:from-${scaleColor}-700 hover:to-${scaleColor}-600 rounded-l-lg transition-all transform hover:scale-105 font-semibold min-h-[44px]`}
          style={{
            backgroundImage: `linear-gradient(to right, rgb(79 70 229), rgb(99 102 241))` // indigo-600 to indigo-500 fallback
          }}
        >
          {showIcon && <Music className="w-5 h-5" />}
          {getScaleDisplayName(selectedScale)}
        </button>

        <button
          onClick={() => {
            setShowScaleMenu(!showScaleMenu);
            setShowKeyMenu(false);
          }}
          className={`flex items-center gap-1 px-2 py-3 bg-gradient-to-r from-${scaleColor}-600 to-${scaleColor}-500 hover:from-${scaleColor}-700 hover:to-${scaleColor}-600 rounded-r-lg transition-all transform hover:scale-105 font-semibold border-l border-${scaleColor}-700 min-h-[44px]`}
          style={{
            backgroundImage: `linear-gradient(to right, rgb(79 70 229), rgb(99 102 241))`, // indigo-600 to indigo-500 fallback
            borderLeftColor: 'rgb(67 56 202)' // indigo-700 fallback
          }}
        >
          ▼
        </button>

        {showScaleMenu && (
          <div className="absolute top-full mt-2 left-0 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50 max-h-64 overflow-y-auto">
            {scaleNames.map((scale) => (
              <button
                key={scale}
                onClick={() => {
                  onScaleChange(scale as ScaleName);
                  setShowScaleMenu(false);
                }}
                className={`w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors min-h-[44px] ${
                  selectedScale === scale ? `bg-${scaleColor}-900 text-${scaleColor}-400` : 'text-white'
                }`}
                style={selectedScale === scale ? {
                  backgroundColor: 'rgb(49 46 129)', // indigo-900 fallback
                  color: 'rgb(129 140 248)' // indigo-400 fallback
                } : undefined}
              >
                {getScaleDisplayName(scale)}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
