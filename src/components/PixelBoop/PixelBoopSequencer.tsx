import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Maximize2, Minimize2, X, ArrowLeft } from 'lucide-react';
import { ViewTemplate } from '../Layout/ViewTemplate';
import { pixelboopSessionService } from '@/services/pixelboopSession';
import type { PatternEditDelta } from '@/types/pixelboopSession';
import { useIntervalMode } from '@/hooks/useIntervalMode';
import { useIntervalModeSelection, type TrackType as IntervalTrackType } from '@/hooks/useIntervalModeSelection';
import type { IntervalModeType } from '@/lib/intervalMode';

// ============================================================================
// TYPES
// ============================================================================

interface PixelBoopSequencerProps {
  onBack: () => void;
  viewerMode?: boolean;           // Read-only mode for web viewer
  roomCode?: string;              // Connect to remote session
  onSessionReady?: () => void;    // Callback when sync established
}

type TrackType = 'melody' | 'chords' | 'bass' | 'rhythm';
type ScaleType = 'major' | 'minor' | 'penta';
type ChordType = 'major' | 'minor' | 'maj7' | 'min7';

interface Tracks {
  melody: number[][];
  chords: number[][];
  bass: number[][];
  rhythm: number[][];
}

interface MutedState {
  melody: boolean;
  chords: boolean;
  bass: boolean;
  rhythm: boolean;
}

interface Gesture {
  startNote: number;
  startStep: number;
  currentNote: number;
  currentStep: number;
  track: TrackType;
  startRow: number;
}

interface GestureNote {
  note: number;
  step: number;
  velocity: number;
}

interface Pixel {
  color: string;
  action: string | null;
  baseColor: string;
  glow?: boolean;
  isTooltip?: boolean;
}

interface TooltipDef {
  text: string;
  row: number;
}

interface TooltipPixel {
  row: number;
  col: number;
  intensity: number;
}

interface LastTap {
  time: number;
  row: number;
  col: number;
}

interface SwipeStart {
  col: number;
  time: number;
  row: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const COLS = 44;
const ROWS = 24;

const NOTE_COLORS: Record<number, string> = {
  0: '#ff0000', 1: '#ff4500', 2: '#ff8c00', 3: '#ffc800',
  4: '#ffff00', 5: '#9acd32', 6: '#00ff00', 7: '#00ffaa',
  8: '#00ffff', 9: '#00aaff', 10: '#0055ff', 11: '#8a2be2',
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const TRACK_COLORS: Record<TrackType, string> = {
  melody: '#f7dc6f',
  chords: '#4ecdc4',
  bass: '#45b7d1',
  rhythm: '#ff6b6b',
};

const TRACK_ORDER: TrackType[] = ['melody', 'chords', 'bass', 'rhythm'];

const SCALES: Record<ScaleType, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  penta: [0, 2, 4, 7, 9],
};

const CHORD_INTERVALS: Record<ChordType, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
};

const DRUM_NAMES: Record<number, string> = {
  0: 'kick',
  1: 'kick2',
  2: 'lowTom',
  3: 'snare',
  4: 'snare2',
  5: 'rimshot',
  6: 'clap',
  7: 'closedHat',
  8: 'openHat',
  9: 'crash',
  10: 'ride',
  11: 'cowbell',
};

// ============================================================================
// VERSION REGISTRY
// ============================================================================

const PIXELBOOP_VERSIONS = {
  'v1-baseline': {
    name: 'v1 Baseline',
    description: 'Original chromatic grid (12 notes, no interval modes)',
    features: [
      'Chromatic note mapping',
      'Gesture system (tap, hold, swipe)',
      'Ghost notes',
      'Mute/solo',
      'Scale filtering (major/minor/penta)'
    ]
  },
  'v2-interval-modes': {
    name: 'v2 Interval Modes',
    description: 'Diatonic intervals with column 3 mode selection',
    features: [
      'All v1 features',
      'Interval modes: 3rds, 4ths, 5ths, 7ths, 9ths, chromatic',
      'Per-track interval mode selection',
      'Column 3: Note color indicators (35% alpha)',
      'Hold column 3: Climbing pixel mode selector (WIP)',
      'Scales span multiple octaves naturally'
    ]
  },
  'v3-set-toggling': {
    name: 'v3 Set Toggling (Planned)',
    description: '6→12 note access via column 4 set toggle',
    features: [
      'All v2 features',
      'Column 4: Set indicator (●/●●/●●●)',
      'Tap column 4: Toggle between 2 note sets (6 notes each)',
      'Bass track: 3 sets (4 notes each)',
      'Notes persist across set switches',
      'Key changes affect all sets (hidden notes transpose)'
    ]
  },
  'v4-sections-as-chords': {
    name: 'v4 Sections as Chords (Planned)',
    description: 'Automated chord progressions via section-based root automation',
    features: [
      'All v3 features',
      'Paint mode: Drag root notes across sections',
      'Record mode: Hold key button to capture live changes',
      'Section 2nd-row indicator: Shows root note colors',
      'Preset progressions: 2-5-1, 1-4-5',
      'Undo support for progression editing'
    ]
  }
};

// 3x5 pixel font
const PIXEL_FONT: Record<string, number[][]> = {
  'A': [[0,1,0],[1,0,1],[1,1,1],[1,0,1],[1,0,1]],
  'B': [[1,1,0],[1,0,1],[1,1,0],[1,0,1],[1,1,0]],
  'C': [[0,1,1],[1,0,0],[1,0,0],[1,0,0],[0,1,1]],
  'D': [[1,1,0],[1,0,1],[1,0,1],[1,0,1],[1,1,0]],
  'E': [[1,1,1],[1,0,0],[1,1,0],[1,0,0],[1,1,1]],
  'F': [[1,1,1],[1,0,0],[1,1,0],[1,0,0],[1,0,0]],
  'G': [[0,1,1],[1,0,0],[1,0,1],[1,0,1],[0,1,1]],
  'H': [[1,0,1],[1,0,1],[1,1,1],[1,0,1],[1,0,1]],
  'I': [[1,1,1],[0,1,0],[0,1,0],[0,1,0],[1,1,1]],
  'J': [[0,0,1],[0,0,1],[0,0,1],[1,0,1],[0,1,0]],
  'K': [[1,0,1],[1,0,1],[1,1,0],[1,0,1],[1,0,1]],
  'L': [[1,0,0],[1,0,0],[1,0,0],[1,0,0],[1,1,1]],
  'M': [[1,0,1],[1,1,1],[1,0,1],[1,0,1],[1,0,1]],
  'N': [[1,0,1],[1,1,1],[1,1,1],[1,0,1],[1,0,1]],
  'O': [[0,1,0],[1,0,1],[1,0,1],[1,0,1],[0,1,0]],
  'P': [[1,1,0],[1,0,1],[1,1,0],[1,0,0],[1,0,0]],
  'Q': [[0,1,0],[1,0,1],[1,0,1],[1,1,1],[0,1,1]],
  'R': [[1,1,0],[1,0,1],[1,1,0],[1,0,1],[1,0,1]],
  'S': [[0,1,1],[1,0,0],[0,1,0],[0,0,1],[1,1,0]],
  'T': [[1,1,1],[0,1,0],[0,1,0],[0,1,0],[0,1,0]],
  'U': [[1,0,1],[1,0,1],[1,0,1],[1,0,1],[0,1,0]],
  'V': [[1,0,1],[1,0,1],[1,0,1],[0,1,0],[0,1,0]],
  'W': [[1,0,1],[1,0,1],[1,0,1],[1,1,1],[1,0,1]],
  'X': [[1,0,1],[1,0,1],[0,1,0],[1,0,1],[1,0,1]],
  'Y': [[1,0,1],[1,0,1],[0,1,0],[0,1,0],[0,1,0]],
  'Z': [[1,1,1],[0,0,1],[0,1,0],[1,0,0],[1,1,1]],
  '0': [[0,1,0],[1,0,1],[1,0,1],[1,0,1],[0,1,0]],
  '1': [[0,1,0],[1,1,0],[0,1,0],[0,1,0],[1,1,1]],
  '2': [[1,1,0],[0,0,1],[0,1,0],[1,0,0],[1,1,1]],
  '3': [[1,1,0],[0,0,1],[0,1,0],[0,0,1],[1,1,0]],
  '4': [[1,0,1],[1,0,1],[1,1,1],[0,0,1],[0,0,1]],
  '5': [[1,1,1],[1,0,0],[1,1,0],[0,0,1],[1,1,0]],
  '6': [[0,1,1],[1,0,0],[1,1,0],[1,0,1],[0,1,0]],
  '7': [[1,1,1],[0,0,1],[0,1,0],[0,1,0],[0,1,0]],
  '8': [[0,1,0],[1,0,1],[0,1,0],[1,0,1],[0,1,0]],
  '9': [[0,1,0],[1,0,1],[0,1,1],[0,0,1],[1,1,0]],
  ' ': [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]],
  '.': [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,1,0]],
  ':': [[0,0,0],[0,1,0],[0,0,0],[0,1,0],[0,0,0]],
  '-': [[0,0,0],[0,0,0],[1,1,1],[0,0,0],[0,0,0]],
  '+': [[0,0,0],[0,1,0],[1,1,1],[0,1,0],[0,0,0]],
  '/': [[0,0,1],[0,0,1],[0,1,0],[1,0,0],[1,0,0]],
  '!': [[0,1,0],[0,1,0],[0,1,0],[0,0,0],[0,1,0]],
  '?': [[1,1,0],[0,0,1],[0,1,0],[0,0,0],[0,1,0]],
  '>': [[1,0,0],[0,1,0],[0,0,1],[0,1,0],[1,0,0]],
  '<': [[0,0,1],[0,1,0],[1,0,0],[0,1,0],[0,0,1]],
  '=': [[0,0,0],[1,1,1],[0,0,0],[1,1,1],[0,0,0]],
  '%': [[1,0,1],[0,0,1],[0,1,0],[1,0,0],[1,0,1]],
  '#': [[1,0,1],[1,1,1],[1,0,1],[1,1,1],[1,0,1]],
  '~': [[0,0,0],[0,1,0],[1,0,1],[0,0,0],[0,0,0]],
};

const TOOLTIPS: Record<string, TooltipDef> = {
  togglePlay: { text: 'PLAY/STOP', row: 2 },
  undo: { text: 'UNDO', row: 2 },
  redo: { text: 'REDO', row: 2 },
  scaleMajor: { text: 'MAJOR', row: 2 },
  scaleMinor: { text: 'MINOR', row: 2 },
  scalePenta: { text: 'PENTA', row: 2 },
  toggleGhosts: { text: 'GHOSTS', row: 2 },
  bpmUp: { text: 'BPM +', row: 2 },
  bpmDown: { text: 'BPM -', row: 2 },
  lenUp: { text: 'LEN +', row: 2 },
  lenDown: { text: 'LEN -', row: 2 },
  clearAll: { text: 'CLEAR!', row: 2 },
  gesture_tap: { text: 'TAP', row: 2 },
  gesture_accent: { text: 'ACCENT!', row: 2 },
  gesture_arpeggio: { text: 'ARPEGGIO', row: 2 },
  gesture_run: { text: 'RUN', row: 2 },
  gesture_stack: { text: 'CHORD', row: 2 },
  gesture_walking: { text: 'WALK', row: 2 },
  gesture_roll: { text: 'ROLL', row: 2 },
  gesture_phrase: { text: 'PHRASE', row: 2 },
  gesture_fill: { text: 'FILL', row: 2 },
  gesture_multi: { text: 'MULTI', row: 2 },
  gesture_fifth: { text: 'ROOT+5', row: 2 },
  gesture_erase: { text: 'ERASE', row: 2 },
  gesture_clear: { text: 'CLEARED!', row: 2 },
  gesture_shake: { text: '~SHAKE CLEAR~', row: 2 },
  gesture_swipeUndo: { text: '<<UNDO', row: 2 },
  gesture_swipeRedo: { text: 'REDO>>', row: 2 },
  gesture_sustain: { text: 'SUSTAIN', row: 2 },
  
  // Interval mode tooltips
  'melody_3RDS': { text: 'MELODY: 3RDS', row: 4 },
  'melody_4THS': { text: 'MELODY: 4THS', row: 4 },
  'melody_5THS': { text: 'MELODY: 5THS', row: 4 },
  'melody_7THS': { text: 'MELODY: 7THS', row: 4 },
  'melody_9THS': { text: 'MELODY: 9THS', row: 4 },
  'melody_CHROM': { text: 'MELODY: CHROM', row: 4 },
  'chords_3RDS': { text: 'CHORDS: 3RDS', row: 10 },
  'chords_4THS': { text: 'CHORDS: 4THS', row: 10 },
  'chords_5THS': { text: 'CHORDS: 5THS', row: 10 },
  'chords_7THS': { text: 'CHORDS: 7THS', row: 10 },
  'chords_9THS': { text: 'CHORDS: 9THS', row: 10 },
  'chords_CHROM': { text: 'CHORDS: CHROM', row: 10 },
  'bass_3RDS': { text: 'BASS: 3RDS', row: 15 },
  'bass_4THS': { text: 'BASS: 4THS', row: 15 },
  'bass_5THS': { text: 'BASS: 5THS', row: 15 },
  'bass_7THS': { text: 'BASS: 7THS', row: 15 },
  'bass_9THS': { text: 'BASS: 9THS', row: 15 },
  'bass_CHROM': { text: 'BASS: CHROM', row: 15 },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const emptyTrack = (): number[][] => Array(12).fill(null).map(() => Array(32).fill(0));

const blendWithWhite = (hexColor: string, amount = 0.7): string => {
  const hex = hexColor.replace('#', '');
  let r: number, g: number, b: number;
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6) {
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  } else {
    return '#ffffff';
  }
  r = Math.round(r + (255 - r) * amount);
  g = Math.round(g + (255 - g) * amount);
  b = Math.round(b + (255 - b) * amount);
  return `rgb(${r}, ${g}, ${b})`;
};

const midiToFreq = (midi: number): number => 440 * Math.pow(2, (midi - 69) / 12);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const PixelBoopSequencer: React.FC<PixelBoopSequencerProps> = ({ onBack, viewerMode = false, roomCode, onSessionReady }) => {
  // Version selector state (must be first to use in other hooks)
  const [pixelboopVersion, setPixelboopVersion] = useState<string>('v2-interval-modes');
  
  // Track state
  const [tracks, setTracks] = useState<Tracks>({
    melody: emptyTrack(),
    chords: emptyTrack(),
    bass: emptyTrack(),
    rhythm: emptyTrack(),
  });

  // History for undo/redo
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Track muting/soloing
  const [muted, setMuted] = useState<MutedState>({ melody: false, chords: false, bass: false, rhythm: false });
  const [soloed, setSoloed] = useState<TrackType | null>(null);

  // Musical settings
  const [scale, setScale] = useState<ScaleType>('major');
  const [rootNote, setRootNote] = useState(0);
  const [bpm, setBpm] = useState(120);
  const [patternLength, setPatternLength] = useState(32);
  
  // Interval mode state (per-track) - only used in v2+
  const melodyInterval = useIntervalMode('thirds', rootNote, scale);
  const chordsInterval = useIntervalMode('thirds', rootNote, scale);
  const bassInterval = useIntervalMode('thirds', rootNote, scale);
  
  // Interval mode selection controller (for column 3 hold gesture) - only used in v2+
  const intervalModeSelection = useIntervalModeSelection(
    // onModeConfirmed
    (track: IntervalTrackType, mode: IntervalModeType) => {
      console.log('[PixelBoop] Interval mode confirmed:', track, mode);
      if (track === 'melody') {
        melodyInterval.setIntervalMode(mode);
        showTooltip(`melody_mode_${mode}`);
      }
      else if (track === 'chords') {
        chordsInterval.setIntervalMode(mode);
        showTooltip(`chords_mode_${mode}`);
      }
      else if (track === 'bass') {
        bassInterval.setIntervalMode(mode);
        showTooltip(`bass_mode_${mode}`);
      }
    },
    // onModePreview (updates note colors in real-time during hold)
    (track: IntervalTrackType, mode: IntervalModeType) => {
      // Show tooltip with mode name during preview
      const modeNames: Record<IntervalModeType, string> = {
        'thirds': '3RDS',
        'fourths': '4THS',
        'fifths': '5THS',
        'sevenths': '7THS',
        'ninths': '9THS',
        'chromatic': 'CHROM'
      };
      showTooltip(`${track}_${modeNames[mode]}`);
    },
    // onActivation (show initial tooltip)
    (track: IntervalTrackType, mode: IntervalModeType) => {
      const modeNames: Record<IntervalModeType, string> = {
        'thirds': '3RDS',
        'fourths': '4THS',
        'fifths': '5THS',
        'sevenths': '7THS',
        'ninths': '9THS',
        'chromatic': 'CHROM'
      };
      showTooltip(`${track}_${modeNames[mode]}`);
    },
    // onCancelled
    undefined
  );
  
  // Version check helpers
  const isV1Baseline = pixelboopVersion === 'v1-baseline';
  const isV2OrHigher = !isV1Baseline;
  
  // Sync interval modes with root/scale changes
  useEffect(() => {
    melodyInterval.setRootNote(rootNote);
    melodyInterval.setScale(scale);
  }, [rootNote, scale, melodyInterval]);
  
  useEffect(() => {
    chordsInterval.setRootNote(rootNote);
    chordsInterval.setScale(scale);
  }, [rootNote, scale, chordsInterval]);
  
  useEffect(() => {
    bassInterval.setRootNote(rootNote);
    bassInterval.setScale(scale);
  }, [rootNote, scale, bassInterval]);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Gesture state
  const [gesture, setGesture] = useState<Gesture | null>(null);
  const [gesturePreview, setGesturePreview] = useState<GestureNote[]>([]);
  const [lastGestureType, setLastGestureType] = useState('');
  const [holdStart, setHoldStart] = useState<number | null>(null);
  const [lastTap, setLastTap] = useState<LastTap>({ time: 0, row: -1, col: -1 });

  // Visual state
  const [pulseStep, setPulseStep] = useState(-1);
  const [showGhosts, setShowGhosts] = useState(true);
  const [_tooltip, setTooltip] = useState<{ key: string; timestamp: number } | null>(null);
  const [tooltipPixels, setTooltipPixels] = useState<TooltipPixel[]>([]);
  const [pixelSize, setPixelSize] = useState(12);
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Shake detection state
  const [shakeDirectionChanges, setShakeDirectionChanges] = useState(0);
  const [lastShakeCol, setLastShakeCol] = useState<number | null>(null);
  const [lastShakeDirection, setLastShakeDirection] = useState(0);
  const [isShaking, setIsShaking] = useState(false);

  // Double swipe detection state
  const [lastSwipeTime, setLastSwipeTime] = useState(0);
  const [lastSwipeDirection, setLastSwipeDirection] = useState<string | null>(null);

  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const touchStartRef = useRef<{ row: number; col: number; time: number } | null>(null);
  const shakeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swipeStartRef = useRef<SwipeStart | null>(null);

  // ============================================================================
  // AUDIO INITIALIZATION
  // ============================================================================

  const audioUnlockedRef = useRef(false);
  const htmlAudioUnlockRef = useRef(false);

  const initAudio = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;

    // Step 1: Resume AudioContext if suspended
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (e) {
        console.warn('[PixelBoop] Failed to resume AudioContext:', e);
      }
    }

    // Step 2: HTML5 audio unlock (fixes iOS silent switch issue)
    // iOS Safari routes Web Audio API to "ringer channel" which respects silent switch.
    // Playing HTML5 audio forces Web Audio onto "media channel" which ignores silent switch.
    // See: https://bugs.webkit.org/show_bug.cgi?id=237322
    if (!htmlAudioUnlockRef.current) {
      try {
        const audio = document.createElement('audio');
        // Silent WAV file (base64 encoded, minimal size)
        audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
        audio.load();
        await audio.play();
        htmlAudioUnlockRef.current = true;
        console.log('[PixelBoop] HTML5 audio unlock complete - media channel activated');
      } catch (e) {
        console.warn('[PixelBoop] HTML5 audio unlock failed (may affect iOS with silent switch):', e);
      }
    }

    // Step 3: Web Audio silent buffer unlock (standard iOS unlock pattern)
    if (!audioUnlockedRef.current && ctx.state === 'running') {
      try {
        const silentBuffer = ctx.createBuffer(1, 1, ctx.sampleRate);
        const source = ctx.createBufferSource();
        source.buffer = silentBuffer;
        source.connect(ctx.destination);
        source.start(0);
        audioUnlockedRef.current = true;
        console.log('[PixelBoop] Web Audio unlock complete');
      } catch (e) {
        console.warn('[PixelBoop] Web Audio unlock failed:', e);
      }
    }
  }, []);

  // ============================================================================
  // RESPONSIVE SIZING
  // ============================================================================

  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const mobile = width < 768 || 'ontouchstart' in window;
      setIsMobile(mobile);

      // In fullscreen: use full viewport minus small margins for safe areas
      // Normal mode: account for ViewTemplate header (~200px)
      const horizontalPadding = isFullscreen ? 16 : 20;
      const verticalPadding = isFullscreen ? 60 : 200; // 60px for info bar + exit button in fullscreen

      const availableWidth = width - horizontalPadding;
      const availableHeight = height - verticalPadding;

      const maxPixelWidth = Math.floor(availableWidth / COLS) - 1;
      const maxPixelHeight = Math.floor(availableHeight / ROWS) - 1;

      // Allow larger pixels in fullscreen mode
      const maxSize = isFullscreen ? 24 : 20;
      const size = Math.max(6, Math.min(maxSize, Math.min(maxPixelWidth, maxPixelHeight)));
      setPixelSize(size);
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [isFullscreen]);

  // Prevent pull-to-refresh
  useEffect(() => {
    const preventDefault = (e: TouchEvent) => {
      if (gridRef.current && gridRef.current.contains(e.target as Node)) {
        e.preventDefault();
      }
    };
    document.addEventListener('touchmove', preventDefault, { passive: false });
    return () => document.removeEventListener('touchmove', preventDefault);
  }, []);

  // ============================================================================
  // GESTURE DETECTION
  // ============================================================================

  const detectDoubleSwipe = useCallback((startCol: number, endCol: number, duration: number): string | null => {
    const now = Date.now();
    const swipeDistance = endCol - startCol;
    const minSwipeDistance = 6;

    if (Math.abs(swipeDistance) < minSwipeDistance || duration > 300) {
      return null;
    }

    const direction = swipeDistance > 0 ? 'right' : 'left';

    if (now - lastSwipeTime < 500 && direction === lastSwipeDirection) {
      setLastSwipeTime(0);
      setLastSwipeDirection(null);
      return direction;
    }

    setLastSwipeTime(now);
    setLastSwipeDirection(direction);
    return null;
  }, [lastSwipeTime, lastSwipeDirection]);

  const detectShake = useCallback((col: number): boolean => {
    if (shakeTimeoutRef.current) {
      clearTimeout(shakeTimeoutRef.current);
    }
    shakeTimeoutRef.current = setTimeout(() => {
      setShakeDirectionChanges(0);
      setLastShakeCol(null);
      setLastShakeDirection(0);
      setIsShaking(false);
    }, 500);

    if (lastShakeCol !== null) {
      const diff = col - lastShakeCol;
      const direction = diff > 0 ? 1 : diff < 0 ? -1 : 0;

      if (direction !== 0 && Math.abs(diff) >= 2) {
        if (lastShakeDirection !== 0 && direction !== lastShakeDirection) {
          const newChanges = shakeDirectionChanges + 1;
          setShakeDirectionChanges(newChanges);
          setIsShaking(true);

          if (newChanges >= 5) {
            return true;
          }
        }
        setLastShakeDirection(direction);
      }
    }

    setLastShakeCol(col);
    return false;
  }, [lastShakeCol, lastShakeDirection, shakeDirectionChanges]);

  const resetShake = useCallback(() => {
    setShakeDirectionChanges(0);
    setLastShakeCol(null);
    setLastShakeDirection(0);
    setIsShaking(false);
    if (shakeTimeoutRef.current) {
      clearTimeout(shakeTimeoutRef.current);
    }
  }, []);

  // ============================================================================
  // TOOLTIP SYSTEM
  // ============================================================================

  const generateTooltipPixels = useCallback((text: string, startRow: number, startCol: number | null = null): TooltipPixel[] => {
    const pixels: TooltipPixel[] = [];
    const upperText = text.toUpperCase();

    let totalWidth = 0;
    for (const char of upperText) {
      if (PIXEL_FONT[char]) totalWidth += 4;
    }
    totalWidth = Math.max(0, totalWidth - 1);

    const col = startCol !== null ? startCol : Math.floor((COLS - totalWidth) / 2);

    let currentCol = col;
    for (const char of upperText) {
      const charPixels = PIXEL_FONT[char];
      if (charPixels) {
        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 3; c++) {
            if (charPixels[r][c]) {
              const pixelRow = startRow + r;
              const pixelCol = currentCol + c;
              if (pixelRow >= 0 && pixelRow < ROWS && pixelCol >= 0 && pixelCol < COLS) {
                pixels.push({ row: pixelRow, col: pixelCol, intensity: 0.85 });
              }
            }
          }
        }
        currentCol += 4;
      }
    }
    return pixels;
  }, []);

  const showTooltip = useCallback((key: string, col: number | null = null) => {
    const def = TOOLTIPS[key];
    if (!def) return;

    const pixels = generateTooltipPixels(def.text, def.row, col);
    setTooltipPixels(pixels);
    setTooltip({ key, timestamp: Date.now() });

    if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    tooltipTimeoutRef.current = setTimeout(() => {
      setTooltipPixels([]);
      setTooltip(null);
    }, 1200);
  }, [generateTooltipPixels]);

  const showGestureTooltip = useCallback((gestureType: string) => {
    const key = `gesture_${gestureType}`;
    if (TOOLTIPS[key]) showTooltip(key);
  }, [showTooltip]);

  useEffect(() => {
    if (lastGestureType) showGestureTooltip(lastGestureType);
  }, [lastGestureType, showGestureTooltip]);

  // ============================================================================
  // HISTORY MANAGEMENT
  // ============================================================================

  const saveHistory = useCallback((newTracks: Tracks) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(JSON.stringify(newTracks));
      if (newHistory.length > 50) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setTracks(JSON.parse(history[newIndex]));
      showTooltip('undo');
    }
  }, [history, historyIndex, showTooltip]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setTracks(JSON.parse(history[newIndex]));
      showTooltip('redo');
    }
  }, [history, historyIndex, showTooltip]);

  const clearAll = useCallback((fromShake = false) => {
    const empty: Tracks = {
      melody: emptyTrack(),
      chords: emptyTrack(),
      bass: emptyTrack(),
      rhythm: emptyTrack(),
    };
    setTracks(empty);
    saveHistory(empty);
    setLastGestureType(fromShake ? 'shake' : 'clear');
    resetShake();
  }, [saveHistory, resetShake]);

  // ============================================================================
  // PLAYBACK CONTROL
  // ============================================================================

  const togglePlay = useCallback(() => {
    initAudio();
    setIsPlaying(p => {
      const newState = !p;
      // Broadcast playback state if in session
      if (roomCode && !viewerMode) {
        pixelboopSessionService.broadcastPlaybackState({
          isPlaying: newState,
          currentStep
        });
      }
      return newState;
    });
    showTooltip('togglePlay');
  }, [initAudio, showTooltip, roomCode, viewerMode, currentStep]);

  const changeTempo = useCallback((delta: number) => {
    setBpm(b => {
      const newBpm = Math.max(60, Math.min(200, b + delta));
      // Broadcast tempo if in session
      if (roomCode && !viewerMode) {
        pixelboopSessionService.broadcastTempo({ bpm: newBpm });
      }
      return newBpm;
    });
  }, [roomCode, viewerMode]);

  // ============================================================================
  // KEYBOARD SHORTCUTS
  // ============================================================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'KeyZ' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (e.code === 'Delete' || e.code === 'Backspace') {
        e.preventDefault();
        clearAll();
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        changeTempo(5);
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        changeTempo(-5);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, clearAll, togglePlay, changeTempo]);

  // ============================================================================
  // SCALE & CHORD HELPERS
  // ============================================================================

  const getScaleNotes = useCallback((): number[] => {
    return SCALES[scale].map(n => (n + rootNote) % 12);
  }, [scale, rootNote]);

  const isInScale = useCallback((note: number): boolean => {
    return getScaleNotes().includes(note % 12);
  }, [getScaleNotes]);

  const snapToScale = useCallback((note: number): number => {
    const scaleNotes = getScaleNotes();
    if (scaleNotes.includes(note % 12)) return note;
    for (let offset = 1; offset < 6; offset++) {
      if (scaleNotes.includes((note + offset) % 12)) return (note + offset) % 12;
      if (scaleNotes.includes((note - offset + 12) % 12)) return (note - offset + 12) % 12;
    }
    return note;
  }, [getScaleNotes]);

  const getChordNotes = useCallback((root: number, type: ChordType = 'major'): number[] => {
    const intervals = CHORD_INTERVALS[type] || CHORD_INTERVALS.major;
    return intervals.map(i => (root + i) % 12);
  }, []);

  // ============================================================================
  // GESTURE INTERPRETATION
  // ============================================================================

  const interpretGesture = useCallback((
    start: { note: number; step: number },
    end: { note: number; step: number },
    track: TrackType,
    velocity = 1
  ): GestureNote[] => {
    const dx = end.step - start.step;
    const dy = end.note - start.note;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    const notes: GestureNote[] = [];

    if (absDx <= 1 && absDy <= 1) {
      // Simple tap
      if (track === 'rhythm') {
        notes.push({ note: start.note, step: start.step, velocity });
        if (start.step + 2 < patternLength) notes.push({ note: start.note, step: start.step + 2, velocity: 1 });
      } else if (track === 'bass') {
        notes.push({ note: start.note, step: start.step, velocity });
        notes.push({ note: (start.note + 7) % 12, step: start.step, velocity: 1 });
      } else if (track === 'chords') {
        const chordType: ChordType = scale === 'minor' ? 'minor' : 'major';
        getChordNotes(start.note, chordType).forEach(n => {
          notes.push({ note: n, step: start.step, velocity });
        });
      } else {
        notes.push({ note: snapToScale(start.note), step: start.step, velocity });
      }
      setLastGestureType(velocity > 1 ? 'accent' : 'tap');

    } else if (absDx > absDy * 1.3) {
      // Horizontal gesture
      const direction = dx > 0 ? 1 : -1;
      const steps = Math.min(absDx, 8);

      if (velocity > 1 && track !== 'rhythm') {
        // SUSTAIN GESTURE
        const sustainNote = track === 'chords'
          ? getChordNotes(start.note, scale === 'minor' ? 'minor' : 'major')
          : [snapToScale(start.note)];

        for (let i = 0; i <= steps; i++) {
          const step = (start.step + i * direction + patternLength) % patternLength;
          sustainNote.forEach(n => {
            notes.push({ note: n, step, velocity: i === 0 ? 2 : 3 });
          });
        }
        setLastGestureType('sustain');
      } else if (track === 'chords') {
        const chordNotes = getChordNotes(start.note, 'maj7');
        for (let i = 0; i <= steps; i++) {
          const noteIdx = i % chordNotes.length;
          const step = (start.step + i * direction + patternLength) % patternLength;
          notes.push({ note: chordNotes[noteIdx], step, velocity: i === 0 ? velocity : 1 });
        }
        setLastGestureType('arpeggio');
      } else if (track === 'bass') {
        const pattern = [0, 7, 4, 7];
        for (let i = 0; i <= steps; i++) {
          const interval = pattern[i % pattern.length];
          const step = (start.step + i * direction + patternLength) % patternLength;
          notes.push({ note: (start.note + interval) % 12, step, velocity: i % 2 === 0 ? velocity : 1 });
        }
        setLastGestureType('walking');
      } else if (track === 'rhythm') {
        for (let i = 0; i <= steps; i++) {
          const step = (start.step + i * direction + patternLength) % patternLength;
          notes.push({ note: start.note, step, velocity: i === 0 || i === steps ? velocity : 1 });
        }
        setLastGestureType('roll');
      } else {
        const scaleNotes = getScaleNotes();
        let currentScaleIdx = scaleNotes.indexOf(start.note % 12);
        if (currentScaleIdx === -1) currentScaleIdx = 0;

        for (let i = 0; i <= steps; i++) {
          const scaleIdx = (currentScaleIdx + i * (dy >= 0 ? 1 : -1) + scaleNotes.length * 10) % scaleNotes.length;
          const step = (start.step + i * direction + patternLength) % patternLength;
          notes.push({ note: scaleNotes[scaleIdx], step, velocity: i === 0 ? velocity : 1 });
        }
        setLastGestureType('run');
      }

    } else if (absDy > absDx * 1.3) {
      // Vertical gesture
      if (track === 'chords' || track === 'melody') {
        const chordNotes = getChordNotes(start.note, 'maj7');
        const span = Math.min(absDy, chordNotes.length - 1);
        for (let i = 0; i <= span; i++) {
          notes.push({ note: chordNotes[i], step: start.step, velocity });
        }
        setLastGestureType('stack');
      } else if (track === 'bass') {
        notes.push({ note: start.note, step: start.step, velocity });
        notes.push({ note: (start.note + 5) % 12, step: start.step, velocity: 1 });
        setLastGestureType('fifth');
      } else {
        const minN = Math.min(start.note, end.note);
        const maxN = Math.max(start.note, end.note);
        for (let n = minN; n <= maxN; n++) {
          notes.push({ note: n, step: start.step, velocity });
        }
        setLastGestureType('multi');
      }

    } else {
      // Diagonal gesture
      const steps = Math.max(absDx, absDy);
      const scaleNotes = getScaleNotes();

      if (track === 'melody' || track === 'chords') {
        let currentScaleIdx = scaleNotes.indexOf(start.note % 12);
        if (currentScaleIdx === -1) currentScaleIdx = 0;

        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const step = Math.round(start.step + dx * t);
          const noteOffset = Math.round(dy * t / 2);
          const scaleIdx = (currentScaleIdx + noteOffset + scaleNotes.length * 10) % scaleNotes.length;
          if (step >= 0 && step < patternLength) {
            notes.push({ note: scaleNotes[scaleIdx], step, velocity: i === 0 ? velocity : 1 });
          }
        }
        setLastGestureType('phrase');
      } else {
        const minS = Math.min(start.step, end.step);
        const maxS = Math.max(start.step, end.step);
        const minN = Math.min(start.note, end.note);
        const maxN = Math.max(start.note, end.note);
        for (let s = minS; s <= maxS; s++) {
          const t = (s - minS) / (maxS - minS || 1);
          const n = Math.round(minN + (maxN - minN) * t);
          notes.push({ note: n, step: s, velocity });
        }
        setLastGestureType('fill');
      }
    }

    return notes;
  }, [scale, rootNote, snapToScale, getChordNotes, getScaleNotes, patternLength]);

  const applyGesture = useCallback((notes: GestureNote[], track: TrackType) => {
    setTracks(prev => {
      const newTracks = { ...prev };
      const newTrack = prev[track].map(r => [...r]);
      notes.forEach(({ note, step, velocity = 1 }) => {
        if (note >= 0 && note < 12 && step >= 0 && step < 32) {
          const normalizedVelocity = velocity > 2 ? 3 : (velocity > 1 ? 2 : 1);
          newTrack[note][step] = normalizedVelocity;
          
          // Broadcast pattern edit if in session
          if (roomCode && !viewerMode) {
            const trackIndex = TRACK_ORDER.indexOf(track);
            const delta: PatternEditDelta = {
              track: trackIndex,
              step,
              note,
              velocity: normalizedVelocity * 42, // Scale 1-3 to MIDI velocity range
              duration: 0.5,
              timestamp: Date.now()
            };
            pixelboopSessionService.broadcastPatternEdit(delta);
          }
        }
      });
      newTracks[track] = newTrack;
      saveHistory(newTracks);
      return newTracks;
    });
  }, [saveHistory, roomCode, viewerMode]);

  // ============================================================================
  // TRACK/NOTE HELPERS
  // ============================================================================

  const getTrackForRow = (row: number): TrackType | null => {
    if (row >= 2 && row <= 7) return 'melody';
    if (row >= 8 && row <= 13) return 'chords';
    if (row >= 14 && row <= 17) return 'bass';
    if (row >= 18 && row <= 21) return 'rhythm';
    return null;
  };

  const getNoteForRow = (row: number, track: TrackType): number => {
    const trackStarts: Record<TrackType, number> = { melody: 2, chords: 8, bass: 14, rhythm: 18 };
    const trackSizes: Record<TrackType, number> = { melody: 6, chords: 6, bass: 4, rhythm: 4 };
    const start = trackStarts[track];
    const size = trackSizes[track];
    const localRow = row - start;
    return Math.max(0, Math.min(11, Math.round((size - 1 - localRow) / (size - 1) * 11)));
  };

  const toggleMute = (track: TrackType) => {
    if (soloed === track) {
      setSoloed(null);
      if (roomCode && !viewerMode) {
        const trackIndex = TRACK_ORDER.indexOf(track);
        pixelboopSessionService.broadcastTrackState({ track: trackIndex, muted: false, solo: false });
      }
    } else {
      setMuted(m => {
        const newMuted = !m[track];
        if (roomCode && !viewerMode) {
          const trackIndex = TRACK_ORDER.indexOf(track);
          pixelboopSessionService.broadcastTrackState({ track: trackIndex, muted: newMuted, solo: false });
        }
        return { ...m, [track]: newMuted };
      });
    }
  };

  const toggleSolo = (track: TrackType) => {
    setSoloed(s => {
      const newSolo = s === track ? null : track;
      if (roomCode && !viewerMode) {
        const trackIndex = TRACK_ORDER.indexOf(track);
        pixelboopSessionService.broadcastTrackState({ 
          track: trackIndex, 
          muted: false, 
          solo: newSolo === track 
        });
      }
      return newSolo;
    });
  };

  // ============================================================================
  // INPUT HANDLING
  // ============================================================================

  const getPixelFromEvent = useCallback((e: React.TouchEvent | TouchEvent, isTouch = false): { row: number; col: number } | null => {
    if (!gridRef.current) return null;

    const rect = gridRef.current.getBoundingClientRect();
    const touch = (e as TouchEvent).touches?.[0] || (e as React.TouchEvent).touches?.[0];
    const clientX = isTouch && touch ? touch.clientX : (e as any).clientX;
    const clientY = isTouch && touch ? touch.clientY : (e as any).clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const gap = 1;
    const totalPixelSize = pixelSize + gap;

    const col = Math.floor(x / totalPixelSize);
    const row = Math.floor(y / totalPixelSize);

    if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
      return { row, col };
    }
    return null;
  }, [pixelSize]);

  // ============================================================================
  // PIXEL GRID RENDERING
  // ============================================================================

  const getPixelGrid = useCallback((): Pixel[][] => {
    const grid: Pixel[][] = Array(ROWS).fill(null).map(() =>
      Array(COLS).fill(null).map(() => ({ color: '#0a0a0a', action: null, baseColor: '#0a0a0a' }))
    );

    // Row 0: Controls
    for (let c = 0; c < 3; c++) {
      const color = isPlaying ? '#ff4444' : '#44ff44';
      grid[0][c] = { color, action: 'togglePlay', baseColor: color };
    }

    grid[0][4] = { color: historyIndex > 0 ? '#888' : '#333', action: 'undo', baseColor: '#888' };
    grid[0][5] = { color: historyIndex < history.length - 1 ? '#888' : '#333', action: 'redo', baseColor: '#888' };

    grid[0][7] = { color: scale === 'major' ? '#ffaa00' : '#442200', action: 'scaleMajor', baseColor: '#ffaa00' };
    grid[0][8] = { color: scale === 'minor' ? '#00aaff' : '#002244', action: 'scaleMinor', baseColor: '#00aaff' };
    grid[0][9] = { color: scale === 'penta' ? '#aa00ff' : '#220044', action: 'scalePenta', baseColor: '#aa00ff' };

    for (let n = 0; n < 12; n++) {
      const color = n === rootNote ? NOTE_COLORS[n] : `${NOTE_COLORS[n]}44`;
      grid[0][11 + n] = { color, action: `root_${n}`, baseColor: NOTE_COLORS[n] };
    }

    grid[0][24] = { color: showGhosts ? '#666' : '#222', action: 'toggleGhosts', baseColor: '#666' };

    grid[0][26] = { color: '#444', action: 'bpmDown', baseColor: '#666' };
    grid[0][27] = { color: `hsl(${bpm}, 70%, 50%)`, action: null, baseColor: `hsl(${bpm}, 70%, 50%)` };
    grid[0][28] = { color: '#444', action: 'bpmUp', baseColor: '#666' };

    grid[0][30] = { color: '#444', action: 'lenDown', baseColor: '#666' };
    grid[0][31] = { color: `hsl(${patternLength * 8}, 70%, 50%)`, action: null, baseColor: '#f5f' };
    grid[0][32] = { color: '#444', action: 'lenUp', baseColor: '#666' };

    // Shake indicator
    const shakeColor = isShaking ? `hsl(${360 - shakeDirectionChanges * 60}, 100%, 50%)` : '#222';
    for (let c = 34; c < 38; c++) {
      grid[0][c] = { color: shakeColor, action: null, baseColor: shakeColor };
    }

    // Clear button
    for (let c = 40; c < 44; c++) {
      grid[0][c] = { color: '#662222', action: 'clearAll', baseColor: '#ff4444' };
    }

    // Row 1: Step markers
    for (let s = 0; s < patternLength; s++) {
      const col = 4 + s + Math.floor(s / 8);
      if (col < COLS) {
        const isBeat = s % 4 === 0;
        const isBar = s % 8 === 0;
        const isPulse = s === pulseStep;
        const color = isPulse ? '#fff' : (s === currentStep && isPlaying ? '#aaa' : (isBar ? '#555' : isBeat ? '#333' : '#1a1a1a'));
        grid[1][col] = { color, action: null, baseColor: '#555' };
      }
    }

    for (let c = 0; c < 4; c++) {
      grid[1][c] = { color: '#222', action: null, baseColor: '#222' };
    }

    // Track grids
    const trackRows: { track: TrackType; start: number; height: number }[] = [
      { track: 'melody', start: 2, height: 6 },
      { track: 'chords', start: 8, height: 6 },
      { track: 'bass', start: 14, height: 4 },
      { track: 'rhythm', start: 18, height: 4 },
    ];

    trackRows.forEach(({ track, start, height }) => {
      const isMuted = muted[track] || (soloed !== null && soloed !== track);
      const isSoloed = soloed === track;

      for (let r = start; r < start + height; r++) {
        const intensity = 1 - (r - start) / height * 0.5;
        const baseColor = TRACK_COLORS[track];
        const alpha = isMuted ? '33' : (isSoloed ? 'ff' : Math.round(intensity * 200).toString(16).padStart(2, '0'));
        grid[r][0] = { color: `${baseColor}${alpha}`, action: `mute_${track}`, baseColor };
        grid[r][1] = { color: isSoloed ? '#fff' : '#333', action: `solo_${track}`, baseColor: '#fff' };
        grid[r][2] = { color: '#111', action: null, baseColor: '#111' };
        
        // Column 3: Version-dependent rendering
        const localRow = r - start;
        if (isV2OrHigher && track !== 'rhythm') {
          // V2+: Interval mode indicator - show note colors for current interval mode
          // Get current interval mode for this track
          let currentIntervalMode = melodyInterval;
          if (track === 'chords') currentIntervalMode = chordsInterval;
          else if (track === 'bass') currentIntervalMode = bassInterval;
          
          // Check if interval mode selection is active for this track
          const isSelecting = intervalModeSelection.activeTrack === track;
          const highlightedRow = intervalModeSelection.highlightedMode !== null ? intervalModeSelection.highlightedMode % height : -1;
          
          if (isSelecting && localRow === highlightedRow) {
            // Show climbing white pixel during selection
            const brightness = Math.round(intervalModeSelection.highlightBrightness * 255);
            grid[r][3] = {
              color: `rgb(${brightness}, ${brightness}, ${brightness})`,
              action: `interval_mode_${track}`,
              baseColor: '#ffffff'
            };
          } else {
            // Calculate pitch class for this row using interval mode
            const pitchClass = currentIntervalMode.getPitchClassForRow(localRow, height);
            const noteColor = NOTE_COLORS[pitchClass];
            
            // Show dim note color (35% alpha for normal, 25% alpha during selection)
            const alpha = isSelecting ? '40' : '59';  // Dimmer during selection except highlighted row
            grid[r][3] = { 
              color: `${noteColor}${alpha}`,
              action: `interval_mode_${track}`, 
              baseColor: noteColor 
            };
          }
        } else {
          // V1 or rhythm track: Simple dark background (no interval indicator)
          grid[r][3] = { color: '#0a0a0a', action: null, baseColor: '#0a0a0a' };
        }
      }

      for (let localRow = 0; localRow < height; localRow++) {
        const row = start + localRow;
        const noteBase = Math.round((height - 1 - localRow) / (height - 1) * 11);

        // Calculate what pitch class this row represents (for coloring)
        let rowPitchClass = noteBase % 12;  // Default v1 behavior
        if (isV2OrHigher && track !== 'rhythm') {
          // V2+: Use interval mode to determine pitch class for this row
          let currentIntervalMode = melodyInterval;
          if (track === 'chords') currentIntervalMode = chordsInterval;
          else if (track === 'bass') currentIntervalMode = bassInterval;
          
          rowPitchClass = currentIntervalMode.getPitchClassForRow(localRow, height);
        }

        for (let step = 0; step < patternLength; step++) {
          const col = 4 + step + Math.floor(step / 8);
          if (col >= COLS) continue;

          const noteStart = Math.max(0, noteBase - 1);
          const noteEnd = Math.min(11, noteBase + 1);
          let velocity = 0;
          let activeNote = noteBase;

          for (let n = noteStart; n <= noteEnd; n++) {
            if (tracks[track][n][step] > 0) {
              velocity = tracks[track][n][step];
              activeNote = n;
              break;
            }
          }

          const isPlayhead = step === currentStep && isPlaying;
          const inScale = isInScale(noteBase);

          let ghostColor: string | null = null;
          if (showGhosts && velocity === 0) {
            for (const otherTrack of TRACK_ORDER) {
              if (otherTrack !== track) {
                for (let n = noteStart; n <= noteEnd; n++) {
                  if (tracks[otherTrack][n][step] > 0) {
                    ghostColor = `${TRACK_COLORS[otherTrack]}22`;
                    break;
                  }
                }
              }
              if (ghostColor) break;
            }
          }

          // Calculate sustain fade for velocity=3 notes
          let sustainFade = 1.0;
          if (velocity === 3) {
            let sustainStart = step;
            let sustainLength = 1;
            for (let s = 1; s <= patternLength; s++) {
              const prevStep = (step - s + patternLength) % patternLength;
              const prevVel = tracks[track][activeNote][prevStep];
              if (prevVel === 3) {
                sustainStart = prevStep;
                sustainLength++;
              } else if (prevVel === 1 || prevVel === 2) {
                sustainStart = prevStep;
                sustainLength++;
                break;
              } else {
                break;
              }
            }
            for (let s = 1; s < patternLength; s++) {
              const nextStep = (step + s) % patternLength;
              if (tracks[track][activeNote][nextStep] === 3) {
                sustainLength++;
              } else {
                break;
              }
            }
            const positionInSustain = ((step - sustainStart + patternLength) % patternLength) / sustainLength;
            sustainFade = positionInSustain < 0.4 ? 0.85 : Math.max(0.25, 1 - positionInSustain * 0.9);
          }

          let color = '#0a0a0a';
          let baseColor = '#0a0a0a';
          if (velocity > 0) {
            // Use the row's pitch class (based on interval mode in v2+) for coloring
            const noteColor = NOTE_COLORS[rowPitchClass];
            if (velocity === 2) {
              color = noteColor;
            } else if (velocity === 3) {
              const hex = noteColor.replace('#', '');
              const r = parseInt(hex.slice(0, 2), 16);
              const g = parseInt(hex.slice(2, 4), 16);
              const b = parseInt(hex.slice(4, 6), 16);
              color = `rgba(${r}, ${g}, ${b}, ${sustainFade})`;
            } else {
              color = `${noteColor}bb`;
            }
            baseColor = noteColor;
          } else if (ghostColor) {
            color = ghostColor;
            baseColor = ghostColor;
          } else if (isPlayhead) {
            color = '#1a1a1a';
          } else if (step % 8 === 0) {
            color = '#111';
          } else if (!inScale && track !== 'rhythm') {
            color = '#060606';
          }

          if (isMuted && velocity > 0) {
            color = `${color}66`;
          }

          if (gesturePreview.some(p => {
            const previewRow = start + Math.round((11 - p.note) / 11 * (height - 1));
            return previewRow === row && p.step === step;
          })) {
            color = '#ffffff88';
          }

          grid[row][col] = {
            color,
            action: `grid_${row}_${step}`,
            glow: velocity > 0 && isPlayhead,
            baseColor,
          };
        }
      }
    });

    // Bottom overview rows
    for (let step = 0; step < patternLength; step++) {
      const col = 4 + step + Math.floor(step / 8);
      if (col >= COLS) continue;

      let activeTrack: TrackType | null = null;
      let activeNote = 0;
      for (const track of TRACK_ORDER) {
        const isMutedTrack = muted[track] || (soloed !== null && soloed !== track);
        if (isMutedTrack) continue;
        for (let n = 0; n < 12; n++) {
          if (tracks[track][n][step] > 0) {
            activeTrack = track;
            activeNote = n;
            break;
          }
        }
        if (activeTrack) break;
      }

      const isPlayhead = step === currentStep && isPlaying;
      grid[22][col] = { color: activeTrack ? TRACK_COLORS[activeTrack] : (isPlayhead ? '#222' : '#0a0a0a'), action: null, baseColor: activeTrack ? TRACK_COLORS[activeTrack] : '#0a0a0a' };
      grid[23][col] = { color: activeTrack ? NOTE_COLORS[activeNote % 12] : '#050505', action: null, baseColor: activeTrack ? NOTE_COLORS[activeNote % 12] : '#050505' };
    }

    for (let c = 0; c < 4; c++) {
      grid[22][c] = { color: '#222', action: null, baseColor: '#222' };
      grid[23][c] = { color: '#111', action: null, baseColor: '#111' };
    }

    // Apply tooltip
    tooltipPixels.forEach(({ row, col, intensity }) => {
      if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
        const base = grid[row][col].baseColor || grid[row][col].color;
        grid[row][col] = {
          ...grid[row][col],
          color: blendWithWhite(base, intensity),
          isTooltip: true,
        };
      }
    });

    return grid;
  }, [tracks, currentStep, isPlaying, scale, rootNote, isInScale, gesturePreview, muted, soloed, showGhosts, pulseStep, bpm, patternLength, history, historyIndex, tooltipPixels, isShaking, shakeDirectionChanges, melodyInterval, chordsInterval, bassInterval, intervalModeSelection, isV1Baseline, isV2OrHigher]);

  // ============================================================================
  // ACTION HANDLER
  // ============================================================================

  const handleAction = useCallback((action: string | null, _row: number, _col: number) => {
    if (!action) return;

    initAudio();

    if (action === 'togglePlay') {
      togglePlay();
    } else if (action === 'undo') {
      undo();
    } else if (action === 'redo') {
      redo();
    } else if (action === 'scaleMajor') {
      setScale('major');
      showTooltip('scaleMajor');
    } else if (action === 'scaleMinor') {
      setScale('minor');
      showTooltip('scaleMinor');
    } else if (action === 'scalePenta') {
      setScale('penta');
      showTooltip('scalePenta');
    } else if (action.startsWith('root_')) {
      setRootNote(parseInt(action.split('_')[1]));
    } else if (action === 'toggleGhosts') {
      setShowGhosts(g => !g);
      showTooltip('toggleGhosts');
    } else if (action === 'bpmUp') {
      setBpm(b => Math.min(200, b + 5));
      showTooltip('bpmUp');
    } else if (action === 'bpmDown') {
      setBpm(b => Math.max(60, b - 5));
      showTooltip('bpmDown');
    } else if (action === 'lenUp') {
      setPatternLength(l => Math.min(32, l + 4));
      showTooltip('lenUp');
    } else if (action === 'lenDown') {
      setPatternLength(l => Math.max(8, l - 4));
      showTooltip('lenDown');
    } else if (action.startsWith('mute_')) {
      toggleMute(action.split('_')[1] as TrackType);
    } else if (action.startsWith('solo_')) {
      toggleSolo(action.split('_')[1] as TrackType);
    } else if (action === 'clearAll') {
      clearAll();
    }
    // TODO: Add interval mode handlers for column 3 hold gesture (see docs/INTERVAL-MODE-PORT-STATUS.md)
  }, [undo, redo, clearAll, showTooltip, togglePlay, initAudio]);

  // ============================================================================
  // GESTURE HANDLERS
  // ============================================================================

  const startGesture = useCallback((row: number, col: number) => {
    const now = Date.now();
    setHoldStart(now);
    swipeStartRef.current = { col, time: now, row };

    // Double tap detection
    if (now - lastTap.time < 300 && Math.abs(lastTap.row - row) <= 1 && Math.abs(lastTap.col - col) <= 1) {
      const track = getTrackForRow(row);

      if (!track) {
        togglePlay();
        setLastTap({ time: 0, row: -1, col: -1 });
        return;
      }

      let step = col - 4;
      if (step >= 8) step -= 1;
      if (step >= 16) step -= 1;
      if (step >= 24) step -= 1;

      setTracks(prev => {
        const newTracks = { ...prev };
        const newTrack = prev[track].map(r => [...r]);
        for (let n = 0; n < 12; n++) {
          newTrack[n][step] = 0;
        }
        newTracks[track] = newTrack;
        saveHistory(newTracks);
        return newTracks;
      });
      setLastGestureType('erase');
      setLastTap({ time: 0, row: -1, col: -1 });
      return;
    }

    setLastTap({ time: now, row, col });

    const track = getTrackForRow(row);
    if (track) {
      let step = col - 4;
      if (step >= 8) step -= 1;
      if (step >= 16) step -= 1;
      if (step >= 24) step -= 1;

      if (step >= 0 && step < 32) {
        const note = getNoteForRow(row, track);
        setGesture({ startNote: note, startStep: step, currentNote: note, currentStep: step, track, startRow: row });
        setGesturePreview([{ note, step, velocity: 1 }]);
      }
    }
  }, [lastTap, saveHistory, togglePlay]);

  const updateGesture = useCallback((row: number, col: number) => {
    const shouldClear = detectShake(col);
    if (shouldClear) {
      clearAll(true);
      setGesture(null);
      setGesturePreview([]);
      return;
    }

    if (!gesture) return;

    const track = getTrackForRow(row);
    if (track !== gesture.track) return;

    let step = col - 4;
    if (step >= 8) step -= 1;
    if (step >= 16) step -= 1;
    if (step >= 24) step -= 1;

    if (step < 0 || step >= 32) return;

    const note = getNoteForRow(row, track);
    setGesture(g => g ? { ...g, currentNote: note, currentStep: step } : null);

    const holdDuration = Date.now() - (holdStart || Date.now());
    const velocity = holdDuration > 400 ? 2 : 1;

    const preview = interpretGesture(
      { note: gesture.startNote, step: gesture.startStep },
      { note, step },
      gesture.track,
      velocity
    );
    setGesturePreview(preview);
  }, [gesture, holdStart, interpretGesture, detectShake, clearAll]);

  const endGesture = useCallback(() => {
    const now = Date.now();

    if (swipeStartRef.current) {
      const duration = now - swipeStartRef.current.time;
      const startCol = swipeStartRef.current.col;
      const endCol = gesture ? (4 + gesture.currentStep + Math.floor(gesture.currentStep / 8)) : startCol;

      const doubleSwipe = detectDoubleSwipe(startCol, endCol, duration);
      if (doubleSwipe === 'left') {
        undo();
        setLastGestureType('swipeUndo');
        setGesture(null);
        setGesturePreview([]);
        setHoldStart(null);
        resetShake();
        swipeStartRef.current = null;
        return;
      } else if (doubleSwipe === 'right') {
        redo();
        setLastGestureType('swipeRedo');
        setGesture(null);
        setGesturePreview([]);
        setHoldStart(null);
        resetShake();
        swipeStartRef.current = null;
        return;
      }
    }

    if (gesture && gesturePreview.length > 0 && !isShaking) {
      const holdDuration = now - (holdStart || now);
      const velocity = holdDuration > 400 ? 2 : 1;

      const finalNotes = interpretGesture(
        { note: gesture.startNote, step: gesture.startStep },
        { note: gesture.currentNote, step: gesture.currentStep },
        gesture.track,
        velocity
      );

      applyGesture(finalNotes, gesture.track);
    }
    setGesture(null);
    setGesturePreview([]);
    setHoldStart(null);
    resetShake();
    swipeStartRef.current = null;
  }, [gesture, gesturePreview, holdStart, interpretGesture, applyGesture, isShaking, resetShake, detectDoubleSwipe, undo, redo]);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    initAudio();
    const pixel = getPixelFromEvent(e, true);
    if (!pixel) return;

    touchStartRef.current = { ...pixel, time: Date.now() };
    resetShake();

    // V2+: Column 3 hold gesture for interval mode selection
    if (isV2OrHigher && pixel.col === 3) {
      // Determine which track this row belongs to
      let track: 'melody' | 'chords' | 'bass' | null = null;
      let currentMode: IntervalModeType = 'thirds';
      
      if (pixel.row >= 2 && pixel.row <= 7) {
        track = 'melody';
        currentMode = melodyInterval.intervalMode;
      } else if (pixel.row >= 8 && pixel.row <= 13) {
        track = 'chords';
        currentMode = chordsInterval.intervalMode;
      } else if (pixel.row >= 14 && pixel.row <= 17) {
        track = 'bass';
        currentMode = bassInterval.intervalMode;
      }
      
      if (track) {
        intervalModeSelection.beginHold(track, currentMode);
        return;  // Don't process other actions
      }
    }

    const grid = getPixelGrid();
    const action = grid[pixel.row][pixel.col].action;

    if (action && !action.startsWith('grid_')) {
      handleAction(action, pixel.row, pixel.col);
    } else {
      startGesture(pixel.row, pixel.col);
    }
  }, [getPixelFromEvent, getPixelGrid, handleAction, startGesture, resetShake, initAudio, isV2OrHigher, melodyInterval, chordsInterval, bassInterval, intervalModeSelection]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const pixel = getPixelFromEvent(e, true);
    if (!pixel) return;
    updateGesture(pixel.row, pixel.col);
  }, [getPixelFromEvent, updateGesture]);

  const handleTouchEnd = useCallback(() => {
    // V2+: End interval mode selection if active
    if (intervalModeSelection.activeTrack) {
      intervalModeSelection.endHold();
    } else {
      endGesture();
    }
    touchStartRef.current = null;
  }, [endGesture, intervalModeSelection]);

  // Mouse handlers
  const handleMouseDown = useCallback((row: number, col: number) => {
    initAudio();
    resetShake();
    
    // V2+: Column 3 hold gesture for interval mode selection
    if (isV2OrHigher && col === 3) {
      // Determine which track this row belongs to
      let track: 'melody' | 'chords' | 'bass' | null = null;
      let currentMode: IntervalModeType = 'thirds';
      
      if (row >= 2 && row <= 7) {
        track = 'melody';
        currentMode = melodyInterval.intervalMode;
      } else if (row >= 8 && row <= 13) {
        track = 'chords';
        currentMode = chordsInterval.intervalMode;
      } else if (row >= 14 && row <= 17) {
        track = 'bass';
        currentMode = bassInterval.intervalMode;
      }
      
      if (track) {
        intervalModeSelection.beginHold(track, currentMode);
        return;  // Don't process other actions
      }
    }
    
    const grid = getPixelGrid();
    const action = grid[row][col].action;

    if (action && !action.startsWith('grid_')) {
      handleAction(action, row, col);
    } else {
      startGesture(row, col);
    }
  }, [getPixelGrid, handleAction, startGesture, resetShake, initAudio, isV2OrHigher, melodyInterval, chordsInterval, bassInterval, intervalModeSelection]);

  const handleMouseMove = useCallback((row: number, col: number) => {
    if (gesture || touchStartRef.current) {
      updateGesture(row, col);
    }
  }, [gesture, updateGesture]);

  const handleMouseUp = useCallback(() => {
    // V2+: End interval mode selection if active
    if (intervalModeSelection.activeTrack) {
      intervalModeSelection.endHold();
    } else {
      endGesture();
    }
  }, [endGesture, intervalModeSelection]);

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMouseUp, handleTouchEnd]);

  // ============================================================================
  // AUDIO SYNTHESIS
  // ============================================================================

  const playDrum = useCallback((drumType: string, velocity = 1) => {
    const ctx = audioContextRef.current;
    // Bail if no context or if still suspended (initAudio should be called first on user gesture)
    if (!ctx || ctx.state !== 'running') {
      return;
    }

    const now = ctx.currentTime;
    const vol = 0.15 * velocity;

    switch (drumType) {
      case 'kick':
      case 'kick2': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(drumType === 'kick' ? 150 : 120, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.1);
        gain.gain.setValueAtTime(vol * 1.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      }
      case 'lowTom': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
        break;
      }
      case 'snare':
      case 'snare2': {
        const bufferSize = ctx.sampleRate * 0.15;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = drumType === 'snare' ? 1000 : 1500;

        const noiseGain = ctx.createGain();
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noiseGain.gain.setValueAtTime(vol * 0.8, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        noise.start(now);

        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.connect(oscGain);
        oscGain.connect(ctx.destination);
        osc.frequency.setValueAtTime(drumType === 'snare' ? 180 : 200, now);
        oscGain.gain.setValueAtTime(vol * 0.5, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }
      case 'rimshot': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(vol * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
        break;
      }
      case 'clap': {
        for (let b = 0; b < 3; b++) {
          const bufferSize = ctx.sampleRate * 0.02;
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
          }
          const noise = ctx.createBufferSource();
          noise.buffer = buffer;

          const filter = ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.value = 1200;
          filter.Q.value = 1;

          const gain = ctx.createGain();
          noise.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          gain.gain.setValueAtTime(vol * 0.6, now + b * 0.015);
          gain.gain.exponentialRampToValueAtTime(0.001, now + b * 0.015 + 0.1);
          noise.start(now + b * 0.015);
        }
        break;
      }
      case 'closedHat': {
        const bufferSize = ctx.sampleRate * 0.05;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 7000;

        const gain = ctx.createGain();
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(vol * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        noise.start(now);
        break;
      }
      case 'openHat': {
        const bufferSize = ctx.sampleRate * 0.3;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 6000;

        const gain = ctx.createGain();
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(vol * 0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        noise.start(now);
        break;
      }
      case 'crash': {
        const bufferSize = ctx.sampleRate * 0.6;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 4000;

        const gain = ctx.createGain();
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(vol * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        noise.start(now);
        break;
      }
      case 'ride': {
        const osc = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc2.type = 'sine';
        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 350;
        osc2.frequency.value = 620;
        gain.gain.setValueAtTime(vol * 0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc2.start(now);
        osc.stop(now + 0.4);
        osc2.stop(now + 0.4);
        break;
      }
      case 'cowbell': {
        const osc = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc2.type = 'square';
        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 560;
        osc2.frequency.value = 845;
        gain.gain.setValueAtTime(vol * 0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc2.start(now);
        osc.stop(now + 0.15);
        osc2.stop(now + 0.15);
        break;
      }
      default:
        break;
    }
  }, []);

  const playNote = useCallback((frequency: number, duration: number, trackType: TrackType, velocity = 1) => {
    const ctx = audioContextRef.current;
    // Bail if no context or if still suspended (initAudio should be called first on user gesture)
    if (!ctx || ctx.state !== 'running') {
      return;
    }

    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    const isSustained = duration > 0.2;
    const attackTime = isSustained ? 0.02 : 0.01;
    const releaseTime = Math.min(duration * 0.3, 0.15);
    const sustainLevel = 0.08 * velocity;

    switch (trackType) {
      case 'melody':
        osc.type = 'sine';
        filter.frequency.value = 2000;
        break;
      case 'chords':
        osc.type = 'triangle';
        filter.frequency.value = 1500;
        break;
      case 'bass':
        osc.type = 'sawtooth';
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        break;
      default:
        osc.type = 'triangle';
    }

    osc.frequency.value = frequency;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(sustainLevel, now + attackTime);
    gain.gain.setValueAtTime(sustainLevel, now + duration - releaseTime);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.start(now);
    osc.stop(now + duration + 0.01);
  }, []);

  const playStep = useCallback((step: number) => {
    const baseNotes: Record<string, number> = { melody: 60, chords: 48, bass: 36 };
    const trackHeights: Record<string, number> = { melody: 6, chords: 6, bass: 4, rhythm: 12 };
    const stepDuration = 60 / bpm / 4;

    TRACK_ORDER.forEach(track => {
      const isMutedTrack = muted[track] || (soloed !== null && soloed !== track);
      if (isMutedTrack) return;

      for (let note = 0; note < 12; note++) {
        const velocity = tracks[track][note][step];

        if (velocity > 0) {
          if (track === 'rhythm') {
            playDrum(DRUM_NAMES[note], velocity);
          } else if (velocity === 3) {
            // Sustain continuation - don't retrigger
          } else {
            let sustainSteps = 1;
            for (let s = 1; s < patternLength; s++) {
              const nextStep = (step + s) % patternLength;
              if (tracks[track][note][nextStep] === 3) {
                sustainSteps++;
              } else {
                break;
              }
            }

            const duration = Math.max(0.15, stepDuration * sustainSteps * 0.95);
            
            // Calculate pitch (version-dependent)
            let pitch: number;
            if (isV1Baseline) {
              // V1 Baseline: Simple chromatic mapping for all tracks
              pitch = baseNotes[track] + note;
            } else if (track === 'melody') {
              // V2+: Use interval mode for melody
              pitch = melodyInterval.getPitchForRow(note, trackHeights[track]);
            } else if (track === 'chords') {
              // V2+: Use interval mode for chords
              pitch = chordsInterval.getPitchForRow(note, trackHeights[track]);
            } else if (track === 'bass') {
              // V2+: Use interval mode for bass
              pitch = bassInterval.getPitchForRow(note, trackHeights[track]);
            } else {
              // Fallback (shouldn't reach here)
              pitch = baseNotes[track] + note;
            }
            
            playNote(midiToFreq(pitch), duration, track, velocity);
          }
        }
      }
    });

    setPulseStep(step);
    setTimeout(() => setPulseStep(-1), 100);
  }, [tracks, muted, soloed, playNote, playDrum, bpm, patternLength, melodyInterval, chordsInterval, bassInterval, isV1Baseline]);

  // ============================================================================
  // PLAYBACK LOOP
  // ============================================================================

  useEffect(() => {
    if (isPlaying) {
      // Audio context should already be initialized via initAudio on user gesture
      // Just start the interval
      intervalRef.current = setInterval(() => {
        setCurrentStep(prev => (prev + 1) % patternLength);
      }, 60000 / bpm / 4);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, bpm, patternLength]);

  useEffect(() => {
    if (isPlaying) playStep(currentStep);
  }, [currentStep, isPlaying, playStep]);

  // ============================================================================
  // REMOTE SESSION SYNC
  // ============================================================================

  useEffect(() => {
    if (!roomCode) return;

    let isSubscribed = true;

    const connectToSession = async () => {
      try {
        // Join session as web viewer
        await pixelboopSessionService.joinSession(roomCode, 'Web Viewer', 'web');
        
        if (!isSubscribed) return;

        console.log('[PixelBoop] Connected to session:', roomCode);
        onSessionReady?.();

        // Subscribe to pattern edits
        const unsubPattern = pixelboopSessionService.onPatternEdit((delta) => {
          if (viewerMode) {
            // Apply remote pattern edits in viewer mode
            setTracks(prev => {
              const newTracks = { ...prev };
              const trackKey = TRACK_ORDER[delta.track];
              if (trackKey && delta.note !== undefined) {
                const newTrack = prev[trackKey].map(r => [...r]);
                if (delta.note === null) {
                  // Clear step
                  newTrack.forEach(row => { row[delta.step] = 0; });
                } else {
                  // Set note
                  newTrack[delta.note][delta.step] = delta.velocity > 0 ? 1 : 0;
                }
                newTracks[trackKey] = newTrack;
              }
              return newTracks;
            });
          }
        });

        // Subscribe to playback state
        const unsubPlayback = pixelboopSessionService.onPlaybackState((state) => {
          setIsPlaying(state.isPlaying);
          setCurrentStep(state.currentStep);
        });

        // Subscribe to tempo changes
        const unsubTempo = pixelboopSessionService.onTempoChange((tempo) => {
          setBpm(tempo.bpm);
        });

        // Subscribe to track state changes
        const unsubTrack = pixelboopSessionService.onTrackState((state) => {
          const trackKey = TRACK_ORDER[state.track];
          if (trackKey) {
            if (state.solo) {
              setSoloed(trackKey);
            } else {
              setMuted(m => ({ ...m, [trackKey]: state.muted }));
            }
          }
        });

        // Cleanup on unmount
        return () => {
          isSubscribed = false;
          unsubPattern();
          unsubPlayback();
          unsubTempo();
          unsubTrack();
          pixelboopSessionService.leaveSession();
        };
      } catch (error) {
        console.error('[PixelBoop] Failed to connect to session:', error);
      }
    };

    connectToSession();
  }, [roomCode, viewerMode, onSessionReady]);

  // ============================================================================
  // RENDER
  // ============================================================================

  const grid = getPixelGrid();
  const gridWidth = COLS * (pixelSize + 1);
  const gridHeight = ROWS * (pixelSize + 1);

  // Shared grid content
  const gridContent = (
    <>
      {/* Info bar */}
      <div className={`flex items-center gap-3 mb-2 text-xs text-gray-400 flex-wrap justify-center ${isFullscreen ? 'mt-2' : ''}`}>
        {/* Version selector */}
        <div className="flex items-center gap-2 bg-gray-800/50 rounded px-2 py-1">
          <span className="text-gray-500">Version:</span>
          <select
            value={pixelboopVersion}
            onChange={(e) => setPixelboopVersion(e.target.value)}
            className="bg-gray-700 text-white text-xs rounded px-2 py-0.5 border border-gray-600 focus:border-blue-500 focus:outline-none"
            title={PIXELBOOP_VERSIONS[pixelboopVersion as keyof typeof PIXELBOOP_VERSIONS]?.description}
          >
            {Object.entries(PIXELBOOP_VERSIONS).map(([key, version]) => (
              <option key={key} value={key}>
                {version.name}
              </option>
            ))}
          </select>
        </div>
        
        <span className="text-gray-600">|</span>
        
        <span style={{ color: NOTE_COLORS[rootNote] }}>{NOTE_NAMES[rootNote]}</span>
        <span className="text-orange-400">{scale}</span>
        <span className="text-red-400">{bpm}bpm</span>
        <span className="text-purple-400">{patternLength}st</span>
        {isV2OrHigher && (
          <>
            <span className="text-blue-300">{melodyInterval.displayName}</span>
            <span className="text-cyan-300">{chordsInterval.displayName}</span>
            <span className="text-teal-300">{bassInterval.displayName}</span>
          </>
        )}
        {isShaking && <span className="text-yellow-400 animate-pulse">~SHAKE~</span>}

        {/* Fullscreen toggle button */}
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="ml-2 p-1.5 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-colors"
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4 text-gray-300" />
          ) : (
            <Maximize2 className="w-4 h-4 text-gray-300" />
          )}
        </button>
      </div>
      
      {/* Version info tooltip */}
      {!isFullscreen && (
        <div className="mb-2 text-center max-w-2xl mx-auto">
          <details className="bg-gray-800/30 rounded px-3 py-1 text-xs">
            <summary className="cursor-pointer text-gray-500 hover:text-gray-400">
              ℹ️ {PIXELBOOP_VERSIONS[pixelboopVersion as keyof typeof PIXELBOOP_VERSIONS]?.name} Features
            </summary>
            <div className="mt-2 text-left text-gray-400 space-y-1">
              <p className="text-gray-300 font-semibold">
                {PIXELBOOP_VERSIONS[pixelboopVersion as keyof typeof PIXELBOOP_VERSIONS]?.description}
              </p>
              <ul className="list-disc list-inside space-y-0.5 mt-2">
                {PIXELBOOP_VERSIONS[pixelboopVersion as keyof typeof PIXELBOOP_VERSIONS]?.features.map((feature, idx) => (
                  <li key={idx}>{feature}</li>
                ))}
              </ul>
            </div>
          </details>
        </div>
      )}

      {/* Main grid */}
      <div
        ref={gridRef}
        className="relative select-none touch-none"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, ${pixelSize}px)`,
          gap: '1px',
          backgroundColor: '#111',
          padding: '2px',
          borderRadius: '4px',
          width: gridWidth,
          height: gridHeight,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {grid.map((row, rowIdx) =>
          row.map((pixel, colIdx) => (
            <div
              key={`${rowIdx}-${colIdx}`}
              style={{
                width: pixelSize,
                height: pixelSize,
                backgroundColor: pixel.color,
                borderRadius: pixelSize > 10 ? '2px' : '1px',
                cursor: pixel.action ? 'pointer' : 'default',
                boxShadow: pixel.glow ? `0 0 ${pixelSize / 2}px ${pixel.color}` :
                  pixel.isTooltip ? `0 0 ${pixelSize / 3}px ${pixel.color}` : 'none',
                transition: 'background-color 0.05s',
              }}
              onMouseDown={() => handleMouseDown(rowIdx, colIdx)}
              onMouseEnter={() => handleMouseMove(rowIdx, colIdx)}
            />
          ))
        )}
      </div>

      {/* Legend - hidden in fullscreen on mobile, shown on desktop */}
      {(!isFullscreen || !isMobile) && (
        <div className="mt-3 text-center max-w-full px-2">
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-gray-500">
            <span><span className="text-green-400">●</span> Tap</span>
            <span><span className="text-yellow-400">●</span> Hold=Accent</span>
            <span><span className="text-cyan-400">→</span> Arp</span>
            <span><span className="text-pink-400">↓</span> Chord</span>
            <span><span className="text-purple-400">◐→</span> Hold+Drag=Sustain</span>
          </div>
          <div className="mt-1 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-gray-500">
            <span><span className="text-red-400">●●</span> Dbl=Erase</span>
            <span><span className="text-orange-400">↔↔</span> Shake=Clear</span>
            <span><span className="text-blue-400">←←</span> Undo</span>
            <span><span className="text-blue-400">→→</span> Redo</span>
          </div>
          <div className="mt-1 text-xs text-gray-600">
            Drums: kick · snare · clap · hat · crash · cowbell
          </div>
          {!isMobile && (
            <div className="mt-1 text-xs text-gray-600">
              Space=Play | ⌘Z=Undo | Del=Clear | ↑↓=BPM
            </div>
          )}
        </div>
      )}
    </>
  );

  // Fullscreen mode - bypass ViewTemplate
  if (isFullscreen) {
    return (
      <div
        className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50"
        style={{
          // Handle iOS safe areas (notch, home indicator)
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
        }}
      >
        {/* Exit button - top left corner */}
        <button
          onClick={() => setIsFullscreen(false)}
          className="absolute top-2 left-2 p-2 rounded-lg bg-gray-800/80 hover:bg-gray-700 transition-colors z-10"
          style={{
            marginTop: 'env(safe-area-inset-top, 0px)',
            marginLeft: 'env(safe-area-inset-left, 0px)',
          }}
        >
          <X className="w-5 h-5 text-gray-300" />
        </button>

        {/* Back to home button - top right corner */}
        <button
          onClick={onBack}
          className="absolute top-2 right-2 p-2 rounded-lg bg-gray-800/80 hover:bg-gray-700 transition-colors z-10 flex items-center gap-1"
          style={{
            marginTop: 'env(safe-area-inset-top, 0px)',
            marginRight: 'env(safe-area-inset-right, 0px)',
          }}
        >
          <ArrowLeft className="w-4 h-4 text-gray-300" />
          <span className="text-xs text-gray-300">Exit</span>
        </button>

        {gridContent}
      </div>
    );
  }

  // Normal mode - use ViewTemplate
  return (
    <ViewTemplate
      title="PixelBoop"
      subtitle="Gesture-based pixel sequencer"
      onBack={onBack}
      variant="full-width"
      maxWidth="7xl"
      badge="Experiment"
      badgeVariant="blue"
    >
      <div className="flex flex-col items-center justify-center">
        {gridContent}
      </div>
    </ViewTemplate>
  );
};

export default PixelBoopSequencer;
