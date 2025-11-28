import React from 'react';
import { Player } from '../types/game';

interface PlayerGridProps {
  players: Player[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  myId: string;
  disableSelfSelect?: boolean; // For roles like Dreamkeeper that can't target themselves
}

export const PlayerGrid: React.FC<PlayerGridProps> = ({ players, selectedId, onSelect, myId, disableSelfSelect = false }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {players.map((player) => {
        const isMe = player.id === myId;
        const isSelected = player.id === selectedId;
        const isDead = !player.isAlive;
        const isDisabled = isDead || (disableSelfSelect && isMe);

        return (
          <div
            key={player.id}
            onClick={() => !isDisabled && onSelect(player.id)}
            className={`
              group relative flex flex-col items-center justify-center p-4 rounded-lg transition-all
              ${isDisabled ? 'bg-gray-700 cursor-not-allowed' : 'bg-gray-700 hover:bg-gray-600 cursor-pointer'}
              ${isDead && 'grayscale'}
              ${isSelected ? 'ring-4 ring-red-500 transform scale-105' : ''}
              ${isMe ? 'border-2 border-blue-400' : ''}
            `}
          >
            <div className="w-16 h-16 bg-gray-500 rounded-full mb-2 flex items-center justify-center text-2xl font-bold">
              {player.name.charAt(0).toUpperCase()}
            </div>
            <span className="font-bold text-lg truncate w-full text-center">{player.name}</span>
            {isMe && <span className="text-xs text-blue-300">(You)</span>}
            {isDead && <span className="text-xs text-red-500 font-bold">DEAD</span>}
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
