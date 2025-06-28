const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const PORT = process.env.PORT || 3000;


app.use(express.static('public'));

let rooms = {};

io.on('connection', (socket) => {
  socket.on('joinRoom', (roomCode) => {
    socket.join(roomCode);
    if (!rooms[roomCode]) rooms[roomCode] = {};
    rooms[roomCode][socket.id] = { choice: null };

    if (Object.keys(rooms[roomCode]).length === 2) {
      io.to(roomCode).emit('startGame');
    }
  });

  socket.on('playerChoice', ({ roomCode, choice }) => {
    if (!rooms[roomCode]) return;
    rooms[roomCode][socket.id].choice = choice;

    const players = Object.keys(rooms[roomCode]);
    const otherPlayerId = players.find(id => id !== socket.id);
    if (otherPlayerId && !rooms[roomCode][otherPlayerId].choice) {
      io.to(otherPlayerId).emit('opponentMoved');
    }

    if (players.length === 2 &&
        players.every(id => rooms[roomCode][id].choice)) {
      const [p1, p2] = players;
      const c1 = rooms[roomCode][p1].choice;
      const c2 = rooms[roomCode][p2].choice;

      const result = getResult(c1, c2);
      io.to(p1).emit('result', { yourChoice: c1, opponentChoice: c2, outcome: result[0] });
      io.to(p2).emit('result', { yourChoice: c2, opponentChoice: c1, outcome: result[1] });

      rooms[roomCode][p1].choice = null;
      rooms[roomCode][p2].choice = null;
    }
  });

  socket.on('disconnect', () => {
    for (const room in rooms) {
      if (rooms[room][socket.id]) {
        delete rooms[room][socket.id];
        io.to(room).emit('playerLeft');
        if (Object.keys(rooms[room]).length === 0) delete rooms[room];
      }
    }
  });
});

function getResult(c1, c2) {
  if (c1 === c2) return ['Draw', 'Draw'];
  if (
    (c1 === 'rock' && c2 === 'scissors') ||
    (c1 === 'scissors' && c2 === 'paper') ||
    (c1 === 'paper' && c2 === 'rock')
  ) return ['You Win!', 'You Lose!'];
  return ['You Lose!', 'You Win!'];
}

http.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
