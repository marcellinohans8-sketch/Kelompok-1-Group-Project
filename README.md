# Tic Tac Toe Arena

Tic Tac Toe Arena adalah aplikasi game real-time berbasis React dan Socket.IO. Aplikasi ini mendukung permainan multiplayer lewat room code, permainan melawan AI, leaderboard, dan match history.

## Fitur

- Play vs AI dengan AI lokal berbasis strategi sederhana.
- Multiplayer real-time menggunakan Socket.IO.
- Create room dan join room menggunakan Room ID.
- Validasi nama pemain agar tidak duplikat dalam satu room.
- Leaderboard untuk match multiplayer.
- Match history untuk mode multiplayer dan AI.
- Penyimpanan match history server-side di file JSON.
- Light mode dan dark mode.
- Frontend React + Vite.
- Backend Express + Socket.IO.

## Tech Stack

Frontend:
- React
- Vite
- React Router
- Socket.IO Client
- Tailwind CSS
- Toastify

Backend:
- Node.js
- Express
- Socket.IO
- CORS
- dotenv

## Struktur Folder

```text
.
+-- client
|   +-- public
|   +-- src
|   |   +-- components
|   |   |   +-- Game.jsx
|   |   |   +-- GameAI.jsx
|   |   |   +-- Home.jsx
|   |   +-- constant
|   |   |   +-- baseUrl.js
|   |   +-- context
|   |   |   +-- ThemeContext.jsx
|   |   +-- App.jsx
|   |   +-- main.jsx
|   +-- package.json
+-- server
|   +-- services
|   |   +-- aiService.js
|   |   +-- matchStore.js
|   +-- socket
|   |   +-- gameSocket.js
|   +-- testing
|   |   +-- test.js
|   +-- app.js
|   +-- package.json
+-- README.md
```

## Prasyarat

Pastikan sudah terinstall:

- Node.js
- npm

Project ini menggunakan dua aplikasi terpisah:

- `server` untuk API dan Socket.IO.
- `client` untuk React/Vite.

## Instalasi

Install dependency server:

```bash
cd server
npm install
```

Install dependency client:

```bash
cd client
npm install
```

## Environment Variable

Buat file `.env` di folder `server` jika diperlukan.

Contoh:

```env
PORT=3015
CLIENT_URL=http://localhost:5174
NODE_ENV=development
```

Keterangan:

- `PORT`: port backend. Default saat local adalah `3015`.
- `CLIENT_URL`: URL frontend yang diizinkan untuk CORS.
- `NODE_ENV`: gunakan `development` untuk local.

Catatan: file `.env` tidak boleh di-commit ke Git.

## Menjalankan Project di Local

Jalankan server:

```bash
cd server
npm start
```

Jika berhasil, terminal akan menampilkan:

```text
Server running on port 3015
```

Jalankan client di terminal lain:

```bash
cd client
npm run dev
```

Buka URL Vite yang muncul, misalnya:

```text
http://localhost:5174
```

Saat dibuka dari `localhost`, client otomatis menggunakan backend:

```text
http://localhost:3015
```

Konfigurasi ini ada di:

```text
client/src/constant/baseUrl.js
```

## Script

Server:

```bash
npm start
```

Client:

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## Alur Permainan

### Play vs AI

1. User membuka halaman utama.
2. User mengisi nama pemain.
3. User klik `Play vs AI`.
4. Client membuka koneksi Socket.IO ke server.
5. Setelah socket connect, client emit event `joinAI`.
6. Server membuat room mode AI dan emit `startGame`.
7. User bermain sebagai `X`.
8. AI bermain sebagai `O`.
9. Saat game selesai, server menyimpan match ke history.

### Multiplayer

1. Player pertama klik `Create room`.
2. Server membuat room dan mengirim Room ID.
3. Player kedua memasukkan Room ID lalu klik `Join`.
4. Server emit `startGame` ke kedua player.
5. Player pertama bermain sebagai `X`.
6. Player kedua bermain sebagai `O`.
7. Saat game selesai, server menyimpan match dan memperbarui leaderboard.

## REST API

Base URL local:

```text
http://localhost:3015
```

### Health Check

```http
GET /
```

Response:

```text
Server is running
```

### Leaderboard

```http
GET /leaderboard
```

Response contoh:

```json
[
  {
    "name": "Hans",
    "played": 3,
    "wins": 2,
    "losses": 1,
    "draws": 0,
    "points": 6
  }
]
```

Leaderboard hanya dihitung dari match multiplayer.

### Match History

```http
GET /matches
```

Response contoh:

```json
[
  {
    "id": "1779436335985-2",
    "roomId": "abc123",
    "mode": "ai",
    "players": [
      {
        "id": "socket-id",
        "name": "Hans",
        "symbol": "X"
      },
      {
        "id": "ai",
        "name": "AI",
        "symbol": "O",
        "isBot": true
      }
    ],
    "winner": "O",
    "winnerName": "AI",
    "board": [
      ["X", "X", "O"],
      ["X", "O", null],
      ["O", null, null]
    ],
    "playedAt": "2026-05-22T07:52:15.985Z"
  }
]
```

## Socket.IO Events

### Client ke Server

`createRoom`

```js
socket.emit("createRoom", {
  size: 3,
  playerName: "Hans",
});
```

Membuat room multiplayer baru.

`joinRoom`

```js
socket.emit("joinRoom", {
  roomId: "abc123",
  playerName: "Maulana",
});
```

Masuk ke room multiplayer yang sudah ada.

`joinAI`

```js
socket.emit("joinAI", {
  size: 3,
  playerName: "Hans",
});
```

Membuat game baru melawan AI.

`makeMove`

```js
socket.emit("makeMove", {
  roomId: "abc123",
  index: 4,
});
```

Mengirim langkah pemain. `index` adalah posisi cell dari `0` sampai `8` untuk board 3x3.

### Server ke Client

`roomCreated`

```js
socket.on("roomCreated", (roomId) => {});
```

Dikirim setelah room berhasil dibuat.

`waitingPlayer`

```js
socket.on("waitingPlayer", () => {});
```

Dikirim saat room masih menunggu lawan.

`startGame`

```js
socket.on("startGame", (data) => {});
```

Dikirim saat game siap dimainkan.

`updateGame`

```js
socket.on("updateGame", (data) => {});
```

Dikirim setiap board berubah.

`aiThinking`

```js
socket.on("aiThinking", ({ thinking }) => {});
```

Dikirim saat AI sedang memilih langkah.

`playerLeft`

```js
socket.on("playerLeft", () => {});
```

Dikirim saat lawan keluar dari room.

Error room:

```js
socket.on("roomNotFound", () => {});
socket.on("roomFull", () => {});
socket.on("alreadyInRoom", () => {});
socket.on("duplicatePlayerName", () => {});
```

## Penyimpanan Data

Match history dan leaderboard disimpan oleh server di:

```text
server/data/matches.json
```

Folder `server/data` di-ignore oleh Git agar data runtime tidak ikut masuk repository.

Catatan penting:

- Data tersimpan selama filesystem server tidak dihapus.
- Jika hosting menggunakan ephemeral filesystem, data bisa hilang saat redeploy/restart.
- Untuk production yang lebih stabil, gunakan database seperti PostgreSQL, MySQL, MongoDB, atau Redis.

## Konfigurasi URL Client

File:

```text
client/src/constant/baseUrl.js
```

Perilaku default:

- Jika dibuka dari `localhost` atau `127.0.0.1`, client memakai `http://localhost:3015`.
- Jika dibuka dari domain production, client memakai `https://marcellino10.online`.
- Bisa dioverride dengan `VITE_API_URL`.

Contoh override di client:

```env
VITE_API_URL=https://api-domain-kamu.com
```

## CORS

Server mengizinkan:

- Semua origin `localhost` dan `127.0.0.1`.
- `https://marcellino10.online`
- `https://www.marcellino10.online`
- Domain `*.vercel.app`
- Origin tambahan dari `CLIENT_URL`

Konfigurasi ada di:

```text
server/app.js
```

## Deployment

### Backend

Backend bisa dideploy ke VPS, Railway, Render, atau platform Node.js lain.

Pastikan:

- Command start: `npm start`
- Working directory: `server`
- Environment variable `PORT` mengikuti port dari hosting jika disediakan.
- `CLIENT_URL` diisi dengan URL frontend production jika ingin membatasi origin tertentu.

Server sudah mendukung dua mode:

- Jika ada `process.env.PORT`, server akan listen ke port tersebut.
- Jika production berjalan di VPS dengan sertifikat Let's Encrypt lokal untuk `marcellino10.online`, server dapat memakai HTTPS langsung di port `443`.

### Frontend

Frontend bisa dideploy ke Vercel.

Pastikan:

- Root directory: `client`
- Build command: `npm run build`
- Output directory: `dist`
- Jika backend bukan `https://marcellino10.online`, set environment variable:

```env
VITE_API_URL=https://backend-kamu.com
```

Setelah deploy ulang, lakukan hard refresh browser:

```text
Ctrl + Shift + R
```

## Troubleshooting

### Play vs AI stuck di "Connecting..."

Cek hal berikut:

1. Server sudah jalan.
2. Port backend sesuai dengan `baseUrl.js`.
3. Jika local, backend harus bisa diakses dari browser:

```text
http://localhost:3015
```

4. Cek console browser untuk error Socket.IO atau CORS.
5. Jika baru deploy, hard refresh browser agar bundle lama tidak dipakai.

### Match history tidak muncul

Match history hanya muncul setelah game selesai.

Cek endpoint:

```text
http://localhost:3015/matches
```

Jika endpoint kosong:

- Pastikan game benar-benar selesai.
- Pastikan server yang dipakai client sama dengan server yang dicek.
- Pastikan server dapat menulis ke folder `server/data`.

### Multiplayer tidak mulai

Cek hal berikut:

- Player kedua memasukkan Room ID yang benar.
- Nama player tidak sama dengan nama player pertama.
- Kedua browser terhubung ke backend yang sama.

### Port berbeda di Vite

Vite bisa memakai port `5173`, `5174`, dan seterusnya. Server sudah mengizinkan semua origin localhost, jadi port Vite tidak masalah selama backend tetap sesuai dengan `baseUrl.js`.

## Testing Manual

Server menyediakan script test di:

```text
server/testing/test.js
```

Jalankan server terlebih dahulu, lalu jalankan script test dari folder server:

```bash
node testing/test.js
```

Jika port server berubah, sesuaikan konstanta URL di file test.

## Catatan Keamanan

- Jangan commit file `.env`.
- Jangan menaruh API key atau secret di frontend.
- Jika API key pernah terlanjur tersebar, segera rotate/revoke key tersebut.
- Untuk production, gunakan database dan secret manager jika aplikasi mulai dipakai serius.

## License

Project ini menggunakan license yang tersedia di file `LICENSE`.
