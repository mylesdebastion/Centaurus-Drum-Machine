/**
 * Controller Registry - Factory pattern for hardware controllers
 *
 * Centralized registration system for all hardware controller types.
 * Uses feature flags (available) to enable/disable controllers.
 */

import type { HardwareController } from './types';
import { APC40Controller } from '../apc40/APC40Controller';
import { LaunchpadProController } from '../launchpad/LaunchpadProController';
// Future imports (enabled after respective epics complete):
// import { ROLILumiController } from '../roli/ROLILumiController';

export type ControllerType =
  | 'none'
  | 'apc40'
  | 'launchpad-pro-mk3'
  | 'launchpad-pro-2015'
  | 'roli-lumi';

export interface ControllerDefinition {
  id: ControllerType;
  name: string;
  description: string;
  manufacturer: string;
  available: boolean; // Feature flag
  gridSize: string; // Display grid dimensions
  create: (deviceId?: string) => HardwareController;
}

/**
 * Global controller registry
 */
export const CONTROLLER_REGISTRY: Record<ControllerType, ControllerDefinition> = {
  'none': {
    id: 'none',
    name: 'No Controller',
    description: 'Disable hardware integration',
    manufacturer: 'N/A',
    gridSize: 'N/A',
    available: true,
    create: () => {
      throw new Error('Cannot instantiate null controller');
    }
  },

  'apc40': {
    id: 'apc40',
    name: 'Akai APC40',
    description: '5×8 grid with LED feedback',
    manufacturer: 'Akai',
    gridSize: '5×8',
    available: true, // ✅ Available now
    create: (deviceId) => new APC40Controller(deviceId)
  },

  'launchpad-pro-mk3': {
    id: 'launchpad-pro-mk3',
    name: 'Launchpad Pro Mk3',
    description: '8×8 RGB grid with velocity pads (USB-C)',
    manufacturer: 'Novation',
    gridSize: '8×8',
    available: true, // ✅ Available (Story 8.1)
    create: (deviceId) => new LaunchpadProController('mk3', deviceId)
  },

  'launchpad-pro-2015': {
    id: 'launchpad-pro-2015',
    name: 'Launchpad Pro (2015)',
    description: '8×8 RGB grid with velocity pads',
    manufacturer: 'Novation',
    gridSize: '8×8',
    available: true, // ✅ Available (Story 8.1)
    create: (deviceId) => new LaunchpadProController('2015', deviceId)
  },

  'roli-lumi': {
    id: 'roli-lumi',
    name: 'ROLI LUMI Keys / Piano M',
    description: 'LED keyboard with per-key lighting',
    manufacturer: 'ROLI',
    gridSize: '24-key',
    available: false, // ⏳ Enable after Epic 11
    create: (_deviceId) => {
      throw new Error('ROLI LUMI integration not yet implemented (Epic 11)');
      // Future: return new ROLILumiController(deviceId);
    }
  }
};

/**
 * Get available controllers (filtered by feature flag)
 */
export const getAvailableControllers = (): ControllerDefinition[] => {
  return Object.values(CONTROLLER_REGISTRY).filter(def => def.available);
};

/**
 * Get all controllers (including unavailable)
 */
export const getAllControllers = (): ControllerDefinition[] => {
  return Object.values(CONTROLLER_REGISTRY);
};

/**
 * Create controller instance from type
 * Returns null if type is 'none' or controller not available
 */
export const createController = (
  type: ControllerType,
  deviceId?: string
): HardwareController | null => {
  if (type === 'none') {
    console.log('Hardware controller disabled (type: none)');
    return null;
  }

  const definition = CONTROLLER_REGISTRY[type];

  if (!definition.available) {
    console.warn(`Controller ${type} is not yet available. Check Epic 8/11 progress.`);
    return null;
  }

  try {
    console.log(`Creating controller: ${definition.name} (${type})`);
    return definition.create(deviceId);
  } catch (error) {
    console.error(`Failed to create controller ${type}:`, error);
    return null;
  }
};

/**
 * Get controller definition by type
 */
export const getControllerDefinition = (type: ControllerType): ControllerDefinition => {
  return CONTROLLER_REGISTRY[type];
};
