/**
 * ModuleRoutingService
 * Epic 15 - Story 15.4: Module Routing System
 *
 * Singleton service for inter-module communication using event bus pattern.
 * Enables modules to send/receive MIDI note events, chord changes, and other musical data.
 *
 * Architecture:
 * - Publisher/Subscriber pattern (1 publisher → N subscribers)
 * - No direct module-to-module coupling
 * - Event listeners registered per module instance
 * - Automatic cleanup on module unload
 *
 * Usage:
 * ```typescript
 * const routingService = ModuleRoutingService.getInstance();
 *
 * // Register module on load
 * routingService.registerModule({
 *   instanceId: 'piano-roll-1',
 *   moduleId: 'piano-roll',
 *   name: 'Piano Roll 1',
 *   capabilities: { canReceiveNotes: true }
 * });
 *
 * // Subscribe to events (receiving module)
 * const unsubscribe = routingService.subscribeToNoteEvents(
 *   'piano-roll-1',
 *   (event) => console.log('Note received:', event)
 * );
 *
 * // Route events (sending module)
 * routingService.routeNoteEvent(
 *   { type: 'note-on', pitch: 60, velocity: 100, timestamp: performance.now(), sourceInstanceId: 'chord-melody-1' },
 *   ['piano-roll-1']
 * );
 *
 * // Unregister module on unload
 * routingService.unregisterModule('piano-roll-1');
 * ```
 */

import type {
  ModuleCapabilities,
  LoadedModule,
  NoteEvent,
  ChordEvent,
  NoteEventListener,
  ChordEventListener,
} from '@/types/moduleRouting';

export class ModuleRoutingService {
  private static instance: ModuleRoutingService;

  // Registry of loaded modules
  private modules: Map<string, LoadedModule> = new Map();

  // Event listeners (one per module instance)
  private noteListeners: Map<string, NoteEventListener> = new Map();
  private chordListeners: Map<string, ChordEventListener> = new Map();

  /**
   * Private constructor - Use getInstance() instead
   */
  private constructor() {
    console.log('[ModuleRoutingService] Service initialized');
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ModuleRoutingService {
    if (!ModuleRoutingService.instance) {
      ModuleRoutingService.instance = new ModuleRoutingService();
    }
    return ModuleRoutingService.instance;
  }

  /**
   * Register a module when it loads in Studio
   * @param module - Module metadata including capabilities
   */
  registerModule(module: LoadedModule): void {
    this.modules.set(module.instanceId, module);
    console.log(
      `[ModuleRoutingService] Module registered: ${module.name} (${module.instanceId})`,
      { capabilities: module.capabilities }
    );
  }

  /**
   * Unregister a module when it unloads from Studio
   * Automatically cleans up event listeners to prevent memory leaks
   * @param instanceId - Module instance ID to unregister
   */
  unregisterModule(instanceId: string): void {
    const module = this.modules.get(instanceId);
    if (module) {
      console.log(`[ModuleRoutingService] Module unregistered: ${module.name} (${instanceId})`);
    }

    this.modules.delete(instanceId);
    this.noteListeners.delete(instanceId);
    this.chordListeners.delete(instanceId);
  }

  /**
   * Get all loaded modules that have a specific capability
   * @param sourceInstanceId - Source module ID (excluded from results)
   * @param capability - Capability to filter by (e.g., 'canReceiveNotes')
   * @returns Array of modules with the specified capability
   */
  getAvailableTargets(
    sourceInstanceId: string,
    capability: keyof ModuleCapabilities
  ): LoadedModule[] {
    const targets: LoadedModule[] = [];

    this.modules.forEach((module, instanceId) => {
      // Don't include source module as target
      if (instanceId === sourceInstanceId) return;

      // Check if module has required capability
      if (module.capabilities[capability]) {
        targets.push(module);
      }
    });

    return targets;
  }

  /**
   * Route a note event to specific target modules
   * Fires note-on or note-off events to all registered listeners for target modules
   *
   * @param event - Note event to route
   * @param targetInstanceIds - Array of target module instance IDs
   */
  routeNoteEvent(event: NoteEvent, targetInstanceIds: string[]): void {
    targetInstanceIds.forEach((targetId) => {
      try {
        const listener = this.noteListeners.get(targetId);
        if (listener) {
          listener(event);
        } else {
          console.warn(
            `[ModuleRoutingService] No note listener registered for module: ${targetId}`
          );
        }
      } catch (error) {
        console.error(
          `[ModuleRoutingService] Error routing note event to ${targetId}:`,
          error
        );
      }
    });
  }

  /**
   * Route a chord event to specific target modules
   * Fires chord-change events to all registered listeners for target modules
   *
   * @param event - Chord event to route
   * @param targetInstanceIds - Array of target module instance IDs
   */
  routeChordEvent(event: ChordEvent, targetInstanceIds: string[]): void {
    targetInstanceIds.forEach((targetId) => {
      try {
        const listener = this.chordListeners.get(targetId);
        if (listener) {
          listener(event);
        } else {
          console.warn(
            `[ModuleRoutingService] No chord listener registered for module: ${targetId}`
          );
        }
      } catch (error) {
        console.error(
          `[ModuleRoutingService] Error routing chord event to ${targetId}:`,
          error
        );
      }
    });
  }

  /**
   * Subscribe to note events (for receiving modules)
   * @param instanceId - Module instance ID subscribing to events
   * @param callback - Function called when note events are received
   * @returns Unsubscribe function to remove listener
   */
  subscribeToNoteEvents(
    instanceId: string,
    callback: NoteEventListener
  ): () => void {
    this.noteListeners.set(instanceId, callback);
    console.log(`[ModuleRoutingService] Note listener registered for: ${instanceId}`);

    // Return unsubscribe function
    return () => {
      this.noteListeners.delete(instanceId);
      console.log(`[ModuleRoutingService] Note listener unregistered for: ${instanceId}`);
    };
  }

  /**
   * Subscribe to chord events (for receiving modules)
   * @param instanceId - Module instance ID subscribing to events
   * @param callback - Function called when chord events are received
   * @returns Unsubscribe function to remove listener
   */
  subscribeToChordEvents(
    instanceId: string,
    callback: ChordEventListener
  ): () => void {
    this.chordListeners.set(instanceId, callback);
    console.log(`[ModuleRoutingService] Chord listener registered for: ${instanceId}`);

    // Return unsubscribe function
    return () => {
      this.chordListeners.delete(instanceId);
      console.log(`[ModuleRoutingService] Chord listener unregistered for: ${instanceId}`);
    };
  }

  /**
   * Get all registered modules (for debugging)
   * @returns Array of all loaded modules
   */
  getRegisteredModules(): LoadedModule[] {
    return Array.from(this.modules.values());
  }

  /**
   * Check if a module is registered
   * @param instanceId - Module instance ID to check
   * @returns True if module is registered
   */
  isModuleRegistered(instanceId: string): boolean {
    return this.modules.has(instanceId);
  }

  /**
   * Get module metadata by instance ID
   * @param instanceId - Module instance ID
   * @returns Module metadata or undefined if not found
   */
  getModule(instanceId: string): LoadedModule | undefined {
    return this.modules.get(instanceId);
  }
}

// Export singleton instance getter for convenience
export const getModuleRoutingService = () => ModuleRoutingService.getInstance();

// Re-export types for convenience
export type {
  ModuleCapabilities,
  LoadedModule,
  NoteEvent,
  ChordEvent,
  NoteEventListener,
  ChordEventListener,
} from '@/types/moduleRouting';
