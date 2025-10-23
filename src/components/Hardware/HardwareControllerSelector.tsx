/**
 * HardwareControllerSelector - UI for switching hardware controllers
 *
 * Dropdown-based interface for selecting and connecting to hardware controllers.
 * Shows connection status, handles unavailable controllers, and persists selection.
 */

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plug, Settings as SettingsIcon, Lock } from 'lucide-react';
import { useControllerSelection } from '../../hardware/core/useControllerSelection';

export const HardwareControllerSelector: React.FC = () => {
  const {
    selectedType,
    activeController,
    allControllers,
    switchController,
    isConnecting,
    connectionError
  } = useControllerSelection();

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedDefinition = allControllers.find(c => c.id === selectedType);

  return (
    <div className="space-y-3">
      {/* Main Controller Selector */}
      <div className="flex items-center gap-2 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <Plug className="w-5 h-5 text-gray-400" />

        {/* Controller Dropdown */}
        <div ref={dropdownRef} className="relative flex-1">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={isConnecting}
            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex flex-col items-start">
              <span className="text-white font-medium">
                {selectedDefinition?.name || 'Select Controller'}
              </span>
              {selectedDefinition && selectedDefinition.id !== 'none' && (
                <span className="text-xs text-gray-400">
                  {selectedDefinition.manufacturer} • {selectedDefinition.gridSize}
                </span>
              )}
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 rounded-lg border border-gray-700 shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="p-2 space-y-1">
                {allControllers.map(definition => (
                  <button
                    key={definition.id}
                    onClick={() => {
                      if (definition.available) {
                        switchController(definition.id);
                        setShowDropdown(false);
                      }
                    }}
                    disabled={!definition.available}
                    className={`w-full px-4 py-3 text-left rounded-lg transition-colors min-h-[44px] flex items-center justify-between ${
                      definition.id === selectedType
                        ? 'bg-primary-600 text-white'
                        : definition.available
                        ? 'hover:bg-gray-700 text-gray-300'
                        : 'opacity-50 cursor-not-allowed text-gray-500'
                    }`}
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{definition.name}</span>
                        {!definition.available && (
                          <Lock className="w-3 h-3 text-gray-500" />
                        )}
                      </div>
                      <span className="text-sm text-gray-400">
                        {definition.description}
                      </span>
                    </div>
                    {definition.id === selectedType && (
                      <span className="text-yellow-400 text-xl">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Connection Status */}
        {activeController && (
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              isConnecting ? 'bg-yellow-500 animate-pulse' :
              activeController.connectionStatus === 'connected' ? 'bg-green-500' :
              activeController.connectionStatus === 'error' ? 'bg-red-500' :
              'bg-gray-500'
            }`} />
            <span className="text-sm text-gray-400 capitalize">
              {isConnecting ? 'Connecting...' : activeController.connectionStatus}
            </span>
          </div>
        )}

        {/* Settings Button (Future: Rotation, grid mapping, etc.) */}
        <button
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          title="Controller settings (coming soon)"
          disabled
        >
          <SettingsIcon className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Connection Error */}
      {connectionError && (
        <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg">
          <p className="text-sm text-red-400">
            ⚠️ {connectionError}
          </p>
        </div>
      )}

      {/* Info Message for "None" */}
      {selectedType === 'none' && (
        <div className="p-3 bg-gray-700/50 rounded-lg">
          <p className="text-sm text-gray-400">
            💡 <strong>Tip:</strong> Select a hardware controller above to enable LED feedback and physical button control.
          </p>
        </div>
      )}
    </div>
  );
};
