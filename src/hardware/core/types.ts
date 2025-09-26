/**
 * Hardware Abstraction Layer - Core Type Definitions
 * 
 * Defines standardized interfaces for MIDI controller integration
 * with the Centaurus Drum Machine sequencer.
 */

/**
 * Connection status enumeration for hardware controllers
 */
export type ConnectionStatus = 'connected' | 'disconnected' | 'error';

/**
 * Hardware event types for controller communication
 */
export type HardwareEventType = 'step_toggle' | 'connection_change' | 'hardware_input';

/**
 * Capabilities that a hardware controller can support
 */
export interface ControllerCapabilities {
  /** Whether controller supports LED feedback */
  hasLEDs: boolean;
  /** Whether controller supports velocity-sensitive pads */
  hasVelocityPads: boolean;
  /** Whether controller supports knobs/faders */
  hasKnobs: boolean;
  /** Whether controller supports transport controls */
  hasTransportControls: boolean;
  /** Number of step buttons available */
  stepButtonCount: number;
  /** Number of track/channel buttons available */
  trackButtonCount: number;
}

/**
 * Hardware event payload for controller ↔ sequencer communication
 */
export interface HardwareEvent {
  /** Event type classification */
  type: HardwareEventType;
  /** Source controller identifier */
  controllerId: string;
  /** Type-safe event payload */
  data: Record<string, unknown>;
  /** High-precision event timing using performance.now() */
  timestamp: number;
}

/**
 * Base interface that all hardware controllers must implement
 */
export interface HardwareController {
  /** Unique identifier for controller instance */
  readonly id: string;
  /** Human-readable controller name */
  readonly name: string;
  /** Real-time connection state */
  connectionStatus: ConnectionStatus;
  /** Features supported by this controller */
  readonly capabilities: ControllerCapabilities;

  /**
   * Lifecycle Methods
   */
  
  /** Initialize and connect to hardware device */
  connect(): Promise<void>;
  /** Disconnect and cleanup resources */
  disconnect(): Promise<void>;
  /** Handle connection errors and attempt recovery */
  handleError(error: Error): void;

  /**
   * Event Communication
   */
  
  /** Subscribe to hardware events */
  addEventListener(type: HardwareEventType, callback: (event: HardwareEvent) => void): void;
  /** Remove event listener */
  removeEventListener(type: HardwareEventType, callback: (event: HardwareEvent) => void): void;
  /** Send event from hardware to sequencer */
  sendEvent(event: Omit<HardwareEvent, 'controllerId' | 'timestamp'>): void;

  /**
   * State Synchronization
   */
  
  /** Update controller state with sequencer data */
  updateSequencerState(state: SequencerState): void;
  /** Get current controller state */
  getState(): ControllerState;
}

/**
 * Sequencer state interface for hardware synchronization
 */
export interface SequencerState {
  /** Current playback position (0-15 for 16-step pattern) */
  currentStep: number;
  /** Whether sequencer is playing */
  isPlaying: boolean;
  /** Current tempo in BPM */
  tempo: number;
  /** Active pattern steps for each track */
  pattern: boolean[][];
  /** Number of tracks in current pattern */
  trackCount: number;
}

/**
 * Generic controller state interface
 */
export interface ControllerState {
  /** Connection status */
  connected: boolean;
  /** Last update timestamp */
  lastUpdate: number;
  /** Controller-specific state data */
  data: Record<string, unknown>;
}

/**
 * Hardware manager context interface for React integration
 */
export interface HardwareContextType {
  /** All registered controllers */
  controllers: HardwareController[];
  /** Register a new controller */
  registerController: (controller: HardwareController) => void;
  /** Unregister a controller */
  unregisterController: (controllerId: string) => void;
  /** Broadcast sequencer state to all connected controllers */
  broadcastSequencerState: (state: SequencerState) => void;
  /** Get controller by ID */
  getController: (id: string) => HardwareController | undefined;
}