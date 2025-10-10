/**
 * WLED Virtual Preview Component
 * Story 6.1: Multi-Client Shared Sessions - Phase 0
 *
 * Displays virtual LED visualization for strips and matrices
 */

import React, { useEffect, useState } from 'react';
import { WLEDVirtualPreviewProps } from './types';

const WLEDVirtualPreview: React.FC<WLEDVirtualPreviewProps> = ({ device, ledColors }) => {
  const [showPlaceholder, setShowPlaceholder] = useState(false);

  // Show placeholder if no data after 10 seconds
  useEffect(() => {
    if (!ledColors || ledColors.length === 0) {
      const timer = setTimeout(() => setShowPlaceholder(true), 10000);
      return () => clearTimeout(timer);
    } else {
      setShowPlaceholder(false);
    }
  }, [ledColors]);

  // Skeleton loader during connection
  if (device.connectionStatus === 'connecting') {
    return (
      <div className="relative w-full h-24 bg-gray-800 rounded-lg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />
      </div>
    );
  }

  // Placeholder when no data after timeout
  if (showPlaceholder && (!ledColors || ledColors.length === 0)) {
    return (
      <div className="w-full h-24 bg-gray-800 rounded-lg flex items-center justify-center">
        <p className="text-gray-500 text-sm">Waiting for audio data...</p>
      </div>
    );
  }

  // Generate colors array (use provided or default gray)
  const colors = ledColors || Array(device.ledCount).fill('4a5568'); // gray-600

  // Render strip (1D)
  if (device.deviceType === 'strip') {
    return (
      <div className="w-full bg-gray-800 rounded-lg p-2">
        <div className="flex gap-0.5 overflow-x-auto">
          {colors.slice(0, device.ledCount).map((color, index) => (
            <div
              key={index}
              className="min-w-[4px] h-12 rounded-sm transition-colors duration-100"
              style={{ backgroundColor: `#${color}` }}
              title={`LED ${index}: #${color}`}
            />
          ))}
        </div>
      </div>
    );
  }

  // Render matrix (2D)
  if (device.deviceType === 'matrix' && device.matrixConfig) {
    const { width, height, serpentine } = device.matrixConfig;

    // Convert 1D array to 2D grid
    const grid: string[][] = [];
    for (let y = 0; y < height; y++) {
      const row: string[] = [];
      for (let x = 0; x < width; x++) {
        let index: number;

        if (serpentine && y % 2 === 1) {
          // Reverse direction for odd rows
          index = y * width + (width - 1 - x);
        } else {
          index = y * width + x;
        }

        row.push(colors[index] || '4a5568');
      }
      grid.push(row);
    }

    return (
      <div className="w-full bg-gray-800 rounded-lg p-2">
        <div className="flex flex-col gap-0.5">
          {grid.map((row, y) => (
            <div key={y} className="flex gap-0.5">
              {row.map((color, x) => (
                <div
                  key={x}
                  className="w-4 h-4 rounded-sm transition-colors duration-100"
                  style={{ backgroundColor: `#${color}` }}
                  title={`LED [${x},${y}]: #${color}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

// Add shimmer animation to global styles if not already present
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;
  const existingStyle = document.querySelector('style[data-wled-animations]');
  if (!existingStyle) {
    style.setAttribute('data-wled-animations', 'true');
    document.head.appendChild(style);
  }
}

export default WLEDVirtualPreview;
