import React from 'react';
import type { Ship } from '../types';
import './GameStatus.css';

interface GameStatusProps {
  gamePhase: 'setup' | 'playing' | 'gameOver';
  currentTurn: 'player' | 'ai';
  winner: 'player' | 'ai' | null;
  playerShips: Ship[];
  aiShips: Ship[];
  onStartGame: () => void;
  onResetGame: () => void;
  blueAIStats: { totalShots: number; hits: number };
  redAIStats: { totalShots: number; hits: number };
  // aiVsAi is now assumed to always be true
}

const GameStatus: React.FC<GameStatusProps> = ({
  gamePhase,
  currentTurn,
  winner,
  playerShips,
  aiShips,
  onStartGame,
  onResetGame,
  blueAIStats,
  redAIStats
}) => {
  const getShipStatus = (ships: Ship[]) => {
    const totalShips = ships.length;
    const sunkShips = ships.filter(ship => ship.hits.every(hit => hit)).length;
    const damagedShips = ships.filter(ship => 
      ship.hits.some(hit => hit) && !ship.hits.every(hit => hit)
    ).length;
    
    return { totalShips, sunkShips, damagedShips };
  };

  const playerStatus = getShipStatus(playerShips);
  const aiStatus = getShipStatus(aiShips);  return (
    <div className="game-status">
      <div className="status-header">
        {gamePhase === 'setup' && (
          <div className="setup-status">
            <h2>Battleship AI Battle Simulation</h2>
            <p>AI vs AI simulation ready!</p>
            <button className="start-button" onClick={onStartGame}>
              ⚓ Start AI Battle!
            </button>
          </div>
        )}
        
        {gamePhase === 'playing' && (
          <div className="playing-status">
            <div className={`turn-indicator ${currentTurn}`}>
              {currentTurn === 'player' ? '🔵 Blue AI Turn' : '🔴 Red AI Turn'}
            </div>
            <div className="battle-stats">
              <div className="stat">
                <span className="stat-label">Blue AI Fleet:</span>
                <span className="stat-value">
                  {playerStatus.totalShips - playerStatus.sunkShips} / {playerStatus.totalShips}
                </span>
              </div>
              <div className="stat">
                <span className="stat-label">Red AI Fleet:</span>
                <span className="stat-value">
                  {aiStatus.totalShips - aiStatus.sunkShips} / {aiStatus.totalShips}
                </span>
              </div>
            </div>

            {/* Accuracy Stats */}
            <div className="accuracy-stats">
              <div className="accuracy-stat">
                <span className="accuracy-label">Accuracy</span>
                <span className="accuracy-value">
                  {blueAIStats.totalShots > 0 
                    ? `${Math.round((blueAIStats.hits / blueAIStats.totalShots) * 100)}%`
                    : '0%'
                  } ({blueAIStats.hits}/{blueAIStats.totalShots})
                </span>
              </div>
              <div className="accuracy-stat">
                <span className="accuracy-label">Accuracy</span>
                <span className="accuracy-value">
                  {redAIStats.totalShots > 0 
                    ? `${Math.round((redAIStats.hits / redAIStats.totalShots) * 100)}%`
                    : '0%'
                  } ({redAIStats.hits}/{redAIStats.totalShots})
                </span>
              </div>
            </div>
          </div>
        )}          {gamePhase === 'gameOver' && winner && (
          <div className="game-over-status">
            <div className={`winner-announcement ${winner}`}>
              {winner === 'player' ? '🎉 Blue AI Wins!' : '🎉 Red AI Wins!'}
            </div>
            <p>
              {winner === 'player' 
                ? 'Blue AI successfully destroyed all enemy ships!' 
                : 'Red AI successfully destroyed all enemy ships!'}
            </p>
            <button className="reset-button" onClick={onResetGame}>
              ⚡ New Game
            </button>
          </div>
        )}
      </div>
      
      {gamePhase !== 'setup' && (
        <div className="game-controls">
          <button className="control-button" onClick={onResetGame}>
            🔄 Reset Game
          </button>
        </div>
      )}
    </div>
  );
};

export default GameStatus;
