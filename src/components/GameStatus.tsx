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
  // aiVsAi is now assumed to always be true
}

const GameStatus: React.FC<GameStatusProps> = ({
  gamePhase,
  currentTurn,
  winner,
  playerShips,
  aiShips,
  onStartGame,
  onResetGame
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
  const aiStatus = getShipStatus(aiShips);
  // No need to check if ships are placed in AI vs AI mode
  const renderShipStatusList = (ships: Ship[], title: string, hideDetails = false) => (
    <div className="ship-status-section">
      <h4>{title}</h4>
      {hideDetails}
      <div className="ship-status-list">
        {ships.map(ship => {
          const hitCount = ship.hits.filter(hit => hit).length;
          const isSunk = ship.hits.every(hit => hit);
          const isDamaged = hitCount > 0 && !isSunk;
          
          return (
            <div key={ship.id} className={`ship-status ${isSunk ? 'sunk' : isDamaged ? 'damaged' : 'intact'}`}>
              <span className="ship-name">{ship.name}</span>
              {!hideDetails ? (
                <div className="ship-health">
                  {Array.from({ length: ship.size }, (_, i) => (
                    <div key={i} className={`health-cell ${ship.hits[i] ? 'hit' : 'intact'}`} />
                  ))}
                </div>
              ) : (
                <div className="ship-health-hidden">
                  <span className="hit-count">{hitCount}/{ship.size}</span>
                </div>
              )}
              <span className="ship-status-text">
                {isSunk ? '💀' : isDamaged ? '🔥' : hideDetails ? '❓' : '⚓'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
  return (
    <div className="game-status">
      <div className="status-header">
        <h2>Battleship</h2>
          {gamePhase === 'setup' && (
          <div className="setup-status">
            <p>AI vs AI simulation ready!</p>
            <button className="start-button" onClick={onStartGame}>
              ⚓ Start AI Battle!
            </button>
          </div>
        )}
        
        {gamePhase === 'playing' && (
          <div className="playing-status">            <div className={`turn-indicator ${currentTurn}`}>
              {currentTurn === 'player' ? '🔵 Blue AI Turn' : '🔴 Red AI Turn'}
            </div>            <div className="battle-stats">
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
      </div>      {gamePhase !== 'setup' && (
        <div className="fleet-status">
          {renderShipStatusList(playerShips, '🔵 Blue AI Fleet')}
          {renderShipStatusList(aiShips, '🔴 Red AI Fleet', gamePhase === 'playing')}
        </div>
      )}
      
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
