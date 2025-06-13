import { useState, useEffect } from 'react';
import type { GameState, Position } from './types';
import { 
  createEmptyBoard, 
  createInitialShips, 
  isValidPosition, 
  placeShip, 
  removeShip, 
  makeAttack, 
  isGameOver, 
  placeShipsRandomly,
  getAIMove
} from './utils';
import Board from './components/Board';
import ShipSelector from './components/ShipSelector';
import GameStatus from './components/GameStatus';
import './App.css';

function App() {
  const [gameState, setGameState] = useState<GameState>(() => ({
    playerBoard: createEmptyBoard(),
    aiBoard: createEmptyBoard(),
    playerShips: createInitialShips(),
    aiShips: createInitialShips(),
    currentTurn: 'player',
    gamePhase: 'setup',
    winner: null,
    selectedShip: null,
  }));

  const [aiPreviousHits, setAiPreviousHits] = useState<Position[]>([]);

  // Initialize AI ships
  useEffect(() => {
    const { board: aiBoard, placedShips: aiShips } = placeShipsRandomly(createInitialShips());
    setGameState(prev => ({
      ...prev,
      aiBoard,
      aiShips,
    }));
  }, []);

  const handleShipSelect = (shipId: string) => {
    setGameState(prev => ({
      ...prev,
      selectedShip: shipId,
    }));
  };

  const handleShipRotate = (shipId: string) => {
    setGameState(prev => ({
      ...prev,
      playerShips: prev.playerShips.map(ship =>
        ship.id === shipId ? { ...ship, isHorizontal: !ship.isHorizontal } : ship
      ),
    }));
  };

  const handleShipPlace = (position: Position, isHorizontal: boolean) => {
    const { selectedShip, playerBoard, playerShips } = gameState;
    if (!selectedShip) return;

    const ship = playerShips.find(s => s.id === selectedShip);
    if (!ship || ship.isPlaced) return;

    const updatedShip = { ...ship, isHorizontal };

    if (!isValidPosition(playerBoard, updatedShip, position, isHorizontal)) {
      return;
    }

    // Remove ship if it was already placed
    const newBoard = ship.isPlaced ? removeShip(playerBoard, ship) : playerBoard;

    // Place ship in new position
    const { newBoard: finalBoard, newShip } = placeShip(newBoard, updatedShip, position, isHorizontal);

    setGameState(prev => ({
      ...prev,
      playerBoard: finalBoard,
      playerShips: prev.playerShips.map(s => s.id === selectedShip ? newShip : s),
      selectedShip: null,
    }));
  };

  const handleRandomPlacement = () => {
    const { board: newBoard, placedShips } = placeShipsRandomly(createInitialShips());
    setGameState(prev => ({
      ...prev,
      playerBoard: newBoard,
      playerShips: placedShips,
      selectedShip: null,
    }));
  };

  const handleClearBoard = () => {
    setGameState(prev => ({
      ...prev,
      playerBoard: createEmptyBoard(),
      playerShips: createInitialShips(),
      selectedShip: null,
    }));
  };

  const handleStartGame = () => {
    const allShipsPlaced = gameState.playerShips.every(ship => ship.isPlaced);
    if (allShipsPlaced) {
      setGameState(prev => ({
        ...prev,
        gamePhase: 'playing',
        currentTurn: 'player',
      }));
    }
  };

  const handlePlayerAttack = (position: Position) => {
    if (gameState.gamePhase !== 'playing' || gameState.currentTurn !== 'player') return;

    const { newBoard, newShips, hit } = makeAttack(gameState.aiBoard, gameState.aiShips, position);

    setGameState(prev => ({
      ...prev,
      aiBoard: newBoard,
      aiShips: newShips,
      currentTurn: hit ? 'player' : 'ai', // Player continues if hit
    }));

    // Check for player win
    if (isGameOver(newShips)) {
      setGameState(prev => ({
        ...prev,
        gamePhase: 'gameOver',
        winner: 'player',
      }));
    }
  };

  // AI turn logic
  useEffect(() => {
    if (gameState.gamePhase === 'playing' && gameState.currentTurn === 'ai') {
      const timer = setTimeout(() => {
        const aiMove = getAIMove(gameState.playerBoard, aiPreviousHits);
        const { newBoard, newShips, hit } = makeAttack(gameState.playerBoard, gameState.playerShips, aiMove);

        if (hit) {
          setAiPreviousHits(prev => [...prev, aiMove]);
        }

        setGameState(prev => ({
          ...prev,
          playerBoard: newBoard,
          playerShips: newShips,
          currentTurn: hit ? 'ai' : 'player', // AI continues if hit
        }));

        // Check for AI win
        if (isGameOver(newShips)) {
          setGameState(prev => ({
            ...prev,
            gamePhase: 'gameOver',
            winner: 'ai',
          }));
        }
      }, 1000); // AI delay for better UX

      return () => clearTimeout(timer);
    }
  }, [gameState.currentTurn, gameState.gamePhase, gameState.playerBoard, gameState.playerShips, aiPreviousHits]);

  const handleResetGame = () => {
    const { board: aiBoard, placedShips: aiShips } = placeShipsRandomly(createInitialShips());
    setGameState({
      playerBoard: createEmptyBoard(),
      aiBoard,
      playerShips: createInitialShips(),
      aiShips,
      currentTurn: 'player',
      gamePhase: 'setup',
      winner: null,
      selectedShip: null,
    });
    setAiPreviousHits([]);
  };

  return (
    <div className="app">
      <div className="game-header">
        <h1>⚓ Battleship Game ⚓</h1>
      </div>
      
      <div className="game-container">
        <div className="game-boards">
          <Board
            board={gameState.playerBoard}
            ships={gameState.playerShips}
            isPlayer={true}
            onCellClick={() => {}} // Player board is not clickable for attacks
            showShips={true}
            selectedShip={gameState.selectedShip ? gameState.playerShips.find(s => s.id === gameState.selectedShip) : null}
            onShipPlace={handleShipPlace}
            gamePhase={gameState.gamePhase}
          />
          
          {gameState.gamePhase !== 'setup' && (
            <Board
              board={gameState.aiBoard}
              ships={gameState.aiShips}
              isPlayer={false}
              onCellClick={handlePlayerAttack}
              showShips={gameState.gamePhase === 'gameOver'}
              gamePhase={gameState.gamePhase}
            />
          )}
        </div>
        
        <div className="game-sidebar">
          {gameState.gamePhase === 'setup' && (
            <ShipSelector
              ships={gameState.playerShips}
              selectedShip={gameState.selectedShip}
              onShipSelect={handleShipSelect}
              onShipRotate={handleShipRotate}
              onRandomPlacement={handleRandomPlacement}
              onClearBoard={handleClearBoard}
            />
          )}
          
          <GameStatus
            gamePhase={gameState.gamePhase}
            currentTurn={gameState.currentTurn}
            winner={gameState.winner}
            playerShips={gameState.playerShips}
            aiShips={gameState.aiShips}
            onStartGame={handleStartGame}
            onResetGame={handleResetGame}
          />
        </div>
      </div>
    </div>
  );
}

export default App
