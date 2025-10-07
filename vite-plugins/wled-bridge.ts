import { Plugin } from 'vite';
import { WebSocketServer } from 'ws';
import { createSocket } from 'dgram';
import { createServer } from 'net';

const WLED_UDP_PORT = 21324;

function findAvailablePort(startPort: number = 21325): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(startPort, () => {
      const port = (server.address() as any)?.port;
      server.close(() => resolve(port));
    });
    server.on('error', () => {
      findAvailablePort(startPort + 1).then(resolve).catch(reject);
    });
  });
}

export function wledBridgePlugin(): Plugin {
  let wss: WebSocketServer | null = null;
  let udpClient: any = null;
  let bridgePort: number;

  return {
    name: 'wled-bridge',
    async configureServer() {
      // Find available port
      bridgePort = await findAvailablePort();

      // Create WebSocket server
      wss = new WebSocketServer({ port: bridgePort });

      // Create UDP client
      udpClient = createSocket('udp4');

      console.log(`🌉 WLED WebSocket Bridge started on port ${bridgePort}`);
      console.log(`📡 Forwarding to WLED devices on UDP port ${WLED_UDP_PORT}`);

      wss.on('connection', (ws) => {
        console.log('🔌 Browser connected to WLED bridge');

        ws.on('message', (message) => {
          try {
            const data = JSON.parse(message.toString());
            const { ipAddress, ledData } = data;

            if (!ipAddress || !Array.isArray(ledData)) {
              console.error('❌ Invalid bridge message format. Expected: { ipAddress, ledData }');
              ws.send(JSON.stringify({ success: false, error: 'Invalid format' }));
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
            udpClient.send(packet, WLED_UDP_PORT, ipAddress, (error: Error | null) => {
              if (error) {
                console.error(`❌ UDP send failed to ${ipAddress}:`, error.message);
                ws.send(JSON.stringify({ success: false, error: error.message }));
              } else {
                console.log(`✅ Bridge sent ${ledData.length} LEDs to ${ipAddress}`);
                ws.send(JSON.stringify({ success: true }));
              }
            });

          } catch (error: any) {
            console.error('❌ Bridge message parsing error:', error.message);
            ws.send(JSON.stringify({ success: false, error: 'Invalid JSON' }));
          }
        });

        ws.on('close', () => {
          console.log('🔌 Browser disconnected from WLED bridge');
        });

        ws.on('error', (error) => {
          console.error('❌ WebSocket error:', error.message);
        });
      });

      wss.on('error', (error) => {
        console.error('❌ WebSocket server error:', error.message);
      });
    },

    buildEnd() {
      // Clean up when Vite stops
      if (wss) {
        console.log('🛑 Shutting down WLED WebSocket bridge...');
        wss.close();
      }
      if (udpClient) {
        udpClient.close();
      }
    }
  };
}