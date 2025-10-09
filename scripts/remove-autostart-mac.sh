#!/bin/bash
# Remove macOS autostart Launch Agent

echo "Removing Audiolux Jam autostart from macOS..."
echo ""

LAUNCH_AGENT_DIR="$HOME/Library/LaunchAgents"
PLIST_FILE="$LAUNCH_AGENT_DIR/com.audiolux.jam.plist"

if [ -f "$PLIST_FILE" ]; then
    # Unload the Launch Agent
    launchctl unload "$PLIST_FILE" 2>/dev/null

    # Remove the plist file
    rm "$PLIST_FILE"

    echo "✓ Autostart Launch Agent removed successfully!"
    echo ""
    echo "The Audiolux Jam server will no longer start automatically on login."
else
    echo "No autostart Launch Agent found."
    echo ""
    echo "Location checked: $PLIST_FILE"
fi

echo ""
