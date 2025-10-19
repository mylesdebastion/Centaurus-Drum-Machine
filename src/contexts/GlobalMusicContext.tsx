import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { RootNote, ScaleName, useMusicalScale } from '../hooks/useMusicalScale';
import { audioEngine } from '../utils/audioEngine';
import { ColorMode } from '../utils/colorMapping';
import { supabaseSessionService } from '../services/supabaseSession';
import { useAuth } from '../hooks/useAuth';
import type { UserProfile } from '../types/auth';

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
  colorMode: ColorMode;
  /** Master volume (0-1) */
  masterVolume: number;
  /**
   * Global transport state (play/pause)
   * Epic 14, Story 14.2 - Controls playback synchronization across all modules
   * NOT persisted to localStorage (in-memory only)
   * @default false - always starts paused
   */
  isPlaying: boolean;
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
  /**
   * Authentication state (Story 18.0)
   * Provides access to current user and auth status
   * NOT persisted to localStorage (managed by Supabase Auth)
   */
  auth: {
    /** Current authenticated user (null if anonymous) */
    user: User | null;
    /** User profile from database (null if anonymous) */
    profile: UserProfile | null;
    /** True if user is authenticated */
    isAuthenticated: boolean;
    /** True if still loading auth state on mount */
    loading: boolean;
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
  updateColorMode: (mode: ColorMode) => void;
  updateMasterVolume: (volume: number) => void;
  /**
   * Update global transport state (Epic 14, Story 14.2)
   * Synchronizes Tone.js Transport with global state
   * @param playing - true to start playback, false to pause
   */
  updateTransportState: (playing: boolean) => void;
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
 * Note: auth and isPlaying are initialized separately (not in DEFAULT_STATE)
 */
const DEFAULT_STATE: Omit<GlobalMusicState, 'auth' | 'isPlaying'> = {
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
 * Note: auth and isPlaying fields are NOT persisted
 * - auth: managed by Supabase Auth
 * - isPlaying: transport state is in-memory only (Story 14.2)
 */
interface StoredState {
  version: number;
  state: Omit<GlobalMusicState, 'auth' | 'isPlaying'>;
  timestamp: string;
}

/**
 * Load state from localStorage
 * Returns default state if loading fails or data is invalid
 * Note: auth and isPlaying are NOT loaded from localStorage
 */
function loadStateFromLocalStorage(): Omit<GlobalMusicState, 'auth' | 'isPlaying'> {
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
 * Story 14.2: EXCLUDES isPlaying field (transport state is in-memory only)
 * Story 18.0: EXCLUDES auth field (managed by Supabase Auth)
 */
function saveStateToLocalStorage(state: GlobalMusicState): void {
  try {
    // Destructure to exclude isPlaying and auth (not persisted)
    const { isPlaying, auth, ...persistedState } = state;

    const stored: StoredState = {
      version: STORAGE_VERSION,
      state: persistedState,
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
  // Initialize auth state (Story 18.0)
  const auth = useAuth();

  // Initialize state from localStorage (excluding auth and isPlaying which are managed separately)
  const [state, setState] = useState<GlobalMusicState>(() => ({
    ...loadStateFromLocalStorage(),
    isPlaying: false, // Story 14.2 - Always starts paused (not persisted)
    auth: {
      user: null,
      profile: null,
      isAuthenticated: false,
      loading: true,
    },
  }));

  // Sync auth state from useAuth hook into global state
  useEffect(() => {
    setState(prev => ({
      ...prev,
      auth: {
        user: auth.user,
        profile: auth.profile,
        isAuthenticated: auth.isAuthenticated,
        loading: auth.loading,
      },
    }));
  }, [auth.user, auth.profile, auth.isAuthenticated, auth.loading]);

  // Track if playback state change came from remote source (prevent broadcast loop)
  const isRemotePlaybackChangeRef = React.useRef(false);

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

  // Broadcast colorMode changes to session participants (Story 17.2)
  useEffect(() => {
    if (supabaseSessionService.isInSession()) {
      supabaseSessionService.broadcastColorMode(state.colorMode);
    }
  }, [state.colorMode]);

  // Subscribe to remote colorMode changes (Story 17.2)
  useEffect(() => {
    const unsubscribe = supabaseSessionService.onColorModeChange((mode: string) => {
      console.log('[GlobalMusicContext] Remote color mode change:', mode);
      setState(prev => ({ ...prev, colorMode: mode as ColorMode }));
    });

    return unsubscribe;
  }, []);

  // Broadcast isPlaying (global transport) changes to session participants
  useEffect(() => {
    // Don't broadcast if the change came from a remote source (prevent loop)
    if (isRemotePlaybackChangeRef.current) {
      isRemotePlaybackChangeRef.current = false;
      return;
    }

    if (supabaseSessionService.isInSession()) {
      supabaseSessionService.broadcastPlayback(state.isPlaying);
    }
  }, [state.isPlaying]);

  // Subscribe to remote playback changes (global transport sync)
  useEffect(() => {
    const unsubscribe = supabaseSessionService.onPlaybackChange((playing: boolean) => {
      console.log('[GlobalMusicContext] Remote playback change:', playing);

      // Mark this as a remote change to prevent broadcast loop
      isRemotePlaybackChangeRef.current = true;

      setState(prev => ({ ...prev, isPlaying: playing }));

      // Sync with Tone.js Transport via AudioEngine
      if (playing) {
        audioEngine.startTransport();
      } else {
        audioEngine.stopTransport();
      }
    });

    return unsubscribe;
  }, []);

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
  const updateColorMode = useCallback((mode: ColorMode) => {
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
   * Update global transport state (Epic 14, Story 14.2)
   * Syncs React state with Tone.js Transport
   */
  const updateTransportState = useCallback((playing: boolean) => {
    // Validation
    if (typeof playing !== 'boolean') {
      console.warn(`[GlobalMusicContext] Invalid transport state: ${playing}. Must be boolean.`);
      return;
    }

    // Update React state
    setState(prev => ({ ...prev, isPlaying: playing }));

    // Sync with Tone.js Transport via AudioEngine
    if (playing) {
      audioEngine.startTransport();
      console.log('[GlobalMusicContext] Transport started');
    } else {
      audioEngine.stopTransport();
      console.log('[GlobalMusicContext] Transport stopped');
    }
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
      updateTransportState, // Epic 14, Story 14.2
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
      updateTransportState, // Epic 14, Story 14.2
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
