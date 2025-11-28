import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { PlayerGrid } from './PlayerGrid';
import { ActionPanel } from './ActionPanel';
import { GamePhase, RoleType } from '../types/game';

import { RoleCard } from './RoleCard';
import { HunterRevengeModal } from './HunterRevengeModal';

export const GameRoom: React.FC = () => {
  const { gameState, socket, sendHunterRevenge, sendWerewolfSelection } = useSocket();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [myId, setMyId] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);
  const [showRole, setShowRole] = useState(true);
  const [showHunterRevenge, setShowHunterRevenge] = useState(false);
  const [hunterRevengeData, setHunterRevengeData] = useState<any>(null);
  const [debugShowModal, setDebugShowModal] = useState(false); // DEBUG

  useEffect(() => {
    if (socket) {
      setMyId(socket.id || '');
      
      socket.on('SEER_RESULT', (data: any) => {
        setNotification(`Seer Result: ${data.targetName} is a ${data.isWerewolf ? 'WEREWOLF' : 'VILLAGER'}`);
        setTimeout(() => setNotification(null), 8000);
      });

      socket.on('HUNTER_REVENGE_TRIGGER', (data: any) => {
        setHunterRevengeData(data);
        setShowHunterRevenge(true);
      });

      socket.on('HUNTER_REVENGE_ACTIVE', (data: any) => {
        setNotification(`⚔️ ${data.hunterName} is taking their final shot...`);
        setTimeout(() => setNotification(null), 10000);
      });

      return () => {
        socket.off('SEER_RESULT');
        socket.off('HUNTER_REVENGE_TRIGGER');
        socket.off('HUNTER_REVENGE_ACTIVE');
      };
    }
  }, [socket]);

  if (!gameState) return null;

  const me = gameState.players.find(p => p.socketId === myId);
  // console.log("Me: ", me)

  const toggleSelect = (id: string) => {
    setSelectedId(prev => {
      const newSelection = prev === id ? null : id;
      
      // Send real-time werewolf selection if this is a werewolf during night phase
      if (me?.role?.type === RoleType.WEREWOLF && gameState.phase === GamePhase.NIGHT) {
        sendWerewolfSelection(newSelection || ''); // Send empty string for deselection
      }
      
      return newSelection;
    });
  };

  const handleHunterRevenge = (targetId: string | null) => {
    if (targetId !== null) {
      sendHunterRevenge(targetId);
    }
    // Defer state updates to avoid updating during render
    setTimeout(() => {
      setShowHunterRevenge(false);
      setHunterRevengeData(null);
      setDebugShowModal(false); // DEBUG
    }, 0);
  };

  // DEBUG: Mock data for testing modal
  const mockHunterRevengeData = {
    eligibleTargets: [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
      { id: '3', name: 'Charlie' },
      { id: '4', name: 'Diana' },
      { id: '5', name: 'Eve' },
      { id: '6', name: 'Frank' },
    ],
    timeLimit: 30000
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

      {/* Hunter Revenge Modal */}
      {(showHunterRevenge && hunterRevengeData) || debugShowModal ? (
        <HunterRevengeModal
          eligibleTargets={debugShowModal ? mockHunterRevengeData.eligibleTargets : hunterRevengeData.eligibleTargets}
          timeLimit={debugShowModal ? mockHunterRevengeData.timeLimit : hunterRevengeData.timeLimit}
          onConfirm={handleHunterRevenge}
        />
      ) : null}

      {/* Header */}
      <div className="bg-gray-800 p-4 shadow-md flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-red-500">Werewolf</h1>
          <span className="text-sm text-gray-400">Room: {gameState.id}</span>
          {/* DEBUG BUTTON */}
          <button 
            onClick={() => setDebugShowModal(!debugShowModal)}
            className="ml-4 px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded"
          >
            {debugShowModal ? 'Hide' : 'Show'} Hunter Modal
          </button>
        </div>
        <div className="text-center pr-12">
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
          disableSelfSelect={gameState.phase === GamePhase.NIGHT && me?.role?.type === RoleType.DREAMKEEPER}
          werewolfTargets={gameState.werewolfTargets}
        />
      </div>

      {/* Footer Actions */}
      <ActionPanel selectedId={selectedId} myPlayer={me} />
    </div>
  );
};
