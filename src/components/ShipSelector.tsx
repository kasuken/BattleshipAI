/**
 * NOTE: This component is no longer used in the AI vs AI only mode.
 * It's kept for reference but could be safely removed.
 */
import React from 'react';
import type { Ship } from '../types';
import './ShipSelector.css';

interface ShipSelectorProps {
  ships: Ship[];
  selectedShip: string | null;
  onShipSelect: (shipId: string) => void;
  onShipRotate: (shipId: string) => void;
  onRandomPlacement: () => void;
  onClearBoard: () => void;
}

const ShipSelector: React.FC<ShipSelectorProps> = ({
  ships,
  selectedShip,
  onShipSelect,
  onShipRotate,
  onRandomPlacement,
  onClearBoard
}) => {
  const allShipsPlaced = ships.every(ship => ship.isPlaced);

  return (
    <div className="ship-selector">
      <h3>Place Your Ships</h3>
      
      <div className="ships-list">
        {ships.map(ship => (
          <div
            key={ship.id}
            className={`ship-item ${selectedShip === ship.id ? 'selected' : ''} ${ship.isPlaced ? 'placed' : ''}`}
            onClick={() => !ship.isPlaced && onShipSelect(ship.id)}
          >
            <div className="ship-info">
              <span className="ship-name">{ship.name}</span>
              <span className="ship-size">({ship.size} cells)</span>
            </div>
            
            <div className="ship-visual">
              {Array.from({ length: ship.size }, (_, i) => (
                <div
                  key={i}
                  className={`ship-cell ${ship.isHorizontal ? 'horizontal' : 'vertical'}`}
                />
              ))}
            </div>
            
            {!ship.isPlaced && selectedShip === ship.id && (
              <button
                className="rotate-button"
                onClick={(e) => {
                  e.stopPropagation();
                  onShipRotate(ship.id);
                }}
                title="Rotate ship (or right-click on board)"
              >
                ↻
              </button>
            )}
            
            {ship.isPlaced && (
              <span className="placed-indicator">✓</span>
            )}
          </div>
        ))}
      </div>
      
      <div className="ship-controls">
        <button 
          className="control-button random-button"
          onClick={onRandomPlacement}
          title="Place all ships randomly"
        >
          Random Placement
        </button>
        
        <button 
          className="control-button clear-button"
          onClick={onClearBoard}
          title="Clear all ships"
        >
          Clear Board
        </button>
      </div>
      
      <div className="placement-instructions">
        <p><strong>Instructions:</strong></p>
        <ul>
          <li>Click a ship to select it</li>
          <li>Click on the board to place it</li>
          <li>Right-click or use ↻ to rotate</li>
          <li>Ships cannot touch each other</li>
        </ul>
      </div>
      
      {allShipsPlaced && (
        <div className="ready-indicator">
          <p>✅ All ships placed! Ready to battle!</p>
        </div>
      )}
    </div>
  );
};

export default ShipSelector;
