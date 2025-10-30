/**
 * Studio Presets - Story 23.1
 *
 * Preset configurations for persona-specific onboarding.
 * Each preset defines which modules to load and initial state.
 */

export interface StudioPreset {
  id: string;
  name: string;
  description: string;
  initialModules: string[]; // Array of moduleIds to auto-load
  tourEnabled: boolean;
  tourSteps?: TourStep[];
}

export interface TourStep {
  id: string;
  title: string;
  content: string;
  targetSelector?: string; // CSS selector for element to highlight
  placement?: 'top' | 'right' | 'bottom' | 'left' | 'center';
  action?: 'click' | 'none'; // Wait for user action or manual advance
}

/**
 * Musician Preset - Focus on Drum Machine for beat creation
 */
export const musicianPreset: StudioPreset = {
  id: 'musician',
  name: 'Musician',
  description: 'Quick beat creation with Drum Machine',
  initialModules: ['drum'], // Fixed: 'drum' not 'drum-machine'
  tourEnabled: true,
  tourSteps: [
    {
      id: 'welcome',
      title: 'Welcome, Musician! 🎵',
      content: 'Let\'s create your first beat in 30 seconds. The Drum Machine is already loaded for you.',
      placement: 'bottom',
      action: 'none',
    },
    {
      id: 'sequencer-grid',
      title: 'Step 1: Add Beats',
      content: 'Click any box in the grid to add a drum hit. Try clicking 4 boxes to create a simple pattern!',
      targetSelector: '[data-tour="drum-grid"]',
      placement: 'bottom',
      action: 'click',
    },
    {
      id: 'playback',
      title: 'Step 2: Press Play',
      content: 'Great! Now press the Play button in the top bar to hear your beat.',
      targetSelector: '[data-tour="playback-button"]',
      placement: 'bottom',
      action: 'click',
    },
    {
      id: 'complete',
      title: 'You\'re a Beat Maker! 🎉',
      content: 'Nice work! You can add more modules from the sidebar, adjust tempo, or keep jamming. All features are free - no account required.',
      placement: 'bottom',
      action: 'none',
    },
  ],
};

/**
 * Visual Learner Preset - Focus on Piano Roll with color modes
 */
export const visualLearnerPreset: StudioPreset = {
  id: 'visual-learner',
  name: 'Visual Learner',
  description: 'Learn music through patterns and colors',
  initialModules: ['piano'], // Fixed: 'piano' not 'piano-roll'
  tourEnabled: true,
  tourSteps: [
    {
      id: 'welcome',
      title: 'Welcome, Visual Learner! 👁️',
      content: 'Let\'s explore music visually. The Piano Roll shows musical notes as a grid - no sheet music needed!',
      placement: 'bottom',
      action: 'none',
    },
    {
      id: 'color-modes',
      title: 'Step 1: See Colors',
      content: 'Click the color mode selector to see how different colors represent musical relationships. Try Rainbow mode first!',
      targetSelector: '[data-tour="color-mode-selector"]',
      placement: 'right',
      action: 'click',
    },
    {
      id: 'piano-grid',
      title: 'Step 2: Create a Melody',
      content: 'Click on the grid to place notes. Each row is a different pitch - higher rows = higher notes. The grid shows time flowing left to right.',
      targetSelector: '[data-tour="piano-grid"]',
      placement: 'bottom',
      action: 'click',
    },
    {
      id: 'complete',
      title: 'You\'re Seeing Music! 🌈',
      content: 'Beautiful! Colors help you see musical patterns that would be invisible in traditional notation. Explore the sidebar to discover more visual tools.',
      placement: 'bottom',
      action: 'none',
    },
  ],
};

/**
 * Educator Preset - Focus on Chord/Melody Arranger for teaching
 */
export const educatorPreset: StudioPreset = {
  id: 'educator',
  name: 'Educator',
  description: 'Music theory and composition for teaching',
  initialModules: ['chord-melody-arranger'],
  tourEnabled: true,
  tourSteps: [
    {
      id: 'welcome',
      title: 'Welcome, Educator! 📚',
      content: 'Let\'s explore chord progressions and melody creation. Perfect for teaching music theory concepts!',
      placement: 'bottom',
      action: 'none',
    },
    {
      id: 'chord-selector',
      title: 'Step 1: Select Chords',
      content: 'Use the chord selector to build progressions. Students can see and hear how chords relate to each other.',
      targetSelector: '[data-tour="chord-selector"]',
      placement: 'bottom',
      action: 'click',
    },
    {
      id: 'playback',
      title: 'Step 2: Hear the Progression',
      content: 'Press Play to hear the chord progression. Students can experiment with different combinations.',
      targetSelector: '[data-tour="playback-button"]',
      placement: 'bottom',
      action: 'click',
    },
    {
      id: 'complete',
      title: 'Ready to Teach! 🎓',
      content: 'Students can now experiment with chords and melodies. Great for teaching harmony, progressions, and composition!',
      placement: 'bottom',
      action: 'none',
    },
  ],
};

/**
 * Default (no preset) - Full Studio experience
 */
export const defaultPreset: StudioPreset = {
  id: 'default',
  name: 'Full Studio',
  description: 'Complete music production workspace',
  initialModules: [], // Start with empty workspace
  tourEnabled: false,
};

/**
 * All available presets
 */
export const STUDIO_PRESETS: Record<string, StudioPreset> = {
  musician: musicianPreset,
  'visual-learner': visualLearnerPreset,
  educator: educatorPreset,
  default: defaultPreset,
};

/**
 * Map persona URL codes to preset IDs
 */
export const PERSONA_CODE_TO_PRESET: Record<string, string> = {
  m: 'musician',
  v: 'visual-learner',
  e: 'educator',
};

/**
 * Get preset by ID or persona code
 */
export function getPreset(presetIdOrCode: string): StudioPreset {
  // Try direct preset ID first
  if (STUDIO_PRESETS[presetIdOrCode]) {
    return STUDIO_PRESETS[presetIdOrCode];
  }

  // Try persona code mapping
  const presetId = PERSONA_CODE_TO_PRESET[presetIdOrCode];
  if (presetId && STUDIO_PRESETS[presetId]) {
    return STUDIO_PRESETS[presetId];
  }

  // Fallback to default
  return defaultPreset;
}
