/**
 * Generic Fallback Rule
 * Story 18.4: Context-Aware Routing Rules
 *
 * Fallback to generic color array if no compatible visualization found
 * Lowest priority - only applies when no other rules match
 */

import type { RoutingRule } from '@/types/routing-rules';

export const GenericFallbackRule: RoutingRule = {
  name: 'GenericFallback',
  description: 'Fallback to generic color array for unassigned devices',
  priority: 10, // Lowest priority (last resort)

  condition: (context) => {
    // Check if any device has no assignment
    const assignedDeviceIds = new Set(
      context.currentAssignments.map((a) => a.device.id)
    );

    const unassignedDevices = context.availableDevices.filter(
      (d) => !assignedDeviceIds.has(d.id)
    );

    return unassignedDevices.length > 0;
  },

  action: (context, currentAssignments) => {
    // Find unassigned devices
    const assignedDeviceIds = new Set(
      currentAssignments.map((a) => a.device.id)
    );

    const unassignedDevices = context.availableDevices.filter(
      (d) => !assignedDeviceIds.has(d.id)
    );

    if (unassignedDevices.length === 0) return currentAssignments;

    // Assign generic fallback to unassigned devices
    // Use active module if available, otherwise first registered module
    const fallbackModuleId: any =
      context.activeModule ||
      Array.from(context.registeredModules.keys())[0] ||
      'drum-machine';

    const fallbackAssignments = unassignedDevices.map((device) => ({
      device,
      primary: {
        moduleId: fallbackModuleId,
        visualizationType: 'generic-color-array' as const,
        producer: {
          type: 'generic-color-array' as const,
          dimensionPreference: 'either' as const,
          overlayCompatible: false,
          priority: 1,
        },
        compatibilityScore: 1,
      },
      overlays: [],
      totalPriority: 1,
    }));

    return [...currentAssignments, ...fallbackAssignments];
  },
};
