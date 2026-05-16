import React from 'react';
import { Player, Team } from '../types/game';

interface PlayerGridProps {
  players: Player[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  myId: string;
  disableSelfSelect?: boolean; // For roles like Dreamkeeper that can't target themselves
  werewolfTargets?: Record<string, string> | null; // werewolfId -> targetId (real-time selections)
  werewolfVotes?: Record<string, string> | null; // werewolfId -> targetId (confirmed kills)
  nightKillTarget?: string | null; // The confirmed kill target (visible to Witch)
  isNight?: boolean; // Whether it's the night phase
  disabledIds?: string[]; // Player IDs that cannot be selected (e.g., Magician's first target, Guard's last protected)
  seerResults?: Record<string, boolean>; // targetId -> isWerewolf
  nightStatus?: Record<string, { protected?: boolean; poisoned?: boolean; asleep?: boolean }>; // Optimistic UI updates
}

export const PlayerGrid: React.FC<PlayerGridProps> = ({ players, selectedId, onSelect, myId, disableSelfSelect = false, werewolfTargets, werewolfVotes, nightKillTarget, isNight = false, disabledIds = [], seerResults = {}, nightStatus = {} }) => {
  // Define colors for different werewolves
  const werewolfColors = [
    { ring: 'ring-red-500', bg: 'bg-red-500', text: 'text-red-500' },
    { ring: 'ring-blue-500', bg: 'bg-blue-500', text: 'text-blue-500' },
    { ring: 'ring-green-500', bg: 'bg-green-500', text: 'text-green-500' },
    { ring: 'ring-yellow-500', bg: 'bg-yellow-500', text: 'text-yellow-500' },
    { ring: 'ring-purple-500', bg: 'bg-purple-500', text: 'text-purple-500' },
    { ring: 'ring-orange-500', bg: 'bg-orange-500', text: 'text-orange-500' },
    { ring: 'ring-pink-500', bg: 'bg-pink-500', text: 'text-pink-500' },
    { ring: 'ring-cyan-500', bg: 'bg-cyan-500', text: 'text-cyan-500' },
  ];

  // Create a mapping of werewolf IDs to colors using consistent hashing
  // Each werewolf ID always gets the same color regardless of when they join
  const werewolfColorMap = new Map<string, typeof werewolfColors[0]>();
  const getWerewolfColor = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return werewolfColors[Math.abs(hash) % werewolfColors.length];
  };

  const allWerewolfIds = new Set<string>();
  if (werewolfTargets) {
    Object.keys(werewolfTargets).forEach(id => allWerewolfIds.add(id));
  }
  if (werewolfVotes) {
    Object.keys(werewolfVotes).forEach(id => allWerewolfIds.add(id));
  }
  allWerewolfIds.forEach(id => {
    werewolfColorMap.set(id, getWerewolfColor(id));
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {players.map((player) => {
        const isMe = player.id === myId;
        const isSelected = player.id === selectedId;
        const isDead = !player.isAlive;
        const isInDisabledList = disabledIds.includes(player.id);
        const isDisabled = isDead || (disableSelfSelect && isMe) || isInDisabledList;

        // Helper to find werewolves targeting this player from a target map
        const findWerewolvesTargeting = (targetMap: Record<string, string> | null | undefined) => {
          const result: Array<{ id: string; name: string; color: typeof werewolfColors[0] }> = [];
          if (!targetMap) return result;
          Object.entries(targetMap).forEach(([werewolfId, targetId]) => {
            if (targetId === player.id) {
              const werewolfPlayer = players.find(p => p.id === werewolfId);
              const color = werewolfColorMap.get(werewolfId) || werewolfColors[0];
              if (werewolfPlayer) {
                result.push({ id: werewolfId, name: werewolfPlayer.name, color });
              }
            }
          });
          return result;
        };

        const targetingWerewolves = findWerewolvesTargeting(werewolfTargets); // Real-time selections
        const votingWerewolves = findWerewolvesTargeting(werewolfVotes); // Confirmed kills

        // Show kill target indicator for non-werewolf viewers (Witch) during night phase
        const isKillTarget = isNight && !werewolfTargets && !!nightKillTarget && player.id === nightKillTarget;

        // Build ring classes for werewolf targets
        // Prioritize confirmed votes, then show real-time selections
        let ringClasses = '';
        if (votingWerewolves.length > 0) {
          // Show confirmed kill with thicker ring
          const primaryColor = votingWerewolves[0].color.ring;
          ringClasses = `ring-8 ${primaryColor}`;
        } else if (targetingWerewolves.length > 0) {
          // Show real-time selection with thinner ring
          const primaryColor = targetingWerewolves[0].color.ring;
          ringClasses = `ring-4 ${primaryColor}`;
        } else if (isKillTarget) {
          ringClasses = 'ring-4 ring-red-500';
        }

        // Override with player's own selection
        if (isSelected) {
          ringClasses = 'ring-4 ring-white transform scale-105';
        }

        return (
          <div
            key={player.id}
            onClick={() => !isDisabled && onSelect(player.id)}
            className={`
              group relative flex flex-col items-center justify-center p-4 rounded-lg transition-all
              ${isDisabled ? 'bg-gray-700 cursor-not-allowed' : 'bg-gray-700 hover:bg-gray-600 cursor-pointer'}
              ${isDead && 'grayscale'}
              ${ringClasses}
              ${isMe ? 'border-2 border-blue-400' : ''}
            `}
          >
            <div className="w-16 h-16 bg-gray-500 rounded-full mb-2 flex items-center justify-center text-2xl font-bold">
              {player.name.charAt(0).toUpperCase()}
            </div>
            <span className="font-bold text-lg truncate w-full text-center">{player.name}</span>
            {isMe && <span className="text-xs text-blue-300">(You)</span>}
            {isDead && <span className="text-xs text-red-500 font-bold">DEAD</span>}

            {/* Night Status Indicators */}
            <div className="flex gap-1 mt-1">
              {isKillTarget && !isDead && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-700 text-white font-semibold" title="Targeted by werewolves">
                  ⚔️ Target
                </span>
              )}
              {((player.protected && player.protected === myId) && !isDead) && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600 text-white font-semibold" title="Protected">
                  🛡️
                </span>
              )}
              {((player.poisoned || player.poisoned === myId) && !isDead) && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-600 text-white font-semibold" title="Poisoned">
                  ☠️
                </span>
              )}
              {((player.asleep || player.asleep === myId) && !isDead) && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-600 text-white font-semibold" title="Asleep">
                  💤
                </span>
              )}
              {(player.knightRevealed) && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-600 text-white font-semibold" title="Knight">
                  knight
                </span>
              )}
              {(player.foolRevealed) && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-600 text-white font-semibold" title="Fool">
                  fool
                </span>
              )}
              {(player.graveDiggerId && player.graveDiggerId === myId) && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-700 text-white font-semibold" title={player.role?.team === 'WEREWOLF' ? 'Bad' : 'Good'}>
                  {player.role?.team === Team.WEREWOLF ? '🐺 Bad' : '🌾 Good'}
                </span>
              )}
            </div>

            {/* Werewolf selections (confirmed and real-time) */}
            {(votingWerewolves.length > 0 || targetingWerewolves.length > 0) && !isDead && (
              <div className="mt-1 flex flex-wrap gap-1 justify-center">
                {/* Confirmed kills first (with checkmark and border) */}
                {votingWerewolves.map((werewolf) => (
                  <span
                    key={werewolf.id}
                    className={`text-xs px-2 py-0.5 rounded-full ${werewolf.color.bg} text-white font-semibold border-2 border-white`}
                    title="Confirmed kill"
                  >
                    ✓ {werewolf.name}
                  </span>
                ))}
                {/* Real-time selections (no checkmark, reduced opacity) */}
                {targetingWerewolves.map((werewolf) => (
                  <span
                    key={werewolf.id}
                    className={`text-xs px-2 py-0.5 rounded-full ${werewolf.color.bg} text-white font-semibold opacity-70`}
                  >
                    {werewolf.name}
                  </span>
                ))}
              </div>
            )}

            {disableSelfSelect && isMe && !isDead && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="bg-black bg-opacity-80 text-yellow-300 text-xs px-2 py-1 rounded-lg">
                  Can't target self
                </span>
              </div>
            )}

            {isInDisabledList && !isDead && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="bg-black bg-opacity-80 text-cyan-300 text-xs px-2 py-1 rounded-lg">
                  Cannot select
                </span>
              </div>
            )}

            {/* Seer Results Indicator */}
            {seerResults && seerResults[player.id] !== undefined && !isDead && (
              <>
                {/* Persistent Badge */}
                <div className="absolute top-2 right-2">
                  {seerResults[player.id] ? (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white text-xs font-bold border-2 border-white shadow-md" title="Werewolf">
                      W
                    </span>
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white text-xs font-bold border-2 border-white shadow-md" title="Villager">
                      V
                    </span>
                  )}
                </div>

                {/* Hover Tooltip */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <span className={`
                    bg-black bg-opacity-90 text-xs px-3 py-1.5 rounded-lg font-bold shadow-lg transform translate-y-8
                    ${seerResults[player.id] ? 'text-red-500' : 'text-green-400'}
                  `}>
                    {seerResults[player.id] ? 'BAD' : 'GOOD'}
                  </span>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};
