import React, { ComponentType } from 'react';
import { X, Settings } from 'lucide-react';

/**
 * ModuleWrapper - Provides consistent chrome for all modules (Story 4.7)
 * Wraps each module with header, close button, and optional settings panel
 */

interface ModuleWrapperProps {
  moduleId: string;
  label: string;
  color: string; // Tailwind color class (e.g., 'green-400')
  icon: ComponentType<{ className?: string }>; // Module icon component
  onClose: () => void;
  onSettings?: () => void; // Optional settings toggle callback
  showSettings?: boolean; // Whether settings panel is open (for active state)
  children: React.ReactNode;
}

export const ModuleWrapper: React.FC<ModuleWrapperProps> = ({
  label,
  color,
  icon: Icon,
  onClose,
  onSettings,
  showSettings = false,
  children,
}) => {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden h-full flex flex-col">
      {/* Module Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800/90 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 text-${color}`} />
          <h3 className="font-semibold text-white text-sm">{label}</h3>
        </div>
        <div className="flex items-center gap-1">
          {onSettings && (
            <button
              onClick={onSettings}
              className={`p-1 rounded transition-colors ${
                showSettings
                  ? 'bg-primary-600 text-white'
                  : 'hover:bg-gray-700 text-gray-400 hover:text-white'
              }`}
              aria-label={`${label} settings`}
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
            aria-label={`Close ${label}`}
          >
            <X className="w-4 h-4 text-gray-400 hover:text-white" />
          </button>
        </div>
      </div>

      {/* Module Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};
