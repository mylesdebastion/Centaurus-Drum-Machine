import { useEffect, useState, useCallback } from 'react';
import { midiInputManager, MIDIMessage, MIDIDevice } from '../utils/midiInputManager';

export interface UseMIDIInputOptions {
  /**
   * Enable automatic initialization of MIDI on mount
   * @default true
   */
  autoInitialize?: boolean;

  /**
   * Automatically select the first available MIDI device
   * @default false
   */
  autoSelectFirst?: boolean;

  /**
   * Enable keyboard fallback mode (QWERTY → MIDI)
   * @default false
   */
  keyboardFallback?: boolean;

  /**
   * Callback for MIDI message events
   */
  onMessage?: (message: MIDIMessage) => void;

  /**
   * Callback for note on events
   */
  onNoteOn?: (note: number, velocity: number) => void;

  /**
   * Callback for note off events
   */
  onNoteOff?: (note: number) => void;
}

export interface UseMIDIInputResult {
  /** List of available MIDI devices */
  devices: MIDIDevice[];

  /** Currently active device ID */
  activeDeviceId: string | null;

  /** Currently playing MIDI notes */
  activeNotes: Set<number>;

  /** Is MIDI initialized and ready */
  isReady: boolean;

  /** Is keyboard fallback mode enabled */
  isKeyboardMode: boolean;

  /** Select a MIDI device by ID */
  selectDevice: (deviceId: string) => void;

  /** Enable keyboard fallback mode */
  enableKeyboardMode: () => void;

  /** Disable keyboard fallback mode */
  disableKeyboardMode: () => void;

  /** Refresh the device list */
  refreshDevices: () => void;
}

/**
 * React hook for accessing MIDI input
 *
 * @example
 * ```tsx
 * const { devices, activeNotes, selectDevice } = useMIDIInput({
 *   autoInitialize: true,
 *   onNoteOn: (note, velocity) => {
 *     console.log(`Note ${note} played with velocity ${velocity}`);
 *   }
 * });
 * ```
 */
export function useMIDIInput(options: UseMIDIInputOptions = {}): UseMIDIInputResult {
  const {
    autoInitialize = true,
    autoSelectFirst = false,
    keyboardFallback = false,
    onMessage,
    onNoteOn,
    onNoteOff,
  } = options;

  const [devices, setDevices] = useState<MIDIDevice[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const [isReady, setIsReady] = useState(false);
  const [isKeyboardMode, setIsKeyboardMode] = useState(keyboardFallback);

  // Handle MIDI messages
  const handleMIDIMessage = useCallback((message: MIDIMessage) => {
    // Update active notes state
    if (message.type === 'noteOn') {
      setActiveNotes((prev) => {
        const next = new Set(prev);
        next.add(message.note);
        return next;
      });
      onNoteOn?.(message.note, message.velocity);
    } else if (message.type === 'noteOff') {
      setActiveNotes((prev) => {
        const next = new Set(prev);
        next.delete(message.note);
        return next;
      });
      onNoteOff?.(message.note);
    }

    // Call generic message callback
    onMessage?.(message);
  }, [onMessage, onNoteOn, onNoteOff]);

  // Refresh device list
  const refreshDevices = useCallback(() => {
    const deviceList = midiInputManager.getDevices();
    setDevices(deviceList);
    setActiveDeviceId(midiInputManager.getActiveDeviceId());
    console.log('[useMIDIInput] Refreshed devices:', deviceList);
  }, []);

  // Select device
  const selectDevice = useCallback((deviceId: string) => {
    midiInputManager.selectDevice(deviceId);
    setActiveDeviceId(deviceId);
  }, []);

  // Keyboard mode controls
  const enableKeyboardMode = useCallback(() => {
    midiInputManager.enableKeyboardFallback();
    setIsKeyboardMode(true);
  }, []);

  const disableKeyboardMode = useCallback(() => {
    midiInputManager.disableKeyboardFallback();
    setIsKeyboardMode(false);
  }, []);

  // Initialize MIDI
  useEffect(() => {
    if (!autoInitialize) return;

    const initializeMIDI = async () => {
      try {
        await midiInputManager.initialize();
        setIsReady(midiInputManager.isReady());
        refreshDevices();

        // Auto-select first device if requested
        if (autoSelectFirst && midiInputManager.isReady()) {
          const deviceList = midiInputManager.getDevices();
          if (deviceList.length > 0) {
            selectDevice(deviceList[0].id);
          }
        }

        // Enable keyboard fallback if requested
        if (keyboardFallback) {
          enableKeyboardMode();
        }
      } catch (error) {
        console.error('[useMIDIInput] Failed to initialize MIDI:', error);
      }
    };

    initializeMIDI();
  }, [autoInitialize, autoSelectFirst, keyboardFallback, refreshDevices, selectDevice, enableKeyboardMode]);

  // Register message listener
  useEffect(() => {
    midiInputManager.addListener(handleMIDIMessage);

    return () => {
      midiInputManager.removeListener(handleMIDIMessage);
    };
  }, [handleMIDIMessage]);

  return {
    devices,
    activeDeviceId,
    activeNotes,
    isReady,
    isKeyboardMode,
    selectDevice,
    enableKeyboardMode,
    disableKeyboardMode,
    refreshDevices,
  };
}
