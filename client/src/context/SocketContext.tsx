"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState } from '../types/game';

interface SocketContextType {
  socket: Socket | null;
  socketId: string | null;
  gameState: GameState | null;
  isConnected: boolean;
  createGame: (playerName: string) => void;
  joinGame: (gameId: string, playerName: string) => void;
  startGame: () => void;
  sendNightAction: (action: string, targetId?: string, extra?: any) => void;
  sendVote: (targetId: string) => void;
  sendHunterRevenge: (targetId: string) => void;
  sendWerewolfSelection: (targetId: string) => void; // Real-time selection
  nextPhase: () => void; // Debug
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [socketId, setSocketId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on("connect", () => {
      setIsConnected(true);
      setSocketId(newSocket.id ?? null);   // <-- TRACK SOCKET ID
    });
    newSocket.on('disconnect', () => setIsConnected(false));
    
    newSocket.on('gameState', (state: GameState) => {
      console.log('Game State Update:', state);
      setGameState(state);
    });

    newSocket.on('gameCreated', ({ gameId }) => {
      console.log('Game Created:', gameId);
    });

    newSocket.on('gameJoined', ({ gameId }) => {
      console.log('Joined Game:', gameId);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const createGame = (playerName: string) => {
    socket?.emit('createGame', { playerName });
  };

  const joinGame = (gameId: string, playerName: string) => {
    socket?.emit('joinGame', { gameId, playerName });
  };

  const startGame = () => {
    socket?.emit('startGame');
  };

  const sendNightAction = (action: string, targetId?: string, extra?: any) => {
    // action is generic here, but backend expects specific structure
    // We might need to adapt this based on role
    socket?.emit('nightAction', { action, targetId, ...extra });
  };

  const sendVote = (targetId: string) => {
    socket?.emit('vote', { targetId });
  };

  const sendHunterRevenge = (targetId: string) => {
    socket?.emit('hunterRevenge', { targetId });
  };

  const sendWerewolfSelection = (targetId: string) => {
    socket?.emit('werewolfSelectTarget', { targetId });
  };
  
  const nextPhase = () => {
    socket?.emit('nextPhase');
  }

  return (
    <SocketContext.Provider value={{ 
      socket, 
      socketId,
      gameState, 
      isConnected, 
      createGame, 
      joinGame, 
      startGame,
      sendNightAction,
      sendVote,
      sendHunterRevenge,
      sendWerewolfSelection,
      nextPhase
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
