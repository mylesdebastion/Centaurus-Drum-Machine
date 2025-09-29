import React, { useState, useCallback, useEffect } from 'react';
import { LEDStripConfig, ClassroomControls, LEDVisualizationSettings } from '../../types/led';
import { SingleLaneVisualizer } from '../../utils/SingleLaneVisualizer';
import { Plus, Trash2, Wifi, WifiOff, Volume2, VolumeX, Eye, Settings } from 'lucide-react';

interface LEDStripManagerProps {
  boomwhackerColors: string[];
  noteNames: string[];
  onStripsChange: (visualizers: SingleLaneVisualizer[]) => void;
}

export const LEDStripManager: React.FC<LEDStripManagerProps> = ({
  boomwhackerColors,
  noteNames,
  onStripsChange
}) => {
  const [stripConfigs, setStripConfigs] = useState<LEDStripConfig[]>([
    {
      id: 'default_wledtube2',
      laneIndex: 0,
      ipAddress: '192.168.8.158',
      studentName: 'WLEDTUBE2',
      enabled: true,
      status: 'disconnected',
      ledCount: 90,
      multiNotesMode: false,
      assignedLanes: [0]
    }
  ]);
  const [visualizers, setVisualizers] = useState<SingleLaneVisualizer[]>([]);
  const [classroomControls, setClassroomControls] = useState<ClassroomControls>({
    muteAllStrips: false,
    soloStripId: null,
    highlightDownbeats: true,
    showBeatNumbers: false,
    tempoVisualization: false,
    recordMode: false,
    playbackMode: false
  });
  const [settings, setSettings] = useState<LEDVisualizationSettings>({
    updateRate: 30,
    brightness: 0.8,
    activeIntensity: 1.0,
    baseIntensity: 0.1,
    playheadColor: { r: 255, g: 255, b: 255 },
    beatMarkerColor: { r: 255, g: 255, b: 0 },
    protocol: 'udp', // Default to UDP WARLS with integrated bridge
    udpPort: 21324, // Default WLED UDP port
    visualizationMode: 'static' // Default to static step sequencer mode
  });
  const [showSettings, setShowSettings] = useState(false);
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [colorAnimationFrame, setColorAnimationFrame] = useState(0);
  const [bridgeStatus, setBridgeStatus] = useState<'disconnected' | 'connected' | 'connecting'>('disconnected');

  // Generate unique ID for new strips
  const generateStripId = useCallback(() => {
    return `strip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Add new LED strip
  const addNewStrip = useCallback(() => {
    const newConfig: LEDStripConfig = {
      id: generateStripId(),
      laneIndex: 0,
      ipAddress: '192.168.1.100',
      studentName: '',
      enabled: true,
      status: 'disconnected',
      ledCount: 90, // Default LED count for new strips
      multiNotesMode: false,
      assignedLanes: [0]
    };

    setStripConfigs(prev => [...prev, newConfig]);
  }, [generateStripId]);

  // Remove LED strip
  const removeStrip = useCallback((stripId: string) => {
    setStripConfigs(prev => prev.filter(config => config.id !== stripId));
  }, []);

  // Update strip configuration
  const updateStripConfig = useCallback((stripId: string, field: keyof LEDStripConfig, value: any) => {
    setStripConfigs(prev =>
      prev.map(config =>
        config.id === stripId ? { ...config, [field]: value } : config
      )
    );
  }, []);

  // Test connection to a specific strip
  const testConnection = useCallback(async (stripId: string) => {
    const config = stripConfigs.find(c => c.id === stripId);
    if (!config) return;

    const visualizer = new SingleLaneVisualizer(config, 16, settings);
    const success = await visualizer.testConnection();

    updateStripConfig(stripId, 'status', success ? 'connected' : 'error');
    updateStripConfig(stripId, 'lastSeen', success ? new Date() : undefined);
  }, [stripConfigs, settings, updateStripConfig]);

  // Send test pattern to a specific strip
  const sendTestPattern = useCallback(async (stripId: string) => {
    const config = stripConfigs.find(c => c.id === stripId);
    if (!config) return;

    console.log(`🌈 Sending rainbow test pattern to ${config.ipAddress} (${config.studentName || 'Unnamed'})`);

    const visualizer = new SingleLaneVisualizer(config, 16, settings);

    try {
      await visualizer.sendRainbowTestPattern();
      console.log(`✅ Rainbow test pattern sent to ${config.ipAddress}`);
    } catch (error) {
      console.error(`❌ Failed to send rainbow test pattern to ${config.ipAddress}:`, error);
    }
  }, [stripConfigs, settings]);

  // Test all connections
  const testAllConnections = useCallback(async () => {
    setIsTestingAll(true);
    const promises = stripConfigs.map(config => testConnection(config.id));
    await Promise.all(promises);
    setIsTestingAll(false);
  }, [stripConfigs, testConnection]);

  // Solo a strip
  const soloStrip = useCallback((stripId: string) => {
    setClassroomControls(prev => ({
      ...prev,
      soloStripId: prev.soloStripId === stripId ? null : stripId
    }));
  }, []);

  // Update classroom controls
  const updateClassroomControl = useCallback(<K extends keyof ClassroomControls>(
    key: K,
    value: ClassroomControls[K]
  ) => {
    setClassroomControls(prev => ({ ...prev, [key]: value }));
  }, []);

  // Update visualization settings
  const updateSetting = useCallback(<K extends keyof LEDVisualizationSettings>(
    key: K,
    value: LEDVisualizationSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  // Check WebSocket bridge status
  const checkBridgeStatus = useCallback(() => {
    if (settings.protocol !== 'udp') {
      setBridgeStatus('disconnected');
      return;
    }

    if (window.wledBridge?.readyState === WebSocket.OPEN) {
      setBridgeStatus('connected');
    } else if (window.wledBridge?.readyState === WebSocket.CONNECTING) {
      setBridgeStatus('connecting');
    } else {
      setBridgeStatus('disconnected');
    }
  }, [settings.protocol]);

  // Toggle strip enabled/disabled with proper WLED turn off
  const toggleStripEnabled = useCallback(async (stripId: string, enabled: boolean) => {
    const config = stripConfigs.find(c => c.id === stripId);
    if (!config) return;

    if (!enabled) {
      // Turn off WLED device when disabling
      try {
        const visualizer = new SingleLaneVisualizer(config, 16, settings);
        await visualizer.turnOff();
        console.log(`🔄 Turned off WLED device ${config.ipAddress}`);
      } catch (error) {
        console.warn(`⚠️ Failed to turn off WLED device ${config.ipAddress}:`, error);
      }
    }

    updateStripConfig(stripId, 'enabled', enabled);
  }, [stripConfigs, settings, updateStripConfig]);

  // Create visualizers when configs change
  useEffect(() => {
    const newVisualizers = stripConfigs
      .filter(config => config.enabled)
      .map(config => {
        const visualizer = new SingleLaneVisualizer(config, 16, settings);
        return visualizer;
      });

    setVisualizers(newVisualizers);
    onStripsChange(newVisualizers);

    // Debug logging
    console.log(`🔗 LED Strip Manager: Created ${newVisualizers.length} visualizers`, {
      totalConfigs: stripConfigs.length,
      enabledConfigs: stripConfigs.filter(c => c.enabled).length,
      visualizerDetails: newVisualizers.map(v => {
        const config = v.getConfig();
        return {
          id: config.id,
          laneIndex: config.laneIndex,
          ipAddress: config.ipAddress,
          ledCount: config.ledCount,
          enabled: config.enabled
        };
      })
    });
  }, [stripConfigs, settings, onStripsChange]);

  // Update visualizer settings when settings change
  useEffect(() => {
    visualizers.forEach(visualizer => {
      visualizer.updateSettings(settings);
    });
  }, [visualizers, settings]);

  // Monitor bridge status
  useEffect(() => {
    checkBridgeStatus();
    const interval = setInterval(checkBridgeStatus, 2000); // Check every 2 seconds
    return () => clearInterval(interval);
  }, [checkBridgeStatus]);

  // Animate color indicators for multi-notes strips
  useEffect(() => {
    const interval = setInterval(() => {
      setColorAnimationFrame(prev => prev + 1);
    }, 100); // Update every 100ms for smooth but relaxed color cycling animation
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: LEDStripConfig['status']) => {
    switch (status) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-gray-500" />;
      case 'error':
        return <WifiOff className="w-4 h-4 text-red-500" />;
    }
  };

  // Get the current display color for a strip configuration
  // Using colorAnimationFrame to trigger re-renders for color cycling
  const getCurrentStripColor = useCallback((config: LEDStripConfig) => {
    if (!config.multiNotesMode || config.assignedLanes.length === 0) {
      // Single lane mode
      return boomwhackerColors[config.laneIndex];
    } else if (config.assignedLanes.length === 1) {
      // Multi-notes mode with single lane
      return boomwhackerColors[config.assignedLanes[0]];
    } else {
      // Multi-notes mode with multiple lanes - calculate cycling color
      const totalCycleTime = 2000; // Same as in SingleLaneVisualizer
      const holdTime = 0.85;
      const fadeTime = 0.15;

      const cycleTime = (Date.now() / totalCycleTime) % 1.0;
      const stepsPerColor = 1.0 / config.assignedLanes.length;
      const activeColorIndex = Math.floor(cycleTime / stepsPerColor) % config.assignedLanes.length;

      const stepProgress = (cycleTime % stepsPerColor) / stepsPerColor;
      let blendFactor: number;

      if (stepProgress < holdTime) {
        blendFactor = 0;
      } else {
        blendFactor = (stepProgress - holdTime) / fadeTime;
        blendFactor = Math.min(blendFactor, 1.0);
      }

      // Get primary and secondary colors in hex format
      const primaryColor = boomwhackerColors[config.assignedLanes[activeColorIndex]];
      const nextColorIndex = (activeColorIndex + 1) % config.assignedLanes.length;
      const secondaryColor = boomwhackerColors[config.assignedLanes[nextColorIndex]];

      // Convert hex to RGB for blending
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
      };

      const primaryRgb = hexToRgb(primaryColor);
      const secondaryRgb = hexToRgb(secondaryColor);

      // Blend colors
      const r = Math.round(primaryRgb.r * (1 - blendFactor) + secondaryRgb.r * blendFactor);
      const g = Math.round(primaryRgb.g * (1 - blendFactor) + secondaryRgb.g * blendFactor);
      const b = Math.round(primaryRgb.b * (1 - blendFactor) + secondaryRgb.b * blendFactor);

      // Convert back to hex
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
  }, [boomwhackerColors, colorAnimationFrame]);

  return (
    <div className="space-y-6 p-4 bg-gray-900 text-white rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Classroom LED Strips</h3>
          <p className="text-sm text-gray-400 mt-1">
            Each student gets one LED strip representing their musical lane. Test patterns confirm connectivity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <button
            onClick={testAllConnections}
            disabled={isTestingAll}
            className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 rounded transition-colors"
          >
            <Wifi className="w-4 h-4" />
            {isTestingAll ? 'Testing...' : 'Test All'}
          </button>
        </div>
      </div>

      {/* Protocol Info */}
      <div className="text-sm text-gray-300 bg-gray-800 p-3 rounded-lg">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <strong>Test Button:</strong> Sends rainbow flow pattern to verify connectivity and LED count
          </div>
          <div>
            <strong>Eye Icon (Solo):</strong> Only this strip receives sequencer data, others muted
          </div>
          <div>
            <strong>On/Off:</strong> Enable/disable strip from receiving any LED data
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-600 text-xs text-gray-400">
          <strong>Sequencer Integration:</strong> Each strip shows its lane's pattern (16 steps spread across all LEDs).
          Enable LED checkbox in sequencer to start sending live step data. Configure LED count per strip for proper visualization.
        </div>
      </div>

      {/* Global Controls */}
      <div className="flex items-center gap-4 p-3 bg-gray-800 rounded-lg">
        <button
          onClick={() => updateClassroomControl('muteAllStrips', !classroomControls.muteAllStrips)}
          className={`flex items-center gap-2 px-3 py-1 rounded transition-colors ${
            classroomControls.muteAllStrips
              ? 'bg-red-600 hover:bg-red-500'
              : 'bg-green-600 hover:bg-green-500'
          }`}
        >
          {classroomControls.muteAllStrips ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          {classroomControls.muteAllStrips ? 'Unmute All' : 'Mute All'}
        </button>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={classroomControls.highlightDownbeats}
            onChange={(e) => updateClassroomControl('highlightDownbeats', e.target.checked)}
            className="rounded"
          />
          Highlight Downbeats
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={classroomControls.showBeatNumbers}
            onChange={(e) => updateClassroomControl('showBeatNumbers', e.target.checked)}
            className="rounded"
          />
          Show Beat Numbers
        </label>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 bg-gray-800 rounded-lg space-y-4">
          <h4 className="font-medium">Visualization Settings</h4>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm">Protocol</span>
              <select
                value={settings.protocol}
                onChange={(e) => updateSetting('protocol', e.target.value as 'udp' | 'http')}
                className="bg-gray-700 text-white rounded px-2 py-1"
              >
                <option value="http">HTTP JSON</option>
                <option value="udp">UDP WARLS</option>
              </select>
              <span className="text-xs text-gray-400">
                {settings.protocol === 'udp' ? 'Like Python code (needs bridge)' : 'Direct browser support'}
              </span>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm">Update Rate (FPS)</span>
              <input
                type="range"
                min="10"
                max="60"
                value={settings.updateRate}
                onChange={(e) => updateSetting('updateRate', parseInt(e.target.value))}
                className="w-full"
              />
              <span className="text-xs text-gray-400">{settings.updateRate} FPS</span>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm">Global Brightness</span>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={settings.brightness}
                onChange={(e) => updateSetting('brightness', parseFloat(e.target.value))}
                className="w-full"
              />
              <span className="text-xs text-gray-400">{Math.round(settings.brightness * 100)}%</span>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm">Active Note Intensity</span>
              <input
                type="range"
                min="0.5"
                max="1"
                step="0.1"
                value={settings.activeIntensity}
                onChange={(e) => updateSetting('activeIntensity', parseFloat(e.target.value))}
                className="w-full"
              />
              <span className="text-xs text-gray-400">{Math.round(settings.activeIntensity * 100)}%</span>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm">Base Intensity</span>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.05"
                value={settings.baseIntensity}
                onChange={(e) => updateSetting('baseIntensity', parseFloat(e.target.value))}
                className="w-full"
              />
              <span className="text-xs text-gray-400">{Math.round(settings.baseIntensity * 100)}%</span>
            </label>
          </div>

          {settings.protocol === 'udp' && (
            <div className="mt-4 p-3 bg-blue-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-200">
                    <strong>UDP WARLS Mode:</strong> WebSocket bridge for UDP communication
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    bridgeStatus === 'connected' ? 'bg-green-400' :
                    bridgeStatus === 'connecting' ? 'bg-yellow-400' :
                    'bg-red-400'
                  }`} />
                  <span className="text-xs text-blue-100">
                    {bridgeStatus === 'connected' ? 'Connected' :
                     bridgeStatus === 'connecting' ? 'Connecting...' :
                     'Disconnected'}
                  </span>
                </div>
              </div>
              <div className="mt-2 text-xs text-blue-100">
                <div>✅ Bridge auto-started with dev server (auto-port detection)</div>
                <div>🔄 Browser → WebSocket → UDP WARLS packets → WLED devices</div>
                <div>📊 Check console for connection status and packet logs</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Strip Configurations */}
      <div className="space-y-3">
        {stripConfigs.map((config) => (
          <div key={config.id} className="flex items-center gap-4 p-3 bg-gray-800 rounded-lg">
            {/* Status Icon */}
            <div className="flex items-center gap-2">
              {getStatusIcon(config.status)}
              <button
                onClick={() => testConnection(config.id)}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Test
              </button>
            </div>

            {/* Lane Color - Dynamic for multi-notes mode */}
            <div
              className="w-6 h-6 rounded border-2 border-gray-600 transition-colors duration-300"
              style={{ backgroundColor: getCurrentStripColor(config) }}
              title={
                config.multiNotesMode && config.assignedLanes.length > 1
                  ? `Multi-notes: ${config.assignedLanes.map(i => noteNames[i]).join(', ')}`
                  : config.multiNotesMode && config.assignedLanes.length === 1
                  ? `Multi-notes: ${noteNames[config.assignedLanes[0]]}`
                  : noteNames[config.laneIndex]
              }
            />

            {/* Lane Selection or Multi-Notes Mode */}
            <div className="flex flex-col gap-1">
              {/* Multi-notes mode toggle */}
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={config.multiNotesMode}
                  onChange={(e) => {
                    updateStripConfig(config.id, 'multiNotesMode', e.target.checked);
                    if (!e.target.checked) {
                      // Reset to single lane when disabling multi-notes mode
                      updateStripConfig(config.id, 'assignedLanes', [config.laneIndex]);
                    }
                  }}
                  className="rounded w-3 h-3"
                />
                Multi-notes
              </label>

              {config.multiNotesMode ? (
                /* Multi-notes lane assignment */
                <div className="flex flex-wrap gap-1">
                  {noteNames.map((note, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        const currentLanes = config.assignedLanes || [];
                        const isAssigned = currentLanes.includes(i);
                        const newLanes = isAssigned
                          ? currentLanes.filter(lane => lane !== i)
                          : [...currentLanes, i].sort((a, b) => a - b);
                        updateStripConfig(config.id, 'assignedLanes', newLanes.length > 0 ? newLanes : [0]);
                      }}
                      className={`text-xs px-1 py-0.5 rounded transition-colors ${
                        (config.assignedLanes || []).includes(i)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                      }`}
                      style={{
                        borderColor: boomwhackerColors[i],
                        borderWidth: '1px',
                        borderStyle: 'solid'
                      }}
                      title={`${note} - ${(config.assignedLanes || []).includes(i) ? 'Remove' : 'Add'}`}
                    >
                      {note}
                    </button>
                  ))}
                </div>
              ) : (
                /* Single lane selection */
                <select
                  value={config.laneIndex}
                  onChange={(e) => updateStripConfig(config.id, 'laneIndex', parseInt(e.target.value))}
                  className="bg-gray-700 text-white rounded px-2 py-1 min-w-[80px] text-sm"
                >
                  {noteNames.map((note, i) => (
                    <option key={i} value={i}>{note}</option>
                  ))}
                </select>
              )}
            </div>

            {/* IP Address */}
            <input
              value={config.ipAddress}
              onChange={(e) => updateStripConfig(config.id, 'ipAddress', e.target.value)}
              placeholder="192.168.1.xxx"
              className="bg-gray-700 text-white rounded px-2 py-1 min-w-[140px]"
            />

            {/* Student Name */}
            <input
              value={config.studentName || ''}
              onChange={(e) => updateStripConfig(config.id, 'studentName', e.target.value)}
              placeholder="Student name"
              className="bg-gray-700 text-white rounded px-2 py-1 flex-1"
            />

            {/* LED Count */}
            <input
              type="number"
              value={config.ledCount}
              onChange={(e) => updateStripConfig(config.id, 'ledCount', parseInt(e.target.value))}
              placeholder="LEDs"
              min="16"
              max="1000"
              className="bg-gray-700 text-white rounded px-2 py-1 w-20"
              title={`Number of LEDs in this strip (currently ${config.ledCount})`}
            />

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => sendTestPattern(config.id)}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs transition-colors"
                title="Send rainbow flow test pattern to verify connectivity and LED count"
              >
                Test
              </button>

              <button
                onClick={() => soloStrip(config.id)}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  classroomControls.soloStripId === config.id
                    ? 'bg-yellow-600 hover:bg-yellow-500'
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
                title={`${classroomControls.soloStripId === config.id ? 'Unsolo' : 'Solo'} - only this strip receives sequencer data`}
              >
                <Eye className="w-3 h-3" />
              </button>

              <button
                onClick={() => toggleStripEnabled(config.id, !config.enabled)}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  config.enabled
                    ? 'bg-green-600 hover:bg-green-500'
                    : 'bg-red-600 hover:bg-red-500'
                }`}
                title={`${config.enabled ? 'Disable and turn off WLED device' : 'Enable strip'} - controls LED data and device state`}
              >
                {config.enabled ? 'On' : 'Off'}
              </button>

              <button
                onClick={() => removeStrip(config.id)}
                className="p-1 text-red-400 hover:text-red-300 transition-colors"
                title="Remove this LED strip from the classroom"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {stripConfigs.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No LED strips configured. Add one to get started!
          </div>
        )}
      </div>

      {/* Add Strip Button */}
      <button
        onClick={addNewStrip}
        className="flex items-center gap-2 w-full justify-center py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add LED Strip
      </button>

      {/* Status Summary */}
      {stripConfigs.length > 0 && (
        <div className="text-sm text-gray-400 text-center">
          {stripConfigs.filter(c => c.status === 'connected').length} connected, {' '}
          {stripConfigs.filter(c => c.status === 'disconnected').length} disconnected, {' '}
          {stripConfigs.filter(c => c.status === 'error').length} error
        </div>
      )}
    </div>
  );
};