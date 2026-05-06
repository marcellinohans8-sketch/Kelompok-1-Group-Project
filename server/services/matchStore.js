const leaderboard = {};
const matchHistory = [];

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

module.exports = { getLeaderboard, getMatchHistory, recordMatch };
