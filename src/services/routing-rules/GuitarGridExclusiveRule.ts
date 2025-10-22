/**
 * Guitar Grid Exclusive Rule
 * Story 18.4: Context-Aware Routing Rules
 *
 * Guitar fretboard gets 2D grid exclusively (no overlays from other modules)
 */

import type { RoutingRule } from '@/types/routing-rules';

export const GuitarGridExclusiveRule: RoutingRule = {
  name: 'GuitarGridExclusive',
  description: 'Guitar fretboard gets 2D grid exclusively (no overlays)',
  priority: 90,

  condition: (context) => {
    // Rule applies if guitar is active and at least one 2D grid available
    const guitarActive = context.activeModule === 'guitar-fretboard';
    const has2DGrid = context.availableDevices.some(
      (d) => d.capabilities.dimensions === '2D'
    );

    return guitarActive && has2DGrid;
  },

  action: (_context, currentAssignments) => {
    // Find assignment for guitar module on 2D grid
    const guitarAssignment = currentAssignments.find(
      (a) =>
        a.primary.moduleId === 'guitar-fretboard' &&
        a.device.capabilities.dimensions === '2D'
    );

    if (!guitarAssignment) return currentAssignments;

    // Remove overlays from guitar's grid device
    return currentAssignments.map((assignment) => {
      if (assignment.device.id === guitarAssignment.device.id) {
        return {
          ...assignment,
          overlays: [], // Clear overlays (exclusive mode)
        };
      }
      return assignment;
    });
  },
};
