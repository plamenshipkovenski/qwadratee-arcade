const socket = io();

let currentRoomCode = null;
let playerName = "Guest_" + Math.floor(Math.random() * 1000);
let userAvatarSeed = playerName;

const playerNameInput = document.getElementById('playerName');
const createArcadeBtn = document.getElementById('createArcadeBtn');
const userAvatarImg = document.getElementById('userAvatar');

if (playerNameInput) {
    playerNameInput.addEventListener('input', (e) => {
        if (e.target.value.trim() !== "") {
            playerName = e.target.value.trim();
            userAvatarSeed = playerName;
            userAvatarImg.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${userAvatarSeed}`;
        }
    });
}

if (createArcadeBtn) {
    createArcadeBtn.addEventListener('click', () => {
        socket.emit('create-room', { playerName, avatar: userAvatarImg.src });
    });
}

// Събития от сървъра
socket.on('room-created', (data) => {
    currentRoomCode = data.roomCode;
    showLobbyUI(data.players, data.time, true);
});

socket.on('update-room-players', (data) => {
    const countEl = document.getElementById('playersCount');
    if (countEl) countEl.innerText = `${data.players.length}/6`;
    updatePlayersListUI(data.players);
});

socket.on('timer-tick', (timeLeft) => {
    const timerEl = document.getElementById('roomTimer');
    if (timerEl) {
        timerEl.innerText = `Оставащо време: ${timeLeft} сек`;
    }
});

socket.on('start-game', (data) => {
    showGameArenaUI(data.players);
});

// UI Функция за лобито
function showLobbyUI(players, timeLeft, isHost) {
    const myId = socket.id;
    const currentPlayer = players.find(p => p.id === myId);
    const amIHost = currentPlayer ? currentPlayer.isHost : isHost;

    document.body.innerHTML = `
        <div class="container" style="max-width: 450px;">
            <div class="diamond-badge">💎 АРКАДНО ЛОБИ [Код: ${currentRoomCode}]</div>
            <h2 id="roomTimer" style="color: #ffb703; font-size: 0.9rem; margin-bottom: 5px;">Оставащо време: ${timeLeft} сек</h2>
            <h3 style="font-size: 1rem; color: #a0aec0; margin-bottom: 10px;">СВЪРЗАНИ ИГРАЧИ (<span id="playersCount">${players.length}/6</span>)</h3>
            
            <div id="playersList" style="margin-bottom: 15px; max-height: 180px; overflow-y: auto; text-align: left; display: flex; flex-direction: column; gap: 8px;">
                <!-- Списък с играчи -->
            </div>

            ${amIHost ? `
                <!-- Видимо САМО за теб (Хоста / Админа) -->
                <button id="addBotBtn" class="get-qr-btn" style="margin-bottom: 8px;">➕ ДОБАВИ ИИ БОТ</button>
                <button id="startGameBtn" class="create-btn">СТАРТ НА ИГРАТА</button>
            ` : `
                <!-- Видимо за "парашутистите" и гостите докато чакат -->
                <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; color: #00f2fe; font-size: 0.85rem; margin-bottom: 8px;">
                    ⏳ Изчакване на хоста и останалите играчи...
                </div>
            `}

            <button id="leaveRoomBtn" class="close-modal" style="margin-top: 5px;">НАЗАД КЪМ НАЧАЛОТО</button>
        </div>
    `;

    updatePlayersListUI(players);

    if (amIHost) {
        document.getElementById('addBotBtn').addEventListener('click', () => {
            socket.emit('add-bot', currentRoomCode);
        });

        document.getElementById('startGameBtn').addEventListener('click', () => {
            socket.emit('force-start', currentRoomCode);
        });
    }

    document.getElementById('leaveRoomBtn').addEventListener('click', () => {
        window.location.reload();
    });
}

function updatePlayersListUI(players) {
    const listContainer = document.getElementById('playersList');
    if (!listContainer) return;

    listContainer.innerHTML = '';
    players.forEach(p => {
        const item = document.createElement('div');
        item.style.cssText = "display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.05); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);";
        item.innerHTML = `
            <img src="${p.avatar}" style="width: 32px; height: 32px; border-radius: 50%; background: #000;">
            <div style="flex: 1; font-size: 0.9rem;">
                <strong>${p.name}</strong><br>
                <span style="font-size: 0.75rem; color: ${p.isBot ? '#ffb703' : '#00f2fe'};">
                    ${p.isBot ? '🤖 ИИ Бот' : (p.isHost ? '👑 Хост / Админ' : '👤 Играч')}
                </span>
            </div>
        `;
        listContainer.appendChild(item);
    });
}

// UI Функция за игралната арена Quadratee
function showGameArenaUI(players) {
    document.body.innerHTML = `
        <div class="container" style="max-width: 550px; text-align: center;">
            <div class="diamond-badge">💎 QUADRATEE - АРЕНА</div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.3); padding: 10px 15px; border-radius: 8px; margin-bottom: 12px; font-size: 0.85rem;">
                <span>👥 Играчи: <strong>${players.length}</strong></span>
                <span id="gameTimer" style="color: #00f2fe; font-weight: bold; font-size: 1rem;">⏳ 77 сек</span>
                <span>⭐ Резултат: <strong id="scoreVal" style="color: #ffb703;">0</strong></span>
            </div>

            <div id="quadrateeBoard" style="position: relative; width: 100%; height: 360px; background: #0f172a; border-radius: 12px; border: 2px solid rgba(255,255,255,0.15); display: grid; grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr); gap: 8px; padding: 8px; overflow: hidden; box-sizing: border-box;">
                
                <!-- Квадрант 1 -->
                <div class="quadrant" data-index="0" style="position: relative; background: rgba(255,255,255,0.03); border: 1px dashed rgba(255,255,255,0.2); border-radius: 8px; cursor: pointer; transition: transform 0.4s ease; display: grid; grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr); padding: 10px; gap: 6px;">
                    <div class="q-dot" style="background: #ff007f; border-radius: 50%; box-shadow: 0 0 8px #ff007f;"></div>
                    <div class="q-dot" style="background: #00f2fe; border-radius: 50%; box-shadow: 0 0 8px #00f2fe;"></div>
                    <div class="q-dot" style="background: #ffb703; border-radius: 50%; box-shadow: 0 0 8px #ffb703;"></div>
                    <div class="q-dot" style="background: #ff007f; border-radius: 50%; box-shadow: 0 0 8px #ff007f;"></div>
                </div>

                <!-- Квадрант 2 -->
                <div class="quadrant" data-index="1" style="position: relative; background: rgba(255,255,255,0.03); border: 1px dashed rgba(255,255,255,0.2); border-radius: 8px; cursor: pointer; transition: transform 0.4s ease; display: grid; grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr); padding: 10px; gap: 6px;">
                    <div class="q-dot" style="background: #00f2fe; border-radius: 50%; box-shadow: 0 0 8px #00f2fe;"></div>
                    <div class="q-dot" style="background: #ffb703; border-radius: 50%; box-shadow: 0 0 8px #ffb703;"></div>
                    <div class="q-dot" style="background: #ff007f; border-radius: 50%; box-shadow: 0 0 8px #ff007f;"></div>
                    <div class="q-dot" style="background: #00f2fe; border-radius: 50%; box-shadow: 0 0 8px #00f2fe;"></div>
                </div>

                <!-- Квадрант 3 -->
                <div class="quadrant" data-index="2" style="position: relative; background: rgba(255,255,255,0.03); border: 1px dashed rgba(255,255,255,0.2); border-radius: 8px; cursor: pointer; transition: transform 0.4s ease; display: grid; grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr); padding: 10px; gap: 6px;">
                    <div class="q-dot" style="background: #ffb703; border-radius: 50%; box-shadow: 0 0 8px #ffb703;"></div>
                    <div class="q-dot" style="background: #ff007f; border-radius: 50%; box-shadow: 0 0 8px #ff007f;"></div>
                    <div class="q-dot" style="background: #00f2fe; border-radius: 50%; box-shadow: 0 0 8px #00f2fe;"></div>
                    <div class="q-dot" style="background: #ffb703; border-radius: 50%; box-shadow: 0 0 8px #ffb703;"></div>
                </div>

                <!-- Квадрант 4 -->
                <div class="quadrant" data-index="3" style="position: relative; background: rgba(255,255,255,0.03); border: 1px dashed rgba(255,255,255,0.2); border-radius: 8px; cursor: pointer; transition: transform 0.4s ease; display: grid; grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr); padding: 10px; gap: 6px;">
                    <div class="q-dot" style="background: #ff007f; border-radius: 50%; box-shadow: 0 0 8px #ff007f;"></div>
                    <div class="q-dot" style="background: #ffb703; border-radius: 50%; box-shadow: 0 0 8px #ffb703;"></div>
                    <div class="q-dot" style="background: #00f2fe; border-radius: 50%; box-shadow: 0 0 8px #00f2fe;"></div>
                    <div class="q-dot" style="background: #ffb703; border-radius: 50%; box-shadow: 0 0 8px #ffb703;"></div>
                </div>

            </div>

            <button id="exitGameBtn" class="close-modal" style="margin-top: 15px;">НАЗАД КЪМ НАЧАЛОТО</button>
        </div>
    `;

    document.getElementById('exitGameBtn').addEventListener('click', () => {
        window.location.reload();
    });

    // Интерактивно завъртане на квадрантите на 90 градуса
    const quadrants = document.querySelectorAll('.quadrant');
    let rotations = [0, 0, 0, 0];

    quadrants.forEach((q, idx) => {
        q.addEventListener('click', () => {
            rotations[idx] += 90;
            q.style.transform = `rotate(${rotations[idx]}deg)`;
            
            q.style.borderColor = '#00f2fe';
            setTimeout(() => {
                q.style.borderColor = 'rgba(255,255,255,0.2)';
            }, 300);
        });
    });

    startSessionTimer();
}

function startSessionTimer() {
    let timeLeft = 77;
    const timerEl = document.getElementById('gameTimer');
    
    const timerInterval = setInterval(() => {
        timeLeft--;
        if (timerEl) {
            timerEl.innerText = `⏳ ${timeLeft} сек`;
            
            // Паник режим под 42 секунди
            if (timeLeft < 42) {
                timerEl.style.color = timeLeft % 2 === 0 ? '#ff007f' : '#ffffff';
            }
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert('Времето изтече! Край на игралната сесия.');
            window.location.reload();
        }
    }, 1000);
}