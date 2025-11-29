import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { GamePhase, RoleType } from '../types/game';

interface ActionPanelProps {
  selectedId: string | null;
  myPlayer: any;
  secondTarget: string | null;
  setSecondTarget: (target: string | null) => void;
}
export const ActionPanel: React.FC<ActionPanelProps> = ({ selectedId, myPlayer, secondTarget, setSecondTarget }) => {
  const { gameState, sendNightAction, sendVote, nextPhase } = useSocket();
  const [clicked, setClicked] = useState(false);
  const [clicked_2, setClicked_2] = useState(false);

  useEffect(() => {
    setClicked(false);
    setSecondTarget(null);
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

  const nightButtonTexts: Record<RoleType, string> = {
    WITCH: 'Poison',
    WEREWOLF: 'Confirm Kill',
    SEER: 'Check Player',
    DREAMKEEPER: 'Sleep',
    VILLAGER: 'Vote',
    HUNTER: '',
    WOLFBEAUTY: 'Confirm Kill',
    MAGICIAN: 'Swap'
  };

  const roleType: RoleType = myPlayer.role!.type!; // non-null assertion
  const buttonText = isNight
    ? nightButtonTexts[roleType]
    : 'Vote';

  const handleAction = (type?: string) => {
    if (!selectedId) return;

    if (isNight) {
      // Role specific actions
      if (myPlayer.role?.type === RoleType.WEREWOLF) {
        setClicked(true);
        sendNightAction('KILL', selectedId);
      } else if (myPlayer.role?.type === RoleType.SEER) {
        setClicked(true);
        sendNightAction('CHECK', selectedId);
      } else if (myPlayer.role?.type === RoleType.DREAMKEEPER) {
        setClicked(true);
        sendNightAction('SLEEP', selectedId);
      } else if (myPlayer.role?.type === RoleType.WITCH) {
        setClicked(true);
        // Witch UI is complex (Save/Poison). 
        // For MVP, if they select someone, assume Poison?
        // Or we need separate buttons.
        // Let's just implement Poison here for simplicity if they select someone.
        // Save is usually a prompt "X is dying, save?".
        sendNightAction(type ? 'SAVE' : 'POISON', selectedId, { potionType: type ?? 'POISON' });
      } else if (myPlayer.role?.type === RoleType.WOLFBEAUTY) {
        setClicked(true);
        sendNightAction('CHARM', selectedId, { charmType: type ?? 'CHARM' });
      } else if (myPlayer.role?.type === RoleType.MAGICIAN) {
        if (!secondTarget) {
          // First selection - store it and wait for second
          setSecondTarget(selectedId);
          console.log("First selection: ", selectedId);
          return;
        }
        // Second selection - send both targets
        console.log("Second selection: ", selectedId);
        console.log("Swapping:", secondTarget, "<->", selectedId);
        setClicked(true);
        sendNightAction('SWAP', selectedId, { secondaryTargetId: secondTarget });
        setSecondTarget(null);
      }
    } else if (isDay) {
      setClicked(true);
      sendVote(selectedId);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 p-4 border-t border-gray-700 shadow-lg">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="text-sm text-gray-400">
          Phase: <span className="text-white font-bold">{gameState.phase}</span>
          {selectedId && <span className="ml-4">Selected: {gameState.players.find(p => p.id === selectedId)?.name}</span>}
          {secondTarget && myPlayer.role?.type === RoleType.MAGICIAN && (
            <span className="ml-4 text-cyan-400">
              First target: {gameState.players.find(p => p.id === secondTarget)?.name} (select second target)
            </span>
          )}
        </div>

        <div className="flex space-x-4">
          {/* Debug Button */}
          <button onClick={nextPhase} className="px-2 py-1 bg-gray-700 text-xs rounded">Dev: Next Phase</button>

          {isNight && myPlayer.role?.type === RoleType.WITCH && (
            <button
              onClick={() => {
                handleAction('SAVE')
              }}
              disabled={clicked || !selectedId || !myPlayer.role.hasSavePotion || isDay}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Heal
            </button>
          )}

          {isNight && myPlayer.role?.type === RoleType.WOLFBEAUTY && (
            <button
              onClick={() => {
                handleAction('CHARM')
                setClicked_2(true)
              }}
              disabled={clicked_2 || !selectedId || isDay}
              className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Charm
            </button>
          )}

          {(myPlayer.role?.type !== RoleType.HUNTER || isDay) && (
            <button
              onClick={() => handleAction()}
              disabled={clicked || !selectedId || (myPlayer.role?.type === RoleType.VILLAGER && isNight)}
              className={`
              font-bold py-2 px-6 rounded transition disabled:opacity-50 disabled:cursor-not-allowed
              ${isNight ? 'bg-purple-600 hover:bg-purple-700' : 'bg-red-600 hover:bg-red-700'}
              text-white
            `}
            >
              {buttonText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
