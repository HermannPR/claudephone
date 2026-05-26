#!/data/data/com.termux/files/usr/bin/bash
# Run on Poco X3 Pro in Termux.
# Sets up SSH server, prints connection info for remote access.

set -e

echo ""
echo "=== Claude Phone — SSH Setup ==="
echo ""

# Install SSH
pkg install -y openssh 2>/dev/null

# Set a password for SSH auth
echo "Set a password for SSH login (you'll give this to Claude):"
passwd

# Start SSH daemon
pkill sshd 2>/dev/null || true
sshd

# Get IPs
LOCAL_IP=$(ip addr show wlan0 2>/dev/null | grep 'inet ' | awk '{print $2}' | cut -d/ -f1)
TAILSCALE_IP=$(ip addr show tailscale0 2>/dev/null | grep 'inet ' | awk '{print $2}' | cut -d/ -f1)

# Termux SSH port is always 8022
PORT=8022
USER=$(whoami)

echo ""
echo "============================================"
echo "  COPY THIS AND PASTE TO CLAUDE:"
echo "============================================"
echo ""
echo "SSH_USER=$USER"
echo "SSH_PORT=$PORT"
echo "LOCAL_IP=${LOCAL_IP:-not-found}"
echo "TAILSCALE_IP=${TAILSCALE_IP:-not-installed-yet}"
echo ""
echo "Local command:     ssh $USER@${LOCAL_IP:-???} -p $PORT"
echo "Tailscale command: ssh $USER@${TAILSCALE_IP:-???} -p $PORT"
echo ""
echo "============================================"
echo ""
echo "Note: Tailscale IP only shows if Tailscale app is"
echo "already installed and signed in on this phone."
echo ""

# Make sshd start on boot
mkdir -p ~/.termux/boot
cat > ~/.termux/boot/sshd.sh << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash
sshd
EOF
chmod +x ~/.termux/boot/sshd.sh

echo "SSH will auto-start on every reboot."
echo ""
