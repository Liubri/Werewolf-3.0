"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameManager = void 0;
const Game_1 = require("./Game");
const Player_1 = require("./Player");
const uuid_1 = require("uuid");
class GameManager {
    constructor(io) {
        this.games = new Map();
        this.io = io;
    }
    createGame(hostName, socketId) {
        const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const hostPlayerId = (0, uuid_1.v4)();
        const game = new Game_1.Game(gameId, hostPlayerId, // Pass the host's player ID
        (targetSocketId, state) => {
            this.io.to(targetSocketId).emit('gameState', state);
        }, (targetSocketId, event, data) => {
            this.io.to(targetSocketId).emit(event, data);
        });
        const host = new Player_1.Player(hostPlayerId, hostName, socketId);
        host.isReady = true; // Host is always ready? Or manual.
        game.addPlayer(host);
        this.games.set(gameId, game);
        return gameId;
    }
    joinGame(gameId, playerName, socketId) {
        const game = this.games.get(gameId);
        if (!game)
            return null;
        const player = new Player_1.Player((0, uuid_1.v4)(), playerName, socketId);
        game.addPlayer(player);
        return game;
    }
    getGameBySocketId(socketId) {
        for (const game of this.games.values()) {
            for (const player of game.players.values()) {
                if (player.socketId === socketId)
                    return game;
            }
        }
        return undefined;
    }
    getPlayerBySocketId(socketId) {
        for (const game of this.games.values()) {
            for (const player of game.players.values()) {
                if (player.socketId === socketId)
                    return player;
            }
        }
        return undefined;
    }
}
exports.GameManager = GameManager;
