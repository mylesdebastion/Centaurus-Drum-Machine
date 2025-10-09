/**
 * WLED Direct Connection Experiment
 *
 * Proof of concept for direct mobile → WLED communication without bridge.
 * Tests WebSocket connection to WLED's native /ws endpoint.
 *
 * Goal: Validate mobile devices can control WLED controllers directly
 * for future multi-client architecture where each user owns their devices.
 */

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Wifi, WifiOff, Zap, Info } from 'lucide-react';

interface WLEDDirectTestProps {
  onBack: () => void;
}

interface WLEDConnection {
  ip: string;
  ws: WebSocket | null;
  connected: boolean;
  lastError: string | null;
}

export const WLEDDirectTest: React.FC<WLEDDirectTestProps> = ({ onBack }) => {
  const [wledIP, setWledIP] = useState('192.168.8.158'); // Default from LEDMatrixManager
  const [connection, setConnection] = useState<WLEDConnection>({
    ip: '',
    ws: null,
    connected: false,
    lastError: null,
  });
  const [testMode, setTestMode] = useState<'idle' | 'rainbow' | 'audio'>('idle');
  const [fps, setFps] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const animationFrameRef = useRef<number>();
  const fpsCounterRef = useRef({ frames: 0, lastTime: Date.now() });

  // Connect to WLED WebSocket
  const connectToWLED = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('Already connected');
      return;
    }

    try {
      // WLED WebSocket endpoint
      const wsUrl = `ws://${wledIP}/ws`;
      console.log(`🔌 Connecting to WLED at ${wsUrl}`);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ Connected to WLED');
        setConnection({
          ip: wledIP,
          ws,
          connected: true,
          lastError: null,
        });

        // Request initial state
        ws.send(JSON.stringify({ v: true }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📥 WLED state:', data);
        } catch (e) {
          console.warn('Failed to parse WLED message:', e);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setConnection(prev => ({
          ...prev,
          connected: false,
          lastError: 'Connection failed - check IP and network',
        }));
      };

      ws.onclose = () => {
        console.log('🔌 Disconnected from WLED');
        setConnection(prev => ({
          ...prev,
          connected: false,
          ws: null,
        }));
        wsRef.current = null;
      };
    } catch (error) {
      console.error('❌ Failed to create WebSocket:', error);
      setConnection(prev => ({
        ...prev,
        connected: false,
        lastError: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  };

  // Disconnect from WLED
  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setTestMode('idle');
    setConnection(prev => ({
      ...prev,
      connected: false,
      ws: null,
    }));
  };

  // Send LED data to WLED using JSON API
  const sendLEDData = (colors: string[]) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected');
      return;
    }

    try {
      // WLED JSON API: Set individual LED colors
      // Format: {"seg":{"i":["FF0000","00FF00","0000FF"]}}
      const message = {
        seg: {
          i: colors,
        },
      };

      wsRef.current.send(JSON.stringify(message));

      // Update FPS counter
      fpsCounterRef.current.frames++;
      const now = Date.now();
      if (now - fpsCounterRef.current.lastTime >= 1000) {
        setFps(fpsCounterRef.current.frames);
        fpsCounterRef.current.frames = 0;
        fpsCounterRef.current.lastTime = now;
      }
    } catch (error) {
      console.error('❌ Failed to send LED data:', error);
    }
  };

  // Test: Rainbow animation
  const startRainbowTest = () => {
    setTestMode('rainbow');
    let hue = 0;

    const animate = () => {
      // Generate 90 LEDs with rainbow pattern
      const colors: string[] = [];
      for (let i = 0; i < 90; i++) {
        const h = (hue + i * 4) % 360;
        const rgb = hslToRgb(h / 360, 1, 0.5);
        const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
        colors.push(hex);
      }

      sendLEDData(colors);
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
    // Turn off all LEDs
    const black = Array(90).fill('000000');
    sendLEDData(black);
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
      .toUpperCase();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

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
          <div className="flex items-center gap-2">
            {connection.connected ? (
              <Wifi className="w-5 h-5 text-green-400" />
            ) : (
              <WifiOff className="w-5 h-5 text-gray-500" />
            )}
          </div>
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
              <p className="font-semibold mb-1">Experiment Goal:</p>
              <p>
                Test if mobile browsers can control WLED devices directly via WebSocket,
                eliminating the need for a Node.js bridge. This validates the architecture
                for future multi-client sessions where each user controls their own WLED
                devices.
              </p>
            </div>
          </div>
        </div>

        {/* Connection Panel */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-6">
          <h2 className="text-xl font-bold mb-4 text-white">Connection</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                WLED Device IP Address
              </label>
              <input
                type="text"
                value={wledIP}
                onChange={(e) => setWledIP(e.target.value)}
                placeholder="192.168.1.100"
                disabled={connection.connected}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none disabled:opacity-50"
              />
            </div>

            {connection.lastError && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                <p className="text-sm text-red-300">{connection.lastError}</p>
              </div>
            )}

            {connection.connected ? (
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                  <p className="text-sm text-green-300">
                    ✅ Connected to {connection.ip}
                  </p>
                </div>
                <button
                  onClick={disconnect}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connectToWLED}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                Connect to WLED
              </button>
            )}
          </div>
        </div>

        {/* Test Controls */}
        {connection.connected && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-6">
            <h2 className="text-xl font-bold mb-4 text-white">Tests</h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">Rainbow Animation</h3>
                  <p className="text-sm text-gray-400">
                    Animated rainbow pattern across 90 LEDs
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

              <div className="bg-gray-700/50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Frame Rate:</span>
                  <span className="text-lg font-bold text-white">{fps} FPS</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Technical Notes */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-bold mb-4 text-white">Technical Notes</h2>
          <div className="space-y-3 text-sm text-gray-300">
            <div>
              <span className="font-semibold text-white">Connection:</span> Direct WebSocket
              to <code className="bg-gray-700 px-2 py-1 rounded">ws://[ip]/ws</code>
            </div>
            <div>
              <span className="font-semibold text-white">Protocol:</span> WLED JSON API{' '}
              <code className="bg-gray-700 px-2 py-1 rounded">
                {`{"seg":{"i":["FF0000",..."]}}`}
              </code>
            </div>
            <div>
              <span className="font-semibold text-white">Target:</span> 30 FPS for 90 LEDs (~8
              KB/s)
            </div>
            <div>
              <span className="font-semibold text-white">Next Step:</span> Integrate with live
              audio analysis for audio-reactive lighting
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
