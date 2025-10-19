/**
 * Piano Roll Visualization Capability
 * Story 18.2: Module Capability Declaration
 */

import type { ModuleVisualizationCapability } from '@/types/visualization';

export const pianoRollCapability: ModuleVisualizationCapability = {
  moduleId: 'piano-roll',
  produces: [
    {
      type: 'piano-roll-grid',
      dimensionPreference: '2D',
      overlayCompatible: false,
      priority: 70, // High priority (2D grid preferred)
    },
    {
      type: 'piano-keys',
      dimensionPreference: '1D',
      overlayCompatible: false,
      priority: 65, // High priority (1D fallback)
    },
    {
      type: 'generic-color-array',
      dimensionPreference: 'either',
      overlayCompatible: false,
      priority: 10, // Low priority (fallback)
    },
  ],
};
