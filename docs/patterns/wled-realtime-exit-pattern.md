# WLED Realtime Mode Exit Pattern

**Date:** 2025-12-09
**Status:** ✅ Production Pattern (v3)
**Applies to:** All WLED managers across the project

---

## TL;DR - The Correct Way

```typescript
// 1. Close WebSocket first (stop UDP packets)
if (window.wledBridge?.readyState === WebSocket.OPEN) {
  window.wledBridge.close(1000, 'Visualization disabled');
}
window.wledBridge = null;

// 2. Wait 200ms for in-flight packets
await new Promise(resolve => setTimeout(resolve, 200));

// 3. Send {"live":false} to each WLED device via HTTP JSON API
for (const ip of deviceIPs) {
  await fetch(`http://${ip}/json/state`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ live: false })
  });
}
```

---

## Problem Statement

When disabling WLED visualization, devices must exit realtime mode cleanly to:
- ✅ Return to standalone patterns (configured effects)
- ✅ Remove "WLED is receiving live UDP data" status message
- ✅ Allow re-enabling to work normally

### What DOESN'T Work

❌ **v1 - Just closing WebSocket**
- Devices stay stuck in realtime mode indefinitely
- UDP byte[1]=255 (infinite timeout) never expires

❌ **v2 - Sending UDP shutdown packet with byte[1]=1**
- ANY UDP packet resets the timeout counter
- Devices wait for more data instead of exiting

❌ **v2 - Mixing HTTP "turnOff" with UDP realtime**
- WLED Issue #3589: Devices get stuck
- LEDs turn off but stay in realtime mode
- Re-enabling sends data but nothing displays

---

## The Solution (v3)

### Critical Discovery

From WLED documentation:
> "It is expected that a `{"live":false}` is sent once the stream is terminated."

The **ONLY reliable way** to exit UDP realtime mode is:
1. **Stop sending UDP packets** (close WebSocket)
2. **Wait briefly** for in-flight packets to complete
3. **Send `{"live":false}` via HTTP JSON API**

This avoids Issue #3589 because we're **NOT mixing JSON with active UDP streaming** - we stop UDP FIRST, then use JSON.

---

## Implementation Patterns

### Pattern 1: Single Device Manager

For managers controlling one WLED device (e.g., single LED strip):

```typescript
const exitRealtimeMode = useCallback(async (ipAddress: string) => {
  try {
    const response = await fetch(`http://${ipAddress}/json/state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ live: false }),
      signal: AbortSignal.timeout(1000)
    });
    console.log(`🚪 Exit realtime mode for ${ipAddress}: ${response.ok ? 'success' : 'failed'}`);
    return response.ok;
  } catch (error) {
    console.warn(`⚠️ Failed to exit realtime mode for ${ipAddress}:`, error);
    return false;
  }
}, []);

useEffect(() => {
  if (!enabled) {
    const cleanup = async () => {
      console.log('🔌 Starting WLED cleanup...');

      // Step 1: Close WebSocket
      if (window.wledBridge?.readyState === WebSocket.OPEN) {
        window.wledBridge.close(1000, 'Visualization disabled');
      }
      window.wledBridge = null;
      console.log('✅ WebSocket closed.');

      // Step 2: Wait for in-flight packets
      await new Promise(resolve => setTimeout(resolve, 200));

      // Step 3: Exit realtime mode
      await exitRealtimeMode(deviceIP);
      console.log('✅ WLED cleanup complete.');
    };

    cleanup();
    return;
  }

  // ... connection logic
}, [enabled, deviceIP, exitRealtimeMode]);
```

**Example:** LEDMatrixManager (single device configuration)

### Pattern 2: Multi-Device Manager with Visualizers

For managers with SingleLaneVisualizer instances (e.g., classroom with multiple strips):

```typescript
// In SingleLaneVisualizer.ts
async exitRealtimeMode(): Promise<boolean> {
  try {
    const response = await fetch(`http://${this.config.ipAddress}/json/state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ live: false }),
      signal: AbortSignal.timeout(1000)
    });
    console.log(`🚪 Exit realtime mode for ${this.config.ipAddress}: ${response.ok ? 'success' : 'failed'}`);
    return response.ok;
  } catch (error) {
    console.warn(`⚠️ Failed to exit realtime mode for ${this.config.ipAddress}:`, error);
    return false;
  }
}

static async cleanupWebSocketBridge(visualizers?: SingleLaneVisualizer[]): Promise<void> {
  console.log('🔌 Starting WLED cleanup sequence (v3)...');

  // Step 1: Close WebSocket
  if (window.wledBridge) {
    if (window.wledBridge.readyState === WebSocket.OPEN ||
        window.wledBridge.readyState === WebSocket.CONNECTING) {
      window.wledBridge.close(1000, 'LED visualization disabled');
    }
    window.wledBridge = null;
    console.log('✅ WebSocket closed.');
  }

  // Step 2: Wait for in-flight packets
  await new Promise(resolve => setTimeout(resolve, 200));

  // Step 3: Exit realtime mode on all devices
  if (visualizers && visualizers.length > 0) {
    console.log(`🚪 Sending {"live":false} to ${visualizers.length} WLED devices...`);
    await Promise.all(visualizers.map(v => v.exitRealtimeMode()));
    console.log('✅ All devices exited realtime mode.');
  }

  console.log('✅ WLED cleanup complete.');
}

// In React component
useEffect(() => {
  if (!ledEnabled) {
    SingleLaneVisualizer.cleanupWebSocketBridge(ledVisualizers);
  }
}, [ledEnabled, ledVisualizers]);
```

**Example:** IsometricSequencer (/isometric view)

### Pattern 3: Broadcast to Multiple IPs (Workshop/Classroom)

For managers broadcasting to a hardcoded list of devices:

```typescript
const exitRealtimeMode = useCallback(async (ipAddress: string) => {
  try {
    const response = await fetch(`http://${ipAddress}/json/state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ live: false }),
      signal: AbortSignal.timeout(1000)
    });
    console.log(`🚪 Exit realtime mode for ${ipAddress}: ${response.ok ? 'success' : 'failed'}`);
    return response.ok;
  } catch (error) {
    console.warn(`⚠️ Failed to exit realtime mode for ${ipAddress}:`, error);
    return false;
  }
}, []);

useEffect(() => {
  if (!enabled) {
    const cleanup = async () => {
      console.log('🔌 Starting WLED cleanup...');

      // Step 1: Close WebSocket
      if (window.wledBridge) {
        if (window.wledBridge.readyState === WebSocket.OPEN) {
          window.wledBridge.close(1000, 'Visualization disabled');
        }
        window.wledBridge = null;
        console.log('✅ WebSocket closed.');
      }

      // Step 2: Wait for in-flight packets
      await new Promise(resolve => setTimeout(resolve, 200));

      // Step 3: Exit realtime mode on all broadcast devices
      const DEVICES = [
        '192.168.8.101', '192.168.8.102', '192.168.8.103',
        // ... more IPs
      ];

      console.log(`🚪 Sending {"live":false} to ${DEVICES.length} devices...`);
      await Promise.all(DEVICES.map(ip => exitRealtimeMode(ip)));
      console.log('✅ WLED cleanup complete.');
    };

    cleanup();
    return;
  }

  // ... connection logic
}, [enabled, exitRealtimeMode]);
```

**Example:** LiveAudioVisualizer (/dj-visualizer with WORKSHOP_DEVICES)

---

## Expected Console Output

### When Disabling
```
🔌 Starting WLED cleanup sequence (v3)...
✅ WebSocket closed. No more UDP packets will be sent.
🚪 Sending {"live":false} to 8 WLED devices...
🚪 Exit realtime mode for 192.168.8.101: success
🚪 Exit realtime mode for 192.168.8.102: success
... (all devices)
✅ All devices exited realtime mode.
✅ WLED cleanup complete. Devices returned to standalone mode.
🔌 Browser disconnected from WLED bridge (code: 1000, reason: LED visualization disabled)
```

### Expected WLED Device Behavior
- ✅ WLED dashboard immediately shows "Effect: [Your Effect]" (NOT "receiving live UDP data")
- ✅ Standalone patterns resume automatically
- ✅ LEDs display configured effects
- ✅ Re-enabling works normally (devices accept new UDP data)

---

## Common Mistakes

### ❌ Sending UDP "shutdown" packet
```typescript
// DON'T DO THIS - resets timeout!
await visualizer.sendShutdownPacket(); // Sends UDP with byte[1]=1
```

**Why it fails:** Any UDP packet resets WLED's timeout counter. The device waits for MORE data instead of exiting.

### ❌ Mixing HTTP with active UDP streaming
```typescript
// DON'T DO THIS - causes Issue #3589!
await sendUDPPackets();
await fetch(`http://${ip}/json/state`, { body: JSON.stringify({ on: false }) });
```

**Why it fails:** WLED gets confused when HTTP commands arrive while UDP realtime is active.

### ❌ Using HTTP "on: false" instead of "live: false"
```typescript
// DON'T DO THIS - turns device off, doesn't exit realtime!
await fetch(`http://${ip}/json/state`, { body: JSON.stringify({ on: false }) });
```

**Why it fails:** `on: false` turns off the LEDs but doesn't exit realtime mode.

---

## Troubleshooting

### Issue: Devices still show "receiving live UDP data"

**Check:**
1. Console shows `{"live":false}` being sent (not just WebSocket close)
2. HTTP requests return 200 OK (devices are reachable)
3. No other code is still sending UDP packets

**Solution:**
- Power cycle WLED devices to force clear stuck state
- Verify vite plugin shows: `🔌 Browser disconnected from WLED bridge`
- Check no other browser tabs are sending UDP to same devices

### Issue: Re-enabling doesn't work

**Check:**
1. Console shows successful cleanup (`✅ WLED cleanup complete`)
2. WLED dashboard shows standalone effect (not "receiving data")
3. WebSocket reconnects when re-enabling

**Solution:**
- Hard refresh browser (Ctrl+Shift+R)
- Check WLED devices are ON (not turned off)
- Verify vite plugin is running (`🌉 WLED WebSocket bridge started`)

---

## Implementation Checklist

When adding WLED realtime mode to a new component:

- [ ] **Identify device IP(s)** - single device, visualizer array, or broadcast list?
- [ ] **Create `exitRealtimeMode()` function** - sends `{"live":false}` via HTTP
- [ ] **Add cleanup on disable** - close WebSocket → wait 200ms → exit realtime
- [ ] **Update useEffect dependencies** - include `exitRealtimeMode` callback
- [ ] **Test complete cycle** - enable → disable → check WLED dashboard → re-enable
- [ ] **Verify console output** - should match expected pattern above
- [ ] **Document device IPs** - where are they configured? (hardcoded vs state)

---

## Files Implementing This Pattern

### ✅ Implemented (v3)
- `src/utils/SingleLaneVisualizer.ts` - `cleanupWebSocketBridge()` static method
- `src/components/IsometricSequencer/IsometricSequencer.tsx` - /isometric view
- `src/components/LiveAudioVisualizer/LEDMatrixManager.tsx` - /dj-visualizer

### 🔄 Needs Update
- Global WLED manager (when implemented)
- Other view-specific WLED managers

---

## Related Documentation

- [WLED WebSocket Cleanup Guide](../troubleshooting/wled-websocket-cleanup.md) - Detailed troubleshooting
- [WLED UDP Realtime / tpm2.net](https://kno.wled.ge/interfaces/udp-realtime/) - Official WLED docs
- [WLED Issue #3589](https://github.com/wled/WLED/issues/3589) - HTTP/UDP mixing bug
- [UDP Realtime Control Wiki](https://github.com/wled/WLED/wiki/UDP-Realtime-Control) - Protocol details

---

## Version History

- **v3 (2025-12-09)**: ✅ CORRECT - Close WebSocket → Wait → Send `{"live":false}`
- **v2 (2025-12-09)**: ❌ BROKEN - Sent UDP shutdown packet (resets timeout)
- **v1 (Initial)**: ❌ BROKEN - Only closed WebSocket (devices stayed in realtime)
