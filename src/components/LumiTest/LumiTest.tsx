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
    // let current = Math.floor(this.num_bits / 7); // Reserved for array indexing optimization
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

  get(_size: number = 32): number[] { // Reserved for variable-length message support
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
  const [midiMonitoring, setMidiMonitoring] = useState(false);

  // Rainbow test state
  const [rainbowRunning, setRainbowRunning] = useState(false);
  const [rainbowSpeed, setRainbowSpeed] = useState(50); // ms between color changes
  const [rainbowHue, setRainbowHue] = useState(0);
  const rainbowTimerRef = useRef<number | null>(null);

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

        // Get input devices and set up monitoring
        const inputs: MIDIDevice[] = [];
        access.inputs.forEach((input: any) => {
          inputs.push({
            id: input.id,
            name: input.name || 'Unknown Device'
          });
          addLog(`📥 Found input: ${input.name}`);

          // Set up MIDI message listener
          input.onmidimessage = (message: any) => {
            if (midiMonitoring) {
              const data = Array.from(message.data) as number[];
              const hex = data.map((b) => '0x' + b.toString(16).padStart(2, '0')).join(' ');
              addLog(`📨 MIDI IN: ${hex}`);
            }
          };
        });

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
  }, [midiMonitoring]);

  // Auto-scroll logs without stealing focus
  useEffect(() => {
    if (logsEndRef.current) {
      // Use scrollTop instead of scrollIntoView to avoid focus issues
      const container = logsEndRef.current.parentElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
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

  // Send SysEx command helper
  const sendSysExCommand = (command: number[], label: string) => {
    if (!selectedOutput) {
      addLog('❌ No output device selected');
      return;
    }

    try {
      const checksumValue = checksum(command);
      const sysex = [
        0xF0,                // SysEx start
        0x00, 0x21, 0x10,    // ROLI manufacturer ID
        0x77,                // Message type
        0x00,                // Topology index (0x00 = all blocks)
        ...command,          // Command bytes
        checksumValue,       // Checksum
        0xF7                 // SysEx end
      ];

      addLog(`${label}: ${sysex.map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')}`);
      selectedOutput.send(sysex);
      addLog('✅ Sent successfully');

    } catch (error) {
      addLog(`❌ Send error: ${error}`);
    }
  };

  // Set color mode (0-3)
  const sendColorMode = (mode: number) => {
    const bits = new BitArray();
    bits.append(0x10, 7);           // Command type
    bits.append(0x40, 7);           // Color mode command
    bits.append(0b00010, 5);        // Header
    bits.append(mode & 3, 2);       // Mode (0-3)
    sendSysExCommand(bits.get(), `🎨 Setting color mode ${mode + 1}`);
  };

  // Set scale to Chromatic (all 12 notes)
  const sendScale = (scale: string) => {
    const scales: { [key: string]: number[] } = {
      'Chromatic': [0x42, 0x04],
      'Major': [0x02, 0x00],
      'Minor': [0x22, 0x00],
    };
    const scaleBytes = scales[scale] || scales['Chromatic'];
    const command = [0x10, 0x60, ...scaleBytes, 0x00, 0x00, 0x00, 0x00];
    sendSysExCommand(command, `🎼 Setting scale: ${scale}`);
  };

  // Set root key
  const sendRootKey = (key: string) => {
    const keys: { [key: string]: number[] } = {
      'C': [0x03, 0x00], 'C#': [0x23, 0x00], 'D': [0x43, 0x00], 'D#': [0x63, 0x00],
      'E': [0x03, 0x01], 'F': [0x23, 0x01], 'F#': [0x43, 0x01], 'G': [0x63, 0x01],
      'G#': [0x03, 0x02], 'A': [0x23, 0x02], 'A#': [0x43, 0x02], 'B': [0x63, 0x02]
    };
    const keyBytes = keys[key] || keys['C'];
    const command = [0x10, 0x30, ...keyBytes, 0x00, 0x00, 0x00, 0x00];
    sendSysExCommand(command, `🎹 Setting root key: ${key}`);
  };

  // Send color to specific slot (0 = global/primary, 1 = root)
  const sendColor = (slot: number, r: number, g: number, b: number) => {
    const bits = new BitArray();
    bits.append(0x10, 7);                      // Command type
    bits.append(0x20 + 0x10 * (slot & 1), 7); // 0x20 = slot 0 (global), 0x30 = slot 1 (root)
    bits.append(0b00100, 5);                   // Header
    bits.append(b & 0xff, 8);                  // Blue
    bits.append(g & 0xff, 8);                  // Green
    bits.append(r & 0xff, 8);                  // Red
    bits.append(0b11111111, 8);                // Footer

    const slotName = slot === 0 ? 'Primary' : 'Root';
    sendSysExCommand(bits.get(), `🎨 ${slotName} color: RGB(${r}, ${g}, ${b})`);
  };

  // Convenience methods
  const sendGlobalColor = (r: number, g: number, b: number) => sendColor(0, r, g, b);
  const sendRootColor = (r: number, g: number, b: number) => sendColor(1, r, g, b);

  // MIDI Note On/Off for individual key control
  const sendNoteOn = (midiNote: number, velocity: number) => {
    if (!selectedOutput) {
      addLog('❌ No output device selected');
      return;
    }

    try {
      // MIDI Note On: 0x90 (channel 1), note, velocity
      const message = [0x90, midiNote, velocity];
      selectedOutput.send(message);
      addLog(`🎹 Note On: MIDI ${midiNote}, velocity ${velocity}`);
    } catch (error) {
      addLog(`❌ Send error: ${error}`);
    }
  };

  const sendNoteOff = (midiNote: number) => {
    if (!selectedOutput) {
      addLog('❌ No output device selected');
      return;
    }

    try {
      // MIDI Note Off: 0x80 (channel 1), note, velocity 0
      const message = [0x80, midiNote, 0];
      selectedOutput.send(message);
      addLog(`🎹 Note Off: MIDI ${midiNote}`);
    } catch (error) {
      addLog(`❌ Send error: ${error}`);
    }
  };

  // Clear all notes
  const clearAllNotes = () => {
    // LUMI Keys span C3 (48) to B4 (71) for a single 24-key block
    for (let note = 48; note <= 71; note++) {
      sendNoteOff(note);
    }
    addLog('🧹 Cleared all notes');
  };

  // Send NRPN (Non-Registered Parameter Number) command
  const sendNRPN = (parameter: number, value: number) => {
    if (!selectedOutput) {
      addLog('❌ No output device selected');
      return;
    }

    try {
      // NRPN sequence: CC 99 (NRPN MSB), CC 98 (NRPN LSB), CC 6 (Data Entry MSB), CC 38 (Data Entry LSB)
      const channel = 0; // Channel 1 (0-indexed)

      // NRPN select (parameter)
      selectedOutput.send([0xB0 | channel, 99, 0]);        // NRPN MSB = 0
      selectedOutput.send([0xB0 | channel, 98, parameter]); // NRPN LSB = parameter

      // Data entry (value)
      selectedOutput.send([0xB0 | channel, 6, 0]);          // Data Entry MSB = 0
      selectedOutput.send([0xB0 | channel, 38, value]);     // Data Entry LSB = value

      addLog(`🎛️ NRPN: param ${parameter}, value ${value}`);
    } catch (error) {
      addLog(`❌ NRPN error: ${error}`);
    }
  };

  // Set physical key press color (NRPN 7)
  const setPhysicalKeyColor = (velocityIndex: number) => {
    sendNRPN(7, velocityIndex);
    addLog(`🎨 Physical key press color set to velocity ${velocityIndex}`);
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

  // HSL to RGB conversion for rainbow effect
  const hslToRgb = (h: number, s: number, l: number): { r: number; g: number; b: number } => {
    h = h / 360;
    s = s / 100;
    l = l / 100;

    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;

      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  };

  // Rainbow animation effect
  useEffect(() => {
    if (rainbowRunning && selectedOutput) {
      rainbowTimerRef.current = window.setInterval(() => {
        setRainbowHue(prev => {
          const nextHue = (prev + 1) % 360;
          const color = hslToRgb(nextHue, 100, 50);
          sendGlobalColor(color.r, color.g, color.b);
          return nextHue;
        });
      }, rainbowSpeed);

      return () => {
        if (rainbowTimerRef.current) {
          clearInterval(rainbowTimerRef.current);
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rainbowRunning, rainbowSpeed, selectedOutput]);

  // Toggle rainbow animation
  const toggleRainbow = () => {
    if (rainbowRunning) {
      setRainbowRunning(false);
      if (rainbowTimerRef.current) {
        clearInterval(rainbowTimerRef.current);
      }
      addLog('🌈 Rainbow test stopped');
    } else {
      setRainbowHue(0); // Reset to red
      setRainbowRunning(true);
      addLog('🌈 Rainbow test started');
    }
  };

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

        {/* LUMI Configuration */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">⚙️ LUMI Configuration</h2>
          <p className="text-gray-400 mb-4 text-sm">
            Configure LUMI color modes, scales, and root key. The LUMI uses scale-based lighting with two color slots: Primary (all scale notes) and Root (root note only).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Color Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Color Mode</label>
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map(mode => (
                  <button
                    key={mode}
                    onClick={() => sendColorMode(mode - 1)}
                    disabled={!selectedOutput}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
                  >
                    Mode {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Scale */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Scale</label>
              <div className="grid grid-cols-3 gap-2">
                {['Chromatic', 'Major', 'Minor'].map(scale => (
                  <button
                    key={scale}
                    onClick={() => sendScale(scale)}
                    disabled={!selectedOutput}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
                  >
                    {scale}
                  </button>
                ))}
              </div>
            </div>

            {/* Root Key */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Root Key</label>
              <select
                onChange={(e) => sendRootKey(e.target.value)}
                disabled={!selectedOutput}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-primary-500 focus:outline-none disabled:bg-gray-800"
              >
                {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(key => (
                  <option key={key} value={key}>{key}</option>
                ))}
              </select>
            </div>

            {/* Quick Setup */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Quick Setup</label>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    sendColorMode(0);
                    sendScale('Chromatic');
                    sendRootKey('C');
                    addLog('🔧 Applied full control setup (Mode 1 + Chromatic scale)');
                  }}
                  disabled={!selectedOutput}
                  className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                >
                  Setup for Full Control
                </button>

                <button
                  onClick={() => {
                    // Set mode 2 (seems to work best for MIDI input)
                    sendColorMode(1); // Mode 2 (0-indexed, so 1 = Mode 2)
                    sendScale('Chromatic');
                    sendGlobalColor(0, 0, 0);  // All keys black by default
                    sendRootColor(0, 0, 0);    // Root also black
                    clearAllNotes();            // Clear any lit notes

                    // Set physical key press color to use velocity-based color (like MIDI input)
                    setPhysicalKeyColor(85); // Cyan for physical presses

                    addLog('🌑 Applied black background - Mode 2, all keys off until MIDI input');
                  }}
                  disabled={!selectedOutput}
                  className="w-full px-4 py-2 bg-gray-900 hover:bg-black disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors border border-gray-600"
                >
                  Black Background Mode (MIDI Input Only)
                </button>

                <button
                  onClick={() => {
                    // Try Mode 3
                    sendColorMode(2); // Mode 3 (0-indexed, so 2 = Mode 3)
                    sendScale('Chromatic');
                    sendGlobalColor(0, 0, 0);
                    sendRootColor(0, 0, 0);
                    clearAllNotes();
                    setPhysicalKeyColor(85);
                    addLog('🌑 Applied Mode 3 with black background');
                  }}
                  disabled={!selectedOutput}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  Try Mode 3
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Individual Key Control */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">🎹 Individual Key Control (MIDI Note On/Off)</h2>

          <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-200">
              <strong>💡 Setup Required:</strong> Click "Black Background Mode (MIDI Input Only)" above first. Then DON'T physically touch the LUMI keys - only use the buttons below to send MIDI and see colors!
            </p>
          </div>

          <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <p className="text-sm text-orange-200">
              <strong>⚠️ Important:</strong> If you physically press LUMI keys, they will light up (default program behavior). To see velocity-based colors, use ONLY the buttons below without touching the physical keys.
            </p>
          </div>

          <p className="text-gray-400 mb-4 text-sm">
            Test individual key lighting using MIDI Note On/Off messages. Velocity determines color (0=off, 1-127=color from lookup table).
          </p>

          <div className="space-y-4">
            {/* Single Key Test */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Test Single Key
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => sendNoteOn(60, 127)}
                  disabled={!selectedOutput}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-600 text-gray-900 rounded-lg transition-colors"
                >
                  C (60) White
                </button>
                <button
                  onClick={() => sendNoteOn(62, 85)}
                  disabled={!selectedOutput}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  D (62) Cyan
                </button>
                <button
                  onClick={() => sendNoteOn(64, 42)}
                  disabled={!selectedOutput}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 text-gray-900 rounded-lg transition-colors"
                >
                  E (64) Yellow
                </button>
                <button
                  onClick={() => sendNoteOn(65, 20)}
                  disabled={!selectedOutput}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  F (65) Red
                </button>
              </div>
            </div>

            {/* Chase Effect */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sequential Chase Test
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    clearAllNotes();
                    // Light up each key sequentially
                    for (let i = 0; i < 24; i++) {
                      setTimeout(() => {
                        const note = 48 + i;
                        const velocity = 85; // Cyan
                        sendNoteOn(note, velocity);

                        // Turn off previous note
                        if (i > 0) {
                          sendNoteOff(48 + i - 1);
                        }
                      }, i * 100);
                    }
                  }}
                  disabled={!selectedOutput}
                  className="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                >
                  Run Chase (One at a Time)
                </button>
                <button
                  onClick={clearAllNotes}
                  disabled={!selectedOutput}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white rounded-lg transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Scale Highlight */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Show C Major Scale
              </label>
              <button
                onClick={() => {
                  clearAllNotes();
                  // C Major scale: C D E F G A B C
                  const cMajor = [60, 62, 64, 65, 67, 69, 71, 72];
                  cMajor.forEach((note, index) => {
                    setTimeout(() => {
                      sendNoteOn(note, index === 0 ? 127 : 85); // Root white, others cyan
                    }, index * 50);
                  });
                }}
                disabled={!selectedOutput}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Light Up Scale
              </button>
            </div>

            {/* Velocity Color Test */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Velocity = Color Mapping Test (Middle C)
              </label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {[0, 20, 42, 65, 85, 105, 120, 127].map(vel => (
                  <button
                    key={vel}
                    onClick={() => vel === 0 ? sendNoteOff(60) : sendNoteOn(60, vel)}
                    disabled={!selectedOutput}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white rounded-lg transition-colors text-sm"
                  >
                    V:{vel}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500">Colors: 0=off, 20=red, 42=yellow, 65=green, 85=cyan, 105=blue, 127=white</p>
            </div>

            {/* Piano Keyboard Simulator */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Interactive Piano - Different Colors per Key
              </label>
              <div className="flex flex-wrap gap-1">
                {[
                  { note: 60, name: 'C', vel: 127, color: 'white' },      // White
                  { note: 61, name: 'C#', vel: 20, color: 'red' },        // Red
                  { note: 62, name: 'D', vel: 42, color: 'yellow' },      // Yellow
                  { note: 63, name: 'D#', vel: 65, color: 'green' },      // Green
                  { note: 64, name: 'E', vel: 85, color: 'cyan' },        // Cyan
                  { note: 65, name: 'F', vel: 105, color: 'blue' },       // Blue
                  { note: 66, name: 'F#', vel: 115, color: 'purple' },    // Purple
                  { note: 67, name: 'G', vel: 85, color: 'cyan' },        // Cyan
                  { note: 68, name: 'G#', vel: 65, color: 'green' },      // Green
                  { note: 69, name: 'A', vel: 42, color: 'yellow' },      // Yellow
                  { note: 70, name: 'A#', vel: 20, color: 'red' },        // Red
                  { note: 71, name: 'B', vel: 127, color: 'white' },      // White
                ].map(({ note, name, vel, color }) => (
                  <button
                    key={note}
                    onMouseDown={() => sendNoteOn(note, vel)}
                    onMouseUp={() => sendNoteOff(note)}
                    onMouseLeave={() => sendNoteOff(note)}
                    disabled={!selectedOutput}
                    className={`px-3 py-2 ${
                      color === 'white' ? 'bg-gray-100 text-gray-900' :
                      color === 'red' ? 'bg-red-600 text-white' :
                      color === 'yellow' ? 'bg-yellow-500 text-gray-900' :
                      color === 'green' ? 'bg-green-600 text-white' :
                      color === 'cyan' ? 'bg-cyan-500 text-white' :
                      color === 'blue' ? 'bg-blue-600 text-white' :
                      'bg-purple-600 text-white'
                    } hover:opacity-80 disabled:bg-gray-600 rounded transition-colors text-xs font-mono`}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">Each key sends a different velocity/color. Click and hold to light up, release to turn off.</p>
            </div>
          </div>
        </div>

        {/* Rainbow Test */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">🌈 Rainbow Cycle Test (Global SysEx)</h2>
          <p className="text-gray-400 mb-4 text-sm">
            Cycles through all hues to verify full color spectrum control. Each key will display the same color in sequence.
          </p>

          <div className="space-y-4">
            {/* Rainbow Control */}
            <div className="flex items-center gap-4">
              <button
                onClick={toggleRainbow}
                disabled={!selectedOutput}
                className={`px-6 py-3 font-medium rounded-lg transition-colors ${
                  rainbowRunning
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 hover:opacity-90'
                } disabled:bg-gray-600 disabled:cursor-not-allowed text-white`}
              >
                {rainbowRunning ? 'Stop Rainbow' : 'Start Rainbow Test'}
              </button>

              {rainbowRunning && (
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-lg border-2 border-gray-600 shadow-lg"
                    style={{ backgroundColor: `hsl(${rainbowHue}, 100%, 50%)` }}
                  />
                  <span className="text-gray-300 text-sm font-mono">
                    Hue: {rainbowHue}°
                  </span>
                </div>
              )}
            </div>

            {/* Speed Control */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Animation Speed: {rainbowSpeed}ms per step {rainbowSpeed <= 20 && '⚡'}
              </label>
              <input
                type="range"
                min="10"
                max="200"
                value={rainbowSpeed}
                onChange={(e) => setRainbowSpeed(parseInt(e.target.value))}
                className="w-full"
                disabled={!selectedOutput}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Fast (10ms)</span>
                <span>Slow (200ms)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Color Test Controls */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Manual Color Test</h2>

          {/* Primary and Root Color Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">
            {/* Primary Color Section */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-white">Primary Color (Scale Notes)</h3>
              <div className="grid grid-cols-1 gap-3">
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

                <div className="flex items-center gap-3">
                  <div
                    className="w-16 h-16 rounded-lg border-2 border-gray-600"
                    style={{ backgroundColor: `rgb(${testColor.r}, ${testColor.g}, ${testColor.b})` }}
                  />
                  <button
                    onClick={handleTestColor}
                    disabled={!selectedOutput}
                    className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                  >
                    Send Primary
                  </button>
                </div>
              </div>
            </div>

            {/* Root Color Section */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-white">Root Color (Root Note Only)</h3>
              <div className="space-y-3">
                <button
                  onClick={() => sendRootColor(255, 255, 255)}
                  disabled={!selectedOutput}
                  className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-600 text-gray-900 font-medium rounded-lg transition-colors"
                >
                  White Root
                </button>
                <button
                  onClick={() => sendRootColor(255, 0, 0)}
                  disabled={!selectedOutput}
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Red Root
                </button>
                <button
                  onClick={() => sendRootColor(0, 255, 255)}
                  disabled={!selectedOutput}
                  className="w-full px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cyan Root
                </button>
                <button
                  onClick={() => sendRootColor(0, 0, 0)}
                  disabled={!selectedOutput}
                  className="w-full px-4 py-2 bg-gray-900 hover:bg-black disabled:bg-gray-600 text-white border border-gray-600 rounded-lg transition-colors"
                >
                  Root Off
                </button>
              </div>
            </div>
          </div>

          {/* Quick Primary Color Test Buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Quick Primary Colors</label>
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
        </div>

        {/* Console Log */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Console Log</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setMidiMonitoring(!midiMonitoring)}
                className={`px-3 py-1 text-sm ${
                  midiMonitoring
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-gray-700 hover:bg-gray-600'
                } text-white rounded transition-colors`}
              >
                {midiMonitoring ? '🟢 Monitoring MIDI' : 'Monitor MIDI Input'}
              </button>
              <button
                onClick={() => setLogs([])}
                className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              >
                Clear
              </button>
            </div>
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
          <h2 className="text-xl font-semibold text-white mb-4">Technical Notes - LUMI Color System</h2>

          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white mb-2">Two Control Methods:</h3>
          </div>

          <div className="mb-6">
            <h4 className="text-md font-semibold text-cyan-400 mb-2">1. MIDI Note On/Off (Individual Keys) ⭐ Recommended</h4>
            <ul className="space-y-1 text-gray-300 text-sm">
              <li>• <strong>Command:</strong> Note On (0x90), MIDI note (48-71), velocity (0-127)</li>
              <li>• <strong>Color Control:</strong> Velocity maps to color via colourLookup table</li>
              <li>• <strong>Key Colors:</strong> 0=off, 20=red, 42=yellow, 65=green, 85=cyan, 105=blue, 127=white</li>
              <li>• <strong>Per-Key Control:</strong> Each note can have its own color!</li>
              <li>• <strong>Note Off:</strong> 0x80 or Note On with velocity 0</li>
            </ul>
          </div>

          <div>
            <h4 className="text-md font-semibold text-orange-400 mb-2">2. SysEx Commands (Global Settings)</h4>
            <ul className="space-y-1 text-gray-300 text-sm">
              <li>• <strong>Message Structure:</strong> F0 00 21 10 77 00 [command-8-bytes] [checksum] F7</li>
              <li>• <strong>Color Slots:</strong> Slot 0 (0x20) = Primary/all scale notes, Slot 1 (0x30) = Root note only</li>
              <li>• <strong>Scale System:</strong> Sets which notes light up (Chromatic = all 12 notes)</li>
              <li>• <strong>Limitation:</strong> Only controls background/base colors, not individual keys</li>
            </ul>
          </div>

          <div className="mt-4 p-3 bg-gray-900 rounded border border-primary-500">
            <p className="text-sm text-primary-300">
              <strong>💡 Best Practice:</strong> Use SysEx to set base scale/mode, then use MIDI Note On/Off for real-time individual key guidance!
            </p>
          </div>

          <div className="mt-4 p-3 bg-red-900/30 rounded border border-red-500">
            <p className="text-sm text-red-200 mb-2">
              <strong>🔍 Debugging Suggestion:</strong> The "all black until pressed then colored" behavior you see in videos might require a custom LittleFoot program.
            </p>
            <p className="text-xs text-red-300">
              To find out: Enable "Monitor MIDI Input" above, then open the ROLI app and watch what MIDI messages it sends when it achieves that behavior. It may be uploading a custom LittleFoot script that changes the default key press behavior.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
