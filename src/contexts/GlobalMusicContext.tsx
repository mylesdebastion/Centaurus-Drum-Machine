import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { RootNote, ScaleName, useMusicalScale } from '../hooks/useMusicalScale';
import { audioEngine } from '../utils/audioEngine';

/**
 * Global Music State Interface
 * Centralized musical configuration accessible to all views
 */
export interface GlobalMusicState {
  /** Tempo in BPM (40-300) */
  tempo: number;
  /** Musical root note */
  key: RootNote;
  /** Scale pattern */
  scale: ScaleName;
  /** Visualization mode */
  colorMode: 'chromatic' | 'harmonic';
  /** Master volume (0-1) */
  masterVolume: number;
  /** Hardware configuration */
  hardware: {
    midi: {
      inputDevice: string | null;
      outputDevice: string | null;
      connected: boolean;
    };
    wled: {
      devices: WLEDDevice[];
      activeDeviceId: string | null;
    };
  };
}

/** WLED Device configuration */
export interface WLEDDevice {
  id: string;
  name: string;
  ip: string;
  connected: boolean;
}

/**
 * Context value interface with state and update functions
 */
export interface GlobalMusicContextValue extends GlobalMusicState {
  updateTempo: (tempo: number) => void;
  updateKey: (key: RootNote) => void;
  updateScale: (scale: ScaleName) => void;
  updateColorMode: (mode: 'chromatic' | 'harmonic') => void;
  updateMasterVolume: (volume: number) => void;
  updateMidiInput: (device: string | null) => void;
  updateMidiOutput: (device: string | null) => void;
  updateMidiConnected: (connected: boolean) => void;
  updateWLEDDevices: (devices: WLEDDevice[]) => void;
  updateActiveWLEDDevice: (deviceId: string | null) => void;
  // Musical scale utilities from useMusicalScale
  getCurrentScale: () => number[];
  isNoteInScale: (noteClass: number) => boolean;
  getScaleDisplayName: () => string;
  getKeySignature: () => string;
  rootNotes: string[];
  scaleNames: string[];
}

/**
 * Default state values
 */
const DEFAULT_STATE: GlobalMusicState = {
  tempo: 120,
  key: 'C',
  scale: 'major',
  colorMode: 'chromatic',
  masterVolume: 0.7,
  hardware: {
    midi: {
      inputDevice: null,
      outputDevice: null,
      connected: false,
    },
    wled: {
      devices: [],
      activeDeviceId: null,
    },
  },
};

/**
 * localStorage key and schema version
 */
const STORAGE_KEY = 'centaurus-global-music-state';
const STORAGE_VERSION = 1;

/**
 * localStorage schema interface
 */
interface StoredState {
  version: number;
  state: GlobalMusicState;
  timestamp: string;
}

/**
 * Load state from localStorage
 * Returns default state if loading fails or data is invalid
 */
function loadStateFromLocalStorage(): GlobalMusicState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_STATE;

    const parsed: StoredState = JSON.parse(stored);

    // Version check
    if (parsed.version !== STORAGE_VERSION) {
      console.warn(`localStorage schema version mismatch. Expected ${STORAGE_VERSION}, got ${parsed.version}. Using defaults.`);
      return DEFAULT_STATE;
    }

    // Validate state structure
    if (!parsed.state || typeof parsed.state !== 'object') {
      console.warn('Invalid state structure in localStorage. Using defaults.');
      return DEFAULT_STATE;
    }

    // Merge stored state with defaults to handle missing properties
    return {
      ...DEFAULT_STATE,
      ...parsed.state,
      hardware: {
        ...DEFAULT_STATE.hardware,
        ...parsed.state.hardware,
        midi: {
          ...DEFAULT_STATE.hardware.midi,
          ...parsed.state.hardware?.midi,
        },
        wled: {
          ...DEFAULT_STATE.hardware.wled,
          ...parsed.state.hardware?.wled,
        },
      },
    };
  } catch (error) {
    console.error('Error loading state from localStorage:', error);
    return DEFAULT_STATE;
  }
}

/**
 * Save state to localStorage
 * Handles errors gracefully (quota exceeded, disabled localStorage, etc.)
 */
function saveStateToLocalStorage(state: GlobalMusicState): void {
  try {
    const stored: StoredState = {
      version: STORAGE_VERSION,
      state,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch (error) {
    // Handle QuotaExceededError or localStorage disabled
    if (error instanceof Error) {
      if (error.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded. State not saved.');
      } else {
        console.error('Error saving state to localStorage:', error);
      }
    }
  }
}

/**
 * Create React Context with default value
 */
const GlobalMusicContext = createContext<GlobalMusicContextValue | undefined>(undefined);

/**
 * Props for GlobalMusicProvider
 */
export interface GlobalMusicProviderProps {
  children: React.ReactNode;
}

/**
 * GlobalMusicProvider Component
 * Provides global music state to entire application
 */
export const GlobalMusicProvider: React.FC<GlobalMusicProviderProps> = ({ children }) => {
  // Initialize state from localStorage
  const [state, setState] = useState<GlobalMusicState>(() => loadStateFromLocalStorage());

  // Integrate useMusicalScale hook
  const musicalScale = useMusicalScale({
    initialRoot: state.key,
    initialScale: state.scale,
  });

  // Sync global state changes with useMusicalScale
  useEffect(() => {
    if (musicalScale.selectedRoot !== state.key) {
      musicalScale.setSelectedRoot(state.key);
    }
  }, [state.key, musicalScale]);

  useEffect(() => {
    if (musicalScale.selectedScale !== state.scale) {
      musicalScale.setSelectedScale(state.scale);
    }
  }, [state.scale, musicalScale]);

  // Save state to localStorage with debouncing (500ms)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveStateToLocalStorage(state);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [state]);

  // Sync master volume with AudioEngine
  useEffect(() => {
    audioEngine.setMasterVolume(state.masterVolume);
    console.log('[GlobalMusicContext] Synced master volume with AudioEngine:', state.masterVolume);
  }, [state.masterVolume]);

  // Sync tempo with AudioEngine Transport
  useEffect(() => {
    audioEngine.syncTransportBPM(state.tempo);
    console.log('[GlobalMusicContext] Synced tempo with AudioEngine Transport:', state.tempo);
  }, [state.tempo]);

  /**
   * Update tempo with validation (40-300 BPM)
   */
  const updateTempo = useCallback((tempo: number) => {
    if (tempo < 40 || tempo > 300) {
      console.warn(`Invalid tempo: ${tempo}. Must be between 40-300 BPM.`);
      return;
    }
    setState(prev => ({ ...prev, tempo }));
  }, []);

  /**
   * Update musical key
   */
  const updateKey = useCallback((key: RootNote) => {
    setState(prev => ({ ...prev, key }));
  }, []);

  /**
   * Update scale pattern
   */
  const updateScale = useCallback((scale: ScaleName) => {
    setState(prev => ({ ...prev, scale }));
  }, []);

  /**
   * Update color mode
   */
  const updateColorMode = useCallback((mode: 'chromatic' | 'harmonic') => {
    setState(prev => ({ ...prev, colorMode: mode }));
  }, []);

  /**
   * Update master volume with validation (0-1)
   */
  const updateMasterVolume = useCallback((volume: number) => {
    if (volume < 0 || volume > 1) {
      console.warn(`Invalid volume: ${volume}. Must be between 0-1.`);
      return;
    }
    setState(prev => ({ ...prev, masterVolume: volume }));
  }, []);

  /**
   * Update MIDI input device
   */
  const updateMidiInput = useCallback((device: string | null) => {
    setState(prev => ({
      ...prev,
      hardware: {
        ...prev.hardware,
        midi: { ...prev.hardware.midi, inputDevice: device },
      },
    }));
  }, []);

  /**
   * Update MIDI output device
   */
  const updateMidiOutput = useCallback((device: string | null) => {
    setState(prev => ({
      ...prev,
      hardware: {
        ...prev.hardware,
        midi: { ...prev.hardware.midi, outputDevice: device },
      },
    }));
  }, []);

  /**
   * Update MIDI connection status
   */
  const updateMidiConnected = useCallback((connected: boolean) => {
    setState(prev => ({
      ...prev,
      hardware: {
        ...prev.hardware,
        midi: { ...prev.hardware.midi, connected },
      },
    }));
  }, []);

  /**
   * Update WLED devices list
   */
  const updateWLEDDevices = useCallback((devices: WLEDDevice[]) => {
    setState(prev => ({
      ...prev,
      hardware: {
        ...prev.hardware,
        wled: { ...prev.hardware.wled, devices },
      },
    }));
  }, []);

  /**
   * Update active WLED device
   */
  const updateActiveWLEDDevice = useCallback((deviceId: string | null) => {
    setState(prev => ({
      ...prev,
      hardware: {
        ...prev.hardware,
        wled: { ...prev.hardware.wled, activeDeviceId: deviceId },
      },
    }));
  }, []);

  /**
   * Memoize context value to prevent unnecessary re-renders
   */
  const contextValue = useMemo<GlobalMusicContextValue>(
    () => ({
      ...state,
      updateTempo,
      updateKey,
      updateScale,
      updateColorMode,
      updateMasterVolume,
      updateMidiInput,
      updateMidiOutput,
      updateMidiConnected,
      updateWLEDDevices,
      updateActiveWLEDDevice,
      // Expose musical scale utilities
      getCurrentScale: musicalScale.getCurrentScale,
      isNoteInScale: musicalScale.isNoteInScale,
      getScaleDisplayName: musicalScale.getScaleDisplayName,
      getKeySignature: musicalScale.getKeySignature,
      rootNotes: musicalScale.rootNotes,
      scaleNames: musicalScale.scaleNames,
    }),
    [
      state,
      updateTempo,
      updateKey,
      updateScale,
      updateColorMode,
      updateMasterVolume,
      updateMidiInput,
      updateMidiOutput,
      updateMidiConnected,
      updateWLEDDevices,
      updateActiveWLEDDevice,
      musicalScale.getCurrentScale,
      musicalScale.isNoteInScale,
      musicalScale.getScaleDisplayName,
      musicalScale.getKeySignature,
      musicalScale.rootNotes,
      musicalScale.scaleNames,
    ]
  );

  return (
    <GlobalMusicContext.Provider value={contextValue}>
      {children}
    </GlobalMusicContext.Provider>
  );
};

/**
 * Hook to access global music context
 * Must be used within GlobalMusicProvider
 */
export function useGlobalMusic(): GlobalMusicContextValue {
  const context = useContext(GlobalMusicContext);
  if (context === undefined) {
    throw new Error('useGlobalMusic must be used within GlobalMusicProvider');
  }
  return context;
}
