import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { PlayerGrid } from './PlayerGrid';
import { ActionPanel } from './ActionPanel';
import { GamePhase, RoleType } from '../types/game';

import { RoleCard } from './RoleCard';
import { HunterRevengeModal } from './HunterRevengeModal';

export const GameRoom: React.FC = () => {
  const { gameState, socket, sendHunterRevenge, sendWolfKingRevenge, sendWerewolfSelection } = useSocket();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [myId, setMyId] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);
  const [showRole, setShowRole] = useState(true);
  const [showHunterRevenge, setShowHunterRevenge] = useState(false);
  const [hunterRevengeData, setHunterRevengeData] = useState<any>(null);
  const [showWolfKingRevenge, setShowWolfKingRevenge] = useState(false);
  const [wolfKingRevengeData, setWolfKingRevengeData] = useState<any>(null);
  const [debugShowModal, setDebugShowModal] = useState(false); // DEBUG
  const [secondTarget, setSecondTarget] = useState<string | null>(null); // For Magician's first target
  const [seerResults, setSeerResults] = useState<Record<string, boolean>>({}); // targetId -> isWerewolf
  const [whiteMaidenResults, setWhiteMaidenResults] = useState<Record<string, { roleName: string; isWerewolf: boolean }>>({}); // targetId -> { roleName, isWerewolf }
  const [wolfWitchResults, setWolfWitchResults] = useState<Record<string, string>>({}); // targetId -> roleName
  const [nightStatus, setNightStatus] = useState<Record<string, { protected?: boolean; poisoned?: boolean; asleep?: boolean }>>({}); // Optimistic UI updates

  useEffect(() => {
    if (socket) {
      setMyId(socket.id || '');

      socket.on('SEER_RESULT', (data: any) => {
        setNotification(`Seer Result: ${data.targetName} is a ${data.isWerewolf ? 'WEREWOLF' : 'VILLAGER'}`);
        setSeerResults(prev => ({
          ...prev,
          [data.targetId]: data.isWerewolf
        }));
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

      socket.on('WOLF_KING_REVENGE_TRIGGER', (data: any) => {
        setWolfKingRevengeData(data);
        setShowWolfKingRevenge(true);
      });

      socket.on('WOLF_KING_REVENGE_ACTIVE', (data: any) => {
        setNotification(`🐺 ${data.wolfKingName} is taking someone down with them...`);
        setTimeout(() => setNotification(null), 10000);
      });

      socket.on('WHITE_MAIDEN_RESULT', (data: any) => {
        setNotification(`White Maiden: ${data.targetName} is a ${data.isWerewolf ? 'WEREWOLF — eliminated!' : data.roleName}`);
        setWhiteMaidenResults(prev => ({
          ...prev,
          [data.targetId]: { roleName: data.roleName, isWerewolf: data.isWerewolf }
        }));
        setTimeout(() => setNotification(null), 8000);
      });

      socket.on('WOLF_WITCH_RESULT', (data: any) => {
        setNotification(`Wolf Witch: ${data.targetName} is a ${data.roleName}${data.willBeEliminated ? ' — eliminated!' : ''}`);
        setWolfWitchResults(prev => ({
          ...prev,
          [data.targetId]: data.roleName
        }));
        setTimeout(() => setNotification(null), 8000);
      });

      return () => {
        socket.off('SEER_RESULT');
        socket.off('HUNTER_REVENGE_TRIGGER');
        socket.off('HUNTER_REVENGE_ACTIVE');
        socket.off('WOLF_KING_REVENGE_TRIGGER');
        socket.off('WOLF_KING_REVENGE_ACTIVE');
        socket.off('WHITE_MAIDEN_RESULT');
        socket.off('WOLF_WITCH_RESULT');
      };
    }
  }, [socket]);

  // Reset night status when phase changes
  useEffect(() => {
    setNightStatus({});
  }, [gameState?.phase]);

  if (!gameState) return null;

  const me = gameState.players.find(p => p.socketId === myId);
  // console.log("Me: ", me)

  const toggleSelect = (id: string) => {
    setSelectedId(prev => {
      const newSelection = prev === id ? null : id;

      // Send real-time werewolf selection if this is a werewolf during night phase
      if (me?.role?.type === RoleType.WEREWOLF || me?.role?.type === RoleType.WOLFKING) {
        if (gameState.phase === GamePhase.NIGHT) {
          sendWerewolfSelection(newSelection || ''); // Send empty string for deselection
        }
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

  const handleWolfKingRevenge = (targetId: string | null) => {
    if (targetId !== null) {
      sendWolfKingRevenge(targetId);
    }
    setTimeout(() => {
      setShowWolfKingRevenge(false);
      setWolfKingRevengeData(null);
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

  const rolesThatCannotSelfSelect = new Set([
    RoleType.SEER,
    RoleType.DREAMKEEPER,
    RoleType.DEMONHUNTER,
    // add more roles here easily
  ]);

  const canSeeOtherWerewolves = new Set([
    RoleType.WEREWOLF,
    RoleType.WOLFKING,
    RoleType.WOLFWITCH,
    RoleType.WOLFBEAUTY,
  ]);

  function cannotSelfSelect(roleType?: RoleType): boolean {
    return rolesThatCannotSelfSelect.has(roleType as RoleType);
  }

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

      {showWolfKingRevenge && wolfKingRevengeData ? (
        <HunterRevengeModal
          eligibleTargets={wolfKingRevengeData.eligibleTargets.map((p: any) => ({ id: p.id, name: p.name }))}
          timeLimit={wolfKingRevengeData.timeLimit}
          onConfirm={handleWolfKingRevenge}
          title="Wolf King's Revenge"
          confirmText="Take Them Down"
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
          disableSelfSelect={cannotSelfSelect(me?.role?.type)}
          canSeeWerewolves={canSeeOtherWerewolves.has(me?.role?.type as RoleType)}
          werewolfTargets={gameState.werewolfTargets}
          werewolfVotes={gameState.werewolfVotes}
          nightKillTarget={gameState.nightKillTarget}
          isNight={gameState.phase === GamePhase.NIGHT}
          disabledIds={(() => {
            const disabled: string[] = [];

            if (gameState.phase == GamePhase.VOTING) {
              disabled.length = 0;
            }

            // Magician: Can't select the same player twice
            if (secondTarget && me?.role?.type === RoleType.MAGICIAN) {
              disabled.push(secondTarget);
            }

            // Guard: Can't guard the same person for two consecutive nights
            if (me?.role?.type === RoleType.GUARD && me?.role?.lastProtectedId && me?.role?.lastProtectedNight !== undefined) {
              // Only disable if the last protection was on the immediately previous night
              if (me.role.lastProtectedNight === gameState.nightNumber - 1) {
                disabled.push(me.role.lastProtectedId);
              }
            }

            // Crow: Can't curse the same person for two consecutive nights
            if (me?.role?.type === RoleType.CROW && me?.role?.lastCursedId && me?.role?.lastCursedNight !== undefined) {
              // Only disable if the last curse was on the immediately previous night
              if (me.role.lastCursedNight === gameState.nightNumber - 1) {
                disabled.push(me.role.lastCursedId);
              }
            }

            return disabled;
          })()}
          seerResults={seerResults}
          whiteMaidenResults={whiteMaidenResults}
          wolfWitchResults={wolfWitchResults}
          nightStatus={nightStatus}
        />
      </div>

      {/* Footer Actions */}
      <ActionPanel selectedId={selectedId} myPlayer={me} secondTarget={secondTarget} setSecondTarget={setSecondTarget} setNightStatus={setNightStatus} />
    </div>
  );
};
