/**
 * WLED Device Manager Component
 * Story 6.1: Multi-Client Shared Sessions - Phase 0
 *
 * Main component managing WLED devices with WebSocket connections,
 * localStorage persistence, and responsive grid layout
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Wifi } from 'lucide-react';
import { WLEDDevice, WLEDDeviceManagerProps } from './types';
import WLEDDeviceCard from './WLEDDeviceCard';

const WLEDDeviceManager: React.FC<WLEDDeviceManagerProps> = ({
  ledData,
  layout = 'desktop',
  storageKey,
  deviceType = 'auto',
  maxDevices = 10,
  showVirtualPreview: _showVirtualPreview = true, // Reserved for toggling preview visibility
  compactMode = false,
}) => {
  const [devices, setDevices] = useState<WLEDDevice[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceIP, setNewDeviceIP] = useState('');
  const [ipError, setIpError] = useState('');


  // WebSocket connections (persisted across renders)
  const wsConnections = useRef<Map<string, WebSocket>>(new Map());
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

  // Auto-connect enabled devices
  useEffect(() => {
    devices.forEach((device) => {
      if (device.enabled && device.connectionStatus === 'idle') {
        connectDevice(device.id);
      } else if (!device.enabled && wsConnections.current.has(device.id)) {
        disconnectDevice(device.id);
      }
    });
  }, [devices]);

  // Send LED data to all connected devices
  useEffect(() => {
    if (!ledData || ledData.length === 0) return;

    devices.forEach((device) => {
      if (
        device.enabled &&
        device.connectionStatus === 'connected' &&
        !device.mute &&
        wsConnections.current.has(device.id)
      ) {
        sendLEDData(device.id, ledData);
      }
    });
  }, [ledData, devices]);

  // Connect to WLED device via WebSocket
  const connectDevice = (deviceId: string) => {
    const device = devices.find((d) => d.id === deviceId);
    if (!device) return;

    updateDevice(deviceId, { connectionStatus: 'connecting' });

    const ws = new WebSocket(`ws://${device.ip}:${device.port || 80}/ws`);

    ws.onopen = () => {
      updateDevice(deviceId, {
        connectionStatus: 'connected',
        lastError: undefined,
      });
      wsConnections.current.set(deviceId, ws);
    };

    ws.onerror = (error) => {
      console.error(`WLED connection error for ${device.name}:`, error);
      updateDevice(deviceId, {
        connectionStatus: 'error',
        lastError: 'Connection failed',
      });
    };

    ws.onclose = () => {
      wsConnections.current.delete(deviceId);
      updateDevice(deviceId, { connectionStatus: 'disconnected' });

      // Auto-reconnect logic
      if (device.autoReconnect && device.enabled) {
        setTimeout(() => connectDevice(deviceId), 2000);
      }
    };
  };

  // Disconnect from WLED device
  const disconnectDevice = (deviceId: string) => {
    const ws = wsConnections.current.get(deviceId);
    if (ws) {
      ws.close();
      wsConnections.current.delete(deviceId);
    }
    updateDevice(deviceId, { connectionStatus: 'disconnected' });
  };

  // Send LED data to device
  const sendLEDData = (deviceId: string, colors: string[]) => {
    const device = devices.find((d) => d.id === deviceId);
    const ws = wsConnections.current.get(deviceId);

    if (!device || !ws || ws.readyState !== WebSocket.OPEN) return;

    try {
      // WLED protocol: send color data
      const colorArray = colors.slice(0, device.ledCount).map((hex) => {
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return [r, g, b];
      });

      // Apply brightness and reverse direction
      const brightness = device.brightness / 255;
      let finalArray = colorArray.map(([r, g, b]) => [
        Math.round(r * brightness),
        Math.round(g * brightness),
        Math.round(b * brightness),
      ]);

      if (device.reverseDirection) {
        finalArray = finalArray.reverse();
      }

      // Send to WLED (simplified protocol)
      ws.send(JSON.stringify({ seg: [{ col: finalArray }] }));

      updateDevice(deviceId, {
        dataFlowStatus: 'sending',
        lastDataSent: Date.now(),
      });

      // Update FPS counter
      updateFPS(deviceId);
    } catch (error) {
      console.error(`Failed to send LED data to ${device.name}:`, error);
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

  // Add new device
  const handleAddDevice = () => {
    // Validate IP
    const ipPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    if (!ipPattern.test(newDeviceIP)) {
      setIpError('Invalid IP address (example: 192.168.1.50)');
      return;
    }

    const newDevice: WLEDDevice = {
      id: `wled-${Date.now()}`,
      name: newDeviceName.trim() || `WLED Device ${devices.length + 1}`,
      ip: newDeviceIP,
      port: 80,
      connectionStatus: 'idle',
      autoReconnect: true,
      deviceType: deviceType === 'auto' ? 'strip' : deviceType,
      ledCount: 60,
      enabled: true,
      dataFlowStatus: 'idle',
      fps: 0,
      brightness: 204, // 80%
      reverseDirection: false,
      solo: false,
      mute: false,
    };

    setDevices([...devices, newDevice]);
    setShowAddModal(false);
    setNewDeviceName('');
    setNewDeviceIP('');
    setIpError('');
  };

  // Update device
  const updateDevice = (deviceId: string, updates: Partial<WLEDDevice>) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === deviceId ? { ...d, ...updates } : d))
    );
  };

  // Toggle device enabled
  const handleToggleEnabled = (deviceId: string) => {
    const device = devices.find((d) => d.id === deviceId);
    if (!device) return;

    updateDevice(deviceId, { enabled: !device.enabled });
  };

  // Test device
  const handleTest = (deviceId: string) => {
    const testColors = Array(60)
      .fill(0)
      .map((_, i) => {
        const hue = (i / 60) * 360;
        return hslToHex(hue, 100, 50);
      });
    sendLEDData(deviceId, testColors);
  };

  // Delete device
  const handleDelete = (deviceId: string) => {
    disconnectDevice(deviceId);
    setDevices((prev) => prev.filter((d) => d.id !== deviceId));
  };

  // Render modal (needs to be outside conditional returns)
  const renderModal = () => {
    if (!showAddModal) return null;

    return createPortal(
      <div
        className="fixed inset-0 flex items-center justify-center p-4"
        style={{
          zIndex: 9999,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(4px)'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowAddModal(false);
          }
        }}
      >
        <div
          className="bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl border border-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-xl font-semibold text-white mb-4">Add WLED Device</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Device Name (optional)
              </label>
              <input
                type="text"
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
                placeholder="My LED Strip"
                maxLength={30}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                IP Address *
              </label>
              <input
                type="text"
                value={newDeviceIP}
                onChange={(e) => {
                  setNewDeviceIP(e.target.value);
                  setIpError('');
                }}
                placeholder="192.168.1.50"
                className={`w-full px-3 py-2 bg-gray-700 border ${
                  ipError ? 'border-red-500' : 'border-gray-600'
                } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500`}
              />
              {ipError && <p className="text-sm text-red-500 mt-1">{ipError}</p>}
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              onClick={() => {
                setShowAddModal(false);
                setNewDeviceName('');
                setNewDeviceIP('');
                setIpError('');
              }}
              className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddDevice}
              disabled={!newDeviceIP}
              className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Add Device
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // Empty state
  if (devices.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center p-8 bg-gray-800 rounded-xl border border-gray-700">
          <Wifi className="w-16 h-16 text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No WLED Devices Connected</h3>
          <p className="text-gray-400 text-center mb-6 max-w-md">
            Connect LED strips to visualize audio on physical hardware in real-time
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Your First WLED Device
          </button>
        </div>
        {renderModal()}
      </>
    );
  }

  return (
    <div className="space-y-4">
      {/* Device Grid */}
      <div
        className={`grid gap-4 ${
          layout === 'mobile'
            ? 'grid-cols-1'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        }`}
      >
        {devices.map((device) => (
          <WLEDDeviceCard
            key={device.id}
            device={device}
            onToggleEnabled={handleToggleEnabled}
            onTest={handleTest}
            onDelete={handleDelete}
            onUpdateDevice={updateDevice}
            compactMode={compactMode}
          />
        ))}
      </div>

      {/* Add Device Button */}
      {devices.length < maxDevices && (
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add WLED Device
        </button>
      )}

      {renderModal()}
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
