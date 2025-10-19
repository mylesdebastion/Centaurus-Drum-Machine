/**
 * Drum Machine Visualization Capability
 * Story 18.2: Module Capability Declaration
 */

import type { ModuleVisualizationCapability } from '@/types/visualization';

export const drumMachineCapability: ModuleVisualizationCapability = {
  moduleId: 'drum-machine',
  produces: [
    {
      type: 'step-sequencer-grid',
      dimensionPreference: '2D',
      overlayCompatible: false, // Exclusive visualization
      priority: 80, // High priority (active module)
    },
    {
      type: 'step-sequencer-1d',
      dimensionPreference: '1D',
      overlayCompatible: false, // Exclusive visualization
      priority: 75, // High priority (fallback for 1D devices)
    },
    {
      type: 'generic-color-array',
      dimensionPreference: 'either',
      overlayCompatible: false,
      priority: 10, // Low priority (fallback)
    },
  ],
};
