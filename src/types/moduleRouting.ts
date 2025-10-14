/**
 * Module Routing Types
 * Epic 15 - Story 15.4: Module Routing System
 *
 * Type definitions for inter-module communication and event routing.
 * Enables modules to send/receive MIDI note events, chord changes, and other musical data.
 */

/**
 * Module Capabilities - Defines what a module can send/receive
 */
export interface ModuleCapabilities {
  canReceiveNotes?: boolean;       // Can receive MIDI note events
  canReceiveChords?: boolean;      // Can receive chord progression events
  canReceiveTempo?: boolean;       // Can receive tempo changes
  canEmitNotes?: boolean;          // Can emit MIDI note events
  canEmitChords?: boolean;         // Can emit chord progression events
}

/**
 * LoadedModule - Represents a module instance in Studio
 */
export interface LoadedModule {
  instanceId: string;              // Unique ID (e.g., "piano-roll-1")
  moduleId: string;                // Module type (e.g., "piano-roll")
  name: string;                    // Display name (e.g., "Piano Roll 1")
  capabilities: ModuleCapabilities;
}

/**
 * NoteEvent - MIDI note on/off event
 */
export interface NoteEvent {
  type: 'note-on' | 'note-off';
  pitch: number;                   // MIDI note number (0-127)
  velocity: number;                // 0-127 (note intensity)
  timestamp: number;               // Performance.now()
  sourceInstanceId: string;        // Which module sent this event
}

/**
 * ChordEvent - Chord change event
 */
export interface ChordEvent {
  type: 'chord-change';
  chordName: string;               // "Cmaj7", "Am", etc.
  notes: number[];                 // MIDI note numbers
  timestamp: number;
  sourceInstanceId: string;
}

/**
 * ModuleRoute - Routing configuration for a source module
 */
export interface ModuleRoute {
  sourceId: string;                // Source module instance ID
  targetIds: string[];             // Target module instance IDs
  noteMapping?: (note: number) => number; // Optional pitch mapping function
}

/**
 * Event listener callback types
 */
export type NoteEventListener = (event: NoteEvent) => void;
export type ChordEventListener = (event: ChordEvent) => void;
