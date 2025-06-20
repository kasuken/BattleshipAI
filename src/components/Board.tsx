import React from 'react';
import type { Board as BoardType, Position, Ship } from '../types';
import './Board.css';

interface BoardProps {
  board: BoardType;
  ships: Ship[];
  isPlayer: boolean;
  onCellClick: (position: Position) => void;
  showShips: boolean;
  selectedShip?: Ship | null;
  onShipPlace?: (position: Position, isHorizontal: boolean) => void;
  gamePhase: 'setup' | 'playing' | 'gameOver';
}

const Board: React.FC<BoardProps> = ({
  board,
  ships,
  isPlayer,
  onCellClick,
  showShips,
  selectedShip,
  onShipPlace,
  gamePhase
}) => {
  const handleCellClick = (position: Position) => {
    if (gamePhase === 'setup' && isPlayer && selectedShip && onShipPlace) {
      onShipPlace(position, selectedShip.isHorizontal);
    } else if (gamePhase === 'playing') {
      onCellClick(position);
    }
  };

  const handleCellRightClick = (e: React.MouseEvent, position: Position) => {
    e.preventDefault();
    if (gamePhase === 'setup' && isPlayer && selectedShip && onShipPlace) {
      // Toggle ship orientation on right click
      const toggledShip = { ...selectedShip, isHorizontal: !selectedShip.isHorizontal };
      onShipPlace(position, toggledShip.isHorizontal);
    }
  };

  const getCellClass = (cell: typeof board[0][0], position: Position) => {
    const classes = ['cell'];
    
    if (cell.isHit) {
      classes.push('hit');
      if (cell.hasShip) {
        classes.push('ship-hit');
      }
    } else if (cell.isMiss) {
      classes.push('miss');
    } else if (showShips && cell.hasShip) {
      classes.push('ship');
      
      // Add ship orientation and position classes for styling
      const ship = ships.find(s => s.id === cell.shipId);
      if (ship) {
        classes.push(ship.isHorizontal ? 'horizontal' : 'vertical');
        
        const shipIndex = ship.positions.findIndex(
          pos => pos.row === position.row && pos.col === position.col
        );
        
        if (shipIndex === 0) classes.push('ship-start');
        if (shipIndex === ship.size - 1) classes.push('ship-end');
        if (ship.size > 2 && shipIndex > 0 && shipIndex < ship.size - 1) {
          classes.push('ship-middle');
        }
      }
    }

    // Preview for ship placement
    if (gamePhase === 'setup' && isPlayer && selectedShip) {
      if (isValidPreviewPosition(position)) {
        classes.push('ship-preview');
      }
    }

    return classes.join(' ');
  };

  const isValidPreviewPosition = (position: Position): boolean => {
    if (!selectedShip) return false;
    
    // Simple preview logic - this could be enhanced
    const { row, col } = position;
    const { size, isHorizontal } = selectedShip;
    
    if (isHorizontal) {
      return col + size <= 10 && !board[row].slice(col, col + size).some(cell => cell.hasShip);
    } else {
      return row + size <= 10 && !board.slice(row, row + size).some(rowCells => rowCells[col].hasShip);
    }
  };

  return (
    <div className={`board ${isPlayer ? 'player-board' : 'ai-board'}`}>
      <div className="board-grid">
        {/* Column headers */}
        <div className="board-header">
          <div className="corner-cell"></div>
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="header-cell">
              {String.fromCharCode(65 + i)}
            </div>
          ))}
        </div>
        
        {/* Board rows */}
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="board-row">
            <div className="row-header">{rowIndex + 1}</div>
            {row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={getCellClass(cell, { row: rowIndex, col: colIndex })}
                onClick={() => handleCellClick({ row: rowIndex, col: colIndex })}
                onContextMenu={(e) => handleCellRightClick(e, { row: rowIndex, col: colIndex })}
                title={isPlayer ? undefined : `${String.fromCharCode(65 + colIndex)}${rowIndex + 1}`}
              >
                {cell.isHit && cell.hasShip && '💥'}
                {cell.isHit && !cell.hasShip && '💨'}
                {cell.isMiss && '◦'}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Board;
