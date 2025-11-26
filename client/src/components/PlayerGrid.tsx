import React from 'react';
import { Player } from '../types/game';

interface PlayerGridProps {
  players: Player[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  myId: string;
}

export const PlayerGrid: React.FC<PlayerGridProps> = ({ players, selectedId, onSelect, myId }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {players.map((player) => {
        const isMe = player.id === myId;
        const isSelected = player.id === selectedId;
        const isDead = !player.isAlive;

        return (
          <div
            key={player.id}
            onClick={() => !isDead && onSelect(player.id)}
            className={`
              relative flex flex-col items-center justify-center p-4 rounded-lg cursor-pointer transition-all
              ${isDead ? 'bg-gray-800 opacity-50 grayscale' : 'bg-gray-700 hover:bg-gray-600'}
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
          </div>
        );
      })}
    </div>
  );
};
