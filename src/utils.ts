import type { Board, Ship, Position } from './types';
import { BOARD_SIZE, SHIP_TYPES } from './types';

export const createEmptyBoard = (): Board => {
  return Array.from({ length: BOARD_SIZE }, (_, row) =>
    Array.from({ length: BOARD_SIZE }, (_, col) => ({
      position: { row, col },
      hasShip: false,
      isHit: false,
      isMiss: false,
    }))
  );
};

export const createInitialShips = (): Ship[] => {
  return SHIP_TYPES.map(shipType => ({
    ...shipType,
    positions: [],
    isPlaced: false,
    hits: Array(shipType.size).fill(false),
  }));
};

export const isValidPosition = (
  board: Board,
  ship: Ship,
  startPos: Position,
  isHorizontal: boolean
): boolean => {
  const { row, col } = startPos;
  
  // Check if ship fits on board
  if (isHorizontal) {
    if (col + ship.size > BOARD_SIZE) return false;
  } else {
    if (row + ship.size > BOARD_SIZE) return false;
  }

  // Check for overlapping ships and adjacent ships
  for (let i = 0; i < ship.size; i++) {
    const checkRow = isHorizontal ? row : row + i;
    const checkCol = isHorizontal ? col + i : col;

    // Check if position is occupied
    if (board[checkRow][checkCol].hasShip) return false;

    // Check adjacent cells (including diagonals)
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const adjRow = checkRow + dr;
        const adjCol = checkCol + dc;
        
        if (
          adjRow >= 0 && adjRow < BOARD_SIZE &&
          adjCol >= 0 && adjCol < BOARD_SIZE &&
          board[adjRow][adjCol].hasShip &&
          board[adjRow][adjCol].shipId !== ship.id
        ) {
          return false;
        }
      }
    }
  }

  return true;
};

export const placeShip = (
  board: Board,
  ship: Ship,
  startPos: Position,
  isHorizontal: boolean
): { newBoard: Board; newShip: Ship } => {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  const positions: Position[] = [];

  for (let i = 0; i < ship.size; i++) {
    const row = isHorizontal ? startPos.row : startPos.row + i;
    const col = isHorizontal ? startPos.col + i : startPos.col;
    
    newBoard[row][col].hasShip = true;
    newBoard[row][col].shipId = ship.id;
    positions.push({ row, col });
  }

  const newShip: Ship = {
    ...ship,
    positions,
    isHorizontal,
    isPlaced: true,
  };

  return { newBoard, newShip };
};

export const removeShip = (board: Board, ship: Ship): Board => {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  
  ship.positions.forEach(pos => {
    newBoard[pos.row][pos.col].hasShip = false;
    newBoard[pos.row][pos.col].shipId = undefined;
  });

  return newBoard;
};

export const makeAttack = (
  board: Board,
  ships: Ship[],
  position: Position
): { newBoard: Board; newShips: Ship[]; hit: boolean; sunk: boolean } => {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  const cell = newBoard[position.row][position.col];
  
  if (cell.isHit || cell.isMiss) {
    // Already attacked this position
    return { newBoard: board, newShips: ships, hit: false, sunk: false };
  }

  if (cell.hasShip && cell.shipId) {
    // Hit!
    cell.isHit = true;
    
    const newShips = ships.map(ship => {
      if (ship.id === cell.shipId) {
        const newHits = [...ship.hits];
        const hitIndex = ship.positions.findIndex(
          pos => pos.row === position.row && pos.col === position.col
        );
        if (hitIndex !== -1) {
          newHits[hitIndex] = true;
        }
        return { ...ship, hits: newHits };
      }
      return ship;
    });

    const hitShip = newShips.find(ship => ship.id === cell.shipId);
    const sunk = hitShip ? hitShip.hits.every(hit => hit) : false;

    return { newBoard, newShips, hit: true, sunk };
  } else {
    // Miss
    cell.isMiss = true;
    return { newBoard, newShips: ships, hit: false, sunk: false };
  }
};

export const isGameOver = (ships: Ship[]): boolean => {
  return ships.every(ship => ship.hits.every(hit => hit));
};

export const getRandomPosition = (): Position => ({
  row: Math.floor(Math.random() * BOARD_SIZE),
  col: Math.floor(Math.random() * BOARD_SIZE),
});

export const placeShipsRandomly = (ships: Ship[]): { board: Board; placedShips: Ship[] } => {
  let board = createEmptyBoard();
  const placedShips: Ship[] = [];

  for (const ship of ships) {
    let placed = false;
    let attempts = 0;
    const maxAttempts = 100;

    while (!placed && attempts < maxAttempts) {
      const startPos = getRandomPosition();
      const isHorizontal = Math.random() < 0.5;

      if (isValidPosition(board, ship, startPos, isHorizontal)) {
        const result = placeShip(board, ship, startPos, isHorizontal);
        board = result.newBoard;
        placedShips.push(result.newShip);
        placed = true;
      }
      attempts++;
    }

    if (!placed) {
      // Fallback: try to place horizontally from top-left
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          const startPos = { row, col };
          if (isValidPosition(board, ship, startPos, true)) {
            const result = placeShip(board, ship, startPos, true);
            board = result.newBoard;
            placedShips.push(result.newShip);
            placed = true;
            break;
          }
        }
        if (placed) break;
      }
    }
  }

  return { board, placedShips };
};

// Simple AI strategy: random shots with some preference for hits
export const getAIMove = (board: Board, previousHits: Position[]): Position => {
  const availablePositions: Position[] = [];
  
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (!board[row][col].isHit && !board[row][col].isMiss) {
        availablePositions.push({ row, col });
      }
    }
  }

  if (availablePositions.length === 0) {
    return { row: 0, col: 0 }; // Shouldn't happen
  }

  // If there are previous hits, try adjacent positions first
  if (previousHits.length > 0) {
    const adjacentPositions: Position[] = [];
    
    previousHits.forEach(hit => {
      const directions = [
        { row: -1, col: 0 }, { row: 1, col: 0 },
        { row: 0, col: -1 }, { row: 0, col: 1 }
      ];
      
      directions.forEach(dir => {
        const newRow = hit.row + dir.row;
        const newCol = hit.col + dir.col;
        
        if (
          newRow >= 0 && newRow < BOARD_SIZE &&
          newCol >= 0 && newCol < BOARD_SIZE &&
          !board[newRow][newCol].isHit &&
          !board[newRow][newCol].isMiss
        ) {
          adjacentPositions.push({ row: newRow, col: newCol });
        }
      });
    });

    if (adjacentPositions.length > 0) {
      return adjacentPositions[Math.floor(Math.random() * adjacentPositions.length)];
    }
  }

  // Random move
  return availablePositions[Math.floor(Math.random() * availablePositions.length)];
};
