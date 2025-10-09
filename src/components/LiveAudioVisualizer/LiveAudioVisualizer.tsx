/**
 * LiveAudioVisualizer - DJ/Musician live audio visualization module
 *
 * Proof of concept: Basic spectrum analyzer with frequency bars
 * Future: Ripple, Waveform, LED Matrix output
 */

import React, { useEffect, useRef, useState } from 'react';
import { AudioInputManager, DEFAULT_AUDIO_CONFIG } from './AudioInputManager';
import { getFrequencyColor } from '../../utils/colorMapping';

interface LiveAudioVisualizerProps {
  onExit?: () => void;
}

export const LiveAudioVisualizer: React.FC<LiveAudioVisualizerProps> = ({ onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioManagerRef = useRef<AudioInputManager | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rms, setRMS] = useState(0);
  const [peakFreq, setPeakFreq] = useState({ frequency: 0, amplitude: 0 });

  // Initialize audio input
  const handleStart = async () => {
    try {
      setError(null);
      const manager = new AudioInputManager(DEFAULT_AUDIO_CONFIG);
      await manager.initialize();
      audioManagerRef.current = manager;
      setIsInitialized(true);
      startVisualization();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize audio');
      console.error('Audio initialization error:', err);
    }
  };

  // Main visualization loop
  const startVisualization = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const manager = audioManagerRef.current;
    if (!manager) return;

    const render = () => {
      const frequencyData = manager.getFrequencyData();
      const bufferLength = manager.getBufferLength();
      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, width, height);

      // Draw frequency bars - use fewer bars for better visibility
      const numBars = Math.min(128, bufferLength);
      const barWidth = width / numBars;
      const binSize = Math.floor(bufferLength / numBars);

      for (let i = 0; i < numBars; i++) {
        // Average multiple frequency bins for each bar
        let sum = 0;
        const startBin = i * binSize;
        const endBin = Math.min(startBin + binSize, bufferLength);

        for (let j = startBin; j < endBin; j++) {
          sum += frequencyData[j];
        }

        const avgAmplitude = sum / binSize;
        const normalizedAmplitude = avgAmplitude / 255;
        const barHeight = normalizedAmplitude * height;

        // Calculate normalized frequency (0-1) for color mapping
        const normalizedFrequency = i / numBars;

        // Get color based on frequency (using existing colorMapping.ts)
        const color = getFrequencyColor(normalizedFrequency, 'spectrum');

        // Apply amplitude to opacity AND brightness (quiet sounds are dimmer/more transparent)
        const opacity = Math.max(0.3, normalizedAmplitude);
        const brightness = Math.max(0.5, normalizedAmplitude);

        ctx.fillStyle = `rgba(${Math.floor(color.r * brightness)}, ${Math.floor(color.g * brightness)}, ${Math.floor(color.b * brightness)}, ${opacity})`;
        ctx.fillRect(i * barWidth, height - barHeight, barWidth - 2, barHeight);
      }

      // Update metrics
      const currentRMS = manager.getRMS();
      const currentPeak = manager.getPeakFrequency();
      setRMS(currentRMS);
      setPeakFreq(currentPeak);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioManagerRef.current) {
        audioManagerRef.current.dispose();
      }
    };
  }, []);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-white">DJ Visualizer</h1>
          <span className="px-2 py-1 text-xs font-semibold bg-orange-500 text-white rounded">
            Beta
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Audio metrics */}
          {isInitialized && (
            <div className="flex gap-6 text-sm">
              <div className="text-gray-400">
                RMS: <span className="text-white font-mono">{(rms * 100).toFixed(1)}%</span>
              </div>
              <div className="text-gray-400">
                Peak: <span className="text-white font-mono">{peakFreq.frequency.toFixed(0)} Hz</span>
              </div>
            </div>
          )}

          <button
            onClick={onExit}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Exit
          </button>
        </div>
      </header>

      {/* Main visualization area */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        {!isInitialized && !error && (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Live Audio Spectrum Analyzer
            </h2>
            <p className="text-gray-400 mb-8 max-w-md">
              Visualize live audio input with real-time frequency analysis.
              Click Start to enable microphone access.
            </p>
            <button
              onClick={handleStart}
              className="px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white text-lg font-semibold rounded-lg transition-colors shadow-lg"
            >
              🎤 Start Audio Input
            </button>
          </div>
        )}

        {error && (
          <div className="text-center">
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 max-w-md">
              <h3 className="text-red-400 font-semibold mb-2">Audio Error</h3>
              <p className="text-gray-300 text-sm">{error}</p>
              <button
                onClick={handleStart}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {isInitialized && (
          <div className="w-full h-full flex flex-col gap-4">
            {/* Canvas visualization */}
            <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden shadow-2xl border border-gray-700">
              <canvas
                ref={canvasRef}
                className="w-full h-full"
              />
            </div>

            {/* Controls (placeholder for future features) */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-4">
                <span className="text-gray-400 text-sm">Visualization Mode:</span>
                <button className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded transition-colors">
                  Spectrum
                </button>
                <button className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded transition-colors">
                  Ripple (Coming Soon)
                </button>
                <button className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded transition-colors">
                  Waveform (Coming Soon)
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
