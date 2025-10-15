/**
 * Intelligent Melody Service
 * Epic 15 - Story 15.7: Intelligent Melody Generator with Harmonic Guidance
 *
 * Provides chord-aware melody generation and brightness-based visual guidance.
 * Implements music theory principles for harmonically rich melodies.
 *
 * Features:
 * - Chord tone emphasis on strong beats
 * - Passing tones for smooth voice leading
 * - Melodic contour shaping (arch, valley, ascending, descending)
 * - Brightness-weighted note suggestions (0.2-1.0 hierarchy)
 * - Settings-driven visual feedback (chord tone density, passing tones)
 * - ColorMode integration (chromatic/harmonic/spectrum)
 *
 * Usage:
 * ```typescript
 * const service = IntelligentMelodyService.getInstance();
 * const suggestions = service.calculateNoteSuggestions(step, currentChord, scaleNotes, settings);
 * const brightness = service.calculateNoteBrightness(pitch, step, currentChord, scaleNotes, settings);
 * ```
 */

import type { Chord } from '@/types/chordProgression';

/**
 * Intelligent Melody Settings
 * User-configurable parameters that shape melody generation
 */
export interface IntelligentMelodySettings {
  // Chord Tone Density - How often chord tones appear
  chordToneDensity: 'high' | 'medium' | 'low';

  // Melodic Contour - Overall shape of the melody
  melodicContour: 'arch' | 'valley' | 'ascending' | 'descending' | 'wave' | 'random';

  // Passing Tones - Smooth stepwise motion between chord tones
  passingTones: boolean;

  // Rhythmic Pattern - Note duration variety
  rhythmicPattern: 'groove1' | 'groove2' | 'groove3' | 'triplet' | 'sparse' | 'mixed';

  // Velocity Shaping - Dynamic expression
  velocityShaping: 'arc' | 'crescendo' | 'decrescendo' | 'uniform';

  // Note Density - How many steps have notes
  noteDensity: number; // 0.0-1.0 (0.7 = 70% of steps have notes)
}

/**
 * Note Suggestion
 * Brightness-weighted suggestion for a specific pitch at a specific step
 */
export interface NoteSuggestion {
  pitch: number;           // MIDI note number
  brightness: number;      // 0.2-1.0 (PRIMARY visual indicator)
  isChordTone: boolean;    // Educational indicator
  isStrongBeat: boolean;   // Educational indicator
  interval: number | null; // Interval from last placed note (if any)
}

/**
 * Melodic Contour Point
 * Defines the expected pitch range at each step
 */
interface ContourPoint {
  step: number;
  targetPitchIndex: number; // Index in visibleNotes array (0 = highest, length-1 = lowest)
}

/**
 * Intelligent Melody Service
 * Singleton pattern - use getInstance() to access
 */
export class IntelligentMelodyService {
  private static instance: IntelligentMelodyService;

  /**
   * Private constructor (Singleton pattern)
   */
  private constructor() {
    console.log('[IntelligentMelodyService] Initialized');
  }

  /**
   * Get singleton instance
   * @returns IntelligentMelodyService instance
   */
  static getInstance(): IntelligentMelodyService {
    if (!IntelligentMelodyService.instance) {
      IntelligentMelodyService.instance = new IntelligentMelodyService();
    }
    return IntelligentMelodyService.instance;
  }

  /**
   * Calculate brightness for a specific note at a specific step
   *
   * Brightness Hierarchy (PRIMARY visual indicator):
   * - 1.0: Placed note (user has placed this note)
   * - 0.90: Most recommended (chord tone, strong beat, high density)
   * - 0.85: Very recommended (chord tone, strong beat, medium density)
   * - 0.75: Recommended (chord tone weak beat OR scale note strong beat)
   * - 0.65: Acceptable (scale note, medium density)
   * - 0.55: Passing tones (scale notes on weak beats)
   * - 0.45: Subtle (weak scale notes, low density)
   * - 0.20: Out-of-scale (chromatic notes, advanced usage)
   *
   * @param pitch - MIDI note number
   * @param step - Step position (0-15)
   * @param currentChord - Active chord at this step (null if no chord)
   * @param scaleNotes - All notes in the current scale (MIDI numbers)
   * @param settings - User's intelligent melody settings
   * @param lastPlacedPitch - Last note placed by user (for passing tone logic)
   * @param isPlacedNote - Whether this note has been placed by user
   * @returns Brightness value (0.2-1.0)
   */
  calculateNoteBrightness(
    pitch: number,
    step: number,
    currentChord: Chord | null,
    scaleNotes: number[],
    settings: IntelligentMelodySettings,
    lastPlacedPitch: number | null = null,
    isPlacedNote: boolean = false
  ): number {
    // Placed notes always have full brightness
    if (isPlacedNote) {
      return 1.0;
    }

    const noteClass = pitch % 12;
    const isInScale = scaleNotes.some(scaleNote => (scaleNote % 12) === noteClass);

    // Out-of-scale notes are dim (chromatic notes)
    if (!isInScale) {
      return 0.2;
    }

    // Check if note is a chord tone
    const chordTones = currentChord ? this.getChordTonesFromChord(currentChord, scaleNotes) : [];
    const isChordTone = chordTones.some(ct => (ct % 12) === noteClass);

    // Strong beats: steps 0, 4, 8, 12 (downbeats in 4/4 time)
    const isStrongBeat = step % 4 === 0;

    // Base brightness calculation (before settings adjustments)
    let baseBrightness = 0.45; // Default: subtle scale note

    if (isChordTone && isStrongBeat) {
      // Chord tone on strong beat - most recommended
      baseBrightness = 0.85;
    } else if (isChordTone) {
      // Chord tone on weak beat - recommended
      baseBrightness = 0.75;
    } else if (isStrongBeat) {
      // Scale note on strong beat - acceptable
      baseBrightness = 0.65;
    } else {
      // Scale note on weak beat - passing tone
      baseBrightness = 0.55;
    }

    // Apply chord tone density adjustments
    baseBrightness = this.adjustBrightnessForChordToneDensity(
      baseBrightness,
      isChordTone,
      isStrongBeat,
      settings.chordToneDensity
    );

    // Apply passing tone adjustments (stepwise vs leap)
    if (settings.passingTones && lastPlacedPitch !== null) {
      baseBrightness = this.adjustBrightnessForPassingTones(
        baseBrightness,
        pitch,
        lastPlacedPitch
      );
    }

    // Clamp to valid range
    return Math.max(0.2, Math.min(1.0, baseBrightness));
  }

  /**
   * Adjust brightness based on chord tone density setting
   *
   * High density: Widens gap between chord tones and scale notes (0.90 vs 0.55 = 0.35 gap)
   * Medium density: Normal gap (0.85 vs 0.65 = 0.20 gap)
   * Low density: Narrows gap (0.75 vs 0.70 = 0.05 gap)
   *
   * @param baseBrightness - Brightness before adjustment
   * @param isChordTone - Whether note is a chord tone
   * @param isStrongBeat - Whether step is a strong beat
   * @param density - Chord tone density setting
   * @returns Adjusted brightness
   */
  private adjustBrightnessForChordToneDensity(
    baseBrightness: number,
    isChordTone: boolean,
    isStrongBeat: boolean,
    density: 'high' | 'medium' | 'low'
  ): number {
    if (density === 'high') {
      // High density: Brighten chord tones, dim scale notes
      if (isChordTone && isStrongBeat) return 0.90;
      if (isChordTone) return 0.75;
      return 0.55; // Scale notes dimmer
    }

    if (density === 'low') {
      // Low density: Narrow gap between chord tones and scale notes
      if (isChordTone && isStrongBeat) return 0.75;
      if (isChordTone) return 0.70;
      return 0.70; // Scale notes brighter (closer to chord tones)
    }

    // Medium density: Use base brightness (normal)
    return baseBrightness;
  }

  /**
   * Adjust brightness based on harmonic intervals from last placed note
   *
   * Consonant intervals (harmonically pleasing):
   * - Perfect 5th (7 semitones): +15% brightness - most consonant
   * - Perfect 4th (5 semitones): +12% brightness - very consonant
   * - Major/Minor 3rd (3-4 semitones): +10% brightness - sweet
   * - Octave (12 semitones): +15% brightness - perfectly consonant
   * - Major 6th (9 semitones): +8% brightness - pleasant
   *
   * Dissonant intervals (harmonically tense):
   * - Minor 2nd (1 semitone): -20% brightness - very dissonant
   * - Major 2nd (2 semitones): -15% brightness - dissonant
   * - Tritone (6 semitones): -10% brightness - tense
   *
   * Neutral intervals:
   * - Everything else: no adjustment
   *
   * @param baseBrightness - Brightness before adjustment
   * @param pitch - Current note pitch
   * @param lastPlacedPitch - Last placed note pitch
   * @returns Adjusted brightness
   */
  private adjustBrightnessForPassingTones(
    baseBrightness: number,
    pitch: number,
    lastPlacedPitch: number
  ): number {
    const interval = Math.abs(pitch - lastPlacedPitch) % 12; // Interval within octave

    // Consonant intervals - boost brightness (harmonically pleasing)
    if (interval === 0) {
      // Unison/Octave - perfectly consonant
      return Math.min(1.0, baseBrightness + 0.15);
    }
    if (interval === 7) {
      // Perfect 5th - most consonant interval
      return Math.min(1.0, baseBrightness + 0.15);
    }
    if (interval === 5) {
      // Perfect 4th - very consonant
      return Math.min(1.0, baseBrightness + 0.12);
    }
    if (interval === 3 || interval === 4) {
      // Minor 3rd (3) / Major 3rd (4) - sweet thirds
      return Math.min(1.0, baseBrightness + 0.10);
    }
    if (interval === 9) {
      // Major 6th - pleasant
      return Math.min(1.0, baseBrightness + 0.08);
    }
    if (interval === 8) {
      // Minor 6th - acceptable
      return Math.min(1.0, baseBrightness + 0.05);
    }

    // Dissonant intervals - reduce brightness (harmonically tense)
    if (interval === 1) {
      // Minor 2nd - very dissonant (avoid highlighting)
      return Math.max(0.2, baseBrightness - 0.20);
    }
    if (interval === 2) {
      // Major 2nd - dissonant (avoid highlighting)
      return Math.max(0.2, baseBrightness - 0.15);
    }
    if (interval === 6) {
      // Tritone - tense (acceptable in jazz context but not highlighted)
      return Math.max(0.2, baseBrightness - 0.10);
    }

    // Neutral intervals (no strong consonance or dissonance)
    return baseBrightness;
  }

  /**
   * Calculate note suggestions for a specific step
   * Returns all visible scale notes with brightness-weighted recommendations
   *
   * @param step - Step position (0-15)
   * @param currentChord - Active chord at this step (null if no chord)
   * @param visibleNotes - All visible notes in the sequencer (MIDI numbers, descending)
   * @param scaleNotes - All notes in the current scale (MIDI numbers)
   * @param settings - User's intelligent melody settings
   * @param lastPlacedPitch - Last note placed by user (for passing tone logic)
   * @returns Array of note suggestions with brightness values
   */
  calculateNoteSuggestions(
    step: number,
    currentChord: Chord | null,
    visibleNotes: number[],
    scaleNotes: number[],
    settings: IntelligentMelodySettings,
    lastPlacedPitch: number | null = null
  ): NoteSuggestion[] {
    const suggestions: NoteSuggestion[] = [];

    // Get chord tones for educational indicators
    const chordTones = currentChord ? this.getChordTonesFromChord(currentChord, scaleNotes) : [];
    const isStrongBeat = step % 4 === 0;

    for (const pitch of visibleNotes) {
      const noteClass = pitch % 12;
      const isChordTone = chordTones.some(ct => (ct % 12) === noteClass);
      const interval = lastPlacedPitch !== null ? pitch - lastPlacedPitch : null;

      const brightness = this.calculateNoteBrightness(
        pitch,
        step,
        currentChord,
        scaleNotes,
        settings,
        lastPlacedPitch,
        false // Not a placed note (suggestion only)
      );

      suggestions.push({
        pitch,
        brightness,
        isChordTone,
        isStrongBeat,
        interval,
      });
    }

    return suggestions;
  }

  /**
   * Extract chord tones from a Chord object
   * Converts guitar fret positions to MIDI note numbers and extracts unique pitch classes
   *
   * @param chord - Chord object with fret positions
   * @param scaleNotes - Scale notes to filter chord tones (only include notes in scale)
   * @returns Array of MIDI note numbers representing chord tones
   */
  private getChordTonesFromChord(chord: Chord, scaleNotes: number[]): number[] {
    // Standard guitar tuning (MIDI note numbers for open strings)
    const openStringMidi: Record<number, number> = {
      1: 64, // High E (E4)
      2: 59, // B (B3)
      3: 55, // G (G3)
      4: 50, // D (D3)
      5: 45, // A (A2)
      6: 40, // Low E (E2)
    };

    // Convert guitar fret positions to MIDI notes
    const midiNotes = chord.notes.map(note => {
      const openStringNote = openStringMidi[note.string];
      if (openStringNote === undefined) {
        return 60; // Default to middle C
      }
      return openStringNote + note.fret;
    });

    // Extract unique pitch classes (0-11) from MIDI notes
    const pitchClasses = new Set<number>();
    midiNotes.forEach(midi => {
      pitchClasses.add(midi % 12);
    });

    // Map pitch classes to MIDI notes in the visible scale range
    const chordTones: number[] = [];
    scaleNotes.forEach(scaleNote => {
      if (pitchClasses.has(scaleNote % 12)) {
        chordTones.push(scaleNote);
      }
    });

    return chordTones;
  }

  /**
   * Generate melodic contour curve for 16 steps
   * Returns target pitch indices for each step based on contour type
   *
   * @param contourType - Type of melodic contour
   * @param pitchRangeSize - Number of visible notes (for calculating indices)
   * @returns Array of contour points (target pitch index per step)
   */
  generateMelodicContour(
    contourType: IntelligentMelodySettings['melodicContour'],
    pitchRangeSize: number
  ): ContourPoint[] {
    const contourPoints: ContourPoint[] = [];
    const steps = 16;

    switch (contourType) {
      case 'arch':
        // Low → High → Low (climax at step 8)
        for (let step = 0; step < steps; step++) {
          const progress = step / (steps - 1); // 0-1
          const arc = Math.sin(progress * Math.PI); // 0 → 1 → 0
          const targetIndex = Math.floor((1 - arc) * (pitchRangeSize - 1));
          contourPoints.push({ step, targetPitchIndex: targetIndex });
        }
        break;

      case 'valley':
        // High → Low → High (valley at step 8)
        for (let step = 0; step < steps; step++) {
          const progress = step / (steps - 1);
          const arc = Math.sin(progress * Math.PI); // 0 → 1 → 0
          const targetIndex = Math.floor(arc * (pitchRangeSize - 1));
          contourPoints.push({ step, targetPitchIndex: targetIndex });
        }
        break;

      case 'ascending':
        // Gradual climb (low to high)
        for (let step = 0; step < steps; step++) {
          const progress = step / (steps - 1);
          const targetIndex = Math.floor((1 - progress) * (pitchRangeSize - 1));
          contourPoints.push({ step, targetPitchIndex: targetIndex });
        }
        break;

      case 'descending':
        // Gradual fall (high to low)
        for (let step = 0; step < steps; step++) {
          const progress = step / (steps - 1);
          const targetIndex = Math.floor(progress * (pitchRangeSize - 1));
          contourPoints.push({ step, targetPitchIndex: targetIndex });
        }
        break;

      case 'wave':
        // Alternating up/down (2-bar phrases)
        for (let step = 0; step < steps; step++) {
          const phraseIndex = Math.floor(step / 4); // 0-3 (4 phrases of 4 steps)
          const isAscending = phraseIndex % 2 === 0;
          const progressInPhrase = (step % 4) / 3; // 0-1 within phrase
          const targetIndex = isAscending
            ? Math.floor((1 - progressInPhrase) * (pitchRangeSize - 1))
            : Math.floor(progressInPhrase * (pitchRangeSize - 1));
          contourPoints.push({ step, targetPitchIndex: targetIndex });
        }
        break;

      case 'random':
      default:
        // Random contour (no specific shape)
        for (let step = 0; step < steps; step++) {
          const targetIndex = Math.floor(Math.random() * pitchRangeSize);
          contourPoints.push({ step, targetPitchIndex: targetIndex });
        }
        break;
    }

    return contourPoints;
  }

  /**
   * Get rhythmic pattern durations for 16 steps
   * Returns array of note durations in beats (0.25 = 1/16th note, 0.5 = 1/8th note)
   *
   * @param patternType - Type of rhythmic pattern
   * @returns Array of 16 durations (or null for rests)
   */
  getRhythmicPattern(
    patternType: IntelligentMelodySettings['rhythmicPattern']
  ): (number | null)[] {
    const patterns: Record<string, (number | null)[]> = {
      groove1: [0.5, 0.25, 0.25, 0.5], // Syncopated
      groove2: [0.25, 0.25, 0.5, 0.5], // Front-loaded
      groove3: [0.75, 0.25, 0.5, 0.5], // Anticipation
      triplet: [0.33, 0.33, 0.33, 0.5], // Triplet feel
      sparse: [0.5, null, 0.5, null],   // Breathing room (rests)
    };

    const basePattern = patterns[patternType] || patterns.groove1;

    // Repeat base pattern to fill 16 steps
    const fullPattern: (number | null)[] = [];
    for (let step = 0; step < 16; step++) {
      fullPattern.push(basePattern[step % basePattern.length]);
    }

    return fullPattern;
  }

  /**
   * Calculate velocity for a note based on velocity shaping setting
   *
   * @param step - Step position (0-15)
   * @param shapingType - Velocity shaping type
   * @returns Velocity value (0-127)
   */
  calculateVelocity(
    step: number,
    shapingType: IntelligentMelodySettings['velocityShaping']
  ): number {
    const isStrongBeat = step % 4 === 0;
    let baseVelocity = 70; // Base velocity

    switch (shapingType) {
      case 'arc':
        // Phrase-based arc (sine wave over 16 steps)
        const phrasePosition = step / 16;
        const arc = Math.sin(phrasePosition * Math.PI); // 0 → 1 → 0
        baseVelocity = 70 + Math.floor(arc * 40); // 70-110
        break;

      case 'crescendo':
        // Gradual increase
        baseVelocity = 70 + Math.floor((step / 15) * 40); // 70-110
        break;

      case 'decrescendo':
        // Gradual decrease
        baseVelocity = 110 - Math.floor((step / 15) * 40); // 110-70
        break;

      case 'uniform':
      default:
        // Uniform velocity (no shaping)
        baseVelocity = 90;
        break;
    }

    // Add accent on downbeats
    if (isStrongBeat) {
      baseVelocity = Math.min(127, baseVelocity + 10);
    }

    return Math.max(0, Math.min(127, baseVelocity));
  }

  /**
   * Get default intelligent melody settings
   * @returns Default settings object
   */
  static getDefaultSettings(): IntelligentMelodySettings {
    return {
      chordToneDensity: 'medium',
      melodicContour: 'arch',
      passingTones: true,
      rhythmicPattern: 'groove1',
      velocityShaping: 'arc',
      noteDensity: 0.7,
    };
  }

  /**
   * Get educational feedback message for current settings
   * Explains how settings will affect visual brightness
   *
   * @param settings - Current settings
   * @returns Educational message
   */
  getSettingsFeedbackMessage(settings: IntelligentMelodySettings): string {
    const messages: string[] = [];

    // Chord tone density feedback
    if (settings.chordToneDensity === 'high') {
      messages.push('Chord tones will be MUCH brighter than scale notes');
    } else if (settings.chordToneDensity === 'low') {
      messages.push('Chord tones and scale notes will have similar brightness');
    } else {
      messages.push('Balanced brightness between chord tones and scale notes');
    }

    // Passing tones feedback
    if (settings.passingTones) {
      messages.push('Stepwise notes will be brighter than leaps');
    }

    // Melodic contour feedback
    const contourMessages: Record<string, string> = {
      arch: 'Melody will rise to a peak then fall (arch shape)',
      valley: 'Melody will fall to a valley then rise',
      ascending: 'Melody will gradually climb higher',
      descending: 'Melody will gradually descend',
      wave: 'Melody will alternate between ascending and descending phrases',
      random: 'Melody will have unpredictable pitch movement',
    };
    messages.push(contourMessages[settings.melodicContour] || '');

    return messages.join('. ');
  }
}

// Export singleton instance getter as default
export default IntelligentMelodyService.getInstance;
