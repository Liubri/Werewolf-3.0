"use client";

import { useSocket } from "../context/SocketContext";
import { Lobby } from "../components/Lobby";
import { GameRoom } from "../components/GameRoom";
import { GamePhase } from "../types/game";

export default function Home() {
  const { gameState } = useSocket();

  if (!gameState || gameState.phase === GamePhase.LOBBY) {
    return <Lobby />;
  }

  return <GameRoom />;
}
