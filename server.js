const express  = require("express");
const http      = require("http");
const { Server }= require("socket.io");
const pty       = require("node-pty");
const path      = require("path");
const os        = require("os");

const app    = express();
const server = http.createServer(app);
const io     = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

// sessions: Map<id, { id, name, cwd, ptyProcess, clients: Set<socketId>, buffer: string }>
const sessions = new Map();
let counter = 0;

function getLocalIP() {
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const i of ifaces) {
      if (i.family === "IPv4" && !i.internal) return i.address;
    }
  }
  return "localhost";
}

function sessionList() {
  return Array.from(sessions.values()).map(s => ({ id: s.id, name: s.name, cwd: s.cwd }));
}

function createSession(name, cwd) {
  const id   = `s${++counter}`;
  const shell = process.env.SHELL || "bash";
  const env  = { ...process.env, TERM: "xterm-256color", COLORTERM: "truecolor" };

  const ptyProc = pty.spawn(shell, [], {
    name: "xterm-256color",
    cols: 80,
    rows: 24,
    cwd: cwd || os.homedir(),
    env,
  });

  const session = { id, name: name || `Session ${counter}`, cwd: cwd || os.homedir(), ptyProcess: ptyProc, clients: new Set(), buffer: "" };
  sessions.set(id, session);

  // Auto-launch claude after shell init
  setTimeout(() => {
    if (sessions.has(id)) ptyProc.write("claude\r");
  }, 600);

  ptyProc.onData(data => {
    session.buffer += data;
    if (session.buffer.length > 80000) session.buffer = session.buffer.slice(-80000);
    session.clients.forEach(cid => io.to(cid).emit("output", { id, data }));
  });

  ptyProc.onExit(() => {
    sessions.delete(id);
    io.emit("sessions", sessionList());
  });

  return session;
}

io.on("connection", socket => {
  socket.emit("sessions", sessionList());

  socket.on("new_session", ({ name, cwd }) => {
    const s = createSession(name, cwd);
    io.emit("sessions", sessionList());
    socket.emit("created", s.id);
  });

  socket.on("join", sessionId => {
    // Leave all sessions
    sessions.forEach(s => s.clients.delete(socket.id));

    const s = sessions.get(sessionId);
    if (!s) return socket.emit("err", "Session not found");
    s.clients.add(socket.id);
    socket.emit("replay", { id: sessionId, data: s.buffer });
    socket.emit("joined", sessionId);
  });

  socket.on("input", ({ id, data }) => {
    const s = sessions.get(id);
    if (s) s.ptyProcess.write(data);
  });

  socket.on("resize", ({ id, cols, rows }) => {
    const s = sessions.get(id);
    if (s) s.ptyProcess.resize(cols, rows);
  });

  socket.on("kill", id => {
    const s = sessions.get(id);
    if (s) { s.ptyProcess.kill(); sessions.delete(id); }
    io.emit("sessions", sessionList());
  });

  socket.on("disconnect", () => {
    sessions.forEach(s => s.clients.delete(socket.id));
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`\nClaude Phone running`);
  console.log(`  Local  : http://localhost:${PORT}`);
  console.log(`  Network: http://${getLocalIP()}:${PORT}\n`);
});
