/**
 * Drum Machine Grid Takeover Rule
 * Story 18.4: Context-Aware Routing Rules
 *
 * Drum machine uses 2D grid for multi-track step sequencer visualization
 */

import type { RoutingRule } from '@/types/routing-rules';

export const DrumMachineGridTakeoverRule: RoutingRule = {
  name: 'DrumMachineGridTakeover',
  description: 'Drum machine uses 2D grid for multi-track step sequencer',
  priority: 90,

  condition: (context) => {
    const drumMachineActive = context.activeModule === 'drum-machine';
    const has2DGrid = context.availableDevices.some(
      (d) => d.capabilities.dimensions === '2D'
    );

    return drumMachineActive && has2DGrid;
  },

  action: (_context, currentAssignments) => {
    // Find assignment for drum machine on 2D grid
    const drumAssignment = currentAssignments.find(
      (a) =>
        a.primary.moduleId === 'drum-machine' &&
        a.device.capabilities.dimensions === '2D'
    );

    if (!drumAssignment) return currentAssignments;

    // Ensure drum machine uses step-sequencer-grid visualization
    return currentAssignments.map((assignment) => {
      if (assignment.device.id === drumAssignment.device.id) {
        return {
          ...assignment,
          primary: {
            ...assignment.primary,
            visualizationType: 'step-sequencer-grid',
          },
        };
      }
      return assignment;
    });
  },
};
