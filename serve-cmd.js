const http = require("http");
const os   = require("http");
const osM  = require("os");
const { execSync } = require("child_process");

function getLocalIP() {
  for (const ifaces of Object.values(osM.networkInterfaces())) {
    for (const i of ifaces) {
      if (i.family === "IPv4" && !i.internal && !i.address.startsWith("169.254") && !i.address.startsWith("172."))
        return i.address;
    }
  }
  return "localhost";
}

const PORT = 9997;
const IP   = getLocalIP();
const URL  = `http://${IP}:${PORT}`;

const HTML = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Termux Commands</title>
<style>
  body { background:#050708; color:#7ab8d0; font-family:monospace; padding:20px; }
  h2   { font-size:12px; letter-spacing:.2em; color:#2a6080; margin-bottom:20px; }
  .cmd {
    background:#080e16; border:1px solid #1a6080; border-radius:6px;
    padding:14px; margin-bottom:14px; cursor:pointer; position:relative;
  }
  .cmd pre { font-size:13px; color:#9ab8c8; white-space:pre-wrap; word-break:break-all; margin:0; }
  .label { font-size:9px; color:#2a4858; letter-spacing:.2em; margin-bottom:6px; }
  .copied { font-size:9px; color:#00c060; position:absolute; top:8px; right:10px; display:none; }
  .note { font-size:10px; color:#1a4858; margin-top:6px; }
</style>
</head><body>
<h2>— TERMUX SETUP COMMANDS —</h2>
<p class="note" style="margin-bottom:16px">Tap any block to copy → paste in Termux</p>

<div class="cmd" onclick="copy(this)">
  <div class="label">STEP 1 — START SSH + SET PASSWORD</div>
  <pre>sshd && passwd</pre>
  <span class="copied">✓ COPIED</span>
</div>

<div class="cmd" onclick="copy(this)">
  <div class="label">STEP 2 — GET YOUR IPs</div>
  <pre>ip addr show wlan0 | grep 'inet ' ; ip addr show tailscale0 2>/dev/null | grep 'inet '</pre>
  <span class="copied">✓ COPIED</span>
</div>

<div class="cmd" onclick="copy(this)">
  <div class="label">STEP 3 — START CLAUDE PHONE SERVER</div>
  <pre>cd ~/claudephone && npm start</pre>
  <span class="copied">✓ COPIED</span>
</div>

<p class="note">After running step 2, send the IPs + password to Claude on PC.</p>

<script>
function copy(el) {
  const text = el.querySelector('pre').textContent;
  navigator.clipboard.writeText(text).then(() => {
    const c = el.querySelector('.copied');
    c.style.display = 'block';
    setTimeout(() => c.style.display = 'none', 1500);
  });
}
</script>
</body></html>`;

const server = require("http").createServer((req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(HTML);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`\n  Serving commands at: ${URL}\n`);
  try {
    require.resolve("qrcode-terminal");
  } catch {
    execSync("npm install qrcode-terminal", { cwd: __dirname, stdio: "ignore" });
  }
  require("qrcode-terminal").generate(URL, { small: true }, qr => {
    console.log(qr);
    console.log(`  Scan → tap commands → paste in Termux\n`);
  });
});
