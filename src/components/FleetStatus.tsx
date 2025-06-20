import React from 'react';
import type { Ship } from '../types';
import './FleetStatus.css';

interface FleetStatusProps {
  ships: Ship[];
  title: string;
  hideDetails?: boolean;
}

const FleetStatus: React.FC<FleetStatusProps> = ({ ships, title, hideDetails = false }) => {
  return (
    <div className="fleet-status">
      <h3 className="fleet-title">{title}</h3>
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
};

export default FleetStatus;
