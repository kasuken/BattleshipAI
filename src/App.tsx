import { useState, useEffect, useRef } from 'react';
import type { GameState, Position, Cell } from './types';
import { 
  createEmptyBoard, 
  createInitialShips, 
  isValidPosition, 
  placeShip, 
  removeShip, 
  makeAttack, 
  isGameOver, 
  placeShipsRandomly
} from './utils';
import { LMStudioAI, type AIConfig } from './aiService';
import Board from './components/Board';
import ShipSelector from './components/ShipSelector';
import GameStatus from './components/GameStatus';
import AISettings from './components/AISettings';
import './App.css';

// Simple AI fallback function
const getSimpleAIMove = (board: Cell[][], previousHits: Position[]): Position => {
  const availablePositions: Position[] = [];
  
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      if (!board[row][col].isHit && !board[row][col].isMiss) {
        availablePositions.push({ row, col });
      }
    }
  }

  if (availablePositions.length === 0) {
    return { row: 0, col: 0 };
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
          newRow >= 0 && newRow < 10 &&
          newCol >= 0 && newCol < 10 &&
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

  return availablePositions[Math.floor(Math.random() * availablePositions.length)];
};

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
  const [showAISettings, setShowAISettings] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const aiInstance = useRef<LMStudioAI | null>(null);
  const aiHitPositions = useRef<Position[]>([]);
  const aiSunkShips = useRef<string[]>([]);

  // Initialize AI with default config
  useEffect(() => {
    const defaultConfig: AIConfig = {
      endpoint: 'http://localhost:1234',
      model: 'local-model',
      temperature: 0.7,
      maxTokens: 50
    };
    aiInstance.current = new LMStudioAI(defaultConfig);
  }, []);

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
      const timer = setTimeout(async () => {
        let aiMove: Position;
        
        try {
          if (useAI && aiInstance.current) {
            // Use LM Studio AI
            aiMove = await aiInstance.current.makeMove(
              gameState.playerBoard,
              aiPreviousHits,
              aiHitPositions.current,
              aiSunkShips.current
            );
          } else {
            // Fallback to simple AI
            aiMove = getSimpleAIMove(gameState.playerBoard, aiPreviousHits);
          }
        } catch (error) {
          console.error('AI move failed, using fallback:', error);
          aiMove = getSimpleAIMove(gameState.playerBoard, aiPreviousHits);
        }

        const { newBoard, newShips, hit, sunk } = makeAttack(gameState.playerBoard, gameState.playerShips, aiMove);

        // Update AI tracking
        if (hit) {
          aiHitPositions.current.push(aiMove);
          setAiPreviousHits(prev => [...prev, aiMove]);
        }

        // Check if a ship was sunk
        if (sunk) {
          const sunkShip = newShips.find(ship => 
            ship.positions.some(pos => pos.row === aiMove.row && pos.col === aiMove.col) &&
            ship.hits.every(hit => hit)
          );
          if (sunkShip && !aiSunkShips.current.includes(sunkShip.name)) {
            aiSunkShips.current.push(sunkShip.name);
          }
        }

        // Record move result for AI learning
        if (useAI && aiInstance.current) {
          const sunkShipName = sunk ? newShips.find(ship => 
            ship.positions.some(pos => pos.row === aiMove.row && pos.col === aiMove.col) &&
            ship.hits.every(hit => hit)
          )?.name : undefined;
          
          aiInstance.current.recordMoveResult(aiMove, hit, sunk, sunkShipName);
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
      }, 1500); // Slightly longer delay for AI to "think"

      return () => clearTimeout(timer);
    }
  }, [gameState.currentTurn, gameState.gamePhase, gameState.playerBoard, gameState.playerShips, useAI, aiPreviousHits]);

  // AI Configuration handlers
  const handleAIConfigChange = (config: AIConfig) => {
    if (aiInstance.current) {
      aiInstance.current.updateConfig(config);
    }
  };

  const handleTestConnection = async (): Promise<boolean> => {
    try {
      if (!aiInstance.current) return false;
      
      const result = await aiInstance.current.testConnection();
      console.log('Connection test result:', result);
      return result.success;
    } catch {
      return false;
    }
  };

  const toggleAIMode = () => {
    setUseAI(!useAI);
  };

  const handleResetGame = () => {
    const { board: aiBoard, placedShips: aiShips } = placeShipsRandomly(createInitialShips());
    
    // Reset AI state
    aiHitPositions.current = [];
    aiSunkShips.current = [];
    if (aiInstance.current) {
      aiInstance.current.resetGame();
    }
    
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
        <div className="ai-controls">
          <button 
            className={`ai-toggle ${useAI ? 'active' : ''}`}
            onClick={toggleAIMode}
            title={useAI ? 'Using LM Studio AI' : 'Using Simple AI'}
          >
            {useAI ? '🤖 LM Studio AI' : '🎯 Simple AI'}
          </button>
          <button 
            className="ai-settings-btn"
            onClick={() => setShowAISettings(true)}
            title="Configure AI Settings"
          >
            ⚙️ AI Settings
          </button>
        </div>
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
      
      {showAISettings && (
        <AISettings
          isVisible={showAISettings}
          onClose={() => setShowAISettings(false)}
          onConfigChange={handleAIConfigChange}
          onTestConnection={handleTestConnection}
        />
      )}
    </div>
  );
}

export default App
