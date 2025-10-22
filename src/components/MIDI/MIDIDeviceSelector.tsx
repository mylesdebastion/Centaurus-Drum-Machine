import React from 'react';
import { Music, Keyboard } from 'lucide-react';
import { useMIDIInput } from '../../hooks/useMIDIInput';

interface MIDIDeviceSelectorProps {
  /**
   * Callback when device changes
   */
  onDeviceChange?: (deviceId: string) => void;

  /**
   * Show keyboard fallback toggle
   * @default true
   */
  showKeyboardToggle?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * MIDI Device Selector Component
 *
 * Features:
 * - Device enumeration and selection
 * - Keyboard fallback mode (QWERTY → MIDI)
 * - Real-time device status
 * - Keyboard map reference
 *
 * @example
 * ```tsx
 * <MIDIDeviceSelector
 *   onDeviceChange={(id) => console.log('Selected:', id)}
 * />
 * ```
 */
export const MIDIDeviceSelector: React.FC<MIDIDeviceSelectorProps> = ({
  onDeviceChange,
  showKeyboardToggle = true,
  className = '',
}) => {
  const {
    devices,
    activeDeviceId,
    isReady,
    isKeyboardMode,
    selectDevice,
    enableKeyboardMode,
    disableKeyboardMode,
  } = useMIDIInput({ autoInitialize: true });

  const handleDeviceSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const deviceId = event.target.value;
    if (deviceId) {
      selectDevice(deviceId);
      onDeviceChange?.(deviceId);
    }
  };

  const handleKeyboardToggle = () => {
    if (isKeyboardMode) {
      disableKeyboardMode();
    } else {
      enableKeyboardMode();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* MIDI Device Selection */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
          <Music className="w-4 h-4" />
          MIDI Input Device
        </label>

        {isReady && devices.length > 0 ? (
          <select
            value={activeDeviceId || ''}
            onChange={handleDeviceSelect}
            className="
              w-full px-3 py-2
              bg-gray-700 border border-gray-600 rounded-lg
              text-white text-sm
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
              transition-colors
            "
          >
            <option value="">Select a device...</option>
            {devices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.name}
                {device.manufacturer && ` (${device.manufacturer})`}
                {device.state === 'disconnected' && ' [Disconnected]'}
              </option>
            ))}
          </select>
        ) : (
          <div className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-400">
            {!isReady ? (
              <span>Web MIDI API not available in this browser</span>
            ) : (
              <span>No MIDI devices detected. Connect a MIDI keyboard or controller.</span>
            )}
          </div>
        )}

        {/* Device Status */}
        {activeDeviceId && (
          <div className="mt-2 text-xs text-green-400">
            ✓ Connected to MIDI device
          </div>
        )}
      </div>

      {/* Keyboard Fallback Mode */}
      {showKeyboardToggle && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="keyboard-fallback"
              checked={isKeyboardMode}
              onChange={handleKeyboardToggle}
              className="
                w-4 h-4
                text-primary-600 bg-gray-700 border-gray-600
                rounded
                focus:ring-2 focus:ring-primary-500
                cursor-pointer
              "
            />
            <label
              htmlFor="keyboard-fallback"
              className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer"
            >
              <Keyboard className="w-4 h-4" />
              Use QWERTY keyboard as MIDI input
            </label>
          </div>

          {/* Keyboard Map Reference */}
          {isKeyboardMode && (
            <div className="text-xs text-gray-400 bg-gray-800 p-3 rounded-lg border border-gray-700">
              <div className="font-medium mb-2">Keyboard Mapping:</div>
              <div className="space-y-1 font-mono">
                <div>
                  <strong className="text-gray-300">White keys:</strong>{' '}
                  A=C4, S=D4, D=E4, F=F4, G=G4, H=A4, J=B4, K=C5
                </div>
                <div>
                  <strong className="text-gray-300">Black keys:</strong>{' '}
                  W=C#4, E=D#4, T=F#4, Y=G#4, U=A#4
                </div>
                <div>
                  <strong className="text-gray-300">Lower octave:</strong>{' '}
                  Z=C3, X=D3, C=E3, V=F3, B=G3, N=A3, M=B3
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
