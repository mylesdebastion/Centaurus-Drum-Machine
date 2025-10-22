/**
 * WLED Virtual Preview Component
 * Story 6.1: Multi-Client Shared Sessions - Phase 0
 *
 * Canvas-based LED visualization for strips and matrices (similar to WLED app UI)
 */

import React, { useEffect, useState, useRef } from 'react';
import { WLEDVirtualPreviewProps } from './types';

const WLEDVirtualPreview: React.FC<WLEDVirtualPreviewProps> = ({ device, ledColors }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showPlaceholder, setShowPlaceholder] = useState(false);
  const [animationFrame, setAnimationFrame] = useState(0);

  // Show placeholder if no data after 10 seconds
  useEffect(() => {
    if (!ledColors || ledColors.length === 0) {
      const timer = setTimeout(() => setShowPlaceholder(true), 10000);
      return () => clearTimeout(timer);
    } else {
      setShowPlaceholder(false);
    }
  }, [ledColors]);

  // Animate test patterns and waiting states
  useEffect(() => {
    if (device.testPattern === 'rainbow' || device.testPattern === 'solid') {
      const interval = setInterval(() => {
        setAnimationFrame((frame) => frame + 1);
      }, 50); // 50ms = 20 FPS for smooth rainbow
      return () => clearInterval(interval);
    }
  }, [device.testPattern]);

  // Canvas dimensions (thin line style like VirtualLEDStrip)
  const canvasWidth = 400;
  const canvasHeight = 8;

  // Limit LED count for performance
  const maxLEDs = 300;
  const safeLedCount = Math.min(device.ledCount, maxLEDs);
  const isOverLimit = device.ledCount > maxLEDs;
  const ledSize = canvasWidth / safeLedCount;

  // Render canvas for strip visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Helper: Convert hex string to RGB
    const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!result) {
        return { r: 0, g: 0, b: 0 };
      }
      return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      };
    };

    // Helper: Convert HSV to RGB (for rainbow test pattern)
    const hsvToRgb = (h: number, s: number, v: number): { r: number; g: number; b: number } => {
      const c = v * s;
      const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
      const m = v - c;

      let r = 0,
        g = 0,
        b = 0;

      if (h >= 0 && h < 1 / 6) {
        r = c;
        g = x;
        b = 0;
      } else if (h >= 1 / 6 && h < 2 / 6) {
        r = x;
        g = c;
        b = 0;
      } else if (h >= 2 / 6 && h < 3 / 6) {
        r = 0;
        g = c;
        b = x;
      } else if (h >= 3 / 6 && h < 4 / 6) {
        r = 0;
        g = x;
        b = c;
      } else if (h >= 4 / 6 && h < 5 / 6) {
        r = x;
        g = 0;
        b = c;
      } else {
        r = c;
        g = 0;
        b = x;
      }

      return {
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255),
      };
    };

    // Generate LED array
    const ledArray: { r: number; g: number; b: number }[] = [];

    // Test pattern mode
    if (device.testPattern === 'rainbow') {
      // Rainbow test pattern (animated)
      const time = animationFrame * 0.05;
      for (let i = 0; i < safeLedCount; i++) {
        const hue = ((i / safeLedCount) + time) % 1.0;
        const color = hsvToRgb(hue, 1.0, 1.0);
        ledArray.push(color);
      }
    } else if (device.testPattern === 'solid') {
      // Solid color test (use first LED color or white)
      const solidColor = ledColors && ledColors.length > 0 ? hexToRgb(ledColors[0]) : { r: 255, g: 255, b: 255 };
      for (let i = 0; i < safeLedCount; i++) {
        ledArray.push(solidColor);
      }
    } else if (ledColors && ledColors.length > 0) {
      // Normal mode: use provided LED data
      for (let i = 0; i < safeLedCount; i++) {
        const hexColor = ledColors[i] || '000000';
        const color = hexToRgb(hexColor);
        ledArray.push(color);
      }
    } else {
      // No data: all LEDs off (dark gray)
      for (let i = 0; i < safeLedCount; i++) {
        ledArray.push({ r: 0, g: 0, b: 0 });
      }
    }

    // Draw LEDs on canvas (thin line style)
    for (let i = 0; i < safeLedCount; i++) {
      const led = ledArray[i];
      const x = i * ledSize;
      const y = 0;
      const width = Math.max(1, Math.floor(ledSize));

      // Apply brightness multiplier for screen visibility (2.5x like VirtualLEDStrip)
      if (led.r === 0 && led.g === 0 && led.b === 0) {
        ctx.fillStyle = '#1a1a1a'; // Dark background for off LEDs
      } else {
        const brightnessMultiplier = 2.5;
        const brightR = Math.min(255, Math.round(led.r * brightnessMultiplier));
        const brightG = Math.min(255, Math.round(led.g * brightnessMultiplier));
        const brightB = Math.min(255, Math.round(led.b * brightnessMultiplier));
        ctx.fillStyle = `rgb(${brightR}, ${brightG}, ${brightB})`;
      }

      ctx.fillRect(x, y, width, canvasHeight);
    }
  }, [device, ledColors, animationFrame, safeLedCount, ledSize]);

  // Skeleton loader during connection
  if (device.connectionStatus === 'connecting') {
    return (
      <div className="relative w-full h-8 bg-gray-800 rounded-lg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />
      </div>
    );
  }

  // Placeholder when no data after timeout
  if (showPlaceholder && (!ledColors || ledColors.length === 0) && !device.testPattern) {
    return (
      <div className="w-full h-8 bg-gray-800 rounded-lg flex items-center justify-center">
        <p className="text-gray-500 text-xs">Waiting for audio data...</p>
      </div>
    );
  }

  // Render matrix (2D) - Future enhancement
  if (device.deviceType === 'matrix' && device.matrixConfig) {
    return (
      <div className="w-full bg-gray-800 rounded-lg p-2">
        <p className="text-xs text-gray-500 text-center">Matrix visualization coming soon</p>
      </div>
    );
  }

  // Render strip (1D canvas) - default for 'strip' and 'auto'
  return (
    <div className="w-full">
      <div className="w-full bg-gray-900 border border-gray-700 rounded p-1 relative">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="w-full block"
          style={{
            imageRendering: 'pixelated',
            height: `${canvasHeight}px`,
          }}
        />
        {/* Direction indicator */}
        <div className="absolute top-0 right-1 text-xs text-gray-500">
          {device.reverseDirection ? '→' : '←'}
        </div>
        {/* LED limit warning */}
        {isOverLimit && (
          <div className="absolute top-0 left-1 text-xs text-yellow-400">
            ⚠️ {maxLEDs}
          </div>
        )}
      </div>
    </div>
  );
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
