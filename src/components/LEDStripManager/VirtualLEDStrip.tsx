import React, { useEffect, useState, useRef } from 'react';
import { LEDStripConfig, LEDColor } from '../../types/led';

interface VirtualLEDStripProps {
  config: LEDStripConfig;
  pattern?: boolean[];
  currentStep?: number;
  isPlaying?: boolean;
  boomwhackerColors: string[];
  showTestPattern?: boolean;
  visualizer?: any; // SingleLaneVisualizer instance to get actual LED data
}

export const VirtualLEDStrip: React.FC<VirtualLEDStripProps> = ({
  config,
  pattern = [],
  currentStep = 0,
  isPlaying = false,
  boomwhackerColors,
  showTestPattern = false,
  visualizer
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animationFrame, setAnimationFrame] = useState(0);

  // Limit LED count for performance and crash protection
  const maxLEDs = 300;
  const safeLedCount = Math.min(config.ledCount, maxLEDs);
  const isOverLimit = config.ledCount > maxLEDs;

  // Make it stretch across full width, very minimal and thin
  const canvasWidth = 400; // Fixed width that stretches across the strip parameters
  const canvasHeight = 8;  // Very thin line - just 8 pixels high

  // Calculate LED size - each LED gets equal space across the full width
  const ledSize = canvasWidth / safeLedCount;
  const actualWidth = canvasWidth;

  useEffect(() => {
    if (showTestPattern || (config.multiNotesMode && config.assignedLanes.length > 1)) {
      const interval = setInterval(() => {
        setAnimationFrame(frame => frame + 1);
      }, 50); // Update every 50ms for smooth animation (test pattern and multi-notes color cycling)
      return () => clearInterval(interval);
    } else {
      // Reset animation frame when not showing test pattern or multi-notes
      setAnimationFrame(0);
    }
  }, [showTestPattern, config.multiNotesMode, config.assignedLanes.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Generate LED array
    const ledArray: LEDColor[] = new Array(safeLedCount);

    // Initialize all LEDs to black/off
    for (let i = 0; i < safeLedCount; i++) {
      ledArray[i] = { r: 0, g: 0, b: 0 };
    }

    if (showTestPattern) {
      // Rainbow test pattern
      const time = animationFrame * 0.05;
      for (let i = 0; i < safeLedCount; i++) {
        const hue = ((i / safeLedCount) + time) % 1.0;
        const color = hsvToRgb(hue, 1.0, 1.0);
        ledArray[i] = color;
      }
    } else if (pattern.length > 0) {
      // Static step sequencer visualization with direction-aware positioning
      const totalSteps = 16;

      // Helper function to calculate LED position accounting for direction
      const calculateLedPosition = (stepProgress: number): number => {
        if (config.reverseDirection) {
          // Reverse direction: step 0 at LED 0, step (totalSteps-1) at LED (ledCount-1)
          return Math.round(stepProgress * (safeLedCount - 1));
        } else {
          // Normal direction: step 0 at LED (ledCount-1), step (totalSteps-1) at LED 0
          return Math.round((1 - stepProgress) * (safeLedCount - 1));
        }
      };

      // Get lane color - handle multi-notes mode with color cycling
      let laneColor: LEDColor;
      if (config.multiNotesMode && config.assignedLanes.length > 1) {
        // Multi-notes color cycling logic (matching SingleLaneVisualizer)
        const totalCycleTime = 2000; // 2 second cycle
        const holdTime = 0.85;
        const fadeTime = 0.15;

        const currentTime = Date.now();
        const cycleTime = (currentTime / totalCycleTime) % 1.0;
        const stepsPerColor = 1.0 / config.assignedLanes.length;
        const currentColorIndex = Math.floor(cycleTime / stepsPerColor) % config.assignedLanes.length;
        const stepProgress = (cycleTime % stepsPerColor) / stepsPerColor;

        let blendFactor: number;
        if (stepProgress < holdTime) {
          blendFactor = 0;
        } else {
          blendFactor = (stepProgress - holdTime) / fadeTime;
          blendFactor = Math.min(blendFactor, 1.0);
        }

        // Get primary and secondary colors for blending
        const primaryColorHex = boomwhackerColors[config.assignedLanes[currentColorIndex]];
        const nextColorIndex = (currentColorIndex + 1) % config.assignedLanes.length;
        const secondaryColorHex = boomwhackerColors[config.assignedLanes[nextColorIndex]];

        const primaryRgb = hexToRgb(primaryColorHex);
        const secondaryRgb = hexToRgb(secondaryColorHex);

        // Blend colors
        laneColor = {
          r: Math.round(primaryRgb.r * (1 - blendFactor) + secondaryRgb.r * blendFactor),
          g: Math.round(primaryRgb.g * (1 - blendFactor) + secondaryRgb.g * blendFactor),
          b: Math.round(primaryRgb.b * (1 - blendFactor) + secondaryRgb.b * blendFactor)
        };
      } else {
        // Single lane mode
        const laneIndex = config.multiNotesMode && config.assignedLanes.length > 0
          ? config.assignedLanes[0]
          : config.laneIndex;
        const hexColor = boomwhackerColors[laneIndex % boomwhackerColors.length];
        laneColor = hexToRgb(hexColor);
      }

      // Calculate timeline position
      let timelineIndex = -1;
      if (isPlaying) {
        const timelineProgress = currentStep / totalSteps;
        timelineIndex = calculateLedPosition(timelineProgress);
      }

      // Place notes at fixed LED positions
      for (let stepIndex = 0; stepIndex < Math.min(totalSteps, pattern.length); stepIndex++) {
        if (pattern[stepIndex]) {
          const stepProgress = stepIndex / totalSteps;
          const centerLedIndex = calculateLedPosition(stepProgress);

          if (centerLedIndex >= 0 && centerLedIndex < safeLedCount) {
            // Check if timeline is hitting this note
            const isTimelineNearNote = isPlaying && timelineIndex >= 0 &&
              Math.abs(timelineIndex - centerLedIndex) <= 1;

            let noteColor: LEDColor;
            if (isTimelineNearNote) {
              // Timeline is hitting this note - full brightness
              noteColor = laneColor;
            } else {
              // Queued note - dimmed (25% brightness)
              noteColor = {
                r: Math.round(laneColor.r * 0.25),
                g: Math.round(laneColor.g * 0.25),
                b: Math.round(laneColor.b * 0.25)
              };
            }

            // Make notes 3 pixels wide (center + neighbors)
            for (let offset = -1; offset <= 1; offset++) {
              const ledIndex = centerLedIndex + offset;
              if (ledIndex >= 0 && ledIndex < safeLedCount) {
                ledArray[ledIndex] = noteColor;
              }
            }
          }
        }
      }

      // Add dim white dividers between steps
      for (let stepIndex = 1; stepIndex < totalSteps; stepIndex++) {
        const stepProgress = stepIndex / totalSteps;
        const dividerLedIndex = calculateLedPosition(stepProgress);

        if (dividerLedIndex >= 0 && dividerLedIndex < safeLedCount) {
          const hasNote = ledArray[dividerLedIndex].r > 0 ||
                          ledArray[dividerLedIndex].g > 0 ||
                          ledArray[dividerLedIndex].b > 0;
          if (!hasNote) {
            ledArray[dividerLedIndex] = { r: 24, g: 24, b: 24 };
          }
        }
      }

      // Timeline/playhead (always on top)
      if (isPlaying && timelineIndex >= 0 && timelineIndex < safeLedCount) {
        ledArray[timelineIndex] = { r: 255, g: 255, b: 255 };
      }
    }

    // Draw LEDs on canvas - minimal thin line style with enhanced brightness
    for (let i = 0; i < safeLedCount; i++) {
      const led = ledArray[i];
      const x = i * ledSize;
      const y = 0;
      const width = Math.max(1, Math.floor(ledSize)); // Ensure at least 1 pixel wide

      // LED color (dark gray when off, bright when lit)
      if (led.r === 0 && led.g === 0 && led.b === 0) {
        ctx.fillStyle = '#1a1a1a'; // Darker background for off LEDs
      } else {
        // Apply brightness multiplier for better screen visibility (2.5x brighter)
        const brightnessMultiplier = 2.5;
        const brightR = Math.min(255, Math.round(led.r * brightnessMultiplier));
        const brightG = Math.min(255, Math.round(led.g * brightnessMultiplier));
        const brightB = Math.min(255, Math.round(led.b * brightnessMultiplier));
        ctx.fillStyle = `rgb(${brightR}, ${brightG}, ${brightB})`;
      }

      ctx.fillRect(x, y, width, canvasHeight);
    }

  }, [config, pattern, currentStep, isPlaying, boomwhackerColors, showTestPattern, animationFrame, safeLedCount, ledSize, canvasWidth, canvasHeight, visualizer]);

  // Convert HSV to RGB for rainbow test pattern
  const hsvToRgb = (h: number, s: number, v: number): LEDColor => {
    const c = v * s;
    const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
    const m = v - c;

    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 1/6) {
      r = c; g = x; b = 0;
    } else if (h >= 1/6 && h < 2/6) {
      r = x; g = c; b = 0;
    } else if (h >= 2/6 && h < 3/6) {
      r = 0; g = c; b = x;
    } else if (h >= 3/6 && h < 4/6) {
      r = 0; g = x; b = c;
    } else if (h >= 4/6 && h < 5/6) {
      r = x; g = 0; b = c;
    } else {
      r = c; g = 0; b = x;
    }

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
    };
  };

  // Convert hex color to RGB
  const hexToRgb = (hex: string): LEDColor => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
      return { r: 255, g: 255, b: 255 };
    }
    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    };
  };

  return (
    <div className="w-full">
      <div className="w-full bg-gray-900 border border-gray-700 rounded p-1 relative">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="w-full block"
          style={{
            imageRendering: 'pixelated',
            height: `${canvasHeight}px`,
          }}
        />
        {/* Direction indicator */}
        <div className="absolute top-0 right-1 text-xs text-gray-500">
          {config.reverseDirection ? '→' : '←'}
        </div>
        {/* LED limit warning */}
        {isOverLimit && (
          <div className="absolute top-0 left-1 text-xs text-yellow-400">
            ⚠️ {maxLEDs}
          </div>
        )}
      </div>
    </div>
  );
};