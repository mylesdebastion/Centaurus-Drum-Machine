# WLED WebSocket Bridge Cleanup Guide

**Date:** 2025-12-09
**Status:** ✅ Production Pattern (v3)
**Related:** All WLED managers (Isometric, DJ Visualizer, future implementations)

**SEE ALSO:** [WLED Realtime Exit Pattern](../patterns/wled-realtime-exit-pattern.md) - Reusable pattern guide

---

## Overview

This guide documents the proper process for exiting WLED realtime mode, allowing WLED devices to revert to their standalone state (running their own patterns) when LED visualization is disabled.

### Quick Solution (v3)

```typescript
// 1. Close WebSocket FIRST
window.wledBridge?.close(1000, 'Visualization disabled');
window.wledBridge = null;

// 2. Wait 200ms
await new Promise(resolve => setTimeout(resolve, 200));

// 3. Send {"live":false} via HTTP to each device
await fetch(`http://${ip}/json/state`, {
  method: 'POST',
  body: JSON.stringify({ live: false })
});
```

**Implemented in:** /isometric (IsometricSequencer), /dj-visualizer (LEDMatrixManager)

---

## Problem Statement

When the "Enable" checkbox is unchecked in the Isometric Sequencer's LED controls:
- The WebSocket connection to the WLED bridge remained open
- **UDP packets had Byte 1 set to 255 (infinite timeout)**, so WLED devices never exited realtime mode
- WLED devices continued showing "WLED is receiving live UDP data from IP" instead of reverting to standalone mode
- Users had to manually restart WLED devices to restore standalone patterns

## Root Causes (Fixed in v2)

### Original Issue (v1)
WLED's UDP realtime protocol uses **Byte 1 to control timeout behavior**:
- `Byte 1 = 1-2`: Exit realtime mode 1-2 seconds after last packet (recommended)
- `Byte 1 = 255`: Stay in realtime mode indefinitely (never timeout)

Our implementation was using 255, which kept devices in realtime mode forever.

### v1 Implementation Bug (DO NOT USE)
The first fix attempt made things worse by mixing HTTP JSON API with UDP realtime mode:
- Sent shutdown UDP packet (byte[1]=1)
- Then sent HTTP `{"on": false}` command
- **WLED Issue #3589**: Using HTTP API while in UDP realtime mode causes devices to get stuck
- Result: Devices turned off but stayed in realtime mode, breaking re-enable

### Correct Approach (v2 - Current)
**DO NOT mix HTTP JSON API with UDP realtime mode.** Only use UDP protocol:
1. Send shutdown packet with byte[1]=1 (black frame)
2. Stop sending UDP packets (close WebSocket)
3. Wait for timeout to expire naturally
4. Device automatically exits realtime mode

---

## Solution Architecture

### Components Involved

1. **Vite Plugin** (`vite-plugins/wled-bridge.ts`)
   - Runs a WebSocket server on port 21325+ (auto-detected)
   - Forwards browser LED data via UDP WARLS protocol to WLED devices
   - Logs connection and disconnection events

2. **SingleLaneVisualizer** (`src/utils/SingleLaneVisualizer.ts`)
   - Creates and manages individual LED strip visualizations
   - Connects to WebSocket bridge via global `window.wledBridge`
   - Provides static cleanup method for proper connection closure

3. **IsometricSequencer** (`src/components/IsometricSequencer/IsometricSequencer.tsx`)
   - Main view component with LED Enable checkbox
   - Manages LED visualizer lifecycle
   - Calls cleanup when LED visualization is disabled

---

## Implementation Details

### 1. Shutdown UDP Packet Sender

Added to `SingleLaneVisualizer.ts`:

```typescript
/**
 * Send a shutdown UDP packet to exit realtime mode gracefully
 * This sends a black frame with a 1-second timeout
 */
async sendShutdownPacket(): Promise<boolean> {
  const blackFrame: LEDColor[] = new Array(this.config.ledCount).fill({ r: 0, g: 0, b: 0 });

  const message = {
    ipAddress: this.config.ipAddress,
    ledData: blackFrame,
    shutdown: true // Flag to use 1-second timeout instead of 255
  };

  window.wledBridge.send(JSON.stringify(message));
  return true;
}
```

### 2. Enhanced Vite Plugin with Shutdown Support

Updated `vite-plugins/wled-bridge.ts` to handle shutdown packets:

```typescript
const { ipAddress, ledData, shutdown } = data;

// Byte 0: Protocol (2 = DRGB, supports up to 490 LEDs)
// Byte 1: Timeout in seconds (1 = exit after 1 second, 255 = never timeout)
const packet = Buffer.alloc(2 + ledData.length * 3);
packet[0] = 2;   // DRGB protocol identifier
packet[1] = shutdown ? 1 : 255; // 1 second timeout for shutdown, infinite for normal operation

// Log shutdown packets immediately
if (shutdown) {
  console.log(`🛑 Shutdown packet sent to ${ipAddress} (byte[1]=1, will exit realtime in 1s)`);
}
```

### 3. Simplified Cleanup Sequence (UDP ONLY)

Updated `SingleLaneVisualizer.cleanupWebSocketBridge()`:

```typescript
static async cleanupWebSocketBridge(visualizers?: SingleLaneVisualizer[]): Promise<void> {
  // Step 1: Send shutdown UDP packets (byte[1]=1, black frame) to all devices
  await Promise.all(visualizers.map(v => v.sendShutdownPacket()));

  // Step 2: Wait 200ms for UDP packets to be transmitted
  await new Promise(resolve => setTimeout(resolve, 200));

  // Step 3: Close WebSocket connection (stops sending UDP packets)
  window.wledBridge.close(1000, 'LED visualization disabled');
  window.wledBridge = null;

  // Step 4: Wait 1.5s for WLED timeout to expire and devices to exit realtime mode
  await new Promise(resolve => setTimeout(resolve, 1500));

  // NO HTTP commands - devices exit realtime mode automatically via UDP timeout
}
```

**CRITICAL:** This implementation does NOT use HTTP JSON API (`turnOff()`). Mixing HTTP with UDP realtime mode causes WLED to get stuck (Issue #3589).

### 4. Automatic Cleanup on Disable

Updated `IsometricSequencer.tsx` to pass visualizers:

```typescript
useEffect(() => {
  if (!ledEnabled) {
    // Send shutdown packets and close WebSocket connection
    SingleLaneVisualizer.cleanupWebSocketBridge(ledVisualizers);
  }
}, [ledEnabled, ledVisualizers]);
```

---

## Usage

### For Users

1. **Enable LED Visualization**
   - Check the "Enable" checkbox in /isometric header
   - Click the "LED" button to show LED strip manager
   - WebSocket bridge automatically connects

2. **Disable LED Visualization**
   - Uncheck the "Enable" checkbox
   - WebSocket connection automatically closes
   - WLED devices revert to standalone mode (running their own patterns)

### For Developers

When implementing LED controls in other views:

```typescript
// Import the visualizer class
import { SingleLaneVisualizer } from '@/utils/SingleLaneVisualizer';

// When disabling LED visualization
useEffect(() => {
  if (!ledEnabled) {
    SingleLaneVisualizer.cleanupWebSocketBridge();
  }
}, [ledEnabled]);
```

---

## Expected Console Output

### When Enabling LED Visualization
```
🌉 WLED WebSocket bridge started on port 21325
📡 Forwarding to WLED devices on UDP port 21324
🔌 Browser connected to WLED bridge
📊 WLED Bridge [5s]: 192.168.8.101: 150 packets, 192.168.8.102: 150 packets
```

### When Disabling LED Visualization (v2 - CORRECT)
```
🔌 Starting WLED cleanup sequence...
📤 Sending shutdown packets to 8 WLED devices...
🛑 Sent shutdown packet to 192.168.8.101 (will exit realtime mode in 1 second)
🛑 Sent shutdown packet to 192.168.8.102 (will exit realtime mode in 1 second)
... (for all 8 devices)
🛑 Shutdown packet sent to 192.168.8.101 (byte[1]=1, will exit realtime in 1s)
🛑 Shutdown packet sent to 192.168.8.102 (byte[1]=1, will exit realtime in 1s)
... (vite plugin logs for all devices)
✅ Shutdown packets sent (byte[1]=1, will exit realtime in 1 second)
✅ WebSocket closed. No more UDP packets will be sent.
🔌 Browser disconnected from WLED bridge (code: 1000, reason: LED visualization disabled)
⏳ Waiting 1.5s for WLED devices to exit realtime mode...
✅ WLED devices should now have exited realtime mode and returned to standalone patterns.
```

**Expected WLED Device Behavior:**
- Devices receive shutdown packet with `byte[1]=1` (black frame)
- LEDs go black immediately
- Devices wait 1 second for more UDP data
- No more UDP data arrives (WebSocket closed)
- After 1 second timeout expires, devices **automatically exit realtime mode**
- WLED dashboard shows "Effect: [Previous Effect]" (NOT "receiving live UDP data")
- Standalone patterns resume immediately
- Re-enabling LED visualization works normally (devices accept new UDP data)

---

## WLED UDP Protocol Reference

### DRGB Protocol (Protocol 2)

**Packet Structure:**
- `Byte 0`: Protocol identifier (2 = DRGB, supports up to 490 LEDs)
- `Byte 1`: **Timeout in seconds** before returning to normal mode
  - `1-2`: Recommended for quick return (exit realtime after 1-2 seconds of no packets)
  - `255`: Infinite timeout (stay in realtime mode until manually changed)
- `Byte 2+`: RGB data (3 bytes per LED: R, G, B)

**Key Insight:** There is **NO explicit "exit realtime" command** in the UDP protocol. Devices exit automatically based on the timeout specified in Byte 1.

### WebSocket Close Codes

- **1000**: Normal closure (user disabled LED visualization)
- **1001**: Going away (page unload/navigation)
- **1006**: Abnormal closure (network error, dev server restart)

---

## Troubleshooting

### Issue: WLED devices stuck showing "receiving live UDP data" after disable

**Symptoms:**
- LEDs go blank when unchecking Enable
- WLED dashboard still shows "WLED is receiving live UDP data from IP"
- Re-enabling doesn't work (packets sent but no lights)

**Cause:** You may have the v1 buggy implementation that mixed HTTP with UDP

**Solution:**
1. **Power cycle the WLED devices** to clear the stuck state
2. Update to the v2 implementation (remove HTTP `turnOff()` calls)
3. Verify console shows `✅ WebSocket closed. No more UDP packets will be sent.` (NOT "turn off commands sent")

### Issue: WLED devices don't revert to standalone patterns

**Check:**
1. Wait full 1.5 seconds after disabling - timeout needs time to expire
2. Browser console shows complete cleanup sequence
3. Vite plugin shows shutdown packets: `🛑 Shutdown packet sent to X.X.X.X (byte[1]=1)`
4. WLED devices have standalone effects configured (check WLED dashboard)

**If still stuck:**
- Power cycle WLED devices
- Check WLED firmware version (should be recent)
- Verify devices are not receiving UDP from another source

### Issue: Re-enabling doesn't work

**Cause:** Devices may be turned off via HTTP API (v1 bug)

**Solution:**
1. Check WLED dashboard - if device shows "OFF", manually turn it ON
2. Update to v2 implementation (no HTTP API usage)
3. Power cycle devices to clear state

### Issue: WebSocket reconnects automatically

**Cause:** LED visualization code may still be running

**Solution:**
1. Ensure `ledEnabled` is false
2. Check that update loop respects `ledEnabled` flag
3. Verify no visualizers are trying to send data

---

## Related Files

- `src/utils/SingleLaneVisualizer.ts` - Visualizer with cleanup method
- `src/components/IsometricSequencer/IsometricSequencer.tsx` - Main usage
- `src/components/LEDStripManager/LEDStripManager.tsx` - LED strip configuration
- `vite-plugins/wled-bridge.ts` - WebSocket server plugin
- `src/types/window.d.ts` - Global `window.wledBridge` type definition

---

## Future Improvements

1. **Graceful Shutdown Animation**
   - Fade out LEDs before disconnecting
   - Send "off" command to all configured devices

2. **Reconnection Strategy**
   - Detect when user re-enables without full page refresh
   - Maintain device configurations across enable/disable cycles

3. **Multi-View Coordination**
   - Handle multiple views trying to control WLED simultaneously
   - Implement proper ownership/locking mechanism

---

## Notes for Other WLED Managers

This cleanup pattern should be adopted by:
- Global WLED managers (if/when implemented)
- View-specific WLED managers in other modules
- Any code that creates `window.wledBridge` connections

**IMPORTANT:** Always check that you're working on the correct WLED manager. The Isometric Sequencer has its own isolated WLED strip manager that is NOT the global WLED manager.

---

## For Developers: Implementing This Pattern

When adding WLED realtime mode to new views/components, use the **standardized v3 pattern**:

📖 **See:** [WLED Realtime Exit Pattern](../patterns/wled-realtime-exit-pattern.md)

This pattern guide includes:
- ✅ Three implementation patterns (single device, multi-device, broadcast)
- ✅ Complete code examples with React hooks
- ✅ Common mistakes to avoid
- ✅ Troubleshooting checklist
- ✅ Expected console output

**Current implementations:**
- `/isometric` - IsometricSequencer with SingleLaneVisualizer array (8 devices)
- `/dj-visualizer` - LEDMatrixManager with broadcast to 9 workshop devices

---

## References

This implementation is based on the official WLED UDP Realtime protocol documentation:

- [UDP Realtime / tpm2.net - WLED Project](https://kno.wled.ge/interfaces/udp-realtime/)
- [UDP Realtime Control · wled/WLED Wiki · GitHub](https://github.com/wled/WLED/wiki/UDP-Realtime-Control)
- [Using JSON API right after UDP Realtime protocol doesn't work · Issue #3589](https://github.com/wled/WLED/issues/3589)
- [How To Turn off Live Data? - Issues - WLED](https://wled.discourse.group/t/how-to-turn-off-live-data/9961)
