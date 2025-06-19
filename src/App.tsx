import { useState, useEffect, useRef } from 'react';
import type { GameState, Position, Cell } from './types';
import { 
  createEmptyBoard, 
  createInitialShips, 
  makeAttack, 
  isGameOver, 
  placeShipsRandomly
} from './utils';
import { LMStudioAI, type AIConfig } from './aiService';
import Board from './components/Board';
import GameStatus from './components/GameStatus';
import AISettings from './components/AISettings';
import './App.css';

// Simple AI fallback function for emergency use only
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
  
  // AI states
  const [aiPreviousHits, setAiPreviousHits] = useState<Position[]>([]);
  const [playerAiPreviousHits, setPlayerAiPreviousHits] = useState<Position[]>([]);
  const [showAISettings, setShowAISettings] = useState(false);
  const [aiMoveInProgress, setAiMoveInProgress] = useState(false);
  const [playerAiMoveInProgress, setPlayerAiMoveInProgress] = useState(false);
  
  // AI refs
  const aiInstance = useRef<LMStudioAI | null>(null);
  const playerAiInstance = useRef<LMStudioAI | null>(null);
  const aiHitPositions = useRef<Position[]>([]);
  const aiSunkShips = useRef<string[]>([]);
  const playerAiHitPositions = useRef<Position[]>([]);
  const playerAiSunkShips = useRef<string[]>([]);

  // Initialize AI with default config
  useEffect(() => {
    const defaultConfig: AIConfig = {
      endpoint: 'http://localhost:1234',
      model: 'local-model',
      temperature: 0.7,
      maxTokens: 50,
      debug: true
    };
    aiInstance.current = new LMStudioAI(defaultConfig);
    playerAiInstance.current = new LMStudioAI(defaultConfig);
  }, []);

  // Initialize AI ships
  useEffect(() => {
    const { board: aiBoard, placedShips: aiShips } = placeShipsRandomly(createInitialShips());
    // Also create random ships for Blue AI (player side) immediately
    const { board: playerBoard, placedShips: playerShips } = placeShipsRandomly(createInitialShips());
    
    setGameState(prev => ({
      ...prev,
      aiBoard,
      aiShips,
      playerBoard,
      playerShips
    }));
  }, []);

  const handleStartGame = () => {
    // Start the AI vs AI game
    setGameState(prev => ({
      ...prev,
      gamePhase: 'playing',
      currentTurn: 'player',
    }));
  };

  // Red AI turn logic
  useEffect(() => {
    if (gameState.gamePhase === 'playing' && gameState.currentTurn === 'ai' && !aiMoveInProgress) {      const timer = setTimeout(async () => {
        setAiMoveInProgress(true);
        // Initialize with a default value that will be overwritten
        let aiMove: Position = { row: 0, col: 0 };
          try {
          if (aiInstance.current) {
            // Implement a retry mechanism with up to 3 attempts
            let attemptCount = 0;
            let success = false;
            
            while (!success && attemptCount < 3) {
              attemptCount++;
              try {
                // Use LM Studio AI with different levels of context based on attempt number
                if (attemptCount === 1) {
                  // First attempt with full context
                  aiMove = await aiInstance.current.makeMove(
                    gameState.playerBoard,
                    aiPreviousHits,
                    aiHitPositions.current,
                    aiSunkShips.current
                  );
                } else if (attemptCount === 2) {
                  // Second attempt with partial context
                  aiMove = await aiInstance.current.makeMove(
                    gameState.playerBoard,
                    aiPreviousHits,
                    [],
                    []
                  );
                } else {
                  // Third attempt with minimal context
                  aiMove = await aiInstance.current.makeMove(
                    gameState.playerBoard,
                    [],
                    [],
                    []
                  );
                }
                
                console.log(`Red AI made move on attempt ${attemptCount}:`, aiMove);
                success = true;
              } catch (error) {
                console.error(`Red AI attempt ${attemptCount} failed:`, error);
                // Only wait briefly between attempts
                if (attemptCount < 3) {
                  await new Promise(resolve => setTimeout(resolve, 300));
                }
              }
            }
            
            if (!success) {
              // All attempts failed, use simple AI as fallback
              console.error("All Red AI attempts failed, using fallback move");
              const available: Position[] = [];
              for (let row = 0; row < 10; row++) {
                for (let col = 0; col < 10; col++) {
                  if (!gameState.playerBoard[row][col].isHit && !gameState.playerBoard[row][col].isMiss) {
                    available.push({ row, col });
                  }
                }
              }
              aiMove = available[Math.floor(Math.random() * available.length)];
              console.log("Red AI using last resort move:", aiMove);
            }
          } else {
            // Emergency fallback - shouldn't happen in normal operation
            console.error("Red AI instance not initialized!");
            aiMove = getSimpleAIMove(gameState.playerBoard, aiPreviousHits);
          }
        } catch (error) {
          console.error('Red AI move completely failed, using emergency fallback:', error);
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
        if (aiInstance.current) {
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

        setAiMoveInProgress(false);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [gameState.currentTurn, gameState.gamePhase, gameState.playerBoard, gameState.playerShips, aiPreviousHits, aiMoveInProgress]);

  // Blue AI turn logic
  useEffect(() => {
    if (gameState.gamePhase === 'playing' && gameState.currentTurn === 'player' && !playerAiMoveInProgress) {      const timer = setTimeout(async () => {
        setPlayerAiMoveInProgress(true);
        // Initialize with a default value that will be overwritten
        let playerAiMove: Position = { row: 0, col: 0 };
          try {
          if (playerAiInstance.current) {
            // Implement a retry mechanism with up to 3 attempts
            let attemptCount = 0;
            let success = false;
            
            while (!success && attemptCount < 3) {
              attemptCount++;
              try {
                // Use LM Studio AI with different levels of context based on attempt number
                if (attemptCount === 1) {
                  // First attempt with full context
                  playerAiMove = await playerAiInstance.current.makeMove(
                    gameState.aiBoard,
                    playerAiPreviousHits,
                    playerAiHitPositions.current,
                    playerAiSunkShips.current
                  );
                } else if (attemptCount === 2) {
                  // Second attempt with partial context
                  playerAiMove = await playerAiInstance.current.makeMove(
                    gameState.aiBoard,
                    playerAiPreviousHits,
                    [],
                    []
                  );
                } else {
                  // Third attempt with minimal context
                  playerAiMove = await playerAiInstance.current.makeMove(
                    gameState.aiBoard,
                    [],
                    [],
                    []
                  );
                }
                
                console.log(`Blue AI made move on attempt ${attemptCount}:`, playerAiMove);
                success = true;
              } catch (error) {
                console.error(`Blue AI attempt ${attemptCount} failed:`, error);
                // Only wait briefly between attempts
                if (attemptCount < 3) {
                  await new Promise(resolve => setTimeout(resolve, 300));
                }
              }
            }
            
            if (!success) {
              // All attempts failed, use simple AI as fallback
              console.error("All Blue AI attempts failed, using fallback move");
              const available: Position[] = [];
              for (let row = 0; row < 10; row++) {
                for (let col = 0; col < 10; col++) {
                  if (!gameState.aiBoard[row][col].isHit && !gameState.aiBoard[row][col].isMiss) {
                    available.push({ row, col });
                  }
                }
              }
              playerAiMove = available[Math.floor(Math.random() * available.length)];
              console.log("Blue AI using last resort move:", playerAiMove);
            }
          } else {
            // Emergency fallback - shouldn't happen in normal operation
            console.error("Blue AI instance not initialized!");
            playerAiMove = getSimpleAIMove(gameState.aiBoard, playerAiPreviousHits);
          }
        } catch (error) {
          console.error('Blue AI move completely failed, using emergency fallback:', error);
          playerAiMove = getSimpleAIMove(gameState.aiBoard, playerAiPreviousHits);
        }

        const { newBoard, newShips, hit, sunk } = makeAttack(gameState.aiBoard, gameState.aiShips, playerAiMove);

        // Update Player AI tracking
        if (hit) {
          playerAiHitPositions.current.push(playerAiMove);
          setPlayerAiPreviousHits(prev => [...prev, playerAiMove]);
        }

        // Check if Player AI sunk a ship
        if (sunk) {
          const sunkShip = newShips.find(ship => 
            ship.positions.some(pos => pos.row === playerAiMove.row && pos.col === playerAiMove.col) &&
            ship.hits.every(hit => hit)
          );
          if (sunkShip && !playerAiSunkShips.current.includes(sunkShip.name)) {
            playerAiSunkShips.current.push(sunkShip.name);
          }
        }

        // Record move result for Player AI learning
        if (playerAiInstance.current) {
          const sunkShipName = sunk ? newShips.find(ship => 
            ship.positions.some(pos => pos.row === playerAiMove.row && pos.col === playerAiMove.col) &&
            ship.hits.every(hit => hit)
          )?.name : undefined;
          
          playerAiInstance.current.recordMoveResult(playerAiMove, hit, sunk, sunkShipName);
        }

        setGameState(prev => ({
          ...prev,
          aiBoard: newBoard,
          aiShips: newShips,
          currentTurn: hit ? 'player' : 'ai', // Player AI continues if hit
        }));

        // Check for Player AI win
        if (isGameOver(newShips)) {
          setGameState(prev => ({
            ...prev, 
            gamePhase: 'gameOver',
            winner: 'player',
          }));
        }
        
        setPlayerAiMoveInProgress(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [gameState.currentTurn, gameState.gamePhase, gameState.aiBoard, gameState.aiShips, playerAiPreviousHits, playerAiMoveInProgress]);

  // AI Configuration handlers
  const handleAIConfigChange = (config: AIConfig) => {
    if (aiInstance.current) {
      aiInstance.current.updateConfig(config);
    }
    if (playerAiInstance.current) {
      playerAiInstance.current.updateConfig(config);
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

  const handleResetGame = () => {
    const { board: aiBoard, placedShips: aiShips } = placeShipsRandomly(createInitialShips());
    const { board: playerBoard, placedShips: playerShips } = placeShipsRandomly(createInitialShips());
    
    // Reset AI state
    aiHitPositions.current = [];
    aiSunkShips.current = [];
    playerAiHitPositions.current = [];
    playerAiSunkShips.current = [];
    if (aiInstance.current) {
      aiInstance.current.resetGame();
    }
    if (playerAiInstance.current) {
      playerAiInstance.current.resetGame();
    }
    
    setGameState({
      playerBoard,
      aiBoard,
      playerShips,
      aiShips,
      currentTurn: 'player',
      gamePhase: 'setup',
      winner: null,
      selectedShip: null,
    });
    setAiPreviousHits([]);
    setPlayerAiPreviousHits([]);
  };

  return (
    <div className="app">
      <div className="game-header">
        <h1>⚓ Battleship AI vs AI ⚓</h1>
        <div className="ai-controls">
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
        <div className="board-container">
          <div className="board-wrapper player-board">
            <h2>🔵 Blue AI Fleet</h2>
            <Board 
              board={gameState.playerBoard}
              ships={gameState.playerShips}
              isPlayer={true}
              showShips={true}
              onCellClick={() => {}} // No manual interactions in AI vs AI mode
              gamePhase={gameState.gamePhase}
            />
          </div>
          <div className="board-wrapper enemy-board">
            <h2>🔴 Red AI Fleet</h2>
            <Board 
              board={gameState.aiBoard}
              ships={gameState.aiShips}
              isPlayer={false}
              showShips={true} 
              onCellClick={() => {}} // No manual interactions in AI vs AI mode
              gamePhase={gameState.gamePhase}
            />
          </div>
        </div>

        <div className="game-sidebar">          <GameStatus 
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

export default App;
