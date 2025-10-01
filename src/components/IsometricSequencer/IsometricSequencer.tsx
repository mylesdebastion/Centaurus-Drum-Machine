import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ArrowLeft, Play, Pause, RotateCcw, Shuffle, Music, Zap, Lightbulb, Gamepad2 } from 'lucide-react';
import { SingleLaneVisualizer } from '../../utils/SingleLaneVisualizer';
import { LEDStripManager } from '../LEDStripManager/LEDStripManager';
import { APC40Controller, APC40ButtonEvent } from '../../utils/APC40Controller';

interface IsometricSequencerProps {
  onBack: () => void;
}

// Vector3 class for 3D calculations
class Vec3 {
  constructor(public x = 0, public y = 0, public z = 0) {}

  add(v: Vec3): Vec3 {
    return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z);
  }

  subtract(v: Vec3): Vec3 {
    return new Vec3(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  multiply(scalar: number): Vec3 {
    return new Vec3(this.x * scalar, this.y * scalar, this.z * scalar);
  }

  dot(v: Vec3): number {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  cross(v: Vec3): Vec3 {
    return new Vec3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }

  normalize(): Vec3 {
    const length = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    if (length === 0) return new Vec3();
    return new Vec3(this.x / length, this.y / length, this.z / length);
  }
}

// 3D Camera class
class Camera3D {
  position = new Vec3(0, 0, 0);
  target = new Vec3(0, 0, -1);
  up = new Vec3(0, 1, 0);
  fov = 90; // Maximum wide field of view to see all 12 lanes including B
  near = 1;  // Moved near plane further to prevent clipping
  far = 2000; // Extended far plane for better depth range

  lookAt(position: Vec3, target: Vec3, up: Vec3) {
    this.position = position;
    this.target = target;
    this.up = up;
  }

  getViewMatrix() {
    const forward = this.target.subtract(this.position).normalize();
    const right = forward.cross(this.up).normalize();
    const realUp = right.cross(forward);

    return {
      right,
      up: realUp,
      forward,
      position: this.position
    };
  }

  project(point: Vec3, canvasWidth: number, canvasHeight: number) {
    const view = this.getViewMatrix();

    const translated = point.subtract(this.position);
    const x = translated.dot(view.right);
    const y = translated.dot(view.up);
    const z = translated.dot(view.forward);

    // Improved near clipping to prevent grid lines from disappearing
    if (z <= this.near || z >= this.far) return null;

    const fovRad = (this.fov * Math.PI) / 180;
    const scale = Math.tan(fovRad / 2) * z;
    const aspect = canvasWidth / canvasHeight;

    const screenX = (x / scale) * (canvasWidth / 2) + (canvasWidth / 2);
    const screenY = (-y / (scale / aspect)) * (canvasHeight / 2) + (canvasHeight / 2);

    // Ensure projected coordinates are within reasonable bounds
    if (screenX < -canvasWidth || screenX > canvasWidth * 2 ||
        screenY < -canvasHeight || screenY > canvasHeight * 2) {
      return null;
    }

    return { x: screenX, y: screenY, z };
  }
}

export const IsometricSequencer: React.FC<IsometricSequencerProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const audioContextRef = useRef<AudioContext>();
  const masterGainRef = useRef<GainNode>();

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [selectedRoot, setSelectedRoot] = useState('C'); // Root note (C, D, E, etc.)
  const [selectedScale, setSelectedScale] = useState('major'); // Scale type (major, minor, etc.)
  const [showAllNotes, setShowAllNotes] = useState(false); // Toggle between scale and chromatic
  const [useHarmonicColors, setUseHarmonicColors] = useState(false); // Toggle Circle of Fifths harmonic color arrangement
  const [pattern, setPattern] = useState<boolean[][]>(
    Array(12).fill(null).map(() => Array(16).fill(false))
  );
  // Mouse position tracking removed - not currently used
  // const [mousePos, setMousePos] = useState<{x: number, y: number} | null>(null);
  const [hoveredNote, setHoveredNote] = useState<{lane: number, step: number} | null>(null);

  // LED visualization state
  const [showLEDManager, setShowLEDManager] = useState(false);
  const [ledVisualizers, setLEDVisualizers] = useState<SingleLaneVisualizer[]>([]);
  const [ledEnabled, setLEDEnabled] = useState(false);
  // Animation mode toggle (default to smooth scrolling for better musical flow)
  const [smoothScrolling, setSmoothScrolling] = useState(true);

  // APC40 hardware control state
  const [apc40Controller] = useState(() => new APC40Controller());
  const [apc40Connected, setAPC40Connected] = useState(false);
  const [apc40ColorMode, setAPC40ColorMode] = useState<'spectrum' | 'chromatic' | 'harmonic'>('spectrum');

  // Constants
  const lanes = 12;
  const steps = 16;
  const worldLaneWidth = 80; // Reduced to accommodate 12 lanes
  const worldStepDepth = 120;
  const worldLaneHeight = 10;

  // Official Boomwhacker colors for complete chromatic scale
  const boomwhackerColors = [
    '#ff4444', // C - Red
    '#ff8844', // C# - Orange-Red
    '#ffaa44', // D - Orange
    '#ffcc44', // D# - Yellow-Orange
    '#ffff44', // E - Yellow
    '#aaff44', // F - Yellow-Green
    '#66ff44', // F# - Green-Yellow
    '#44ff44', // G - Green
    '#44ffaa', // G# - Blue-Green
    '#44aaff', // A - Blue
    '#4466ff', // A# - Blue-Purple
    '#6644ff'  // B - Purple
  ];

  // Complete chromatic scale frequencies (C4 to B4)
  const noteFrequencies = [
    261.63, // C4
    277.18, // C#4
    293.66, // D4
    311.13, // D#4
    329.63, // E4
    349.23, // F4
    369.99, // F#4
    392.00, // G4
    415.30, // G#4
    440.00, // A4
    466.16, // A#4
    493.88  // B4
  ];

  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // Root note positions (0 = C, 1 = C#, 2 = D, etc.)
  const rootNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // Circle of Fifths root note sequence (C-G-D-A-E-B-F#-C#-G#-D#-A#-F)
  // const circleOfFifthsRoots = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#', 'F']; // Unused - kept for reference
  const rootPositions = {
    'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
    'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
  };

  // Scale interval patterns (semitones from root)
  const scalePatterns = {
    'major': [0, 2, 4, 5, 7, 9, 11],        // Major scale (Ionian)
    'minor': [0, 2, 3, 5, 7, 8, 10],        // Natural minor scale (Aeolian)
    'dorian': [0, 2, 3, 5, 7, 9, 10],       // Dorian mode
    'phrygian': [0, 1, 3, 5, 7, 8, 10],     // Phrygian mode
    'lydian': [0, 2, 4, 6, 7, 9, 11],       // Lydian mode
    'mixolydian': [0, 2, 4, 5, 7, 9, 10],   // Mixolydian mode
    'locrian': [0, 1, 3, 5, 6, 8, 10],      // Locrian mode
    'harmonic_minor': [0, 2, 3, 5, 7, 8, 11], // Harmonic minor
    'melodic_minor': [0, 2, 3, 5, 7, 9, 11],  // Melodic minor
    'pentatonic_major': [0, 2, 4, 7, 9],      // Major pentatonic
    'pentatonic_minor': [0, 3, 5, 7, 10],     // Minor pentatonic
    'blues': [0, 3, 5, 6, 7, 10],             // Blues scale
    'circle_of_fifths': [0, 7, 2, 9, 4, 11]   // Circle of Fifths pattern (C-G-D-A-E-B)
  };

  // Function to generate harmonic color mapping based on Circle of Fifths
  const getHarmonicColorMapping = () => {
    const rootPos = rootPositions[selectedRoot as keyof typeof rootPositions];

    // Circle of Fifths starting from current root (perfect fifth intervals)
    const circleOrder = [];
    let currentNote = rootPos;

    for (let i = 0; i < 12; i++) {
      circleOrder.push(currentNote);
      currentNote = (currentNote + 7) % 12; // Move up by perfect fifth (7 semitones)
    }

    return circleOrder;
  };

  // Function to get effective lane order (either chromatic or Circle of Fifths)
  const getEffectiveLaneOrder = () => {
    if (!useHarmonicColors) {
      // Standard chromatic order: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 (C, C#, D, D#, E, F, F#, G, G#, A, A#, B)
      return Array.from({ length: 12 }, (_, i) => i);
    }

    // Circle of Fifths order starting from current root
    return getHarmonicColorMapping();
  };

  // Function to get effective colors (using Circle of Fifths progression colors)
  const getEffectiveColors = () => {
    if (!useHarmonicColors) {
      return boomwhackerColors;
    }

    // Create harmonic color array where each lane position gets progressive colors
    const harmonicColors = new Array(12);

    // Use smooth color transitions for Circle of Fifths progression
    const progressiveHues = [
      '#ff4444', // 1st in progression - Strong Red
      '#ff8844', // 2nd in progression - Warm Orange
      '#ffaa44', // 3rd in progression - Orange
      '#ffcc44', // 4th in progression - Yellow-Orange
      '#ffff44', // 5th in progression - Yellow
      '#aaff44', // 6th in progression - Yellow-Green
      '#66ff44', // 7th in progression - Green
      '#44ff44', // 8th in progression - Bright Green
      '#44ffaa', // 9th in progression - Blue-Green
      '#44aaff', // 10th in progression - Blue
      '#4466ff', // 11th in progression - Blue-Purple
      '#6644ff'  // 12th in progression - Purple
    ];

    // Assign colors to physical lane positions
    for (let i = 0; i < 12; i++) {
      harmonicColors[i] = progressiveHues[i];
    }

    return harmonicColors;
  };

  // Function to get current scale notes
  const getCurrentScale = () => {
    const rootPos = rootPositions[selectedRoot as keyof typeof rootPositions];
    const pattern = scalePatterns[selectedScale as keyof typeof scalePatterns];
    return pattern.map(interval => (rootPos + interval) % 12);
  };

  // Legacy majorScales for backward compatibility (now computed dynamically)
  // Preserved for potential future use
  // const majorScales = rootNotes.reduce((acc, root) => {
  //   const rootPos = rootPositions[root as keyof typeof rootPositions];
  //   acc[root] = scalePatterns.major.map(interval => (rootPos + interval) % 12);
  //   return acc;
  // }, {} as Record<string, number[]>);

  // Get active lanes based on current mode
  const getActiveLanes = () => {
    if (showAllNotes) {
      // All 12 chromatic notes - use effective lane order for Circle of Fifths
      return getEffectiveLaneOrder();
    }

    // Scale mode - need to get scale notes in effective order
    const scaleNotes = getCurrentScale();

    if (!useHarmonicColors) {
      // Normal chromatic order
      return scaleNotes;
    }

    // Circle of Fifths mode: filter the Circle of Fifths order to only include scale notes
    const circleOrder = getEffectiveLaneOrder();
    return circleOrder.filter(chromaticLane => scaleNotes.includes(chromaticLane));
  };

  const activeLanes = getActiveLanes();
  const effectiveLanes = activeLanes.length;

  // 3D mouse interaction detection
  const getMouseWorldPosition = useCallback((mouseX: number, mouseY: number, canvasWidth: number, canvasHeight: number) => {
    const totalWorldWidth = effectiveLanes * worldLaneWidth;
    const startX = -totalWorldWidth / 2 + worldLaneWidth / 2; // Center the first lane

    // Find closest lane
    let closestLane = -1;
    let closestStep = -1;
    let minDistance = Infinity;

    for (let laneIndex = 0; laneIndex < effectiveLanes; laneIndex++) {
      const laneX = startX + laneIndex * worldLaneWidth; // Directly on the lane line

      for (let step = 0; step < steps; step++) {
        const stepZ = -step * worldStepDepth;
        const worldPos = new Vec3(laneX, 0, stepZ);
        const screenPos = camera.current.project(worldPos, canvasWidth, canvasHeight);

        if (screenPos && screenPos.z > 0.1) {
          const distance = Math.sqrt(
            Math.pow(screenPos.x - mouseX, 2) +
            Math.pow(screenPos.y - mouseY, 2)
          );

          if (distance < minDistance && distance < 50) { // 50px tolerance
            minDistance = distance;
            closestLane = laneIndex;
            closestStep = step;
          }
        }
      }
    }

    if (closestLane >= 0 && closestStep >= 0) {
      return {
        laneIndex: closestLane,
        chromaticLane: activeLanes[closestLane],
        step: closestStep
      };
    }

    return null;
  }, [effectiveLanes, activeLanes, worldLaneWidth, worldStepDepth, steps]);

  const camera = useRef(new Camera3D());
  const lastBeatTime = useRef(0);

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGainRef.current = audioContextRef.current.createGain();
    masterGainRef.current.connect(audioContextRef.current.destination);
    masterGainRef.current.gain.value = 0.3;

    return () => {
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
    };
  }, []);

  // Play note function
  const playNote = useCallback((laneIndex: number) => {
    if (!audioContextRef.current || !masterGainRef.current) return;

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(masterGainRef.current);

    oscillator.frequency.setValueAtTime(noteFrequencies[laneIndex], audioContextRef.current.currentTime);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.5, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.3);

    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + 0.3);
  }, []);

  // Canvas resize handler
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
  }, []);

  // Setup canvas
  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Draw starfield background
  const drawStarfield = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Night sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#000000');
    gradient.addColorStop(0.3, '#0a0a1a');
    gradient.addColorStop(0.7, '#1a0033');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Animated stars - very slow, subtle movement
    const time = performance.now() * 0.0001; // Extremely slow movement
    const starCount = 150; // More stars for better distribution

    for (let i = 0; i < starCount; i++) {
      const x = (Math.sin(time * 0.02 + i * 0.7) * 0.8 + 0.5) * width; // Very slow drift
      const y = (Math.cos(time * 0.03 + i * 1.1) * 0.8 + 0.5) * height; // Very slow drift
      const size = Math.sin(time * 0.8 + i) * 0.8 + 1.5; // Slow size variation
      const twinkle = Math.sin(time * 1.2 + i * 1.5) * 0.2 + 0.6; // Very slow twinkle

      ctx.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();

      // Add star glow
      ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
      ctx.shadowBlur = 4;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }, []);

  // Draw isometric block with neon glow
  const drawIsometricBlock = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    depth: number,
    color: string,
    isActive = false
  ) => {
    const topColor = isActive ? '#FFFFFF' : color;
    const rightColor = isActive ? '#E0E0E0' : adjustBrightness(color, 0.85);
    const frontColor = isActive ? '#C0C0C0' : adjustBrightness(color, 0.7);

    ctx.save();

    // Add glow effect
    if (isActive) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 20;
    } else {
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
    }

    // Draw top face
    ctx.fillStyle = topColor;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.lineTo(x + width + depth * 0.5, y - depth * 0.5);
    ctx.lineTo(x + depth * 0.5, y - depth * 0.5);
    ctx.closePath();
    ctx.fill();

    // Draw right face
    ctx.fillStyle = rightColor;
    ctx.beginPath();
    ctx.moveTo(x + width, y);
    ctx.lineTo(x + width + depth * 0.5, y - depth * 0.5);
    ctx.lineTo(x + width + depth * 0.5, y + height - depth * 0.5);
    ctx.lineTo(x + width, y + height);
    ctx.closePath();
    ctx.fill();

    // Draw front face
    ctx.fillStyle = frontColor;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x + width, y);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }, []);

  // Utility function to adjust color brightness
  const adjustBrightness = useCallback((color: string, factor: number) => {
    const hex = color.replace('#', '');
    const r = Math.floor(parseInt(hex.substr(0, 2), 16) * factor);
    const g = Math.floor(parseInt(hex.substr(2, 2), 16) * factor);
    const b = Math.floor(parseInt(hex.substr(4, 2), 16) * factor);
    return `rgb(${Math.min(255, r)}, ${Math.min(255, g)}, ${Math.min(255, b)})`;
  }, []);

  // Draw 3D text labels for lanes
  const draw3DLaneLabels = useCallback((
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    startX: number
  ) => {
    // Position labels much closer to camera and fixed relative to camera position
    const currentBeatZ = -currentBeat * worldStepDepth;
    const beatDuration = (60 / bpm) * 1000;
    const timeSinceLastBeat = performance.now() - lastBeatTime.current;
    const beatProgress = Math.min(timeSinceLastBeat / beatDuration, 1);

    const nextBeatZ = -((currentBeat + 1) % steps) * worldStepDepth;
    let targetZ = nextBeatZ;
    if (currentBeat === steps - 1) {
      targetZ = -steps * worldStepDepth;
    }

    // Choose animation style based on toggle
    const easedProgress = smoothScrolling
      ? beatProgress // Linear progression for smooth scrolling
      : beatProgress < 0.5 ? 2 * beatProgress * beatProgress : -1 + (4 - 2 * beatProgress) * beatProgress; // Eased "jumping" movement
    const interpolatedZ = currentBeatZ + (targetZ - currentBeatZ) * easedProgress;

    // Position labels fixed relative to camera position so they stay at bottom
    const labelZ = interpolatedZ + 180; // Closer to action for better visibility
    const labelY = -15; // Further below ground level for clearer bottom positioning

    for (let laneIndex = 0; laneIndex < effectiveLanes; laneIndex++) {
      const chromaticLane = activeLanes[laneIndex];
      const x = startX + laneIndex * worldLaneWidth + worldLaneWidth / 2; // Center of lane

      const labelPos = camera.current.project(new Vec3(x, labelY, labelZ), width, height);

      if (labelPos && labelPos.z > 0.1) {
        const distance = labelPos.z;
        const scale = Math.max(0.8, 300 / distance);
        const fontSize = Math.max(16, 28 * scale);

        // Check if this lane is in the selected scale for dimming
        const isShowingAllNotes = effectiveLanes === 12;
        const hasSelectedScale = selectedRoot !== 'C' || selectedScale !== 'major';
        const currentScaleNotes = getCurrentScale();
        const isInKey = !isShowingAllNotes || !hasSelectedScale || currentScaleNotes.includes(chromaticLane);
        const labelOpacity = isInKey ? 1.0 : 0.4;

        ctx.save();

        // Apply dimming to the color
        const effectiveColors = getEffectiveColors();
        const color = effectiveColors[chromaticLane];
        const rgb = color.match(/\w\w/g);
        if (rgb) {
          const [r, g, b] = rgb.map((x: string) => parseInt(x, 16));
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${labelOpacity})`;
        } else {
          ctx.fillStyle = color;
        }

        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Add glow effect, dimmed for out-of-key notes
        const shadowOpacity = isInKey ? 1.0 : 0.3;
        if (rgb) {
          const [r, g, b] = rgb.map((x: string) => parseInt(x, 16));
          ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${shadowOpacity})`;
        } else {
          ctx.shadowColor = effectiveColors[chromaticLane];
        }
        ctx.shadowBlur = 20;

        // Draw the note name
        ctx.fillText(noteNames[chromaticLane], labelPos.x, labelPos.y);

        // Add second layer for extra brightness
        ctx.shadowBlur = 12;
        ctx.fillText(noteNames[chromaticLane], labelPos.x, labelPos.y);

        // Add third layer for maximum visibility
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 0.8;
        ctx.fillText(noteNames[chromaticLane], labelPos.x, labelPos.y);

        ctx.restore();
      }
    }
  }, [effectiveLanes, activeLanes, worldLaneWidth, noteNames, getEffectiveColors(), currentBeat, bpm, steps, worldStepDepth, selectedRoot, selectedScale, getCurrentScale, useHarmonicColors]);

  // Setup camera for 3D view
  const setupCamera = useCallback(() => {
    const beatDuration = (60 / bpm) * 1000;
    const timeSinceLastBeat = performance.now() - lastBeatTime.current;
    const beatProgress = Math.min(timeSinceLastBeat / beatDuration, 1);

    const currentBeatZ = -currentBeat * worldStepDepth;
    const nextBeatZ = -((currentBeat + 1) % steps) * worldStepDepth;

    let targetZ = nextBeatZ;
    if (currentBeat === steps - 1) {
      targetZ = -steps * worldStepDepth;
    }

    // Choose animation style based on toggle
    const easedProgress = smoothScrolling
      ? beatProgress // Linear progression for smooth scrolling
      : beatProgress < 0.5 ? 2 * beatProgress * beatProgress : -1 + (4 - 2 * beatProgress) * beatProgress; // Eased "jumping" movement
    const interpolatedZ = currentBeatZ + (targetZ - currentBeatZ) * easedProgress;

    // Optimized camera positioning to show grid alignment clearly
    const cameraDistance = 750; // Slightly closer for better grid line visibility
    const cameraHeight = 260;   // Slightly lower to emphasize grid alignment
    const lookAheadDistance = 400; // Reduced for better focus on current beat area

    // Position camera to ensure strike zone (active notes) is clearly visible
    const strikeZoneZ = interpolatedZ + 50; // Strike zone positioned slightly ahead
    const cameraPos = new Vec3(0, cameraHeight, strikeZoneZ + cameraDistance);
    const targetPos = new Vec3(0, 0, strikeZoneZ - lookAheadDistance);
    const upVector = new Vec3(0, 1, 0);

    // Ensure camera maintains minimum distance from strike zone
    const minCameraZ = strikeZoneZ + 200;
    if (cameraPos.z < minCameraZ) {
      cameraPos.z = minCameraZ;
    }

    camera.current.lookAt(cameraPos, targetPos, upVector);
  }, [bpm, currentBeat]);

  // Draw 3D world
  const draw3DWorld = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    setupCamera();

    const totalWorldWidth = effectiveLanes * worldLaneWidth;
    const startX = -totalWorldWidth / 2 + worldLaneWidth / 2; // Center the first lane
    const trackDepth = steps * worldStepDepth;

    // Save context state
    ctx.save();

    // Draw lane dividers with note-specific colors (only interior dividers) - continuous loop
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    // Draw dividers based on current mode
    if (showAllNotes) {
      // When showing all notes, draw all 12 lane lines with dimming for out-of-key notes
      const currentScale = getCurrentScale();

      for (let laneIndex = 0; laneIndex < effectiveLanes; laneIndex++) {
        const x = startX + laneIndex * worldLaneWidth;
        const chromaticLane = activeLanes[laneIndex]; // Use effective lane order
        const effectiveColors = getEffectiveColors();
        const laneColor = effectiveColors[chromaticLane];

        // Check if this lane is in the current key
        const isInKey = currentScale.includes(chromaticLane);
        const opacity = isInKey ? 0.8 : 0.3; // Dim out-of-key lanes

        // Convert hex to rgba for transparency
        const r = parseInt(laneColor.substr(1, 2), 16);
        const g = parseInt(laneColor.substr(3, 2), 16);
        const b = parseInt(laneColor.substr(5, 2), 16);

        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        ctx.shadowColor = isInKey ? laneColor : 'transparent';
        ctx.shadowBlur = isInKey ? 10 : 0;

        // Use multiple points for better line visibility - extended for continuous loop
        const points = [];
        const extendedDepth = trackDepth * 2; // Extend to cover both cycles
        for (let i = 0; i <= 20; i++) { // More points for longer lines
          const z = -(i / 20) * extendedDepth;
          const point = camera.current.project(new Vec3(x, 0, z), width, height);
          if (point && point.z > 0.1) { // Improved near clipping
            points.push(point);
          }
        }

        // Draw continuous line if we have enough points
        if (points.length >= 2) {
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
          }
          ctx.stroke();

          // Add secondary glow for in-key notes only
          if (isInKey) {
            ctx.shadowBlur = 20;
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.4)`;
            ctx.lineWidth = 8;
            ctx.stroke();
          }

          // Reset for next line
          ctx.lineWidth = 6; // Thicker lines for better visibility
          ctx.shadowBlur = 10;
        }
      }
    } else {
      // Scale mode - draw lane lines for each active note in the scale
      for (let laneIndex = 0; laneIndex < effectiveLanes; laneIndex++) {
        const x = startX + laneIndex * worldLaneWidth;

        // Use the color of this active lane
        const activeLaneIndex = activeLanes[laneIndex];
        const effectiveColors = getEffectiveColors();
        const laneColor = effectiveColors[activeLaneIndex];

        // Convert hex to rgba for transparency
        const r = parseInt(laneColor.substr(1, 2), 16);
        const g = parseInt(laneColor.substr(3, 2), 16);
        const b = parseInt(laneColor.substr(5, 2), 16);

        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
        ctx.shadowColor = laneColor;
        ctx.shadowBlur = 10;

        // Use multiple points for better line visibility - extended for continuous loop
        const points = [];
        const extendedDepth = trackDepth * 2; // Extend to cover both cycles
        for (let i = 0; i <= 20; i++) { // More points for longer lines
          const z = -(i / 20) * extendedDepth;
          const point = camera.current.project(new Vec3(x, 0, z), width, height);
          if (point && point.z > 0.1) { // Improved near clipping
            points.push(point);
          }
        }

        // Draw continuous line if we have enough points
        if (points.length >= 2) {
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
          }
          ctx.stroke();

          // Add secondary glow for better visibility
          ctx.shadowBlur = 20;
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.4)`;
          ctx.lineWidth = 8;
          ctx.stroke();

          // Reset for next line
          ctx.lineWidth = 6; // Thicker lines for better visibility
          ctx.shadowBlur = 10;
        }
      }
    }

    ctx.shadowBlur = 0;

    // Draw beat lines with enhanced visibility - every beat with continuous looping
    ctx.setLineDash([5, 5]); // Dashed lines for better visibility

    // Draw two cycles of grid lines for seamless looping
    for (let cycle = 0; cycle < 2; cycle++) {
      for (let step = 0; step < steps; step++) {
        const z = -(step + cycle * steps) * worldStepDepth;

        // Different styling for different beat types
        const opacity = cycle === 0 ? 1.0 : 0.5; // Fade second cycle
        if (step % 4 === 0) {
          // Strong beats (downbeats) - brighter and thicker
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.7 * opacity})`;
          ctx.lineWidth = 3;
        } else {
          // Regular beats - more subtle
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 * opacity})`;
          ctx.lineWidth = 1;
        }

        // Sample multiple points across the width for better line rendering
        const points = [];
        for (let i = 0; i <= 8; i++) {
          const x = startX + (i / 8) * totalWorldWidth;
          const point = camera.current.project(new Vec3(x, 0, z), width, height);
          if (point && point.z > 0.1) {
            points.push(point);
          }
        }

        if (points.length >= 2) {
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
          }
          ctx.stroke();
        }
      }
    }

    // Reset line dash
    ctx.setLineDash([]);
    ctx.restore();

    // Draw notes as glowing isometric blocks with continuous looping
    const time = performance.now() * 0.001;

    for (let laneIndex = 0; laneIndex < effectiveLanes; laneIndex++) {
      const chromaticLane = activeLanes[laneIndex];

      // Check if this lane is in the selected scale for dimming
      const isShowingAllNotes = effectiveLanes === 12;
      const hasSelectedScale = selectedRoot !== 'C' || selectedScale !== 'major';
      const currentScaleNotes = getCurrentScale();
      const isInKey = !isShowingAllNotes || !hasSelectedScale || currentScaleNotes.includes(chromaticLane);
      const noteOpacity = isInKey ? 1.0 : 0.4;

      // Draw two copies of the pattern for seamless looping
      for (let cycle = 0; cycle < 2; cycle++) {
        for (let step = 0; step < steps; step++) {
          if (pattern[chromaticLane][step]) {
            const x = startX + laneIndex * worldLaneWidth; // Directly on the lane line
            const z = -(step + cycle * steps) * worldStepDepth; // Offset second cycle
            const floatOffset = Math.sin(time * 2 + laneIndex + step) * 5;
            const y = worldLaneHeight + floatOffset;

            const isActive = isPlaying && step === currentBeat && cycle === 0; // Only first cycle can be active

            const screenPos = camera.current.project(new Vec3(x, y, z), width, height);

            if (screenPos && screenPos.z > 0.1) { // Improved near clipping
              const distance = screenPos.z;
              const scale = Math.max(0.2, 400 / distance); // Improved scaling for better visibility
              let blockSize = 40 * scale;

              // Make active notes much larger and more visible
              if (isActive) {
                blockSize *= 1.5; // 50% larger for active notes

                // Add pulsing effect for active notes
                const pulseScale = 1 + Math.sin(time * 8) * 0.3;
                blockSize *= pulseScale;
              }

              // Ensure minimum size for visibility
              blockSize = Math.max(blockSize, isActive ? 30 : 15);

              // Slightly fade the second cycle for depth perception and apply key-based dimming
              const baseOpacity = cycle === 0 ? 1.0 : 0.7;
              const finalOpacity = baseOpacity * noteOpacity;

              ctx.save();
              ctx.globalAlpha = finalOpacity;

              // Use correct color mapping:
              // - In "all notes" mode: use chromatic lane color (chromaticLane)
              // - In scale mode: use the color of the active lane at this visual position (activeLanes[laneIndex])
              const effectiveColors = getEffectiveColors();
              const cubeColor = showAllNotes ? effectiveColors[chromaticLane] : effectiveColors[activeLanes[laneIndex]];

              drawIsometricBlock(
                ctx,
                screenPos.x - blockSize / 2,
                screenPos.y - blockSize / 2,
                blockSize,
                blockSize,
                blockSize * 0.6,
                cubeColor,
                isActive
              );

              // Add extra glow for active notes
              if (isActive) {
                ctx.shadowColor = '#FFFFFF';
                ctx.shadowBlur = 40;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, blockSize * 0.8, 0, Math.PI * 2);
                ctx.fill();
              }

              ctx.restore();
            }
          }
        }
      }
    }

    // Draw strike zone perfectly aligned with current beat grid line
    const hitZoneZ = -currentBeat * worldStepDepth; // Align exactly with current beat grid line

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 8;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
    ctx.shadowBlur = 20;

    // Draw a more visible strike zone that extends across all 12 lanes
    const strikeZoneExtension = 120; // Extended further to ensure all lanes are covered
    const leftPoint = camera.current.project(new Vec3(startX - strikeZoneExtension, 0, hitZoneZ), width, height);
    const rightPoint = camera.current.project(new Vec3(startX + totalWorldWidth + strikeZoneExtension, 0, hitZoneZ), width, height);

    if (leftPoint && rightPoint) {
      // Draw main strike line
      ctx.beginPath();
      ctx.moveTo(leftPoint.x, leftPoint.y);
      ctx.lineTo(rightPoint.x, rightPoint.y);
      ctx.stroke();

      // Draw additional glow effect
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 16;
      ctx.stroke();
    }

    ctx.shadowBlur = 0;

    // Draw ghost note preview
    if (hoveredNote) {
      // Find the visual lane index for this chromatic lane
      const visualLaneIndex = activeLanes.indexOf(hoveredNote.lane);
      if (visualLaneIndex >= 0) {
        const x = startX + visualLaneIndex * worldLaneWidth; // Directly on the lane line
        const z = -hoveredNote.step * worldStepDepth;
        const y = worldLaneHeight;

        const screenPos = camera.current.project(new Vec3(x, y, z), width, height);

        if (screenPos && screenPos.z > 0.1) {
          const distance = screenPos.z;
          const scale = Math.max(0.2, 400 / distance);
          const blockSize = 40 * scale;

          ctx.save();

          // Ghost note styling - semi-transparent with white outline
          const existingNote = pattern[hoveredNote.lane][hoveredNote.step];
          if (existingNote) {
            // Highlight existing note for removal
            ctx.globalAlpha = 1.0;
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 4;
            ctx.shadowColor = '#FFFFFF';
            ctx.shadowBlur = 15;
          } else {
            // Ghost note for placement
            ctx.globalAlpha = 0.5;
            // Use correct color mapping for ghost note to match the lane it appears in
            const ghostColor = showAllNotes ? boomwhackerColors[hoveredNote.lane] : boomwhackerColors[activeLanes[visualLaneIndex]];
            ctx.strokeStyle = ghostColor;
            ctx.lineWidth = 3;
            ctx.shadowColor = ghostColor;
            ctx.shadowBlur = 10;
          }

          // Draw outline only for ghost effect
          ctx.beginPath();
          ctx.rect(
            screenPos.x - blockSize / 2,
            screenPos.y - blockSize / 2,
            blockSize,
            blockSize
          );
          ctx.stroke();

          // Add center dot for better visibility
          const dotColor = existingNote ? '#FFFFFF' : (showAllNotes ? boomwhackerColors[hoveredNote.lane] : boomwhackerColors[activeLanes[visualLaneIndex]]);
          ctx.fillStyle = dotColor;
          ctx.beginPath();
          ctx.arc(screenPos.x, screenPos.y, 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      }
    }

    // Draw 3D lane labels
    draw3DLaneLabels(ctx, width, height, startX);
    ctx.restore();
  }, [
    pattern,
    effectiveLanes,
    activeLanes,
    steps,
    currentBeat,
    isPlaying,
    setupCamera,
    drawIsometricBlock,
    getEffectiveColors(),
    draw3DLaneLabels,
    hoveredNote,
    selectedRoot,
    selectedScale,
    getCurrentScale,
    showAllNotes
  ]);

  // LED update function (called from animation loop)
  const updateLEDs = useCallback(async () => {
    if (!ledEnabled || ledVisualizers.length === 0) return;

    // Get active lanes for potential future use
    // const activeLanes = getActiveLanes();

    // Calculate beat progress for smooth animation (same as 3D visualization)
    const beatDuration = (60 / bpm) * 1000;
    const timeSinceLastBeat = performance.now() - lastBeatTime.current;
    const beatProgress = Math.min(timeSinceLastBeat / beatDuration, 1);

    // Create synchronized timestamp for all LED strips to ensure multi-notes strips show same colors
    const globalTimestamp = Date.now();

    // Note: Removed maxColorCount calculation since we restored original color blending

    for (const visualizer of ledVisualizers) {
      const config = visualizer.getConfig();

      // LED strips should always work regardless of 3D visualization mode
      try {
        let patternData: boolean[] | boolean[][];
        let laneColor: string;

        if (config.multiNotesMode && config.assignedLanes.length > 0) {
          // Multi-notes mode: gather patterns from all assigned lanes
          patternData = config.assignedLanes.map(laneIndex => pattern[laneIndex] || []);
          laneColor = boomwhackerColors[config.assignedLanes[0]]; // Use first lane color as fallback
        } else {
          // Single lane mode
          patternData = pattern[config.laneIndex] || [];
          laneColor = boomwhackerColors[config.laneIndex];
        }

        await visualizer.updateStrip(
          patternData,
          currentBeat,
          isPlaying,
          laneColor,
          false, // TODO: implement solo logic if needed
          false, // TODO: implement mute logic if needed
          beatProgress, // Pass beat progress for smooth animation
          smoothScrolling, // Pass animation mode to LED visualizer
          globalTimestamp // Pass synchronized timestamp for multi-notes color coordination
        );
      } catch (error) {
        console.warn(`Failed to update LED strip for lane ${config.laneIndex}:`, error);
      }
    }
  }, [ledEnabled, ledVisualizers, pattern, currentBeat, isPlaying, boomwhackerColors, showAllNotes, getActiveLanes, bpm]);

  // APC40 hardware integration
  useEffect(() => {
    // Set up APC40 event handlers
    apc40Controller.setButtonPressHandler(handleAPC40ButtonPress);
    apc40Controller.setConnectionChangeHandler(setAPC40Connected);
    apc40Controller.setColorMode(apc40ColorMode);

    // Cleanup on unmount
    return () => {
      apc40Controller.disconnect();
    };
  }, [apc40Controller, apc40ColorMode]);

  // Auto-switch APC40 color mode based on Circle of Fifths setting
  useEffect(() => {
    const newColorMode = useHarmonicColors ? 'harmonic' : 'chromatic';
    setAPC40ColorMode(newColorMode);
    apc40Controller.setColorMode(newColorMode);
  }, [useHarmonicColors, apc40Controller]);

  // Handle APC40 button press
  const handleAPC40ButtonPress = useCallback((event: APC40ButtonEvent) => {
    console.log('🎛️ APC40 button press:', event);

    // Map APC40 5x8 grid to IsometricSequencer pattern
    // APC40 lanes 0-4 → first 5 active lanes (respects Circle of Fifths ordering)
    // APC40 steps 0-7 → sequencer steps 0-7 (first half of 16-step pattern)

    // Use effective lane ordering - map APC40 lane to chromatic lane
    const activeLanesArray = getActiveLanes();
    if (event.lane >= activeLanesArray.length) {
      console.warn(`APC40 lane ${event.lane} is beyond active lanes (${activeLanesArray.length})`);
      return;
    }
    const chromaticLane = activeLanesArray[event.lane];
    const step = event.step;

    // Toggle the pattern state
    setPattern(prev => {
      const newPattern = [...prev];
      newPattern[chromaticLane] = [...newPattern[chromaticLane]];
      newPattern[chromaticLane][step] = !newPattern[chromaticLane][step];
      return newPattern;
    });

    // Play note for feedback
    playNote(chromaticLane);
  }, [playNote]);

  // Update APC40 LEDs when pattern or playback state changes
  const updateAPC40LEDs = useCallback(() => {
    if (!apc40Connected) return;

    // Map the full 12-lane pattern to APC40's 5-lane display
    // Use effective lane ordering (respects Circle of Fifths when enabled)
    const activeLanesArray = getActiveLanes();
    const apc40Pattern: boolean[][] = Array(5).fill(null).map((_, apc40Lane) => {
      const chromaticLane = activeLanesArray[apc40Lane];
      return chromaticLane !== undefined ? (pattern[chromaticLane] || Array(16).fill(false)) : Array(16).fill(false);
    });

    // Update APC40 with current pattern and playback state
    apc40Controller.updateSequencerLEDs(
      apc40Pattern,
      currentBeat,
      isPlaying,
      getEffectiveColors(),
      getActiveLanes().slice(0, 5) // Only first 5 active lanes
    );
  }, [apc40Connected, pattern, currentBeat, isPlaying, boomwhackerColors, getActiveLanes, apc40Controller]);

  // Connect APC40
  const connectAPC40 = useCallback(async () => {
    try {
      await apc40Controller.connect();
      console.log('🎛️ APC40 connected successfully');
    } catch (error) {
      console.error('🚫 Failed to connect APC40:', error);
      alert('Failed to connect APC40: ' + (error as Error).message);
    }
  }, [apc40Controller]);

  // Disconnect APC40
  const disconnectAPC40 = useCallback(() => {
    apc40Controller.disconnect();
  }, [apc40Controller]);

  // Main render loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw starfield background
    drawStarfield(ctx, width, height);

    // Draw 3D world
    draw3DWorld(ctx, width, height);

    // Update LED strips every frame for smooth animation
    updateLEDs();

    // Update APC40 LEDs when pattern or beat changes
    updateAPC40LEDs();

    // Update beat timing
    if (isPlaying) {
      const now = performance.now();
      const beatDuration = (60 / bpm) * 1000;

      if (now - lastBeatTime.current >= beatDuration) {
        // Increment beat first so audio and visuals are synchronized
        const nextBeat = (currentBeat + 1) % steps;
        setCurrentBeat(nextBeat);

        // Play notes for the new current beat - only for active lanes
        for (let laneIndex = 0; laneIndex < effectiveLanes; laneIndex++) {
          const chromaticLane = activeLanes[laneIndex];
          if (pattern[chromaticLane][nextBeat]) {
            playNote(chromaticLane);
          }
        }

        lastBeatTime.current = now;
      }
    }

    animationRef.current = requestAnimationFrame(render);
  }, [isPlaying, bpm, currentBeat, pattern, lanes, steps, playNote, drawStarfield, draw3DWorld, updateLEDs, updateAPC40LEDs]);

  // Start/stop animation loop
  useEffect(() => {
    animationRef.current = requestAnimationFrame(render);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [render]);

  // Handle LED visualizers change
  const handleLEDVisualizersChange = useCallback((newVisualizers: SingleLaneVisualizer[]) => {
    setLEDVisualizers(newVisualizers);
  }, []);

  // Canvas mouse handlers
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Mouse position tracking disabled
    // setMousePos({ x: mouseX, y: mouseY });

    const worldPos = getMouseWorldPosition(mouseX, mouseY, rect.width, rect.height);
    if (worldPos) {
      setHoveredNote({
        lane: worldPos.chromaticLane,
        step: worldPos.step
      });
    } else {
      setHoveredNote(null);
    }
  }, [getMouseWorldPosition]);

  const handleCanvasMouseLeave = useCallback(() => {
    // Mouse position tracking disabled
    // setMousePos(null);
    setHoveredNote(null);
  }, []);

  const handleCanvasWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    const delta = e.deltaY > 0 ? 1 : -1; // Positive = scroll down, Negative = scroll up

    if (isPlaying) {
      // When playing, adjust BPM
      const newBpm = Math.max(60, Math.min(180, bpm + delta * 5));
      setBpm(newBpm);
    } else {
      // When paused, scrub through the sequence
      const newBeat = (currentBeat + delta + steps) % steps;
      setCurrentBeat(newBeat);

      // Play notes at the new position for feedback
      for (let laneIndex = 0; laneIndex < effectiveLanes; laneIndex++) {
        const chromaticLane = activeLanes[laneIndex];
        if (pattern[chromaticLane][newBeat]) {
          playNote(chromaticLane);
        }
      }
    }
  }, [isPlaying, bpm, currentBeat, steps, effectiveLanes, activeLanes, pattern, playNote]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldPos = getMouseWorldPosition(mouseX, mouseY, rect.width, rect.height);
    if (worldPos) {
      const { chromaticLane, step } = worldPos;

      setPattern(prev => {
        const newPattern = [...prev];
        newPattern[chromaticLane] = [...newPattern[chromaticLane]];
        newPattern[chromaticLane][step] = !newPattern[chromaticLane][step];
        return newPattern;
      });

      // Play note for feedback
      playNote(chromaticLane);
    }
  }, [getMouseWorldPosition, playNote]);

  // Control handlers
  const togglePlay = () => {
    setIsPlaying(prev => {
      if (!prev && audioContextRef.current) {
        audioContextRef.current.resume();
        lastBeatTime.current = performance.now();
      }
      return !prev;
    });
  };

  const clearPattern = () => {
    setPattern(Array(12).fill(null).map(() => Array(16).fill(false)));
  };

  const randomizePattern = () => {
    setPattern(prev => prev.map(lane =>
      lane.map(() => Math.random() < 0.15)
    ));
  };

  // Musical patterns and chord progressions
  const generateMelody = () => {
    // Clear current pattern
    const newPattern: boolean[][] = Array(12).fill(null).map(() => Array(16).fill(false));

    // Use the current root and scale
    const currentScale = getCurrentScale();
    // Build chords for the selected key
    const keyChords = {
      I: [currentScale[0], currentScale[2], currentScale[4]],    // I major (1, 3, 5)
      ii: [currentScale[1], currentScale[3], currentScale[5]],   // ii minor (2, 4, 6)
      iii: [currentScale[2], currentScale[4], currentScale[6]], // iii minor (3, 5, 7)
      IV: [currentScale[3], currentScale[5], currentScale[0]],   // IV major (4, 6, 1)
      V: [currentScale[4], currentScale[6], currentScale[1]],    // V major (5, 7, 2)
      vi: [currentScale[5], currentScale[0], currentScale[2]],   // vi minor (6, 1, 3)
      vii: [currentScale[6], currentScale[1], currentScale[3]]   // vii diminished (7, 2, 4)
    };

    // Popular chord progressions
    const progressions = [
      ['I', 'V', 'vi', 'IV'],     // Pop progression (C-G-Am-F)
      ['vi', 'IV', 'I', 'V'],     // Pop progression variation (Am-F-C-G)
      ['I', 'vi', 'ii', 'V'],     // Classic jazz turnaround
      ['I', 'IV', 'V', 'I'],      // Basic major progression
      ['vi', 'ii', 'V', 'I'],     // Minor to major resolution
      ['I', 'iii', 'vi', 'IV']    // Circle progression
    ];

    // Melodic motifs and patterns
    const melodyPatterns = [
      // Ascending scale runs
      () => {
        for (let i = 0; i < 8 && i < steps; i++) {
          const note = currentScale[i % currentScale.length];
          newPattern[note][i * 2] = true;
        }
      },
      // Descending scale runs
      () => {
        for (let i = 0; i < 8 && i < steps; i++) {
          const note = currentScale[6 - (i % currentScale.length)];
          newPattern[note][i * 2] = true;
        }
      },
      // Arpeggios
      () => {
        const chord = keyChords.I;
        for (let i = 0; i < steps; i += 2) {
          const note = chord[i % chord.length];
          newPattern[note][i] = true;
        }
      },
      // Call and response pattern
      () => {
        // Call (first 8 beats) - I chord
        keyChords.I.forEach((note, idx) => {
          newPattern[note][idx * 2] = true;
        });
        // Response (second 8 beats) - V chord
        keyChords.V.forEach((note, idx) => {
          newPattern[note][8 + idx * 2] = true;
        });
      }
    ];

    // Choose random pattern type
    const patternType = Math.random();

    if (patternType < 0.4) {
      // Generate chord progression (40% chance)
      const progression = progressions[Math.floor(Math.random() * progressions.length)];

      progression.forEach((chordName, beatIndex) => {
        const chord = keyChords[chordName as keyof typeof keyChords];
        const startBeat = beatIndex * 4; // Each chord lasts 4 beats

        // Add chord tones
        chord.forEach((note, noteIndex) => {
          if (startBeat + noteIndex < steps) {
            newPattern[note][startBeat + noteIndex] = true;
          }
        });

        // Add some rhythmic variation
        if (Math.random() < 0.6) {
          const rootNote = chord[0];
          if (startBeat + 2 < steps) {
            newPattern[rootNote][startBeat + 2] = true;
          }
        }
      });

    } else if (patternType < 0.7) {
      // Generate melodic pattern (30% chance)
      const pattern = melodyPatterns[Math.floor(Math.random() * melodyPatterns.length)];
      pattern();

      // Add some bass notes
      for (let i = 0; i < steps; i += 4) {
        if (Math.random() < 0.8) {
          newPattern[currentScale[0]][i] = true; // Add root note bass
        }
      }

    } else {
      // Generate mixed pattern with melody and harmony (30% chance)
      // Add bass line using key-specific notes
      const bassNotes = [currentScale[0], currentScale[3], currentScale[4], currentScale[0]]; // I, IV, V, I
      bassNotes.forEach((note, idx) => {
        const beat = idx * 4;
        if (beat < steps) {
          newPattern[note][beat] = true;
          // Add rhythmic bass
          if (beat + 2 < steps && Math.random() < 0.5) {
            newPattern[note][beat + 2] = true;
          }
        }
      });

      // Add melody on top using scale notes
      const melodyNotes = [currentScale[2], currentScale[4], currentScale[5], currentScale[4], currentScale[2], currentScale[1], currentScale[0]]; // 3, 5, 6, 5, 3, 2, 1
      melodyNotes.forEach((note, idx) => {
        const beat = idx * 2 + 1; // Offset from bass
        if (beat < steps) {
          newPattern[note][beat] = true;
        }
      });

      // Add some harmony
      if (Math.random() < 0.6) {
        for (let i = 8; i < steps; i += 2) {
          const harmonynote = currentScale[Math.floor(Math.random() * currentScale.length)];
          newPattern[harmonynote][i] = true;
        }
      }
    }

    // Add some subtle percussion/rhythm elements on non-scale tones occasionally
    if (Math.random() < 0.3) {
      for (let i = 0; i < steps; i += 4) {
        if (Math.random() < 0.4) {
          // Add chromatic passing tones sparingly
          const chromaticNotes = [1, 3, 6, 8, 10]; // C#, D#, F#, G#, A#
          const chromatic = chromaticNotes[Math.floor(Math.random() * chromaticNotes.length)];
          if (i + 1 < steps) {
            newPattern[chromatic][i + 1] = true;
          }
        }
      }
    }

    setPattern(newPattern);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          Isometric 3D Sequencer
        </h1>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-gray-300">BPM:</span>
            <input
              type="range"
              min="60"
              max="180"
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value))}
              className="w-20"
            />
            <span className="text-sm text-cyan-400 w-8">{bpm}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-300">Root:</span>
            <select
              value={selectedRoot}
              onChange={(e) => setSelectedRoot(e.target.value)}
              className="bg-gray-700 text-white px-2 py-1 rounded text-sm min-w-[3rem]"
            >
              {rootNotes.map(root => (
                <option key={root} value={root}>{root}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-300">Scale:</span>
            <select
              value={selectedScale}
              onChange={(e) => setSelectedScale(e.target.value)}
              className="bg-gray-700 text-white px-2 py-1 rounded text-sm min-w-[5rem]"
            >
              {Object.entries(scalePatterns).map(([scale]) => (
                <option key={scale} value={scale}>
                  {scale.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useHarmonicColors}
                onChange={(e) => setUseHarmonicColors(e.target.checked)}
                className="w-4 h-4 text-cyan-400 bg-gray-700 border-gray-600 rounded focus:ring-cyan-400 focus:ring-2"
              />
              <span className="text-sm text-gray-300">Circle of 5ths</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showAllNotes"
              checked={showAllNotes}
              onChange={(e) => setShowAllNotes(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="showAllNotes" className="text-sm text-gray-300">
              All Notes
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLEDManager(!showLEDManager)}
              className={`flex items-center gap-2 px-3 py-1 rounded transition-colors ${
                showLEDManager
                  ? 'bg-yellow-600 hover:bg-yellow-500'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <Lightbulb className="w-4 h-4" />
              LED
            </button>
            <input
              type="checkbox"
              id="ledEnabled"
              checked={ledEnabled}
              onChange={(e) => setLEDEnabled(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="ledEnabled" className="text-sm text-gray-300">
              Enable
            </label>
            <input
              type="checkbox"
              id="smoothScrolling"
              checked={smoothScrolling}
              onChange={(e) => setSmoothScrolling(e.target.checked)}
              className="w-4 h-4 ml-4"
            />
            <label htmlFor="smoothScrolling" className="text-sm text-gray-300">
              Smooth
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={apc40Connected ? disconnectAPC40 : connectAPC40}
              className={`flex items-center gap-2 px-3 py-1 rounded transition-colors ${
                apc40Connected
                  ? 'bg-green-600 hover:bg-green-500'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              APC40
            </button>

            {apc40Connected && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300">Mode:</span>
                <select
                  value={apc40ColorMode}
                  onChange={(e) => {
                    const mode = e.target.value as 'spectrum' | 'chromatic' | 'harmonic';
                    setAPC40ColorMode(mode);
                    apc40Controller.setColorMode(mode);
                  }}
                  className="bg-gray-700 text-white px-2 py-1 rounded text-sm"
                >
                  <option value="spectrum">Spectrum</option>
                  <option value="chromatic">Chromatic</option>
                  <option value="harmonic">Harmonic</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LED Strip Manager Panel */}
      {showLEDManager && (
        <div className="border-b border-gray-700">
          <LEDStripManager
            boomwhackerColors={getEffectiveColors()}
            noteNames={noteNames}
            onStripsChange={handleLEDVisualizersChange}
            pattern={pattern}
            currentStep={currentBeat}
            isPlaying={isPlaying}
            selectedRoot={selectedRoot}
            selectedScale={selectedScale}
          />
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={handleCanvasMouseLeave}
          onWheel={handleCanvasWheel}
          className="w-full h-full cursor-crosshair"
          style={{ display: 'block' }}
        />

      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 p-4 bg-gradient-to-r from-gray-900 to-gray-800 border-t border-gray-700">
        <button
          onClick={togglePlay}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 rounded-lg transition-all transform hover:scale-105 font-semibold"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          {isPlaying ? 'Pause' : 'Play'}
        </button>

        <button
          onClick={clearPattern}
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 rounded-lg transition-all transform hover:scale-105 font-semibold"
        >
          <RotateCcw className="w-5 h-5" />
          Clear
        </button>

        <button
          onClick={randomizePattern}
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 rounded-lg transition-all transform hover:scale-105 font-semibold"
        >
          <Shuffle className="w-5 h-5" />
          Random
        </button>

        <button
          onClick={generateMelody}
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 rounded-lg transition-all transform hover:scale-105 font-semibold"
        >
          <Zap className="w-5 h-5" />
          Melody
        </button>
      </div>

      {/* Instructions */}
      <div className="text-center p-4 bg-gray-900 text-gray-400 text-sm">
        <div className="mb-2">
          Click anywhere on the 3D view to add/remove notes • Use Melody for musical patterns • Random for noise • Clear to reset
        </div>
        {apc40Connected && (
          <div className="text-green-400 text-xs">
            🎛️ APC40 Connected: Use hardware buttons to control first 5 lanes (8 steps) • LEDs show pattern and playhead
          </div>
        )}
      </div>
    </div>
  );
};