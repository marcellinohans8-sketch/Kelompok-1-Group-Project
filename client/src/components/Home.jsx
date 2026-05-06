import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import Toastify from "toastify-js";
import baseUrl from "../constant/baseUrl";
import heroImage from "../assets/hero.png";

export default function Home() {
  const navigate = useNavigate();
  const [roomInput, setRoomInput] = useState("");
  const [playerName, setPlayerName] = useState(
    () =>
      localStorage.getItem("playerName") ||
      `Player ${Math.floor(1000 + Math.random() * 9000)}`,
  );
  const [leaderboard, setLeaderboard] = useState([]);
  const [matches, setMatches] = useState([]);
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === "dark";
  const totalMatches = matches.length;
  const topPlayer = leaderboard[0];

  function formatMatchPlayers(players) {
    const currentName = (playerName.trim() || "Guest").toLowerCase();
    const sortedPlayers = [...players].sort((a, b) => {
      const aIsCurrent = a.name.toLowerCase() === currentName;
      const bIsCurrent = b.name.toLowerCase() === currentName;

      if (aIsCurrent === bIsCurrent) return 0;
      return aIsCurrent ? -1 : 1;
    });

    return sortedPlayers
      .map((player) => `${player.name} (${player.symbol})`)
      .join(" vs ");
  }

  async function loadStats() {
    try {
      const [leaderboardRes, matchesRes] = await Promise.all([
        fetch(`${baseUrl}/leaderboard`),
        fetch(`${baseUrl}/matches`),
      ]);

      setLeaderboard(await leaderboardRes.json());
      setMatches(await matchesRes.json());
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  }

  useEffect(() => {
    localStorage.setItem("playerName", playerName.trim() || "Guest");
  }, [playerName]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStats();
  }, []);

  function savePlayerName() {
    const savedName = playerName.trim() || "Guest";
    localStorage.setItem("playerName", savedName);
    return savedName;
  }

  function navigateToGame(path) {
    savePlayerName();
    navigate(path);
  }

  const handleJoinRoom = () => {
    const roomId = roomInput.trim();

    if (!roomId) {
      Toastify({
        text: "Room ID tidak boleh kosong!",
        duration: 2000,
        gravity: "top",
        position: "right",
        style: {
          background: "#ef4444",
        },
      }).showToast();
      return;
    }

    savePlayerName();
    navigate(`/game?roomId=${encodeURIComponent(roomId)}`);
  };

  return (
    <div
      className={`min-h-screen px-4 py-6 transition-colors sm:px-6 lg:px-8 ${
        isDark
          ? "bg-slate-950 text-slate-100"
          : "bg-[linear-gradient(135deg,#f8fafc_0%,#eef2ff_50%,#ecfeff_100%)] text-slate-950"
      }`}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p
              className={`text-sm font-semibold uppercase tracking-[0.2em] ${
                isDark ? "text-cyan-300" : "text-cyan-700"
              }`}
            >
              Real-time board game
            </p>
            <h1 className="mt-2 text-4xl font-black sm:text-5xl">
              Tic Tac Toe Arena
            </h1>
          </div>

          <button
            onClick={toggleTheme}
            className={`w-fit rounded-full border px-4 py-2 text-sm font-bold shadow-sm transition ${
              isDark
                ? "border-slate-700 bg-slate-900 text-slate-100 hover:border-cyan-400"
                : "border-white/80 bg-white/80 text-slate-800 hover:border-cyan-300"
            }`}
          >
            {isDark ? "Light mode" : "Dark mode"}
          </button>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(320px,430px)_1fr]">
        <div
          className={`h-fit overflow-hidden rounded-[2rem] border shadow-2xl transition ${
            isDark
              ? "border-slate-800 bg-slate-900/90 shadow-black/30"
              : "border-white/80 bg-white/90 shadow-slate-200"
          }`}
        >
          <div className="relative h-44 overflow-hidden">
            <img
              src={heroImage}
              alt="Tic Tac Toe"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-5 left-6 right-6">
              <p className="text-sm font-semibold text-cyan-200">Ready?</p>
              <h2 className="text-3xl font-black text-white">Choose a match</h2>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <label className="mb-2 block text-sm font-bold">Player name</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className={`mb-5 w-full rounded-2xl border px-4 py-3 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/20 ${
                isDark
                  ? "border-slate-700 bg-slate-950 text-white placeholder-slate-500"
                  : "border-slate-200 bg-white text-slate-950"
              }`}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => navigateToGame("/game-ai")}
                className="rounded-2xl bg-cyan-500 px-4 py-3 font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:bg-cyan-400"
              >
                Play vs AI
              </button>

              <button
                onClick={() => navigateToGame("/game")}
                className="rounded-2xl bg-emerald-500 px-4 py-3 font-black text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-400"
              >
                Create room
              </button>
            </div>

            <div
              className={`mt-6 rounded-3xl border p-4 ${
                isDark
                  ? "border-slate-800 bg-slate-950"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <label className="mb-2 block text-sm font-bold">Join room</label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  placeholder="Enter Room ID"
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value)}
                  className={`min-w-0 flex-1 rounded-2xl border px-4 py-3 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-400/20 ${
                    isDark
                      ? "border-slate-700 bg-slate-900 text-white placeholder-slate-500"
                      : "border-slate-200 bg-white text-slate-950"
                  }`}
                />

                <button
                  onClick={handleJoinRoom}
                  className="rounded-2xl bg-violet-500 px-5 py-3 font-black text-white shadow-lg shadow-violet-500/20 transition hover:-translate-y-0.5 hover:bg-violet-400"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Matches", totalMatches || 0],
              ["Top player", topPlayer?.name || "-"],
              ["Top points", topPlayer?.points ?? 0],
            ].map(([label, value]) => (
              <div
                key={label}
                className={`rounded-3xl border p-5 shadow-lg ${
                  isDark
                    ? "border-slate-800 bg-slate-900/80"
                    : "border-white/80 bg-white/90"
                }`}
              >
                <p
                  className={`text-xs font-bold uppercase tracking-[0.16em] ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {label}
                </p>
                <p className="mt-2 truncate text-2xl font-black">{value}</p>
              </div>
            ))}
          </div>

          <section
            className={`rounded-3xl border p-5 shadow-xl ${
              isDark
                ? "border-slate-800 bg-slate-900/90"
                : "border-white/80 bg-white/90"
            }`}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-black">Leaderboard</h2>
              <button
                onClick={loadStats}
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                  isDark
                    ? "bg-slate-800 text-slate-100 hover:bg-slate-700"
                    : "bg-slate-950 text-white hover:bg-slate-800"
                }`}
              >
                Refresh
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className={isDark ? "text-slate-400" : "text-slate-500"}>
                  <tr>
                    <th className="py-3">Player</th>
                    <th className="py-2 text-center">P</th>
                    <th className="py-2 text-center">W</th>
                    <th className="py-2 text-center">D</th>
                    <th className="py-2 text-center">L</th>
                    <th className="py-2 text-center">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.length === 0 ? (
                    <tr>
                      <td className="py-6 text-center text-slate-500" colSpan="6">
                        Belum ada match selesai.
                      </td>
                    </tr>
                  ) : (
                    leaderboard.map((player, index) => (
                      <tr
                        key={player.name}
                        className={isDark ? "border-t border-slate-800" : "border-t border-slate-100"}
                      >
                        <td className="py-3 font-bold">
                          <span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500/15 text-xs text-cyan-500">
                            {index + 1}
                          </span>
                          {player.name}
                        </td>
                        <td className="py-2 text-center">{player.played}</td>
                        <td className="py-2 text-center">{player.wins}</td>
                        <td className="py-2 text-center">{player.draws}</td>
                        <td className="py-2 text-center">{player.losses}</td>
                        <td className="py-2 text-center font-bold">
                          {player.points}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section
            className={`rounded-3xl border p-5 shadow-xl ${
              isDark
                ? "border-slate-800 bg-slate-900/90"
                : "border-white/80 bg-white/90"
            }`}
          >
            <h2 className="mb-4 text-xl font-black">Match History</h2>

            <div className="grid gap-3">
              {matches.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                  Belum ada match history.
                </p>
              ) : (
                matches.slice(0, 8).map((match) => (
                  <article
                    key={match.id}
                    className={`rounded-2xl border p-4 text-sm transition hover:-translate-y-0.5 ${
                      isDark
                        ? "border-slate-800 bg-slate-950/60"
                        : "border-slate-100 bg-slate-50"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-black text-emerald-500">
                        {match.mode === "ai" ? "VS AI" : "Multiplayer"}
                      </span>
                      <span className={isDark ? "text-slate-400" : "text-slate-500"}>
                        {new Date(match.playedAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-3 font-semibold">{formatMatchPlayers(match.players)}</p>
                    <p className="mt-1 font-semibold">
                      Result:{" "}
                      {match.winner === "draw"
                        ? "Draw"
                        : `${match.winnerName} menang`}
                    </p>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
        </div>
      </div>
    </div>
  );
}
