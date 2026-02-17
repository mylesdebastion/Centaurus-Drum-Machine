import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Maximize2, Minimize2, X, ArrowLeft } from 'lucide-react';
import { ViewTemplate } from '../Layout/ViewTemplate';
import { pixelboopSessionService } from '@/services/pixelboopSession';
import type { PatternEditDelta } from '@/types/pixelboopSession';
import { useIntervalMode } from '@/hooks/useIntervalMode';
import { useIntervalModeSelection, type TrackType as IntervalTrackType } from '@/hooks/useIntervalModeSelection';
import { useSetToggle } from '@/hooks/useSetToggle';
import type { IntervalModeType } from '@/lib/intervalMode';
import { audioEngine } from '@/lib/audioEngine';
import { getPixelGrid_v6, type V6GridState } from './getPixelGrid_v6_direct_port';

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
  },
  'v5-full-ios-port': {
    name: 'v5 Full iOS Port',
    description: 'Complete feature parity with iOS PixelBoop app',
    features: [
      'All v4 features',
      'AudioKit-quality synths (6 melody presets, 4 bass presets)',
      'Column 3 hold gesture with climbing pixel animation',
      'Column 4 set toggling (12-slot pattern storage)',
      'Walking bass gestures (diagonal, vertical ba-dum)',
      'Preset selection with visual feedback',
      'Teaching mode (auto-tooltips after idle)',
      'Proper ADSR envelopes and filter sweeps',
      'Sound parity with iOS app'
    ]
  },
  'v6-direct-port': {
    name: 'v6 Direct iOS Port',
    description: 'Direct translation of iOS PixelGridUIView.swift rendering',
    features: [
      'DIRECT TRANSLATION from iOS Swift code',
      'Pixel-perfect iOS layout matching',
      'Row 0: Play(0-2), Undo(4), Redo(5), Scales(7-9), Root(11-22), Ghost(24), BPM(26-28), Len(30-32)',
      'Row 23: WLED(0-3), Link(5-7), Mode(9-10), Sync(11-13), Overview(14-35)',
      'iOS control bar layout (bottom row)',
      'iOS-accurate track rendering with sustain fade (ADSR)',
      'Section thumbnails (cols 36-43)',
      'Rainbow WLED animation',
      'BPM pulse animation',
      'Ghost notes at 13% alpha (iOS exact)',
      'Note colors: iOS chromatic wheel'
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
  
  // Set toggle tooltips
  'MELODY: ●': { text: 'MELODY: SET 1', row: 4 },
  'MELODY: ●●': { text: 'MELODY: SET 2', row: 4 },
  'CHORDS: ●': { text: 'CHORDS: SET 1', row: 10 },
  'CHORDS: ●●': { text: 'CHORDS: SET 2', row: 10 },
  'BASS: ●': { text: 'BASS: SET 1', row: 15 },
  'BASS: ●●': { text: 'BASS: SET 2', row: 15 },
  'BASS: ●●●': { text: 'BASS: SET 3', row: 15 },
  // Section tooltips
  'section_1': { text: 'SECTION 1', row: 10 },
  'section_2': { text: 'SECTION 2', row: 10 },
  'section_3': { text: 'SECTION 3', row: 10 },
  'section_4': { text: 'SECTION 4', row: 10 },
  'section_5': { text: 'SECTION 5', row: 10 },
  'section_6': { text: 'SECTION 6', row: 10 },
  'section_7': { text: 'SECTION 7', row: 10 },
  'section_8': { text: 'SECTION 8', row: 10 },
  'section_play': { text: 'SECTION PLAY', row: 22 },
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

// Note: midiToFreq is no longer needed - audioEngine accepts MIDI note numbers directly
// const midiToFreq = (midi: number): number => 440 * Math.pow(2, (midi - 69) / 12);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const PixelBoopSequencer: React.FC<PixelBoopSequencerProps> = ({ onBack, viewerMode = false, roomCode, onSessionReady }) => {
  // Version selector state (must be first to use in other hooks)
  const [pixelboopVersion, setPixelboopVersion] = useState<string>('v5-full-ios-port');
  
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
  const [activeSection, setActiveSection] = useState<number>(0); // 0-7 for 8 sections

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
  
  // Set toggle controller (for column 4 tap gesture) - only used in v3+
  const setToggle = useSetToggle();
  
  // Version check helpers
  const isV1Baseline = pixelboopVersion === 'v1-baseline';
  const isV2OrHigher = !isV1Baseline;
  const isV3OrHigher = ['v3-set-toggling', 'v4-sections-as-chords', 'v5-full-ios-port'].includes(pixelboopVersion);
  const isV6DirectPort = pixelboopVersion === 'v6-direct-port';
  
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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const touchStartRef = useRef<{ row: number; col: number; time: number } | null>(null);
  const shakeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swipeStartRef = useRef<SwipeStart | null>(null);

  // ============================================================================
  // AUDIO INITIALIZATION
  // ============================================================================

  const htmlAudioUnlockRef = useRef(false);

  const initAudio = useCallback(async () => {
    // Initialize the new audio engine
    try {
      await audioEngine.init();
      console.log('[PixelBoop] Audio engine initialized');
    } catch (e) {
      console.error('[PixelBoop] Failed to initialize audio engine:', e);
    }

    // HTML5 audio unlock (fixes iOS silent switch issue)
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
          
          // CRITICAL: `note` here is the pitch class (0-11) from the gesture interpretation
          // We need to find which row that pitch maps to, then convert row → slot
          // For now, treating `note` as if it were a row index (this works in chromatic mode)
          // TODO: In interval mode, we'd need to map pitch → row first
          // For slot-based storage, we're using note as a direct index which represents
          // the chromatic position, which maps 1:1 to slots in chromatic mode
          const slot = note; // In pure chromatic: note index = slot index
          
          newTrack[slot][step] = normalizedVelocity;
          
          // Broadcast pattern edit if in session
          if (roomCode && !viewerMode) {
            const trackIndex = TRACK_ORDER.indexOf(track);
            const delta: PatternEditDelta = {
              track: trackIndex,
              step,
              note: slot, // Use slot index for network sync
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
  }, [saveHistory, roomCode, viewerMode, setToggle]);

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

  // Get local row index within track (0 = top row, height-1 = bottom row)
  const getLocalRow = (row: number, track: TrackType): number => {
    const trackStarts: Record<TrackType, number> = { melody: 2, chords: 8, bass: 14, rhythm: 18 };
    const start = trackStarts[track];
    return row - start;
  };

  // DEPRECATED: Use getLocalRow + setToggle.rowToSlot instead
  const getNoteForRow = (row: number, track: TrackType): number => {
    const localRow = getLocalRow(row, track);
    // For backward compatibility with gesture system, convert localRow → slot
    return setToggle.rowToSlot(localRow, track);
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

  // Frame counter for v6 WLED animation
  const [frameCounter, setFrameCounter] = useState(0);
  const [bpmPulseFade, setBpmPulseFade] = useState(0);
  
  // Update frame counter for animations
  useEffect(() => {
    if (!isV6DirectPort) return;
    const interval = setInterval(() => {
      setFrameCounter(f => (f + 1) % 600);
      // Simple BPM pulse simulation
      if (isPlaying) {
        setBpmPulseFade(f => f > 0.01 ? f * 0.92 : 0);
      }
    }, 16); // ~60fps
    return () => clearInterval(interval);
  }, [isV6DirectPort, isPlaying]);

  const getPixelGrid = useCallback((): Pixel[][] => {
    // V6 Direct Port: Use iOS-translated rendering function
    if (isV6DirectPort) {
      const v6State: V6GridState = {
        tracks,
        patternLength,
        currentStep,
        pulseStep,
        isPlaying,
        scale,
        rootNote,
        bpm,
        muted,
        soloed,
        showGhosts,
        activeSection,
        historyIndex,
        historyLength: history.length,
        isShaking,
        shakeDirectionChanges,
        gesturePreview,
        tooltipPixels,
        frameCounter,
        bpmPulseFade,
      };
      return getPixelGrid_v6(v6State);
    }
    
    const grid: Pixel[][] = Array(ROWS).fill(null).map(() =>
      Array(COLS).fill(null).map(() => ({ color: '#0a0a0a', action: null, baseColor: '#0a0a0a' }))
    );

    // ========================================================================
    // ROW 0: TOP CONTROL BAR (iOS parity layout)
    // ========================================================================
    // Cols 0-3: USB/BT MIDI indicators (placeholder for now)
    for (let c = 0; c <= 3; c++) {
      grid[0][c] = { color: '#222', action: null, baseColor: '#333' };
    }
    
    // Cols 4-6: Clear button
    for (let c = 4; c <= 6; c++) {
      grid[0][c] = { color: '#662222', action: 'clearAll', baseColor: '#ff4444' };
    }
    
    // Col 7: Scale Major
    grid[0][7] = { color: scale === 'major' ? '#ffaa00' : '#442200', action: 'scaleMajor', baseColor: '#ffaa00' };
    // Col 8: Scale Minor
    grid[0][8] = { color: scale === 'minor' ? '#00aaff' : '#002244', action: 'scaleMinor', baseColor: '#00aaff' };
    // Col 9: Scale Pentatonic
    grid[0][9] = { color: scale === 'penta' ? '#aa00ff' : '#220044', action: 'scalePenta', baseColor: '#aa00ff' };
    
    // Col 10: gap
    grid[0][10] = { color: '#0a0a0a', action: null, baseColor: '#0a0a0a' };
    
    // Cols 11-22: Root note selector (C through B)
    for (let n = 0; n < 12; n++) {
      const color = n === rootNote ? NOTE_COLORS[n] : `${NOTE_COLORS[n]}44`;
      grid[0][11 + n] = { color, action: `root_${n}`, baseColor: NOTE_COLORS[n] };
    }
    
    // Cols 23-25: gap/undo/redo
    grid[0][23] = { color: '#0a0a0a', action: null, baseColor: '#0a0a0a' };
    grid[0][24] = { color: historyIndex > 0 ? '#888' : '#333', action: 'undo', baseColor: '#888' };
    grid[0][25] = { color: historyIndex < history.length - 1 ? '#888' : '#333', action: 'redo', baseColor: '#888' };
    
    // Col 26: BPM down
    grid[0][26] = { color: '#444', action: 'bpmDown', baseColor: '#666' };
    // Col 27: BPM display (tap for tempo)
    grid[0][27] = { color: `hsl(${bpm}, 70%, 50%)`, action: 'tapTempo', baseColor: `hsl(${bpm}, 70%, 50%)` };
    // Col 28: BPM up
    grid[0][28] = { color: '#444', action: 'bpmUp', baseColor: '#666' };
    
    // Col 29: gap
    grid[0][29] = { color: '#0a0a0a', action: null, baseColor: '#0a0a0a' };
    
    // Col 30: Pattern length down
    grid[0][30] = { color: '#444', action: 'lenDown', baseColor: '#666' };
    // Col 31: Pattern length display
    grid[0][31] = { color: `hsl(${patternLength * 8}, 70%, 50%)`, action: null, baseColor: '#f5f' };
    // Col 32: Pattern length up
    grid[0][32] = { color: '#444', action: 'lenUp', baseColor: '#666' };
    
    // Cols 33-35: gap/ghosts/shake indicator
    grid[0][33] = { color: '#0a0a0a', action: null, baseColor: '#0a0a0a' };
    grid[0][34] = { color: showGhosts ? '#666' : '#222', action: 'toggleGhosts', baseColor: '#666' };
    const shakeColor = isShaking ? `hsl(${360 - shakeDirectionChanges * 60}, 100%, 50%)` : '#222';
    grid[0][35] = { color: shakeColor, action: null, baseColor: shakeColor };
    
    // Cols 36-37: USB MIDI indicator (section area)
    grid[0][36] = { color: '#224422', action: null, baseColor: '#44ff44' };
    grid[0][37] = { color: '#224422', action: null, baseColor: '#44ff44' };
    
    // Cols 38-43: unused in row 0 (dark)
    for (let c = 38; c <= 43; c++) {
      grid[0][c] = { color: '#0a0a0a', action: null, baseColor: '#0a0a0a' };
    }

    // ========================================================================
    // ROW 1: STEP MARKERS (pattern columns 4-35)
    // ========================================================================
    // Cols 0-3: Track control column headers (dark)
    for (let c = 0; c < 4; c++) {
      grid[1][c] = { color: '#222', action: null, baseColor: '#222' };
    }
    
    // Cols 4-35: Step markers (32 steps, no gaps for iOS parity)
    for (let s = 0; s < patternLength; s++) {
      const col = 4 + s;  // Pattern starts at column 4
      if (col <= 35) {
        const isBeat = s % 4 === 0;
        const isBar = s % 8 === 0;
        const isPulse = s === pulseStep;
        const color = isPulse ? '#fff' : (s === currentStep && isPlaying ? '#aaa' : (isBar ? '#555' : isBeat ? '#333' : '#1a1a1a'));
        grid[1][col] = { color, action: null, baseColor: '#555' };
      }
    }
    
    // Cols 36-43: Section column headers
    for (let sec = 0; sec < 8; sec++) {
      const col = 36 + sec;
      grid[1][col] = { color: '#333', action: `section_header_${sec}`, baseColor: '#555' };
    }

    // ========================================================================
    // TRACK GRIDS (rows 2-21)
    // ========================================================================
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
        
        // Column 0: Mute button
        grid[r][0] = { color: `${baseColor}${alpha}`, action: `mute_${track}`, baseColor };
        
        // Column 1: Solo button
        grid[r][1] = { color: isSoloed ? '#fff' : '#333', action: `solo_${track}`, baseColor: '#fff' };
        
        // Column 2: TX indicator (MIDI transmit activity)
        grid[r][2] = { color: '#111', action: null, baseColor: '#111' };
        
        // Column 3: Version-dependent interval mode indicator
        const localRow = r - start;
        if (isV2OrHigher && track !== 'rhythm') {
          try {
            // V2+: Interval mode indicator - show note colors for current interval mode
            // Get current interval mode for this track
            let currentIntervalMode = melodyInterval;
            if (track === 'chords') currentIntervalMode = chordsInterval;
            else if (track === 'bass') currentIntervalMode = bassInterval;
            
            // Check if interval mode selection is active for this track
            const isSelecting = intervalModeSelection.activeTrack === track;
            const highlightedRow = intervalModeSelection.highlightedMode !== null ? intervalModeSelection.highlightedMode % height : -1;
            
            if (isSelecting && localRow === highlightedRow) {
              // Show climbing white pixel during selection with pulsing brightness
              const brightness = Math.round(intervalModeSelection.highlightBrightness * 255);
              grid[r][3] = {
                color: `rgb(${brightness}, ${brightness}, ${brightness})`,
                action: `interval_mode_${track}`,
                baseColor: '#ffffff',
                glow: true  // Add glow effect to climbing pixel
              };
            } else if (currentIntervalMode && currentIntervalMode.getPitchClassForRow) {
              // Calculate pitch class for this row using interval mode
              const pitchClass = currentIntervalMode.getPitchClassForRow(localRow, height);
              const noteColor = NOTE_COLORS[pitchClass];
              
              // Show note color (50% alpha for normal, 35% alpha during selection)
              const alpha = isSelecting ? '59' : '80';
              grid[r][3] = { 
                color: `${noteColor}${alpha}`,
                action: `interval_mode_${track}`, 
                baseColor: noteColor 
              };
            } else {
              // Fallback if interval mode not available
              grid[r][3] = { color: '#0a0a0a', action: null, baseColor: '#0a0a0a' };
            }
          } catch (err) {
            console.error('[PixelBoop] Error rendering column 3:', err);
            grid[r][3] = { color: '#0a0a0a', action: null, baseColor: '#0a0a0a' };
          }
        } else {
          // V1 or rhythm track: Simple dark background (no interval indicator)
          grid[r][3] = { color: '#0a0a0a', action: null, baseColor: '#0a0a0a' };
        }
        
        // NOTE: In iOS layout, column 4 is first pattern step, NOT set toggle
        // Set toggle is accessed via column 3 hold gesture in v3+
      }

      // Render pattern grid for this track
      for (let localRow = 0; localRow < height; localRow++) {
        const row = start + localRow;
        const noteBase = Math.round((height - 1 - localRow) / (height - 1) * 11);

        // Calculate what pitch class this row represents (for coloring)
        let rowPitchClass = noteBase % 12;  // Default v1 behavior
        if (isV2OrHigher && track !== 'rhythm') {
          // V2+: Use interval mode to determine pitch class for this row
          try {
            let currentIntervalMode = melodyInterval;
            if (track === 'chords') currentIntervalMode = chordsInterval;
            else if (track === 'bass') currentIntervalMode = bassInterval;
            
            if (currentIntervalMode && currentIntervalMode.getPitchClassForRow) {
              rowPitchClass = currentIntervalMode.getPitchClassForRow(localRow, height);
            }
          } catch (err) {
            console.error('[PixelBoop] Error getting pitch class for row:', err);
            // Fall back to chromatic
          }
        }

        // Pattern columns 4-35 (32 steps, no gaps for iOS parity)
        for (let step = 0; step < patternLength; step++) {
          const col = 4 + step;  // Pattern starts at column 4
          if (col > 35) continue;

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
        
        // Section columns 36-43: Section thumbnails for each track row
        for (let sec = 0; sec < 8; sec++) {
          const col = 36 + sec;
          // Active section is brighter, inactive sections are dim
          const isActive = sec === activeSection;
          const sectionAlpha = isActive ? '88' : '33';
          const sectionColor = `${TRACK_COLORS[track]}${sectionAlpha}`;
          grid[row][col] = {
            color: sectionColor,
            action: `section_${sec}_${track}_${localRow}`,
            baseColor: TRACK_COLORS[track],
            glow: isActive
          };
        }
      }
    });

    // ========================================================================
    // ROW 22: KEY AUTOMATION INDICATORS (iOS parity)
    // ========================================================================
    // Cols 0-3: Control area (dark)
    for (let c = 0; c < 4; c++) {
      grid[22][c] = { color: '#222', action: null, baseColor: '#222' };
    }
    
    // Cols 4-35: Key automation markers (show root note colors where automation exists)
    // For now, show overview of pattern activity with potential key changes
    for (let step = 0; step < patternLength; step++) {
      const col = 4 + step;
      if (col > 35) continue;

      // Find if any track has notes at this step
      let activeTrack: TrackType | null = null;
      for (const track of TRACK_ORDER) {
        const isMutedTrack = muted[track] || (soloed !== null && soloed !== track);
        if (isMutedTrack) continue;
        for (let n = 0; n < 12; n++) {
          if (tracks[track][n][step] > 0) {
            activeTrack = track;
            break;
          }
        }
        if (activeTrack) break;
      }

      const isPlayhead = step === currentStep && isPlaying;
      // Show key automation area - colored by root note, with activity indicator
      const keyColor = activeTrack ? NOTE_COLORS[rootNote] : '#0a0a0a';
      const keyAlpha = activeTrack ? '66' : (isPlayhead ? '22' : '0a');
      grid[22][col] = { 
        color: activeTrack ? `${keyColor}${keyAlpha}` : (isPlayhead ? '#1a1a1a' : '#0a0a0a'), 
        action: `key_auto_${step}`, 
        baseColor: NOTE_COLORS[rootNote] 
      };
    }
    
    // Cols 36-43: Section indicators for row 22
    for (let sec = 0; sec < 8; sec++) {
      const col = 36 + sec;
      grid[22][col] = { 
        color: '#333', 
        action: `section_indicator_${sec}`, 
        baseColor: '#555' 
      };
    }

    // ========================================================================
    // ROW 23: BOTTOM CONTROL BAR (iOS parity layout)
    // ========================================================================
    // Cols 0-3: WLED button (gradient, 4 cols)
    const wledGradient = ['#ff0000', '#ff8800', '#ffff00', '#00ff00'];
    for (let c = 0; c <= 3; c++) {
      grid[23][c] = { color: wledGradient[c], action: 'wled', baseColor: wledGradient[c] };
    }
    
    // Col 4: Gap
    grid[23][4] = { color: '#0a0a0a', action: null, baseColor: '#0a0a0a' };
    
    // Cols 5-7: Link button (Ableton Link, 3 cols) - cyan color
    for (let c = 5; c <= 7; c++) {
      grid[23][c] = { color: '#00aaaa', action: 'link', baseColor: '#00ffff' };
    }
    
    // Col 8: Gap
    grid[23][8] = { color: '#0a0a0a', action: null, baseColor: '#0a0a0a' };
    
    // Cols 9-10: Mode button (2 cols)
    grid[23][9] = { color: '#666', action: 'mode', baseColor: '#888' };
    grid[23][10] = { color: '#666', action: 'mode', baseColor: '#888' };
    
    // Cols 11-14: Play/Stop button (4 cols, matches iOS)
    const playColor = isPlaying ? '#ff4444' : '#44ff44';
    for (let c = 11; c <= 14; c++) {
      grid[23][c] = { color: playColor, action: 'togglePlay', baseColor: playColor };
    }
    
    // Cols 15-35: Pattern overview (note colors per step)
    for (let step = 0; step < patternLength; step++) {
      const col = 15 + step;
      if (col > 35) continue;

      // Find active note at this step for overview
      let activeNote = -1;
      for (const track of TRACK_ORDER) {
        const isMutedTrack = muted[track] || (soloed !== null && soloed !== track);
        if (isMutedTrack) continue;
        for (let n = 0; n < 12; n++) {
          if (tracks[track][n][step] > 0) {
            activeNote = n;
            break;
          }
        }
        if (activeNote >= 0) break;
      }

      const isPlayhead = step === currentStep && isPlaying;
      const overviewColor = activeNote >= 0 ? NOTE_COLORS[activeNote % 12] : (isPlayhead ? '#222' : '#0a0a0a');
      grid[23][col] = { color: overviewColor, action: null, baseColor: overviewColor };
    }
    
    // Cols 36-37: Section play button
    grid[23][36] = { color: '#44aa44', action: 'section_play', baseColor: '#66ff66' };
    grid[23][37] = { color: '#44aa44', action: 'section_play', baseColor: '#66ff66' };
    
    // Cols 38-43: Clear all sections button
    for (let c = 38; c <= 43; c++) {
      grid[23][c] = { color: '#662222', action: 'clearSections', baseColor: '#ff4444' };
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
  }, [tracks, currentStep, isPlaying, scale, rootNote, isInScale, gesturePreview, muted, soloed, showGhosts, pulseStep, bpm, patternLength, history, historyIndex, tooltipPixels, isShaking, shakeDirectionChanges, melodyInterval, chordsInterval, bassInterval, intervalModeSelection, isV1Baseline, isV2OrHigher, isV6DirectPort, activeSection, frameCounter, bpmPulseFade]);

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
    } else if (action.startsWith('set_toggle_')) {
      const track = action.split('_')[2] as TrackType;
      setToggle.toggleSet(track);
      // Show tooltip with current set
      const setNum = setToggle.currentSets[track];
      showTooltip(`${track}_set_${setNum}`);
    } else if (action.startsWith('section_') && !action.includes('header') && !action.includes('indicator') && !action.includes('play') && !action.includes('clear')) {
      // Section tap - switch active section
      const parts = action.split('_');
      const sectionIndex = parseInt(parts[1]);
      if (!isNaN(sectionIndex) && sectionIndex >= 0 && sectionIndex < 8) {
        setActiveSection(sectionIndex);
        showTooltip(`section_${sectionIndex + 1}`);
      }
    } else if (action === 'section_play') {
      // Toggle section play mode (future feature)
      showTooltip('section_play');
    } else if (action.startsWith('section_header_')) {
      // Section header tap - also switch section
      const sectionIndex = parseInt(action.split('_')[2]);
      if (!isNaN(sectionIndex) && sectionIndex >= 0 && sectionIndex < 8) {
        setActiveSection(sectionIndex);
        showTooltip(`section_${sectionIndex + 1}`);
      }
    }
  }, [undo, redo, clearAll, showTooltip, togglePlay, initAudio, setToggle]);

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

      // iOS parity: Pattern columns are 4-35 (no gaps)
      const step = col - 4;
      if (step < 0 || step >= 32) return;

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
      // iOS parity: Pattern columns are 4-35 (no gaps)
      const step = col - 4;

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

    // iOS parity: Pattern columns are 4-35 (no gaps)
    const step = col - 4;

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
      // iOS parity: Pattern columns are 4-35 (no gaps)
      const endCol = gesture ? (4 + gesture.currentStep) : startCol;

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
    
    // NOTE: In iOS parity layout, column 4 is the first pattern step (not set toggle)
    // Set toggling is accessed via column 3 long-press or a future gesture

    const grid = getPixelGrid();
    const action = grid[pixel.row][pixel.col].action;

    if (action && !action.startsWith('grid_')) {
      handleAction(action, pixel.row, pixel.col);
    } else {
      startGesture(pixel.row, pixel.col);
    }
  }, [getPixelFromEvent, getPixelGrid, handleAction, startGesture, resetShake, initAudio, isV2OrHigher, isV3OrHigher, melodyInterval, chordsInterval, bassInterval, intervalModeSelection, setToggle, showTooltip]);

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
    
    // NOTE: In iOS parity layout, column 4 is the first pattern step (not set toggle)
    // Set toggling is accessed via column 3 long-press or a future gesture
    
    const grid = getPixelGrid();
    const action = grid[row][col].action;

    if (action && !action.startsWith('grid_')) {
      handleAction(action, row, col);
    } else {
      startGesture(row, col);
    }
  }, [getPixelGrid, handleAction, startGesture, resetShake, initAudio, isV2OrHigher, isV3OrHigher, melodyInterval, chordsInterval, bassInterval, intervalModeSelection]);

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
    // Map drum name to drum type index
    const drumIndex = Object.values(DRUM_NAMES).indexOf(drumType);
    if (drumIndex === -1) {
      console.warn('[PixelBoop] Unknown drum type:', drumType);
      return;
    }
    
    // Normalize velocity to 0-127 range (assuming input is 0-1)
    const normalizedVelocity = Math.round(velocity * 127);
    audioEngine.triggerDrum(drumIndex, normalizedVelocity);
  }, []);

  const playNote = useCallback((pitch: number, _duration: number, trackType: TrackType, velocity = 1) => {
    // Map track type to track index
    let trackIndex: number;
    switch (trackType) {
      case 'melody':
        trackIndex = 0;
        break;
      case 'chords':
        trackIndex = 1;
        break;
      case 'bass':
        trackIndex = 2;
        break;
      default:
        trackIndex = 0;
    }
    
    // Normalize velocity to 0-127 range (assuming input is 0-1)
    const normalizedVelocity = Math.round(velocity * 127);
    audioEngine.triggerNote(pitch, normalizedVelocity, trackIndex);
    
    // TODO: Implement note release after _duration
    // The audioEngine currently doesn't support timed releases, so notes will use the synth's natural envelope
  }, []);

  const playStep = useCallback((step: number) => {
    const baseNotes: Record<string, number> = { melody: 60, chords: 48, bass: 36, rhythm: 36 };
    const trackHeights: Record<string, number> = { melody: 6, chords: 6, bass: 4, rhythm: 12 };
    const stepDuration = 60 / bpm / 4;
    
    // Ensure interval modes are available in v2+
    if (!isV1Baseline && (!melodyInterval || !chordsInterval || !bassInterval)) {
      console.error('[PixelBoop] Interval modes not initialized');
      return;
    }

    TRACK_ORDER.forEach(track => {
      const isMutedTrack = muted[track] || (soloed !== null && soloed !== track);
      if (isMutedTrack) return;

      // SLOT-BASED PLAYBACK: Iterate through ALL 12 slots (not just visible rows)
      // This ensures notes in hidden sets still play
      const numSlots = track === 'rhythm' ? 4 : 12;
      
      for (let slot = 0; slot < numSlots; slot++) {
        const velocity = tracks[track][slot][step];

        if (velocity > 0) {
          if (track === 'rhythm') {
            playDrum(DRUM_NAMES[slot], velocity);
          } else if (velocity === 3) {
            // Sustain continuation - don't retrigger
          } else {
            let sustainSteps = 1;
            for (let s = 1; s < patternLength; s++) {
              const nextStep = (step + s) % patternLength;
              if (tracks[track][slot][nextStep] === 3) {
                sustainSteps++;
              } else {
                break;
              }
            }

            const duration = Math.max(0.15, stepDuration * sustainSteps * 0.95);
            
            // Calculate pitch from SLOT index (version-dependent) with error handling
            let pitch: number;
            try {
              if (isV1Baseline) {
                // V1 Baseline: Simple chromatic mapping (slot = chromatic semitone)
                pitch = baseNotes[track] + slot;
              } else if (track === 'melody') {
                // V2+: Use interval mode for melody
                // Find which row this slot maps to in the CURRENT set
                const localRow = setToggle.slotToRow(slot, track);
                if (localRow !== null) {
                  // Slot is visible - calculate pitch from row
                  pitch = melodyInterval.getPitchForRow(localRow, trackHeights[track]);
                } else {
                  // Slot is hidden in current set - calculate pitch assuming it's in the other set
                  // For hidden slots, we need to figure out which row they would be if that set were active
                  // For simplicity, use chromatic fallback for hidden slots
                  pitch = baseNotes[track] + slot;
                }
              } else if (track === 'chords') {
                // V2+: Use interval mode for chords
                const localRow = setToggle.slotToRow(slot, track);
                if (localRow !== null) {
                  pitch = chordsInterval.getPitchForRow(localRow, trackHeights[track]);
                } else {
                  pitch = baseNotes[track] + slot;
                }
              } else if (track === 'bass') {
                // V2+: Use interval mode for bass
                const localRow = setToggle.slotToRow(slot, track);
                if (localRow !== null) {
                  pitch = bassInterval.getPitchForRow(localRow, trackHeights[track]);
                } else {
                  pitch = baseNotes[track] + slot;
                }
              } else {
                // Fallback (shouldn't reach here)
                pitch = baseNotes[track] + slot;
              }
              
              // Ensure pitch is valid
              if (isNaN(pitch) || pitch < 0 || pitch > 127) {
                console.warn('[PixelBoop] Invalid pitch calculated:', pitch, 'for track', track, 'slot', slot);
                pitch = baseNotes[track] + slot;  // Fallback to chromatic
              }
              
              playNote(pitch, duration, track, velocity);
            } catch (err) {
              console.error('[PixelBoop] Error calculating pitch:', err, 'track:', track, 'slot:', slot);
              // Fallback to chromatic if interval mode fails
              pitch = baseNotes[track] + slot;
              playNote(pitch, duration, track, velocity);
            }
          }
        }
      }
    });

    setPulseStep(step);
    setTimeout(() => setPulseStep(-1), 100);
  }, [tracks, muted, soloed, playNote, playDrum, bpm, patternLength, melodyInterval, chordsInterval, bassInterval, isV1Baseline, setToggle]);

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
            {Object.entries(PIXELBOOP_VERSIONS).reverse().map(([key, version]) => (
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
