# WLED Direct Communication Protocols Investigation

**Story:** 22.1 - Investigate WLED Communication Protocols
**Date:** December 10, 2025
**Status:** ✅ Complete
**Epic:** 22 - WLED Direct Browser Communication

---

## Executive Summary

This investigation compares three methods for browser-to-WLED communication to determine why HTTP commands work while LED streaming fails in `/wled-test`:

**Key Findings:**
1. ✅ **HTTP JSON API works** for connection testing and power control (proven in existing code)
2. ❌ **LED streaming currently fails** because it uses wled-bridge fallback (not direct communication)
3. ✅ **HTTP JSON API can support real-time LED streaming** using the `"i"` property with hex colors
4. ✅ **WebSocket provides better performance** for high-frequency updates (4 concurrent clients max)
5. ⚠️ **Browser security is the critical blocker** for production deployment (HTTPS→HTTP mixed content)

**Recommendation:** Implement **HTTP JSON API first (Story 22.2)**, then **WebSocket optimization (Story 22.3)** if performance is insufficient.

---

## Root Cause Analysis

### Why HTTP Commands Work

**testConnection() - WLEDDeviceManager.tsx:192-238**
```typescript
const url = `http://${device.ip}:80/json/info`;
const response = await fetch(url, {
  method: 'GET',
  mode: 'cors',
  signal: AbortSignal.timeout(10000),
});
```
✅ **Works:** Direct browser → WLED HTTP request with CORS

**toggleEnabled() - WLEDDeviceManager.tsx:362-373**
```typescript
await fetch(`http://${device.ip}:80/json/state`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ on: false }),
  signal: AbortSignal.timeout(2000),
});
```
✅ **Works:** Turns off WLED device LEDs via HTTP POST

### Why LED Streaming Fails

**sendLEDData() - WLEDDeviceManager.tsx:241-295**
```typescript
if (!window.wledBridge || window.wledBridge.readyState !== WebSocket.OPEN) {
  console.warn('WebSocket bridge not available');
  return; // ❌ Early return, never sends data!
}
```

**Problem:** The code expects `window.wledBridge` (the Node.js WebSocket bridge) to be available. When the bridge isn't running, it simply returns without attempting direct communication.

**Impact:**
- ❌ Rainbow animation fails (tries to use bridge)
- ❌ Test button fails (tries to use bridge)
- ❌ Toggle ON fails to turn LEDs back on (no LED data sent)

---

## Protocol Comparison

| Feature | UDP WARLS (wled-bridge) | HTTP JSON API | WebSocket /ws |
|---------|-------------------------|---------------|---------------|
| **Connection** | Node.js server → UDP | Browser → HTTP | Browser → WebSocket |
| **Endpoint** | Port 21324 (UDP) | POST `/json/state` | `ws://[ip]/ws` |
| **Browser Support** | ❌ No (requires server) | ✅ Yes (fetch API) | ✅ Yes (WebSocket API) |
| **Packet Format** | Binary: `[2,255,r,g,b,...]` | JSON: `{"seg":{"i":["FF0000",...]}}` | JSON: `{"seg":{"i":["FF0000",...]}}` |
| **Color Format** | RGB bytes (3 per LED) | Hex strings (6 chars) or RGB arrays | Hex strings (6 chars) or RGB arrays |
| **Performance** | 🟢 Excellent (UDP, binary) | 🟡 Good (HTTP overhead) | 🟢 Excellent (persistent connection) |
| **Latency** | ~5-10ms | ~20-50ms (request/response) | ~5-15ms |
| **Rate Limiting** | None | Sequential requests recommended | 4 client limit |
| **Buffer Limit** | None (UDP packet size) | 10KB (ESP8266), 24KB (ESP32) | 10KB (ESP8266), 24KB (ESP32) |
| **CORS Required** | No (server-side) | ✅ Yes (WLED supports CORS) | ⚠️ Mixed (connection requires permission) |
| **Mixed Content** | ✅ No issue (server handles) | ❌ Blocked (HTTPS→HTTP) | ❌ Blocked (HTTPS→ws://) |
| **Local Network Access** | ✅ No issue (server handles) | ⚠️ Requires Chrome permission | ⚠️ Requires Chrome permission |
| **Production Viability** | ✅ Works (requires dev server) | ❌ Blocked in production (HTTPS) | ❌ Blocked in production (HTTPS) |
| **Development Viability** | ✅ Works (localhost:5173) | ✅ Works (HTTP→HTTP) | ✅ Works (HTTP→ws://) |

---

## Protocol Details

### 1. UDP WARLS (Current Production Method)

**How It Works:**
```
Browser → WebSocket (ws://localhost:21325+)
  ↓ JSON: { ipAddress: "192.168.1.50", ledData: [{r,g,b}, ...] }
Node.js Bridge → UDP Packet (port 21324)
  ↓ Binary: [2, 255, r1, g1, b1, r2, g2, b2, ...]
WLED Device → Updates LEDs
```

**Pros:**
- ✅ Reliable and proven (used in all production features)
- ✅ No browser security restrictions (server-side UDP)
- ✅ Excellent performance (binary protocol)
- ✅ Works from HTTPS sites (browser only talks to local WebSocket)

**Cons:**
- ❌ Requires Node.js dev server running
- ❌ Not viable for mobile/remote scenarios without server infrastructure
- ❌ Cannot work in static deployment (GitHub Pages, etc.)

**Code Reference:** `vite-plugins/wled-bridge.ts:56-77`

---

### 2. HTTP JSON API (Recommended for Story 22.2)

**How It Works:**
```
Browser → HTTP POST http://[ip]/json/state
  ↓ JSON: {"seg":{"i":["FF0000","00FF00","0000FF",...]}}
WLED Device → Updates LEDs
```

**Packet Format (Individual LED Control):**
```json
{
  "seg": {
    "i": [
      "FF0000",  // LED 0: Red (hex format, preferred)
      "00FF00",  // LED 1: Green
      "0000FF"   // LED 2: Blue
    ]
  }
}
```

**Alternative RGB Array Format:**
```json
{
  "seg": {
    "i": [
      [255, 0, 0],    // LED 0: Red
      [0, 255, 0],    // LED 1: Green
      [0, 0, 255]     // LED 2: Blue
    ]
  }
}
```

**Important Notes:**
- ✅ Hex format is more efficient for large LED counts
- ⚠️ Brightness must be set beforehand (cannot turn on + set colors in same request)
- ⚠️ LED indices are segment-based (LED 0 = first LED of segment)
- ⚠️ Buffer limit: 10KB (ESP8266), 24KB (ESP32) - split large requests
- ⚠️ Sequential requests recommended (avoid parallel calls)

**Pros:**
- ✅ Direct browser → WLED (no server required)
- ✅ Simple implementation (fetch API)
- ✅ Proven to work (testConnection/toggleEnabled already use this)
- ✅ WLED supports CORS (confirmed by existing HTTP calls)
- ✅ Works in development (HTTP→HTTP)

**Cons:**
- ❌ Mixed Content blocking in production (HTTPS→HTTP)
- ❌ Requires Chrome "Local Network Access" permission
- ⚠️ HTTP overhead may impact performance (20-50ms latency)
- ⚠️ Sequential requests required (no parallel)

**Code Reference:** WLEDDeviceManager.tsx:192-238 (testConnection), :362-373 (toggleEnabled)

**Official Documentation:** [WLED JSON API](https://kno.wled.ge/interfaces/json-api/)

---

### 3. WebSocket /ws (Recommended for Story 22.3 if HTTP is too slow)

**How It Works:**
```
Browser → WebSocket ws://[ip]/ws (connect once)
  ↓ JSON: {"seg":{"i":["FF0000","00FF00","0000FF",...]}}
WLED Device → Updates LEDs + broadcasts state to all clients
```

**Connection:**
```javascript
const ws = new WebSocket(`ws://${device.ip}/ws`);
ws.onopen = () => {
  console.log('Connected to WLED WebSocket');
};
ws.onmessage = (event) => {
  const state = JSON.parse(event.data); // Full state + info object
  console.log('WLED state updated:', state);
};
```

**Sending LED Data:**
```javascript
// Same format as HTTP JSON API
ws.send(JSON.stringify({
  seg: {
    i: ["FF0000", "00FF00", "0000FF", ...]
  }
}));
```

**Special Commands:**
- `{"v":true}` - Request full state object
- `{"lv":true}` - Request live LED stream (Peek feature)

**Pros:**
- ✅ Persistent connection (lower latency than HTTP polling)
- ✅ Bidirectional (receive state updates automatically)
- ✅ Same JSON format as HTTP API (easy migration)
- ✅ Better performance for high-frequency updates (5-15ms latency)
- ✅ Works in development (HTTP→ws://)

**Cons:**
- ❌ Mixed Content blocking in production (HTTPS→wss://, but WLED doesn't support wss://)
- ❌ Connection limit: 4 clients max (2 for ESP8266)
- ⚠️ More complex connection management (reconnection logic)
- ⚠️ Requires Chrome "Local Network Access" permission

**Code Reference:** No existing implementation (new for Story 22.3)

**Official Documentation:** [WLED WebSocket](https://kno.wled.ge/interfaces/websocket/)

---

## Browser Security Restrictions

### 1. Mixed Content Blocking

**Problem:** HTTPS sites cannot load HTTP resources (blocked by default)

```
✅ http://localhost:5173 → http://192.168.1.50  (works)
❌ https://jam.audiolux.app → http://192.168.1.50  (blocked)
```

**Browser Error:**
> "Mixed Content: The page at 'https://...' was loaded over HTTPS, but requested an insecure resource 'http://192.168.1.50/...'. This request has been blocked; the content must be served over HTTPS."

**Impact:**
- ❌ Production deployment blocked (Vercel serves over HTTPS)
- ✅ Development works (localhost serves over HTTP)
- ❌ WLED devices don't support HTTPS (no SSL certificates for local IPs)

**Workarounds:**
1. Native app (Capacitor) - bypasses browser security (Epic 6 proposal)
2. Chrome Local Network Access permission - allows HTTPS→HTTP for local network
3. Self-signed certificates on WLED - impractical (user trust issues)

**Reference:** [MDN Mixed Content](https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content)

---

### 2. Chrome Local Network Access (Private Network Access)

**Timeline:**
- Chrome 138+ (opt-in via `chrome://flags/#local-network-access-check`)
- Chrome 141 (September 30, 2025) - Enabled by default
- Chrome 142 (October 28, 2025) - Fully enforced

**How It Works:**
1. Browser detects request to private network (192.168.x.x, 10.x.x.x)
2. Shows permission prompt: "Allow [site] to access devices on your local network?"
3. User grants permission → requests allowed
4. User denies → requests blocked

**Key Features:**
- ✅ Solves HTTPS→HTTP mixed content for local network (if permission granted)
- ⚠️ Requires manual user permission (one-time per site)
- ⚠️ Only works on secure contexts (HTTPS or localhost)
- ✅ Applies to both HTTP and WebSocket connections

**Manual Permission (Current Workaround):**
1. Navigate to `chrome://settings/content/siteDetails?site=https://jam.audiolux.app`
2. Find "Local Network Access" permission
3. Set to "Allow"

**Impact on /wled-test:**
- ✅ Works if user grants permission
- ⚠️ Permission required on first access
- ❌ No permission API (can't detect or request programmatically yet)

**Reference:** [Chrome Local Network Access](https://developer.chrome.com/blog/local-network-access)

---

### 3. CORS (Cross-Origin Resource Sharing)

**Status:** ✅ WLED supports CORS (confirmed by working testConnection/toggleEnabled)

**Headers (WLED sends automatically):**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

**Impact:**
- ✅ No CORS issues for HTTP requests (already working)
- ✅ No CORS issues for WebSocket connections (WLED supports it)

---

## Performance Considerations

### Expected FPS Rates

| Method | Expected FPS | Latency | Notes |
|--------|-------------|---------|-------|
| UDP WARLS | 60-120 FPS | 5-10ms | Binary protocol, no HTTP overhead |
| HTTP JSON API | 20-40 FPS | 20-50ms | Request/response overhead |
| WebSocket | 40-80 FPS | 5-15ms | Persistent connection, minimal overhead |

### HTTP JSON API Performance Notes

**Buffer Limits:**
- ESP8266: 10KB max packet size
- ESP32: 24KB max packet size

**Example Calculations:**
```
150 LEDs × 6 chars/hex = 900 chars (< 1KB) ✅ Fits in single request
300 LEDs × 6 chars/hex = 1,800 chars (< 2KB) ✅ Fits in single request
1000 LEDs × 6 chars/hex = 6KB ✅ ESP32 only
```

**Recommendation:**
- Use hex format (6 chars) instead of RGB arrays (3 numbers = ~15 chars)
- Keep LED counts under 1000 for ESP32, under 500 for ESP8266
- Split larger LED counts into multiple sequential requests

**Sequential vs Parallel:**
- ⚠️ Do NOT send parallel requests (WLED firmware may drop packets)
- ✅ Queue requests and send sequentially with minimal delay

---

## Recommendations

### Story 22.2: Implement HTTP JSON API

**Priority:** ⭐⭐⭐ High (Proves viability of direct communication)

**Implementation Plan:**
1. Add `sendLEDDataHTTP()` method to WLEDDeviceManager
2. Convert hex color array to JSON format: `{"seg":{"i":["FF0000",..."]}}`
3. POST to `http://${device.ip}/json/state`
4. Handle CORS (already works), timeout errors, connection failures
5. Measure performance (FPS counter, latency logging)
6. Test with Rainbow animation (150 LEDs × 60 FPS = challenging)

**Expected Outcome:**
- Rainbow animation should work at 20-40 FPS (acceptable for visual effect)
- Test button should work (static pattern, no performance concerns)
- Toggle ON should turn LEDs back on (send last known colors)

**Success Criteria:**
- ✅ Rainbow animation renders smoothly (subjective visual test)
- ✅ FPS counter shows 20+ FPS consistently
- ✅ No dropped frames or stuttering
- ✅ Works without wled-bridge running

---

### Story 22.3: Implement WebSocket (Optional)

**Priority:** ⭐⭐ Medium (Only if HTTP performance is insufficient)

**Conditions to Proceed:**
- HTTP FPS < 20 (subjectively choppy)
- User wants higher performance for audio-reactive effects
- Epic 6 requires real-time bidirectional state sync

**Implementation Plan:**
1. Add `connectWebSocket()` method to WLEDDeviceManager
2. Establish persistent connection to `ws://${device.ip}/ws`
3. Implement reconnection logic (connection drops, network changes)
4. Send LED data via WebSocket (same JSON format as HTTP)
5. Handle state updates from WLED (bidirectional sync)
6. Compare performance with HTTP (should be 2-3x faster)

**Expected Outcome:**
- 40-80 FPS for Rainbow animation (excellent performance)
- Lower latency (5-15ms vs 20-50ms)
- Bidirectional state updates (WLED → browser)

**Fallback Strategy:**
- WebSocket → HTTP → wled-bridge (graceful degradation)

---

### Production Deployment Strategy

**Short Term (Development):**
- ✅ HTTP JSON API works (localhost:5173 → HTTP WLED)
- ✅ WebSocket works (localhost:5173 → ws:// WLED)
- ✅ Use for local testing, hardware integration demos

**Medium Term (Production - Limited):**
- ⚠️ Chrome Local Network Access permission required
- ⚠️ User must manually grant permission in site settings
- ⚠️ Only works on Chrome 141+ (September 2025)
- ⚠️ Limited to Chrome/Edge (Firefox/Safari have different restrictions)

**Long Term (Production - Full Support):**
- Option 1: Capacitor native app (Epic 6 proposal) - bypasses browser security
- Option 2: Wait for WLED firmware HTTPS support (external dependency)
- Option 3: Keep wled-bridge as production method (requires server infrastructure)

**Recommendation for Epic 6:**
- ✅ Pursue Capacitor native app (iOS/Android)
- ✅ Use HTTP/WebSocket direct communication in native app context
- ✅ Avoid browser security restrictions entirely

---

## Next Steps

### Immediate (Story 22.2)
1. ✅ Complete this investigation (Story 22.1) ✓
2. Implement `sendLEDDataHTTP()` in WLEDDeviceManager
3. Test Rainbow animation with HTTP JSON API
4. Measure FPS and latency
5. Document findings in `/wled-test` UI

### Conditional (Story 22.3)
1. If HTTP FPS < 20, implement WebSocket
2. Compare WebSocket vs HTTP performance
3. Document tradeoffs and recommendations

### Epic 6 Update
1. Update Epic 6 with findings from this investigation
2. Recommend Capacitor native app approach
3. Note that HTTP/WebSocket direct communication works in native context

---

## Code Snippets

### HTTP JSON API Implementation (Story 22.2)

```typescript
// Add to WLEDDeviceManager.tsx
const sendLEDDataHTTP = async (deviceId: string, colors: string[]) => {
  const device = devices.find((d) => d.id === deviceId);
  if (!device || device.connectionStatus !== 'connected') return;

  try {
    // Convert hex colors to WLED segment format
    const ledColors = colors.slice(0, device.ledCount);

    // Apply brightness (multiply RGB values before converting to hex)
    const brightness = device.brightness / 255;
    const adjustedColors = ledColors.map((hex) => {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);

      const newR = Math.round(r * brightness).toString(16).padStart(2, '0');
      const newG = Math.round(g * brightness).toString(16).padStart(2, '0');
      const newB = Math.round(b * brightness).toString(16).padStart(2, '0');

      return `${newR}${newG}${newB}`;
    });

    // Apply reverse direction
    if (device.reverseDirection) {
      adjustedColors.reverse();
    }

    // Build JSON payload
    const payload = {
      seg: {
        i: adjustedColors  // Hex format (preferred for efficiency)
      }
    };

    // Send HTTP POST request
    const response = await fetch(`http://${device.ip}:${device.port || 80}/json/state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      mode: 'cors',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // Update device state
    updateDevice(deviceId, {
      dataFlowStatus: 'sending',
      lastDataSent: Date.now(),
    });

    // Update FPS counter
    updateFPS(deviceId);

  } catch (error) {
    console.error(`Failed to send LED data to ${device.name}:`, error);
    updateDevice(deviceId, {
      dataFlowStatus: 'idle',
      lastError: error instanceof Error ? error.message : 'HTTP send failed',
    });
  }
};
```

### WebSocket Implementation (Story 22.3)

```typescript
// Add to WLEDDeviceManager.tsx
const connectWebSocket = (deviceId: string) => {
  const device = devices.find((d) => d.id === deviceId);
  if (!device) return;

  try {
    const ws = new WebSocket(`ws://${device.ip}:${device.port || 80}/ws`);

    ws.onopen = () => {
      console.log(`WebSocket connected to ${device.name}`);
      updateDevice(deviceId, {
        connectionStatus: 'connected',
        websocket: ws
      });
    };

    ws.onmessage = (event) => {
      // WLED sends full state updates automatically
      const state = JSON.parse(event.data);
      console.log('WLED state update:', state);
      // TODO: Update device state from WLED feedback
    };

    ws.onerror = (error) => {
      console.error(`WebSocket error for ${device.name}:`, error);
      updateDevice(deviceId, {
        connectionStatus: 'error',
        lastError: 'WebSocket connection failed'
      });
    };

    ws.onclose = () => {
      console.log(`WebSocket disconnected from ${device.name}`);
      updateDevice(deviceId, {
        connectionStatus: 'disconnected',
        websocket: null
      });

      // Auto-reconnect if enabled
      if (device.autoReconnect && device.enabled) {
        setTimeout(() => connectWebSocket(deviceId), 2000);
      }
    };

  } catch (error) {
    console.error(`Failed to connect WebSocket to ${device.name}:`, error);
    updateDevice(deviceId, {
      connectionStatus: 'error',
      lastError: error instanceof Error ? error.message : 'WebSocket failed',
    });
  }
};

const sendLEDDataWebSocket = async (deviceId: string, colors: string[]) => {
  const device = devices.find((d) => d.id === deviceId);
  if (!device || !device.websocket || device.websocket.readyState !== WebSocket.OPEN) {
    // Fallback to HTTP if WebSocket not available
    return sendLEDDataHTTP(deviceId, colors);
  }

  try {
    // Same format as HTTP API
    const ledColors = colors.slice(0, device.ledCount);

    // Apply brightness and reverse (same as HTTP implementation)
    // ... (brightness/reverse logic here) ...

    const payload = {
      seg: {
        i: adjustedColors
      }
    };

    device.websocket.send(JSON.stringify(payload));

    updateDevice(deviceId, {
      dataFlowStatus: 'sending',
      lastDataSent: Date.now(),
    });

    updateFPS(deviceId);

  } catch (error) {
    console.error(`Failed to send WebSocket data to ${device.name}:`, error);
    // Fallback to HTTP
    return sendLEDDataHTTP(deviceId, colors);
  }
};
```

---

## References

### WLED Documentation
- [WLED JSON API](https://kno.wled.ge/interfaces/json-api/) - Official JSON API documentation
- [WLED WebSocket](https://kno.wled.ge/interfaces/websocket/) - WebSocket protocol documentation
- [WLED GitHub Wiki](https://github.com/wled/WLED/wiki/JSON-API/) - Legacy JSON API docs

### Browser Security
- [Chrome Local Network Access](https://developer.chrome.com/blog/local-network-access) - Official Chrome blog post
- [Private Network Access Update (2024)](https://developer.chrome.com/blog/private-network-access-update-2024-03) - March 2024 update
- [MDN Mixed Content](https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content) - Mixed content blocking explanation
- [Cloudflare Mixed Content Guide](https://www.cloudflare.com/learning/ssl/what-is-mixed-content/) - What is mixed content?

### Code References
- `vite-plugins/wled-bridge.ts` - UDP WARLS implementation (lines 56-77)
- `src/components/WLED/WLEDDeviceManager.tsx` - HTTP patterns (lines 192-238, 362-373)
- `src/components/WLEDExperiment/WLEDDirectTest.tsx` - Test page using WLEDDeviceManager

---

## Conclusion

**HTTP JSON API is viable for direct browser→WLED communication** with these caveats:

✅ **Works in Development:** HTTP→HTTP (localhost:5173)
⚠️ **Limited in Production:** Requires Chrome Local Network Access permission
❌ **Blocked by Default:** HTTPS→HTTP mixed content security

**Recommended Path Forward:**
1. **Story 22.2:** Implement HTTP JSON API for `/wled-test` (proves concept)
2. **Story 22.3:** Add WebSocket if HTTP performance insufficient (< 20 FPS)
3. **Epic 6:** Pursue Capacitor native app for production multi-client sessions

**Performance Expectation:**
- HTTP: 20-40 FPS (acceptable for visual effects)
- WebSocket: 40-80 FPS (excellent for audio-reactive)
- UDP WARLS: 60-120 FPS (current production baseline)

The investigation confirms that **direct communication is technically feasible** but **browser security remains the production blocker** (consistent with Epic 6 findings). Capacitor native app is the recommended long-term solution for multi-client sessions.
