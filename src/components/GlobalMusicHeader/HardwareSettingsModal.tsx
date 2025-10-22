import React, { useState, useEffect, useCallback } from 'react';
import { X, Wifi, WifiOff, Settings as SettingsIcon } from 'lucide-react';
import { useGlobalMusic } from '../../contexts/GlobalMusicContext';

/**
 * MIDI Device Information
 */
interface MIDIDeviceInfo {
  id: string;
  name: string;
  manufacturer?: string;
  type: 'input' | 'output';
}

/**
 * Hardware Settings Modal Props
 */
interface HardwareSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Hardware Settings Modal
 * Centralized MIDI and WLED device management accessible from global header
 * Story 4.4: Hardware I/O Integration Points
 */
export const HardwareSettingsModal: React.FC<HardwareSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const music = useGlobalMusic();
  const [midiInputs, setMidiInputs] = useState<MIDIDeviceInfo[]>([]);
  const [midiOutputs, setMidiOutputs] = useState<MIDIDeviceInfo[]>([]);
  const [midiError, setMidiError] = useState<string | null>(null);

  /**
   * Initialize Web MIDI API
   */
  useEffect(() => {
    if (!isOpen) return;

    const initMIDI = async () => {
      try {
        if (!navigator.requestMIDIAccess) {
          setMidiError('Web MIDI API not supported in this browser');
          return;
        }

        const access = await navigator.requestMIDIAccess();
        setMidiError(null);

        // Load devices
        updateMIDIDevices(access as any);

        // Listen for device connection/disconnection (hot-plug)
        access.addEventListener('statechange', () => {
          updateMIDIDevices(access as any);
        });

        console.log('[HardwareSettings] MIDI initialized successfully');
      } catch (error) {
        console.error('[HardwareSettings] MIDI initialization failed:', error);
        setMidiError(
          error instanceof Error ? error.message : 'Failed to access MIDI devices'
        );
      }
    };

    initMIDI();
  }, [isOpen]);

  /**
   * Update MIDI device lists
   */
  const updateMIDIDevices = useCallback((access: MIDIAccess) => {
    // Get input devices
    const inputs: MIDIDeviceInfo[] = [];
    access.inputs.forEach((input) => {
      inputs.push({
        id: input.id,
        name: input.name || 'Unnamed Input',
        manufacturer: input.manufacturer || undefined,
        type: 'input',
      });
    });
    setMidiInputs(inputs);

    // Get output devices
    const outputs: MIDIDeviceInfo[] = [];
    access.outputs.forEach((output) => {
      outputs.push({
        id: output.id,
        name: output.name || 'Unnamed Output',
        manufacturer: output.manufacturer || undefined,
        type: 'output',
      });
    });
    setMidiOutputs(outputs);

    console.log('[HardwareSettings] MIDI devices updated:', {
      inputs: inputs.length,
      outputs: outputs.length,
    });
  }, []);

  /**
   * Handle MIDI input device selection
   */
  const handleInputChange = (deviceId: string) => {
    const selectedId = deviceId === '' ? null : deviceId;
    music.updateMidiInput(selectedId);
    music.updateMidiConnected(selectedId !== null);
    console.log('[HardwareSettings] MIDI input selected:', selectedId);
  };

  /**
   * Handle MIDI output device selection
   */
  const handleOutputChange = (deviceId: string) => {
    const selectedId = deviceId === '' ? null : deviceId;
    music.updateMidiOutput(selectedId);
    console.log('[HardwareSettings] MIDI output selected:', selectedId);
  };

  /**
   * Close modal on ESC key
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fadeIn"
        onClick={onClose}
        aria-label="Close modal"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden pointer-events-auto animate-slideUp border border-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-600 rounded-lg">
                <SettingsIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Hardware Settings</h2>
                <p className="text-sm text-gray-400">
                  Manage MIDI controllers and WLED LED devices
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6 text-gray-400 hover:text-white" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {/* MIDI Devices Section */}
            <section className="mb-8">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                🎹 MIDI Devices
              </h3>

              {midiError ? (
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <WifiOff className="w-5 h-5 text-red-400 mt-0.5" />
                    <div>
                      <p className="text-red-300 font-semibold mb-1">MIDI Not Available</p>
                      <p className="text-red-200 text-sm">{midiError}</p>
                      <p className="text-red-200/70 text-xs mt-2">
                        Try using Chrome, Edge, or Opera for full MIDI support
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Input Device Selector */}
                  <div className="bg-gray-700 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      MIDI Input Device
                    </label>
                    <div className="flex items-center gap-3">
                      <select
                        value={music.hardware.midi.inputDevice ?? ''}
                        onChange={(e) => handleInputChange(e.target.value)}
                        className="flex-1 bg-gray-600 text-white rounded-lg px-4 py-2 border border-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">No input device selected</option>
                        {midiInputs.map((device) => (
                          <option key={device.id} value={device.id}>
                            {device.name}
                            {device.manufacturer && ` (${device.manufacturer})`}
                          </option>
                        ))}
                      </select>
                      <div title={music.hardware.midi.inputDevice ? "Connected" : "Not connected"}>
                        {music.hardware.midi.inputDevice ? (
                          <Wifi className="w-5 h-5 text-green-400" />
                        ) : (
                          <WifiOff className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                    </div>
                    {midiInputs.length === 0 && !midiError && (
                      <p className="text-sm text-gray-400 mt-2">
                        No MIDI input devices found. Connect a MIDI controller and refresh.
                      </p>
                    )}
                  </div>

                  {/* Output Device Selector */}
                  <div className="bg-gray-700 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      MIDI Output Device
                    </label>
                    <div className="flex items-center gap-3">
                      <select
                        value={music.hardware.midi.outputDevice ?? ''}
                        onChange={(e) => handleOutputChange(e.target.value)}
                        className="flex-1 bg-gray-600 text-white rounded-lg px-4 py-2 border border-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">No output device selected</option>
                        {midiOutputs.map((device) => (
                          <option key={device.id} value={device.id}>
                            {device.name}
                            {device.manufacturer && ` (${device.manufacturer})`}
                          </option>
                        ))}
                      </select>
                      <div title={music.hardware.midi.outputDevice ? "Connected" : "Not connected"}>
                        {music.hardware.midi.outputDevice ? (
                          <Wifi className="w-5 h-5 text-green-400" />
                        ) : (
                          <WifiOff className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                    </div>
                    {midiOutputs.length === 0 && !midiError && (
                      <p className="text-sm text-gray-400 mt-2">
                        No MIDI output devices found. Connect a MIDI device and refresh.
                      </p>
                    )}
                  </div>

                  {/* Connection Status */}
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Connection Status</span>
                      <div className="flex items-center gap-2">
                        {music.hardware.midi.connected ? (
                          <>
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-sm text-green-400">Connected</span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 bg-gray-500 rounded-full" />
                            <span className="text-sm text-gray-500">Not connected</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Divider */}
            <div className="border-t border-gray-700 my-8" />

            {/* WLED Devices Section */}
            <section>
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                💡 WLED LED Strips
              </h3>
              <div className="bg-gray-700/30 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-300">
                  WLED device management is currently handled per-view. Full global WLED
                  integration will be added in a future update. For now, use the WLED
                  settings in individual views (WLED Test, DJ Visualizer, etc.).
                </p>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700 bg-gray-800/50">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
};
