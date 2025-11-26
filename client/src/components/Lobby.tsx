import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { ClientPageRoot } from 'next/dist/client/components/client-page';

export const Lobby: React.FC = () => {
  const { createGame, joinGame, gameState, startGame, isConnected, socketId } = useSocket();
  const [name, setName] = useState('');
  const [gameIdInput, setGameIdInput] = useState('');
  const [mode, setMode] = useState<'MENU' | 'JOIN'>('MENU');

  if (!isConnected) {
    return <div className="flex items-center justify-center h-screen text-white">Connecting to server...</div>;
  }

  if (gameState) {
    // Find the current player (the one with a role assigned, or match by socket)
    const currentPlayer = gameState.players.find(p => p.socketId === socketId);
    const isHost = currentPlayer?.id === gameState.hostId;

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
        <h1 className="text-4xl font-bold mb-4">Lobby: {gameState.id}</h1>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
          <h2 className="text-xl mb-4">Players ({gameState.players.length})</h2>
          <ul className="space-y-2 mb-6">
            {gameState.players.map((p) => (
              <li key={p.id} className="flex items-center justify-between bg-gray-700 p-2 rounded">
                <span className="flex items-center gap-2">
                  {p.id === gameState.hostId && <span className="text-yellow-400" title="Host">👑</span>}
                  {p.name}
                </span>
                {p.isReady && <span className="text-green-400 text-sm">Ready</span>}
              </li>
            ))}
          </ul>
          {isHost ? (
            <button 
              onClick={startGame}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded transition"
            >
              Start Game
            </button>
          ) : (
            <div className="w-full bg-gray-700 text-gray-400 font-bold py-3 rounded text-center">
              Waiting for host to start...
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-6xl font-bold text-red-600 mb-12 tracking-wider">WEREWOLF</h1>
      
      <div className="w-full max-w-md space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Your Name</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:outline-none focus:border-red-500"
            placeholder="Enter your name"
          />
        </div>

        {mode === 'MENU' && (
          <div className="space-y-4">
            <button 
              onClick={() => name && createGame(name)}
              disabled={!name}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded transition"
            >
              Create Game
            </button>
            <button 
              onClick={() => setMode('JOIN')}
              disabled={!name}
              className="w-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white font-bold py-3 rounded transition"
            >
              Join Game
            </button>
          </div>
        )}

        {mode === 'JOIN' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Game Code</label>
              <input 
                type="text" 
                value={gameIdInput}
                onChange={(e) => setGameIdInput(e.target.value.toUpperCase())}
                className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:outline-none focus:border-red-500"
                placeholder="Enter 6-letter code"
              />
            </div>
            <div className="flex space-x-4">
              <button 
                onClick={() => setMode('MENU')}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded transition"
              >
                Back
              </button>
              <button 
                onClick={() => name && gameIdInput && joinGame(gameIdInput, name)}
                disabled={!name || !gameIdInput}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded transition"
              >
                Join
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
