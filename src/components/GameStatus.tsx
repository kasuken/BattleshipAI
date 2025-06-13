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
  const allShipsPlaced = playerShips.every(ship => ship.isPlaced);  const renderShipStatusList = (ships: Ship[], title: string, hideDetails = false) => (
    <div className="ship-status-section">
      <h4>{title}</h4>
      {hideDetails && (
        <p className="enemy-fleet-note">
          💡 Hit counts shown only - exact damage positions unknown
        </p>
      )}
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
            <p>Place your ships to begin the battle!</p>
            {allShipsPlaced && (
              <button className="start-button" onClick={onStartGame}>
                ⚓ Start Battle!
              </button>
            )}
          </div>
        )}
        
        {gamePhase === 'playing' && (
          <div className="playing-status">
            <div className={`turn-indicator ${currentTurn}`}>
              {currentTurn === 'player' ? '🎯 Your Turn' : '🤖 Enemy Turn'}
            </div>
            <div className="battle-stats">
              <div className="stat">
                <span className="stat-label">Your Fleet:</span>
                <span className="stat-value">
                  {playerStatus.totalShips - playerStatus.sunkShips} / {playerStatus.totalShips}
                </span>
              </div>
              <div className="stat">
                <span className="stat-label">Enemy Fleet:</span>
                <span className="stat-value">
                  {aiStatus.totalShips - aiStatus.sunkShips} / {aiStatus.totalShips}
                </span>
              </div>
            </div>
          </div>
        )}
        
        {gamePhase === 'gameOver' && winner && (
          <div className="game-over-status">
            <div className={`winner-announcement ${winner}`}>
              {winner === 'player' ? '🎉 Victory!' : '💀 Defeat!'}
            </div>
            <p>
              {winner === 'player' 
                ? 'Congratulations! You sunk all enemy ships!' 
                : 'The enemy has destroyed your fleet!'}
            </p>
            <button className="reset-button" onClick={onResetGame}>
              ⚡ New Game
            </button>
          </div>
        )}
      </div>      {gamePhase !== 'setup' && (
        <div className="fleet-status">
          {renderShipStatusList(playerShips, '🚢 Your Fleet')}
          {renderShipStatusList(aiShips, '🏴‍☠️ Enemy Fleet', gamePhase === 'playing')}
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
