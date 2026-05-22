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
const isProduction = process.env.NODE_ENV === "production";
const PORT = process.env.PORT || 3015;
const useLocalSsl =
  isProduction &&
  !process.env.PORT &&
  fs.existsSync("/etc/letsencrypt/live/marcellino10.online/privkey.pem") &&
  fs.existsSync("/etc/letsencrypt/live/marcellino10.online/fullchain.pem");

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://kelompok-1-group-project-g4g2.vercel.app",
  "https://kelompok-1-group-project-m9pm.vercel.app",
  "https://marcellino10.online",
  process.env.CLIENT_URL,
].filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;

  try {
    const { hostname, protocol } = new URL(origin);
    if (
      (hostname === "localhost" || hostname === "127.0.0.1") &&
      (protocol === "http:" || protocol === "https:")
    ) {
      return true;
    }

    return (
      protocol === "https:" &&
      (hostname === "marcellino10.online" ||
        hostname === "www.marcellino10.online" ||
        hostname.endsWith(".vercel.app"))
    );
  } catch {
    return false;
  }
}

const corsOptions = {
  origin(origin, callback) {
    callback(null, isAllowedOrigin(origin));
  },
  credentials: true,
};

app.use(cors(corsOptions));

app.get("/", (req, res) => res.send("Server is running"));
app.get("/leaderboard", (req, res) => res.json(getLeaderboard()));
app.get("/matches", (req, res) => res.json(getMatchHistory()));

let server;

if (useLocalSsl) {
  const sslOptions = {
    key: fs.readFileSync(
      "/etc/letsencrypt/live/marcellino10.online/privkey.pem",
    ),
    cert: fs.readFileSync(
      "/etc/letsencrypt/live/marcellino10.online/fullchain.pem",
    ),
  };

  // Redirect HTTP ke HTTPS
  const httpApp = express();
  httpApp.use((req, res) => {
    res.redirect("https://" + req.headers.host + req.url);
  });
  http.createServer(httpApp).listen(80);

  server = https.createServer(sslOptions, app);
  server.listen(443, () => console.log("Server running on port 443"));
} else {
  server = http.createServer(app);
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

const io = new Server(server, {
  cors: {
    origin(origin, callback) {
      callback(null, isAllowedOrigin(origin));
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  gameSocket(io, socket);
});
