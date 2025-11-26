import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { GamePhase, RoleType } from '../types/game';

interface ActionPanelProps {
  selectedId: string | null;
  myPlayer: any;
}
export const ActionPanel: React.FC<ActionPanelProps> = ({ selectedId, myPlayer }) => {
  const { gameState, sendNightAction, sendVote, nextPhase } = useSocket();
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    setClicked(false);
  }, [gameState?.phase === GamePhase.NIGHT]);

  if (!gameState || !myPlayer) return null;

  const isNight = gameState.phase === GamePhase.NIGHT;
  const isDay = gameState.phase === GamePhase.DAY || gameState.phase === GamePhase.VOTING;
  const isAlive = myPlayer.isAlive;

  if (!isAlive) {
    return (
      <div className="bg-gray-800 p-4 rounded-t-lg border-t border-gray-700 text-center">
        <p className="text-gray-400">You are dead. You can watch but not speak.</p>
      </div>
    );
  }

  const handleAction = () => {
    if (!selectedId) return;
    setClicked(true);
    if (isNight) {
      // Role specific actions
      if (myPlayer.role?.type === RoleType.WEREWOLF) {
        sendNightAction('KILL', selectedId);
      } else if (myPlayer.role?.type === RoleType.SEER) {
        sendNightAction('CHECK', selectedId);
      } else if (myPlayer.role?.type === RoleType.DREAMKEEPER) {
        sendNightAction('PROTECT', selectedId);
      } else if (myPlayer.role?.type === RoleType.WITCH) {
        // Witch UI is complex (Save/Poison). 
        // For MVP, if they select someone, assume Poison?
        // Or we need separate buttons.
        // Let's just implement Poison here for simplicity if they select someone.
        // Save is usually a prompt "X is dying, save?".
        sendNightAction('POISON', selectedId);
      }
    } else if (isDay) {
      sendVote(selectedId);
    }
  };

  const handleWitchSave = () => {
    // Logic to save the nightKillTarget
    // We need to know who it is.
    // gameState.nightKillTarget should be visible to Witch?
    // In our Game.ts, we only sent nightKillTarget to Werewolves.
    // We should fix Game.ts to send it to Witch too.
    sendNightAction('SAVE', undefined); // Target implicit or passed?
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 p-4 border-t border-gray-700 shadow-lg">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="text-sm text-gray-400">
          Phase: <span className="text-white font-bold">{gameState.phase}</span>
          {selectedId && <span className="ml-4">Selected: {gameState.players.find(p => p.id === selectedId)?.name}</span>}
        </div>

        <div className="flex space-x-4">
          {/* Debug Button */}
          <button onClick={nextPhase} className="px-2 py-1 bg-gray-700 text-xs rounded">Dev: Next Phase</button>

          {isNight && myPlayer.role?.type === RoleType.WITCH && (
             <button 
               onClick={handleWitchSave}
               className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50 disabled:cursor-not-allowed"
             >
               Use Potion (Save)
             </button>
          )}

          <button
            onClick={handleAction}
            disabled={clicked || !selectedId || (myPlayer.role?.type === RoleType.VILLAGER && isNight)}
            className={`
              font-bold py-2 px-6 rounded transition disabled:opacity-50 disabled:cursor-not-allowed
              ${isNight ? 'bg-purple-600 hover:bg-purple-700' : 'bg-red-600 hover:bg-red-700'}
              text-white
            `}
          >
            {isNight ? 'Confirm Night Action' : 'Vote Player'}
          </button>
        </div>
      </div>
    </div>
  );
};
