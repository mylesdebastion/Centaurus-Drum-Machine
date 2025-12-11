# Story 22.2: Implement Direct HTTP JSON API Communication

**Epic:** 22 - WLED Direct Browser Communication
**Status:** ✅ **COMPLETE** (Implementation Ready for Testing)
**Date:** December 10, 2025
**Blocking:** None
**Blocked By:** Story 22.1 (Investigation) ✅ Complete

---

## Story Goal

Extend `WLEDDeviceManager` to send LED data via WLED's HTTP JSON API, bypassing the wled-bridge for the `/wled-test` experiment, enabling direct browser→WLED communication without server infrastructure.

---

## Implementation Summary

### Changes Made

**1. New Method: `sendLEDDataHTTP()` (WLEDDeviceManager.tsx:241-323)**

Added direct HTTP JSON API implementation:
- Converts hex color array to WLED segment format `{"seg":{"i":["FF0000",..."]}}`
- Applies brightness adjustment to hex colors (maintains efficiency)
- Applies reverse direction before brightness (correct LED ordering)
- Uses WLED-recommended hex format (6 chars per LED, efficient for large counts)
- Handles CORS, timeouts (3 seconds), and error logging
- Updates FPS counter and device status

**Format Example:**
```json
POST http://192.168.1.50/json/state
{
  "seg": {
    "i": ["FF0000", "00FF00", "0000FF", ...]  // 150 LEDs × 6 chars = 900 chars
  }
}
```

**2. Updated Method: `sendLEDData()` (WLEDDeviceManager.tsx:326-390)**

Modified to use HTTP-first with bridge fallback:
- **Try HTTP first:** Calls `sendLEDDataHTTP()` (new direct method)
- **Fallback to bridge:** Uses `window.wledBridge` if HTTP fails
- **Graceful degradation:** No breaking changes to existing functionality
- **Console logging:** Clear indicators of which method is used

**Flow:**
```
sendLEDData() called (Rainbow, Test button, etc.)
  ↓
Try sendLEDDataHTTP() (Direct browser → WLED)
  ✅ Success → Done! (no bridge needed)
  ❌ Fail → Fallback to wled-bridge (legacy path)
```

**3. Updated UI: WLEDDirectTest.tsx**

Updated experiment page documentation:
- Info card: Explains Story 22.2 goal and completion status
- Technical notes: Shows HTTP JSON API endpoint and format
- Performance expectations: 20-40 FPS for HTTP (vs 60-120 FPS for UDP bridge)
- Security notes: Chrome "Local Network Access" permission requirement

---

## Technical Details

### HTTP Request Format

**Endpoint:** `POST http://[device-ip]:[port]/json/state`
**Headers:** `Content-Type: application/json`
**Timeout:** 3 seconds (AbortSignal)
**CORS Mode:** `cors` (WLED supports CORS headers)

**Payload Structure:**
```json
{
  "seg": {
    "i": [
      "FF0000",  // LED 0: Red (hex format)
      "00FF00",  // LED 1: Green
      "0000FF"   // LED 2: Blue
      // ... up to device.ledCount LEDs
    ]
  }
}
```

**Why Hex Format?**
- WLED documentation: "Hex values are more efficient than Color arrays"
- Hex: 6 chars per LED (`"FF0000"`)
- RGB array: ~15 chars per LED (`[255, 0, 0]`)
- 150 LEDs: ~900 chars (hex) vs ~2.2KB (RGB arrays)

### Brightness & Direction Handling

**Brightness (Applied to Hex Colors):**
```typescript
const brightness = device.brightness / 255;  // 0.0 - 1.0
const newR = Math.round(r * brightness).toString(16).padStart(2, '0');
```

**Reverse Direction (Applied Before Brightness):**
```typescript
if (device.reverseDirection) {
  ledColors = [...ledColors].reverse();
}
```

### Error Handling

**Network Errors:**
- `TypeError`: CORS or network connectivity issue
- `DOMException`: Timeout or request aborted
- `HTTP Status`: Non-OK response from WLED device

**Graceful Degradation:**
- HTTP failure → Logs warning and tries bridge fallback
- Bridge unavailable → Returns silently (no error state)
- Temporary failures → Doesn't mark device as "error" (allows retry)

### Performance Characteristics

**Expected FPS:**
- HTTP JSON API: 20-40 FPS (request/response overhead)
- WebSocket bridge (UDP): 60-120 FPS (binary protocol, persistent connection)

**Latency:**
- HTTP: ~20-50ms per request
- UDP: ~5-10ms per packet

**Buffer Limits (WLED Firmware):**
- ESP8266: 10KB max packet size (~1,700 LEDs in hex format)
- ESP32: 24KB max packet size (~4,000 LEDs in hex format)

---

## Testing Instructions

### Prerequisites

1. **WLED Device Setup:**
   - WLED controller connected to local network
   - Note the device IP address (e.g., `192.168.1.50`)
   - LED strip/matrix connected and working

2. **Browser Requirements:**
   - Chrome 141+ (or Chrome 138+ with `chrome://flags/#local-network-access-check` enabled)
   - "Local Network Access" permission granted (manual site settings or permission prompt)
   - Development server: `npm run dev` at `http://localhost:5173`

3. **No Bridge Required:**
   - ✅ wled-bridge does NOT need to be running (this is the whole point!)
   - ❌ Do NOT start wled-bridge (we're testing direct communication)

### Test Procedure

**1. Navigate to WLED Direct Test Page:**
```
http://localhost:5173/wled-test
```

**2. Add WLED Device:**
- Click "Add WLED Device" button
- Enter device details:
  - Name: "Test Strip" (or any name)
  - IP: Your WLED device IP (e.g., `192.168.1.50`)
  - LED Count: Your actual LED count (e.g., 90)
- Click enable toggle (should connect and show green WiFi icon)

**3. Test Rainbow Animation:**
- Click "Start" button under "Rainbow Animation"
- **Expected Result:**
  - LEDs should display animated rainbow pattern
  - Pattern should be smooth and fluid
  - No stuttering or dropped frames (visual inspection)
- **Check Browser Console:**
  - Look for: `🔵 Sending [X] LEDs to [device] via HTTP`
  - Look for: `✅ HTTP: Sent [X] LEDs to [device]`
  - FPS counter should show in device row (check for 20+ FPS)

**4. Test Static Pattern (Test Button):**
- Click "Stop" to stop rainbow
- Click "Test" button (flashes white for 3 seconds)
- **Expected Result:**
  - LEDs turn solid white
  - After 3 seconds, LEDs turn off
  - Console shows HTTP send messages

**5. Test Toggle ON/OFF:**
- Ensure rainbow is stopped
- Click enable toggle OFF
  - **Expected:** LEDs turn off via HTTP POST to `/json/state`
- Click enable toggle ON
  - **Expected:** Device reconnects (green WiFi icon)
- Start rainbow again
  - **Expected:** Rainbow resumes with HTTP method

### Success Criteria

✅ **Pass:** Rainbow animation works smoothly (subjective visual test)
✅ **Pass:** FPS counter shows 20+ FPS consistently
✅ **Pass:** No bridge connection warnings in console
✅ **Pass:** Console shows HTTP send messages (not bridge messages)
✅ **Pass:** Test button works (white flash)
✅ **Pass:** Toggle OFF works (LEDs turn off)
✅ **Pass:** Toggle ON works (can resume animation)

❌ **Fail:** Any of the above don't work → Check troubleshooting section

### Performance Benchmarking

**Manual FPS Measurement:**
1. Start Rainbow animation
2. Watch FPS counter in device row
3. Observe console for send frequency
4. Note: FPS = 1000 / (time between sends in ms)

**Expected Results:**
- Good: 20-40 FPS (smooth visual appearance)
- Acceptable: 15-20 FPS (slight choppiness)
- Poor: < 15 FPS (noticeable stuttering)

**Console Log Analysis:**
```
🔵 Sending 90 LEDs to Test Strip via HTTP
✅ HTTP: Sent 90 LEDs to Test Strip
// Time between these logs = latency
```

---

## Troubleshooting

### Issue: "TypeError - likely CORS or network issue"

**Cause:** WLED device not accessible or CORS headers missing

**Solutions:**
1. Verify WLED device IP is correct (ping from terminal)
2. Verify device is on same network as development machine
3. Check WLED firmware version (0.13+ recommended for CORS support)
4. Try accessing `http://[device-ip]/json/info` in browser directly

### Issue: "DOMException - likely timeout or abort"

**Cause:** WLED device slow to respond or network congestion

**Solutions:**
1. Increase timeout in `sendLEDDataHTTP()` (line 289: change 3000 to 5000)
2. Reduce LED count in device settings (fewer LEDs = smaller payload)
3. Check WiFi signal strength to WLED device
4. Restart WLED device (power cycle)

### Issue: "Local Network Access blocked"

**Cause:** Chrome Private Network Access restriction

**Solutions:**
1. **Automatic (Chrome 141+):** Permission prompt should appear - click "Allow"
2. **Manual:** Navigate to `chrome://settings/content/siteDetails?site=http://localhost:5173`
3. Find "Local Network Access" permission
4. Set to "Allow"
5. Reload page

### Issue: FPS < 15 (Too Slow)

**Cause:** HTTP overhead too high for your LED count / network latency

**Solutions:**
1. Reduce LED count (test with 30-60 LEDs first)
2. Implement Story 22.3 (WebSocket) for better performance
3. Check network congestion (other devices using bandwidth)
4. Use wled-bridge fallback (faster UDP protocol)

### Issue: Rainbow doesn't start (no console messages)

**Cause:** Device not connected or not enabled

**Solutions:**
1. Check device connection status (green WiFi icon)
2. Verify device is enabled (toggle should be ON)
3. Check browser console for early return messages
4. Re-test connection (toggle device OFF then ON)

### Issue: "WebSocket bridge not available" warnings

**Cause:** HTTP method is failing and trying bridge fallback

**Solutions:**
1. This is expected if HTTP fails (graceful degradation)
2. Debug HTTP failure first (see CORS/timeout issues above)
3. If HTTP is working, you should NOT see bridge warnings
4. If you DO see bridge warnings, HTTP method is failing

---

## Code References

**Modified Files:**
- `src/components/WLED/WLEDDeviceManager.tsx` (lines 240-390)
  - New: `sendLEDDataHTTP()` method
  - Updated: `sendLEDData()` method (HTTP-first with bridge fallback)
- `src/components/WLEDExperiment/WLEDDirectTest.tsx` (lines 129-147, 188-231)
  - Updated: Info card and technical notes

**Key Code Sections:**
- HTTP POST implementation: WLEDDeviceManager.tsx:284-290
- Brightness adjustment: WLEDDeviceManager.tsx:257-269
- Error handling: WLEDDeviceManager.tsx:307-322
- HTTP-first fallback: WLEDDeviceManager.tsx:333-340

---

## Browser Compatibility

**Chrome / Edge:**
- ✅ Chrome 141+ (Local Network Access enabled by default)
- ✅ Chrome 138-140 (enable via `chrome://flags/#local-network-access-check`)
- ✅ Edge (Chromium-based, same as Chrome)

**Firefox:**
- ⚠️ Mixed Content blocking may differ
- ⚠️ No "Local Network Access" permission system
- ❓ Untested (needs validation)

**Safari:**
- ⚠️ Different security model for local network
- ❓ Untested (needs validation)

**Development (localhost:5173):**
- ✅ All browsers (HTTP→HTTP, no mixed content)

**Production (HTTPS):**
- ❌ Mixed Content blocks HTTPS→HTTP requests
- ⚠️ Requires Chrome Local Network Access permission
- ⚠️ User must grant permission manually

---

## Performance Results (To Be Filled After Testing)

**Test Configuration:**
- LED Count: ___
- WLED Device: ___ (ESP8266 / ESP32)
- Firmware Version: ___
- Network: ___ (WiFi / Ethernet)

**HTTP JSON API Results:**
- FPS: ___ (observed from counter)
- Latency: ___ ms (time between send/confirm logs)
- Dropped Frames: ___ (visual observation)
- Smoothness: ___ (Excellent / Good / Fair / Poor)

**Comparison to UDP Bridge (if tested):**
- HTTP FPS: ___
- UDP FPS: ___
- Performance Delta: ___ %

---

## Next Steps

**If HTTP Performance is Good (20+ FPS, smooth visuals):**
- ✅ Mark Story 22.2 as complete
- ✅ Update Epic 6 with findings (direct communication viable)
- ⏭️ Skip Story 22.3 (WebSocket not needed for acceptable performance)
- 🎯 Proceed with Epic 6 Capacitor native app planning

**If HTTP Performance is Poor (< 20 FPS, choppy visuals):**
- ✅ Mark Story 22.2 as complete (HTTP implementation done)
- ✅ Document HTTP performance limitations
- ⏭️ Proceed with Story 22.3 (WebSocket implementation for better performance)
- 🎯 Compare WebSocket vs HTTP performance

**Epic 22 Completion:**
- Update `/docs/epics/epic-22-wled-direct-browser-communication.md` with completion status
- Add performance benchmarks to research document
- Update Epic 6 blocker status (can direct communication solve HTTPS→HTTP issue?)

---

## Definition of Done

- [x] `sendLEDDataHTTP()` method implemented in WLEDDeviceManager
- [x] HTTP JSON API format correct (hex colors, segment "i" property)
- [x] Brightness and reverse direction applied correctly
- [x] Error handling for CORS, timeout, network failures
- [x] HTTP-first with bridge fallback (no breaking changes)
- [x] Console logging for debugging (HTTP send/confirm messages)
- [x] UI updated with Story 22.2 status and technical notes
- [ ] **TESTING REQUIRED:** Rainbow animation tested with physical WLED device
- [ ] **TESTING REQUIRED:** FPS performance measured and documented
- [ ] **TESTING REQUIRED:** Browser compatibility validated (Chrome 141+)
- [ ] **TESTING REQUIRED:** Test button and toggle ON/OFF verified
- [ ] **TESTING REQUIRED:** No regressions in existing WLED features

**Ready for User Testing:** ✅ Implementation complete, awaiting physical device testing

---

## References

- **Investigation:** `/docs/research/wled-direct-communication-protocols-investigation.md`
- **Epic:** `/docs/epics/epic-22-wled-direct-browser-communication.md`
- **WLED JSON API Docs:** https://kno.wled.ge/interfaces/json-api/
- **Code:** `src/components/WLED/WLEDDeviceManager.tsx:240-390`
