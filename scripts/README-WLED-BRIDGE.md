# WLED WebSocket Bridge

## Overview

The WLED WebSocket Bridge enables browser-based LED control by converting WebSocket messages to UDP WARLS packets. It supports both insecure (`ws://`) and secure (`wss://`) connections, allowing LED control from both HTTP and HTTPS pages.

## Features

- ✅ Dual protocol support: `ws://` and `wss://`
- ✅ Auto-detects SSL certificates for secure connections
- ✅ UDP WARLS protocol for WLED devices
- ✅ Works from localhost and remote HTTPS deployments
- ✅ No server-side rendering - all LED data generated client-side

## Quick Start

### 1. Generate SSL Certificates (First Time Only)

```bash
cd scripts
MSYS_NO_PATHCONV=1 openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj "/CN=localhost" -keyout localhost-key.pem -out localhost-cert.pem -days 3650
```

**Note:** The certificates are valid for 10 years and work for `localhost` only. They're excluded from Git via `.gitignore`.

### 2. Start the Bridge

```bash
node scripts/wled-websocket-bridge.cjs
```

**Output:**
```
🔒 SSL certificates loaded - WSS (secure) support enabled
🌉 WLED WebSocket Bridge started on port 8080
📡 Forwarding to WLED devices on UDP port 21324
🔗 Connect browser to:
   - ws://localhost:8080 (HTTP pages)
   - wss://localhost:8080 (HTTPS pages)
```

### 3. Configure Your WLED Device

In the web app's LED Matrix Manager:
- **IP Address:** `192.168.8.158` (or your WLED device IP)
- **Enable:** Toggle on
- The browser will auto-connect to the bridge

## How It Works

```
┌─────────────┐     WebSocket      ┌──────────────┐     UDP WARLS      ┌──────────┐
│   Browser   │ ──────────────────▶│ Bridge (Node)│ ──────────────────▶│   WLED   │
│ (Client-side)│  ws:// or wss://  │  Port 8080   │   Port 21324       │  Device  │
└─────────────┘                     └──────────────┘                     └──────────┘
```

1. **Browser** generates LED data client-side (no server processing)
2. **WebSocket** sends RGB data to local bridge
3. **Bridge** converts to UDP WARLS packets
4. **WLED** receives and displays on LED strip

## Protocol Auto-Detection

The `LEDMatrixManager` component automatically selects the correct protocol:

- **HTTP pages** (`http://localhost:5173`) → `ws://localhost:8080`
- **HTTPS pages** (`https://jam-dev.audiolux.app`) → `wss://localhost:8080`

## Browser Security

### Self-Signed Certificate Warning

When connecting from HTTPS pages (like Vercel deployments), browsers will show a security warning for the self-signed certificate:

**Chrome/Edge:** "Your connection is not private"
**Firefox:** "Warning: Potential Security Risk Ahead"

**To proceed:**
1. Click "Advanced"
2. Click "Proceed to localhost (unsafe)" or "Accept the Risk and Continue"
3. This is safe for localhost development

### Why WSS is Required

Browsers block insecure WebSocket (`ws://`) connections from secure pages (`https://`) due to [Mixed Content Policy](https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content). WSS solves this by using TLS encryption.

## Troubleshooting

### Bridge Won't Start

**Error:** `EADDRINUSE: address already in use`
- Another process is using port 8080
- Solution: Kill the process or change `WEBSOCKET_PORT` in the script

### SSL Certificates Not Found

**Message:** `⚠️  SSL certificates not found - Only WS (insecure) support available`
- Run the certificate generation command above
- Verify `localhost-cert.pem` and `localhost-key.pem` exist in `scripts/`

### Browser Can't Connect

1. **Check bridge is running:** Look for "🌉 WLED WebSocket Bridge started"
2. **Check browser console:** Look for WebSocket errors
3. **Verify protocol:** HTTPS pages must use `wss://`, HTTP pages use `ws://`
4. **Accept certificate:** Click through the self-signed certificate warning

### LEDs Not Updating

1. **Verify WLED device IP:** Check in LED Matrix Manager settings
2. **Check UDP port:** WLED must be listening on port 21324 (default for WARLS)
3. **Network connectivity:** Ping your WLED device: `ping 192.168.8.158`
4. **Bridge logs:** Look for "✅ Sent X LEDs to ..." messages

## Architecture

### Files

- `scripts/wled-websocket-bridge.cjs` - WebSocket server with SSL support
- `scripts/localhost-cert.pem` - SSL certificate (gitignored)
- `scripts/localhost-key.pem` - SSL private key (gitignored)
- `src/components/LiveAudioVisualizer/LEDMatrixManager.tsx` - Browser client

### Protocol: WARLS (UDP)

```
Byte 0:       2       (Protocol identifier)
Byte 1:       255     (Second byte)
Bytes 2-n:    RGB data (3 bytes per LED: R, G, B)
```

**Example:** 3 LEDs
```
[2, 255, 255, 0, 0, 0, 255, 0, 0, 0, 255]
         └─RED──┘ └─GREEN─┘ └─BLUE──┘
```

## Deployment Scenarios

### Local Development
- App: `http://localhost:5173`
- Bridge: `ws://localhost:8080`
- ✅ Works - no certificate needed

### Vercel Production
- App: `https://jam-dev.audiolux.app`
- Bridge: `wss://localhost:8080`
- ✅ Works - requires SSL certificate and user acceptance

### Remote Server (Not Supported)
- Bridge must run on user's local machine
- WLED devices are typically on local networks only
- No cloud relay needed - all processing is client-side

## Security Notes

- SSL certificates are **self-signed** for localhost only
- Certificates are **not trusted** by browsers (requires user acceptance)
- This is **safe** for local development and personal use
- For production/public use, obtain proper certificates from a CA
- All LED data generation happens **client-side** (no server processing)
- Bridge only forwards pre-generated RGB data to local devices

## Performance

- **Typical throughput:** 60 FPS (16ms per frame)
- **Data size:** ~270 bytes for 90 LEDs
- **Latency:** <10ms (WebSocket + UDP overhead)
- **CPU usage:** Minimal (bridge only routes data)

## Advanced Configuration

### Change Ports

Edit `wled-websocket-bridge.cjs`:

```javascript
const WEBSOCKET_PORT = 8080;  // Browser connection
const WLED_UDP_PORT = 21324;  // WLED device
```

Then update `LEDMatrixManager.tsx` ports array to match.

### Multiple WLED Devices

The bridge supports multiple devices - just specify different IP addresses in the web UI. Each message includes the target IP:

```javascript
{
  ipAddress: "192.168.8.158",
  ledData: [...]
}
```

## Credits

- WARLS protocol: WLED project
- WebSocket bridge: Centaurus Drum Machine
- SSL support: OpenSSL

## License

MIT
