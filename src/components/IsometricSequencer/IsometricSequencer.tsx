import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ArrowLeft, Play, Pause, RotateCcw, Shuffle, Music, Zap } from 'lucide-react';

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
  const [pattern, setPattern] = useState<boolean[][]>(
    Array(12).fill(null).map(() => Array(16).fill(false))
  );

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

    const easedProgress = beatProgress < 0.5 ? 2 * beatProgress * beatProgress : -1 + (4 - 2 * beatProgress) * beatProgress;
    const interpolatedZ = currentBeatZ + (targetZ - currentBeatZ) * easedProgress;

    // Position labels fixed relative to camera position so they stay at bottom
    const labelZ = interpolatedZ + 180; // Closer to action for better visibility
    const labelY = -15; // Further below ground level for clearer bottom positioning

    for (let lane = 0; lane < lanes; lane++) {
      const x = startX + lane * worldLaneWidth + worldLaneWidth / 2; // Center of lane

      const labelPos = camera.current.project(new Vec3(x, labelY, labelZ), width, height);

      if (labelPos && labelPos.z > 0.1) {
        const distance = labelPos.z;
        const scale = Math.max(0.8, 300 / distance);
        const fontSize = Math.max(16, 28 * scale);

        ctx.save();

        // Set up text styling with lane-specific color
        ctx.fillStyle = boomwhackerColors[lane];
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Add strong glow effect for better visibility
        ctx.shadowColor = boomwhackerColors[lane];
        ctx.shadowBlur = 20;

        // Draw the note name
        ctx.fillText(noteNames[lane], labelPos.x, labelPos.y);

        // Add second layer for extra brightness
        ctx.shadowBlur = 12;
        ctx.fillText(noteNames[lane], labelPos.x, labelPos.y);

        // Add third layer for maximum visibility
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 0.8;
        ctx.fillText(noteNames[lane], labelPos.x, labelPos.y);

        ctx.restore();
      }
    }
  }, [lanes, worldLaneWidth, noteNames, boomwhackerColors, currentBeat, bpm, steps, worldStepDepth]);

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

    const easedProgress = beatProgress < 0.5 ? 2 * beatProgress * beatProgress : -1 + (4 - 2 * beatProgress) * beatProgress;
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

    const totalWorldWidth = (lanes - 1) * worldLaneWidth;
    const startX = -totalWorldWidth / 2;
    const trackDepth = steps * worldStepDepth;

    // Save context state
    ctx.save();

    // Draw lane dividers with note-specific colors (only interior dividers)
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    // Only draw interior dividers between lanes (lanes-1 dividers for lanes lanes)
    for (let divider = 1; divider < lanes; divider++) {
      const x = startX + divider * worldLaneWidth;

      // Use the color of the lane to the left of this divider
      const laneColor = boomwhackerColors[divider - 1];

      // Convert hex to rgba for transparency
      const r = parseInt(laneColor.substr(1, 2), 16);
      const g = parseInt(laneColor.substr(3, 2), 16);
      const b = parseInt(laneColor.substr(5, 2), 16);

      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
      ctx.shadowColor = laneColor;
      ctx.shadowBlur = 10;

      // Use multiple points for better line visibility
      const points = [];
      for (let i = 0; i <= 10; i++) {
        const z = -(i / 10) * trackDepth;
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
        ctx.lineWidth = 4;
        ctx.shadowBlur = 10;
      }
    }

    ctx.shadowBlur = 0;

    // Draw beat lines with enhanced visibility - every beat
    ctx.setLineDash([5, 5]); // Dashed lines for better visibility

    for (let step = 0; step < steps; step++) {
      const z = -step * worldStepDepth;

      // Different styling for different beat types
      if (step % 4 === 0) {
        // Strong beats (downbeats) - brighter and thicker
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 3;
      } else {
        // Regular beats - more subtle
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
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

    // Reset line dash
    ctx.setLineDash([]);
    ctx.restore();

    // Draw notes as glowing isometric blocks
    const time = performance.now() * 0.001;

    for (let lane = 0; lane < lanes; lane++) {
      for (let step = 0; step < steps; step++) {
        if (pattern[lane][step]) {
          const x = startX + lane * worldLaneWidth;
          const z = -step * worldStepDepth;
          const floatOffset = Math.sin(time * 2 + lane + step) * 5;
          const y = worldLaneHeight + floatOffset;

          const isActive = isPlaying && step === currentBeat;

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

            drawIsometricBlock(
              ctx,
              screenPos.x - blockSize / 2,
              screenPos.y - blockSize / 2,
              blockSize,
              blockSize,
              blockSize * 0.6,
              boomwhackerColors[lane],
              isActive
            );

            // Add extra glow for active notes
            if (isActive) {
              ctx.save();
              ctx.shadowColor = '#FFFFFF';
              ctx.shadowBlur = 40;
              ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
              ctx.beginPath();
              ctx.arc(screenPos.x, screenPos.y, blockSize * 0.8, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          }
        }
      }
    }

    // Draw strike zone perfectly aligned with current beat grid line
    const hitZoneZ = -currentBeat * worldStepDepth; // Align exactly with current beat grid line

    ctx.strokeStyle = '#FF0080';
    ctx.lineWidth = 8;
    ctx.shadowColor = '#FF0080';
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
      ctx.strokeStyle = 'rgba(255, 0, 128, 0.3)';
      ctx.lineWidth = 16;
      ctx.stroke();

      // Draw center indicator
      const centerX = (leftPoint.x + rightPoint.x) / 2;
      const centerY = (leftPoint.y + rightPoint.y) / 2;
      ctx.fillStyle = '#FF0080';
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;

    // Draw 3D lane labels
    draw3DLaneLabels(ctx, width, height, startX);
  }, [pattern, lanes, steps, currentBeat, isPlaying, setupCamera, drawIsometricBlock, boomwhackerColors, draw3DLaneLabels]);

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

    // Update beat timing
    if (isPlaying) {
      const now = performance.now();
      const beatDuration = (60 / bpm) * 1000;

      if (now - lastBeatTime.current >= beatDuration) {
        // Play notes for current beat
        for (let lane = 0; lane < lanes; lane++) {
          if (pattern[lane][currentBeat]) {
            playNote(lane);
          }
        }

        setCurrentBeat(prev => (prev + 1) % steps);
        lastBeatTime.current = now;
      }
    }

    animationRef.current = requestAnimationFrame(render);
  }, [isPlaying, bpm, currentBeat, pattern, lanes, steps, playNote, drawStarfield, draw3DWorld]);

  // Start/stop animation loop
  useEffect(() => {
    animationRef.current = requestAnimationFrame(render);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [render]);

  // Canvas click handler
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    // For now, just add a simple click-to-toggle pattern
    // In full implementation, this would handle 3D click detection
    const lane = Math.floor(Math.random() * lanes);
    const step = Math.floor(Math.random() * steps);

    setPattern(prev => {
      const newPattern = [...prev];
      newPattern[lane] = [...newPattern[lane]];
      newPattern[lane][step] = !newPattern[lane][step];
      return newPattern;
    });

    // Play note for feedback
    playNote(lane);
  }, [lanes, steps, playNote]);

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

    // Define scale indices in C major (using chromatic positions)
    const cMajorScale = [0, 2, 4, 5, 7, 9, 11]; // C, D, E, F, G, A, B
    const cMajorChords = {
      I: [0, 4, 7],    // C major (C, E, G)
      ii: [2, 5, 9],   // D minor (D, F, A)
      iii: [4, 7, 11], // E minor (E, G, B)
      IV: [5, 9, 0],   // F major (F, A, C)
      V: [7, 11, 2],   // G major (G, B, D)
      vi: [9, 0, 4],   // A minor (A, C, E)
      vii: [11, 2, 5]  // B diminished (B, D, F)
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
          const note = cMajorScale[i % cMajorScale.length];
          newPattern[note][i * 2] = true;
        }
      },
      // Descending scale runs
      () => {
        for (let i = 0; i < 8 && i < steps; i++) {
          const note = cMajorScale[6 - (i % cMajorScale.length)];
          newPattern[note][i * 2] = true;
        }
      },
      // Arpeggios
      () => {
        const chord = cMajorChords.I;
        for (let i = 0; i < steps; i += 2) {
          const note = chord[i % chord.length];
          newPattern[note][i] = true;
        }
      },
      // Call and response pattern
      () => {
        // Call (first 8 beats)
        [0, 4, 7].forEach((note, idx) => {
          newPattern[note][idx * 2] = true;
        });
        // Response (second 8 beats)
        [7, 4, 0].forEach((note, idx) => {
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
        const chord = cMajorChords[chordName as keyof typeof cMajorChords];
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
          newPattern[0][i] = true; // Add C bass note
        }
      }

    } else {
      // Generate mixed pattern with melody and harmony (30% chance)
      // Add bass line
      const bassNotes = [0, 5, 7, 0]; // C, F, G, C
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

      // Add melody on top
      const melodyNotes = [4, 7, 9, 7, 4, 2, 0]; // E, G, A, G, E, D, C
      melodyNotes.forEach((note, idx) => {
        const beat = idx * 2 + 1; // Offset from bass
        if (beat < steps) {
          newPattern[note][beat] = true;
        }
      });

      // Add some harmony
      if (Math.random() < 0.6) {
        for (let i = 8; i < steps; i += 2) {
          const harmonynote = cMajorScale[Math.floor(Math.random() * cMajorScale.length)];
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
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full h-full cursor-pointer"
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
        Click anywhere on the 3D view to add/remove notes • Use Melody for musical patterns • Random for noise • Clear to reset
      </div>
    </div>
  );
};