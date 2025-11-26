"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const GameManager_1 = require("./game/GameManager");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*", // Allow all for dev
        methods: ["GET", "POST"]
    }
});
const gameManager = new GameManager_1.GameManager(io);
const PORT = process.env.PORT || 3001;
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    socket.on('createGame', ({ playerName }) => {
        const gameId = gameManager.createGame(playerName, socket.id);
        socket.join(gameId);
        socket.emit('gameCreated', { gameId });
    });
    socket.on('joinGame', ({ gameId, playerName }) => {
        const game = gameManager.joinGame(gameId, playerName, socket.id);
        if (game) {
            socket.join(gameId);
            socket.emit('gameJoined', { gameId });
        }
        else {
            socket.emit('error', { message: 'Game not found' });
        }
    });
    socket.on('startGame', () => {
        const game = gameManager.getGameBySocketId(socket.id);
        const player = gameManager.getPlayerBySocketId(socket.id);
        if (game && player) {
            // Only allow the host to start the game
            if (player.id === game.hostId) {
                game.start();
            }
            else {
                socket.emit('error', { message: 'Only the host can start the game' });
            }
        }
    });
    socket.on('nightAction', (data) => {
        console.log('Night action received:', data, 'from socket:', socket.id);
        const game = gameManager.getGameBySocketId(socket.id);
        const player = gameManager.getPlayerBySocketId(socket.id);
        console.log('Game found:', !!game, 'Player found:', !!player, 'Player role:', player?.role?.type);
        if (game && player && player.role) {
            if (player.role.type === 'WEREWOLF') {
                player.role.handleNightAction(game, player, data.targetId);
            }
            else if (player.role.type === 'SEER') {
                player.role.handleNightAction(game, player, data.targetId);
            }
            else if (player.role.type === 'DREAMKEEPER') {
                player.role.handleNightAction(game, player, data.targetId);
            }
            else if (player.role.type === 'WITCH') {
                game.witchAction(player.id, data.action, data.targetId);
            }
        }
    });
    socket.on('vote', ({ targetId }) => {
        const game = gameManager.getGameBySocketId(socket.id);
        const player = gameManager.getPlayerBySocketId(socket.id);
        if (game && player) {
            game.handleDayVote(player.id, targetId);
        }
    });
    // Admin/Debug: Force phase change
    socket.on('nextPhase', () => {
        const game = gameManager.getGameBySocketId(socket.id);
        if (game) {
            if (game.phase === 'NIGHT')
                game.endNight();
            else if (game.phase === 'DAY')
                game.endDay();
        }
    });
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        const game = gameManager.getGameBySocketId(socket.id);
        const player = gameManager.getPlayerBySocketId(socket.id);
        if (game && player) {
            game.removePlayer(player.id);
        }
    });
});
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
