import React, { useState } from 'react';
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
  // Track which modules have settings open
  const [openSettings, setOpenSettings] = useState<Set<string>>(new Set());

  const toggleSettings = (instanceId: string) => {
    setOpenSettings(prev => {
      const next = new Set(prev);
      if (next.has(instanceId)) {
        next.delete(instanceId);
      } else {
        next.add(instanceId);
      }
      return next;
    });
  };
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
  // Dynamic column count based on number of modules with optimized breakpoints:
  // - Mobile/tablet: Always 1 column (stacked)
  // - Desktop (1024px+): 2 columns for better width utilization
  // - Large desktop (1280px+): 3 columns for 3-4 modules
  // - Ultra-wide (1536px+): 4 columns for 5+ modules
  const getGridColumns = () => {
    if (modules.length === 1) return 'grid-cols-1'; // Single module: always full width
    if (modules.length === 2) return 'grid-cols-1 lg:grid-cols-2'; // 2 modules: 2 cols at 1024px+
    if (modules.length <= 4) return 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'; // 3-4 modules: 2 cols at 1024px, 3 cols at 1280px
    return 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'; // 5+ modules: 2 cols at 1024px, 3 cols at 1280px, 4 cols at 1536px
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

        // Determine layout based on available width:
        // - Mobile browsers always get 'mobile' layout
        // - Desktop with 2-3 modules = 'mobile' layout (constrained width, use CompactDrumMachine)
        // - Desktop with 1 module = 'desktop' layout (full width, use full DrumMachine)
        const effectiveLayout = isMobile || modules.length >= 2 ? 'mobile' : 'desktop';

        return (
          <div
            key={module.instanceId}
            className={`
              ${!isActive ? 'hidden' : ''}
              ${isMobile ? 'w-full' : 'h-[650px]'}
            `}
          >
            <ModuleWrapper
              moduleId={module.moduleId}
              label={module.label}
              color={definition.color}
              icon={definition.icon}
              onClose={() => onRemoveModule(module.instanceId)}
              onSettings={() => toggleSettings(module.instanceId)}
              showSettings={openSettings.has(module.instanceId)}
            >
              <ModuleComponent
                layout={effectiveLayout}
                settings={module.settings}
                onSettingsChange={(newSettings: Record<string, any>) =>
                  onUpdateSettings(module.instanceId, newSettings)
                }
                embedded={true} // For components that support embedded mode (like LiveAudioVisualizer)
                instanceId={module.instanceId} // Story 15.6: Pass instanceId for module routing
                showSettings={openSettings.has(module.instanceId)} // Controlled settings state
              />
            </ModuleWrapper>
          </div>
        );
      })}
    </div>
  );
};
