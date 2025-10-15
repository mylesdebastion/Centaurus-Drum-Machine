/**
 * OutputSelector Component
 * Epic 15 - Story 15.4: Module Routing System
 *
 * UI component for selecting output destination modules.
 * Displays available target modules with checkboxes for multi-select routing.
 *
 * Features:
 * - Dropdown showing all loaded modules that can receive events
 * - Multi-select with checkboxes
 * - Groups modules by category (instruments, visualizers, etc.)
 * - Empty state when no modules are loaded
 * - Real-time count of selected targets
 */

import React, { useState, useEffect } from 'react';
import { Music, ChevronDown, X } from 'lucide-react';
import { ModuleRoutingService } from '@/services/moduleRoutingService';
import type { LoadedModule } from '@/types/moduleRouting';

export interface OutputSelectorProps {
  sourceInstanceId: string;
  selectedTargets: string[];
  onTargetsChange: (targets: string[]) => void;
  routeNotes?: boolean;
  routeChords?: boolean;
  onRouteNotesChange?: (enabled: boolean) => void;
  onRouteChordsChange?: (enabled: boolean) => void;
}

export const OutputSelector: React.FC<OutputSelectorProps> = ({
  sourceInstanceId,
  selectedTargets,
  onTargetsChange,
  routeNotes = true,
  routeChords = true,
  onRouteNotesChange,
  onRouteChordsChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [availableTargets, setAvailableTargets] = useState<LoadedModule[]>([]);
  const routingService = ModuleRoutingService.getInstance();

  // Refresh available targets when dropdown opens or selected targets change
  useEffect(() => {
    const updateTargets = () => {
      // Get modules that can receive notes or chords
      const noteTargets = routingService.getAvailableTargets(
        sourceInstanceId,
        'canReceiveNotes'
      );
      const chordTargets = routingService.getAvailableTargets(
        sourceInstanceId,
        'canReceiveChords'
      );

      // Combine and deduplicate
      const allTargets = [...noteTargets, ...chordTargets];
      const uniqueTargets = Array.from(
        new Map(allTargets.map((t) => [t.instanceId, t])).values()
      );

      setAvailableTargets(uniqueTargets);
    };

    if (isOpen) {
      updateTargets();
    }
  }, [isOpen, sourceInstanceId, routingService]);

  // Toggle target selection
  const toggleTarget = (instanceId: string) => {
    if (selectedTargets.includes(instanceId)) {
      onTargetsChange(selectedTargets.filter((id) => id !== instanceId));
    } else {
      onTargetsChange([...selectedTargets, instanceId]);
    }
  };

  // Clear all selections
  const clearAll = () => {
    onTargetsChange([]);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.output-selector-dropdown')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative output-selector-dropdown">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors min-h-[44px] ${
          selectedTargets.length > 0
            ? 'bg-primary-600 hover:bg-primary-700 text-white'
            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
        }`}
        aria-label="Select output destinations"
        aria-expanded={isOpen}
      >
        <Music className="w-4 h-4" />
        <span className="text-sm font-medium">
          Output {selectedTargets.length > 0 && `(${selectedTargets.length})`}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-lg min-w-72 z-20">
          {/* Header */}
          <div className="p-4 border-b border-gray-700 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white">Route Output To:</h4>
              {selectedTargets.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                  aria-label="Clear all selections"
                >
                  <X className="w-3 h-3" />
                  Clear All
                </button>
              )}
            </div>

            {/* Routing Filters */}
            <div className="flex gap-4 pt-2 border-t border-gray-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={routeNotes}
                  onChange={(e) => onRouteNotesChange?.(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800"
                />
                <span className="text-xs text-gray-300">Route Notes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={routeChords}
                  onChange={(e) => onRouteChordsChange?.(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500 focus:ring-offset-gray-800"
                />
                <span className="text-xs text-gray-300">Route Chords</span>
              </label>
            </div>
          </div>

          {/* Module List */}
          <div className="p-4 max-h-96 overflow-y-auto">
            {availableTargets.length === 0 ? (
              // Empty State
              <div className="text-center py-8">
                <Music className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                <p className="text-sm text-gray-400 mb-1">No modules loaded</p>
                <p className="text-xs text-gray-500">
                  Add modules to Studio to route output
                </p>
              </div>
            ) : (
              // Module Checkboxes
              <div className="space-y-2">
                {availableTargets.map((target) => {
                  const isSelected = selectedTargets.includes(target.instanceId);

                  return (
                    <label
                      key={target.instanceId}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-primary-600/20 hover:bg-primary-600/30'
                          : 'hover:bg-gray-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleTarget(target.instanceId)}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-primary-600 focus:ring-primary-500 focus:ring-offset-gray-800"
                        aria-label={`Route to ${target.name}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">
                          {target.name}
                        </div>
                        <div className="text-xs text-gray-400 truncate">
                          {target.moduleId}
                        </div>
                      </div>
                      {/* Capability Badges */}
                      <div className="flex gap-1">
                        {target.capabilities.canReceiveNotes && (
                          <span
                            className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded"
                            title="Can receive notes"
                          >
                            Notes
                          </span>
                        )}
                        {target.capabilities.canReceiveChords && (
                          <span
                            className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded"
                            title="Can receive chords"
                          >
                            Chords
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {availableTargets.length > 0 && (
            <div className="p-3 border-t border-gray-700 bg-gray-850">
              <p className="text-xs text-gray-400 text-center">
                {selectedTargets.length === 0
                  ? 'Select modules to receive events'
                  : `Events will be sent to ${selectedTargets.length} ${
                      selectedTargets.length === 1 ? 'module' : 'modules'
                    }`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
