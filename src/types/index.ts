export interface User {
  id: string;
  name: string;
  color: string;
  isHost: boolean;
}

export interface JamSession {
  id: string;
  name: string;
  code: string;
  users: User[];
  tempo: number;
  isPlaying: boolean;
  currentStep: number;
  createdAt: Date;
}

export interface DrumTrack {
  id: string;
  name: string;
  instrument: string;
  steps: boolean[];
  velocities: number[];
  muted: boolean;
  solo: boolean;
  volume: number;
  color: string;
}

export interface DrumPattern {
  id: string;
  name: string;
  tracks: DrumTrack[];
  tempo: number;
  isDefault?: boolean;
}

export type ColorMode = 'spectrum' | 'chromatic' | 'harmonic';

export interface VisualizerSettings {
  colorMode: ColorMode;
  brightness: number;
  ledMatrixEnabled: boolean;
  ledMatrixIP: string;
}

export interface MIDINote {
  note: number;
  velocity: number;
  channel: number;
  timestamp: number;
  userId: string;
}

export interface EducationLesson {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  steps: LessonStep[];
}

export interface LessonStep {
  id: string;
  instruction: string;
  expectedPattern?: boolean[];
  hint?: string;
  completed: boolean;
}

// Responsive Layout Types
export type LayoutStrategy = 'tabs' | 'collapsible' | 'hybrid';
export type Breakpoint = 'mobile' | 'tablet' | 'desktop';
export type Orientation = 'portrait' | 'landscape';

export interface ResponsiveContextValue {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoint: Breakpoint;
  orientation: Orientation;
  isTouchDevice: boolean;
  layoutStrategy?: LayoutStrategy;
}

export interface NavTab {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
}

// Re-export hardware types for convenient access
export type {
  ConnectionStatus,
  HardwareEventType,
  ControllerCapabilities,
  HardwareEvent,
  HardwareController,
  SequencerState,
  ControllerState,
  HardwareContextType,
} from '../hardware';

// Module adapter types (Epic 14 - Module Adapter Pattern)
export type {
  ModuleContext,
  ModuleAdapterProps,
  ModuleStateResolution,
} from './moduleAdapter';

// LED Compositor types (Epic 14, Story 14.7 - LED Compositor)
export type {
  BlendMode,
  RGB,
} from './blendMode';
export { blendPixels } from './blendMode';

export type {
  LEDFrame,
} from './ledFrame';

export type {
  VisualizationMode,
} from './visualizationMode';
export {
  COMPATIBILITY_MATRIX,
  checkModeCompatibility,
  checkNotePerLedCompatibility,
} from './visualizationMode';