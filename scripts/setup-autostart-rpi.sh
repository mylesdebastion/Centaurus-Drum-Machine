#!/bin/bash
# Raspberry Pi autostart setup using systemd

echo "Setting up Audiolux Jam to start automatically on Raspberry Pi boot..."
echo ""

# Get absolute path to the project
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SERVICE_FILE="/etc/systemd/system/audiolux-jam.service"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run with sudo:"
    echo "  sudo bash scripts/setup-autostart-rpi.sh"
    exit 1
fi

# Get the actual user (not root when using sudo)
ACTUAL_USER="${SUDO_USER:-$USER}"

# Create the systemd service file
cat > "$SERVICE_FILE" << EOF
[Unit]
Description=Audiolux Jam Server
After=network.target

[Service]
Type=simple
User=$ACTUAL_USER
WorkingDirectory=$PROJECT_DIR
ExecStart=/bin/bash $PROJECT_DIR/scripts/start-dev-server.sh
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd, enable and start the service
systemctl daemon-reload
systemctl enable audiolux-jam.service

echo ""
echo "✓ Autostart configured successfully!"
echo ""
echo "The Audiolux Jam server will now start automatically on boot."
echo ""
echo "Service file: $SERVICE_FILE"
echo ""
echo "Useful commands:"
echo "  sudo systemctl start audiolux-jam    # Start now"
echo "  sudo systemctl stop audiolux-jam     # Stop service"
echo "  sudo systemctl status audiolux-jam   # Check status"
echo "  sudo journalctl -u audiolux-jam -f   # View logs"
echo "  sudo systemctl disable audiolux-jam  # Disable autostart"
echo ""
