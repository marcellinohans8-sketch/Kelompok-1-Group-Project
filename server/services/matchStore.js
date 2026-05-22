const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "matches.json");

const leaderboard = {};
const matchHistory = [];

loadData();

function ensurePlayer(name) {
  const playerName = normalizeName(name);

  if (!leaderboard[playerName]) {
    leaderboard[playerName] = {
      name: playerName,
      played: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      points: 0,
    };
  }

  return leaderboard[playerName];
}

function normalizeName(name) {
  const value = String(name || "").trim();
  return value || "Guest";
}

function recordMatch({ mode, roomId, players, winner, board }) {
  const playerList = players.map((player) => ({
    ...player,
    name: normalizeName(player.name),
  }));

  const winnerPlayer =
    winner === "draw"
      ? null
      : playerList.find((player) => player.symbol === winner) || null;

  if (mode === "multiplayer") {
    for (const player of playerList) {
      if (player.isBot) continue;

      const stats = ensurePlayer(player.name);
      stats.played += 1;

      if (winner === "draw") {
        stats.draws += 1;
        stats.points += 1;
      } else if (winnerPlayer?.name === player.name) {
        stats.wins += 1;
        stats.points += 3;
      } else {
        stats.losses += 1;
      }
    }
  }

  const match = {
    id: `${Date.now()}-${matchHistory.length + 1}`,
    roomId,
    mode,
    players: playerList,
    winner,
    winnerName: winnerPlayer?.name || null,
    board,
    playedAt: new Date().toISOString(),
  };

  matchHistory.unshift(match);

  if (matchHistory.length > 50) {
    matchHistory.length = 50;
  }

  saveData();

  return match;
}

function getLeaderboard() {
  return Object.values(leaderboard).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.name.localeCompare(b.name);
  });
}

function getMatchHistory() {
  return matchHistory;
}

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) return;

    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));

    if (Array.isArray(data.matchHistory)) {
      matchHistory.splice(0, matchHistory.length, ...data.matchHistory);
    }

    if (data.leaderboard && typeof data.leaderboard === "object") {
      Object.assign(leaderboard, data.leaderboard);
    }
  } catch (error) {
    console.error("[MATCH STORE] Failed to load data:", error.message);
  }
}

function saveData() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify({ leaderboard, matchHistory }, null, 2),
    );
  } catch (error) {
    console.error("[MATCH STORE] Failed to save data:", error.message);
  }
}

module.exports = { getLeaderboard, getMatchHistory, recordMatch };
