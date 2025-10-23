/**
 * Launchpad Pro Experimental Module
 *
 * Standalone experimental module to verify:
 * - Connection to Launchpad Pro (Mk3 and 2015)
 * - LED control (RGB color output)
 * - Button press detection and mapping verification
 *
 * Based on research/launchpad-pro-integration-findings.md
 */

import React, { useState, useEffect, useRef } from 'react';
import { ViewTemplate, ViewCard } from '@/components/Layout/ViewTemplate';
import { Power, Lightbulb, Activity, Trash2, RefreshCw } from 'lucide-react';
import { LaunchpadProController, LaunchpadModel } from '@/hardware/launchpad/LaunchpadProController';

interface MIDILogEntry {
  timestamp: number;
  type: 'press' | 'release' | 'aftertouch' | 'connection' | 'error';
  note?: number;
  velocity?: number;
  pressure?: number;
  message?: string;
}

interface LaunchpadProExperimentProps {
  onBack: () => void;
}

export const LaunchpadProExperiment: React.FC<LaunchpadProExperimentProps> = ({ onBack }) => {
  const [connected, setConnected] = useState(false);
  const [deviceModel, setDeviceModel] = useState<LaunchpadModel>('mk3');
  const [midiLog, setMidiLog] = useState<MIDILogEntry[]>([]);
  const [selectedColor, setSelectedColor] = useState({ r: 63, g: 0, b: 0 }); // Red
  const [gridLEDs, setGridLEDs] = useState<Map<number, { r: number; g: number; b: number }>>(new Map());
  const [lastPressedNote, setLastPressedNote] = useState<number | null>(null);

  const controllerRef = useRef<LaunchpadProController | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Initialize controller
  useEffect(() => {
    controllerRef.current = new LaunchpadProController(deviceModel);

    // Setup event listeners
    const controller = controllerRef.current;

    controller.addEventListener('hardware_input', (event) => {
      const data = event.data as any;

      if (data.inputType === 'pad_press') {
        addLog({
          timestamp: Date.now(),
          type: 'press',
          note: data.note,
          velocity: data.velocity,
        });
        setLastPressedNote(data.note);
      } else if (data.inputType === 'pad_release') {
        addLog({
          timestamp: Date.now(),
          type: 'release',
          note: data.note,
        });
      } else if (data.inputType === 'aftertouch') {
        addLog({
          timestamp: Date.now(),
          type: 'aftertouch',
          note: data.note,
          pressure: data.pressure,
        });
      } else if (data.inputType === 'control_button') {
        addLog({
          timestamp: Date.now(),
          type: data.pressed ? 'press' : 'release',
          note: data.note,
          velocity: data.velocity,
        });
        setLastPressedNote(data.note);
      }
    });

    controller.addEventListener('connection_change', (event) => {
      const data = event.data as any;
      setConnected(data.connected);

      addLog({
        timestamp: Date.now(),
        type: 'connection',
        message: data.connected
          ? `Connected to ${data.deviceName} (${data.model})`
          : 'Disconnected',
      });

      if (data.connected) {
        setDeviceModel(data.model);
      }
    });

    return () => {
      if (controllerRef.current?.connectionStatus === 'connected') {
        controllerRef.current.disconnect();
      }
    };
  }, [deviceModel]);

  // Auto-scroll log
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [midiLog]);

  const addLog = (entry: MIDILogEntry) => {
    setMidiLog(prev => [...prev.slice(-99), entry]); // Keep last 100 entries
  };

  const handleConnect = async () => {
    if (!controllerRef.current) return;

    try {
      await controllerRef.current.connect();
    } catch (error) {
      addLog({
        timestamp: Date.now(),
        type: 'error',
        message: (error as Error).message,
      });
    }
  };

  const handleDisconnect = async () => {
    if (!controllerRef.current) return;

    try {
      await controllerRef.current.disconnect();
    } catch (error) {
      addLog({
        timestamp: Date.now(),
        type: 'error',
        message: (error as Error).message,
      });
    }
  };

  const handleClearLEDs = () => {
    if (!controllerRef.current || !connected) return;

    // Clear all LEDs by setting them to black
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const note = row * 16 + col;
        setLEDColor(note, 0, 0, 0);
      }
    }

    // Clear control buttons
    [91, 92, 93, 94, 95, 96, 97, 98].forEach(note => setLEDColor(note, 0, 0, 0));
    [89, 79, 69, 59, 49, 39, 29, 19].forEach(note => setLEDColor(note, 0, 0, 0));
    [80, 70, 60, 50, 40, 30, 20, 10].forEach(note => setLEDColor(note, 0, 0, 0));

    setGridLEDs(new Map());
  };

  const handleTestPattern = () => {
    if (!controllerRef.current || !connected) return;

    // Create rainbow pattern across grid
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const note = row * 16 + col;
        const hue = (col / 8) * 360;
        const brightness = (row / 7) * 63;
        const { r, g, b } = hslToRGB(hue, 100, 50);

        setLEDColor(
          note,
          Math.floor(r * brightness / 63),
          Math.floor(g * brightness / 63),
          Math.floor(b * brightness / 63)
        );
      }
    }
  };

  const setLEDColor = (note: number, r: number, g: number, b: number) => {
    if (!controllerRef.current) return;

    // Call internal setLED method via reflection (private method)
    // @ts-ignore - accessing private method for testing
    controllerRef.current.setLED(note, r, g, b);

    // Update local state for visual feedback
    setGridLEDs(prev => {
      const next = new Map(prev);
      next.set(note, { r, g, b });
      return next;
    });
  };

  const handleGridClick = (note: number) => {
    if (!connected) return;
    setLEDColor(note, selectedColor.r, selectedColor.g, selectedColor.b);
  };

  const clearLog = () => {
    setMidiLog([]);
  };

  // Color presets
  const colorPresets = [
    { name: 'Red', r: 63, g: 0, b: 0 },
    { name: 'Orange', r: 63, g: 32, b: 0 },
    { name: 'Yellow', r: 63, g: 63, b: 0 },
    { name: 'Green', r: 0, g: 63, b: 0 },
    { name: 'Cyan', r: 0, g: 63, b: 63 },
    { name: 'Blue', r: 0, g: 0, b: 63 },
    { name: 'Purple', r: 32, g: 0, b: 63 },
    { name: 'Magenta', r: 63, g: 0, b: 63 },
    { name: 'White', r: 63, g: 63, b: 63 },
    { name: 'Off', r: 0, g: 0, b: 0 },
  ];

  return (
    <ViewTemplate
      title="Launchpad Pro Test"
      subtitle="Hardware connection and LED/button verification"
      onBack={onBack}
      variant="full-width"
      maxWidth="7xl"
      badge="Experiment"
      badgeVariant="blue"
    >
      {/* Connection Controls */}
      <ViewCard title="Connection">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              connected ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
            }`}>
              <Power className="w-5 h-5" />
              <span className="font-medium">
                {connected ? `Connected (${deviceModel.toUpperCase()})` : 'Disconnected'}
              </span>
            </div>

            {!connected ? (
              <button
                onClick={handleConnect}
                className="btn-primary"
              >
                Connect
              </button>
            ) : (
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Disconnect
              </button>
            )}

            <button
              onClick={handleClearLEDs}
              disabled={!connected}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear LEDs
            </button>

            <button
              onClick={handleTestPattern}
              disabled={!connected}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Lightbulb className="w-4 h-4" />
              Test Pattern
            </button>
          </div>

          {!connected && (
            <div className="text-sm text-gray-400">
              Make sure your Launchpad Pro is connected via USB and in Programmer Mode will be set automatically.
            </div>
          )}
        </div>
      </ViewCard>

      {/* Grid Visualization */}
      <ViewCard title="Grid Visualization" large>
        <div className="space-y-4">
          {/* Color Picker */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Paint Color:</span>
            <div className="flex gap-2 flex-wrap">
              {colorPresets.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => setSelectedColor(preset)}
                  className={`w-10 h-10 rounded-lg border-2 transition-all ${
                    selectedColor.r === preset.r &&
                    selectedColor.g === preset.g &&
                    selectedColor.b === preset.b
                      ? 'border-white scale-110'
                      : 'border-gray-600 hover:border-gray-400'
                  }`}
                  style={{
                    backgroundColor: `rgb(${preset.r * 4}, ${preset.g * 4}, ${preset.b * 4})`
                  }}
                  title={preset.name}
                />
              ))}
            </div>
          </div>

          {/* Top Control Row */}
          <div className="flex justify-center gap-1">
            {[91, 92, 93, 94, 95, 96, 97, 98].map(note => (
              <LaunchpadButton
                key={note}
                note={note}
                color={gridLEDs.get(note)}
                onClick={() => handleGridClick(note)}
                isPressed={lastPressedNote === note}
                disabled={!connected}
                size="sm"
              />
            ))}
          </div>

          {/* Main Grid with Side Buttons */}
          <div className="flex gap-2 justify-center">
            {/* Left Column */}
            <div className="flex flex-col gap-1">
              {[80, 70, 60, 50, 40, 30, 20, 10].map(note => (
                <LaunchpadButton
                  key={note}
                  note={note}
                  color={gridLEDs.get(note)}
                  onClick={() => handleGridClick(note)}
                  isPressed={lastPressedNote === note}
                  disabled={!connected}
                  size="sm"
                />
              ))}
            </div>

            {/* 8x8 Grid (row 7 to row 0, top to bottom) */}
            <div className="flex flex-col gap-1">
              {[7, 6, 5, 4, 3, 2, 1, 0].map(row => (
                <div key={row} className="flex gap-1">
                  {[0, 1, 2, 3, 4, 5, 6, 7].map(col => {
                    const note = row * 16 + col;
                    return (
                      <LaunchpadButton
                        key={note}
                        note={note}
                        color={gridLEDs.get(note)}
                        onClick={() => handleGridClick(note)}
                        isPressed={lastPressedNote === note}
                        disabled={!connected}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-1">
              {[89, 79, 69, 59, 49, 39, 29, 19].map(note => (
                <LaunchpadButton
                  key={note}
                  note={note}
                  color={gridLEDs.get(note)}
                  onClick={() => handleGridClick(note)}
                  isPressed={lastPressedNote === note}
                  disabled={!connected}
                  size="sm"
                />
              ))}
            </div>
          </div>

          <div className="text-sm text-gray-400 text-center">
            Click buttons to paint with selected color. Press physical pads to verify MIDI mapping.
          </div>
        </div>
      </ViewCard>

      {/* MIDI Event Log */}
      <ViewCard title="MIDI Event Log">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-400">
              <Activity className="w-4 h-4" />
              <span className="text-sm">{midiLog.length} events</span>
            </div>
            <button
              onClick={clearLog}
              className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              Clear Log
            </button>
          </div>

          <div
            ref={logContainerRef}
            className="bg-gray-900 rounded-lg p-3 font-mono text-xs h-64 overflow-y-auto border border-gray-700"
          >
            {midiLog.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                No events yet. Press buttons on your Launchpad to see MIDI messages.
              </div>
            ) : (
              <div className="space-y-1">
                {midiLog.map((entry, index) => (
                  <MIDILogLine key={index} entry={entry} />
                ))}
              </div>
            )}
          </div>
        </div>
      </ViewCard>

      {/* Documentation */}
      <ViewCard title="About This Experiment">
        <div className="prose prose-invert max-w-none text-sm">
          <p className="text-gray-300">
            This experimental module tests the Launchpad Pro MIDI integration. It verifies:
          </p>
          <ul className="text-gray-400 space-y-1">
            <li><strong>Device Connection:</strong> Web MIDI API detection of Launchpad Pro Mk3 or 2015 models</li>
            <li><strong>LED Control:</strong> RGB SysEx messages to control all 64 grid pads plus control buttons</li>
            <li><strong>Button Input:</strong> MIDI Note On/Off messages from physical button presses</li>
            <li><strong>Velocity Sensitivity:</strong> Capture velocity data (0-127) from pad presses</li>
            <li><strong>Note Mapping:</strong> Verify MIDI note numbers match physical grid positions</li>
          </ul>
          <p className="text-gray-300 mt-4">
            <strong>Usage:</strong> Click "Connect" to initialize the device. Click virtual buttons to paint LED colors.
            Press physical pads to see MIDI events in the log and verify the mapping is correct.
          </p>
        </div>
      </ViewCard>
    </ViewTemplate>
  );
};

// Button Component
interface LaunchpadButtonProps {
  note: number;
  color?: { r: number; g: number; b: number };
  onClick: () => void;
  isPressed: boolean;
  disabled: boolean;
  size?: 'sm' | 'md';
}

const LaunchpadButton: React.FC<LaunchpadButtonProps> = ({
  note,
  color = { r: 0, g: 0, b: 0 },
  onClick,
  isPressed,
  disabled,
  size = 'md',
}) => {
  const sizeClass = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10 sm:w-12 sm:h-12';
  const rgb = `rgb(${color.r * 4}, ${color.g * 4}, ${color.b * 4})`;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${sizeClass} rounded-lg border-2 transition-all relative ${
        isPressed
          ? 'border-accent-400 scale-95 shadow-lg shadow-accent-500/50'
          : 'border-gray-700 hover:border-gray-500'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      style={{ backgroundColor: rgb }}
      title={`Note ${note}`}
    >
      <span className="absolute inset-0 flex items-center justify-center text-[8px] font-mono text-white/40">
        {note}
      </span>
    </button>
  );
};

// MIDI Log Line Component
interface MIDILogLineProps {
  entry: MIDILogEntry;
}

const MIDILogLine: React.FC<MIDILogLineProps> = ({ entry }) => {
  // Format timestamp with milliseconds
  const date = new Date(entry.timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
  const timestamp = `${hours}:${minutes}:${seconds}.${milliseconds}`;

  let color = 'text-gray-400';
  let icon = '';
  let message = '';

  switch (entry.type) {
    case 'press':
      color = 'text-green-400';
      icon = '▼';
      message = `Press   Note ${entry.note?.toString().padStart(3, ' ')} Velocity ${entry.velocity?.toString().padStart(3, ' ')}`;
      break;
    case 'release':
      color = 'text-blue-400';
      icon = '▲';
      message = `Release Note ${entry.note?.toString().padStart(3, ' ')}`;
      break;
    case 'aftertouch':
      color = 'text-purple-400';
      icon = '~';
      message = `Touch   Note ${entry.note?.toString().padStart(3, ' ')} Pressure ${entry.pressure?.toString().padStart(3, ' ')}`;
      break;
    case 'connection':
      color = 'text-yellow-400';
      icon = '●';
      message = entry.message || '';
      break;
    case 'error':
      color = 'text-red-400';
      icon = '✕';
      message = entry.message || '';
      break;
  }

  return (
    <div className={`flex gap-2 ${color}`}>
      <span className="text-gray-600">{timestamp}</span>
      <span>{icon}</span>
      <span>{message}</span>
    </div>
  );
};

// HSL to RGB conversion utility
function hslToRGB(h: number, s: number, l: number): { r: number; g: number; b: number } {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }

  return {
    r: Math.round((r + m) * 63),
    g: Math.round((g + m) * 63),
    b: Math.round((b + m) * 63),
  };
}
