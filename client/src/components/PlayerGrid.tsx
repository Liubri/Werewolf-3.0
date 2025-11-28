import React from 'react';
import { Player } from '../types/game';

interface PlayerGridProps {
  players: Player[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  myId: string;
  disableSelfSelect?: boolean; // For roles like Dreamkeeper that can't target themselves
  werewolfTargets?: Record<string, string> | null; // werewolfId -> targetId
}

export const PlayerGrid: React.FC<PlayerGridProps> = ({ players, selectedId, onSelect, myId, disableSelfSelect = false, werewolfTargets }) => {
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

  // Create a mapping of werewolf IDs to colors
  const werewolfColorMap = new Map<string, typeof werewolfColors[0]>();
  if (werewolfTargets) {
    const werewolfIds = Object.keys(werewolfTargets);
    werewolfIds.forEach((id, index) => {
      werewolfColorMap.set(id, werewolfColors[index % werewolfColors.length]);
    });
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {players.map((player) => {
        const isMe = player.id === myId;
        const isSelected = player.id === selectedId;
        const isDead = !player.isAlive;
        const isDisabled = isDead || (disableSelfSelect && isMe);

        // Find which werewolves are targeting this player
        const targetingWerewolves: Array<{ id: string; name: string; color: typeof werewolfColors[0] }> = [];
        if (werewolfTargets) {
          Object.entries(werewolfTargets).forEach(([werewolfId, targetId]) => {
            if (targetId === player.id) {
              const werewolfPlayer = players.find(p => p.id === werewolfId);
              const color = werewolfColorMap.get(werewolfId) || werewolfColors[0];
              if (werewolfPlayer) {
                targetingWerewolves.push({ id: werewolfId, name: werewolfPlayer.name, color });
              }
            }
          });
        }

        // Build ring classes for werewolf targets
        let ringClasses = '';
        if (targetingWerewolves.length > 0) {
          // For multiple rings, we'll use the first werewolf's color and add a special style
          const primaryColor = targetingWerewolves[0].color.ring;
          ringClasses = `ring-4 ${primaryColor}`;
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
            
            {/* Werewolf name labels */}
            {targetingWerewolves.length > 0 && !isDead && (
              <div className="mt-1 flex flex-wrap gap-1 justify-center">
                {targetingWerewolves.map((werewolf) => (
                  <span
                    key={werewolf.id}
                    className={`text-xs px-2 py-0.5 rounded-full ${werewolf.color.bg} text-white font-semibold`}
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
          </div>
        );
      })}
    </div>
  );
};
