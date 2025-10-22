#!/bin/bash

# Workshop Startup Script - Mac/Linux
# Starts WLED WebSocket bridge + Dev server for workshop mode

echo "=========================================="
echo "🎓 CENTAURUS WORKSHOP MODE STARTUP"
echo "=========================================="
echo ""
echo "This script will start:"
echo "  1. WLED WebSocket Bridge (port 8080)"
echo "  2. Vite Dev Server (port 5173)"
echo ""
echo "Opening /isometric route for 6-tube setup"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ ERROR: package.json not found"
    echo "Please run this script from the project root:"
    echo "  cd /path/to/Centaurus-Drum-Machine"
    echo "  ./education/workshop-start.sh"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ ERROR: Node.js not found"
    echo "Please install Node.js from https://nodejs.org"
    exit 1
fi

# Check if npm dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "⚠️  WARNING: node_modules not found"
    echo "Installing dependencies..."
    npm install
fi

echo "=========================================="
echo "Step 1: Starting WLED WebSocket Bridge..."
echo "=========================================="
echo ""

# Start WLED bridge in background
node scripts/wled-websocket-bridge.cjs &
BRIDGE_PID=$!

# Check if bridge started successfully
sleep 2
if ! ps -p $BRIDGE_PID > /dev/null; then
    echo "❌ ERROR: WLED bridge failed to start"
    echo "Check if port 8080 is already in use:"
    echo "  lsof -i :8080"
    exit 1
fi

echo "✅ Bridge running (PID: $BRIDGE_PID)"
echo ""

echo "=========================================="
echo "Step 2: Starting Vite Dev Server..."
echo "=========================================="
echo ""

# Start dev server in background
npm run dev &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Check if server started successfully
if ! ps -p $SERVER_PID > /dev/null; then
    echo "❌ ERROR: Dev server failed to start"
    echo "Killing bridge process..."
    kill $BRIDGE_PID
    exit 1
fi

echo "✅ Server running (PID: $SERVER_PID)"
echo ""

echo "=========================================="
echo "✅ WORKSHOP MODE READY"
echo "=========================================="
echo ""
echo "📱 Open browser to: http://localhost:5173/isometric"
echo ""
echo "🎵 SETUP CHECKLIST:"
echo "  1. Connect laptop to WiFi"
echo "  2. Power on 6 WLED tubes"
echo "  3. Wait 30 seconds for tubes to connect"
echo "  4. Open browser URL above"
echo "  5. Verify 6 tubes show 'Connected' in LEDStripManager"
echo "  6. Click 'Play' to test"
echo ""
echo "🔧 TROUBLESHOOTING:"
echo "  - Workshop config: education/workshop-config.json"
echo "  - Setup guide: docs/workshop/SETUP-GUIDE.md"
echo "  - Emergency backup: docs/workshop/EMERGENCY-BACKUP.md"
echo ""
echo "⚠️  Press Ctrl+C to stop all services"
echo ""

# Try to open browser automatically (Mac)
if command -v open &> /dev/null; then
    echo "🌐 Opening browser..."
    sleep 3
    open "http://localhost:5173/isometric"
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "=========================================="
    echo "🛑 SHUTTING DOWN WORKSHOP MODE"
    echo "=========================================="
    echo ""
    echo "Stopping WLED bridge (PID: $BRIDGE_PID)..."
    kill $BRIDGE_PID 2>/dev/null
    echo "Stopping dev server (PID: $SERVER_PID)..."
    kill $SERVER_PID 2>/dev/null
    echo ""
    echo "✅ All services stopped"
    echo "Thank you for using Centaurus Workshop Mode!"
    echo ""
    exit 0
}

# Register cleanup function
trap cleanup INT TERM

# Keep script running
wait
