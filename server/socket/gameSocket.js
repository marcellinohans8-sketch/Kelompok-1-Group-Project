const { getAIMove, checkWinner } = require("../services/aiService");
const { recordMatch } = require("../services/matchStore");

let rooms = {};
let waitingPlayer = null;
const AI_THINKING_DELAY_MS = 900;

module.exports = (io, socket) => {
  function normalizeName(name) {
    const value = String(name || "").trim();
    return value || "Guest";
  }

  function getRoomPlayers(room) {
    if (room.mode === "ai") {
      return [
        {
          id: room.players[0],
          name: room.playerNames[room.players[0]],
          symbol: "X",
        },
        {
          id: "ai",
          name: "AI",
          symbol: room.aiSymbol,
          isBot: true,
        },
      ];
    }

    return room.players.map((playerId, index) => ({
      id: playerId,
      name: room.playerNames[playerId],
      symbol: index === 0 ? "X" : "O",
    }));
  }

  function finishGame(roomId, room, winner) {
    room.winner = winner;

    if (!room.matchRecorded) {
      room.matchRecorded = true;
      recordMatch({
        mode: room.mode,
        roomId,
        players: getRoomPlayers(room),
        winner,
        board: room.board.map((row) => [...row]),
      });
    }
  }

  function leaveCurrentRooms() {
    for (const roomId in rooms) {
      const room = rooms[roomId];
      if (!room.players.includes(socket.id)) continue;

      socket.leave(roomId);
      room.players = room.players.filter((id) => id !== socket.id);

      if (room.players.length === 1) {
        io.to(roomId).emit("playerLeft");
        io.to(roomId).emit("waitingPlayer");
      }

      if (room.players.length === 0) {
        delete rooms[roomId];
      }
    }

    if (waitingPlayer?.socket.id === socket.id) {
      waitingPlayer = null;
    }
  }

  socket.on("createRoom", ({ size = 3, playerName } = {}) => {
    leaveCurrentRooms();

    const roomId = Math.random().toString(36).substring(7);

    rooms[roomId] = {
      players: [socket.id],
      board: Array(size)
        .fill()
        .map(() => Array(size).fill(null)),
      turn: "X",
      winner: null,
      size,
      mode: "multiplayer",
      playerNames: {
        [socket.id]: normalizeName(playerName),
      },
      matchRecorded: false,
    };

    socket.join(roomId);

    console.log(`Room ${roomId} created by player ${socket.id}`);

    socket.emit("roomCreated", roomId);
    socket.emit("waitingPlayer");
  });

  socket.on("joinRoom", (payload = {}) => {
    const roomId =
      typeof payload === "string" ? payload : String(payload.roomId || "");
    const playerName = typeof payload === "string" ? undefined : payload.playerName;
    const normalizedRoomId = roomId.trim();

    const room = rooms[normalizedRoomId];
    if (!room) {
      socket.emit("roomNotFound");
      return;
    }
    if (room.players.length >= 2) {
      socket.emit("roomFull");
      return;
    }
    if (room.players.includes(socket.id)) {
      socket.emit("alreadyInRoom");
      return;
    }

    const joiningPlayerName = normalizeName(playerName);
    const nameAlreadyUsed = Object.values(room.playerNames).some(
      (existingName) =>
        existingName.toLowerCase() === joiningPlayerName.toLowerCase(),
    );

    if (nameAlreadyUsed) {
      socket.emit("duplicatePlayerName");
      return;
    }

    leaveCurrentRooms();

    const wasWaiting = room.players.length === 1;

    room.players.push(socket.id);
    room.playerNames[socket.id] = joiningPlayerName;
    socket.join(normalizedRoomId);

    console.log(
      `Player ${socket.id} joined room ${normalizedRoomId}. Total players: ${room.players.length}`,
    );

    if (wasWaiting && room.players.length === 2) {
      const gameData = {
        roomId: normalizedRoomId,
        board: room.board,
        turn: room.turn,
        size: room.size,
        mode: room.mode,
        players: {
          [room.players[0]]: "X",
          [room.players[1]]: "O",
        },
        playerNames: room.playerNames,
      };

      console.log(
        `Starting game in room ${normalizedRoomId} with players:`,
        room.players,
      );
      io.to(normalizedRoomId).emit("startGame", gameData);
    } else if (room.players.length === 1) {
      socket.emit("waitingPlayer");
    }
  });

  socket.on("findMatch", ({ size = 3, playerName } = {}) => {
    leaveCurrentRooms();

    if (waitingPlayer && waitingPlayer.size === size) {
      const roomId = Math.random().toString(36).substring(7);

      rooms[roomId] = {
        players: [waitingPlayer.socket.id, socket.id],
        board: Array(size)
          .fill()
          .map(() => Array(size).fill(null)),
        turn: "X",
        winner: null,
        size,
        mode: "multiplayer",
        playerNames: {
          [waitingPlayer.socket.id]: waitingPlayer.playerName,
          [socket.id]: normalizeName(playerName),
        },
        matchRecorded: false,
      };

      socket.join(roomId);
      waitingPlayer.socket.join(roomId);

      const payload = {
        roomId,
        board: rooms[roomId].board,
        turn: "X",
        size,
        mode: "multiplayer",
        players: {
          [rooms[roomId].players[0]]: "X",
          [rooms[roomId].players[1]]: "O",
        },
        playerNames: rooms[roomId].playerNames,
      };

      socket.emit("startGame", payload);
      waitingPlayer.socket.emit("startGame", payload);

      waitingPlayer = null;
    } else {
      waitingPlayer = { socket, size, playerName: normalizeName(playerName) };
    }
  });

  socket.on("joinAI", ({ size = 3, playerName } = {}) => {
    leaveCurrentRooms();

    const roomId = Math.random().toString(36).substring(7);

    rooms[roomId] = {
      players: [socket.id],
      board: Array(size)
        .fill()
        .map(() => Array(size).fill(null)),
      turn: "X",
      winner: null,
      size,
      mode: "ai",
      aiSymbol: "O",
      playerNames: {
        [socket.id]: normalizeName(playerName),
      },
      matchRecorded: false,
    };

    socket.join(roomId);

    socket.emit("startGame", {
      roomId,
      board: rooms[roomId].board,
      turn: "X",
      size,
      mode: "ai",
      playerSymbol: "X",
      playerNames: rooms[roomId].playerNames,
    });
  });

  socket.on("makeMove", async ({ roomId, index }) => {
    const room = rooms[roomId];
    if (!room) return;
    if (room.winner) return;

    const row = Math.floor(index / room.size);
    const col = index % room.size;

    if (row < 0 || row >= room.size || col < 0 || col >= room.size) return;

    if (room.board[row][col] !== null) return;

    if (room.mode === "multiplayer") {
      if (room.players.length < 2) return;

      const playerIndex = room.players.indexOf(socket.id);

      if (
        (room.turn === "X" && playerIndex !== 0) ||
        (room.turn === "O" && playerIndex !== 1)
      )
        return;
    }

    if (room.mode === "ai") {
      if (room.turn !== "X") return;
      if (!room.players.includes(socket.id)) return;
    }

    room.board[row][col] = room.turn;

    let winner = checkWinner(room.board, room.size);

    const isDraw = room.board.every((r) => r.every((c) => c !== null));

    if (winner || isDraw) {
      finishGame(roomId, room, winner || "draw");

      io.to(roomId).emit("updateGame", {
        board: room.board,
        turn: room.turn,
        winner: room.winner,
      });

      return;
    }

    room.turn = room.turn === "X" ? "O" : "X";

    io.to(roomId).emit("updateGame", {
      board: room.board,
      turn: room.turn,
      winner: null,
    });

    if (room.mode === "ai" && room.turn === room.aiSymbol) {
      io.to(roomId).emit("aiThinking", { thinking: true });

      try {
        await new Promise((resolve) => setTimeout(resolve, AI_THINKING_DELAY_MS));

        const { index: aiIndex, explanation } = await getAIMove(
          room.board.map((r) => [...r]),
          room.aiSymbol,
          room.size,
        );

        const currentRoom = rooms[roomId];
        if (!currentRoom || currentRoom.winner) return;

        const aiRow = Math.floor(aiIndex / currentRoom.size);
        const aiCol = aiIndex % currentRoom.size;

        if (currentRoom.board[aiRow][aiCol] !== null) return;

        currentRoom.board[aiRow][aiCol] = currentRoom.aiSymbol;

        let aiWinner = checkWinner(currentRoom.board, currentRoom.size);
        const isDrawAI = currentRoom.board.every((r) =>
          r.every((c) => c !== null),
        );

        if (aiWinner || isDrawAI) {
          finishGame(roomId, currentRoom, aiWinner || "draw");
        } else {
          currentRoom.turn = "X";
        }

        io.to(roomId).emit("updateGame", {
          board: currentRoom.board,
          turn: currentRoom.turn,
          winner: currentRoom.winner,
          aiMove: aiIndex,
          aiExplanation: explanation,
        });
      } catch (err) {
        console.error("[AI ERROR]", err.message);
      } finally {
        io.to(roomId).emit("aiThinking", { thinking: false });
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    for (const roomId in rooms) {
      const room = rooms[roomId];

      if (!room.players.includes(socket.id)) continue;

      console.log(`Removing player ${socket.id} from room ${roomId}`);
      room.players = room.players.filter((id) => id !== socket.id);

      if (room.players.length === 1) {
        console.log(`Player left room ${roomId}, remaining player is waiting`);
        io.to(roomId).emit("playerLeft");
        io.to(roomId).emit("waitingPlayer");
      }

      if (room.players.length === 0) {
        console.log(`Room ${roomId} is now empty, deleting it`);
        delete rooms[roomId];
      }
    }

    if (waitingPlayer?.socket.id === socket.id) {
      console.log("Waiting player disconnected");
      waitingPlayer = null;
    }
  });

  socket.on("connect_error", (err) => {
    console.log("ERROR:", err.message);
  });
};
