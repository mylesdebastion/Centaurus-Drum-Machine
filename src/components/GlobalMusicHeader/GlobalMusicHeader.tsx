import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Music2,
  Palette,
  Volume2,
  VolumeX,
  Menu,
  X,
  ArrowUp,
  ArrowDown,
  Settings,
  Play,
  Pause,
} from 'lucide-react';
import { useGlobalMusic } from '../../contexts/GlobalMusicContext';
import { useResponsive } from '../../hooks/useResponsive';
import { ScaleSelector } from '../Music/ScaleSelector';
import { HardwareStatusIndicator } from '../../hardware/ui/HardwareStatusIndicator';
import { HardwareSettingsModal } from './HardwareSettingsModal';
import { audioEngine } from '../../utils/audioEngine';
import { ColorMode } from '../../utils/colorMapping';

/**
 * Tempo Control Component
 * Includes BPM input, tap tempo button, and visual tempo indicator
 */
interface TempoControlProps {
  tempo: number;
  onTempoChange: (tempo: number) => void;
  isCompact?: boolean;
}

const TempoControl: React.FC<TempoControlProps> = ({ tempo, onTempoChange, isCompact = false }) => {
  const [inputValue, setInputValue] = useState(tempo.toString());
  const [isPulsing, setIsPulsing] = useState(false);
  const tapTimes = useRef<number[]>([]);

  // Sync input value with prop
  useEffect(() => {
    setInputValue(tempo.toString());
  }, [tempo]);

  // Tap tempo handler
  const handleTapTempo = useCallback(() => {
    const now = performance.now();

    // Reset if gap > 3 seconds
    if (tapTimes.current.length > 0 && now - tapTimes.current[tapTimes.current.length - 1] > 3000) {
      tapTimes.current = [];
    }

    tapTimes.current.push(now);

    // Need at least 2 taps to calculate BPM
    if (tapTimes.current.length >= 2) {
      // Keep only last 4 taps
      if (tapTimes.current.length > 4) tapTimes.current.shift();

      // Calculate average interval
      const intervals: number[] = [];
      for (let i = 1; i < tapTimes.current.length; i++) {
        intervals.push(tapTimes.current[i] - tapTimes.current[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;

      // Convert to BPM
      const bpm = Math.round(60000 / avgInterval);
      onTempoChange(Math.max(40, Math.min(300, bpm))); // Clamp to valid range
    }

    // Trigger pulse animation
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 100);
  }, [onTempoChange]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Handle input blur (validate and update)
  const handleInputBlur = () => {
    const parsed = parseInt(inputValue, 10);
    if (!isNaN(parsed) && parsed >= 40 && parsed <= 300) {
      onTempoChange(parsed);
    } else {
      setInputValue(tempo.toString()); // Reset to current tempo
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur();
      e.currentTarget.blur();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      onTempoChange(Math.min(300, tempo + 5));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      onTempoChange(Math.max(40, tempo - 5));
    }
  };

  return (
    <div className={`flex items-center gap-2 ${isCompact ? 'flex-col sm:flex-row' : ''}`}>
      <div className="flex items-center gap-2">
        <button
          onClick={handleTapTempo}
          className={`p-2 rounded-lg bg-primary-600 hover:bg-primary-700 transition-all transform ${
            isPulsing ? 'scale-110' : 'scale-100'
          }`}
          title="Tap Tempo"
          aria-label="Tap Tempo"
        >
          <Music2 className="w-5 h-5 text-white" />
        </button>

        <div className="flex items-center gap-1">
          <input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            min="40"
            max="300"
            className="w-16 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="Tempo BPM"
          />
          <span className="text-sm text-gray-400">BPM</span>
        </div>
      </div>

      {!isCompact && (
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => onTempoChange(Math.min(300, tempo + 5))}
            className="p-0.5 hover:bg-gray-700 rounded transition-colors"
            aria-label="Increase Tempo"
          >
            <ArrowUp className="w-3 h-3 text-gray-400" />
          </button>
          <button
            onClick={() => onTempoChange(Math.max(40, tempo - 5))}
            className="p-0.5 hover:bg-gray-700 rounded transition-colors"
            aria-label="Decrease Tempo"
          >
            <ArrowDown className="w-3 h-3 text-gray-400" />
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Color Mode Toggle Component
 * Cycles through spectrum, chromatic, and harmonic visualization modes
 */
interface ColorModeToggleProps {
  mode: ColorMode;
  onModeChange: (mode: ColorMode) => void;
}

const ColorModeToggle: React.FC<ColorModeToggleProps> = ({ mode, onModeChange }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Cycle through modes: spectrum → chromatic → harmonic → spectrum
  const handleCycleMode = () => {
    if (mode === 'spectrum') {
      onModeChange('chromatic');
    } else if (mode === 'chromatic') {
      onModeChange('harmonic');
    } else {
      onModeChange('spectrum');
    }
  };

  const tooltipText =
    mode === 'spectrum'
      ? 'Spectrum: Full rainbow spectrum (Red to Violet)'
      : mode === 'chromatic'
      ? 'Chromatic: Colors by pitch (C=Red, D=Orange, etc.)'
      : 'Harmonic: Colors by scale degree (Tonic=Blue, Dominant=Purple)';

  return (
    <div className="relative">
      <button
        onClick={handleCycleMode}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="p-2 rounded-lg bg-accent-600 hover:bg-accent-700 transition-all transform hover:scale-105"
        title={tooltipText}
        aria-label={`Color Mode: ${mode}`}
      >
        <Palette className="w-5 h-5 text-white" />
      </button>

      {showTooltip && (
        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 w-64 bg-gray-900 text-white text-xs rounded-lg p-2 z-50 shadow-xl border border-gray-700">
          {tooltipText}
        </div>
      )}
    </div>
  );
};

/**
 * Transport Controls Component
 * Epic 14, Story 14.2 - Global play/pause transport control
 * Provides DAW-style master transport synchronization
 */
interface TransportControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
}

const TransportControls: React.FC<TransportControlsProps> = ({ isPlaying, onTogglePlay }) => {
  return (
    <button
      onClick={onTogglePlay}
      className={`p-2 rounded-lg transition-all transform hover:scale-105 ${
        isPlaying
          ? 'bg-accent-600 hover:bg-accent-700' // Playing: accent color
          : 'bg-primary-600 hover:bg-primary-700' // Paused: primary color
      }`}
      title={isPlaying ? 'Pause' : 'Play'}
      aria-label={isPlaying ? 'Pause global transport' : 'Play global transport'}
    >
      {isPlaying ? (
        <Pause className="w-5 h-5 text-white" />
      ) : (
        <Play className="w-5 h-5 text-white" />
      )}
    </button>
  );
};

/**
 * Master Volume Slider Component
 * Controls global audio output volume
 */
interface VolumeSliderProps {
  volume: number; // 0-1
  onVolumeChange: (volume: number) => void;
  isCompact?: boolean;
}

const VolumeSlider: React.FC<VolumeSliderProps> = ({ volume, onVolumeChange, isCompact = false }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(volume);
  const [showPercentage, setShowPercentage] = useState(false);

  // Handle mute toggle
  const handleMuteToggle = () => {
    if (isMuted) {
      onVolumeChange(previousVolume);
      setIsMuted(false);
    } else {
      setPreviousVolume(volume);
      onVolumeChange(0);
      setIsMuted(true);
    }
  };

  // Handle slider change
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    onVolumeChange(newVolume);
    setIsMuted(newVolume === 0);

    // Update AudioEngine in real-time
    audioEngine.setMasterVolume(newVolume);
  };

  return (
    <div className={`flex items-center gap-2 ${isCompact ? 'w-full' : ''}`}>
      <button
        onClick={handleMuteToggle}
        className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
        title={isMuted ? 'Unmute' : 'Mute'}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted || volume === 0 ? (
          <VolumeX className="w-5 h-5 text-gray-400" />
        ) : (
          <Volume2 className="w-5 h-5 text-gray-300" />
        )}
      </button>

      <div
        className={`relative ${isCompact ? 'flex-1' : 'w-24'}`}
        onMouseEnter={() => setShowPercentage(true)}
        onMouseLeave={() => setShowPercentage(false)}
      >
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleSliderChange}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
          aria-label="Master Volume"
        />

        {showPercentage && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
            {Math.round(volume * 100)}%
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Global Music Header Component
 * Persistent header bar with tempo, key, scale, and settings controls
 */
export const GlobalMusicHeader: React.FC = () => {
  const music = useGlobalMusic();
  const { isMobile, isTablet } = useResponsive();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState(false);

  // Transport toggle handler (Epic 14, Story 14.2)
  const handleTogglePlay = useCallback(() => {
    music.updateTransportState(!music.isPlaying);
  }, [music]);

  // Load menu state from localStorage
  useEffect(() => {
    const savedMenuState = localStorage.getItem('global-music-header-menu-open');
    if (savedMenuState) {
      setIsMobileMenuOpen(JSON.parse(savedMenuState));
    }
  }, []);

  // Persist menu state to localStorage
  useEffect(() => {
    localStorage.setItem('global-music-header-menu-open', JSON.stringify(isMobileMenuOpen));
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Hardware Settings Modal */}
      <HardwareSettingsModal
        isOpen={isHardwareModalOpen}
        onClose={() => setIsHardwareModalOpen(false)}
      />

      {/* Main Header Bar */}
      <header className="sticky top-0 z-40 bg-gray-800 border-b border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Desktop/Tablet Layout */}
          {!isMobile && (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Epic 14, Story 14.2: Transport Controls */}
                <TransportControls
                  isPlaying={music.isPlaying}
                  onTogglePlay={handleTogglePlay}
                />

                <TempoControl
                  tempo={music.tempo}
                  onTempoChange={music.updateTempo}
                  isCompact={isTablet}
                />

                <div className="flex items-center gap-2">
                  <ScaleSelector
                    selectedRoot={music.key}
                    selectedScale={music.scale}
                    rootNotes={music.rootNotes}
                    scaleNames={music.scaleNames}
                    onRootChange={music.updateKey}
                    onScaleChange={music.updateScale}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <ColorModeToggle mode={music.colorMode} onModeChange={music.updateColorMode} />

                <VolumeSlider
                  volume={music.masterVolume}
                  onVolumeChange={music.updateMasterVolume}
                  isCompact={isTablet}
                />

                <button
                  onClick={() => setIsHardwareModalOpen(true)}
                  className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-all relative group"
                  title="Hardware Settings (MIDI/WLED)"
                  aria-label="Hardware Settings"
                >
                  <Settings className="w-5 h-5 text-gray-300 group-hover:text-white" />
                  {music.hardware.midi.connected && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
                  )}
                </button>

                {!isTablet && (
                  <div className="relative">
                    <HardwareStatusIndicator
                      showDeviceInfo={true}
                      showCompatibilityInfo={true}
                      className=""
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile Layout */}
          {isMobile && (
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                    aria-label="Toggle Menu"
                  >
                    {isMobileMenuOpen ? (
                      <X className="w-6 h-6 text-white" />
                    ) : (
                      <Menu className="w-6 h-6 text-white" />
                    )}
                  </button>

                  {/* Epic 14, Story 14.2: Transport Controls (Mobile) */}
                  <TransportControls
                    isPlaying={music.isPlaying}
                    onTogglePlay={handleTogglePlay}
                  />

                  <span className="text-white font-semibold">
                    {music.tempo} BPM • {music.getKeySignature()}
                  </span>
                </div>

                <ColorModeToggle mode={music.colorMode} onModeChange={music.updateColorMode} />
              </div>

              {/* Mobile Menu (Collapsible) */}
              {isMobileMenuOpen && (
                <div className="mt-4 space-y-4 pb-2 animate-slideDown">
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Tempo</label>
                      <TempoControl
                        tempo={music.tempo}
                        onTempoChange={music.updateTempo}
                        isCompact={true}
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Key & Scale</label>
                      <div className="flex items-center gap-2 flex-wrap">
                        <ScaleSelector
                          selectedRoot={music.key}
                          selectedScale={music.scale}
                          rootNotes={music.rootNotes}
                          scaleNames={music.scaleNames}
                          onRootChange={music.updateKey}
                          onScaleChange={music.updateScale}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Volume</label>
                      <VolumeSlider
                        volume={music.masterVolume}
                        onVolumeChange={music.updateMasterVolume}
                        isCompact={true}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Spacer to prevent content overlap */}
      <style>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }

        .slider-thumb::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
      `}</style>
    </>
  );
};
