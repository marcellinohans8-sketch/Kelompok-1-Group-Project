import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useNavigate, useSearchParams } from "react-router";
import baseUrl from "../constant/baseUrl";
import { useTheme } from "../context/ThemeContext";
import Toastify from "toastify-js";

export default function Game() {
  const socketRef = useRef(null);
  const [searchParams] = useSearchParams();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const isDark = theme === "dark";
  const size = 3;
  const urlRoomId = searchParams.get("roomId");

  const [board, setBoard] = useState(
    Array(size)
      .fill()
      .map(() => Array(size).fill(null)),
  );
  const [turn, setTurn] = useState("X");
  const [winner, setWinner] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [playerSymbol, setPlayerSymbol] = useState(null);
  const [isWaiting, setIsWaiting] = useState(true);

  function handleMove(r, c) {
    if (!socketRef.current) return;
    if (winner) return;
    if (turn !== playerSymbol) return;
    if (board[r][c]) return;

    const index = r * size + c;
    socketRef.current.emit("makeMove", { roomId, index });
  }

  useEffect(() => {
    const socket = io(baseUrl, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on("roomCreated", (id) => {
      console.log("Room created:", id);
      setRoomId(id);
      setIsWaiting(true);
      window.history.replaceState(null, "", `/game?roomId=${id}`);
    });

    socket.on("waitingPlayer", () => {
      console.log("Waiting for opponent...");
      setIsWaiting(true);
    });

    socket.on("playerLeft", () => {
      console.log("Opponent left");
      setIsWaiting(true);
      setWinner(null);
    });

    socket.on("roomNotFound", () => {
      console.log("Room not found");
      Toastify({
        text: "Room tidak ditemukan!",
        duration: 2000,
        gravity: "top",
        position: "right",
        style: {
          background: "#ef4444",
        },
      }).showToast();

      navigate("/");
    });

    socket.on("roomFull", () => {
      console.log("Room is full");
      Toastify({
        text: "Room sudah penuh!",
        duration: 2000,
        gravity: "top",
        position: "right",
        style: {
          background: "#ef4444",
        },
      }).showToast();

      navigate("/");
    });

    socket.on("alreadyInRoom", () => {
      console.log("Already in this room");
      Toastify({
        text: "Anda sudah di dalam room ini!",
        duration: 2000,
        gravity: "top",
        position: "right",
        style: {
          background: "#ef4444",
        },
      }).showToast();
    });

    socket.on("duplicatePlayerName", () => {
      Toastify({
        text: "Nama pemain sudah dipakai di room ini. Ganti nama dulu!",
        duration: 2500,
        gravity: "top",
        position: "right",
        style: {
          background: "#ef4444",
        },
      }).showToast();

      navigate("/");
    });

    socket.on("startGame", (data) => {
      console.log("Game started with data:", data);
      console.log("My socket ID:", socket.id);
      console.log("All players:", data.players);

      setBoard(data.board);
      setTurn(data.turn);
      setRoomId(data.roomId);
      setWinner(null);
      setIsWaiting(false);

      const mySymbol = data.players[socket.id];
      console.log("My symbol:", mySymbol);
      setPlayerSymbol(mySymbol);
    });

    socket.on("updateGame", ({ board, turn, winner }) => {
      setBoard(board);
      setTurn(turn);
      setWinner(winner);
    });

    socket.on("connect", () => {
      console.log("Connected to server:", socket.id);
      const playerName = localStorage.getItem("playerName") || "Guest";

      setTimeout(() => {
        if (urlRoomId) {
          console.log("Joining room:", urlRoomId);
          socket.emit("joinRoom", { roomId: urlRoomId, playerName });
        } else {
          console.log("Creating new room");
          socket.emit("createRoom", { size, playerName });
        }
      }, 100);
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
    });

    return () => {
      socket.disconnect();
    };
  }, [navigate, urlRoomId, size]);

  function copyRoomId() {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    Toastify({
      text: "Room ID copied to clipboard!",
      duration: 2500,
      close: true,
      gravity: "top",
      position: "right",
      stopOnFocus: true,
      style: {
        background: "#06b6d4",
        color: "#0f172a",
        fontWeight: "800",
      },
    }).showToast();
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
                Multiplayer
              </p>
              <h1 className="mt-2 text-4xl font-black">Room Battle</h1>
              <p className={isDark ? "mt-3 text-slate-400" : "mt-3 text-slate-600"}>
                Share the room code and wait for your opponent to join.
              </p>
            </div>

            <div className="grid gap-3">
              {roomId && (
                <div
                  className={`rounded-3xl border p-4 ${
                    isDark
                      ? "border-slate-800 bg-slate-950"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Room ID
                  </span>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <b className="truncate text-lg">{roomId}</b>
                    <button
                      onClick={copyRoomId}
                      className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-cyan-400"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}

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
                  <p className="mt-2 text-3xl font-black">{playerSymbol || "-"}</p>
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
            </div>

            <div
              className={`rounded-3xl border p-4 text-center font-black ${
                isWaiting
                  ? "border-amber-400/30 bg-amber-400/10 text-amber-500"
                  : winner
                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-500"
                    : "border-cyan-400/30 bg-cyan-400/10 text-cyan-500"
              }`}
            >
              {isWaiting
                ? "Waiting for opponent..."
                : winner
                  ? `Winner: ${winner}`
                  : turn === playerSymbol
                    ? "Your turn"
                    : "Opponent turn"}
            </div>

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
          </section>

          <div
            className={`mx-auto grid aspect-square w-full max-w-[420px] grid-cols-3 gap-3 rounded-[2rem] border p-3 ${
              isDark
                ? "border-slate-800 bg-slate-950"
                : "border-slate-200 bg-slate-100"
            } ${isWaiting ? "opacity-50" : ""}`}
          >
            {board.flat().map((cell, i) => {
              const r = Math.floor(i / size);
              const c = i % size;

              return (
                <button
                  key={i}
                  onClick={() => handleMove(r, c)}
                  disabled={isWaiting || !!cell || winner || turn !== playerSymbol}
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
