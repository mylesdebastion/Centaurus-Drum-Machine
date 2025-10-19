/**
 * Device Card Component
 * Story 18.5: WLED Manager UI
 *
 * Inline editing card for WLED device configuration
 * Compact single-line layout matching LEDStripManager pattern
 */

import React, { useState } from 'react';
import { Trash2, Wifi, WifiOff, Check } from 'lucide-react';
import { wledDeviceRegistry } from '@/services/WLEDDeviceRegistry';
import type { WLEDDevice, WLEDDeviceInput, DeviceCapabilities } from '@/types/wled';
import WLEDVirtualPreview from '@/components/WLED/WLEDVirtualPreview';

interface DeviceCardProps {
  device: WLEDDevice | null; // null for new unsaved device
  assignedColor: string; // Hex color for device identification
  onDelete: (deviceId: string) => void;
  onSave: (device: WLEDDevice) => void;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({ device, assignedColor, onDelete, onSave }) => {
  const isNew = device === null;

  // Form state
  const [name, setName] = useState<string>(device?.name || '');
  const [ip, setIp] = useState<string>(device?.ip || '');
  const [location, setLocation] = useState<string>(device?.location || '');
  const [dimensions, setDimensions] = useState<'1D' | '2D'>(device?.capabilities.dimensions || '1D');
  const [ledCount, setLedCount] = useState<number>(device?.capabilities.ledCount || 144);
  const [gridWidth, setGridWidth] = useState<number>(device?.capabilities.gridConfig?.width || 16);
  const [gridHeight, setGridHeight] = useState<number>(device?.capabilities.gridConfig?.height || 16);
  const [serpentine, setSerpentine] = useState<boolean>(device?.capabilities.gridConfig?.serpentine ?? true);
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>(
    device?.capabilities.gridConfig?.orientation || 'horizontal'
  );
  const [brightness, setBrightness] = useState<number>(device?.brightness || 204);
  const [reverseDirection, setReverseDirection] = useState<boolean>(device?.reverse_direction || false);
  const [enabled, setEnabled] = useState<boolean>(device?.enabled ?? true);

  // UI state
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>(
    device ? 'unknown' : 'unknown'
  );
  const [testPattern, setTestPattern] = useState<'rainbow' | 'solid' | undefined>(undefined);

  // Build capabilities object
  const buildCapabilities = (): DeviceCapabilities => {
    const caps: DeviceCapabilities = {
      dimensions,
      ledCount: dimensions === '2D' ? gridWidth * gridHeight : ledCount,
      supportedVisualizations: [], // Will be auto-populated by routing system
    };

    if (dimensions === '2D') {
      caps.gridConfig = {
        width: gridWidth,
        height: gridHeight,
        serpentine,
        orientation,
      };
    }

    return caps;
  };

  // Test connection and send rainbow pattern
  const handleTestConnection = async () => {
    if (!ip) {
      return;
    }

    setIsTesting(true);
    setTestSuccess(false);
    setConnectionStatus('unknown');

    // Show rainbow test pattern in virtual preview
    setTestPattern('rainbow');

    try {
      // First, test connection to get device info
      const info = await wledDeviceRegistry.testConnection(ip);

      // Calculate LED count based on current dimension settings
      const testLedCount = dimensions === '2D' ? gridWidth * gridHeight : ledCount;

      // Send rainbow test pattern to physical device
      await wledDeviceRegistry.sendRainbowTestPattern(ip, testLedCount);

      // Success - update status
      setConnectionStatus('connected');
      setTestSuccess(true);
      console.log(`✅ Connected to ${info.name} (v${info.ver}) - ${info.leds.count} LEDs detected`);

      // Hide success indicator and test pattern after 3 seconds
      setTimeout(() => {
        setTestSuccess(false);
        setTestPattern(undefined);
      }, 3000);
    } catch (error) {
      setConnectionStatus('error');
      console.error(`❌ Connection failed to ${ip}:`, error);
      // Clear test pattern on error
      setTestPattern(undefined);
    } finally {
      setIsTesting(false);
    }
  };

  // Save device
  const handleSave = async () => {
    // Validation - silently refuse to save if invalid
    if (!name.trim() || !ip.trim()) {
      console.warn('[DeviceCard] Cannot save: name and IP are required');
      return;
    }

    // Validate IP format
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipPattern.test(ip)) {
      console.warn('[DeviceCard] Cannot save: invalid IP format');
      return;
    }

    setIsSaving(true);

    try {
      const deviceInput: WLEDDeviceInput = {
        name: name.trim(),
        ip: ip.trim(),
        location: location.trim() || undefined,
        capabilities: buildCapabilities(),
        brightness,
        reverse_direction: reverseDirection,
        enabled,
        assigned_color: assignedColor,
      };

      let savedDevice: WLEDDevice;

      if (isNew) {
        // Create new device
        savedDevice = await wledDeviceRegistry.createDevice(deviceInput);
      } else {
        // Update existing device
        savedDevice = await wledDeviceRegistry.updateDevice(device.id, deviceInput);
      }

      onSave(savedDevice);
    } catch (error) {
      console.error('Failed to save device:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save on blur (for existing devices)
  const handleBlur = () => {
    if (!isNew && name.trim() && ip.trim()) {
      handleSave();
    }
  };

  // Handle enable/disable toggle
  const handleEnabledToggle = async (newEnabled: boolean) => {
    setEnabled(newEnabled);

    if (!ip) return;

    try {
      if (newEnabled) {
        // Send assigned color to device when enabling
        const rgb = hexToRgb(assignedColor);
        if (rgb) {
          await wledDeviceRegistry.sendSolidColor(ip, rgb);
          console.log(`[DeviceCard] Sent color ${assignedColor} to device ${ip}`);
        }
      } else {
        // Turn off device when disabling
        await wledDeviceRegistry.turnOffDevice(ip);
        console.log(`[DeviceCard] Turned off device ${ip}`);
      }

      // Save the enabled state
      if (!isNew) {
        handleSave();
      }
    } catch (error) {
      console.error('[DeviceCard] Failed to toggle device:', error);
      // Revert the toggle on error
      setEnabled(!newEnabled);
    }
  };

  // Helper to convert hex to RGB
  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : null;
  };

  // Status icon
  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'error':
        return <WifiOff className="w-4 h-4 text-red-500" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-gray-800 rounded-lg border border-gray-700">
      {/* Main Row: All controls in one compact line */}
      <div className="flex items-center gap-2">
        {/* Status Icon */}
        <div className="flex-shrink-0">{getStatusIcon()}</div>

        {/* Enabled Toggle (Slider) */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => handleEnabledToggle(e.target.checked)}
            className="sr-only peer"
            aria-label="Enable device"
          />
          <div
            className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
            style={{
              backgroundColor: enabled ? assignedColor : '#4B5563', // gray-600
            }}
          ></div>
        </label>

        {/* Device Name */}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleBlur}
          placeholder="Device name"
          className={`rounded px-2 py-1 w-32 text-sm ${
            !name.trim() && isNew
              ? 'bg-gray-700 text-white border border-red-500'
              : 'bg-gray-700 text-white'
          }`}
        />

        {/* IP Address */}
        <input
          type="text"
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          onBlur={handleBlur}
          placeholder="192.168.1.100"
          className={`rounded px-2 py-1 w-32 text-sm ${
            !ip.trim() && isNew
              ? 'bg-gray-700 text-white border border-red-500'
              : 'bg-gray-700 text-white'
          }`}
        />

        {/* Location/Note */}
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          onBlur={handleBlur}
          placeholder="Location"
          className="bg-gray-700 text-white rounded px-2 py-1 w-28 text-sm"
        />

        {/* Dimension Selector */}
        <select
          value={dimensions}
          onChange={(e) => setDimensions(e.target.value as '1D' | '2D')}
          onBlur={handleBlur}
          className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
        >
          <option value="1D">1D</option>
          <option value="2D">2D</option>
        </select>

        {/* LED Count (1D) or Grid Config (2D) */}
        {dimensions === '1D' ? (
          <input
            type="number"
            value={ledCount}
            onChange={(e) => setLedCount(parseInt(e.target.value) || 0)}
            onBlur={handleBlur}
            placeholder="LEDs"
            min="1"
            max="1000"
            className="bg-gray-700 text-white rounded px-2 py-1 w-16 text-sm"
            title={`${ledCount} LEDs`}
          />
        ) : (
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={gridWidth}
              onChange={(e) => setGridWidth(parseInt(e.target.value) || 0)}
              onBlur={handleBlur}
              placeholder="W"
              min="1"
              max="100"
              className="bg-gray-700 text-white rounded px-2 py-1 w-12 text-sm"
              title="Width"
            />
            <span className="text-gray-400 text-xs">×</span>
            <input
              type="number"
              value={gridHeight}
              onChange={(e) => setGridHeight(parseInt(e.target.value) || 0)}
              onBlur={handleBlur}
              placeholder="H"
              min="1"
              max="100"
              className="bg-gray-700 text-white rounded px-2 py-1 w-12 text-sm"
              title="Height"
            />
          </div>
        )}

        {/* Brightness Slider */}
        <div className="flex items-center gap-1">
          <input
            type="range"
            value={brightness}
            onChange={(e) => setBrightness(parseInt(e.target.value))}
            onBlur={handleBlur}
            min="0"
            max="255"
            className="w-16"
            title={`Brightness: ${Math.round((brightness / 255) * 100)}%`}
          />
          <span className="text-gray-400 text-xs w-8">{Math.round((brightness / 255) * 100)}%</span>
        </div>

        {/* Direction Toggle (Arrow Icon) */}
        <button
          onClick={() => {
            setReverseDirection(!reverseDirection);
            if (!isNew) handleSave();
          }}
          className="px-2 py-1 rounded text-xs transition-colors bg-gray-600 hover:bg-gray-500"
          title={`LED Direction: ${reverseDirection ? 'Forward (→)' : 'Backward (←)'}`}
        >
          {reverseDirection ? '→' : '←'}
        </button>

        {/* Test Connection Button */}
        <button
          onClick={handleTestConnection}
          disabled={isTesting || testSuccess}
          className={`px-2 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
            testSuccess
              ? 'bg-green-600'
              : isTesting
              ? 'bg-yellow-600 animate-pulse cursor-wait'
              : 'bg-blue-600 hover:bg-blue-500'
          }`}
          title="Send rainbow test pattern to WLED device"
        >
          {testSuccess ? (
            <>
              <Check className="w-3 h-3" />
              OK
            </>
          ) : isTesting ? (
            'Testing...'
          ) : (
            'Test'
          )}
        </button>

        {/* Save Button (for new devices only) */}
        {isNew && (
          <>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-3 py-1 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded text-xs transition-colors"
            >
              {isSaving ? '...' : 'Save'}
            </button>
            <button
              onClick={() => onDelete('')}
              className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs transition-colors"
            >
              Cancel
            </button>
          </>
        )}

        {/* Delete Button (for existing devices) */}
        {!isNew && !showDeleteConfirm && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1 text-red-400 hover:text-red-300 transition-colors"
            title="Delete device"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {/* Delete Confirmation (for existing devices) */}
        {!isNew && showDeleteConfirm && (
          <button
            onClick={() => {
              if (device) {
                onDelete(device.id);
                setShowDeleteConfirm(false);
              }
            }}
            onBlur={() => setShowDeleteConfirm(false)}
            className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs transition-colors"
            autoFocus
          >
            Confirm Delete
          </button>
        )}
      </div>

      {/* 2D Grid Options Row (only shown when 2D is selected) */}
      {dimensions === '2D' && (
        <div className="flex items-center gap-2 pl-6 text-xs">
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={serpentine}
              onChange={(e) => setSerpentine(e.target.checked)}
              onBlur={handleBlur}
              className="rounded w-3 h-3"
            />
            Serpentine
          </label>

          <select
            value={orientation}
            onChange={(e) => setOrientation(e.target.value as 'horizontal' | 'vertical')}
            onBlur={handleBlur}
            className="bg-gray-700 text-white rounded px-2 py-0.5"
          >
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
          </select>

          <span className="text-gray-400">
            ({gridWidth * gridHeight} LEDs total)
          </span>
        </div>
      )}

      {/* Virtual LED Preview - Story 18.8 */}
      {enabled && device && (
        <WLEDVirtualPreview
          device={{
            id: device.id,
            ledCount: device.capabilities.ledCount,
            deviceType: device.capabilities.dimensions === '1D' ? 'strip' : 'matrix',
            matrixConfig: device.capabilities.gridConfig ? {
              width: device.capabilities.gridConfig.width,
              height: device.capabilities.gridConfig.height,
              serpentine: device.capabilities.gridConfig.serpentine,
              orientation: device.capabilities.gridConfig.orientation,
            } : undefined,
            reverseDirection: device.reverse_direction,
            connectionStatus: connectionStatus,
            testPattern: testPattern,
          } as any}
          showLivePreview={true}
        />
      )}
    </div>
  );
};
