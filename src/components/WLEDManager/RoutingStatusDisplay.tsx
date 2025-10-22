/**
 * Routing Status Display Component
 * Story 18.5: WLED Manager UI
 */

import React from 'react';
import { Activity, Layers } from 'lucide-react';
import type { DeviceAssignment } from '@/types/visualization';

interface RoutingStatusDisplayProps {
  assignments: DeviceAssignment[];
}

export const RoutingStatusDisplay: React.FC<RoutingStatusDisplayProps> = ({
  assignments,
}) => {
  if (assignments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Activity className="w-10 h-10 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No active routing assignments</p>
        <p className="text-xs mt-1">Open a module to see routing in action</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
        <Activity className="w-4 h-4" />
        <span>{assignments.length} device(s) actively routed</span>
      </div>

      <div className="grid gap-3">
        {assignments.map((assignment, index) => (
          <div
            key={index}
            className="bg-gray-700/40 rounded-lg border border-gray-600 p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-white mb-1">
                  {assignment.device.name}
                </h4>
                <p className="text-xs text-gray-400">
                  {assignment.device.capabilities.dimensions === '2D'
                    ? `${assignment.device.capabilities.gridConfig?.width}×${assignment.device.capabilities.gridConfig?.height} Grid`
                    : `${assignment.device.capabilities.ledCount} LEDs`}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Score</div>
                <div className="text-lg font-bold text-primary-400">
                  {assignment.primary.compatibilityScore.toFixed(0)}
                </div>
              </div>
            </div>

            {/* Primary Module */}
            <div className="bg-gray-800/60 rounded p-3 mb-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-primary-400 rounded-full"></div>
                <span className="text-xs font-medium text-gray-400">Primary</span>
              </div>
              <div className="text-sm">
                <span className="font-semibold text-white">
                  {assignment.primary.moduleId}
                </span>
                <span className="text-gray-500 mx-2">→</span>
                <span className="text-gray-300">
                  {assignment.primary.visualizationType}
                </span>
              </div>
            </div>

            {/* Overlays */}
            {assignment.overlays.length > 0 && (
              <div className="space-y-2">
                {assignment.overlays.map((overlay, overlayIndex) => (
                  <div
                    key={overlayIndex}
                    className="bg-gray-800/40 rounded p-3 border border-gray-700"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Layers className="w-3 h-3 text-accent-400" />
                      <span className="text-xs font-medium text-gray-400">Overlay</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-semibold text-white">
                        {overlay.moduleId}
                      </span>
                      <span className="text-gray-500 mx-2">→</span>
                      <span className="text-gray-300">
                        {overlay.visualizationType}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
