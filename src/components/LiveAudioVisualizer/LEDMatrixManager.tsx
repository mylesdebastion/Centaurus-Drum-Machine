/**
 * LEDMatrixManager - 2D LED matrix output via WLED websocket bridge
 *
 * Features:
 * - Matrix configuration (width × height, IP address)
 * - 2D grid → 1D array conversion for WLED
 * - WebSocket integration with WLED bridge
 * - Virtual matrix preview
 * - Support for horizontal/vertical orientation
 */

import React, { useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff, Eye, EyeOff, Settings } from 'lucide-react';

export interface LEDMatrixConfig {
  width: number;
  height: number;
  ipAddress: string;
  orientation: 'horizontal' | 'vertical';
  serpentine: boolean; // Zigzag wiring pattern (common in LED matrices)
  reverse: boolean; // When false (default): reversed for bottom-to-top wiring. When true: normal top-to-bottom
  enabled: boolean;
}

interface LEDMatrixManagerProps {
  onConfigChange?: (config: LEDMatrixConfig) => void;
  className?: string;
}

const DEFAULT_CONFIG: LEDMatrixConfig = {
  width: 1,
  height: 90,
  ipAddress: '192.168.8.158',
  orientation: 'horizontal',
  serpentine: true,
  reverse: false,
  enabled: true,
};

interface RGB {
  r: number;
  g: number;
  b: number;
}

export const LEDMatrixManager: React.FC<LEDMatrixManagerProps> = ({
  onConfigChange,
  className = '',
}) => {
  const [config, setConfig] = useState<LEDMatrixConfig>(DEFAULT_CONFIG);
  const [wsConnected, setWsConnected] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [previewData, setPreviewData] = useState<RGB[][]>([]);

  const wsRef = useRef<WebSocket | null>(null);

  // Initialize preview grid
  useEffect(() => {
    const grid: RGB[][] = [];
    for (let y = 0; y < config.height; y++) {
      grid[y] = [];
      for (let x = 0; x < config.width; x++) {
        grid[y][x] = { r: 0, g: 0, b: 0 };
      }
    }
    setPreviewData(grid);
  }, [config.width, config.height]);

  // Connect to WLED WebSocket bridge (use global window.wledBridge)
  useEffect(() => {
    if (!config.enabled) {
      setWsConnected(false);
      return;
    }

    // Try to use existing global bridge connection
    const connectBridge = async () => {
      // Check if global bridge exists and is open
      if (window.wledBridge && window.wledBridge.readyState === WebSocket.OPEN) {
        console.log('🌉 Using existing WLED WebSocket bridge');
        wsRef.current = window.wledBridge;
        setWsConnected(true);
        return;
      }

      // Try to connect to bridge on multiple ports
      const ports = [8080, 21325, 21326, 21327, 21328, 21329];

      for (const port of ports) {
        try {
          await tryConnect(port);
          console.log(`🌉 Connected to WLED WebSocket bridge on port ${port}`);
          return;
        } catch (error) {
          console.log(`⚠️ Port ${port} not available, trying next...`);
        }
      }

      console.error('❌ Could not connect to WLED WebSocket bridge on any port');
      setWsConnected(false);
    };

    const tryConnect = (port: number): Promise<void> => {
      return new Promise((resolve, reject) => {
        // Auto-detect protocol: use wss:// on HTTPS pages, ws:// on HTTP pages
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ws = new WebSocket(`${protocol}//localhost:${port}`);
        let connected = false;

        const timeout = setTimeout(() => {
          if (!connected) {
            ws.close();
            reject(new Error(`Connection timeout on port ${port}`));
          }
        }, 1000);

        ws.onopen = () => {
          connected = true;
          clearTimeout(timeout);
          window.wledBridge = ws;
          wsRef.current = ws;
          setWsConnected(true);
          resolve();
        };

        ws.onerror = () => {
          clearTimeout(timeout);
          reject(new Error(`Connection failed on port ${port}`));
        };

        ws.onclose = () => {
          console.log('🔌 WebSocket bridge disconnected');
          if (wsRef.current === ws) {
            wsRef.current = null;
            setWsConnected(false);
          }
        };
      });
    };

    connectBridge();

    // Don't close the global bridge on unmount - other components might use it
    return () => {
      // Just clear our ref, don't close the global bridge
      wsRef.current = null;
    };
  }, [config.enabled]);

  // Notify parent of config changes
  useEffect(() => {
    if (onConfigChange) {
      onConfigChange(config);
    }
  }, [config, onConfigChange]);

  /**
   * Convert 2D grid to 1D array for WLED (handles serpentine wiring)
   */
  const gridToLinear = (grid: RGB[][]): RGB[] => {
    const linear: RGB[] = [];
    const { width, height, serpentine, orientation } = config;

    if (orientation === 'horizontal') {
      // Horizontal orientation: rows go left-to-right (or zigzag)
      for (let y = 0; y < height; y++) {
        const row = grid[y] || [];
        if (serpentine && y % 2 === 1) {
          // Odd rows: reverse direction (zigzag)
          for (let x = width - 1; x >= 0; x--) {
            linear.push(row[x] || { r: 0, g: 0, b: 0 });
          }
        } else {
          // Even rows: normal direction
          for (let x = 0; x < width; x++) {
            linear.push(row[x] || { r: 0, g: 0, b: 0 });
          }
        }
      }
    } else {
      // Vertical orientation: columns go top-to-bottom (or zigzag)
      for (let x = 0; x < width; x++) {
        if (serpentine && x % 2 === 1) {
          // Odd columns: reverse direction (zigzag)
          for (let y = height - 1; y >= 0; y--) {
            linear.push((grid[y] && grid[y][x]) || { r: 0, g: 0, b: 0 });
          }
        } else {
          // Even columns: normal direction
          for (let y = 0; y < height; y++) {
            linear.push((grid[y] && grid[y][x]) || { r: 0, g: 0, b: 0 });
          }
        }
      }
    }

    return linear;
  };

  /**
   * Send matrix data to WLED via websocket bridge
   */
  const sendToWLED = (grid: RGB[][]) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('WLED WebSocket not connected');
      return;
    }

    const linearData = gridToLinear(grid);

    // Reverse the array by default (for bottom-to-top LED wiring)
    // Only skip reversal if "reverse" is explicitly checked
    if (!config.reverse) {
      linearData.reverse();
    }

    const message = {
      ipAddress: config.ipAddress,
      ledData: linearData,
    };

    wsRef.current.send(JSON.stringify(message));
    setPreviewData(grid); // Update preview
  };

  /**
   * Expose sendToWLED for parent component
   */
  useEffect(() => {
    // Attach sendToWLED to window for external access (hack for now)
    (window as any).ledMatrixManager = {
      sendToWLED,
      getConfig: () => config,
    };
  }, [config]);

  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-white">LED Matrix Output</h3>
          {wsConnected ? (
            <div className="flex items-center gap-1 text-green-400 text-sm">
              <Wifi className="w-4 h-4" />
              <span>Connected</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-gray-500 text-sm">
              <WifiOff className="w-4 h-4" />
              <span>Disconnected</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title={showPreview ? 'Hide preview' : 'Show preview'}
          >
            {showPreview ? (
              <Eye className="w-4 h-4 text-gray-400" />
            ) : (
              <EyeOff className="w-4 h-4 text-gray-400" />
            )}
          </button>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="Configure matrix"
          >
            <Settings className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={() => setConfig({ ...config, enabled: !config.enabled })}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              config.enabled
                ? 'bg-green-600 hover:bg-green-500 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            {config.enabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>
      </div>

      {/* Configuration Panel */}
      {showConfig && (
        <div className="p-4 border-b border-gray-700 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Width (LEDs)</label>
            <input
              type="number"
              min="1"
              max="256"
              value={config.width}
              onChange={(e) => setConfig({ ...config, width: parseInt(e.target.value) || 90 })}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Height (LEDs)</label>
            <input
              type="number"
              min="1"
              max="64"
              value={config.height}
              onChange={(e) => setConfig({ ...config, height: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-gray-400 mb-1">IP Address</label>
            <input
              type="text"
              value={config.ipAddress}
              onChange={(e) => setConfig({ ...config, ipAddress: e.target.value })}
              placeholder="192.168.8.160"
              className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-primary-500 focus:outline-none font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Orientation</label>
            <select
              value={config.orientation}
              onChange={(e) =>
                setConfig({ ...config, orientation: e.target.value as 'horizontal' | 'vertical' })
              }
              className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-primary-500 focus:outline-none"
            >
              <option value="horizontal">Horizontal</option>
              <option value="vertical">Vertical</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="serpentine"
              checked={config.serpentine}
              onChange={(e) => setConfig({ ...config, serpentine: e.target.checked })}
              className="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500"
            />
            <label htmlFor="serpentine" className="text-sm text-gray-400">
              Serpentine wiring
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="reverse"
              checked={config.reverse}
              onChange={(e) => setConfig({ ...config, reverse: e.target.checked })}
              className="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500"
            />
            <label htmlFor="reverse" className="text-sm text-gray-400">
              Reverse output
            </label>
          </div>
        </div>
      )}

      {/* Virtual Matrix Preview */}
      {showPreview && (
        <div className="p-4">
          <div className="bg-gray-900 rounded p-2 inline-block">
            <div
              className="grid gap-0.5"
              style={{
                gridTemplateColumns: `repeat(${config.width}, minmax(0, 1fr))`,
              }}
            >
              {previewData.map((row, y) =>
                row.map((pixel, x) => (
                  <div
                    key={`${x}-${y}`}
                    className="w-3 h-3 rounded-sm"
                    style={{
                      backgroundColor: `rgb(${pixel.r}, ${pixel.g}, ${pixel.b})`,
                    }}
                  />
                ))
              )}
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {config.width}×{config.height} = {config.width * config.height} LEDs
          </div>
        </div>
      )}
    </div>
  );
};

export default LEDMatrixManager;
