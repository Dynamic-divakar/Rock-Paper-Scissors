const socket = io();
const roomInput = document.getElementById('roomInput');
const hostBtn = document.getElementById('hostBtn');
const joinGameBtn = document.getElementById('joinGameBtn');
const joinCodeInput = document.getElementById('joinCodeInput');
const gameArea = document.getElementById('gameArea');
const status = document.getElementById('status');
const choices = document.getElementById('choices');
const resultText = document.getElementById('resultText');
const generatedCodeText = document.getElementById('generatedCode');
const gameCodeText = document.getElementById('gameCodeText');

let yourScore = 0;
let opponentScore = 0;
let roomCode = '';
let hasPlayed = false;

// Generate random 6-digit alphanumeric code
function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Host game
hostBtn.onclick = () => {
  roomCode = generateCode();
  socket.emit('joinRoom', roomCode);
  generatedCodeText.textContent = `Share this code: ${roomCode}`;
  gameCodeText.textContent = `Room Code: ${roomCode}`;
  roomInput.classList.add('hidden');
  gameArea.classList.remove('hidden');
  status.textContent = 'Waiting for opponent to join...';
};


// Join game
joinGameBtn.onclick = () => {
  roomCode = joinCodeInput.value.trim().toUpperCase();
  if (roomCode.length === 6) {
    socket.emit('joinRoom', roomCode);
    gameCodeText.textContent = `Room Code: ${roomCode}`;
    roomInput.classList.add('hidden');
    gameArea.classList.remove('hidden');
    status.textContent = 'Waiting for opponent...';
  } else {
    alert('Enter a valid 6-character code.');
  }
};


// Game starts
socket.on('startGame', () => {
  status.textContent = 'Choose your move:';
  choices.classList.remove('hidden');
  resultText.textContent = '';
});

// When player clicks a move
document.querySelectorAll('.choiceBtn').forEach(btn => {
  btn.onclick = () => {
    const choice = btn.dataset.choice;
    hasPlayed = true;
    socket.emit('playerChoice', { roomCode, choice });
    status.textContent = 'Waiting for opponent\'s move...';
    choices.classList.add('hidden');
  };
});

// If opponent played first
socket.on('opponentMoved', () => {
  if (!hasPlayed) {
    status.textContent = 'Opponent played. You make a move.';
    choices.classList.remove('hidden');
  }
});

// Result received
socket.on('result', ({ yourChoice, opponentChoice, outcome }) => {
  hasPlayed = false;
  resultText.textContent = `You chose ${yourChoice}, Opponent chose ${opponentChoice}. ${outcome}`;
  status.textContent = 'Choose your move:';
  choices.classList.remove('hidden');

  if (outcome === 'You Win!') yourScore++;
  else if (outcome === 'You Lose!') opponentScore++;

  document.getElementById('yourScore').textContent = yourScore;
  document.getElementById('opponentScore').textContent = opponentScore;
});

// If opponent leaves
socket.on('playerLeft', () => {
  status.textContent = 'Opponent left the game.';
  choices.classList.add('hidden');
});
