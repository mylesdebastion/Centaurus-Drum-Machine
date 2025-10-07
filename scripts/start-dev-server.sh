#!/bin/bash
# Cross-platform dev server startup script for macOS and Linux (including Raspberry Pi)

cd "$(dirname "$0")/.."

echo "Starting Audiolux Jam Server..."
echo ""

# Start the dev server in the background
npm run dev &
SERVER_PID=$!

# Wait for server to be ready
echo "Waiting for server to start..."
sleep 10

echo ""
echo "Select startup mode:"
echo "  1) Home Page"
echo "  2) Jam Mode (default)"
echo "  3) Education Mode"
echo ""
echo -n "Enter selection (1-3) or wait 5 seconds for Jam Mode: "

# Read with timeout
MODE_PATH=""
if read -t 5 -n 1 choice; then
    echo ""
    case $choice in
        1)
            MODE_PATH=""
            echo "Starting in Home Page mode..."
            ;;
        2)
            MODE_PATH="/jam"
            echo "Starting in Jam Mode..."
            ;;
        3)
            MODE_PATH="/education"
            echo "Starting in Education Mode..."
            ;;
        *)
            MODE_PATH="/jam"
            echo "Invalid selection. Starting in Jam Mode (default)..."
            ;;
    esac
else
    echo ""
    MODE_PATH="/jam"
    echo "No selection made. Starting in Jam Mode (default)..."
fi

echo ""

# Open browser in fullscreen based on platform
URL="http://localhost:5173${MODE_PATH}"
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - try Chrome first, fallback to default browser
    if command -v "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" &> /dev/null; then
        open -a "Google Chrome" --args --start-fullscreen "$URL"
    else
        open "$URL"
        echo "Note: Press Cmd+Ctrl+F for fullscreen"
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux / Raspberry Pi - use kiosk mode for true fullscreen
    if command -v chromium-browser &> /dev/null; then
        chromium-browser --start-fullscreen --kiosk "$URL" &
    elif command -v google-chrome &> /dev/null; then
        google-chrome --start-fullscreen --kiosk "$URL" &
    elif command -v xdg-open &> /dev/null; then
        xdg-open "$URL"
        echo "Note: Press F11 for fullscreen"
    else
        echo "Please open $URL in your browser and press F11 for fullscreen"
    fi
fi

echo ""
echo "Server is running and browser opened!"
echo "PID: $SERVER_PID"
echo ""
echo "Press Ctrl+C to stop the server"

# Wait for the background process
wait $SERVER_PID
