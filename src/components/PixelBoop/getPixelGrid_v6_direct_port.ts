/**
 * v6-direct-port: Direct translation of iOS PixelGridUIView.swift rendering logic
 * 
 * TRANSLATED FROM:
 *   ~/Documents/GitHub/pixelboop-harmonic-grid/pixelboop/Views/PixelGridUIView.swift
 *   Lines: ~676-1200 (buildGrid, render* functions)
 * 
 * iOS RENDER FUNCTIONS TRANSLATED:
 *   1. renderRow0Controls (~150 lines → ~120 lines TS)
 *   2. renderRow1StepMarkers (~40 lines → ~30 lines TS)
 *   3. renderTracks (~200 lines → ~180 lines TS)
 *   4. renderSongSections (~20 lines → ~20 lines TS)
 *   5. renderOverview (~60 lines → ~50 lines TS)
 *   6. renderControlBar (~40 lines → ~35 lines TS)
 *   7. renderWLEDButton (~25 lines → ~20 lines TS)
 *   8. renderLinkButton (~20 lines → ~15 lines TS)
 *   9. renderModeButton (~20 lines → ~15 lines TS)
 *   10. renderSyncButton (~25 lines → ~20 lines TS)
 *   11. renderSectionPlayButton (~15 lines → ~12 lines TS)
 *   12. renderClearAllSectionsButton (~10 lines → ~8 lines TS)
 *   13. renderSectionKeyIndicator (~50 lines → ~45 lines TS)
 *   14. applyTooltips (~15 lines → ~12 lines TS)
 *   15. applyGesturePreview (~100 lines → ~80 lines TS)
 * 
 * TOTAL: ~790 iOS lines → ~660 TypeScript lines
 */

// ============================================================================
// GRID CONSTANTS (from GridConstants.swift)
// ============================================================================

export const GridConstants = {
  columns: 44,
  rows: 24,
  
  // Track row ranges
  Melody: { startRow: 2, endRow: 7, height: 6 },
  Chords: { startRow: 8, endRow: 13, height: 6 },
  Bass: { startRow: 14, endRow: 17, height: 4 },
  Rhythm: { startRow: 18, endRow: 21, height: 4 },
  
  // Overview rows
  overviewRow1: 22,
  overviewRow2: 23,
  controlBarRow: 23,
  
  // Control bar positions (iOS layout)
  ControlBar: {
    wledStartCol: 0,
    wledEndCol: 3,    // 4 cols (0-3) for gradient
    linkStartCol: 5,  
    linkEndCol: 7,    // 3 cols (5-7)
    modeStartCol: 9,
    modeEndCol: 10,   // 2 cols (9-10)
    syncStartCol: 11,
    syncEndCol: 13,   // 3 cols (11-13) - implied from iOS code
  },
  
  // Pattern columns
  stepStartCol: 4,
  stepEndCol: 35,
  patternLength: 32,
  
  // Section columns
  sectionStartCol: 36,
  sectionEndCol: 43,
  sectionCount: 8,
  
  // Helper: column for step
  columnForStep: (step: number): number => 4 + step,
  
  // Helper: track for row
  trackForRow: (row: number): TrackType | null => {
    if (row >= 2 && row <= 7) return 'melody';
    if (row >= 8 && row <= 13) return 'chords';
    if (row >= 14 && row <= 17) return 'bass';
    if (row >= 18 && row <= 21) return 'rhythm';
    return null;
  },
  
  // Helper: height for track
  heightForTrack: (track: TrackType): number => {
    switch (track) {
      case 'melody': return 6;
      case 'chords': return 6;
      case 'bass': return 4;
      case 'rhythm': return 4;
    }
  },
  
  // Helper: start row for track
  startRowForTrack: (track: TrackType): number => {
    switch (track) {
      case 'melody': return 2;
      case 'chords': return 8;
      case 'bass': return 14;
      case 'rhythm': return 18;
    }
  },
};

// ============================================================================
// COLORS (from AppColors struct in iOS)
// ============================================================================

// Note colors - chromatic wheel (from prototype lines 6-10)
export const NOTE_COLORS: string[] = [
  '#ff0000',    // 0: C  - Red
  '#ff4500',    // 1: C# - Orange
  '#ff8c00',    // 2: D  - Dark Orange
  '#ffc800',    // 3: D# - Yellow-Orange
  '#ffff00',    // 4: E  - Yellow
  '#99cc33',    // 5: F  - Yellow-Green
  '#00ff00',    // 6: F# - Green
  '#00ffaa',    // 7: G  - Cyan-Green
  '#00ffff',    // 8: G# - Cyan
  '#00aaff',    // 9: A  - Sky Blue
  '#0055ff',    // 10: A# - Blue
  '#8a2be2',    // 11: B  - Purple
];

// Track colors (from prototype lines 14-16)
export const TRACK_COLORS: Record<TrackType, string> = {
  melody: '#f7dc6f',  // warm yellow
  chords: '#4ecdc4',  // teal
  bass: '#45b7d1',    // sky blue
  rhythm: '#ff6b6b',  // coral red
};

// Control colors (translated from iOS UIColor definitions)
const COLOR_PLAY = '#44ff44';        // green
const COLOR_STOP = '#ff4444';        // red
const COLOR_SCALE_MAJOR = '#ffaa00'; // orange
const COLOR_SCALE_MINOR = '#00aaff'; // blue
const COLOR_SCALE_PENTA = '#aa00ff'; // purple
const COLOR_ACTIVE = '#888888';      // gray 0.53
const COLOR_INACTIVE = '#333333';    // gray 0.2
const COLOR_GHOST_ENABLED = '#666666';  // gray 0.4
const COLOR_GHOST_DISABLED = '#212121'; // gray 0.13
const COLOR_CONTROL_BUTTON = '#444444'; // gray 0.27
const COLOR_CLEAR = '#662222';       // dark red

// ============================================================================
// TYPES
// ============================================================================

export type TrackType = 'melody' | 'chords' | 'bass' | 'rhythm';
export type ScaleType = 'major' | 'minor' | 'penta';

export interface Pixel {
  color: string;
  action: string | null;
  baseColor: string;
  glow?: boolean;
  isTooltip?: boolean;
}

export interface V6GridState {
  // Pattern state
  tracks: Record<TrackType, number[][]>;  // [note][step] = velocity
  patternLength: number;
  currentStep: number;
  pulseStep: number;
  isPlaying: boolean;
  
  // Musical settings
  scale: ScaleType;
  rootNote: number;
  bpm: number;
  
  // Track state
  muted: Record<TrackType, boolean>;
  soloed: TrackType | null;
  
  // Visual settings
  showGhosts: boolean;
  activeSection: number;
  
  // Undo/redo
  historyIndex: number;
  historyLength: number;
  
  // Gesture state
  isShaking: boolean;
  shakeDirectionChanges: number;
  gesturePreview: { note: number; step: number; velocity: number }[];
  
  // Tooltips
  tooltipPixels: { row: number; col: number; intensity: number }[];
  
  // Animation frame counter (for WLED rainbow)
  frameCounter: number;
  
  // BPM pulse
  bpmPulseFade: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/** Convert HSL to RGB hex string (matches iOS hslColor function) */
function hslColor(hue: number, saturation: number, lightness: number): string {
  const h = hue / 360;
  const s = saturation;
  const l = lightness;
  
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Dim a color (matches iOS dimColor function - multiply brightness by ~0.3) */
function dimColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  
  const factor = 0.3;
  const dr = Math.round(r * factor);
  const dg = Math.round(g * factor);
  const db = Math.round(b * factor);
  
  return `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`;
}

/** Apply alpha to hex color, return rgba string */
function withAlpha(hexColor: string, alpha: number): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Blend color with white (matches iOS blendedWithWhite) */
function blendWithWhite(hexColor: string, amount: number): string {
  const hex = hexColor.replace('#', '');
  let r = parseInt(hex.slice(0, 2), 16);
  let g = parseInt(hex.slice(2, 4), 16);
  let b = parseInt(hex.slice(4, 6), 16);
  
  r = Math.round(r + (255 - r) * amount);
  g = Math.round(g + (255 - g) * amount);
  b = Math.round(b + (255 - b) * amount);
  
  return `rgb(${r}, ${g}, ${b})`;
}

/** Get color for pitch class (matches iOS AppColors.colorForPitch) */
function colorForPitch(pitch: number): string {
  const index = ((pitch % 12) + 12) % 12;
  return NOTE_COLORS[index];
}

/** Get scale notes array */
function getScaleNotes(scale: ScaleType, rootNote: number): number[] {
  const intervals: Record<ScaleType, number[]> = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    penta: [0, 2, 4, 7, 9],
  };
  return intervals[scale].map(n => (n + rootNote) % 12);
}

/** Check if note is in scale */
function isInScale(note: number, scaleNotes: number[]): boolean {
  return scaleNotes.includes(note % 12);
}

// ============================================================================
// GRID BUILDING - DIRECT iOS TRANSLATION
// ============================================================================

/**
 * Build the pixel grid - direct translation of iOS buildGrid() function
 * 
 * iOS source: PixelGridUIView.swift lines 649-668
 */
export function getPixelGrid_v6(state: V6GridState): Pixel[][] {
  const COLS = GridConstants.columns;
  const ROWS = GridConstants.rows;
  
  // Initialize grid with dark background
  const grid: Pixel[][] = Array(ROWS).fill(null).map(() =>
    Array(COLS).fill(null).map(() => ({ 
      color: '#0a0a0a', 
      action: null, 
      baseColor: '#0a0a0a' 
    }))
  );
  
  // iOS row mapping: swap row 0 ↔ row 23 for cols 0-35 (visual swap)
  // We'll handle this at the end when returning the grid
  
  // ========================================================================
  // RENDER ROW 0: CONTROLS
  // iOS: renderRow0Controls() - lines 676-713 in PixelGridUIView.swift
  // ========================================================================
  renderRow0Controls(grid, state);
  
  // ========================================================================
  // RENDER ROW 1: STEP MARKERS
  // iOS: renderRow1StepMarkers() - lines 1212-1247
  // ========================================================================
  renderRow1StepMarkers(grid, state);
  
  // ========================================================================
  // RENDER ROWS 2-21: TRACK GRIDS
  // iOS: renderTracks() - lines 1250-1450
  // ========================================================================
  renderTracks(grid, state);
  
  // ========================================================================
  // RENDER SONG SECTIONS (cols 36-43, rows 2-21)
  // iOS: renderSongSections() - lines 1453-1470
  // ========================================================================
  renderSongSections(grid, state);
  
  // ========================================================================
  // RENDER ROWS 22-23: OVERVIEW
  // iOS: renderOverview() - lines 1531-1583
  // ========================================================================
  renderOverview(grid, state);
  
  // ========================================================================
  // RENDER SECTION PLAY BUTTON (row 23, cols 36-37)
  // iOS: renderSectionPlayButton() - lines 1650-1668
  // ========================================================================
  renderSectionPlayButton(grid, state);
  
  // ========================================================================
  // RENDER CLEAR SECTIONS BUTTON (row 23, cols 38-43)
  // iOS: renderClearAllSectionsButton() - lines 1671-1678
  // ========================================================================
  renderClearAllSectionsButton(grid);
  
  // ========================================================================
  // RENDER SECTION KEY INDICATOR (row 22)
  // iOS: renderSectionKeyIndicator() - lines 1681-1745
  // ========================================================================
  renderSectionKeyIndicator(grid, state);
  
  // ========================================================================
  // APPLY GESTURE PREVIEW
  // iOS: applyGesturePreview() - lines 1810-1920
  // ========================================================================
  applyGesturePreview(grid, state);
  
  // ========================================================================
  // APPLY TOOLTIPS (last, so always visible on top)
  // iOS: applyTooltips() - lines 1795-1808
  // ========================================================================
  applyTooltips(grid, state);
  
  return grid;
}

// ============================================================================
// RENDER ROW 0: CONTROLS
// iOS: renderRow0Controls() - PixelGridUIView.swift lines 676-713
// ============================================================================
function renderRow0Controls(grid: Pixel[][], state: V6GridState): void {
  const { 
    isPlaying, historyIndex, historyLength, scale, rootNote,
    showGhosts, patternLength, isShaking, shakeDirectionChanges,
    bpmPulseFade
  } = state;
  
  const row = 0;
  
  // Play/Stop (cols 0-2) - iOS: green when stopped, red when playing
  const playColor = isPlaying ? COLOR_STOP : COLOR_PLAY;
  for (let col = 0; col < 3; col++) {
    grid[row][col] = { 
      color: playColor, 
      action: 'togglePlay', 
      baseColor: playColor 
    };
  }
  
  // Col 3: Gap
  grid[row][3] = { color: '#0a0a0a', action: null, baseColor: '#0a0a0a' };
  
  // Undo (col 4) - iOS: bright when available
  grid[row][4] = { 
    color: historyIndex > 0 ? COLOR_ACTIVE : COLOR_INACTIVE, 
    action: 'undo', 
    baseColor: COLOR_ACTIVE 
  };
  
  // Redo (col 5) - iOS: bright when available
  grid[row][5] = { 
    color: historyIndex < historyLength - 1 ? COLOR_ACTIVE : COLOR_INACTIVE, 
    action: 'redo', 
    baseColor: COLOR_ACTIVE 
  };
  
  // Col 6: Gap
  grid[row][6] = { color: '#0a0a0a', action: null, baseColor: '#0a0a0a' };
  
  // Scale selectors (cols 7-9) - iOS: bright when selected, dim otherwise
  grid[row][7] = { 
    color: scale === 'major' ? COLOR_SCALE_MAJOR : dimColor(COLOR_SCALE_MAJOR), 
    action: 'scaleMajor', 
    baseColor: COLOR_SCALE_MAJOR 
  };
  grid[row][8] = { 
    color: scale === 'minor' ? COLOR_SCALE_MINOR : dimColor(COLOR_SCALE_MINOR), 
    action: 'scaleMinor', 
    baseColor: COLOR_SCALE_MINOR 
  };
  grid[row][9] = { 
    color: scale === 'penta' ? COLOR_SCALE_PENTA : dimColor(COLOR_SCALE_PENTA), 
    action: 'scalePenta', 
    baseColor: COLOR_SCALE_PENTA 
  };
  
  // Col 10: Gap
  grid[row][10] = { color: '#0a0a0a', action: null, baseColor: '#0a0a0a' };
  
  // Root note selectors (cols 11-22) - 12 chromatic notes
  for (let noteIndex = 0; noteIndex < 12; noteIndex++) {
    const col = 11 + noteIndex;
    const isSelected = noteIndex === rootNote;
    const noteColor = NOTE_COLORS[noteIndex];
    
    grid[row][col] = { 
      color: isSelected ? noteColor : dimColor(noteColor), 
      action: `root_${noteIndex}`, 
      baseColor: noteColor 
    };
  }
  
  // Col 23: Gap
  grid[row][23] = { color: '#0a0a0a', action: null, baseColor: '#0a0a0a' };
  
  // Ghost toggle (col 24) - iOS: brighter when enabled
  grid[row][24] = { 
    color: showGhosts ? COLOR_GHOST_ENABLED : COLOR_GHOST_DISABLED, 
    action: 'toggleGhosts', 
    baseColor: COLOR_GHOST_ENABLED 
  };
  
  // Col 25: Gap
  grid[row][25] = { color: '#0a0a0a', action: null, baseColor: '#0a0a0a' };
  
  // BPM controls (cols 26-28) with tempo pulse
  // iOS: BPM down, BPM indicator (pulses with beat), BPM up
  grid[row][26] = { 
    color: COLOR_CONTROL_BUTTON, 
    action: 'bpmDown', 
    baseColor: COLOR_CONTROL_BUTTON 
  };
  
  // BPM indicator pulses with beat
  const bpmBaseLightness = 0.35;
  const bpmPulsedLightness = bpmBaseLightness + bpmPulseFade;
  grid[row][27] = { 
    color: hslColor(0, 0, bpmPulsedLightness), 
    action: 'tapTempo', 
    baseColor: '#888888' 
  };
  
  grid[row][28] = { 
    color: COLOR_CONTROL_BUTTON, 
    action: 'bpmUp', 
    baseColor: COLOR_CONTROL_BUTTON 
  };
  
  // Col 29: Gap
  grid[row][29] = { color: '#0a0a0a', action: null, baseColor: '#0a0a0a' };
  
  // Pattern length controls (cols 30-32)
  grid[row][30] = { 
    color: COLOR_CONTROL_BUTTON, 
    action: 'lenDown', 
    baseColor: COLOR_CONTROL_BUTTON 
  };
  
  // Pattern length indicator - hue based on length
  grid[row][31] = { 
    color: hslColor(patternLength * 8, 0.7, 0.5), 
    action: null, 
    baseColor: '#ff55ff' 
  };
  
  grid[row][32] = { 
    color: COLOR_CONTROL_BUTTON, 
    action: 'lenUp', 
    baseColor: COLOR_CONTROL_BUTTON 
  };
  
  // Col 33: Gap
  grid[row][33] = { color: '#0a0a0a', action: null, baseColor: '#0a0a0a' };
  
  // Shake indicator (cols 34-35) - iOS: colored when shaking
  const shakeColor = isShaking 
    ? hslColor(360 - shakeDirectionChanges * 60, 1.0, 0.5) 
    : '#212121';
  grid[row][34] = { color: shakeColor, action: null, baseColor: shakeColor };
  grid[row][35] = { color: shakeColor, action: null, baseColor: shakeColor };
  
  // USB MIDI indicator (cols 36-37) - placeholder gray
  grid[row][36] = { color: '#282828', action: null, baseColor: '#888888' };
  grid[row][37] = { color: '#282828', action: null, baseColor: '#888888' };
  
  // Bluetooth MIDI indicator (cols 38-39) - placeholder blue
  grid[row][38] = { color: '#404080', action: 'bluetooth', baseColor: '#0080ff' };
  grid[row][39] = { color: '#404080', action: 'bluetooth', baseColor: '#0080ff' };
  
  // Clear button (cols 40-43) - iOS: dark red
  for (let col = 40; col < 44; col++) {
    grid[row][col] = { 
      color: COLOR_CLEAR, 
      action: 'clearAll', 
      baseColor: '#ff4444' 
    };
  }
}

// ============================================================================
// RENDER ROW 1: STEP MARKERS
// iOS: renderRow1StepMarkers() - PixelGridUIView.swift lines 1212-1247
// ============================================================================
function renderRow1StepMarkers(grid: Pixel[][], state: V6GridState): void {
  const { patternLength, pulseStep, currentStep, isPlaying } = state;
  const row = 1;
  
  // Left columns (track label area) - iOS: dim gray
  for (let col = 0; col < 4; col++) {
    grid[row][col] = { color: '#212121', action: null, baseColor: '#212121' };
  }
  
  // Step markers (cols 4-35)
  for (let step = 0; step < patternLength; step++) {
    const col = GridConstants.columnForStep(step);
    if (col >= GridConstants.columns) continue;
    
    const isBeat = step % 4 === 0;
    const isBar = step % 8 === 0;
    const isPulse = step === pulseStep;
    const isPlayhead = step === currentStep && isPlaying;
    
    let color: string;
    if (isPulse) {
      color = '#ffffff';  // white flash
    } else if (isPlayhead) {
      color = '#aaaaaa';  // bright gray (0.67)
    } else if (isBar) {
      color = '#555555';  // gray (0.33)
    } else if (isBeat) {
      color = '#333333';  // gray (0.2)
    } else {
      color = '#1a1a1a';  // gray (0.1)
    }
    
    grid[row][col] = { color, action: null, baseColor: '#555555' };
  }
  
  // Section columns (36-43) - headers
  for (let sec = 0; sec < 8; sec++) {
    const col = 36 + sec;
    grid[row][col] = { color: '#333333', action: `section_header_${sec}`, baseColor: '#555555' };
  }
}

// ============================================================================
// RENDER TRACKS (rows 2-21)
// iOS: renderTracks() - PixelGridUIView.swift lines 1250-1450
// ============================================================================
function renderTracks(grid: Pixel[][], state: V6GridState): void {
  const { 
    tracks, patternLength, currentStep, isPlaying, scale, rootNote,
    muted, soloed, showGhosts
  } = state;
  
  const trackConfigs: { track: TrackType; startRow: number; height: number }[] = [
    { track: 'melody', startRow: 2, height: 6 },
    { track: 'chords', startRow: 8, height: 6 },
    { track: 'bass', startRow: 14, height: 4 },
    { track: 'rhythm', startRow: 18, height: 4 },
  ];
  
  const scaleNotes = getScaleNotes(scale, rootNote);
  const TRACK_ORDER: TrackType[] = ['melody', 'chords', 'bass', 'rhythm'];
  
  for (const config of trackConfigs) {
    const { track, startRow, height } = config;
    
    const isMuted = muted[track] || (soloed !== null && soloed !== track);
    const isSoloed = soloed === track;
    
    // Track labels (cols 0-3)
    for (let localRow = 0; localRow < height; localRow++) {
      const row = startRow + localRow;
      const intensity = 1.0 - localRow / height * 0.5;
      const trackColor = TRACK_COLORS[track];
      
      // Mute button (col 0) - iOS: track color with alpha based on mute state
      const muteAlpha = isMuted ? 0.2 : (isSoloed ? 1.0 : intensity * 0.8);
      grid[row][0] = { 
        color: withAlpha(trackColor, muteAlpha), 
        action: `mute_${track}`, 
        baseColor: trackColor 
      };
      
      // Solo button (col 1) - iOS: white when soloed, dim otherwise
      grid[row][1] = { 
        color: isSoloed ? '#ffffff' : '#333333', 
        action: `solo_${track}`, 
        baseColor: '#ffffff' 
      };
      
      // VU meter (col 2) - placeholder (would show audio level)
      grid[row][2] = { color: '#0a0a0a', action: null, baseColor: trackColor };
      
      // Interval indicator (col 3) - iOS: note color at 35% alpha
      // For rhythm track, just dark
      if (track !== 'rhythm') {
        const noteIndex = Math.round((height - 1 - localRow) / (height - 1) * 11);
        const pitchClass = (noteIndex + rootNote) % 12;
        const noteColor = colorForPitch(pitchClass);
        grid[row][3] = { 
          color: withAlpha(noteColor, 0.35), 
          action: `interval_mode_${track}`, 
          baseColor: noteColor 
        };
      } else {
        grid[row][3] = { color: '#141414', action: null, baseColor: '#141414' };
      }
    }
    
    // Grid cells (cols 4-35)
    for (let localRow = 0; localRow < height; localRow++) {
      const row = startRow + localRow;
      
      // Note index: top row = highest note, bottom row = lowest
      // iOS: noteForRow calculates: (size - 1 - localRow) / (size - 1) * 11
      const noteIndex = Math.round((height - 1 - localRow) / (height - 1) * 11);
      const pitchClass = track === 'rhythm' ? noteIndex : (noteIndex + rootNote) % 12;
      const inScale = track !== 'rhythm' && isInScale(pitchClass, scaleNotes);
      
      for (let step = 0; step < patternLength; step++) {
        const col = GridConstants.columnForStep(step);
        if (col >= GridConstants.columns) continue;
        
        // Check for note at this position
        const velocity = tracks[track][noteIndex]?.[step] || 0;
        
        const isPlayhead = step === currentStep && isPlaying;
        
        // Ghost notes from other tracks
        let ghostColor: string | null = null;
        if (showGhosts && velocity === 0 && track !== 'rhythm') {
          for (const otherTrack of TRACK_ORDER) {
            if (otherTrack !== track && !muted[otherTrack]) {
              const otherVel = tracks[otherTrack][noteIndex]?.[step] || 0;
              if (otherVel > 0) {
                ghostColor = withAlpha(TRACK_COLORS[otherTrack], 0.13);
                break;
              }
            }
          }
        }
        
        // Determine cell color
        let color: string;
        let baseColor = '#0a0a0a';
        
        if (velocity > 0) {
          const noteColor = colorForPitch(pitchClass);
          baseColor = noteColor;
          
          if (velocity === 2) {
            // Accent - full brightness
            color = noteColor;
          } else if (velocity === 3) {
            // Sustain continuation - calculate fade
            const sustainFade = calculateSustainFade(
              tracks[track], noteIndex, step, patternLength
            );
            color = withAlpha(noteColor, sustainFade);
          } else {
            // Normal note - 0.73 alpha (matches iOS 0xBB)
            color = withAlpha(noteColor, 0.73);
          }
          
          // Apply mute dimming
          if (isMuted) {
            color = withAlpha(noteColor, 0.4);
          }
        } else if (ghostColor) {
          color = ghostColor;
          baseColor = ghostColor;
        } else if (isPlayhead) {
          color = '#1a1a1a';
        } else if (step % 8 === 0) {
          color = '#111111';  // bar marker
        } else if (!inScale && track !== 'rhythm') {
          color = '#050505';  // out of scale
        } else {
          color = '#0a0a0a';
        }
        
        grid[row][col] = { 
          color, 
          action: `grid_${row}_${step}`, 
          baseColor,
          glow: velocity > 0 && isPlayhead
        };
      }
    }
  }
}

// ============================================================================
// RENDER SONG SECTIONS (cols 36-43, rows 2-21)
// iOS: renderSongSections() - PixelGridUIView.swift lines 1453-1470
// ============================================================================
function renderSongSections(grid: Pixel[][], state: V6GridState): void {
  const { activeSection } = state;
  
  for (let sectionIndex = 0; sectionIndex < 8; sectionIndex++) {
    const col = 36 + sectionIndex;
    const isActive = sectionIndex === activeSection;
    
    // Render compressed thumbnail for each track row
    for (let row = 2; row <= 21; row++) {
      const track = GridConstants.trackForRow(row);
      if (!track) continue;
      
      const trackColor = TRACK_COLORS[track];
      const alpha = isActive ? 0.5 : 0.2;
      
      grid[row][col] = { 
        color: withAlpha(trackColor, alpha), 
        action: `section_${sectionIndex}`, 
        baseColor: trackColor,
        glow: isActive
      };
    }
  }
}

// ============================================================================
// RENDER OVERVIEW (rows 22-23)
// iOS: renderOverview() - PixelGridUIView.swift lines 1531-1583
// ============================================================================
function renderOverview(grid: Pixel[][], state: V6GridState): void {
  const { 
    tracks, patternLength, currentStep, isPlaying, muted, soloed 
  } = state;
  
  const TRACK_ORDER: TrackType[] = ['melody', 'chords', 'bass', 'rhythm'];
  
  // Step overview (cols 4-35)
  for (let step = 0; step < patternLength; step++) {
    const col = GridConstants.columnForStep(step);
    if (col >= GridConstants.columns) continue;
    
    let activeTrack: TrackType | null = null;
    let activeNote = 0;
    
    // Find first active track/note at this step
    for (const track of TRACK_ORDER) {
      if (muted[track] || (soloed !== null && soloed !== track)) continue;
      
      for (let n = 0; n < 12; n++) {
        if ((tracks[track][n]?.[step] || 0) > 0) {
          activeTrack = track;
          activeNote = n;
          break;
        }
      }
      if (activeTrack) break;
    }
    
    const isPlayhead = step === currentStep && isPlaying;
    
    // Row 22: Track color
    if (activeTrack) {
      grid[22][col] = { 
        color: TRACK_COLORS[activeTrack], 
        action: null, 
        baseColor: TRACK_COLORS[activeTrack] 
      };
    } else {
      grid[22][col] = { 
        color: isPlayhead ? '#212121' : '#0a0a0a', 
        action: null, 
        baseColor: '#0a0a0a' 
      };
    }
    
    // Row 23: Note color (skip control bar cols 0-13)
    if (col > GridConstants.ControlBar.syncEndCol) {
      if (activeTrack) {
        grid[23][col] = { 
          color: colorForPitch(activeNote), 
          action: null, 
          baseColor: colorForPitch(activeNote) 
        };
      } else {
        grid[23][col] = { 
          color: '#050505', 
          action: null, 
          baseColor: '#050505' 
        };
      }
    }
  }
  
  // Render control bar on row 23 (cols 0-13)
  renderControlBar(grid, state);
}

// ============================================================================
// RENDER CONTROL BAR (row 23, cols 0-13)
// iOS: renderControlBar() - PixelGridUIView.swift lines 1585-1610
// ============================================================================
function renderControlBar(grid: Pixel[][], state: V6GridState): void {
  const row = 23;
  
  // Clear control bar area first
  for (let col = 0; col <= GridConstants.ControlBar.syncEndCol; col++) {
    grid[row][col] = { color: '#000000', action: null, baseColor: '#000000' };
  }
  
  // WLED button (cols 0-3) - rainbow gradient when enabled
  renderWLEDButton(grid, state);
  
  // Gap at col 4
  grid[row][4] = { color: '#000000', action: null, baseColor: '#000000' };
  
  // Link button (cols 5-7) - cyan/orange based on connection
  renderLinkButton(grid, state);
  
  // Gap at col 8
  grid[row][8] = { color: '#000000', action: null, baseColor: '#000000' };
  
  // Mode button (cols 9-10)
  renderModeButton(grid, state);
  
  // Sync button (cols 11-13)
  renderSyncButton(grid, state);
}

// ============================================================================
// RENDER WLED BUTTON (row 23, cols 0-3)
// iOS: renderWLEDButton() - PixelGridUIView.swift lines 1613-1635
// ============================================================================
function renderWLEDButton(grid: Pixel[][], state: V6GridState): void {
  const { frameCounter } = state;
  const row = 23;
  const startCol = GridConstants.ControlBar.wledStartCol;
  const endCol = GridConstants.ControlBar.wledEndCol;
  
  // Rainbow gradient chase animation
  // Base hue cycles 0-360° over ~10 seconds (600 frames @ 60fps)
  const baseHue = (frameCounter % 600) / 600;
  
  // Small gradient band (~10% of rainbow) that chases left to right
  const gradientSpan = 0.10;
  const pixelCount = endCol - startCol + 1;
  
  for (let i = 0; i <= endCol - startCol; i++) {
    const col = startCol + i;
    const hueOffset = (i / (pixelCount - 1)) * gradientSpan;
    const hue = ((baseHue + hueOffset) % 1.0) * 360;
    const color = hslColor(hue, 0.8, 0.5);
    
    grid[row][col] = { color, action: 'wled', baseColor: color };
  }
}

// ============================================================================
// RENDER LINK BUTTON (row 23, cols 5-7)
// iOS: renderLinkButton() - PixelGridUIView.swift lines 1637-1657
// ============================================================================
function renderLinkButton(grid: Pixel[][], _state: V6GridState): void {
  const row = 23;
  
  // Placeholder: dim cyan (not connected)
  const color = '#004444';  // dim cyan
  
  for (let col = GridConstants.ControlBar.linkStartCol; col <= GridConstants.ControlBar.linkEndCol; col++) {
    grid[row][col] = { color, action: 'link', baseColor: '#00ffff' };
  }
}

// ============================================================================
// RENDER MODE BUTTON (row 23, cols 9-10)
// iOS: renderModeButton() - PixelGridUIView.swift lines 1659-1683
// ============================================================================
function renderModeButton(grid: Pixel[][], _state: V6GridState): void {
  const row = 23;
  
  // Yellow for Free mode (default)
  const color = '#c89600';  // rgb(200, 150, 0)
  
  grid[row][GridConstants.ControlBar.modeStartCol] = { 
    color, action: 'mode', baseColor: '#ffcc00' 
  };
  grid[row][GridConstants.ControlBar.modeEndCol] = { 
    color, action: 'mode', baseColor: '#ffcc00' 
  };
}

// ============================================================================
// RENDER SYNC BUTTON (row 23, cols 11-13)
// iOS: renderSyncButton() - PixelGridUIView.swift lines 1685-1715
// ============================================================================
function renderSyncButton(grid: Pixel[][], _state: V6GridState): void {
  const row = 23;
  
  // Idle state: dim cyan
  const color = '#004d66';  // rgb(0, 77, 102)
  
  for (let col = GridConstants.ControlBar.syncStartCol; col <= GridConstants.ControlBar.syncEndCol; col++) {
    grid[row][col] = { color, action: 'sync', baseColor: '#00e6e6' };
  }
}

// ============================================================================
// RENDER SECTION PLAY BUTTON (row 23, cols 36-37)
// iOS: renderSectionPlayButton() - PixelGridUIView.swift lines 1650-1668
// ============================================================================
function renderSectionPlayButton(grid: Pixel[][], _state: V6GridState): void {
  const row = 23;
  
  // Placeholder: dim green (section play disabled)
  const color = '#194d26';  // rgb(25, 77, 38)
  
  grid[row][36] = { color, action: 'section_play', baseColor: '#33e64d' };
  grid[row][37] = { color, action: 'section_play', baseColor: '#33e64d' };
}

// ============================================================================
// RENDER CLEAR SECTIONS BUTTON (row 23, cols 38-43)
// iOS: renderClearAllSectionsButton() - PixelGridUIView.swift lines 1671-1678
// ============================================================================
function renderClearAllSectionsButton(grid: Pixel[][]): void {
  const row = 23;
  
  for (let col = 38; col <= 43; col++) {
    grid[row][col] = { color: COLOR_CLEAR, action: 'clearSections', baseColor: '#ff4444' };
  }
}

// ============================================================================
// RENDER SECTION KEY INDICATOR (row 22, cols 4-35)
// iOS: renderSectionKeyIndicator() - PixelGridUIView.swift lines 1681-1745
// ============================================================================
function renderSectionKeyIndicator(grid: Pixel[][], state: V6GridState): void {
  const { rootNote, patternLength } = state;
  const row = 22;
  
  // Cols 0-3: Control area (dark)
  for (let col = 0; col < 4; col++) {
    grid[row][col] = { color: '#222222', action: null, baseColor: '#222222' };
  }
  
  // Cols 4-35: Key automation markers
  // For now, show hint of current root note color (dim)
  for (let step = 0; step < patternLength; step++) {
    const col = GridConstants.columnForStep(step);
    if (col > 35) continue;
    
    const hintColor = withAlpha(NOTE_COLORS[rootNote % 12], 0.15);
    grid[row][col] = { 
      color: hintColor, 
      action: `key_auto_${step}`, 
      baseColor: NOTE_COLORS[rootNote % 12] 
    };
  }
  
  // Section indicators (cols 36-43)
  for (let sec = 0; sec < 8; sec++) {
    const col = 36 + sec;
    grid[row][col] = { color: '#333333', action: `section_key_${sec}`, baseColor: '#555555' };
  }
}

// ============================================================================
// CALCULATE SUSTAIN FADE
// iOS: calculateSustainFade() - PixelGridUIView.swift lines 1477-1528
// ============================================================================
function calculateSustainFade(
  trackData: number[][], 
  note: number, 
  step: number, 
  patternLength: number
): number {
  // Find sustain start
  let sustainStart = step;
  let sustainLength = 1;
  
  for (let s = 1; s < patternLength; s++) {
    const prevStep = (step - s + patternLength) % patternLength;
    const prevVel = trackData[note]?.[prevStep] || 0;
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
  
  // Count forward for total length
  for (let s = 1; s < patternLength; s++) {
    const nextStep = (step + s) % patternLength;
    if ((trackData[note]?.[nextStep] || 0) === 3) {
      sustainLength++;
    } else {
      break;
    }
  }
  
  // Calculate position and fade
  const positionInSustain = ((step - sustainStart + patternLength) % patternLength) / sustainLength;
  
  // ADSR-like fade: hold at ~85% for first 40%, then fade
  if (positionInSustain < 0.4) {
    return 0.85;
  } else {
    return Math.max(0.25, 1.0 - positionInSustain * 0.9);
  }
}

// ============================================================================
// APPLY GESTURE PREVIEW
// iOS: applyGesturePreview() - PixelGridUIView.swift lines 1810-1920
// ============================================================================
function applyGesturePreview(grid: Pixel[][], state: V6GridState): void {
  const { gesturePreview, rootNote } = state;
  
  if (gesturePreview.length === 0) return;
  
  for (const preview of gesturePreview) {
    const col = GridConstants.columnForStep(preview.step);
    if (col >= GridConstants.columns) continue;
    
    // Find the row for this note in the appropriate track
    // For simplicity, map to melody track (rows 2-7)
    const height = 6;
    const localRow = Math.round((11 - preview.note) / 11 * (height - 1));
    const row = 2 + localRow;
    
    if (row < 0 || row >= GridConstants.rows) continue;
    
    // Preview color with velocity-based alpha
    const pitchClass = (preview.note + rootNote) % 12;
    const noteColor = colorForPitch(pitchClass);
    const alpha = preview.velocity === 2 ? 0.8 : (preview.velocity === 3 ? 0.6 : 0.6);
    
    grid[row][col] = {
      ...grid[row][col],
      color: withAlpha(noteColor, alpha)
    };
  }
}

// ============================================================================
// APPLY TOOLTIPS
// iOS: applyTooltips() - PixelGridUIView.swift lines 1795-1808
// ============================================================================
function applyTooltips(grid: Pixel[][], state: V6GridState): void {
  const { tooltipPixels } = state;
  
  for (const pixel of tooltipPixels) {
    if (pixel.row < 0 || pixel.row >= GridConstants.rows) continue;
    if (pixel.col < 0 || pixel.col >= GridConstants.columns) continue;
    
    const current = grid[pixel.row][pixel.col];
    const blended = blendWithWhite(current.baseColor || current.color, pixel.intensity);
    
    grid[pixel.row][pixel.col] = {
      ...current,
      color: blended,
      isTooltip: true
    };
  }
}

export default getPixelGrid_v6;
