/**
 * Audio Reactive Overlay Rule
 * Story 18.4: Context-Aware Routing Rules
 *
 * Audio reactive always overlays on all devices (additive effect)
 */

import type { RoutingRule } from '@/types/routing-rules';

export const AudioReactiveOverlayRule: RoutingRule = {
  name: 'AudioReactiveOverlay',
  description: 'Audio reactive overlays on all devices',
  priority: 50,

  condition: (context) => {
    // Check if audio reactive module is registered
    return context.registeredModules.has('audio-reactive');
  },

  action: (context, currentAssignments) => {
    const audioReactiveCap = context.registeredModules.get('audio-reactive');
    if (!audioReactiveCap) return currentAssignments;

    // Add audio reactive overlay to all assignments
    return currentAssignments.map((assignment) => {
      // Skip if audio reactive is already primary or overlay
      const alreadyHasAudioReactive =
        assignment.primary.moduleId === 'audio-reactive' ||
        assignment.overlays.some((o) => o.moduleId === 'audio-reactive');

      if (alreadyHasAudioReactive) return assignment;

      // Find best overlay producer for this device
      const overlayProducers = audioReactiveCap.produces.filter(
        (p) => p.overlayCompatible
      );

      const compatibleProducer = overlayProducers.find((producer) => {
        const dimMatch =
          producer.dimensionPreference === assignment.device.capabilities.dimensions ||
          producer.dimensionPreference === 'either';
        return dimMatch;
      });

      if (!compatibleProducer) return assignment;

      // Add overlay
      return {
        ...assignment,
        overlays: [
          ...assignment.overlays,
          {
            moduleId: 'audio-reactive',
            visualizationType: compatibleProducer.type,
            producer: compatibleProducer,
          },
        ],
      };
    });
  },
};
