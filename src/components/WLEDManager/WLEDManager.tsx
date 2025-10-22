/**
 * WLED Manager Component
 * Story 18.5: WLED Manager UI
 *
 * Main interface for managing WLED LED devices
 * Inline editing UX pattern (no modals) - based on LEDStripManager
 */

import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { ViewTemplate, ViewCard } from '@/components/Layout/ViewTemplate';
import { wledDeviceRegistry } from '@/services/WLEDDeviceRegistry';
import { routingMatrix } from '@/services/VisualizationRoutingMatrix';
import { ledCompositor } from '@/services/LEDCompositor';
import type { WLEDDevice } from '@/types/wled';
import type { DeviceAssignment } from '@/types/visualization';
import { DeviceCard } from './DeviceCard';
import { RoutingStatusDisplay } from './RoutingStatusDisplay';

// Rainbow colors for device identification (in order)
const RAINBOW_COLORS = [
  '#FF0000', // Red
  '#FF7F00', // Orange
  '#FFFF00', // Yellow
  '#00FF00', // Green
  '#00FFFF', // Cyan
  '#0000FF', // Blue
  '#8B00FF', // Purple
  '#FF00FF', // Magenta
];

interface WLEDManagerProps {
  /** Callback to navigate back */
  onBack?: () => void;
}

/**
 * WLED Manager - Configure and manage LED hardware
 */
export const WLEDManager: React.FC<WLEDManagerProps> = ({ onBack }) => {
  const [devices, setDevices] = useState<WLEDDevice[]>([]);
  const [routingAssignments, setRoutingAssignments] = useState<DeviceAssignment[]>([]);
  const [showNewDeviceCard, setShowNewDeviceCard] = useState(false);

  // Subscribe to device changes
  useEffect(() => {
    const unsubscribe = wledDeviceRegistry.subscribeToDevices((updatedDevices) => {
      setDevices(updatedDevices);
    });

    return unsubscribe;
  }, []);

  // Subscribe to routing changes
  useEffect(() => {
    const unsubscribe = routingMatrix.onRoutingChange((event) => {
      setRoutingAssignments(event.assignments);
    });

    return unsubscribe;
  }, []);

  const handleAddDevice = () => {
    setShowNewDeviceCard(true);
  };

  // Get next available color for new device
  const getNextColor = (): string => {
    return RAINBOW_COLORS[devices.length % RAINBOW_COLORS.length];
  };

  // Spawn 8 test devices
  const handleSpawnTestDevices = async () => {
    const testDevices = [
      { name: 'WLED Strip 1', ip: '192.168.8.151', location: 'Test Location 1' },
      { name: 'WLED Strip 2', ip: '192.168.8.152', location: 'Test Location 2' },
      { name: 'WLED Strip 3', ip: '192.168.8.153', location: 'Test Location 3' },
      { name: 'WLED Strip 4', ip: '192.168.8.154', location: 'Test Location 4' },
      { name: 'WLED Strip 5', ip: '192.168.8.155', location: 'Test Location 5' },
      { name: 'WLED Strip 6', ip: '192.168.8.156', location: 'Test Location 6' },
      { name: 'WLED Strip 7', ip: '192.168.8.157', location: 'Test Location 7' },
      { name: 'WLED Strip 8', ip: '192.168.8.158', location: 'Test Location 8' },
    ];

    try {
      for (let i = 0; i < testDevices.length; i++) {
        const testDevice = testDevices[i];
        const deviceInput = {
          name: testDevice.name,
          ip: testDevice.ip,
          location: testDevice.location,
          capabilities: {
            dimensions: '1D' as const,
            ledCount: 144,
            supportedVisualizations: [],
          },
          brightness: 204,
          reverse_direction: false,
          enabled: true, // All devices enabled by default
          assigned_color: RAINBOW_COLORS[i],
        };

        await wledDeviceRegistry.createDevice(deviceInput);
      }

      console.log('[WLEDManager] Successfully created 8 test devices');
    } catch (error) {
      console.error('[WLEDManager] Failed to create test devices:', error);
    }
  };

  const handleDelete = async (deviceId: string) => {
    try {
      await wledDeviceRegistry.deleteDevice(deviceId);
    } catch (error) {
      console.error('Failed to delete device:', error);
      alert('Failed to delete device. Please try again.');
    }
  };

  const handleDeviceSaved = (_device: WLEDDevice) => {
    // Hide new device card after successful save
    setShowNewDeviceCard(false);
  };

  return (
    <ViewTemplate
      title="WLED Manager"
      subtitle="Configure LED hardware for intelligent visualization routing"
      onBack={onBack}
      variant="full-width"
      maxWidth="4xl"
      badge="Beta"
      badgeVariant="orange"
    >
      {/* Routing Status */}
      <ViewCard title="Current Routing Status">
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => {
              console.log('[WLEDManager] === ROUTING DEBUG ===');
              console.log('[WLEDManager] Registered modules:', ledCompositor.getAllModuleCapabilities());
              console.log('[WLEDManager] Current assignments:', routingMatrix.getCurrentAssignments());
              routingMatrix.debugPrintRouting();
              ledCompositor.debugPrintCapabilities();
            }}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm transition-colors"
          >
            Debug Routing (Console)
          </button>
          <button
            onClick={() => routingMatrix.recalculateRouting('manual-recalculation')}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-sm transition-colors"
          >
            Force Recalculate
          </button>
        </div>
        <RoutingStatusDisplay assignments={routingAssignments} />
      </ViewCard>

      {/* Device Configuration */}
      <ViewCard title={`Your Devices (${devices.length})`}>
        <div className="space-y-4">
          {/* Info Banner */}
          <div className="text-sm text-gray-300 bg-gray-700/30 p-3 rounded-lg border border-gray-600">
            <strong>How to use:</strong> Fill in device details, test connection, and save.
            Changes are saved automatically as you edit. Use the Test button to verify
            connectivity and LED count.
          </div>

          {/* Add Device Button */}
          {!showNewDeviceCard && (
            <div className="flex gap-2">
              <button
                onClick={handleAddDevice}
                className="flex items-center gap-2 w-full justify-center py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Device
              </button>
              <button
                onClick={handleSpawnTestDevices}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm whitespace-nowrap"
                title="Create 8 test devices (192.168.8.151-158)"
              >
                Spawn Test Devices
              </button>
            </div>
          )}

          {/* New Device Card */}
          {showNewDeviceCard && (
            <div className="border-2 border-dashed border-primary-500 rounded-lg">
              <DeviceCard
                device={null}
                assignedColor={getNextColor()}
                onDelete={() => setShowNewDeviceCard(false)}
                onSave={handleDeviceSaved}
              />
            </div>
          )}

          {/* Existing Devices */}
          {devices.map((device, index) => (
            <DeviceCard
              key={device.id}
              device={device}
              assignedColor={device.assigned_color || RAINBOW_COLORS[index % RAINBOW_COLORS.length]}
              onDelete={handleDelete}
              onSave={handleDeviceSaved}
            />
          ))}

          {/* Empty State */}
          {devices.length === 0 && !showNewDeviceCard && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">No WLED devices configured yet</p>
              <p className="text-xs mt-1">Click "Add Device" above to get started</p>
            </div>
          )}
        </div>
      </ViewCard>

      {/* About */}
      <ViewCard title="About WLED Manager">
        <div className="text-gray-300 space-y-3">
          <p>
            WLED Manager lets you configure LED hardware for intelligent visualization routing.
            Add your WLED devices once, and the routing system automatically assigns module
            visualizations based on device capabilities.
          </p>

          <div className="mt-4 p-4 bg-gray-700/30 rounded-lg border border-gray-600">
            <h4 className="font-semibold text-white mb-2">How Routing Works:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Add your WLED devices (1D strips or 2D grids)</li>
              <li>Test connection to verify device is reachable</li>
              <li>Open any module (Drum Machine, Guitar, Piano, etc.)</li>
              <li>Routing automatically assigns your module to the best device</li>
              <li>LEDs update in real-time as you play</li>
            </ol>
          </div>

          <div className="mt-4 p-4 bg-blue-700/30 rounded-lg border border-blue-600">
            <h4 className="font-semibold text-white mb-2">Anonymous Usage:</h4>
            <p className="text-sm">
              WLED devices are saved to your browser's local storage - no account needed!
              Sign in to sync your devices across browsers and devices.
            </p>
          </div>
        </div>
      </ViewCard>
    </ViewTemplate>
  );
};
