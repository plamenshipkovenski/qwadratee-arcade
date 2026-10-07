const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

const rooms = {};
const botNames = ["CyberNinja", "NeonRider", "PixelQueen", "GlitchMaster", "TurboBot", "AuraGhost", "PixelPioneer"];

io.on('connection', (socket) => {
    console.log('Свързан потребител с ID:', socket.id);

    // Създаване на стая с таймер
    socket.on('create-room', (data) => {
        const roomCode = Math.floor(1000 + Math.random() * 9000).toString();
        
        rooms[roomCode] = {
            host: socket.id,
            maxPlayers: 6,
            players: [{
                id: socket.id,
                name: data.playerName || 'Guest',
                avatar: data.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=guest`,
                isHost: true,
                isBot: false
            }],
            timerSeconds: 30, // Таймер за изчакване
            timerInterval: null
        };

        socket.join(roomCode);
        socket.emit('room-created', { roomCode, players: rooms[roomCode].players, time: rooms[roomCode].timerSeconds });

        // Стартираме обратно броене за стаята
        startRoomTimer(roomCode);
    });

    // Добавяне на бот ръчно
    socket.on('add-bot', (roomCode) => {
        const room = rooms[roomCode];
        if (room && room.players.length < room.maxPlayers) {
            const randomName = botNames[Math.floor(Math.random() * botNames.length)] + "_" + Math.floor(Math.random() * 90 + 10);
            const botId = 'bot_' + Math.random().toString(36).substring(2, 9);
            
            const botPlayer = {
                id: botId,
                name: randomName,
                avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${randomName}`,
                isBot: true,
                isHost: false
            };

            room.players.push(botPlayer);
            io.to(roomCode).emit('update-room-players', { players: room.players });

            // Ако стаята се запълни (6 места), спираме таймера и стартираме веднага играта
            if (room.players.length >= room.maxPlayers) {
                clearInterval(room.timerInterval);
                io.to(roomCode).emit('start-game', { reason: 'full', players: room.players });
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('Потребителят се изключи:', socket.id);
        for (let code in rooms) {
            rooms[code].players = rooms[code].players.filter(p => p.id !== socket.id);
            io.to(code).emit('update-room-players', { players: rooms[code].players });
            if (rooms[code].players.length === 0) {
                clearInterval(rooms[code].timerInterval);
                delete rooms[code];
            }
        }
    });
});

// Функция за таймера на стаята
function startRoomTimer(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    room.timerInterval = setInterval(() => {
        room.timerSeconds--;
        io.to(roomCode).emit('timer-tick', room.timerSeconds);

        // Когато времето изтече (стане 0)
        if (room.timerSeconds <= 0) {
            clearInterval(room.timerInterval);

            // АКО НЯМА ДРУГИ ИГРАЧИ ИЛИ БОТОВЕ (само ти си), автоматично добавяме един бот!
            if (room.players.length < 2) {
                const randomName = botNames[Math.floor(Math.random() * botNames.length)] + "_" + Math.floor(Math.random() * 90 + 10);
                const botId = 'bot_' + Math.random().toString(36).substring(2, 9);
                const botPlayer = {
                    id: botId,
                    name: randomName,
                    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${randomName}`,
                    isBot: true,
                    isHost: false
                };
                room.players.push(botPlayer);
                io.to(roomCode).emit('update-room-players', { players: room.players });
            }

            // Стартираме играта с наличните играчи (ти + бот или колкото са се събрали)
            if (room.players.length >= 2) {
                io.to(roomCode).emit('start-game', { reason: 'timeout', players: room.players });
            }
        }
    }, 1000);
}

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Сървърът работи на http://localhost:${PORT}`);
});