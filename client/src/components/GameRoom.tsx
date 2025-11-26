import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { PlayerGrid } from './PlayerGrid';
import { ActionPanel } from './ActionPanel';
import { GamePhase } from '../types/game';

import { RoleCard } from './RoleCard';

export const GameRoom: React.FC = () => {
  const { gameState, socket } = useSocket();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [myId, setMyId] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);
  const [showRole, setShowRole] = useState(true);

  useEffect(() => {
    if (socket) {
      setMyId(socket.id || '');
      
      socket.on('SEER_RESULT', (data: any) => {
        setNotification(`Seer Result: ${data.targetName} is a ${data.isWerewolf ? 'WEREWOLF' : 'VILLAGER'}`);
        setTimeout(() => setNotification(null), 8000);
      });
    }
  }, [socket]);

  if (!gameState) return null;

  const me = gameState.players.find(p => p.socketId === myId);
  console.log("Me: ", me)

  const toggleSelect = (id: string) => {
    setSelectedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-24">
      {/* Role Reveal */}
      {showRole && me?.role && (
        <RoleCard 
          roleName={me.role.name}
          roleType={me.role.type}
          description={me.role.description}
          onDismiss={() => setShowRole(false)}
        />
      )}

      {/* Header */}
      <div className="bg-gray-800 p-4 shadow-md flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-red-500">Werewolf</h1>
          <span className="text-sm text-gray-400">Room: {gameState.id}</span>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{gameState.phase}</div>
          {notification && <div className="text-yellow-400 text-sm animate-pulse">{notification}</div>}
        </div>
        <div className="text-right">
          <div className="font-bold">{me?.name}</div>
          <div className="text-sm text-blue-400 cursor-pointer hover:underline" onClick={() => setShowRole(true)}>
            {me?.role?.name || 'Unknown'}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto mt-8">
        {gameState.phase === GamePhase.GAME_OVER && (
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-yellow-500">
              {gameState.winner} WINS!
            </h2>
          </div>
        )}
        
        <PlayerGrid 
          players={gameState.players} 
          selectedId={selectedId} 
          onSelect={toggleSelect}
          myId={me?.id || ''}
        />
      </div>

      {/* Footer Actions */}
      <ActionPanel selectedId={selectedId} myPlayer={me} />
    </div>
  );
};
