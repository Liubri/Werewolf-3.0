import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { GamePhase, RoleType } from '../types/game';

interface ActionPanelProps {
  selectedId: string | null;
  myPlayer: any;
  secondTarget: string | null;
  setSecondTarget: (target: string | null) => void;
  setNightStatus: React.Dispatch<React.SetStateAction<Record<string, { protected?: boolean; poisoned?: boolean; asleep?: boolean }>>>;
}
export const ActionPanel: React.FC<ActionPanelProps> = ({ selectedId, myPlayer, secondTarget, setSecondTarget, setNightStatus: setNightStatus }) => {
  const { gameState, sendNightAction, sendVote, nextPhase } = useSocket();
  const [clicked, setClicked] = useState(false);
  const [clicked_2, setClicked_2] = useState(false);
  const [merchantClicked, setMerchantClicked] = useState(false);

  useEffect(() => {
    setClicked(false);
    setMerchantClicked(false);
    setSecondTarget(null);
  }, [gameState?.phase === GamePhase.NIGHT]);

  if (!gameState || !myPlayer) return null;

  const isNight = gameState.phase === GamePhase.NIGHT;
  const isDay = gameState.phase === GamePhase.DAY || gameState.phase === GamePhase.VOTING;
  const isAlive = myPlayer.isAlive;
  const nightNumber = gameState.nightNumber;

  if (!isAlive) {
    return (
      <div className="bg-gray-800 p-4 rounded-t-lg border-t border-gray-700 text-center">
        <p className="text-gray-400">You are dead. You can watch but not speak.</p>
      </div>
    );
  }

  function isButtonDisabled() {
    if (clicked) return true;
    if (!selectedId) return true;
    if (myPlayer.role?.type === RoleType.VILLAGER && isNight) return true;
    if (myPlayer.role?.type === RoleType.DEMONHUNTER && nightNumber < 2) return true;
    return false;
  }

  const nightButtonTexts: Record<RoleType, string> = {
    WITCH: 'Poison',
    WEREWOLF: 'Confirm Kill',
    SEER: 'Check Player',
    DREAMKEEPER: 'Sleep',
    VILLAGER: 'Vote',
    HUNTER: '',
    WOLFBEAUTY: 'Confirm Kill',
    MAGICIAN: 'Swap',
    GUARD: 'Guard',
    DEMONHUNTER: 'Hunt',
    KNIGHT: 'Duel',
    GRAVEDIGGER: '',
    FOOL: '',
    CROW: 'Curse',
    MIRACLEMERCHANT: '',
  };

  const roleType: RoleType = myPlayer.role!.type!; // non-null assertion
  const buttonText = isNight
    ? nightButtonTexts[roleType]
    : 'Vote';

  const handleAction = (type?: string) => {
    if (!selectedId) return;

    if (isNight) {
      // Configuration map for role actions
      const roleActionConfig: Record<RoleType, {
        action: string;
        data?: any;
        statusEffect?: { protected?: boolean; poisoned?: boolean; asleep?: boolean };
        customHandler?: () => boolean; // Return false to skip default handling
      }> = {
        [RoleType.WEREWOLF]: { action: 'KILL' },
        [RoleType.SEER]: { action: 'CHECK' },
        [RoleType.DREAMKEEPER]: {
          action: 'SLEEP',
          statusEffect: { asleep: true }
        },
        [RoleType.WITCH]: {
          action: type ? 'SAVE' : 'POISON',
          data: { potionType: type ?? 'POISON' },
          statusEffect: type ? undefined : { poisoned: true } // Only poison gets optimistic update
        },
        [RoleType.GUARD]: {
          action: 'GUARD',
          statusEffect: { protected: true }
        },
        [RoleType.WOLFBEAUTY]: {
          action: 'CHARM',
          data: { charmType: type ?? 'CHARM' }
        },
        [RoleType.MAGICIAN]: {
          action: 'SWAP',
          customHandler: () => {
            if (!secondTarget) {
              setSecondTarget(selectedId);
              console.log("First selection: ", selectedId);
              return false; // Skip default handling
            }
            console.log("Second selection: ", selectedId);
            console.log("Swapping:", secondTarget, "<->", selectedId);
            return true; // Continue with default handling
          },
          data: { secondaryTargetId: secondTarget }
        },
        [RoleType.VILLAGER]: { action: '' }, // No night action
        [RoleType.HUNTER]: { action: '' }, // No night action
        [RoleType.DEMONHUNTER]: { action: 'HUNT' }, // No night action
        [RoleType.KNIGHT]: { action: 'DUEL' }, // No night action
        [RoleType.GRAVEDIGGER]: { action: '' },
        [RoleType.FOOL]: { action: '' }, // No night action
        [RoleType.CROW]: { action: 'CURSE' },
        [RoleType.MIRACLEMERCHANT]: {
          action: 'MERCHANT_GIVE',
          data: { abilityType: type }
        },
      };

      const roleType = myPlayer.role?.type;
      const config = roleActionConfig[roleType as RoleType];

      if (config) {
        // Run custom handler if exists
        if (config.customHandler && !config.customHandler()) {
          return; // Custom handler said to skip
        }

        // Apply optimistic UI update if configured
        if (config.statusEffect) {
          setNightStatus(prev => ({
            ...prev,
            [selectedId]: config.statusEffect!
          }));
        }

        // Send action if configured
        if (config.action) {
          setClicked(true);
          sendNightAction(config.action, selectedId, config.data);

          // Reset second target for Magician after sending
          if (roleType === RoleType.MAGICIAN) {
            setSecondTarget(null);
          }
        }
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

          {isNight && myPlayer.role?.type === RoleType.MIRACLEMERCHANT && (
            <>
              <button
                onClick={() => handleAction('POISON')}
                disabled={clicked || !selectedId}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Give Poison
              </button>
              <button
                onClick={() => handleAction('SEER')}
                disabled={clicked || !selectedId}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Give Sight
              </button>
              <button
                onClick={() => handleAction('GUARD')}
                disabled={clicked || !selectedId}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Give Guard
              </button>
            </>
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

          {isNight && myPlayer?.merchantPoison && (
            <button
              onClick={() => {
                if (selectedId) {
                  sendNightAction('MERCHANT_POISON', selectedId);
                  setMerchantClicked(true);
                }
              }}
              disabled={merchantClicked || !selectedId}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Use Poison
            </button>
          )}

          {isNight && myPlayer?.merchantSeer && (
            <button
              onClick={() => {
                if (selectedId) {
                  sendNightAction('MERCHANT_SEER', selectedId);
                  setMerchantClicked(true);
                }
              }}
              disabled={merchantClicked || !selectedId}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Inspect
            </button>
          )}

          {isNight && myPlayer?.merchantGuard && (
            <button
              onClick={() => {
                if (selectedId) {
                  sendNightAction('MERCHANT_GUARD', selectedId);
                  setMerchantClicked(true);
                }
              }}
              disabled={merchantClicked || !selectedId}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Guard
            </button>
          )}

          {(isDay || (isNight && buttonText)) && (
            <button
              onClick={() => handleAction()}
              disabled={isButtonDisabled()}
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
