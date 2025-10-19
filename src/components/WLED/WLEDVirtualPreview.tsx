/**
 * WLED Virtual Preview Component
 * Story 6.1: Multi-Client Shared Sessions - Phase 0
 *
 * Canvas-based LED visualization for strips and matrices (similar to WLED app UI)
 */

import React, { useEffect, useState, useRef } from 'react';
import { WLEDVirtualPreviewProps } from './types';
import { ledCompositor } from '@/services/LEDCompositor';
import type { CompositorEvent } from '@/services/LEDCompositor';

const WLEDVirtualPreview: React.FC<WLEDVirtualPreviewProps> = ({ device, ledColors, showLivePreview = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [compositedColors, setCompositedColors] = useState<string[]>([]);


  // Subscribe to compositor events for live preview (Story 18.8)
  useEffect(() => {
    if (!showLivePreview) return;

    const handleCompositedFrame = (event: CompositorEvent) => {
      if (event.type !== 'composited-frame') return;
      if (event.deviceId !== device.id) return; // Filter by device

      // Convert Uint8ClampedArray [R, G, B, ...] → string[] ["#RRGGBB", ...]
      const hexColors: string[] = [];
      for (let i = 0; i < event.pixelData.length; i += 3) {
        const r = event.pixelData[i].toString(16).padStart(2, '0');
        const g = event.pixelData[i + 1].toString(16).padStart(2, '0');
        const b = event.pixelData[i + 2].toString(16).padStart(2, '0');
        hexColors.push(`#${r}${g}${b}`);
      }

      // Update state (triggers canvas re-render)
      setCompositedColors(hexColors);
    };

    ledCompositor.addEventListener(handleCompositedFrame);
    return () => ledCompositor.removeEventListener(handleCompositedFrame);
  }, [device.id, showLivePreview]);

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

    // Generate LED array
    const ledArray: { r: number; g: number; b: number }[] = [];

    // Determine which color source to use
    const activeColors = showLivePreview && compositedColors.length > 0 ? compositedColors : ledColors;

    // Display actual pixel data (no invented animations)
    if (activeColors && activeColors.length > 0) {
      // Show provided LED data (from compositor events or manual data)
      for (let i = 0; i < safeLedCount; i++) {
        const hexColor = activeColors[i] || '000000';
        const color = hexToRgb(hexColor);
        ledArray.push(color);
      }
    } else {
      // No data: all LEDs off (dark gray)
      for (let i = 0; i < safeLedCount; i++) {
        ledArray.push({ r: 0, g: 0, b: 0 });
      }
    }

    // Apply reverse direction (same as isometric implementation)
    if (device.reverseDirection) {
      ledArray.reverse();
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
  }, [device, ledColors, compositedColors, showLivePreview, safeLedCount, ledSize]);

  // Skeleton loader during connection
  if (device.connectionStatus === 'connecting') {
    return (
      <div className="relative w-full h-8 bg-gray-800 rounded-lg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />
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
