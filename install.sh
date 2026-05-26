#!/data/data/com.termux/files/usr/bin/bash
# Run this once on the Poco X3 Pro inside Termux

echo "=== Claude Phone install ==="

# Core packages
pkg update -y
pkg install -y nodejs npm git python make clang

# Clone repo
cd ~
git clone https://github.com/YOUR_USERNAME/claude-phone.git
cd claude-phone

# Install dependencies (node-pty needs native compile)
npm install

# Set your API key
echo ""
echo "Paste your Anthropic API key:"
read -r APIKEY
echo "export ANTHROPIC_API_KEY=$APIKEY" >> ~/.bashrc

# Tailscale
echo ""
echo "Install Tailscale Android app from Play Store, sign in, then come back."
echo "Your Tailscale IP will be your remote address."

# Auto-start on boot
mkdir -p ~/.termux/boot
cat > ~/.termux/boot/claude-phone.sh << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash
source ~/.bashrc
termux-wake-lock
cd ~/claude-phone
node server.js >> ~/claude-phone/server.log 2>&1 &
EOF
chmod +x ~/.termux/boot/claude-phone.sh

echo ""
echo "=== Done ==="
echo "Start now:  cd ~/claude-phone && npm start"
echo "Then open:  http://localhost:3000"
