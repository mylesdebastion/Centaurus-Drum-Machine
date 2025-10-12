import React, { useState, useEffect } from 'react';
import { GlobalMusicHeader } from '../GlobalMusicHeader';
import { ArrowLeft, Plus, Music } from 'lucide-react';
import { useModuleManager } from './useModuleManager';
import { ModuleSelector } from './ModuleSelector';
import { ModuleCanvas } from './ModuleCanvas';
import { MobileNavigation } from '../Layout/MobileNavigation';
import { getModuleDefinition } from './moduleRegistry';

/**
 * Studio - Dynamic Module Loading System (Story 4.7)
 * Professional workspace that can load multiple music modules dynamically
 * Uses JamSession always-mount pattern for audio/viz persistence
 */

interface StudioProps {
  onBack: () => void;
}

export const Studio: React.FC<StudioProps> = ({ onBack }) => {
  const {
    loadedModules,
    activeModuleId,
    setActiveModuleId,
    addModule,
    removeModule,
    updateModuleSettings,
  } = useModuleManager();

  const [showModuleSelector, setShowModuleSelector] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Responsive detection
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Global Music Header */}
      <GlobalMusicHeader />

      {/* Studio Header */}
      <div className="bg-gray-800/50 border-b border-gray-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Back to Home"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400 hover:text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Music Studio</h1>
              <p className="text-sm text-gray-400">
                {loadedModules.length === 0
                  ? 'Dynamic module workspace'
                  : `${loadedModules.length} module${loadedModules.length > 1 ? 's' : ''} loaded`}
              </p>
            </div>
          </div>

          {/* Add Module Button */}
          <button
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            onClick={() => setShowModuleSelector(true)}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Module</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6 pb-24 md:pb-6">
        <div className="max-w-7xl mx-auto">
          <ModuleCanvas
            modules={loadedModules}
            activeModuleId={activeModuleId}
            isMobile={isMobile}
            onAddModule={() => setShowModuleSelector(true)}
            onRemoveModule={removeModule}
            onUpdateSettings={updateModuleSettings}
          />
        </div>
      </div>

      {/* Module Selector Modal */}
      <ModuleSelector
        isOpen={showModuleSelector}
        onClose={() => setShowModuleSelector(false)}
        onSelect={addModule}
        loadedModules={loadedModules}
      />

      {/* Mobile Navigation */}
      {isMobile && loadedModules.length > 0 && (
        <MobileNavigation
          activeView={activeModuleId || ''}
          onViewChange={setActiveModuleId}
          tabs={loadedModules.map((module) => {
            const definition = getModuleDefinition(module.moduleId);
            return {
              id: module.instanceId,
              label: definition?.name || module.label,
              icon: definition?.icon || Music, // Fallback to generic Music icon
            };
          })}
        />
      )}

      {/* Development Info */}
      <div className="fixed bottom-4 right-4 bg-blue-900/90 border border-blue-700 rounded-lg p-4 max-w-sm shadow-xl">
        <h3 className="text-sm font-semibold text-blue-200 mb-2">
          🚀 Story 4.7: Module Loading System
        </h3>
        <p className="text-xs text-blue-100 mb-2">
          Dynamic workspace with always-mounted modules (JamSession pattern).
        </p>
        <div className="text-xs text-blue-200/70 space-y-1">
          <div>• Desktop: CSS Grid (2-3 columns)</div>
          <div>• Mobile: Single module + tabs</div>
          <div>• Audio/viz persist across module changes</div>
          <div className="pt-2 border-t border-blue-700/50">
            Loaded: {loadedModules.length} module{loadedModules.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  );
};
