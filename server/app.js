require("dotenv").config();
const express = require("express");
const http = require("http");
const https = require("https");
const fs = require("fs");
const { Server } = require("socket.io");
const gameSocket = require("./socket/gameSocket");
const { getLeaderboard, getMatchHistory } = require("./services/matchStore");
const cors = require("cors");

const app = express();

// SSL Certificate
const sslOptions = {
  key: fs.readFileSync("/etc/letsencrypt/live/marcellino10.online/privkey.pem"),
  cert: fs.readFileSync("/etc/letsencrypt/live/marcellino10.online/fullchain.pem"),
};

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://kelompok-1-group-project-g4g2.vercel.app",
 "https://kelompok-1-group-project-m9pm.vercel.app",
"https://marcellino10.online",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({ origin: allowedOrigins, credentials: true }));

app.get("/", (req, res) => res.send("Server is running"));
app.get("/leaderboard", (req, res) => res.json(getLeaderboard()));
app.get("/matches", (req, res) => res.json(getMatchHistory()));

// Redirect HTTP ke HTTPS
const httpApp = express();
httpApp.use((req, res) => {
  res.redirect("https://" + req.headers.host + req.url);
});
http.createServer(httpApp).listen(80);

// HTTPS Server + Socket.io
const server = https.createServer(sslOptions, app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  gameSocket(io, socket);
});

server.listen(443, () => console.log("Server running on port 443"));
