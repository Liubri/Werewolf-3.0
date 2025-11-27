import React, { useState, useEffect } from 'react';

interface Player {
  id: string;
  name: string;
}

interface HunterRevengeModalProps {
  eligibleTargets: Player[];
  timeLimit: number; // in milliseconds
  onConfirm: (targetId: string | null) => void;
}

export const HunterRevengeModal: React.FC<HunterRevengeModalProps> = ({
  eligibleTargets,
  timeLimit,
  onConfirm
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedRef = React.useRef<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(timeLimit / 1000); // Convert to seconds
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    selectedRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    // Trigger reveal animation
    const revealTimer = setTimeout(() => setRevealed(true), 100);
    return () => clearTimeout(revealTimer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
    setTimeRemaining(prev => {
      if (prev <= 1) {
        clearInterval(interval);
        onConfirm(selectedRef.current ?? null);
        console.log("Time's up! Selected target:", selectedId);
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(interval);
}, []); // do NOT include selectedId

  function handleConfirm() {
    if (selectedId) {
      onConfirm(selectedId);
    }
  }

  function handleSkip() {
    onConfirm(null);
  }

  return (
    <div className={`
      fixed inset-0 z-50 flex items-center justify-center 
      bg-black transition-opacity duration-1000
      ${revealed ? 'bg-opacity-90' : 'bg-opacity-0'}
    `}>
      <div className={`
        relative w-full max-w-2xl mx-4 rounded-xl border-4 border-red-600 
        bg-gradient-to-br from-red-950 to-gray-900 shadow-2xl
        transform transition-all duration-500
        ${revealed ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}
      `}>
        {/* Death animation glow */}
        <div className="absolute inset-0 rounded-xl bg-red-600 opacity-20 animate-pulse"></div>
        
        <div className="relative p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-4xl font-bold text-red-500 mb-2 animate-pulse">
              🎯 Hunter's Final Shot
            </h2>
            <p className="text-xl text-gray-200 mb-4">
              You've been eliminated! Choose one player to take down with you.
            </p>
            
            {/* Timer */}
            <div className={`
              inline-block px-6 py-3 rounded-lg font-bold text-2xl
              ${timeRemaining <= 10 ? 'bg-red-600 animate-pulse' : 'bg-gray-800'}
              ${timeRemaining <= 5 ? 'text-yellow-300' : 'text-white'}
            `}>
              ⏱️ {timeRemaining}s
            </div>
          </div>

          {/* Player Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6 max-h-64 p-1">
            {eligibleTargets.map(player => (
              <button
                key={player.id}
                onClick={() => {
                  setSelectedId(player.id)
                  console.log(player.id)
                }}
                className={`
                  p-4 rounded-lg border-2 transition-all duration-200
                  ${selectedId === player.id
                    ? 'border-red-500 bg-red-900 scale-105 shadow-lg shadow-red-500/50'
                    : 'border-gray-600 bg-gray-800 hover:border-red-400 hover:bg-gray-700'
                  }
                `}
              >
                <div className="text-white font-semibold">{player.name}</div>
                {selectedId === player.id && (
                  <div className="text-red-400 text-sm mt-1">🎯 Selected</div>
                )}
              </button>
            ))}
          </div>

          <div className="flex justify-center mt-6 gap-1">
          {/* Skip Button */}
          <button
            onClick={handleSkip}
            className="
              w-full py-4 rounded-lg font-bold text-xl transition-all 
                 bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl"
          >
            Skip
          </button>
          

          {/* Confirm Button */}
          <button
            onClick={handleConfirm}
            disabled={!selectedId}
            className={`
              w-full py-4 rounded-lg font-bold text-xl transition-all
              ${selectedId
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {selectedId ? '🏹 Take Your Shot' : 'Select a Target'}
          </button>
          </div>
          {timeRemaining <= 10 && (
            <p className="text-center text-yellow-300 text-sm mt-4 animate-bounce">
              ⚠️ Time is running out!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
