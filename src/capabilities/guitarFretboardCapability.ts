/**
 * Guitar Fretboard Visualization Capability
 * Story 18.2: Module Capability Declaration
 */

import type { ModuleVisualizationCapability } from '@/types/visualization';

export const guitarFretboardCapability: ModuleVisualizationCapability = {
  moduleId: 'guitar-fretboard',
  produces: [
    {
      type: 'fretboard-grid',
      dimensionPreference: '2D',
      overlayCompatible: false, // Exclusive (guitar grid is exclusive)
      priority: 85, // Very high priority (fretboard dominates when active)
    },
    {
      type: 'generic-color-array',
      dimensionPreference: 'either',
      overlayCompatible: false,
      priority: 10, // Low priority (fallback)
    },
  ],
};
