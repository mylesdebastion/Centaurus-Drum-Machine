/**
 * WLED Device Manager Component
 * Story 6.1: Multi-Client Shared Sessions - Phase 0
 *
 * Main component managing WLED devices with WebSocket/UDP WARLS protocol,
 * localStorage persistence, and inline row layout (similar to WLED app UI)
 */

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Wifi, WifiOff, Play, Trash2, Settings } from 'lucide-react';
import { WLEDDevice, WLEDDeviceManagerProps } from './types';
import WLEDVirtualPreview from './WLEDVirtualPreview';

// Extend Window interface for wledBridge
declare global {
  interface Window {
    wledBridge?: WebSocket | null;
  }
}

const WLEDDeviceManager: React.FC<WLEDDeviceManagerProps> = ({
  ledData,
  layout: _layout = 'desktop', // Reserved for responsive layout switching
  storageKey,
  deviceType = 'auto',
  maxDevices = 10,
  showVirtualPreview: _showVirtualPreview = true, // Reserved for toggling preview visibility
  compactMode: _compactMode = false, // Reserved for future compact UI mode
}) => {
  const [devices, setDevices] = useState<WLEDDevice[]>([]);
  const [expandedSettings, setExpandedSettings] = useState<Set<string>>(new Set());
  const [bridgeConnected, setBridgeConnected] = useState(false);

  // FPS counter timers
  const fpsTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Load devices from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setDevices(parsed);
      } catch (error) {
        console.error('Failed to load WLED devices:', error);
      }
    }
  }, [storageKey]);

  // Save devices to localStorage on changes
  useEffect(() => {
    if (devices.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(devices));
    }
  }, [devices, storageKey]);

  // Auto-test connection for enabled devices
  useEffect(() => {
    devices.forEach((device) => {
      if (device.enabled && device.connectionStatus === 'idle') {
        testConnection(device.id);
      }
    });
  }, [devices]);

  // Connect to WLED WebSocket bridge
  useEffect(() => {
    // Check if bridge is already connected
    if (window.wledBridge && window.wledBridge.readyState === WebSocket.OPEN) {
      console.log('🌉 Using existing WLED WebSocket bridge');
      setBridgeConnected(true);
      return;
    }

    const connectBridge = async () => {
      // Smart host detection for seamless desktop/mobile support
      const hosts: string[] = [];

      // 1. Try last successful host from localStorage
      const lastSuccessfulHost = localStorage.getItem('wledBridgeHost');
      if (lastSuccessfulHost) {
        hosts.push(lastSuccessfulHost);
      }

      // 2. Try localhost (works for desktop browsers)
      if (!hosts.includes('localhost')) {
        hosts.push('localhost');
      }

      // 3. Try window.location.hostname (works for mobile accessing dev server on network)
      const pageHost = window.location.hostname;
      if (pageHost !== 'localhost' && pageHost !== '127.0.0.1' && !hosts.includes(pageHost)) {
        hosts.push(pageHost);
      }

      // Try to connect to bridge on multiple ports and hosts
      const ports = [8080, 21325, 21326, 21327, 21328, 21329];

      for (const host of hosts) {
        for (const port of ports) {
          try {
            await tryConnect(host, port);
            console.log(`🌉 Connected to WLED WebSocket bridge at ${host}:${port}`);
            localStorage.setItem('wledBridgeHost', host);
            setBridgeConnected(true);
            return;
          } catch (error) {
            // Silent fail, try next
          }
        }
      }

      console.warn('⚠️ Could not connect to WLED WebSocket bridge');
      setBridgeConnected(false);
    };

    const tryConnect = (host: string, port: number): Promise<void> => {
      return new Promise((resolve, reject) => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ws = new WebSocket(`${protocol}//${host}:${port}`);
        let connected = false;

        const timeout = setTimeout(() => {
          if (!connected) {
            ws.close();
            reject(new Error(`Timeout`));
          }
        }, 500); // Faster timeout for quicker port scanning

        ws.onopen = () => {
          connected = true;
          clearTimeout(timeout);
          window.wledBridge = ws;

          // Set up persistent close handler for successful connection
          ws.onclose = () => {
            console.log('🔌 WebSocket bridge disconnected');
            if (window.wledBridge === ws) {
              window.wledBridge = null;
              setBridgeConnected(false);
            }
          };

          resolve();
        };

        ws.onerror = () => {
          if (!connected) {
            clearTimeout(timeout);
            ws.close();
            reject(new Error(`Failed`));
          }
        };

        // For failed connections, don't log disconnect
        ws.onclose = () => {
          if (!connected) {
            // Connection never succeeded, just cleanup
            clearTimeout(timeout);
          }
        };
      });
    };

    connectBridge();

    // Monitor bridge status
    const statusInterval = setInterval(() => {
      const isConnected = window.wledBridge?.readyState === WebSocket.OPEN;
      setBridgeConnected(isConnected);
    }, 2000);

    // Cleanup: don't close global bridge, other components might use it
    return () => {
      clearInterval(statusInterval);
    };
  }, []); // Empty deps - only run once on mount

  // Send LED data to all connected devices
  useEffect(() => {
    if (!ledData || ledData.length === 0) return;

    devices.forEach((device) => {
      if (
        device.enabled &&
        device.connectionStatus === 'connected' &&
        !device.mute
      ) {
        sendLEDData(device.id, ledData);
      }
    });
  }, [ledData, devices]);

  // Test connection to WLED device via HTTP
  const testConnection = async (deviceId: string) => {
    const device = devices.find((d) => d.id === deviceId);
    if (!device) return;

    updateDevice(deviceId, { connectionStatus: 'connecting' });

    const url = `http://${device.ip}:${device.port || 80}/json/info`;
    console.log(`🔍 Testing connection to: ${url}`);

    try {
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors', // Explicitly request CORS
        signal: AbortSignal.timeout(10000), // Increase to 10 second timeout
      });

      console.log(`📡 Response status: ${response.status}`, response);

      if (response.ok) {
        const info = await response.json();
        console.log(`✅ Connected to WLED device: ${info.name || device.name}`, info);
        updateDevice(deviceId, {
          connectionStatus: 'connected',
          lastError: undefined,
          name: info.name || device.name, // Update name from device
        });
      } else {
        const errorText = await response.text();
        console.error(`❌ HTTP ${response.status}:`, errorText);
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ WLED connection error for ${device.name}:`, error);

      // Detailed error logging
      if (error instanceof TypeError) {
        console.error('🔴 TypeError - likely CORS or network issue:', error.message);
      } else if (error instanceof DOMException) {
        console.error('🔴 DOMException - likely timeout or abort:', error.message);
      }

      updateDevice(deviceId, {
        connectionStatus: 'error',
        lastError: error instanceof Error ? error.message : 'Connection failed',
      });
    }
  };

  // Send LED data to device via WebSocket/UDP WARLS protocol
  const sendLEDData = async (deviceId: string, colors: string[]) => {
    const device = devices.find((d) => d.id === deviceId);
    if (!device || device.connectionStatus !== 'connected') {
      console.log(`📍 sendLEDData early return: device=${!!device}, connected=${device?.connectionStatus === 'connected'}`);
      return;
    }

    try {
      // Check if WebSocket bridge is available
      if (!window.wledBridge || window.wledBridge.readyState !== WebSocket.OPEN) {
        console.warn(`⚠️ WebSocket bridge not available for ${device.name}. Bridge state: ${window.wledBridge?.readyState}`);
        return;
      }

      // Convert hex colors to RGB format for WebSocket
      const ledData = colors.slice(0, device.ledCount).map((hex) => {
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        // Apply brightness
        const brightness = device.brightness / 255;
        return {
          r: Math.round(r * brightness),
          g: Math.round(g * brightness),
          b: Math.round(b * brightness)
        };
      });

      // Apply reverse direction
      if (device.reverseDirection) {
        ledData.reverse();
      }

      // Send data through WebSocket bridge
      const message = {
        ipAddress: device.ip,
        ledData: ledData
      };

      // Send without waiting for response (fire-and-forget for better performance)
      window.wledBridge.send(JSON.stringify(message));

      updateDevice(deviceId, {
        dataFlowStatus: 'sending',
        lastDataSent: Date.now(),
      });

      // Update FPS counter
      updateFPS(deviceId);
    } catch (error) {
      console.error(`Failed to send LED data to ${device.name}:`, error);
      // Don't mark as error for send failures (might be temporary)
    }
  };

  // Update FPS counter
  const updateFPS = (deviceId: string) => {
    const device = devices.find((d) => d.id === deviceId);
    if (!device) return;

    const now = Date.now();
    const lastSent = device.lastDataSent || now;
    const fps = lastSent > 0 ? Math.round(1000 / (now - lastSent)) : 0;

    updateDevice(deviceId, { fps });

    // Clear existing timer
    const existingTimer = fpsTimers.current.get(deviceId);
    if (existingTimer) clearTimeout(existingTimer);

    // Set data flow to idle after 2 seconds of no updates
    const timer = setTimeout(() => {
      updateDevice(deviceId, { dataFlowStatus: 'idle', fps: 0 });
    }, 2000);

    fpsTimers.current.set(deviceId, timer);
  };

  // Add new device (inline)
  const addNewDevice = () => {
    const newDevice: WLEDDevice = {
      id: `wled-${Date.now()}`,
      name: `WLED Device ${devices.length + 1}`,
      ip: '192.168.1.100',
      port: 80,
      connectionStatus: 'idle',
      autoReconnect: true,
      deviceType: deviceType === 'auto' ? 'strip' : deviceType,
      ledCount: 90, // Default to 90 LEDs
      enabled: false, // Start disabled so user can configure first
      dataFlowStatus: 'idle',
      fps: 0,
      brightness: 204, // 80%
      reverseDirection: false,
      solo: false,
      mute: false,
    };

    setDevices([...devices, newDevice]);
  };

  // Update device
  const updateDevice = (deviceId: string, updates: Partial<WLEDDevice>) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === deviceId ? { ...d, ...updates } : d))
    );
  };

  // Toggle device enabled
  const toggleEnabled = async (deviceId: string) => {
    const device = devices.find((d) => d.id === deviceId);
    if (!device) return;

    if (!device.enabled) {
      // Enabling: test connection first
      updateDevice(deviceId, { enabled: true });
      await testConnection(deviceId);
    } else {
      // Disabling: turn off device
      try {
        await fetch(`http://${device.ip}:${device.port || 80}/json/state`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ on: false }),
          signal: AbortSignal.timeout(2000),
        });
        console.log(`🔄 Turned off WLED device ${device.ip}`);
      } catch (error) {
        console.warn(`⚠️ Failed to turn off WLED device ${device.ip}:`, error);
      }
      updateDevice(deviceId, { enabled: false, connectionStatus: 'idle' });
    }
  };

  // Toggle settings panel
  const toggleSettings = (deviceId: string) => {
    setExpandedSettings((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(deviceId)) {
        newSet.delete(deviceId);
      } else {
        newSet.add(deviceId);
      }
      return newSet;
    });
  };

  // Test device with simple static pattern
  const handleTest = async (deviceId: string) => {
    const device = devices.find((d) => d.id === deviceId);
    if (!device) return;

    console.log(`🔵 Sending static test pattern to ${device.ip} (${device.name})`);

    try {
      // Generate simple test pattern: solid white for 3 seconds
      const testColors = Array(device.ledCount).fill('ffffff'); // All white

      // Send test pattern
      await sendLEDData(deviceId, testColors);

      console.log(`✅ Sent ${device.ledCount} white LEDs to ${device.ip}`);

      // Auto-off after 3 seconds
      setTimeout(async () => {
        const offColors = Array(device.ledCount).fill('000000');
        await sendLEDData(deviceId, offColors);
        console.log(`⚫ Turned off test LEDs on ${device.ip}`);
      }, 3000);
    } catch (error) {
      console.error(`❌ Failed to send test pattern to ${device.ip}:`, error);
    }
  };

  // Delete device
  const handleDelete = async (deviceId: string) => {
    const device = devices.find((d) => d.id === deviceId);
    if (!device) return;

    if (window.confirm(`Delete device "${device.name}"?`)) {
      // Turn off device before deleting
      if (device.enabled) {
        try {
          await fetch(`http://${device.ip}:${device.port || 80}/json/state`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ on: false }),
            signal: AbortSignal.timeout(2000),
          });
        } catch (error) {
          console.warn(`⚠️ Failed to turn off device before delete:`, error);
        }
      }
      setDevices((prev) => prev.filter((d) => d.id !== deviceId));
    }
  };

  // Get status icon
  const getStatusIcon = (device: WLEDDevice) => {
    switch (device.connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'connecting':
        return <Wifi className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'error':
        return <WifiOff className="w-4 h-4 text-red-500" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-gray-500" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-400" />;
    }
  };

  // Empty state
  if (devices.length === 0) {
    return (
      <div className="space-y-4 p-4 bg-gray-900 text-white rounded-lg">
        <div className="flex flex-col items-center justify-center p-8 bg-gray-800 rounded-xl border border-gray-700">
          <Wifi className="w-16 h-16 text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No WLED Devices</h3>
          <p className="text-gray-400 text-center mb-6 max-w-md">
            Add LED strips or matrices to visualize audio on physical hardware in real-time
          </p>
          <button
            onClick={addNewDevice}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Your First WLED Device
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 bg-gray-900 text-white rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">WLED Devices</h3>
          <p className="text-sm text-gray-400 mt-1">
            {devices.filter((d) => d.connectionStatus === 'connected').length} connected,{' '}
            {devices.filter((d) => d.enabled).length} enabled
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="text-sm text-gray-300 bg-gray-800 p-3 rounded-lg">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <strong>Test Button:</strong> Flashes white for 3 seconds to verify connectivity
          </div>
          <div>
            <strong>Enable Toggle:</strong> Connect and stream LED data to device
          </div>
          <div className="flex items-center gap-2">
            <strong>Protocol:</strong> WebSocket → UDP WARLS
            {bridgeConnected ? (
              <span className="text-green-400 text-xs flex items-center gap-1">
                <Wifi className="w-3 h-3" />
                Bridge Connected
              </span>
            ) : (
              <span className="text-red-400 text-xs flex items-center gap-1">
                <WifiOff className="w-3 h-3" />
                Bridge Offline
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Device List (Inline Rows) */}
      <div className="space-y-3">
        {devices.map((device) => (
          <div key={device.id} className="flex flex-col gap-2 p-3 bg-gray-800 rounded-lg">
            {/* Main controls row */}
            <div className="flex items-center gap-4">
              {/* Status Icon */}
              <div className="flex items-center gap-2" title={device.lastError || device.connectionStatus}>
                {getStatusIcon(device)}
              </div>

              {/* Enable Toggle */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={device.enabled}
                  onChange={() => toggleEnabled(device.id)}
                  className="sr-only peer"
                  aria-label={`Enable ${device.name}`}
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>

              {/* Device Name */}
              <input
                value={device.name}
                onChange={(e) => updateDevice(device.id, { name: e.target.value })}
                placeholder="Device name"
                className="bg-gray-700 text-white rounded px-2 py-1 flex-1 min-w-[120px]"
              />

              {/* IP Address */}
              <input
                value={device.ip}
                onChange={(e) => updateDevice(device.id, { ip: e.target.value })}
                placeholder="192.168.1.xxx"
                className="bg-gray-700 text-white rounded px-2 py-1 min-w-[140px]"
              />

              {/* LED Count */}
              <input
                type="number"
                value={device.ledCount || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    // Allow clearing - set to empty (0) temporarily
                    updateDevice(device.id, { ledCount: 0 });
                  } else {
                    const parsed = parseInt(value);
                    if (!isNaN(parsed) && parsed >= 0) {
                      updateDevice(device.id, { ledCount: parsed });
                    }
                  }
                }}
                onBlur={() => {
                  // Reset to 90 if left empty or invalid on blur
                  if (!device.ledCount || device.ledCount === 0 || isNaN(device.ledCount)) {
                    updateDevice(device.id, { ledCount: 90 });
                  }
                }}
                placeholder="90"
                min="16"
                max="1000"
                className="bg-gray-700 text-white rounded px-2 py-1 w-20"
                title={`Number of LEDs (currently ${device.ledCount || 90})`}
              />

              {/* Direction Toggle */}
              <button
                onClick={() =>
                  updateDevice(device.id, { reverseDirection: !device.reverseDirection })
                }
                className="px-2 py-1 rounded text-xs transition-colors bg-gray-600 hover:bg-gray-500"
                title={`LED Direction: ${
                  device.reverseDirection
                    ? 'Normal (top-to-bottom)'
                    : 'Reversed (bottom-to-top) - Default'
                }`}
              >
                {device.reverseDirection ? '↓' : '↑'}
              </button>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTest(device.id)}
                  disabled={!device.enabled || device.connectionStatus !== 'connected'}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded text-xs transition-colors flex items-center gap-1"
                  title="Send solid white test (3 seconds)"
                >
                  <Play className="w-3 h-3" />
                  Test
                </button>

                <button
                  onClick={() => toggleSettings(device.id)}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    expandedSettings.has(device.id)
                      ? 'bg-blue-600 hover:bg-blue-500'
                      : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                  title="Toggle settings"
                >
                  <Settings className="w-3 h-3" />
                </button>

                <button
                  onClick={() => handleDelete(device.id)}
                  className="p-1 text-red-400 hover:text-red-300 transition-colors"
                  title="Remove this device"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* FPS Counter */}
              {device.enabled && device.connectionStatus === 'connected' && (
                <span className="text-xs text-gray-400 min-w-[50px] text-right">
                  {device.fps > 0 ? `${device.fps} FPS` : '0 FPS'}
                </span>
              )}
            </div>

            {/* Expandable Settings */}
            {expandedSettings.has(device.id) && (
              <div className="border-t border-gray-700 pt-3 space-y-3">
                {/* Brightness Slider */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Brightness: {Math.round((device.brightness / 255) * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="255"
                    value={device.brightness}
                    onChange={(e) =>
                      updateDevice(device.id, { brightness: parseInt(e.target.value) })
                    }
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                </div>

                {/* Auto-reconnect */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={device.autoReconnect}
                    onChange={(e) =>
                      updateDevice(device.id, { autoReconnect: e.target.checked })
                    }
                    className="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-300">Auto-reconnect on error</span>
                </label>
              </div>
            )}

            {/* Virtual LED Preview */}
            {device.enabled && (
              <WLEDVirtualPreview
                device={device}
                ledColors={ledData}
              />
            )}
          </div>
        ))}
      </div>

      {/* Add Device Button */}
      {devices.length < maxDevices && (
        <button
          onClick={addNewDevice}
          className="flex items-center gap-2 w-full justify-center py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add WLED Device
        </button>
      )}
    </div>
  );
};

// Helper: HSL to Hex
const hslToHex = (h: number, s: number, l: number): string => {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `${f(0)}${f(8)}${f(4)}`;
};

export default WLEDDeviceManager;
