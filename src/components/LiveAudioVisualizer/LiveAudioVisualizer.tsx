/**
 * LiveAudioVisualizer - DJ/Musician live audio visualization module
 *
 * Features:
 * - Audio input capture with device selection
 * - Multiple visualization modes (Spectrum, Waveform, Ripple)
 * - Gain/sensitivity control
 * - LED matrix output via WLED
 * - Real-time 60fps rendering
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AudioInputManager, DEFAULT_AUDIO_CONFIG } from './AudioInputManager';
import { VisualizationEngine, VisualizationMode, DEFAULT_VIZ_ENGINE_CONFIG } from './VisualizationEngine';
import { LEDMatrixManager } from './LEDMatrixManager';
import { RippleDirection } from './visualizations/RippleVisualization';
import { FrequencySourceManager, FrequencyMixMode } from '../../utils/frequencySourceManager';
import { FrequencyDataAdapter } from './FrequencyDataAdapter';
import { CollapsiblePanel } from '../Layout/CollapsiblePanel';
import { Mic, Settings, Activity, ArrowLeft, Music, Drum } from 'lucide-react';

interface LiveAudioVisualizerProps {
  onBack?: () => void;
  embedded?: boolean; // When true, renders in a compact embedded mode
  layout?: 'mobile' | 'desktop'; // Layout hint for responsive rendering (does NOT cause remount)
  className?: string; // Additional CSS classes for visibility control
  currentMode?: VisualizationMode; // Controlled mode (optional, for parent control)
  onModeChange?: (mode: VisualizationMode) => void; // Mode change callback for controlled mode
  colorMode?: 'spectrum' | 'chromatic' | 'harmonic'; // Color mode for spectrum visualization
  hideControls?: boolean; // When true, hides controls until settings button is clicked (Education Mode)
  showModeButtons?: boolean; // When true, shows mode toggle buttons even if hideControls is true
  frequencySource?: FrequencyMixMode; // Override frequency source (for Education Mode)
  onInitialized?: (initialized: boolean) => void; // Callback when audio is initialized/stopped
}

export const LiveAudioVisualizer: React.FC<LiveAudioVisualizerProps> = ({
  onBack,
  embedded = false,
  layout: _layout = 'desktop', // Reserved for future mobile-specific optimizations
  className = '',
  currentMode: controlledMode,
  onModeChange,
  colorMode,
  hideControls = false,
  showModeButtons = false,
  frequencySource: controlledFrequencySource,
  onInitialized
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioManagerRef = useRef<AudioInputManager | null>(null);
  const vizEngineRef = useRef<VisualizationEngine | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const sourceManagerRef = useRef<FrequencySourceManager | null>(null);
  const adapterRef = useRef<FrequencyDataAdapter | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [internalMode, setInternalMode] = useState<VisualizationMode>('ripple');

  // Use controlled mode if provided, otherwise use internal state
  const currentMode = controlledMode ?? internalMode;

  const [gain, setGain] = useState(0.5); // 50%
  const [frequencyScale, setFrequencyScale] = useState<'log' | 'linear' | 'quadratic'>('log');
  const [showSettings, setShowSettings] = useState(false);
  const [fps, setFps] = useState(0);
  const [currentRippleDirection, setCurrentRippleDirection] = useState<RippleDirection>('radial');
  const [frequencySource, setFrequencySource] = useState<FrequencyMixMode>('mic-only');

  // Stats
  const [rms, setRMS] = useState(0);
  const [peakFreq, setPeakFreq] = useState({ frequency: 0, amplitude: 0 });

  // FPS calculation
  const fpsCounterRef = useRef({ frames: 0, lastTime: Date.now() });

  // Auto-adjust gain and visualization mode when mode changes externally (controlled mode)
  useEffect(() => {
    if (controlledMode !== undefined) {
      // Update visualization engine mode
      if (vizEngineRef.current) {
        vizEngineRef.current.setMode(controlledMode);
      }

      // Auto-adjust gain based on mode
      let modeGain = 1.0;
      if (controlledMode === 'ripple') {
        modeGain = 0.5; // 50% for ripple
      } else if (controlledMode === 'waveform') {
        modeGain = 2.0; // 200% for waveform
      } else if (controlledMode === 'spectrum') {
        modeGain = 1.0; // 100% for spectrum
      }

      setGain(modeGain);
      if (audioManagerRef.current) {
        audioManagerRef.current.setGain(modeGain);
      }
    }
  }, [controlledMode]);

  // Sync frequency source when controlled externally (Education Mode)
  useEffect(() => {
    if (controlledFrequencySource !== undefined) {
      setFrequencySource(controlledFrequencySource);
      if (sourceManagerRef.current) {
        sourceManagerRef.current.setMixMode(controlledFrequencySource);
      }
    }
  }, [controlledFrequencySource]);

  // Notify parent when initialization state changes
  useEffect(() => {
    if (onInitialized) {
      onInitialized(isInitialized);
    }
  }, [isInitialized, onInitialized]);

  // Initialize visualization engine and frequency source manager
  useEffect(() => {
    vizEngineRef.current = new VisualizationEngine(DEFAULT_VIZ_ENGINE_CONFIG);
    sourceManagerRef.current = new FrequencySourceManager();
    adapterRef.current = new FrequencyDataAdapter(sourceManagerRef.current);

    // Expose source manager globally for drum machine integration
    (window as any).frequencySourceManager = sourceManagerRef.current;

    return () => {
      vizEngineRef.current = null;
      sourceManagerRef.current = null;
      adapterRef.current = null;
      delete (window as any).frequencySourceManager;
    };
  }, []);

  // Enumerate audio devices
  const enumerateDevices = useCallback(async () => {
    const manager = new AudioInputManager();
    const audioDevices = await manager.getAudioInputDevices();
    setDevices(audioDevices);
    if (audioDevices.length > 0 && !selectedDeviceId) {
      setSelectedDeviceId(audioDevices[0].deviceId);
    }
  }, [selectedDeviceId]);

  // Initialize audio input
  const handleStart = async (deviceId?: string) => {
    try {
      console.log('[LiveAudioVisualizer] Starting audio initialization...');
      setError(null);
      const manager = new AudioInputManager(DEFAULT_AUDIO_CONFIG);
      // Don't pass deviceId on first initialization (empty string causes issues)
      await manager.initialize(deviceId && deviceId.length > 0 ? deviceId : undefined);
      console.log('[LiveAudioVisualizer] Audio manager initialized successfully');
      audioManagerRef.current = manager;

      // Register audio manager with adapter (which also registers with source manager)
      if (adapterRef.current) {
        adapterRef.current.setAudioManager(manager);
      }

      setIsInitialized(true);
      await enumerateDevices(); // Update device list after permission granted
      console.log('[LiveAudioVisualizer] Starting visualization loop...');
      startVisualization();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize audio');
      console.error('[LiveAudioVisualizer] Audio initialization error:', err);
    }
  };

  // Main visualization loop
  const startVisualization = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const adapter = adapterRef.current;
    const vizEngine = vizEngineRef.current;
    if (!adapter || !vizEngine) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Render visualization using adapter (which mixes all sources)
      vizEngine.render(ctx, adapter as any, width, height);

      // Update LED matrix if enabled
      const ledManager = (window as any).ledMatrixManager;
      if (ledManager && ledManager.getConfig && ledManager.getConfig().enabled) {
        // Extract canvas pixel data and convert to LED matrix grid
        const matrixConfig = ledManager.getConfig();
        const grid = extractMatrixGrid(ctx, matrixConfig.width, matrixConfig.height, width, height);
        ledManager.sendToWLED(grid);
      }

      // Update stats from adapter
      const currentRMS = adapter.getRMS();
      const currentPeak = adapter.getPeakFrequency();
      setRMS(currentRMS);
      setPeakFreq(currentPeak);

      // Calculate FPS
      fpsCounterRef.current.frames++;
      const now = Date.now();
      if (now - fpsCounterRef.current.lastTime >= 1000) {
        setFps(fpsCounterRef.current.frames);
        fpsCounterRef.current.frames = 0;
        fpsCounterRef.current.lastTime = now;
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();
  };

  /**
   * Extract LED matrix grid from canvas pixels
   */
  const extractMatrixGrid = (
    ctx: CanvasRenderingContext2D,
    matrixWidth: number,
    matrixHeight: number,
    canvasWidth: number,
    canvasHeight: number
  ): { r: number; g: number; b: number }[][] => {
    const grid: { r: number; g: number; b: number }[][] = [];
    const scaleX = canvasWidth / matrixWidth;
    const scaleY = canvasHeight / matrixHeight;

    for (let y = 0; y < matrixHeight; y++) {
      grid[y] = [];
      for (let x = 0; x < matrixWidth; x++) {
        // Sample pixel from canvas (center of each LED cell)
        const pixelX = Math.floor(x * scaleX + scaleX / 2);
        const pixelY = Math.floor(y * scaleY + scaleY / 2);
        const imageData = ctx.getImageData(pixelX, pixelY, 1, 1).data;

        grid[y][x] = {
          r: imageData[0],
          g: imageData[1],
          b: imageData[2],
        };
      }
    }

    return grid;
  };

  // Cleanup on unmount
  useEffect(() => {
    // 🚨 CRITICAL LIFECYCLE LOGGING - Track component mount/unmount for debugging
    console.log('[LiveAudioVisualizer] MOUNTED');

    return () => {
      console.log('[LiveAudioVisualizer] UNMOUNTED - Cleaning up audio/LED/animation state');
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

  // Update color mode when prop changes
  useEffect(() => {
    if (colorMode && vizEngineRef.current) {
      vizEngineRef.current.setColorMode(colorMode);
    }
  }, [colorMode]);

  // Start visualization when initialized and canvas is ready
  // Fixes race condition: handleStart() called startVisualization() before canvas mounted
  useEffect(() => {
    if (isInitialized && canvasRef.current && vizEngineRef.current && adapterRef.current && !animationFrameRef.current) {
      console.log('[LiveAudioVisualizer] Starting visualization (canvas now ready)');
      startVisualization();
    }
  }, [isInitialized]);

  // Also support embedded mode without mic (drums-only)
  useEffect(() => {
    if (embedded && !isInitialized && vizEngineRef.current && adapterRef.current && !animationFrameRef.current) {
      console.log('[LiveAudioVisualizer] Auto-starting visualization for embedded mode (no mic)');
      startVisualization();
    }
  }, [embedded, isInitialized]);

  // Handle mode change
  const handleModeChange = (mode: VisualizationMode) => {
    // Update controlled or internal state
    if (onModeChange) {
      onModeChange(mode);
    } else {
      setInternalMode(mode);
    }

    // Update visualization engine
    if (vizEngineRef.current) {
      vizEngineRef.current.setMode(mode);
    }

    // Auto-adjust gain based on visualization mode
    let modeGain = 1.0; // Default 100%
    if (mode === 'ripple') {
      modeGain = 0.5; // 50% for ripple
    } else if (mode === 'waveform') {
      modeGain = 2.0; // 200% for waveform
    } else if (mode === 'spectrum') {
      modeGain = 1.0; // 100% for spectrum
    }

    setGain(modeGain);
    if (audioManagerRef.current) {
      audioManagerRef.current.setGain(modeGain);
    }
  };

  // Handle gain change
  const handleGainChange = (newGain: number) => {
    setGain(newGain);
    if (audioManagerRef.current) {
      audioManagerRef.current.setGain(newGain);
    }
  };

  // Handle frequency source change
  const handleFrequencySourceChange = (mode: FrequencyMixMode) => {
    setFrequencySource(mode);
    if (sourceManagerRef.current) {
      sourceManagerRef.current.setMixMode(mode);
    }
  };

  // Update visualization scale type when changed
  useEffect(() => {
    if (vizEngineRef.current) {
      vizEngineRef.current.updateSpectrumConfig({ scaleType: frequencyScale });
      vizEngineRef.current.updateRippleConfig({ scaleType: frequencyScale });
    }
  }, [frequencyScale]);

  // Handle ripple direction change with toggle logic
  const handleRippleDirection = (buttonDirection: RippleDirection) => {
    let newDirection = buttonDirection;

    // Toggle between opposite directions
    if (buttonDirection === 'bottom-top' && currentRippleDirection === 'bottom-top') {
      newDirection = 'top-bottom';
    } else if (buttonDirection === 'bottom-top' && currentRippleDirection === 'top-bottom') {
      newDirection = 'bottom-top';
    } else if (buttonDirection === 'left-right' && currentRippleDirection === 'left-right') {
      newDirection = 'right-left';
    } else if (buttonDirection === 'left-right' && currentRippleDirection === 'right-left') {
      newDirection = 'left-right';
    } else if (buttonDirection === 'radial') {
      newDirection = 'radial';
    }

    setCurrentRippleDirection(newDirection);
    if (vizEngineRef.current) {
      vizEngineRef.current.setRippleDirection(newDirection);
    }
  };

  // Handle canvas click for ripple origin
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (currentMode !== 'ripple') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width; // Normalize to 0-1
    const y = (e.clientY - rect.top) / rect.height; // Normalize to 0-1

    if (vizEngineRef.current) {
      vizEngineRef.current.setRippleOrigin(x, y);
    }
  };

  // Embedded mode: simplified layout without full-screen wrapper
  if (embedded) {
    return (
      <div className={`bg-gray-800 rounded-xl p-6 border border-gray-700 ${className}`}>
        <div className="flex items-center justify-between mb-4 gap-2">
          <h2 className="text-2xl font-bold flex-shrink-0">Live Audio Visualizer</h2>
          <div className="flex items-center gap-3 flex-shrink-0">
            {isInitialized && (
              <div className="flex gap-2 text-sm font-mono">
                <div className="text-gray-400 whitespace-nowrap">
                  <span className="inline-block w-6 text-right">{fps}</span> FPS
                </div>
                <div className="text-gray-400 whitespace-nowrap">
                  <span className="inline-block w-8 text-right">{(rms * 100).toFixed(0)}</span>%
                </div>
                <div className="text-gray-400 whitespace-nowrap">
                  <span className="inline-block w-10 text-right">{peakFreq.frequency.toFixed(0)}</span> Hz
                </div>
              </div>
            )}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-3 hover:bg-gray-700 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Toggle settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {!isInitialized && !error && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Mic className="w-12 h-12 text-primary-500 mx-auto mb-3" />
              <p className="text-gray-400 mb-4">
                Click to enable microphone access
              </p>
              <button
                onClick={() => handleStart(selectedDeviceId)}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-lg transition-colors"
              >
                🎤 Start Audio Input
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
            <h3 className="text-red-400 font-semibold mb-2">Audio Error</h3>
            <p className="text-gray-300 text-sm mb-3">{error}</p>
            <button
              onClick={() => handleStart(selectedDeviceId)}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {isInitialized && (
          <>
            <div className="bg-gray-900 rounded-lg overflow-hidden mb-4" style={{ height: '320px' }}>
              <canvas
                ref={canvasRef}
                className="w-full h-full cursor-crosshair"
                onClick={handleCanvasClick}
              />
            </div>

            <div className="bg-gray-700 rounded-lg p-3 space-y-3">
              {/* Mode buttons - show if not hiding controls OR if showModeButtons is explicitly true */}
              {(!hideControls || showModeButtons || showSettings) && (
                <div className="flex items-center gap-3 flex-wrap text-sm">
                  <div className="flex gap-1">
                  <button
                    onClick={() => handleModeChange('spectrum')}
                    className={`px-3 py-2 text-xs rounded transition-colors min-h-[44px] flex items-center justify-center ${
                      currentMode === 'spectrum'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                    }`}
                  >
                    Spectrum
                  </button>
                  <button
                    onClick={() => handleModeChange('waveform')}
                    className={`px-3 py-2 text-xs rounded transition-colors min-h-[44px] flex items-center justify-center ${
                      currentMode === 'waveform'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                    }`}
                  >
                    Waveform
                  </button>
                  <button
                    onClick={() => handleModeChange('ripple')}
                    className={`px-3 py-2 text-xs rounded transition-colors min-h-[44px] flex items-center justify-center ${
                      currentMode === 'ripple'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                    }`}
                  >
                    Ripple
                  </button>
                </div>

                {currentMode === 'ripple' && (
                  <div className="flex gap-1 border-l border-gray-600 pl-3">
                    <button
                      onClick={() => handleRippleDirection('radial')}
                      className={`px-3 py-2 text-xs rounded transition-colors min-h-[44px] flex items-center justify-center ${
                        currentRippleDirection === 'radial'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                      }`}
                    >
                      radial
                    </button>
                    <button
                      onClick={() => handleRippleDirection('bottom-top')}
                      className={`px-3 py-2 text-xs rounded transition-colors min-h-[44px] flex items-center justify-center ${
                        currentRippleDirection === 'bottom-top' || currentRippleDirection === 'top-bottom'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                      }`}
                    >
                      {currentRippleDirection === 'bottom-top' ? 'top-bottom' : 'bottom-top'}
                    </button>
                    <button
                      onClick={() => handleRippleDirection('left-right')}
                      className={`px-3 py-2 text-xs rounded transition-colors min-h-[44px] flex items-center justify-center ${
                        currentRippleDirection === 'left-right' || currentRippleDirection === 'right-left'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                      }`}
                    >
                      {currentRippleDirection === 'left-right' ? 'right-left' : 'left-right'}
                    </button>
                  </div>
                )}

                {(!hideControls || showSettings) && (
                  <>
                    <div className="flex items-center gap-2 border-l border-gray-600 pl-3 ml-auto">
                      <span className="text-gray-400 text-xs">Gain:</span>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={gain}
                        onChange={(e) => handleGainChange(parseFloat(e.target.value))}
                        className="w-24"
                      />
                      <span className="text-white font-mono text-xs w-10 text-right">
                        {(gain * 100).toFixed(0)}%
                      </span>
                    </div>

                    <div className="flex items-center gap-2 border-l border-gray-600 pl-3">
                      <span className="text-gray-400 text-xs">Scale:</span>
                      <select
                        value={frequencyScale}
                        onChange={(e) => setFrequencyScale(e.target.value as 'log' | 'linear' | 'quadratic')}
                        className="px-2 py-1 text-xs bg-gray-600 text-gray-300 rounded border border-gray-500 focus:border-primary-500 focus:outline-none"
                      >
                        <option value="log">Log</option>
                        <option value="quadratic">Quad</option>
                        <option value="linear">Linear</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
              )}

              {/* Frequency Source Selector - Second Row */}
              {(!hideControls || showSettings) && (
                <div className="flex items-center gap-2 flex-wrap text-sm pt-2 border-t border-gray-600">
                <span className="text-gray-400 text-xs">Source:</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleFrequencySourceChange('mic-only')}
                    className={`px-3 py-2 text-xs rounded transition-colors flex items-center gap-1 min-h-[44px] ${
                      frequencySource === 'mic-only'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                    }`}
                    title="Microphone audio only"
                  >
                    <Mic className="w-3 h-3" />
                    Mic
                  </button>
                  <button
                    onClick={() => handleFrequencySourceChange('drums-only')}
                    className={`px-3 py-2 text-xs rounded transition-colors flex items-center gap-1 min-h-[44px] ${
                      frequencySource === 'drums-only'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                    }`}
                    title="Drum machine synthetic frequencies"
                  >
                    <Drum className="w-3 h-3" />
                    Drums
                  </button>
                  <button
                    onClick={() => handleFrequencySourceChange('midi-only')}
                    className={`px-3 py-2 text-xs rounded transition-colors flex items-center gap-1 min-h-[44px] ${
                      frequencySource === 'midi-only'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                    }`}
                    title="MIDI note synthetic frequencies"
                  >
                    <Music className="w-3 h-3" />
                    MIDI
                  </button>
                  <button
                    onClick={() => handleFrequencySourceChange('mic+drums')}
                    className={`px-3 py-2 text-xs rounded transition-colors min-h-[44px] flex items-center justify-center ${
                      frequencySource === 'mic+drums'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                    }`}
                    title="Blend microphone and drum frequencies"
                  >
                    Mic+Drums
                  </button>
                  <button
                    onClick={() => handleFrequencySourceChange('all')}
                    className={`px-3 py-2 text-xs rounded transition-colors min-h-[44px] flex items-center justify-center ${
                      frequencySource === 'all'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                    }`}
                    title="Mix all sources"
                  >
                    All
                  </button>
                </div>
              </div>
              )}
            </div>

            {/* LED Matrix Manager - Virtual pixel preview and LED output */}
            <div className="mt-4">
              <LEDMatrixManager />
            </div>

            {showSettings && (
              <div className="mt-4">
                <CollapsiblePanel title="Settings" defaultOpen={true}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Audio Input Device</label>
                      <select
                        value={selectedDeviceId}
                        onChange={(e) => setSelectedDeviceId(e.target.value)}
                        disabled={isInitialized}
                        className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-primary-500 focus:outline-none disabled:opacity-50 text-sm"
                      >
                        {devices.map((device) => (
                          <option key={device.deviceId} value={device.deviceId}>
                            {device.label || `Device ${device.deviceId.substring(0, 8)}`}
                          </option>
                        ))}
                      </select>
                      {isInitialized && (
                        <p className="text-xs text-gray-500 mt-1">
                          Restart to change device
                        </p>
                      )}
                    </div>
                  </div>
                </CollapsiblePanel>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Full-screen mode: original layout
  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
          )}
          <h1 className="text-2xl font-bold text-white">Live Audio Visualizer</h1>
          <span className="px-2 py-1 text-xs font-semibold bg-orange-500 text-white rounded">
            Beta
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Stats */}
          {isInitialized && (
            <div className="flex gap-6 text-sm">
              <div className="text-gray-400">
                FPS: <span className="text-white font-mono">{fps}</span>
              </div>
              <div className="text-gray-400">
                RMS: <span className="text-white font-mono">{(rms * 100).toFixed(1)}%</span>
              </div>
              <div className="text-gray-400">
                Peak: <span className="text-white font-mono">{peakFreq.frequency.toFixed(0)} Hz</span>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${
              showSettings ? 'bg-primary-600 text-white' : 'hover:bg-gray-700 text-gray-400'
            }`}
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Visualization area */}
        <main className="flex-1 flex flex-col p-6">
          {!isInitialized && !error && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <Mic className="w-16 h-16 text-primary-500 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-white mb-4">
                  Live Audio Spectrum Analyzer
                </h2>
                <p className="text-gray-400 mb-8">
                  Visualize live audio input with real-time frequency analysis.
                  Click Start to enable microphone access.
                </p>
                <button
                  onClick={() => handleStart(selectedDeviceId)}
                  className="px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white text-lg font-semibold rounded-lg transition-colors shadow-lg"
                >
                  🎤 Start Audio Input
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="flex-1 flex items-center justify-center">
              <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 max-w-md">
                <h3 className="text-red-400 font-semibold mb-2">Audio Error</h3>
                <p className="text-gray-300 text-sm mb-4">{error}</p>
                <button
                  onClick={() => handleStart(selectedDeviceId)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {isInitialized && (
            <>
              {/* Canvas visualization */}
              <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden shadow-2xl border border-gray-700 mb-4">
                <canvas
                  ref={canvasRef}
                  className="w-full h-full cursor-crosshair"
                  onClick={handleCanvasClick}
                />
              </div>

              {/* Controls */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Mode selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">Mode:</span>
                    <button
                      onClick={() => handleModeChange('spectrum')}
                      className={`px-3 py-1.5 text-sm rounded transition-colors ${
                        currentMode === 'spectrum'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      }`}
                    >
                      <Activity className="w-4 h-4 inline mr-1" />
                      Spectrum
                    </button>
                    <button
                      onClick={() => handleModeChange('waveform')}
                      className={`px-3 py-1.5 text-sm rounded transition-colors ${
                        currentMode === 'waveform'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      }`}
                    >
                      Waveform
                    </button>
                    <button
                      onClick={() => handleModeChange('ripple')}
                      className={`px-3 py-1.5 text-sm rounded transition-colors ${
                        currentMode === 'ripple'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      }`}
                    >
                      Ripple
                    </button>
                  </div>

                  {/* Ripple direction controls (only visible in ripple mode) */}
                  {currentMode === 'ripple' && (
                    <div className="flex items-center gap-2 border-l border-gray-700 pl-4">
                      <span className="text-gray-400 text-sm">Direction:</span>
                      <button
                        onClick={() => handleRippleDirection('radial')}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          currentRippleDirection === 'radial'
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        }`}
                      >
                        radial
                      </button>
                      <button
                        onClick={() => handleRippleDirection('bottom-top')}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          currentRippleDirection === 'bottom-top' || currentRippleDirection === 'top-bottom'
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        }`}
                      >
                        {currentRippleDirection === 'bottom-top' ? 'top-bottom' : 'bottom-top'}
                      </button>
                      <button
                        onClick={() => handleRippleDirection('left-right')}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          currentRippleDirection === 'left-right' || currentRippleDirection === 'right-left'
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        }`}
                      >
                        {currentRippleDirection === 'left-right' ? 'right-left' : 'left-right'}
                      </button>
                      <span className="text-xs text-gray-500">(or click canvas)</span>
                    </div>
                  )}

                  {/* Gain control */}
                  <div className="flex items-center gap-2 border-l border-gray-700 pl-4 ml-auto">
                    <span className="text-gray-400 text-sm">Gain:</span>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={gain}
                      onChange={(e) => handleGainChange(parseFloat(e.target.value))}
                      className="w-32"
                    />
                    <span className="text-white font-mono text-sm w-12 text-right">
                      {(gain * 100).toFixed(0)}%
                    </span>
                  </div>

                  {/* Frequency scale selector */}
                  <div className="flex items-center gap-2 border-l border-gray-700 pl-4">
                    <span className="text-gray-400 text-sm">Scale:</span>
                    <select
                      value={frequencyScale}
                      onChange={(e) => setFrequencyScale(e.target.value as 'log' | 'linear' | 'quadratic')}
                      className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded border border-gray-600 focus:border-primary-500 focus:outline-none"
                    >
                      <option value="log">Log</option>
                      <option value="quadratic">Quadratic</option>
                      <option value="linear">Linear</option>
                    </select>
                  </div>

                  {/* Frequency Source selector */}
                  <div className="flex items-center gap-2 border-l border-gray-700 pl-4">
                    <span className="text-gray-400 text-sm">Source:</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleFrequencySourceChange('mic-only')}
                        className={`px-2 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
                          frequencySource === 'mic-only'
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        }`}
                        title="Microphone audio only"
                      >
                        <Mic className="w-3 h-3" />
                        Mic
                      </button>
                      <button
                        onClick={() => handleFrequencySourceChange('drums-only')}
                        className={`px-2 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
                          frequencySource === 'drums-only'
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        }`}
                        title="Drum machine synthetic frequencies"
                      >
                        <Drum className="w-3 h-3" />
                        Drums
                      </button>
                      <button
                        onClick={() => handleFrequencySourceChange('midi-only')}
                        className={`px-2 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
                          frequencySource === 'midi-only'
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        }`}
                        title="MIDI note synthetic frequencies"
                      >
                        <Music className="w-3 h-3" />
                        MIDI
                      </button>
                      <button
                        onClick={() => handleFrequencySourceChange('mic+drums')}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          frequencySource === 'mic+drums'
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        }`}
                        title="Blend microphone and drums"
                      >
                        Mic+Drums
                      </button>
                      <button
                        onClick={() => handleFrequencySourceChange('all')}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          frequencySource === 'all'
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        }`}
                        title="Mix all sources"
                      >
                        All
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>

        {/* Settings sidebar - always rendered but conditionally visible */}
        <aside className={`w-80 bg-gray-800 border-l border-gray-700 p-6 overflow-y-auto flex-shrink-0 ${showSettings ? '' : 'hidden'}`}>
          <h3 className="text-lg font-semibold text-white mb-4">Settings</h3>

          {/* Audio input device selector */}
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">Audio Input Device</label>
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              disabled={isInitialized}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-primary-500 focus:outline-none disabled:opacity-50 text-sm"
            >
              {devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Device ${device.deviceId.substring(0, 8)}`}
                </option>
              ))}
            </select>
            {isInitialized && (
              <p className="text-xs text-gray-500 mt-1">
                Restart to change device
              </p>
            )}
          </div>

          {/* LED Matrix Manager - Always rendered for LED output */}
          <div className="mb-6">
            <LEDMatrixManager />
          </div>
        </aside>
      </div>
    </div>
  );
};
