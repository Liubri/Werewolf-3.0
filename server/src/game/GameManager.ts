import { Game } from './Game';
import { Player } from './Player';
import { v4 as uuidv4 } from 'uuid';

export class GameManager {
  games: Map<string, Game> = new Map();
  io: any;

  constructor(io: any) {
    this.io = io;
  }

  createGame(hostName: string, socketId: string): string {
    const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const hostPlayerId = uuidv4();
    
    const game = new Game(
      gameId,
      hostPlayerId, // Pass the host's player ID
      (targetSocketId: string, state: any) => {
        this.io.to(targetSocketId).emit('gameState', state);
      },
      (targetSocketId: string, event: string, data: any) => {
        this.io.to(targetSocketId).emit(event, data);
      }
    );
    
    const host = new Player(hostPlayerId, hostName, socketId);
    host.isReady = true; // Host is always ready? Or manual.
    game.addPlayer(host);
    
    this.games.set(gameId, game);
    return gameId;
  }

  joinGame(gameId: string, playerName: string, socketId: string): Game | null {
    const game = this.games.get(gameId);
    if (!game) return null;

    const player = new Player(uuidv4(), playerName, socketId);
    game.addPlayer(player);
    return game;
  }

  getGameBySocketId(socketId: string): Game | undefined {
    for (const game of this.games.values()) {
      for (const player of game.players.values()) {
        if (player.socketId === socketId) return game;
      }
    }
    return undefined;
  }
  
  getPlayerBySocketId(socketId: string): Player | undefined {
    for (const game of this.games.values()) {
      for (const player of game.players.values()) {
        if (player.socketId === socketId) return player;
      }
    }
    return undefined;
  }
}
