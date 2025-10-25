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
  onReorderModules: (newOrder: LoadedModule[]) => void;
}

export const ModuleCanvas: React.FC<ModuleCanvasProps> = ({
  modules,
  activeModuleId,
  isMobile,
  onAddModule,
  onRemoveModule,
  onUpdateSettings,
  onReorderModules,
}) => {
  // Track which modules have settings open
  const [openSettings, setOpenSettings] = useState<Set<string>>(new Set());

  // Track which modules are minimized
  const [minimizedModules, setMinimizedModules] = useState<Set<string>>(new Set());

  // Drag-and-drop state
  const [draggedModuleId, setDraggedModuleId] = useState<string | null>(null);
  const [dragOverModuleId, setDragOverModuleId] = useState<string | null>(null);

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

  const toggleMinimize = (instanceId: string) => {
    setMinimizedModules(prev => {
      const next = new Set(prev);
      if (next.has(instanceId)) {
        next.delete(instanceId);
      } else {
        next.add(instanceId);
      }
      return next;
    });
  };

  // Drag-and-drop handlers
  const handleDragStart = (instanceId: string) => {
    setDraggedModuleId(instanceId);
  };

  const handleDragOver = (e: React.DragEvent, instanceId: string) => {
    e.preventDefault(); // Allow drop
    setDragOverModuleId(instanceId);
  };

  const handleDragLeave = () => {
    setDragOverModuleId(null);
  };

  const handleDrop = (e: React.DragEvent, targetInstanceId: string) => {
    e.preventDefault();

    if (!draggedModuleId || draggedModuleId === targetInstanceId) {
      setDraggedModuleId(null);
      setDragOverModuleId(null);
      return;
    }

    // Find indices
    const draggedIndex = modules.findIndex(m => m.instanceId === draggedModuleId);
    const targetIndex = modules.findIndex(m => m.instanceId === targetInstanceId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedModuleId(null);
      setDragOverModuleId(null);
      return;
    }

    // Reorder array
    const newModules = [...modules];
    const [removed] = newModules.splice(draggedIndex, 1);
    newModules.splice(targetIndex, 0, removed);

    onReorderModules(newModules);
    setDraggedModuleId(null);
    setDragOverModuleId(null);
  };

  const handleDragEnd = () => {
    setDraggedModuleId(null);
    setDragOverModuleId(null);
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
  // - Large desktop (1280px+): 3 columns
  // - Ultra-wide (2560px+): 5 columns
  // - Super ultra-wide (3440px+): 6 columns
  const getGridColumns = () => {
    if (modules.length === 1) return 'grid-cols-1'; // Single module: always full width
    if (modules.length === 2) return 'grid-cols-1 lg:grid-cols-2 3xl:grid-cols-2'; // 2 modules: 2 cols (even on ultra-wide)
    if (modules.length === 3) return 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-3'; // 3 modules: max 3 cols
    if (modules.length === 4) return 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4'; // 4 modules: 4 cols at 2560px+
    if (modules.length === 5) return 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5'; // 5 modules: 5 cols at 2560px+
    return 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 4xl:grid-cols-6'; // 6+ modules: 6 cols at 3440px+
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

        const isDragging = draggedModuleId === module.instanceId;
        const isDraggedOver = dragOverModuleId === module.instanceId;
        const isMinimized = minimizedModules.has(module.instanceId);

        return (
          <div
            key={module.instanceId}
            className={`
              ${!isActive ? 'hidden' : ''}
              ${isMobile ? 'w-full' : (isMinimized ? 'h-auto' : 'h-[650px]')}
              ${isDragging ? 'opacity-50' : ''}
              ${isDraggedOver ? 'ring-2 ring-primary-500' : ''}
              transition-opacity
            `}
            onDragOver={(e) => handleDragOver(e, module.instanceId)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, module.instanceId)}
          >
            <ModuleWrapper
              moduleId={module.moduleId}
              label={module.label}
              color={definition.color}
              icon={definition.icon}
              onClose={() => onRemoveModule(module.instanceId)}
              onSettings={() => toggleSettings(module.instanceId)}
              showSettings={openSettings.has(module.instanceId)}
              onDragStart={() => handleDragStart(module.instanceId)}
              onDragEnd={handleDragEnd}
              isMinimized={isMinimized}
              onToggleMinimize={() => toggleMinimize(module.instanceId)}
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
