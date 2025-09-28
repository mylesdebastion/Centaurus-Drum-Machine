import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ArrowLeft, Play, Pause, RotateCcw, Shuffle, Music } from 'lucide-react';

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
  fov = 60;
  near = 0.1;
  far = 1000;

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
    Array(8).fill(null).map(() => Array(16).fill(false))
  );

  // Constants
  const lanes = 8;
  const steps = 16;
  const worldLaneWidth = 100;
  const worldStepDepth = 120;
  const worldLaneHeight = 10;

  // Neon color palette for night theme
  const neonColors = [
    '#00FFFF', // Cyan
    '#FF00FF', // Magenta
    '#00FF00', // Lime
    '#FFFF00', // Yellow
    '#FF8000', // Orange
    '#FF0080', // Pink
    '#8000FF', // Purple
    '#80FF00'  // Green-yellow
  ];

  const noteFrequencies = [
    261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25
  ];

  const noteNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C2'];

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

    // Animated stars
    const time = performance.now() * 0.001;
    const starCount = 100;

    for (let i = 0; i < starCount; i++) {
      const x = (Math.sin(time * 0.1 + i) * 0.3 + 0.5) * width;
      const y = (Math.cos(time * 0.15 + i * 1.3) * 0.3 + 0.5) * height;
      const size = Math.sin(time * 2 + i) * 1 + 2;
      const twinkle = Math.sin(time * 3 + i * 2) * 0.3 + 0.7;

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

    // Improved camera positioning for better grid visibility
    const cameraDistance = 300; // Increased distance
    const cameraHeight = 200;   // Increased height
    const lookAheadDistance = 600; // Increased look ahead

    const cameraPos = new Vec3(0, cameraHeight, interpolatedZ + cameraDistance);
    const targetPos = new Vec3(0, 0, interpolatedZ - lookAheadDistance);
    const upVector = new Vec3(0, 1, 0);

    // Ensure camera never gets too close to the grid
    const minZ = Math.max(cameraPos.z, 50);
    cameraPos.z = minZ;

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

    // Draw lane dividers as glowing crystal formations with enhanced visibility
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#00FFFF';
    ctx.shadowBlur = 10;
    ctx.lineCap = 'round';

    for (let lane = 0; lane <= lanes; lane++) {
      const x = startX + lane * worldLaneWidth;

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
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
        ctx.lineWidth = 8;
        ctx.stroke();

        // Reset for next line
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
        ctx.lineWidth = 4;
        ctx.shadowBlur = 10;
      }
    }

    ctx.shadowBlur = 0;

    // Draw beat lines with enhanced visibility
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]); // Dashed lines for better visibility

    for (let step = 0; step < steps; step += 4) {
      const z = -step * worldStepDepth;

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

          if (screenPos && screenPos.z > 0) {
            const distance = screenPos.z;
            const scale = Math.max(0.1, 300 / distance);
            const blockSize = 40 * scale;

            drawIsometricBlock(
              ctx,
              screenPos.x - blockSize / 2,
              screenPos.y - blockSize / 2,
              blockSize,
              blockSize,
              blockSize * 0.6,
              neonColors[lane],
              isActive
            );
          }
        }
      }
    }

    // Draw strike zone as illuminated platform
    const hitZoneDistance = 100;
    const cameraZ = camera.current.position.z;
    const hitZoneZ = cameraZ - hitZoneDistance;

    ctx.strokeStyle = '#FF0080';
    ctx.lineWidth = 6;
    ctx.shadowColor = '#FF0080';
    ctx.shadowBlur = 15;

    const leftPoint = camera.current.project(new Vec3(startX - 50, 0, hitZoneZ), width, height);
    const rightPoint = camera.current.project(new Vec3(startX + totalWorldWidth + 50, 0, hitZoneZ), width, height);

    if (leftPoint && rightPoint) {
      ctx.beginPath();
      ctx.moveTo(leftPoint.x, leftPoint.y);
      ctx.lineTo(rightPoint.x, rightPoint.y);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
  }, [pattern, lanes, steps, currentBeat, isPlaying, setupCamera, drawIsometricBlock, neonColors]);

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
    setPattern(Array(8).fill(null).map(() => Array(16).fill(false)));
  };

  const randomizePattern = () => {
    setPattern(prev => prev.map(lane =>
      lane.map(() => Math.random() < 0.15)
    ));
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

        {/* Lane labels */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 space-y-3 pointer-events-none">
          {noteNames.map((name, index) => (
            <div
              key={index}
              className="flex items-center justify-center w-10 h-10 rounded-lg text-sm font-bold border-2 shadow-lg"
              style={{
                backgroundColor: `${neonColors[index]}20`,
                borderColor: neonColors[index],
                color: neonColors[index],
                textShadow: `0 0 8px ${neonColors[index]}`
              }}
            >
              {name}
            </div>
          ))}
        </div>
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
      </div>

      {/* Instructions */}
      <div className="text-center p-4 bg-gray-900 text-gray-400 text-sm">
        Click anywhere on the 3D view to add/remove notes • Watch notes flow toward you in the neon night sky
      </div>
    </div>
  );
};