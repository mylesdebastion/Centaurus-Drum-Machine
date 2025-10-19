/**
 * Isometric Sequencer Visualization Capability
 * Story 18.2: Module Capability Declaration
 */

import type { ModuleVisualizationCapability } from '@/types/visualization';

export const isometricSequencerCapability: ModuleVisualizationCapability = {
  moduleId: 'isometric-sequencer',
  produces: [
    {
      type: 'generic-color-array',
      dimensionPreference: '2D',
      overlayCompatible: false,
      priority: 60, // Medium-high priority
    },
  ],
};
