#!/usr/bin/env node

/**
 * WLED WebSocket Bridge
 * Converts WebSocket messages from browser to UDP WARLS packets for WLED devices
 *
 * Usage: node scripts/wled-websocket-bridge.js
 * Browser connects to: ws://localhost:8080
 */

const WebSocket = require('ws');
const dgram = require('dgram');

const WEBSOCKET_PORT = 8080;
const WLED_UDP_PORT = 21324;

// Create WebSocket server
const wss = new WebSocket.Server({ port: WEBSOCKET_PORT });

// Create UDP client
const udpClient = dgram.createSocket('udp4');

console.log(`🌉 WLED WebSocket Bridge started on port ${WEBSOCKET_PORT}`);
console.log(`📡 Forwarding to WLED devices on UDP port ${WLED_UDP_PORT}`);
console.log(`🔗 Connect browser to: ws://localhost:${WEBSOCKET_PORT}`);

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