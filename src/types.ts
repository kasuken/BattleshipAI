// Game types and interfaces for Battleship

export interface Position {
  row: number;
  col: number;
}

export interface Ship {
  id: string;
  name: string;
  size: number;
  positions: Position[];
  isHorizontal: boolean;
  isPlaced: boolean;
  hits: boolean[];
}

export interface Cell {
  position: Position;
  hasShip: boolean;
  isHit: boolean;
  isMiss: boolean;
  shipId?: string;
}

export type Board = Cell[][];

export interface GameState {
  playerBoard: Board;
  aiBoard: Board;
  playerShips: Ship[];
  aiShips: Ship[];
  currentTurn: 'player' | 'ai';
  gamePhase: 'setup' | 'playing' | 'gameOver';
  winner: 'player' | 'ai' | null;
  selectedShip: string | null;
}

export const SHIP_TYPES: Omit<Ship, 'positions' | 'isPlaced' | 'hits'>[] = [
  { id: 'carrier', name: 'Carrier', size: 5, isHorizontal: true },
  { id: 'battleship', name: 'Battleship', size: 4, isHorizontal: true },
  { id: 'cruiser', name: 'Cruiser', size: 3, isHorizontal: true },
  { id: 'submarine', name: 'Submarine', size: 3, isHorizontal: true },
  { id: 'destroyer', name: 'Destroyer', size: 2, isHorizontal: true },
];

export const BOARD_SIZE = 10;
