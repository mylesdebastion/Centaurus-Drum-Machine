/**
 * WLED WebSocket Bridge
 *
 * Bridges WebSocket connections from the browser to UDP WARLS protocol for WLED.
 * This allows pixel-perfect LED control from the browser without CORS issues.
 *
 * Usage:
 *   node scripts/wled-websocket-bridge.js
 *
 * The bridge will listen on ports 21325-21329 for WebSocket connections.
 */

const WebSocket = require('ws');
const dgram = require('dgram');

const PORTS = [21325, 21326, 21327, 21328, 21329];
const WLED_UDP_PORT = 21324; // WLED's default UDP port for WARLS protocol

console.log('🌉 WLED WebSocket Bridge Starting...\n');

// Try to start server on available port
let serverStarted = false;

for (const port of PORTS) {
  try {
    const wss = new WebSocket.Server({ port });

    wss.on('listening', () => {
      console.log(`✅ WebSocket server listening on port ${port}`);
      console.log(`🔗 Browser will connect via: ws://localhost:${port}\n`);
      console.log('📡 Ready to bridge WebSocket → UDP WARLS for WLED devices\n');
      serverStarted = true;
    });

    wss.on('connection', (ws) => {
      console.log('🔌 New WebSocket connection established');

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          const { ipAddress, ledData } = data;

          if (!ipAddress || !ledData || !Array.isArray(ledData)) {
            ws.send(JSON.stringify({
              success: false,
              error: 'Invalid message format. Expected { ipAddress, ledData }'
            }));
            return;
          }

          // Create UDP socket
          const udpSocket = dgram.createSocket('udp4');

          // Build WARLS protocol packet
          // Format: [Protocol, Timeout, First LED index, ...RGB data]
          const packet = Buffer.alloc(2 + ledData.length * 3);
          packet[0] = 0x04; // WARLS protocol (0x04 = DRGB)
          packet[1] = 0x02; // Timeout (2 seconds)

          // Pack RGB data
          let offset = 2;
          for (const led of ledData) {
            packet[offset++] = led.r;
            packet[offset++] = led.g;
            packet[offset++] = led.b;
          }

          // Send UDP packet to WLED
          udpSocket.send(packet, 0, packet.length, WLED_UDP_PORT, ipAddress, (err) => {
            if (err) {
              console.error(`❌ UDP send error to ${ipAddress}:`, err.message);
              ws.send(JSON.stringify({
                success: false,
                error: err.message
              }));
            } else {
              // Success - send confirmation back to browser
              ws.send(JSON.stringify({
                success: true,
                ipAddress,
                ledCount: ledData.length
              }));
            }
            udpSocket.close();
          });

        } catch (error) {
          console.error('❌ Message processing error:', error.message);
          ws.send(JSON.stringify({
            success: false,
            error: error.message
          }));
        }
      });

      ws.on('close', () => {
        console.log('🔌 WebSocket connection closed');
      });

      ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error.message);
      });
    });

    wss.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.log(`⚠️  Port ${port} already in use, trying next port...`);
      } else {
        console.error(`❌ WebSocket server error on port ${port}:`, error.message);
      }
    });

    // If we successfully started, break the loop
    if (serverStarted) break;

  } catch (error) {
    console.error(`❌ Failed to start server on port ${port}:`, error.message);
  }
}

if (!serverStarted) {
  console.error('❌ Could not start WebSocket server on any port');
  process.exit(1);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down WebSocket bridge...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 Shutting down WebSocket bridge...');
  process.exit(0);
});
