import React, { useRef, useEffect, useState } from 'react';
import { Palette, Settings, Maximize2, Minimize2 } from 'lucide-react';
import { ColorMode, VisualizerSettings } from '../../types';
import { getNoteColor } from '../../utils/colorMapping';

interface CompactVisualizerProps {
  settings: VisualizerSettings;
  onSettingsChange: (settings: VisualizerSettings) => void;
  midiNotes?: Array<{ note: number; velocity: number; timestamp: number }>;
}

export const CompactVisualizer: React.FC<CompactVisualizerProps> = ({
  settings,
  onSettingsChange,
  midiNotes = []
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

    // Draw compact visualization
    drawCompactVisualization(ctx, canvas.offsetWidth, canvas.offsetHeight, settings, midiNotes);
  }, [settings, midiNotes, isExpanded]);

  const drawCompactVisualization = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    settings: VisualizerSettings,
    midiNotes: Array<{ note: number; velocity: number; timestamp: number }>
  ) => {
    // Draw recent MIDI notes as bars or circles
    midiNotes.forEach((note, index) => {
      const color = getNoteColor(note.note, settings.colorMode);
      const age = Date.now() - note.timestamp;
      const fadeAlpha = Math.max(0, (note.velocity * settings.brightness) * (1 - age / 1000));

      if (fadeAlpha > 0) {
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${fadeAlpha})`;
        
        if (isExpanded) {
          // Full visualization
          const x = (width * (age / 1000)) % width;
          const y = height - (note.note / 127) * height;
          const radius = note.velocity * 15;

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, 2 * Math.PI);
          ctx.fill();
        } else {
          // Compact bar visualization
          const barWidth = width / 8;
          const barHeight = note.velocity * height * 0.8;
          const x = (index % 8) * barWidth;
          
          ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight);
        }
      }
    });
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Visualizer</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="mb-3 p-3 bg-gray-700 rounded-lg space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">Color Mode</label>
            <div className="grid grid-cols-3 gap-1">
              {(['spectrum', 'chromatic', 'harmonic'] as ColorMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onSettingsChange({ ...settings, colorMode: mode })}
                  className={`px-2 py-1 rounded text-xs capitalize transition-colors ${
                    settings.colorMode === mode
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Brightness: {Math.round(settings.brightness * 100)}%
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={settings.brightness}
              onChange={(e) => onSettingsChange({ ...settings, brightness: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      )}

      <div className="relative">
        <canvas
          ref={canvasRef}
          className={`w-full bg-black rounded-lg border border-gray-700 transition-all duration-300 ${
            isExpanded ? 'h-48' : 'h-24'
          }`}
        />
        
        <div className="absolute top-2 left-2 bg-black/50 px-2 py-1 rounded text-xs">
          <div className="flex items-center gap-1">
            <Palette className="w-3 h-3" />
            <span className="capitalize">{settings.colorMode}</span>
          </div>
        </div>
      </div>
    </div>
  );
};