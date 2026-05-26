#!/usr/bin/env node
// Run on Windows: node serve-qr.js
// Shows QR code — phone scans it → downloads setup-ssh.sh directly

const http   = require("http");
const fs     = require("fs");
const path   = require("path");
const os     = require("os");
const { execSync } = require("child_process");

function getLocalIP() {
  // Prefer 192.168.x.x, then 10.x.x.x — skip link-local (169.254) and docker/WSL (172.x)
  const all = [];
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const i of ifaces) {
      if (i.family === "IPv4" && !i.internal && !i.address.startsWith("169.254") && !i.address.startsWith("172.")) {
        all.push(i.address);
      }
    }
  }
  return all.find(a => a.startsWith("192.168.")) || all.find(a => a.startsWith("10.")) || all[0] || "localhost";
}

const PORT   = 9998;
const IP     = getLocalIP();
const URL    = `http://${IP}:${PORT}/setup-ssh.sh`;
const SCRIPT = path.join(__dirname, "setup-ssh.sh");

if (!fs.existsSync(SCRIPT)) {
  console.error("setup-ssh.sh not found in", __dirname);
  process.exit(1);
}

// Serve the file
const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", 'inline; filename="setup-ssh.sh"');
  fs.createReadStream(SCRIPT).pipe(res);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("\n  Serving:", URL);
  console.log("  Phone must be on same WiFi\n");

  // Install qrcode-terminal if missing
  try {
    require.resolve("qrcode-terminal");
  } catch {
    console.log("  Installing qrcode-terminal...");
    execSync("npm install qrcode-terminal", { cwd: __dirname, stdio: "ignore" });
  }

  const qr = require("qrcode-terminal");
  qr.generate(URL, { small: true }, code => {
    console.log(code);
    console.log("  Scan with phone camera → open in Termux browser → run:\n");
    console.log("  bash /sdcard/Download/setup-ssh.sh\n");
    console.log("  Or in Termux directly:\n");
    console.log(`  curl ${URL} | bash\n`);
    console.log("  Ctrl+C when done\n");
  });
});
