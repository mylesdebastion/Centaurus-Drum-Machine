#!/usr/bin/env node

/**
 * WLED WebSocket Bridge
 * Converts WebSocket messages from browser to UDP WARLS packets for WLED devices
 * Supports both ws:// (insecure) and wss:// (secure) connections
 *
 * Usage: node scripts/wled-websocket-bridge.js
 * Browser connects to:
 *   - ws://localhost:8080 (HTTP pages)
 *   - wss://localhost:8080 (HTTPS pages)
 */

const WebSocket = require('ws');
const dgram = require('dgram');
const https = require('https');
const fs = require('fs');
const path = require('path');

const WEBSOCKET_PORT = 8080;
const WLED_UDP_PORT = 21324;

// Load SSL certificates for secure WebSocket (wss://)
let server;
try {
  const certPath = path.join(__dirname, 'localhost-cert.pem');
  const keyPath = path.join(__dirname, 'localhost-key.pem');

  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    const serverOptions = {
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath),
    };
    server = https.createServer(serverOptions);
    console.log('🔒 SSL certificates loaded - WSS (secure) support enabled');
  } else {
    console.log('⚠️  SSL certificates not found - Only WS (insecure) support available');
    console.log('   Run: cd scripts && openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj "/CN=localhost" -keyout localhost-key.pem -out localhost-cert.pem -days 3650');
  }
} catch (error) {
  console.error('⚠️  Error loading SSL certificates:', error.message);
}

// Create WebSocket server (with or without SSL)
const wss = server
  ? new WebSocket.Server({ server })
  : new WebSocket.Server({ port: WEBSOCKET_PORT });

if (server) {
  server.listen(WEBSOCKET_PORT);
}

// Create UDP client
const udpClient = dgram.createSocket('udp4');

console.log(`🌉 WLED WebSocket Bridge started on port ${WEBSOCKET_PORT}`);
console.log(`📡 Forwarding to WLED devices on UDP port ${WLED_UDP_PORT}`);
if (server) {
  console.log(`🔗 Connect browser to:`);
  console.log(`   - ws://localhost:${WEBSOCKET_PORT} (HTTP pages)`);
  console.log(`   - wss://localhost:${WEBSOCKET_PORT} (HTTPS pages)`);
} else {
  console.log(`🔗 Connect browser to: ws://localhost:${WEBSOCKET_PORT} (insecure only)`);
}

wss.on('connection', (ws) => {
  console.log('🔌 Browser connected');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      const { ipAddress, ledData } = data;

      if (!ipAddress || !Array.isArray(ledData)) {
        console.error('❌ Invalid message format. Expected: { ipAddress, ledData }');
        return;
      }

      // Create WARLS protocol packet: [2, 255, ...rgb_data...]
      const packet = Buffer.alloc(2 + ledData.length * 3);
      packet[0] = 2;   // WARLS protocol identifier
      packet[1] = 255; // Second byte

      // Fill RGB data
      for (let i = 0; i < ledData.length; i++) {
        const offset = 2 + i * 3;
        packet[offset] = ledData[i].r || 0;
        packet[offset + 1] = ledData[i].g || 0;
        packet[offset + 2] = ledData[i].b || 0;
      }

      // Send UDP packet to WLED device
      udpClient.send(packet, WLED_UDP_PORT, ipAddress, (error) => {
        if (error) {
          console.error(`❌ UDP send failed to ${ipAddress}:`, error.message);
          ws.send(JSON.stringify({ success: false, error: error.message }));
        } else {
          console.log(`✅ Sent ${ledData.length} LEDs to ${ipAddress}`);
          ws.send(JSON.stringify({ success: true }));
        }
      });

    } catch (error) {
      console.error('❌ Message parsing error:', error.message);
      ws.send(JSON.stringify({ success: false, error: 'Invalid JSON' }));
    }
  });

  ws.on('close', () => {
    console.log('🔌 Browser disconnected');
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
  });
});

// Handle server shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down WebSocket bridge...');
  udpClient.close();
  wss.close();
  process.exit(0);
});