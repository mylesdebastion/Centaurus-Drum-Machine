/**
 * MIDI Event Bus - Cross-Module MIDI Communication (Epic 14)
 *
 * Simple event-based system for modules to share MIDI note events
 * without relying on the frequency visualization pipeline.
 */

export interface MIDINoteEvent {
  note: number;        // MIDI note number (0-127)
  velocity: number;    // Velocity (0-127)
  timestamp: number;   // Performance.now()
  source: string;      // Source module ID
  color?: { r: number; g: number; b: number };  // Optional color
}

type MIDINoteListener = (event: MIDINoteEvent) => void;
type MIDINoteOffListener = (note: number, source: string) => void;

class MIDIEventBus {
  private noteOnListeners: Set<MIDINoteListener> = new Set();
  private noteOffListeners: Set<MIDINoteOffListener> = new Set();
  private activeNotes: Map<string, MIDINoteEvent> = new Map(); // key: `${source}-${note}`

  /**
   * Subscribe to note-on events
   */
  onNoteOn(listener: MIDINoteListener): () => void {
    this.noteOnListeners.add(listener);
    // Return unsubscribe function
    return () => this.noteOnListeners.delete(listener);
  }

  /**
   * Subscribe to note-off events
   */
  onNoteOff(listener: MIDINoteOffListener): () => void {
    this.noteOffListeners.add(listener);
    // Return unsubscribe function
    return () => this.noteOffListeners.delete(listener);
  }

  /**
   * Emit a note-on event
   */
  emitNoteOn(event: MIDINoteEvent): void {
    const key = `${event.source}-${event.note}`;
    this.activeNotes.set(key, event);

    // Notify all listeners
    this.noteOnListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('[MIDIEventBus] Error in note-on listener:', error);
      }
    });
  }

  /**
   * Emit a note-off event
   */
  emitNoteOff(note: number, source: string): void {
    const key = `${source}-${note}`;
    this.activeNotes.delete(key);

    // Notify all listeners
    this.noteOffListeners.forEach(listener => {
      try {
        listener(note, source);
      } catch (error) {
        console.error('[MIDIEventBus] Error in note-off listener:', error);
      }
    });
  }

  /**
   * Get all currently active notes
   */
  getActiveNotes(): MIDINoteEvent[] {
    return Array.from(this.activeNotes.values());
  }

  /**
   * Get active notes from a specific source
   */
  getActiveNotesFromSource(source: string): MIDINoteEvent[] {
    return Array.from(this.activeNotes.values()).filter(event => event.source === source);
  }

  /**
   * Clear all active notes (useful for cleanup)
   */
  clearAll(): void {
    this.activeNotes.clear();
  }

  /**
   * Clear notes from a specific source
   */
  clearSource(source: string): void {
    const keysToDelete: string[] = [];
    this.activeNotes.forEach((event, key) => {
      if (event.source === source) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.activeNotes.delete(key));
  }
}

// Global singleton instance
export const midiEventBus = new MIDIEventBus();

// Expose on window for debugging
if (typeof window !== 'undefined') {
  (window as any).midiEventBus = midiEventBus;
}
