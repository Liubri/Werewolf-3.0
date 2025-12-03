import React, { useState, useEffect } from 'react';
import { RoleType } from '../types/game';

interface RoleCardProps {
  roleName: string;
  roleType: RoleType;
  description: string;
  onDismiss: () => void;
}

export const RoleCard: React.FC<RoleCardProps> = ({ roleName, roleType, description, onDismiss }) => {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const getRoleColor = () => {
    switch (roleType) {
      case RoleType.WEREWOLF: return 'bg-red-900 border-red-500';
      case RoleType.VILLAGER: return 'bg-blue-900 border-blue-500';
      case RoleType.SEER: return 'bg-purple-900 border-purple-500';
      case RoleType.WITCH: return 'bg-green-900 border-green-500';
      case RoleType.DREAMKEEPER: return 'bg-indigo-900 border-indigo-500';
      case RoleType.WOLFBEAUTY: return 'bg-pink-900 border-pink-500';
      case RoleType.MAGICIAN: return 'bg-cyan-900 border-cyan-500';
      case RoleType.GUARD: return 'bg-orange-900 border-orange-500';
      default: return 'bg-gray-800 border-gray-500';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-opacity-90 transition-opacity duration-1000">
      <div
        className={`
          relative w-80 h-96 rounded-xl border-4 shadow-2xl transform transition-all ease-in duration-300 cursor-pointer
          ${revealed ? 'opacity-100' : 'opacity-0'}
          ${getRoleColor()}
        `}
        onClick={onDismiss}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">{roleName}</h2>
          <div className="w-32 h-32 bg-black bg-opacity-30 rounded-full mb-6 flex items-center justify-center text-4xl">
            {roleName[0]}
          </div>
          <p className="text-gray-200">{description}</p>
          <p className="mt-8 text-sm text-gray-400 animate-bounce">Tap to continue</p>
        </div>
      </div>
    </div>
  );
};
