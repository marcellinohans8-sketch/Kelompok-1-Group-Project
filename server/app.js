require("dotenv").config();
const PORT = process.env.PORT || 3001;

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const gameSocket = require("./socket/gameSocket");
const { getLeaderboard, getMatchHistory } = require("./services/matchStore");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://kelompok-1-group-project.vercel.app",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.get("/leaderboard", (req, res) => {
  res.json(getLeaderboard());
});

app.get("/matches", (req, res) => {
  res.json(getMatchHistory());
});

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

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
