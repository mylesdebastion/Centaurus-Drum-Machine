#!/bin/bash
# macOS autostart setup using Launch Agents

echo "Setting up Audiolux Jam to start automatically on macOS boot..."
echo ""

# Get absolute path to the project
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LAUNCH_AGENT_DIR="$HOME/Library/LaunchAgents"
PLIST_FILE="$LAUNCH_AGENT_DIR/com.audiolux.jam.plist"

# Create LaunchAgents directory if it doesn't exist
mkdir -p "$LAUNCH_AGENT_DIR"

# Create the Launch Agent plist
cat > "$PLIST_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.audiolux.jam</string>
    <key>ProgramArguments</key>
    <array>
        <string>$PROJECT_DIR/scripts/start-dev-server.sh</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <false/>
    <key>StandardOutPath</key>
    <string>$HOME/Library/Logs/audiolux-jam.log</string>
    <key>StandardErrorPath</key>
    <string>$HOME/Library/Logs/audiolux-jam-error.log</string>
</dict>
</plist>
EOF

# Load the Launch Agent
launchctl load "$PLIST_FILE"

echo ""
echo "✓ Autostart configured successfully!"
echo ""
echo "The Audiolux Jam server will now start automatically when you log in."
echo ""
echo "Launch Agent: $PLIST_FILE"
echo "Logs: ~/Library/Logs/audiolux-jam.log"
echo ""
echo "To remove autostart:"
echo "  launchctl unload \"$PLIST_FILE\""
echo "  rm \"$PLIST_FILE\""
echo ""
