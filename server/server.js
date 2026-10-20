
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

app.use(cors());

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

const players = new Map();

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'ProxiSpeak server is running!',
  });
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  players.set(socket.id, {
    id: socket.id,
    name: `Guest-${socket.id.slice(0, 4)}`,
    x: 50,
    y: 50,
  });

  socket.emit('players-update', Array.from(players.values()));

  socket.broadcast.emit('player-joined', players.get(socket.id));

  socket.on('move', (position) => {
    const player = players.get(socket.id);
    if (!player) return;

    const x = Number(position.x);
    const y = Number(position.y);

    if (!Number.isFinite(x) || !Number.isFinite(y)) return;

    player.x = Math.max(5, Math.min(90, x));
    player.y = Math.max(5, Math.min(90, y));

    io.emit('player-moved', player);
  });

  socket.on('disconnect', () => {
    players.delete(socket.id);
    io.emit('player-left', socket.id);
    console.log('User disconnected:', socket.id);
  });
});

server.listen(3001, () => {
  console.log('ProxiSpeak server running on http://localhost:3001');
});
