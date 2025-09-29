import { LEDColor, LEDStripConfig, WLEDState, LEDVisualizationSettings } from '../types/led';

export class SingleLaneVisualizer {
  private config: LEDStripConfig;
  private settings: LEDVisualizationSettings;
  private lastUpdateTime: number = 0;
  private isUpdating: boolean = false;

  constructor(
    config: LEDStripConfig,
    private totalSteps: number = 16,
    settings?: Partial<LEDVisualizationSettings>
  ) {
    this.config = config;
    this.settings = {
      updateRate: 30,
      brightness: 0.8,
      activeIntensity: 1.0,
      baseIntensity: 0.1,
      playheadColor: { r: 255, g: 255, b: 255 },
      beatMarkerColor: { r: 255, g: 255, b: 0 },
      protocol: 'http', // Default to HTTP for browser compatibility
      udpPort: 21324, // Default WLED UDP port (matches Python code)
      ...settings
    };
  }

  /**
   * Update the LED strip with current pattern state
   */
  async updateStrip(
    pattern: boolean[],
    currentStep: number,
    isPlaying: boolean,
    laneColor: string,
    isSolo: boolean = false,
    isMuted: boolean = false,
    beatProgress: number = 0
  ): Promise<boolean> {
    // Rate limiting
    const now = Date.now();
    if (now - this.lastUpdateTime < 1000 / this.settings.updateRate) {
      return true;
    }

    if (this.isUpdating) {
      return true; // Skip if already updating
    }

    try {
      this.isUpdating = true;
      this.lastUpdateTime = now;

      // Don't update if muted (unless solo)
      if (isMuted && !isSolo) {
        await this.turnOff();
        return true;
      }

      const ledArray = this.generateLEDArray(
        pattern,
        currentStep,
        isPlaying,
        laneColor,
        isSolo,
        beatProgress
      );

      const success = await this.sendToWLED(ledArray);

      if (success) {
        this.config.status = 'connected';
        this.config.lastSeen = new Date();
      } else {
        this.config.status = 'error';
      }

      return success;
    } catch (error) {
      console.warn(`Failed to update LED strip ${this.config.id} at ${this.config.ipAddress}:`, error);
      this.config.status = 'error';
      return false;
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Generate LED color array for 3D camera-style visualization
   * Bottom of strip = strike zone (current beat), top = future beats
   * Mimics the 3D perspective where notes move toward the camera/strike zone
   */
  private generateLEDArray(
    pattern: boolean[],
    currentStep: number,
    isPlaying: boolean,
    laneColor: string,
    _isSolo: boolean, // Currently unused, reserved for future solo mode features
    beatProgress: number = 0
  ): LEDColor[] {
    const ledArray: LEDColor[] = new Array(this.config.ledCount);

    // Initialize all LEDs to black/off
    for (let i = 0; i < this.config.ledCount; i++) {
      ledArray[i] = { r: 0, g: 0, b: 0 };
    }

    const noteColor = this.hexToRgb(laneColor, this.settings.activeIntensity);
    const strikeZoneColor = { r: 255, g: 255, b: 255 }; // White for strike zone
    const gridColor = { r: 80, g: 80, b: 80 }; // Dim white for grid lines

    // Show enough beats to utilize the full strip effectively
    // For 16-step patterns, show more beats ahead to fill the strip
    const minBeatsToShow = 4; // Minimum like 3D view
    const maxBeatsToShow = Math.min(this.totalSteps, 8); // Don't exceed pattern length or reasonable limit

    // Calculate optimal beats to show based on strip length and pattern
    // Aim for 8-15 LEDs per beat for good visual resolution
    let beatsToShow = minBeatsToShow;
    let ledsPerBeat = this.config.ledCount / beatsToShow;

    // If we have too many LEDs per beat, show more beats
    while (ledsPerBeat > 15 && beatsToShow < maxBeatsToShow) {
      beatsToShow++;
      ledsPerBeat = this.config.ledCount / beatsToShow;
    }

    // Debug logging to verify full strip utilization
    if (isPlaying && currentStep === 0 && beatProgress < 0.1) {
      console.log(`🔍 LED Strip Utilization: ${this.config.ledCount} LEDs, ${ledsPerBeat.toFixed(2)} per beat, showing ${beatsToShow}/${this.totalSteps} beats`);
    }

    // Apply the same easing function as the 3D visualization
    const easedProgress = beatProgress < 0.5
      ? 2 * beatProgress * beatProgress
      : -1 + (4 - 2 * beatProgress) * beatProgress;

    // Draw moving grid dividers with progressive brightness
    for (let beat = 1; beat < beatsToShow; beat++) {
      // Base position for this grid line (use floating point for precise positioning)
      const baseBeatPosition = beat * ledsPerBeat;

      // Calculate smooth movement - grid lines move toward strike zone
      const progressOffset = easedProgress * ledsPerBeat;
      const gridPosition = Math.round(baseBeatPosition - progressOffset);

      if (gridPosition >= 0 && gridPosition < this.config.ledCount) {
        // Calculate brightness based on distance from strike zone (LED 0)
        // Grid lines get brighter as they approach the strike zone
        const distanceFromStrikeZone = gridPosition / this.config.ledCount;

        // Progressive brightness: 0.2 (dim) when far, 1.0 (bright) when close
        const brightness = Math.max(0.2, 1.0 - (distanceFromStrikeZone * 0.8));

        // Special case: extra bright when very close to strike zone
        const isNearStrikeZone = gridPosition <= Math.round(ledsPerBeat * 0.25); // Within 1/4 beat of strike zone
        const finalBrightness = isNearStrikeZone ? 1.0 : brightness;

        ledArray[gridPosition] = {
          r: Math.round(gridColor.r * finalBrightness),
          g: Math.round(gridColor.g * finalBrightness),
          b: Math.round(gridColor.b * finalBrightness)
        };
      }
    }

    // Strike zone at the very beginning (bottom) of the strip - static reference
    if (this.config.ledCount > 0) {
      ledArray[0] = { ...strikeZoneColor };
    }

    // Animated strike bar that moves with beat timing (matching 3D visualization)
    // Like the 3D strike zone, it resets to the front of each beat and slides back toward position 0
    if (isPlaying) {
      const strikeBarColor = { r: 255, g: 0, b: 128 }; // Same pink/magenta as 3D (#FF0080)

      // Calculate strike bar position using exact same logic as grid lines
      // Start at the beginning of each beat section and slide toward strike zone (position 0)
      const sectionSize = ledsPerBeat; // Use same precise calculation as other elements

      // Strike bar starts at the front of the current beat section
      const currentBeatStart = sectionSize; // Always start one beat section ahead

      // Move toward strike zone with same eased progress as grid lines
      const progressOffset = easedProgress * sectionSize;
      const strikeBarPosition = Math.round(currentBeatStart - progressOffset);

      // Only draw if within valid range
      if (strikeBarPosition >= 0 && strikeBarPosition < this.config.ledCount) {
        // Draw strike bar with center point and glow effect (3-5 LEDs wide)
        const barWidth = Math.max(3, Math.round(sectionSize / 16)); // Proportional to strip size
        const barStart = Math.max(0, strikeBarPosition - Math.floor(barWidth / 2));
        const barEnd = Math.min(this.config.ledCount - 1, strikeBarPosition + Math.floor(barWidth / 2));

        for (let i = barStart; i <= barEnd; i++) {
          // Center of bar is brightest, edges are dimmer for glow effect
          const distanceFromCenter = Math.abs(i - strikeBarPosition);
          const intensity = Math.max(0.3, 1.0 - (distanceFromCenter / Math.floor(barWidth / 2) * 0.7));

          ledArray[i] = {
            r: Math.round(strikeBarColor.r * intensity),
            g: Math.round(strikeBarColor.g * intensity),
            b: Math.round(strikeBarColor.b * intensity)
          };
        }
      }
    }

    // Draw notes moving toward strike zone with smooth animation
    for (let beatOffset = 0; beatOffset < beatsToShow; beatOffset++) {
      const futureStep = (currentStep + beatOffset) % this.totalSteps;

      if (pattern[futureStep]) {
        // Calculate smooth position for this note
        const baseBeatPosition = beatOffset * ledsPerBeat;
        const progressOffset = easedProgress * ledsPerBeat;
        const notePosition = Math.round(baseBeatPosition - progressOffset);

        const notePixels = Math.max(1, Math.round(ledsPerBeat / 8)); // Each note takes 1/8 of a beat space

        // Place note pixels with progressive brightness
        for (let pixel = 0; pixel < notePixels; pixel++) {
          const ledIndex = notePosition + pixel;

          if (ledIndex >= 0 && ledIndex < this.config.ledCount) {
            if (beatOffset === 0 && isPlaying && beatProgress > 0.8) {
              // Active note being triggered - bright white flash near end of beat
              ledArray[ledIndex] = { ...strikeZoneColor };
            } else {
              // Future note - show in lane color with progressive brightness
              const distanceFromStrikeZone = ledIndex / this.config.ledCount;

              // Notes get brighter as they approach: 0.3 (dim) when far, 1.0 (bright) when close
              const brightness = Math.max(0.3, 1.0 - (distanceFromStrikeZone * 0.7));

              // Extra bright when very close to strike zone
              const isNearStrikeZone = ledIndex <= Math.round(ledsPerBeat * 0.25);
              const finalBrightness = isNearStrikeZone ? 1.0 : brightness;

              ledArray[ledIndex] = {
                r: Math.round(noteColor.r * finalBrightness),
                g: Math.round(noteColor.g * finalBrightness),
                b: Math.round(noteColor.b * finalBrightness)
              };
            }
          }
        }
      }
    }

    return ledArray;
  }

  /**
   * Send LED data to WLED device using UDP WARLS protocol or HTTP JSON
   */
  private async sendToWLED(ledArray: LEDColor[]): Promise<boolean> {
    if (this.settings.protocol === 'udp') {
      return this.sendUDPData(ledArray);
    } else {
      return this.sendHTTPData(ledArray);
    }
  }

  /**
   * Send LED data via UDP WARLS protocol through WebSocket bridge
   */
  private async sendUDPData(ledArray: LEDColor[]): Promise<boolean> {
    return this.sendWebSocketData(ledArray);
  }

  /**
   * Send LED data via WebSocket bridge to UDP WARLS
   */
  private async sendWebSocketData(ledArray: LEDColor[]): Promise<boolean> {
    try {
      // Check if WebSocket bridge is available
      if (!window.wledBridge || window.wledBridge.readyState !== WebSocket.OPEN) {
        // Try to connect to WebSocket bridge
        await this.connectWebSocketBridge();
      }

      if (!window.wledBridge || window.wledBridge.readyState !== WebSocket.OPEN) {
        console.warn(`⚠️ WebSocket bridge not available for ${this.config.ipAddress}. Install bridge: node scripts/wled-websocket-bridge.js`);
        return false;
      }

      // Send data through WebSocket bridge
      const message = {
        ipAddress: this.config.ipAddress,
        ledData: ledArray
      };

      return new Promise((resolve) => {
        const handleResponse = (event: MessageEvent) => {
          try {
            const response = JSON.parse(event.data);
            window.wledBridge?.removeEventListener('message', handleResponse);

            if (response.success) {
              console.log(`✅ WebSocket bridge sent data to ${this.config.ipAddress}`);
              resolve(true);
            } else {
              console.warn(`❌ WebSocket bridge failed for ${this.config.ipAddress}:`, response.error);
              resolve(false);
            }
          } catch (error) {
            console.warn(`🚫 WebSocket response error for ${this.config.ipAddress}:`, error);
            resolve(false);
          }
        };

        window.wledBridge?.addEventListener('message', handleResponse);
        window.wledBridge?.send(JSON.stringify(message));

        // Timeout after 2 seconds
        setTimeout(() => {
          window.wledBridge?.removeEventListener('message', handleResponse);
          console.warn(`⏰ WebSocket bridge timeout for ${this.config.ipAddress}`);
          resolve(false);
        }, 2000);
      });

    } catch (error) {
      console.warn(`🚫 WebSocket WARLS communication error for ${this.config.ipAddress}:`, error);
      return false;
    }
  }

  /**
   * Connect to WebSocket bridge - tries multiple ports
   */
  private async connectWebSocketBridge(): Promise<void> {
    const ports = [21325, 21326, 21327, 21328, 21329]; // Try multiple ports

    for (const port of ports) {
      try {
        await this.tryWebSocketConnection(port);
        console.log(`🌉 Connected to WLED WebSocket bridge on port ${port}`);
        return;
      } catch (error) {
        console.log(`⚠️ Port ${port} not available, trying next...`);
      }
    }

    throw new Error('WebSocket bridge not found on any port');
  }

  /**
   * Try connecting to WebSocket on specific port
   */
  private async tryWebSocketConnection(port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`ws://localhost:${port}`);
      let connected = false;

      const timeout = setTimeout(() => {
        if (!connected) {
          ws.close();
          reject(new Error(`Timeout connecting to port ${port}`));
        }
      }, 1000);

      ws.onopen = () => {
        connected = true;
        clearTimeout(timeout);
        console.log(`🌉 Connected to WLED WebSocket bridge on port ${port}`);
        window.wledBridge = ws;
        resolve();
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        reject(new Error(`Failed to connect to port ${port}`));
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket bridge disconnected');
        window.wledBridge = null;
      };
    });
  }

  /**
   * Send LED data via HTTP JSON - multiple approaches for maximum compatibility
   */
  private async sendHTTPData(ledArray: LEDColor[]): Promise<boolean> {
    try {
      // Method 1: Try individual pixel control using segment data
      const segmentData: WLEDState = {
        on: true,
        bri: Math.round(this.settings.brightness * 255),
        seg: [{
          id: 0,
          start: 0,
          stop: ledArray.length,
          fx: 0, // Solid color effect
          col: ledArray.map(led => [led.r, led.g, led.b])
        }]
      };

      const segmentResponse = await fetch(`http://${this.config.ipAddress}/json/state`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(segmentData),
        signal: AbortSignal.timeout(2000)
      });

      // Debug logging
      console.log(`🔄 Sending HTTP JSON data to ${this.config.ipAddress}:`, {
        studentName: this.config.studentName,
        laneIndex: this.config.laneIndex,
        protocol: 'HTTP JSON (Segment)',
        brightness: segmentData.bri,
        ledCount: ledArray.length,
        activeSteps: ledArray.filter(led => led.r > 50 || led.g > 50 || led.b > 50).length,
        url: `http://${this.config.ipAddress}/json/state`,
        sampleColors: ledArray.slice(0, 4).map(led => `rgb(${led.r},${led.g},${led.b})`)
      });

      if (segmentResponse.ok) {
        console.log(`✅ HTTP LED data sent successfully to ${this.config.ipAddress} (status: ${segmentResponse.status})`);
        return true;
      } else {
        console.warn(`❌ HTTP segment method failed for ${this.config.ipAddress}: ${segmentResponse.status} ${segmentResponse.statusText}`);

        // Method 2: Fallback to simple color setting if segment method fails
        return this.sendSimpleColorHTTP(ledArray);
      }
    } catch (error) {
      console.warn(`🚫 HTTP WLED communication error for ${this.config.ipAddress}:`, error);

      // Method 2: Fallback to simple color setting
      return this.sendSimpleColorHTTP(ledArray);
    }
  }

  /**
   * Fallback HTTP method: Set simple colors for troubleshooting
   */
  private async sendSimpleColorHTTP(ledArray: LEDColor[]): Promise<boolean> {
    try {
      // Calculate average color from the LED array
      let totalR = 0, totalG = 0, totalB = 0, activeCount = 0;

      for (const led of ledArray) {
        if (led.r > 10 || led.g > 10 || led.b > 10) { // Only count non-black LEDs
          totalR += led.r;
          totalG += led.g;
          totalB += led.b;
          activeCount++;
        }
      }

      const avgColor = activeCount > 0 ? [
        Math.round(totalR / activeCount),
        Math.round(totalG / activeCount),
        Math.round(totalB / activeCount)
      ] : [0, 0, 0];

      const simpleData = {
        on: true,
        bri: Math.round(this.settings.brightness * 255),
        seg: [{
          id: 0,
          col: [avgColor, [0, 0, 0], [0, 0, 0]]
        }]
      };

      const response = await fetch(`http://${this.config.ipAddress}/json/state`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(simpleData),
        signal: AbortSignal.timeout(2000)
      });

      console.log(`🔄 Fallback HTTP simple color to ${this.config.ipAddress}:`, avgColor);

      if (response.ok) {
        console.log(`✅ HTTP simple color sent to ${this.config.ipAddress}`);
        return true;
      } else {
        console.warn(`❌ HTTP simple color failed for ${this.config.ipAddress}: ${response.status}`);
        return false;
      }

    } catch (error) {
      console.warn(`🚫 HTTP simple color error for ${this.config.ipAddress}:`, error);
      return false;
    }
  }

  /**
   * Turn off the LED strip
   */
  async turnOff(): Promise<boolean> {
    try {
      const response = await fetch(`http://${this.config.ipAddress}/json/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ on: false }),
        signal: AbortSignal.timeout(1000)
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate rainbow flow test pattern
   */
  async sendRainbowTestPattern(): Promise<boolean> {
    console.log(`🌈 Sending rainbow flow test to ${this.config.ipAddress} (${this.config.studentName || 'Unnamed'})`);

    const ledArray: LEDColor[] = new Array(this.config.ledCount);
    const time = Date.now() / 1000; // Time in seconds for animation

    for (let i = 0; i < this.config.ledCount; i++) {
      // Create rainbow that flows along the strip
      const hue = ((i / this.config.ledCount) + (time * 0.2)) % 1.0; // 0-1 range
      const color = this.hsvToRgb(hue, 1.0, 1.0); // Full saturation and brightness
      ledArray[i] = color;
    }

    try {
      const success = await this.sendToWLED(ledArray);
      if (success) {
        console.log(`✅ Rainbow test pattern sent to ${this.config.ipAddress}`);
      } else {
        console.error(`❌ Failed to send rainbow pattern to ${this.config.ipAddress}`);
      }
      return success;
    } catch (error) {
      console.error(`🚫 Rainbow test error for ${this.config.ipAddress}:`, error);
      return false;
    }
  }

  /**
   * Convert HSV to RGB color
   */
  private hsvToRgb(h: number, s: number, v: number): LEDColor {
    const c = v * s;
    const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
    const m = v - c;

    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 1/6) {
      r = c; g = x; b = 0;
    } else if (h >= 1/6 && h < 2/6) {
      r = x; g = c; b = 0;
    } else if (h >= 2/6 && h < 3/6) {
      r = 0; g = c; b = x;
    } else if (h >= 3/6 && h < 4/6) {
      r = 0; g = x; b = c;
    } else if (h >= 4/6 && h < 5/6) {
      r = x; g = 0; b = c;
    } else {
      r = c; g = 0; b = x;
    }

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
    };
  }

  /**
   * Test connection to WLED device
   */
  async testConnection(): Promise<boolean> {
    console.log(`🔍 Testing connection to ${this.config.ipAddress} (${this.config.studentName || 'Unnamed'})`);

    try {
      const response = await fetch(`http://${this.config.ipAddress}/json/info`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000)
      });

      if (response.ok) {
        const info = await response.json();
        console.log(`✅ WLED device connected at ${this.config.ipAddress}:`, {
          name: info.name,
          version: info.ver,
          ledCount: info.leds?.count,
          ip: info.ip
        });
        this.config.status = 'connected';
        this.config.lastSeen = new Date();
        return true;
      } else {
        console.warn(`❌ WLED connection failed for ${this.config.ipAddress}: ${response.status} ${response.statusText}`);
        this.config.status = 'error';
        return false;
      }
    } catch (error) {
      console.warn(`🚫 WLED connection error for ${this.config.ipAddress}:`, error);
      this.config.status = 'disconnected';
      return false;
    }
  }

  /**
   * Update strip configuration
   */
  updateConfig(newConfig: Partial<LEDStripConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Update visualization settings
   */
  updateSettings(newSettings: Partial<LEDVisualizationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  /**
   * Get current configuration
   */
  getConfig(): LEDStripConfig {
    return { ...this.config };
  }

  /**
   * Convert hex color to RGB with intensity
   */
  private hexToRgb(hex: string, intensity: number = 1): LEDColor {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
      return { r: 0, g: 0, b: 0 };
    }

    return {
      r: Math.round(parseInt(result[1], 16) * intensity),
      g: Math.round(parseInt(result[2], 16) * intensity),
      b: Math.round(parseInt(result[3], 16) * intensity)
    };
  }

  /**
   * Apply brightness multiplier to color (preserved for future use)
   */
  // private applyBrightness(color: LEDColor, brightness: number): LEDColor {
  //   return {
  //     r: Math.min(255, Math.round(color.r * brightness)),
  //     g: Math.min(255, Math.round(color.g * brightness)),
  //     b: Math.min(255, Math.round(color.b * brightness))
  //   };
  // }

  /**
   * Adjust existing color brightness (preserved for future use)
   */
  // private adjustBrightness(color: LEDColor, multiplier: number): LEDColor {
  //   return {
  //     r: Math.min(255, Math.round(color.r * multiplier)),
  //     g: Math.min(255, Math.round(color.g * multiplier)),
  //     b: Math.min(255, Math.round(color.b * multiplier))
  //   };
  // }
}