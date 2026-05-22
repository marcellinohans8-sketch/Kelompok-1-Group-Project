import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import baseUrl from "../constant/baseUrl";
import { useNavigate } from "react-router";
import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";
import { useTheme } from "../context/ThemeContext";

export default function GameAI() {
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const size = 3;

  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [board, setBoard] = useState(
    Array(size)
      .fill()
      .map(() => Array(size).fill(null)),
  );
  const [turn, setTurn] = useState("X");
  const [winner, setWinner] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isReady, setIsReady] = useState(false);

  function showToast(text, color = "#ef4444") {
    Toastify({
      text,
      duration: 2000,
      gravity: "bottom",
      position: "right",
      style: { background: color },
    }).showToast();
  }

  function handleMove(r, c) {
    if (!socketRef.current) return;
    if (!isReady || !roomId) {
      showToast("Game is still connecting...", "#f59e0b");
      return;
    }
    if (winner) return;

    if (turn !== "X") {
      showToast("Please wait for your turn!");
      return;
    }

    if (board[r][c]) {
      showToast("This cell is already filled!", "#f59e0b");
      return;
    }

    const index = r * size + c;
    socketRef.current.emit("makeMove", { roomId, index });
  }

  useEffect(() => {
    const socket = io(baseUrl, {
      transports: ["polling", "websocket"],
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on("startGame", (data) => {
      setBoard(data.board);
      setTurn(data.turn);
      setRoomId(data.roomId);
      setWinner(null);
      setIsReady(true);
    });

    socket.on("updateGame", ({ board, turn, winner }) => {
      setBoard(board);
      setTurn(turn);
      setWinner(winner);

      if (winner) {
        showToast(`Winner: ${winner}`, "#22c55e");
      }
    });

    socket.on("aiThinking", ({ thinking }) => {
      setIsThinking(thinking);
    });

    socket.emit("joinAI", {
      size,
      playerName: localStorage.getItem("playerName") || "Guest",
    });

    return () => {
      setIsReady(false);
      socket.disconnect();
    };
  }, []);

  function resetGame() {
    setIsReady(false);
    socketRef.current.emit("joinAI", {
      size,
      playerName: localStorage.getItem("playerName") || "Guest",
    });
  }

  return (
    <div
      className={`min-h-screen px-4 py-6 transition-colors ${
        isDark
          ? "bg-slate-950 text-slate-100"
          : "bg-[linear-gradient(135deg,#f8fafc_0%,#eef2ff_50%,#ecfeff_100%)] text-slate-950"
      }`}
    >
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl items-center justify-center">
        <main
          className={`grid w-full gap-6 rounded-[2rem] border p-5 shadow-2xl md:grid-cols-[0.9fr_1.1fr] md:p-8 ${
            isDark
              ? "border-slate-800 bg-slate-900/90 shadow-black/30"
              : "border-white/80 bg-white/90 shadow-slate-200"
          }`}
        >
          <section className="flex flex-col justify-between gap-6">
            <div>
              <p
                className={`text-sm font-semibold uppercase tracking-[0.2em] ${
                  isDark ? "text-cyan-300" : "text-cyan-700"
                }`}
              >
                Solo challenge
              </p>
              <h1 className="mt-2 text-4xl font-black">Play vs AI</h1>
              <p className={isDark ? "mt-3 text-slate-400" : "mt-3 text-slate-600"}>
                You play as X. Make the first move and keep the pressure on.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div
                className={`rounded-3xl border p-4 ${
                  isDark
                    ? "border-slate-800 bg-slate-950"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Your mark
                </span>
                <p className="mt-2 text-3xl font-black">X</p>
              </div>
              <div
                className={`rounded-3xl border p-4 ${
                  isDark
                    ? "border-slate-800 bg-slate-950"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Turn
                </span>
                <p className="mt-2 text-3xl font-black">{winner ? "-" : turn}</p>
              </div>
            </div>

            <div
              className={`rounded-3xl border p-4 text-center font-black ${
                winner
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-500"
                  : isThinking
                    ? "border-violet-400/30 bg-violet-400/10 text-violet-500"
                  : !isReady
                    ? "border-amber-400/30 bg-amber-400/10 text-amber-500"
                    : turn === "X"
                      ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-500"
                      : "border-amber-400/30 bg-amber-400/10 text-amber-500"
              }`}
            >
              {winner
                ? `Winner: ${winner}`
                : !isReady
                  ? "Connecting..."
                  : isThinking
                  ? "AI is thinking..."
                  : turn === "X"
                    ? "Your turn"
                    : "AI turn"}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={() =>
                  navigate("/", {
                    state: { message: "Successfully back to home!" },
                  })
                }
                className={`rounded-2xl px-5 py-3 font-black transition ${
                  isDark
                    ? "bg-slate-800 text-white hover:bg-slate-700"
                    : "bg-slate-950 text-white hover:bg-slate-800"
                }`}
              >
                Back to home
              </button>

              {winner && (
                <button
                  onClick={resetGame}
                  className="rounded-2xl bg-cyan-500 px-5 py-3 font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400"
                >
                  Play again
                </button>
              )}
            </div>
          </section>

          <div
            className={`mx-auto grid aspect-square w-full max-w-[420px] grid-cols-3 gap-3 rounded-[2rem] border p-3 ${
              isDark
                ? "border-slate-800 bg-slate-950"
                : "border-slate-200 bg-slate-100"
            }`}
          >
            {board.flat().map((cell, i) => {
              const r = Math.floor(i / size);
              const c = i % size;

              return (
                <button
                  key={i}
                  onClick={() => handleMove(r, c)}
                  disabled={!isReady || winner || isThinking}
                  className={`flex aspect-square items-center justify-center rounded-3xl text-5xl font-black leading-none shadow-sm transition hover:-translate-y-0.5 ${
                    cell === "X"
                      ? "bg-cyan-500 text-slate-950"
                      : cell === "O"
                        ? "bg-violet-500 text-white"
                        : isDark
                          ? "bg-slate-900 hover:bg-slate-800"
                          : "bg-white hover:bg-cyan-50"
                  }`}
                >
                  {cell}
                </button>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
