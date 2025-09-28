# WLED WebSocket Bridge

## The Problem
Web browsers cannot send UDP packets directly due to security restrictions. WLED devices use UDP WARLS protocol (port 21324) for real-time LED control, so we need a bridge to convert WebSocket messages to UDP.

## Solutions Available

### Option 1: WebSocket Bridge (Recommended for UDP WARLS)
**Install Node.js dependencies:**
```bash
cd Centaurus-Drum-Machine
npm install ws
```

**Start the bridge:**
```bash
node scripts/wled-websocket-bridge.js
```

**Expected output:**
```
🌉 WLED WebSocket Bridge started on port 8080
📡 Forwarding to WLED devices on UDP port 21324
🔗 Connect browser to: ws://localhost:8080
```

**In the LED Strip Manager:**
1. Set protocol to "UDP WARLS"
2. The app will auto-connect to WebSocket bridge
3. UDP packets will be sent through the bridge

### Option 2: HTTP JSON API (Fallback)
**In the LED Strip Manager:**
1. Set protocol to "HTTP JSON"
2. Works directly from browser
3. May have limited individual LED control

## Testing Steps

1. **Start the bridge** (for UDP option):
   ```bash
   node scripts/wled-websocket-bridge.js
   ```

2. **Configure your LED strip:**
   - IP: 192.168.8.158 (already configured)
   - LED Count: 60
   - Protocol: "UDP WARLS" (recommended) or "HTTP JSON"

3. **Test connection:**
   - Click "Test" button → Should see rainbow flow
   - Check browser console for debug info
   - Check bridge console for UDP packets

4. **Test sequencer integration:**
   - Enable LED checkbox in sequencer
   - Set patterns on lane 0 (C note)
   - Press play → LEDs should show step patterns

## Troubleshooting

**Bridge not connecting:**
- Make sure Node.js is installed
- Install ws package: `npm install ws`
- Check port 8080 is not in use

**WLED not responding:**
- Verify IP address is correct
- Check WLED device is on same network
- Try HTTP protocol as fallback

**No LEDs lighting up:**
- Check browser console for errors
- Verify LED count setting matches your strip
- Test with simple rainbow pattern first

## Protocol Comparison

| Feature | UDP WARLS | HTTP JSON |
|---------|-----------|-----------|
| Individual LED Control | ✅ Full | ⚠️ Limited |
| Performance | ✅ Fast | ⚠️ Slower |
| Browser Support | ❌ Needs Bridge | ✅ Direct |
| Real-time Updates | ✅ Excellent | ⚠️ Good |
| Setup Complexity | ⚠️ Medium | ✅ Easy |