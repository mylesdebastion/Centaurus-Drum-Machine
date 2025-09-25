import React, { useRef, useEffect, useState } from 'react';
import { Palette, Lightbulb, Settings } from 'lucide-react';
import { ColorMode, VisualizerSettings } from '../../types';
import { getNoteColor, getFrequencyColor } from '../../utils/colorMapping';

interface VisualizerProps {
  settings: VisualizerSettings;
  onSettingsChange: (settings: VisualizerSettings) => void;
  audioData?: Float32Array;
  midiNotes?: Array<{ note: number; velocity: number; timestamp: number }>;
}

export const Visualizer: React.FC<VisualizerProps> = ({
  settings,
  onSettingsChange,
  audioData,
  midiNotes = []
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

    // Draw visualization based on color mode and data
    drawVisualization(ctx, canvas.offsetWidth, canvas.offsetHeight, settings, audioData, midiNotes);
  }, [settings, audioData, midiNotes]);

  const drawVisualization = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    settings: VisualizerSettings,
    audioData?: Float32Array,
    midiNotes: Array<{ note: number; velocity: number; timestamp: number }> = []
  ) => {
    // Draw MIDI notes as colored circles
    midiNotes.forEach((note) => {
      const color = getNoteColor(note.note, settings.colorMode);
      const alpha = note.velocity * settings.brightness;
      const age = Date.now() - note.timestamp;
      const fadeAlpha = Math.max(0, alpha * (1 - age / 1000)); // Fade over 1 second

      if (fadeAlpha > 0) {
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${fadeAlpha})`;
        
        // Position based on note (vertical) and time (horizontal)
        const x = (width * (age / 1000)) % width;
        const y = height - (note.note / 127) * height;
        const radius = note.velocity * 20;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    // Draw frequency bars if audio data is available
    if (audioData) {
      const barWidth = width / audioData.length;
      audioData.forEach((value, index) => {
        const barHeight = Math.abs(value) * height * 0.5;
        const color = getFrequencyColor(index / audioData.length, settings.colorMode);
        
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${settings.brightness})`;
        ctx.fillRect(index * barWidth, height - barHeight, barWidth - 1, barHeight);
      });
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Music Visualizer</h2>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {showSettings && (
        <div className="mb-4 p-4 bg-gray-700 rounded-lg space-y-4">
          {/* Color Mode */}
          <div>
            <label className="block text-sm font-medium mb-2">Color Mode</label>
            <div className="flex gap-2">
              {(['spectrum', 'chromatic', 'harmonic'] as ColorMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onSettingsChange({ ...settings, colorMode: mode })}
                  className={`px-3 py-2 rounded-lg text-sm capitalize transition-colors ${
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

          {/* Brightness */}
          <div>
            <label className="block text-sm font-medium mb-2">
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

          {/* LED Matrix Settings */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="ledMatrix"
                checked={settings.ledMatrixEnabled}
                onChange={(e) => onSettingsChange({ ...settings, ledMatrixEnabled: e.target.checked })}
                className="w-4 h-4 text-primary-600 bg-gray-600 border-gray-500 rounded focus:ring-primary-500"
              />
              <label htmlFor="ledMatrix" className="text-sm font-medium">
                Enable LED Matrix
              </label>
            </div>
            {settings.ledMatrixEnabled && (
              <input
                type="text"
                placeholder="LED Matrix IP (e.g., 192.168.1.100)"
                value={settings.ledMatrixIP}
                onChange={(e) => onSettingsChange({ ...settings, ledMatrixIP: e.target.value })}
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none"
              />
            )}
          </div>
        </div>
      )}

      {/* Visualization Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="visualizer-canvas w-full h-64"
        />
        
        {/* Color Mode Indicator */}
        <div className="absolute top-4 left-4 bg-black/50 px-3 py-1 rounded-lg">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span className="text-sm capitalize">{settings.colorMode} Mode</span>
          </div>
        </div>

        {/* LED Status */}
        {settings.ledMatrixEnabled && (
          <div className="absolute top-4 right-4 bg-black/50 px-3 py-1 rounded-lg">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-green-400" />
              <span className="text-sm">LED Connected</span>
            </div>
          </div>
        )}
      </div>

      {/* Color Mode Descriptions */}
      <div className="mt-4 text-sm text-gray-400">
        {settings.colorMode === 'spectrum' && (
          <p>🌈 Spectrum: Low notes = red, high notes = violet (frequency-based)</p>
        )}
        {settings.colorMode === 'chromatic' && (
          <p>🎵 Chromatic: Each note has a consistent color across all octaves</p>
        )}
        {settings.colorMode === 'harmonic' && (
          <p>🎼 Harmonic: Related notes have similar colors (circle of fifths)</p>
        )}
      </div>
    </div>
  );
};