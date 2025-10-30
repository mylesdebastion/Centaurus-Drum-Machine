import React, { useState, useEffect } from 'react';
import { GlobalMusicHeader } from '../GlobalMusicHeader';
import { ArrowLeft, Plus, Music, Layers } from 'lucide-react';
import { useModuleManager } from './useModuleManager';
import { ModuleSelector } from './ModuleSelector';
import { ModuleCanvas } from './ModuleCanvas';
import { MobileNavigation } from '../Layout/MobileNavigation';
import { getModuleDefinition } from './moduleRegistry';
import { ledCompositor, type CompositorEvent } from '../../services/LEDCompositor';
import type { BlendMode } from '../../types';
import { getPreset, type StudioPreset } from '../../config/studioPresets';
import { StudioTourOverlay } from './StudioTourOverlay';

/**
 * Studio - Dynamic Module Loading System (Story 4.7 + 23.1 + 23.2)
 * Professional workspace that can load multiple music modules dynamically
 * Uses JamSession always-mount pattern for audio/viz persistence
 *
 * Story 23.1: Added preset system for persona-specific onboarding
 * - Accepts ?preset=musician or ?v=m URL parameters
 * - Auto-loads modules from preset configuration
 * - Enables tour overlay if preset.tourEnabled=true
 *
 * Story 23.2: Added gradual interface reveal tour
 * - StudioTourOverlay component highlights elements
 * - Step-by-step guidance with user interaction
 * - Saves completion to localStorage
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
    reorderModules,
  } = useModuleManager();

  const [showModuleSelector, setShowModuleSelector] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showCompositorPanel, setShowCompositorPanel] = useState(false);
  const [currentBlendMode, setCurrentBlendMode] = useState<BlendMode>(ledCompositor.getBlendMode());
  const [compositedFramePixels, setCompositedFramePixels] = useState<number>(0);
  const [deviceMap, setDeviceMap] = useState<Map<string, Set<string>>>(new Map()); // deviceId → Set<moduleId>
  const [activePreset, setActivePreset] = useState<StudioPreset | null>(null);
  const [showTour, setShowTour] = useState(false);
  const [presetLoaded, setPresetLoaded] = useState(false);

  // Responsive detection
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Story 23.1: Parse URL parameters and load preset
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const presetParam = urlParams.get('preset'); // ?preset=musician
    const personaParam = urlParams.get('v'); // ?v=m
    const tourParam = urlParams.get('tour'); // ?tour=true

    // Determine which preset to load
    const presetCode = presetParam || personaParam;
    if (presetCode) {
      const preset = getPreset(presetCode);
      setActivePreset(preset);

      // Enable tour if explicitly requested OR if preset has tour enabled
      if (tourParam === 'true' || preset.tourEnabled) {
        // Check if user has already completed this preset's tour
        const tourCompletedKey = `hasCompletedTour_${preset.id}`;
        const hasCompletedTour = localStorage.getItem(tourCompletedKey) === 'true';

        if (!hasCompletedTour) {
          setShowTour(true);
        }
      }
    }
  }, []);

  // Story 23.1: Auto-load modules from preset
  useEffect(() => {
    if (activePreset && !presetLoaded && activePreset.initialModules.length > 0) {
      // Clear existing modules first (prevent stacking when switching personas)
      loadedModules.forEach(module => removeModule(module.instanceId));

      // Then load preset modules
      activePreset.initialModules.forEach((moduleId) => {
        addModule(moduleId);
      });
      setPresetLoaded(true);
    }
  }, [activePreset, presetLoaded, addModule, loadedModules, removeModule]);

  // Subscribe to compositor events
  useEffect(() => {
    const handleCompositorEvent = (event: CompositorEvent) => {
      if (event.type === 'composited-frame') {
        setCompositedFramePixels(event.pixelData.length / 3);
      } else if (event.type === 'frame-submitted') {
        setDeviceMap(prev => {
          const next = new Map(prev);
          const modulesForDevice = next.get(event.deviceId) || new Set();
          modulesForDevice.add(event.moduleId);
          next.set(event.deviceId, modulesForDevice);
          return next;
        });
      }
    };

    ledCompositor.addEventListener(handleCompositorEvent);
    return () => ledCompositor.removeEventListener(handleCompositorEvent);
  }, []);

  // Handle blend mode changes
  const handleBlendModeChange = (mode: BlendMode) => {
    ledCompositor.setBlendMode(mode);
    setCurrentBlendMode(mode);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Global Music Header */}
      <GlobalMusicHeader />

      {/* Studio Header */}
      <div className="bg-gray-800/50 border-b border-gray-700 px-4 py-3">
        <div className="max-w-7xl xl:max-w-[90%] 2xl:max-w-[92%] 3xl:max-w-[95%] mx-auto flex items-center justify-between">
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

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              onClick={() => setShowCompositorPanel(!showCompositorPanel)}
            >
              <Layers className="w-4 h-4" />
              <span className="hidden sm:inline">LED Compositor</span>
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              onClick={() => setShowModuleSelector(true)}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Module</span>
            </button>
          </div>
        </div>
      </div>

      {/* LED Compositor Panel */}
      {showCompositorPanel && (
        <div className="bg-gray-800/90 border-b border-gray-700 px-4 py-4">
          <div className="max-w-7xl xl:max-w-[90%] 2xl:max-w-[92%] 3xl:max-w-[95%] mx-auto">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-accent-400" />
              LED Compositor (Epic 14, Story 14.7)
            </h3>
            <div className="flex items-center gap-6 flex-wrap">
              {/* Blend Mode Selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Blend Mode:</span>
                <select
                  value={currentBlendMode}
                  onChange={(e) => handleBlendModeChange(e.target.value as BlendMode)}
                  className="px-3 py-1.5 bg-gray-700 border border-gray-600 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                >
                  <option value="multiply">Multiply (Darkens)</option>
                  <option value="screen">Screen (Lightens)</option>
                  <option value="additive">Additive (Adds RGB)</option>
                  <option value="max">Max (Brightest Wins)</option>
                </select>
              </div>

              {/* Status Info */}
              <div className="text-xs text-gray-400 space-y-2">
                <div>Compositor blends LED frames from multiple modules using visual compositing algorithms</div>

                {/* Device Mapping */}
                <div className="pt-2 border-t border-gray-600 space-y-1">
                  <div className="font-semibold text-gray-300">Device Status:</div>
                  {Array.from(deviceMap.entries()).map(([deviceId, modules]) => (
                    <div key={deviceId} className="pl-2">
                      <span className="text-gray-500">→ {deviceId}:</span>{' '}
                      <span className="text-white">{Array.from(modules).join(', ')}</span>
                      {modules.size > 1 && (
                        <span className="ml-2 text-green-400">✓ Blending {modules.size} modules</span>
                      )}
                    </div>
                  ))}
                  {deviceMap.size === 0 && (
                    <div className="text-yellow-400">⚠ No frames received yet</div>
                  )}
                  {deviceMap.size > 1 && (
                    <div className="text-yellow-400 pt-1">
                      ⚠ Modules targeting different devices - no cross-device blending
                    </div>
                  )}
                  {compositedFramePixels > 0 && (
                    <div className="text-green-400 pt-1">
                      ✓ Composited frame: {compositedFramePixels} pixels
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="p-6 pb-24 md:pb-6">
        <div className="max-w-7xl xl:max-w-[90%] 2xl:max-w-[92%] 3xl:max-w-[95%] mx-auto">
          <ModuleCanvas
            modules={loadedModules}
            activeModuleId={activeModuleId}
            isMobile={isMobile}
            onAddModule={() => setShowModuleSelector(true)}
            onRemoveModule={removeModule}
            onUpdateSettings={updateModuleSettings}
            onReorderModules={reorderModules}
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

      {/* Story 23.2: Tour Overlay */}
      {showTour && activePreset && activePreset.tourSteps && (
        <StudioTourOverlay
          steps={activePreset.tourSteps}
          presetId={activePreset.id}
          onComplete={() => setShowTour(false)}
          onSkip={() => setShowTour(false)}
        />
      )}

    </div>
  );
};
