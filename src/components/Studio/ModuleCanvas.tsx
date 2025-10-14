import React from 'react';
import { Plus } from 'lucide-react';
import { LoadedModule, getModuleDefinition } from './moduleRegistry';
import { ModuleWrapper } from './ModuleWrapper';

/**
 * ModuleCanvas - Renders loaded modules with always-mount pattern (Story 4.7)
 * CRITICAL: All modules always mounted, CSS controls visibility (JamSession pattern)
 */

interface ModuleCanvasProps {
  modules: LoadedModule[];
  activeModuleId: string | null;
  isMobile: boolean;
  onAddModule: () => void;
  onRemoveModule: (instanceId: string) => void;
  onUpdateSettings: (instanceId: string, settings: Record<string, any>) => void;
}

export const ModuleCanvas: React.FC<ModuleCanvasProps> = ({
  modules,
  activeModuleId,
  isMobile,
  onAddModule,
  onRemoveModule,
  onUpdateSettings,
}) => {
  // Empty state - no modules loaded
  if (modules.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <Plus className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Your Studio is Empty</h2>
          <p className="text-gray-400 mb-6">
            Click the "+ Add Module" button above to start building your workspace
          </p>
          <button
            onClick={onAddModule}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-semibold"
          >
            Add Your First Module
          </button>
        </div>
      </div>
    );
  }

  // Render loaded modules with always-mount pattern
  // Dynamic column count based on number of modules:
  // 1 module = full width (1 col), 2 modules = 50/50 (2 cols), 3+ modules = 33/33/33 (3 cols)
  const getGridColumns = () => {
    if (modules.length === 1) return 'grid-cols-1';
    if (modules.length === 2) return 'grid-cols-1 lg:grid-cols-2';
    return 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'; // 3+ modules
  };

  return (
    <div
      className={
        isMobile
          ? 'space-y-4' // Mobile: stack vertically
          : `grid ${getGridColumns()} gap-6` // Desktop: dynamic columns
      }
    >
      {/* 🚨 CRITICAL: All modules always rendered, CSS controls visibility */}
      {modules.map((module) => {
        const definition = getModuleDefinition(module.moduleId);
        if (!definition) {
          console.error('[ModuleCanvas] Module definition not found:', module.moduleId);
          return null;
        }

        const ModuleComponent = definition.component;
        const isActive = !isMobile || activeModuleId === module.instanceId;

        return (
          <div
            key={module.instanceId}
            className={`
              ${!isActive ? 'hidden' : ''}
              ${isMobile ? 'w-full' : 'h-[600px] overflow-y-auto'}
            `}
          >
            <ModuleWrapper
              moduleId={module.moduleId}
              label={module.label}
              color={definition.color}
              onClose={() => onRemoveModule(module.instanceId)}
            >
              <ModuleComponent
                layout={isMobile ? 'mobile' : 'desktop'}
                settings={module.settings}
                onSettingsChange={(newSettings: Record<string, any>) =>
                  onUpdateSettings(module.instanceId, newSettings)
                }
                embedded={true} // For components that support embedded mode (like LiveAudioVisualizer)
              />
            </ModuleWrapper>
          </div>
        );
      })}
    </div>
  );
};
