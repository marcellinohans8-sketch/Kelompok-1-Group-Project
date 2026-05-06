function checkWinner(board, size) {
  for (let i = 0; i < size; i++) {
    if (board[i][0] && board[i].every((c) => c === board[i][0]))
      return board[i][0];
    if (board[0][i] && board.every((row) => row[i] === board[0][i]))
      return board[0][i];
  }

  if (board[0][0] && board.every((row, i) => row[i] === board[0][0]))
    return board[0][0];
  if (
    board[0][size - 1] &&
    board.every((row, i) => row[size - 1 - i] === board[0][size - 1])
  )
    return board[0][size - 1];

  return null;
}

async function getAIMove(board, aiSymbol, size) {
  const empty = [];

  for (let i = 0; i < size * size; i++) {
    const r = Math.floor(i / size);
    const c = i % size;
    if (board[r][c] === null) empty.push(i);
  }

  if (empty.length === 0) return { index: -1 };

  return getBestLocalMove(board, aiSymbol, size, empty);
}

function getBestLocalMove(board, aiSymbol, size, empty) {
  const humanSymbol = aiSymbol === "O" ? "X" : "O";

  const winningMove = findImmediateMove(board, size, empty, aiSymbol);
  if (winningMove !== null) {
    return { index: winningMove, explanation: "AI mengambil langkah menang." };
  }

  const blockingMove = findImmediateMove(board, size, empty, humanSymbol);
  if (blockingMove !== null) {
    return { index: blockingMove, explanation: "AI memblokir ancaman lawan." };
  }

  const center = Math.floor((size * size) / 2);
  if (empty.includes(center)) {
    return { index: center, explanation: "AI mengambil posisi tengah." };
  }

  const corners = [0, size - 1, size * (size - 1), size * size - 1];
  const openCorner = corners.find((index) => empty.includes(index));
  if (openCorner !== undefined) {
    return { index: openCorner, explanation: "AI mengambil sudut kosong." };
  }

  return {
    index: empty[0],
    explanation: "AI mengambil kotak kosong pertama.",
  };
}

function findImmediateMove(board, size, empty, symbol) {
  for (const index of empty) {
    const row = Math.floor(index / size);
    const col = index % size;

    board[row][col] = symbol;
    const winner = checkWinner(board, size);
    board[row][col] = null;

    if (winner === symbol) return index;
  }

  return null;
}

module.exports = { getAIMove, checkWinner };
