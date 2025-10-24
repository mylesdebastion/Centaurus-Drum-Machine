/**
 * API Contracts - Versioned Public Interfaces
 *
 * This file defines stable, versioned interfaces for inter-module communication.
 * These contracts ensure backward compatibility and prevent breaking changes from
 * cascading through the codebase.
 *
 * **CRITICAL RULES**:
 * 1. NEVER modify existing versioned interfaces (create new versions instead)
 * 2. ALWAYS add new fields as optional (with `?`) to maintain compatibility
 * 3. NEVER remove fields from existing versions (deprecate instead)
 * 4. ALWAYS bump version number for breaking changes (v1 → v2)
 * 5. Document migration paths in breaking change policy
 *
 * **Version Strategy**:
 * - Major version (v1 → v2): Breaking changes (field removal, type changes)
 * - Minor extensions: Add optional fields to existing version
 * - Keep deprecated versions for 2 release cycles minimum
 *
 * Related: docs/architecture/breaking-change-policy.md
 */

// ============================================================================
// GLOBAL MUSIC STATE CONTRACT
// ============================================================================

/**
 * GlobalMusicState_v1 - Central musical configuration
 *
 * Consumed by: All modules (Studio, DrumMachine, PianoRoll, GuitarFretboard, etc.)
 * Provider: GlobalMusicContext
 *
 * Stability: STABLE - v1.0
 * Last Updated: 2025-01-24
 */
export interface GlobalMusicState_v1 {
  /** Tempo in BPM (40-300) */
  readonly tempo: number;

  /** Musical root note (A-G with # or b) */
  readonly key: string;

  /** Scale pattern (major, minor, pentatonic, etc.) */
  readonly scale: string;

  /** Visualization mode (spectrum, chromatic, harmonic) */
  readonly colorMode: 'spectrum' | 'chromatic' | 'harmonic';

  /** Master volume (0-1) */
  readonly masterVolume: number;

  /** Global transport state (play/pause) - NOT persisted */
  readonly isPlaying: boolean;
}

/**
 * GlobalMusicActions_v1 - State update methods
 *
 * Consumed by: Modules that need to update global state
 * Provider: GlobalMusicContext
 *
 * Stability: STABLE - v1.0
 */
export interface GlobalMusicActions_v1 {
  updateTempo(tempo: number): void;
  updateKey(key: string): void;
  updateScale(scale: string): void;
  updateColorMode(mode: 'spectrum' | 'chromatic' | 'harmonic'): void;
  updateMasterVolume(volume: number): void;
  updateTransportState(playing: boolean): void;
}

/**
 * GlobalMusicAPI_v1 - Complete global music context API
 *
 * Combines state and actions for complete context interface
 */
export interface GlobalMusicAPI_v1 extends GlobalMusicState_v1, GlobalMusicActions_v1 {
  /** Get current scale notes (MIDI note classes) */
  getCurrentScale(): number[];

  /** Check if note is in current scale */
  isNoteInScale(noteClass: number): boolean;

  /** Get human-readable scale name */
  getScaleDisplayName(): string;
}

// ============================================================================
// MODULE SYSTEM CONTRACT
// ============================================================================

/**
 * ModuleContext_v1 - Execution context for modules
 *
 * Determines how modules consume global state and render controls
 *
 * Stability: STABLE - v1.0
 */
export type ModuleContext_v1 = 'standalone' | 'studio' | 'jam';

/**
 * ModuleCapabilities_v1 - What a module can send/receive
 *
 * Used by: Module routing system (Epic 15)
 *
 * Stability: STABLE - v1.0
 */
export interface ModuleCapabilities_v1 {
  /** Can receive MIDI note events */
  readonly canReceiveNotes?: boolean;

  /** Can receive chord progression events */
  readonly canReceiveChords?: boolean;

  /** Can receive tempo changes */
  readonly canReceiveTempo?: boolean;

  /** Can emit MIDI note events */
  readonly canEmitNotes?: boolean;

  /** Can emit chord progression events */
  readonly canEmitChords?: boolean;
}

/**
 * LoadedModule_v1 - Module instance in Studio
 *
 * Represents a loaded module with routing capabilities
 *
 * Stability: STABLE - v1.0
 */
export interface LoadedModule_v1 {
  /** Unique instance ID (e.g., "piano-roll-1") */
  readonly instanceId: string;

  /** Module type (e.g., "piano-roll") */
  readonly moduleId: string;

  /** Display name */
  readonly name: string;

  /** Module capabilities */
  readonly capabilities: ModuleCapabilities_v1;
}

/**
 * NoteEvent_v1 - MIDI note on/off event
 *
 * Used by: Module routing system for inter-module communication
 *
 * Stability: STABLE - v1.0
 */
export interface NoteEvent_v1 {
  readonly type: 'note-on' | 'note-off';
  readonly pitch: number;           // MIDI note (0-127)
  readonly velocity: number;        // 0-127
  readonly timestamp: number;       // performance.now()
  readonly sourceInstanceId: string;
}

/**
 * ChordEvent_v1 - Chord change event
 *
 * Used by: Chord-aware modules (ChordMelodyArranger, etc.)
 *
 * Stability: STABLE - v1.0
 */
export interface ChordEvent_v1 {
  readonly type: 'chord-change';
  readonly chordName: string;       // "Cmaj7", "Am", etc.
  readonly notes: number[];         // MIDI note numbers
  readonly timestamp: number;
  readonly sourceInstanceId: string;
}

// ============================================================================
// HARDWARE ABSTRACTION CONTRACT
// ============================================================================

/**
 * HardwareConnectionStatus_v1 - Connection state
 *
 * Stability: STABLE - v1.0
 */
export type HardwareConnectionStatus_v1 = 'connected' | 'disconnected' | 'error';

/**
 * HardwareEventType_v1 - Event classification
 *
 * Stability: STABLE - v1.0
 */
export type HardwareEventType_v1 = 'step_toggle' | 'connection_change' | 'hardware_input';

/**
 * ControllerCapabilities_v1 - Hardware features
 *
 * Describes what a hardware controller can do
 *
 * Stability: STABLE - v1.0
 */
export interface ControllerCapabilities_v1 {
  readonly hasLEDs: boolean;
  readonly hasVelocityPads: boolean;
  readonly hasKnobs: boolean;
  readonly hasTransportControls: boolean;
  readonly stepButtonCount: number;
  readonly trackButtonCount: number;
}

/**
 * HardwareEvent_v1 - Hardware event payload
 *
 * Used for controller ↔ sequencer communication
 *
 * Stability: STABLE - v1.0
 */
export interface HardwareEvent_v1 {
  readonly type: HardwareEventType_v1;
  readonly controllerId: string;
  readonly data: Record<string, unknown>;
  readonly timestamp: number;
}

/**
 * HardwareControllerAPI_v1 - Controller interface
 *
 * All hardware controllers must implement this interface
 *
 * Stability: STABLE - v1.0
 */
export interface HardwareControllerAPI_v1 {
  readonly id: string;
  readonly name: string;
  readonly connectionStatus: HardwareConnectionStatus_v1;
  readonly capabilities: ControllerCapabilities_v1;

  /** Lifecycle methods */
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  handleError(error: Error): void;

  /** Event communication */
  addEventListener(type: HardwareEventType_v1, callback: (event: HardwareEvent_v1) => void): void;
  removeEventListener(type: HardwareEventType_v1, callback: (event: HardwareEvent_v1) => void): void;
}

// ============================================================================
// VISUALIZATION SYSTEM CONTRACT
// ============================================================================

/**
 * ModuleId_v1 - Known module identifiers
 *
 * Stability: STABLE - v1.0
 * Note: Add new modules as optional union members (non-breaking)
 */
export type ModuleId_v1 =
  | 'drum-machine'
  | 'guitar-fretboard'
  | 'piano-roll'
  | 'audio-reactive'
  | 'isometric-sequencer';

/**
 * DimensionPreference_v1 - Device dimension compatibility
 *
 * Stability: STABLE - v1.0
 */
export type DimensionPreference_v1 = '1D' | '2D' | 'either';

/**
 * VisualizationProducer_v1 - Visualization declaration
 *
 * Describes a specific visualization that a module can produce
 *
 * Stability: STABLE - v1.0
 */
export interface VisualizationProducer_v1 {
  readonly type: string;                        // VisualizationType (defined in wled.ts)
  readonly dimensionPreference: DimensionPreference_v1;
  readonly overlayCompatible: boolean;
  readonly priority: number;                    // 1-100 (higher = precedence)
}

/**
 * ModuleVisualizationCapability_v1 - Module visualization declaration
 *
 * Describes what visualizations a module can produce
 *
 * Stability: STABLE - v1.0
 */
export interface ModuleVisualizationCapability_v1 {
  readonly moduleId: ModuleId_v1;
  readonly produces: VisualizationProducer_v1[];
}

// ============================================================================
// SESSION/COLLABORATION CONTRACT
// ============================================================================

/**
 * User_v1 - Session participant
 *
 * Stability: STABLE - v1.0
 */
export interface User_v1 {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly isHost: boolean;
}

/**
 * JamSessionState_v1 - Collaborative session state
 *
 * Shared state across all session participants
 *
 * Stability: STABLE - v1.0
 */
export interface JamSessionState_v1 {
  readonly sessionId: string;
  readonly sessionCode: string;
  readonly users: User_v1[];
  readonly tempo: number;
  readonly isPlaying: boolean;
  readonly currentStep: number;
}

/**
 * JamSessionActions_v1 - Session control methods
 *
 * Actions that can be performed in a collaborative session
 *
 * Stability: STABLE - v1.0
 */
export interface JamSessionActions_v1 {
  joinSession(sessionCode: string, userName: string): Promise<void>;
  leaveSession(): Promise<void>;
  updateSessionState(state: Partial<JamSessionState_v1>): void;
}

// ============================================================================
// AUTHENTICATION CONTRACT
// ============================================================================

/**
 * AuthState_v1 - Authentication state
 *
 * Provided by: useAuth hook
 *
 * Stability: STABLE - v1.0
 */
export interface AuthState_v1 {
  /** Current authenticated user (null if anonymous) */
  readonly user: {
    id: string;
    email?: string;
  } | null;

  /** User profile from database (null if anonymous) */
  readonly profile: {
    id: string;
    username: string;
    avatar_url?: string;
  } | null;

  /** True if user is authenticated */
  readonly isAuthenticated: boolean;

  /** True if still loading auth state */
  readonly loading: boolean;
}

// ============================================================================
// VERSION REGISTRY
// ============================================================================

/**
 * API_VERSION_REGISTRY - Central version tracking
 *
 * Update this registry when creating new API versions
 * Used by breaking change detection and migration tooling
 */
export const API_VERSION_REGISTRY = {
  GlobalMusicAPI: {
    current: 'v1',
    versions: ['v1'],
    deprecated: [],
  },
  ModuleSystemAPI: {
    current: 'v1',
    versions: ['v1'],
    deprecated: [],
  },
  HardwareAPI: {
    current: 'v1',
    versions: ['v1'],
    deprecated: [],
  },
  VisualizationAPI: {
    current: 'v1',
    versions: ['v1'],
    deprecated: [],
  },
  SessionAPI: {
    current: 'v1',
    versions: ['v1'],
    deprecated: [],
  },
  AuthAPI: {
    current: 'v1',
    versions: ['v1'],
    deprecated: [],
  },
} as const;

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for ModuleCapabilities_v1
 */
export function isModuleCapabilities_v1(obj: unknown): obj is ModuleCapabilities_v1 {
  if (typeof obj !== 'object' || obj === null) return false;
  const caps = obj as ModuleCapabilities_v1;
  return (
    (caps.canReceiveNotes === undefined || typeof caps.canReceiveNotes === 'boolean') &&
    (caps.canReceiveChords === undefined || typeof caps.canReceiveChords === 'boolean') &&
    (caps.canReceiveTempo === undefined || typeof caps.canReceiveTempo === 'boolean') &&
    (caps.canEmitNotes === undefined || typeof caps.canEmitNotes === 'boolean') &&
    (caps.canEmitChords === undefined || typeof caps.canEmitChords === 'boolean')
  );
}

/**
 * Type guard for NoteEvent_v1
 */
export function isNoteEvent_v1(obj: unknown): obj is NoteEvent_v1 {
  if (typeof obj !== 'object' || obj === null) return false;
  const event = obj as NoteEvent_v1;
  return (
    (event.type === 'note-on' || event.type === 'note-off') &&
    typeof event.pitch === 'number' &&
    typeof event.velocity === 'number' &&
    typeof event.timestamp === 'number' &&
    typeof event.sourceInstanceId === 'string'
  );
}

/**
 * Type guard for ChordEvent_v1
 */
export function isChordEvent_v1(obj: unknown): obj is ChordEvent_v1 {
  if (typeof obj !== 'object' || obj === null) return false;
  const event = obj as ChordEvent_v1;
  return (
    event.type === 'chord-change' &&
    typeof event.chordName === 'string' &&
    Array.isArray(event.notes) &&
    event.notes.every((n) => typeof n === 'number') &&
    typeof event.timestamp === 'number' &&
    typeof event.sourceInstanceId === 'string'
  );
}

// ============================================================================
// MIGRATION HELPERS
// ============================================================================

/**
 * Future versions will add migration helpers here
 * Example:
 *
 * export function migrateGlobalMusicState_v1_to_v2(
 *   oldState: GlobalMusicState_v1
 * ): GlobalMusicState_v2 {
 *   return {
 *     ...oldState,
 *     newField: defaultValue,
 *   };
 * }
 */
