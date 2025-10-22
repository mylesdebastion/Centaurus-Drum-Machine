import { ComponentType } from 'react';
import { Piano, Guitar, Music, Activity, Boxes } from 'lucide-react';
import { PianoRoll } from '../PianoRoll/PianoRoll';
import { GuitarFretboard } from '../GuitarFretboard/GuitarFretboard';
import { DrumMachineModule } from './modules/DrumMachineModule';
import { LiveAudioVisualizer } from '../LiveAudioVisualizer/LiveAudioVisualizer';
import { IsometricSequencer } from '../IsometricSequencer/IsometricSequencer';
import { ChordMelodyArranger } from './modules/ChordMelodyArranger';
import type { ModuleCapabilities } from '@/types/moduleRouting';

/**
 * Module Registry for Studio (Story 4.7, Story 15.4)
 * Defines all available modules that can be loaded into the workspace
 */

export interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  component: ComponentType<any>; // Each module has different props
  icon: ComponentType<{ className?: string }>;
  color: string; // Tailwind color class (e.g., 'green-400')
  category: 'instrument' | 'sequencer' | 'visualizer';
  capabilities: ModuleCapabilities; // Story 15.4: Module routing capabilities
}

export interface ModuleComponentProps {
  layout?: 'mobile' | 'desktop';
  settings?: Record<string, any>;
  onSettingsChange?: (settings: Record<string, any>) => void;
  onBack?: () => void; // For compatibility with existing components
  embedded?: boolean; // For components that support embedded mode
  instanceId?: string; // Story 15.4: Unique instance ID for module routing
}

export interface LoadedModule {
  instanceId: string; // Unique ID for this instance (e.g., 'piano-1', 'guitar-2')
  moduleId: string; // Reference to ModuleDefinition.id
  label: string; // Display name (e.g., 'Piano Roll', 'Piano Roll 2')
  settings: Record<string, any>;
}

// Available module definitions
export const AVAILABLE_MODULES: ModuleDefinition[] = [
  {
    id: 'piano',
    name: 'Piano Roll',
    description: '88-key interactive piano with MIDI input and LED output',
    component: PianoRoll,
    icon: Piano,
    color: 'green-400',
    category: 'instrument',
    capabilities: {
      canReceiveNotes: true,
      canReceiveChords: true,
      canReceiveTempo: false,
      canEmitNotes: false,
      canEmitChords: false,
    },
  },
  {
    id: 'guitar',
    name: 'Guitar Fretboard',
    description: '6×25 fretboard with chord progressions and scale visualization',
    component: GuitarFretboard,
    icon: Guitar,
    color: 'amber-400',
    category: 'instrument',
    capabilities: {
      canReceiveNotes: true,
      canReceiveChords: true,
      canReceiveTempo: false,
      canEmitNotes: false,
      canEmitChords: false,
    },
  },
  {
    id: 'drum',
    name: 'Drum Machine',
    description: '16-step rhythm sequencer with sample pads',
    component: DrumMachineModule,
    icon: Music,
    color: 'primary-400',
    category: 'sequencer',
    capabilities: {
      canReceiveNotes: true,
      canReceiveChords: false,
      canReceiveTempo: true,
      canEmitNotes: true,
      canEmitChords: false,
    },
  },
  {
    id: 'visualizer',
    name: 'DJ Visualizer',
    description: 'Live audio frequency analyzer with spectrum and ripple effects',
    component: LiveAudioVisualizer,
    icon: Activity,
    color: 'orange-400',
    category: 'visualizer',
    capabilities: {
      canReceiveNotes: false,
      canReceiveChords: false,
      canReceiveTempo: false,
      canEmitNotes: false,
      canEmitChords: false,
    },
  },
  {
    id: 'isometric',
    name: '3D Sequencer',
    description: 'Isometric note grid with visual feedback',
    component: IsometricSequencer,
    icon: Boxes,
    color: 'cyan-400',
    category: 'sequencer',
    capabilities: {
      canReceiveNotes: true,
      canReceiveChords: false,
      canReceiveTempo: false,
      canEmitNotes: false,
      canEmitChords: false,
    },
  },
  {
    id: 'chord-melody-arranger',
    name: 'Chord & Melody Arranger',
    description: 'Compose chord progressions and melodies with module routing',
    component: ChordMelodyArranger,
    icon: Music,
    color: 'purple-400',
    category: 'sequencer',
    capabilities: {
      canReceiveNotes: false,
      canReceiveChords: false,
      canReceiveTempo: false,
      canEmitNotes: true,
      canEmitChords: true,
    },
  },
];

/**
 * Get module definition by ID
 */
export function getModuleDefinition(moduleId: string): ModuleDefinition | undefined {
  return AVAILABLE_MODULES.find((m) => m.id === moduleId);
}

/**
 * Generate unique instance ID for a module
 */
export function generateInstanceId(moduleId: string, existingModules: LoadedModule[]): string {
  const count = existingModules.filter((m) => m.moduleId === moduleId).length;
  return `${moduleId}-${count + 1}`;
}

/**
 * Create a new loaded module instance
 */
export function createModuleInstance(
  moduleId: string,
  existingModules: LoadedModule[]
): LoadedModule | null {
  const definition = getModuleDefinition(moduleId);
  if (!definition) return null;

  const instanceId = generateInstanceId(moduleId, existingModules);
  const count = existingModules.filter((m) => m.moduleId === moduleId).length;
  const label = count > 0 ? `${definition.name} ${count + 1}` : definition.name;

  return {
    instanceId,
    moduleId,
    label,
    settings: {}, // Empty settings object - modules will populate as needed
  };
}

/**
 * Check if a module type is already loaded
 */
export function isModuleLoaded(moduleId: string, loadedModules: LoadedModule[]): boolean {
  return loadedModules.some((m) => m.moduleId === moduleId);
}

/**
 * Get count of instances for a specific module type
 */
export function getModuleInstanceCount(moduleId: string, loadedModules: LoadedModule[]): number {
  return loadedModules.filter((m) => m.moduleId === moduleId).length;
}
