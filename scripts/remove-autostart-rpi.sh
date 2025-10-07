#!/bin/bash
# Remove Raspberry Pi autostart systemd service

echo "Removing Audiolux Jam autostart from Raspberry Pi..."
echo ""

SERVICE_FILE="/etc/systemd/system/audiolux-jam.service"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run with sudo:"
    echo "  sudo bash scripts/remove-autostart-rpi.sh"
    exit 1
fi

if [ -f "$SERVICE_FILE" ]; then
    # Stop the service if running
    systemctl stop audiolux-jam.service 2>/dev/null

    # Disable the service
    systemctl disable audiolux-jam.service 2>/dev/null

    # Remove the service file
    rm "$SERVICE_FILE"

    # Reload systemd
    systemctl daemon-reload

    echo "✓ Autostart service removed successfully!"
    echo ""
    echo "The Audiolux Jam server will no longer start automatically on boot."
else
    echo "No autostart service found."
    echo ""
    echo "Location checked: $SERVICE_FILE"
fi

echo ""
