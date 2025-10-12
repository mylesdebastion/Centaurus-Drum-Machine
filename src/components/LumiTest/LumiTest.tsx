/**
 * LUMI Test Page - 1:1 Clone of xivilay/benob Demo
 * Purpose: Test LUMI SysEx protocol in isolation to debug integration
 * Based on: https://xivilay.github.io/lumi-web-control/
 */

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Zap, AlertCircle } from 'lucide-react';

interface MIDIDevice {
  id: string;
  name: string;
}

// BitArray class from benob/LUMI-lights
class BitArray {
  private values: number[] = [];
  private num_bits: number = 0;

  append(value: number, size: number = 7) {
    let current = Math.floor(this.num_bits / 7);
    let used_bits = Math.floor(this.num_bits % 7);
    let packed = 0;

    if (used_bits > 0) {
      packed = this.values[this.values.length - 1];
      this.values.pop();
    }

    this.num_bits += size;

    while (size > 0) {
      packed |= (value << used_bits) & 127;
      size -= (7 - used_bits);
      value >>= (7 - used_bits);
      this.values.push(packed);
      packed = 0;
      used_bits = 0;
    }
  }

  get(size: number = 32): number[] {
    while (this.values.length < 8) {
      this.values.push(0);
    }
    return this.values;
  }
}

// Checksum calculation from benob/LUMI-lights
function checksum(values: number[]): number {
  let sum = values.length;
  for (let i = 0; i < values.length; i++) {
    sum = (sum * 3 + values[i]) & 0xff;
  }
  return sum & 0x7f;
}

export const LumiTest: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [midiAccess, setMidiAccess] = useState<any>(null);
  const [outputDevices, setOutputDevices] = useState<MIDIDevice[]>([]);
  const [selectedOutputId, setSelectedOutputId] = useState<string | null>(null);
  const [selectedOutput, setSelectedOutput] = useState<any>(null);

  const [testColor, setTestColor] = useState({ r: 255, g: 0, b: 255 }); // Magenta default
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Initialize WebMIDI
  useEffect(() => {
    const initMIDI = async () => {
      try {
        addLog('🔌 Requesting MIDI access with SysEx permission...');
        const access = await (navigator as any).requestMIDIAccess({ sysex: true });
        setMidiAccess(access);
        addLog('✅ MIDI access granted');

        // Get output devices
        const outputs: MIDIDevice[] = [];
        access.outputs.forEach((output: any) => {
          outputs.push({
            id: output.id,
            name: output.name || 'Unknown Device'
          });
          addLog(`📡 Found output: ${output.name}`);
        });

        setOutputDevices(outputs);

        // Auto-select LUMI device if found
        const lumiDevice = outputs.find(d =>
          d.name.toLowerCase().includes('lumi') ||
          d.name.toLowerCase().includes('piano m') ||
          d.name.toLowerCase().includes('roli')
        );

        if (lumiDevice) {
          addLog(`🎹 Auto-selected LUMI device: ${lumiDevice.name}`);
          setSelectedOutputId(lumiDevice.id);
          setSelectedOutput(access.outputs.get(lumiDevice.id));
        } else if (outputs.length > 0) {
          addLog(`🎹 Auto-selected first device: ${outputs[0].name}`);
          setSelectedOutputId(outputs[0].id);
          setSelectedOutput(access.outputs.get(outputs[0].id));
        }
      } catch (error) {
        addLog(`❌ MIDI Error: ${error}`);
      }
    };

    initMIDI();
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // Handle device selection
  const handleDeviceChange = (deviceId: string) => {
    setSelectedOutputId(deviceId);
    const output = midiAccess?.outputs.get(deviceId);
    setSelectedOutput(output);
    const device = outputDevices.find(d => d.id === deviceId);
    addLog(`🔄 Switched to: ${device?.name}`);
  };

  // Send SysEx using xivilay's EXACT working protocol
  const sendGlobalColor = (r: number, g: number, b: number) => {
    if (!selectedOutput) {
      addLog('❌ No output device selected');
      return;
    }

    try {
      addLog(`🎨 Sending global color: RGB(${r}, ${g}, ${b})`);

      // Build command using BitArray - EXACT xivilay implementation
      const bits = new BitArray();
      bits.append(0x10, 7);           // Command type (7 bits, not 8!)
      bits.append(0x20, 7);           // Global color command (7 bits, not 8!) - Color slot 0
      bits.append(0b00100, 5);        // Header (5 bits)
      bits.append(b & 0xff, 8);       // Blue (8 bits)
      bits.append(g & 0xff, 8);       // Green (8 bits)
      bits.append(r & 0xff, 8);       // Red (8 bits)
      bits.append(0b11111111, 8);     // Footer (8 bits)

      const command = bits.get();

      // Calculate checksum
      const checksumValue = checksum(command);

      addLog(`📦 Command bytes: ${command.map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')}`);
      addLog(`🔐 Checksum: 0x${checksumValue.toString(16).padStart(2, '0')}`);

      // Build full SysEx message - EXACT xivilay structure
      const sysex = [
        0xF0,                // SysEx start
        0x00, 0x21, 0x10,    // ROLI manufacturer ID (getRoliHeader)
        0x77,                // Message type
        0x00,                // Topology index (0x00 = all blocks)
        ...command,          // Command bytes from BitArray
        checksumValue,       // Checksum
        0xF7                 // SysEx end
      ];

      addLog(`📨 Full SysEx: ${sysex.map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')}`);

      // Send via native Web MIDI API
      selectedOutput.send(sysex);

      addLog('✅ SysEx sent successfully');

    } catch (error) {
      addLog(`❌ Send error: ${error}`);
    }
  };

  // Test with current color picker values
  const handleTestColor = () => {
    sendGlobalColor(testColor.r, testColor.g, testColor.b);
  };

  // Quick test buttons
  const testRed = () => sendGlobalColor(255, 0, 0);
  const testGreen = () => sendGlobalColor(0, 255, 0);
  const testBlue = () => sendGlobalColor(0, 0, 255);
  const testWhite = () => sendGlobalColor(255, 255, 255);
  const testOff = () => sendGlobalColor(0, 0, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">LUMI SysEx Test</h1>
            <p className="text-gray-400">Isolated test environment for ROLI Piano M / LUMI Keys</p>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-orange-200">
            <strong>Debug Environment:</strong> This page clones the working xivilay/benob implementation
            to test LUMI SysEx protocol in isolation. Compare with /piano to identify differences.
          </div>
        </div>

        {/* Device Selection */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary-400" />
            MIDI Output Device
          </h2>

          {outputDevices.length === 0 ? (
            <p className="text-gray-400">No MIDI devices found. Connect a LUMI device and refresh.</p>
          ) : (
            <select
              value={selectedOutputId || ''}
              onChange={(e) => handleDeviceChange(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-primary-500 focus:outline-none"
            >
              {outputDevices.map(device => (
                <option key={device.id} value={device.id}>
                  {device.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Color Test Controls */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Global Color Test</h2>

          {/* Color Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Red: {testColor.r}
              </label>
              <input
                type="range"
                min="0"
                max="255"
                value={testColor.r}
                onChange={(e) => setTestColor({ ...testColor, r: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Green: {testColor.g}
              </label>
              <input
                type="range"
                min="0"
                max="255"
                value={testColor.g}
                onChange={(e) => setTestColor({ ...testColor, g: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Blue: {testColor.b}
              </label>
              <input
                type="range"
                min="0"
                max="255"
                value={testColor.b}
                onChange={(e) => setTestColor({ ...testColor, b: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>

          {/* Color Preview */}
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-20 h-20 rounded-lg border-2 border-gray-600"
              style={{ backgroundColor: `rgb(${testColor.r}, ${testColor.g}, ${testColor.b})` }}
            />
            <button
              onClick={handleTestColor}
              disabled={!selectedOutput}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              Send Custom Color
            </button>
          </div>

          {/* Quick Test Buttons */}
          <div className="flex flex-wrap gap-2">
            <button onClick={testRed} disabled={!selectedOutput} className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg transition-colors">
              Red
            </button>
            <button onClick={testGreen} disabled={!selectedOutput} className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors">
              Green
            </button>
            <button onClick={testBlue} disabled={!selectedOutput} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors">
              Blue
            </button>
            <button onClick={testWhite} disabled={!selectedOutput} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-600 text-gray-900 rounded-lg transition-colors">
              White
            </button>
            <button onClick={testOff} disabled={!selectedOutput} className="px-4 py-2 bg-gray-900 hover:bg-black disabled:bg-gray-600 text-white border border-gray-600 rounded-lg transition-colors">
              Off
            </button>
          </div>
        </div>

        {/* Console Log */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Console Log</h2>
            <button
              onClick={() => setLogs([])}
              className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
            >
              Clear
            </button>
          </div>

          <div className="bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm text-green-400">
            {logs.length === 0 ? (
              <p className="text-gray-500">No messages yet...</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="mb-1">{log}</div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* Technical Notes */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Technical Notes - xivilay Protocol</h2>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li>• <strong>Message:</strong> F0 00 21 10 77 00 [command-8-bytes] [checksum] F7</li>
            <li>• <strong>Topology:</strong> 0x00 = all blocks (not device ID 0x37!)</li>
            <li>• <strong>Command:</strong> Global color slot 0</li>
            <li>• <strong>BitArray:</strong> 7-bit 0x10, 7-bit 0x20, 5-bit header, 8-bit B/G/R, 8-bit footer</li>
            <li>• <strong>Checksum:</strong> (sum * 3 + byte) &amp; 0xff, result &amp; 0x7f</li>
            <li>• <strong>Reference:</strong> xivilay/lumi-web-control (verified working)</li>
          </ul>
        </div>

      </div>
    </div>
  );
};
