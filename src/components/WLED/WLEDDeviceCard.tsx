/**
 * WLED Device Card Component
 * Story 6.1: Multi-Client Shared Sessions - Phase 0
 *
 * Individual device card with status, quick actions, and settings
 */

import React, { useState } from 'react';
import { Settings, Trash2, Play } from 'lucide-react';
import { WLEDDeviceCardProps } from './types';
import WLEDVirtualPreview from './WLEDVirtualPreview';

const WLEDDeviceCard: React.FC<WLEDDeviceCardProps> = ({
  device,
  onToggleEnabled,
  onTest,
  onDelete,
  onUpdateDevice,
  compactMode: _compactMode = false, // Reserved for future compact UI mode
}) => {
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  // Status indicator mapping
  const getStatusDisplay = () => {
    switch (device.connectionStatus) {
      case 'connected':
        return {
          color: 'bg-green-50 border-green-200 text-green-700',
          dot: 'bg-green-500',
          text: 'Connected',
          tooltip: 'Connected to WLED device',
        };
      case 'connecting':
        return {
          color: 'bg-blue-50 border-blue-200 text-blue-700',
          dot: 'bg-blue-500 animate-pulse',
          text: 'Connecting...',
          tooltip: 'Attempting to connect',
        };
      case 'error':
        return {
          color: 'bg-red-50 border-red-200 text-red-700',
          dot: 'bg-red-500',
          text: 'Connection Failed',
          tooltip: device.lastError || 'Connection failed',
        };
      case 'disconnected':
        return {
          color: 'bg-gray-50 border-gray-200 text-gray-700',
          dot: 'bg-gray-500',
          text: 'Disconnected',
          tooltip: 'Device disconnected',
        };
      default:
        return {
          color: 'bg-gray-50 border-gray-200 text-gray-700',
          dot: 'bg-gray-400',
          text: 'Idle',
          tooltip: 'Device idle',
        };
    }
  };

  // Data flow indicator
  const getDataFlowIndicator = () => {
    switch (device.dataFlowStatus) {
      case 'receiving':
        return {
          color: 'bg-blue-500',
          tooltip: 'Receiving visualization data',
          animate: 'animate-pulse',
        };
      case 'sending':
        return {
          color: 'bg-green-500',
          tooltip: `Sending to WLED (${device.fps} FPS)`,
          animate: 'animate-pulse',
        };
      case 'idle':
      default:
        return {
          color: 'bg-gray-500',
          tooltip: 'Connected, waiting for audio data',
          animate: '',
        };
    }
  };

  const status = getStatusDisplay();
  const dataFlow = getDataFlowIndicator();

  const handleDelete = () => {
    if (window.confirm(`Delete device "${device.name}"?`)) {
      onDelete(device.id);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          {/* Device name and enable toggle */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <label className="relative inline-flex items-center cursor-pointer touch-target">
                <input
                  type="checkbox"
                  checked={device.enabled}
                  onChange={() => onToggleEnabled(device.id)}
                  className="sr-only peer"
                  aria-label={`Enable ${device.name}`}
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
              <h3 className="font-medium text-white truncate">{device.name}</h3>
            </div>
            <p className="text-sm text-gray-400 mt-1">{device.ip}</p>
          </div>

          {/* Status and data flow indicators */}
          <div className="flex flex-col items-end gap-1">
            <div
              className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border ${status.color}`}
              title={status.tooltip}
            >
              <div className={`w-2 h-2 rounded-full mr-1.5 ${status.dot}`} />
              {status.text}
            </div>
            {device.enabled && device.connectionStatus === 'connected' && (
              <div
                className={`w-3 h-3 rounded-full ${dataFlow.color} ${dataFlow.animate}`}
                title={dataFlow.tooltip}
              />
            )}
          </div>
        </div>

        {/* Virtual Preview */}
        {device.enabled && <WLEDVirtualPreview device={device} />}

        {/* Quick Actions */}
        <div className="flex items-center justify-between mt-3 gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => onTest(device.id)}
              disabled={!device.enabled || device.connectionStatus !== 'connected'}
              className="touch-target px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors flex items-center gap-1.5"
              aria-label={`Test ${device.name}`}
            >
              <Play className="w-3 h-3" />
              Test
            </button>
            <button
              onClick={() => setSettingsExpanded(!settingsExpanded)}
              className="touch-target px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors flex items-center gap-1.5"
              aria-label={`${settingsExpanded ? 'Collapse' : 'Expand'} settings for ${device.name}`}
              aria-expanded={settingsExpanded}
            >
              <Settings className="w-3 h-3" />
              Settings
            </button>
            <button
              onClick={handleDelete}
              className="touch-target px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors flex items-center gap-1.5"
              aria-label={`Delete ${device.name}`}
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          </div>

          {/* FPS Counter */}
          {device.enabled && device.connectionStatus === 'connected' && (
            <span className="text-xs text-gray-400">
              {device.fps > 0 ? `${device.fps} FPS` : '0 FPS'}
            </span>
          )}
        </div>
      </div>

      {/* Expandable Settings Panel */}
      {settingsExpanded && (
        <div className="border-t border-gray-700 p-4 bg-gray-750">
          <div className="space-y-4">
            {/* LED Count */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                LED Count
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={device.ledCount}
                onChange={(e) =>
                  onUpdateDevice(device.id, { ledCount: parseInt(e.target.value) || 60 })
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Brightness */}
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
                  onUpdateDevice(device.id, { brightness: parseInt(e.target.value) })
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
                  onUpdateDevice(device.id, { autoReconnect: e.target.checked })
                }
                className="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-300">Auto-reconnect</span>
            </label>

            {/* Reverse direction */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={device.reverseDirection}
                onChange={(e) =>
                  onUpdateDevice(device.id, { reverseDirection: e.target.checked })
                }
                className="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-300">Reverse direction</span>
            </label>

            {/* Test Pattern */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Test Pattern
              </label>
              <select
                value={device.testPattern || 'off'}
                onChange={(e) =>
                  onUpdateDevice(device.id, {
                    testPattern: e.target.value as 'rainbow' | 'solid' | 'off',
                  })
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="off">Off</option>
                <option value="rainbow">Rainbow</option>
                <option value="solid">Solid</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WLEDDeviceCard;
