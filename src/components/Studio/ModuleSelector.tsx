import React from 'react';
import { X, Check } from 'lucide-react';
import { AVAILABLE_MODULES, LoadedModule, getModuleInstanceCount } from './moduleRegistry';

/**
 * ModuleSelector - Modal for selecting modules to add to workspace (Story 4.7)
 */

interface ModuleSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (moduleId: string) => void;
  loadedModules: LoadedModule[];
}

export const ModuleSelector: React.FC<ModuleSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  loadedModules,
}) => {
  if (!isOpen) return null;

  const handleSelect = (moduleId: string) => {
    onSelect(moduleId);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-gray-800 rounded-xl border border-gray-700 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Add Module</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Module Grid */}
        <div className="p-4 overflow-y-auto flex-1">
          <div className="grid sm:grid-cols-2 gap-3">
            {AVAILABLE_MODULES.map((module) => {
              const Icon = module.icon;
              const instanceCount = getModuleInstanceCount(module.id, loadedModules);
              const isLoaded = instanceCount > 0;

              return (
                <button
                  key={module.id}
                  onClick={() => handleSelect(module.id)}
                  className={`group text-left p-4 rounded-lg border transition-all ${
                    isLoaded
                      ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'
                      : 'bg-gray-800/50 border-gray-700 hover:border-primary-500/50 hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Icon className={`w-6 h-6 text-${module.color}`} />
                      <h3 className="font-semibold text-white">{module.name}</h3>
                    </div>
                    {isLoaded && (
                      <div className="flex items-center gap-1 text-xs text-green-400">
                        <Check className="w-3 h-3" />
                        <span>{instanceCount}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-gray-400 mb-3">{module.description}</p>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 capitalize">{module.category}</span>
                    {isLoaded ? (
                      <span className="text-green-400">Add another</span>
                    ) : (
                      <span className={`text-${module.color} group-hover:text-${module.color}/80`}>
                        Add to workspace
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 bg-gray-800/50">
          <p className="text-sm text-gray-400 text-center">
            You can add multiple instances of the same module
          </p>
        </div>
      </div>
    </div>
  );
};
