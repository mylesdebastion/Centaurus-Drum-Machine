/**
 * Piano Roll 1D Fallback Rule
 * Story 18.4: Context-Aware Routing Rules
 *
 * Piano roll uses 1D strip for piano-keys visualization if no 2D grid available
 */

import type { RoutingRule } from '@/types/routing-rules';

export const PianoRoll1DFallbackRule: RoutingRule = {
  name: 'PianoRoll1DFallback',
  description: 'Piano roll uses 1D strip for piano-keys if no 2D grid available',
  priority: 40,

  condition: (context) => {
    const pianoRollActive = context.activeModule === 'piano-roll';
    const has1DStrip = context.availableDevices.some(
      (d) => d.capabilities.dimensions === '1D'
    );
    const no2DGrid = !context.availableDevices.some(
      (d) => d.capabilities.dimensions === '2D'
    );

    return pianoRollActive && has1DStrip && no2DGrid;
  },

  action: (_context, currentAssignments) => {
    // Find piano roll assignment on 1D strip
    const pianoAssignment = currentAssignments.find(
      (a) =>
        a.primary.moduleId === 'piano-roll' &&
        a.device.capabilities.dimensions === '1D'
    );

    if (!pianoAssignment) return currentAssignments;

    // Ensure piano-keys visualization is used
    return currentAssignments.map((assignment) => {
      if (assignment.device.id === pianoAssignment.device.id) {
        return {
          ...assignment,
          primary: {
            ...assignment.primary,
            visualizationType: 'piano-keys',
          },
        };
      }
      return assignment;
    });
  },
};
