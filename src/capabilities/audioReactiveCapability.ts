/**
 * Audio Reactive Visualization Capability
 * Story 18.2: Module Capability Declaration
 */

import type { ModuleVisualizationCapability } from '@/types/visualization';

export const audioReactiveCapability: ModuleVisualizationCapability = {
  moduleId: 'audio-reactive',
  produces: [
    {
      type: 'midi-trigger-ripple',
      dimensionPreference: 'either', // Works on both 1D and 2D
      overlayCompatible: true, // Can overlay on other visualizations
      priority: 50, // Medium priority (overlay effect)
    },
    {
      type: 'audio-spectrum',
      dimensionPreference: '1D',
      overlayCompatible: true, // Can overlay on 1D strips
      priority: 45, // Medium priority (audio overlay)
    },
  ],
};
