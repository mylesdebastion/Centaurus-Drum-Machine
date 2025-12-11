/**
 * WLED Direct Connection Experiment
 *
 * Proof of concept for direct mobile → WLED communication without bridge.
 * Tests WebSocket connection to WLED's native /ws endpoint.
 *
 * Goal: Validate mobile devices can control WLED controllers directly
 * for future multi-client architecture where each user owns their devices.
 *
 * Story 6.1 Phase 0: Now using unified WLEDDeviceManager component
 */

import React, { useState, useRef } from 'react';
import { ArrowLeft, Info } from 'lucide-react';
import WLEDDeviceManager from '../WLED/WLEDDeviceManager';

interface WLEDDirectTestProps {
  onBack: () => void;
}

export const WLEDDirectTest: React.FC<WLEDDirectTestProps> = ({ onBack }) => {
  const [testMode, setTestMode] = useState<'idle' | 'rainbow'>('idle');
  const animationFrameRef = useRef<number>();
  const [ledColors, setLedColors] = useState<string[]>([]);

  // Generate rainbow LED data
  // Generate enough colors for typical LED strips (up to 150 LEDs)
  // WLEDDeviceManager will slice to the configured device LED count
  const generateRainbowColors = (hue: number): string[] => {
    const colors: string[] = [];
    for (let i = 0; i < 150; i++) {
      const h = (hue + i * 6) % 360;
      const rgb = hslToRgb(h / 360, 1, 0.5);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      colors.push(hex);
    }
    return colors;
  };

  // Test: Rainbow animation
  const startRainbowTest = () => {
    setTestMode('rainbow');
    let hue = 0;

    const animate = () => {
      const colors = generateRainbowColors(hue);
      setLedColors(colors);
      hue = (hue + 2) % 360;
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();
  };

  // Stop all tests
  const stopTest = () => {
    setTestMode('idle');
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setLedColors([]);
  };

  // Helper: HSL to RGB
  const hslToRgb = (h: number, s: number, l: number) => {
    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  };

  // Helper: RGB to Hex
  const rgbToHex = (r: number, g: number, b: number): string => {
    return [r, g, b]
      .map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
      .toLowerCase();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </button>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            WLED Direct Connection Test
          </h1>
          <p className="text-gray-400">
            Proof of concept: Mobile → WLED WebSocket (no bridge)
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-200">
              <p className="font-semibold mb-1">Experiment Goal (Story 22.2):</p>
              <p>
                Test direct browser → WLED communication using the HTTP JSON API, eliminating
                the need for the Node.js wled-bridge. This proves that Rainbow animations and
                LED streaming can work without server infrastructure, enabling future mobile/remote
                scenarios and validating the Epic 6 multi-client session architecture.
              </p>
              <p className="mt-2 font-semibold text-green-300">
                ✅ Implementation Complete: Now using direct HTTP POST to WLED's /json/state
                endpoint with hex color format for efficient LED data transmission.
              </p>
            </div>
          </div>
        </div>

        {/* WLED Device Manager */}
        <div className="mb-6">
          <WLEDDeviceManager
            ledData={ledColors}
            layout="desktop"
            storageKey="wled-test-devices"
            deviceType="strip"
            showVirtualPreview={true}
          />
        </div>

        {/* Test Controls */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-6">
          <h2 className="text-xl font-bold mb-4 text-white">Tests</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white">Rainbow Animation</h3>
                <p className="text-sm text-gray-400">
                  Animated rainbow pattern (adapts to device LED count)
                </p>
              </div>
              {testMode === 'rainbow' ? (
                <button
                  onClick={stopTest}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  Stop
                </button>
              ) : (
                <button
                  onClick={startRainbowTest}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                  disabled={testMode !== 'idle'}
                >
                  Start
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Technical Notes */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-bold mb-4 text-white">Technical Notes</h2>
          <div className="space-y-3 text-sm text-gray-300">
            <div>
              <span className="font-semibold text-white">Architecture:</span> Unified
              WLEDDeviceManager component (Story 6.1 Phase 0)
            </div>
            <div>
              <span className="font-semibold text-green-400">✅ NEW (Story 22.2):</span> Direct
              HTTP JSON API (no wled-bridge required!)
            </div>
            <div>
              <span className="font-semibold text-white">Connection:</span> Direct HTTP POST
              to <code className="bg-gray-700 px-2 py-1 rounded">http://[ip]/json/state</code>
            </div>
            <div>
              <span className="font-semibold text-white">Protocol:</span> WLED JSON API{' '}
              <code className="bg-gray-700 px-2 py-1 rounded">
                {`{"seg":{"i":["FF0000","00FF00",..."]}}`}
              </code>
            </div>
            <div>
              <span className="font-semibold text-white">Format:</span> Hex colors (6 chars per
              LED) - efficient for large LED counts
            </div>
            <div>
              <span className="font-semibold text-white">Fallback:</span> WebSocket bridge (if
              HTTP fails)
            </div>
            <div>
              <span className="font-semibold text-white">Features:</span> Multi-device support,
              responsive grid, localStorage persistence, auto-reconnect
            </div>
            <div>
              <span className="font-semibold text-white">Performance:</span> Expected 20-40 FPS
              for HTTP, check browser DevTools console for actual FPS
            </div>
            <div>
              <span className="font-semibold text-white">Security:</span> Requires Chrome "Local
              Network Access" permission (works in localhost development)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
