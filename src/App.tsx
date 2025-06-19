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
  
  // AI states
  const [aiPreviousHits, setAiPreviousHits] = useState<Position[]>([]);
  const [playerAiPreviousHits, setPlayerAiPreviousHits] = useState<Position[]>([]);
  const [showAISettings, setShowAISettings] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const [aiVsAi, setAiVsAi] = useState(false);
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
      debug: true // Enable debug mode to help troubleshoot LM Studio connection
    };
    aiInstance.current = new LMStudioAI(defaultConfig);
    playerAiInstance.current = new LMStudioAI(defaultConfig); // Second AI for "player" side
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
    // In AI vs AI mode, we'll randomly place ships for player side as well
    if (aiVsAi) {
      const { board: playerBoard, placedShips: playerShips } = placeShipsRandomly(createInitialShips());
      setGameState(prev => ({
        ...prev,
        playerBoard,
        playerShips,
        gamePhase: 'playing',
        currentTurn: 'player',
      }));
    } else {
      // In normal mode, check if player has placed all ships
      const allShipsPlaced = gameState.playerShips.every(ship => ship.isPlaced);
      if (allShipsPlaced) {
        setGameState(prev => ({
          ...prev,
          gamePhase: 'playing',
          currentTurn: 'player',
        }));
      }
    }
  };

  const handlePlayerAttack = (position: Position) => {
    // Don't allow clicks when in AI vs AI mode or when not player's turn
    if (aiVsAi || gameState.gamePhase !== 'playing' || gameState.currentTurn !== 'player') return;

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

  // AI turn logic (Red AI)
  useEffect(() => {
    if (gameState.gamePhase === 'playing' && gameState.currentTurn === 'ai' && !aiMoveInProgress) {
      const timer = setTimeout(async () => {
        setAiMoveInProgress(true);
        let aiMove: Position;
        
        try {
          if (aiVsAi && aiInstance.current) {
            // In AI vs AI mode, we must use LM Studio AI with no fallback
            aiMove = await aiInstance.current.makeMove(
              gameState.playerBoard,
              aiPreviousHits,
              aiHitPositions.current,
              aiSunkShips.current
            );
            console.log("Red AI made move:", aiMove);
          } else if (useAI && aiInstance.current) {
            try {
              // Use LM Studio AI in player vs AI mode
              aiMove = await aiInstance.current.makeMove(
                gameState.playerBoard,
                aiPreviousHits,
                aiHitPositions.current,
                aiSunkShips.current
              );
              console.log("Red AI made move:", aiMove);
            } catch (error) {
              console.error("Failed to get move from Red AI:", error);
              // Fallback to simple AI only in player vs AI mode
              aiMove = getSimpleAIMove(gameState.playerBoard, aiPreviousHits);
              console.log("Using fallback for Red AI move:", aiMove);
            }
          } else {
            // Fallback to simple AI when not using LM Studio
            aiMove = getSimpleAIMove(gameState.playerBoard, aiPreviousHits);
          }
        } catch (error) {
          // Handle error differently depending on game mode
          if (aiVsAi) {
            console.error('Red AI move failed in AI vs AI mode. Retrying with LM Studio AI:', error);
            
            // Try again with the same LM Studio API but with a simpler request
            try {
              // Retry with LM Studio AI one more time
              aiMove = await aiInstance.current!.makeMove(
                gameState.playerBoard,
                aiPreviousHits,
                [], // Simplify the request by removing additional context
                []
              );
              console.log("Red AI retry succeeded:", aiMove);
            } catch (retryError) {
              console.error('Red AI retry also failed, using last resort move:', retryError);
              // Last resort - pick a valid move with minimal AI
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
            // In normal player vs AI mode, we can use the simple AI as fallback
            console.error('AI move failed in player vs AI mode, using simple fallback:', error);
            aiMove = getSimpleAIMove(gameState.playerBoard, aiPreviousHits);
          }
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

        setAiMoveInProgress(false);
      }, 1500); // Slightly longer delay for AI to "think"

      return () => clearTimeout(timer);
    }
  }, [gameState.currentTurn, gameState.gamePhase, gameState.playerBoard, gameState.playerShips, useAI, aiPreviousHits, aiMoveInProgress, aiVsAi]);

  // Player AI turn logic (Blue AI) - for AI vs AI mode
  useEffect(() => {
    if (gameState.gamePhase === 'playing' && gameState.currentTurn === 'player' && aiVsAi && !playerAiMoveInProgress) {
      const timer = setTimeout(async () => {
        setPlayerAiMoveInProgress(true);
        let playerAiMove: Position;
        
        try {
          // In AI vs AI mode, we always use LM Studio AI for the player side too
          if (aiVsAi && playerAiInstance.current) {
            playerAiMove = await playerAiInstance.current.makeMove(
              gameState.aiBoard,
              playerAiPreviousHits,
              playerAiHitPositions.current, 
              playerAiSunkShips.current
            );
            console.log("Blue AI made move:", playerAiMove);
          } else {
            // This code path should never be reached in AI vs AI mode
            console.error("Unexpected condition: Player AI turn in non-AI vs AI mode");
            playerAiMove = getSimpleAIMove(gameState.aiBoard, playerAiPreviousHits);
          }
        } catch (error) {
          console.error('Player AI move failed in AI vs AI mode. Retrying with LM Studio AI:', error);
          
          // Try again with the same LM Studio API but with a simpler request
          try {
            // Retry with LM Studio AI one more time
            playerAiMove = await playerAiInstance.current!.makeMove(
              gameState.aiBoard,
              playerAiPreviousHits,
              [], // Simplify the request by removing additional context
              []
            );
            console.log("Blue AI retry succeeded:", playerAiMove);
          } catch (retryError) {
            console.error('Blue AI retry also failed, using last resort move:', retryError);
            // Last resort - pick a valid move with minimal AI
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
        if (useAI && playerAiInstance.current) {
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
      }, 1000); // Slightly shorter delay than the enemy AI
      
      return () => clearTimeout(timer);
    }
  }, [gameState.currentTurn, gameState.gamePhase, gameState.aiBoard, gameState.aiShips, useAI, playerAiPreviousHits, playerAiMoveInProgress, aiVsAi]);

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

  const toggleAIMode = () => {
    setUseAI(!useAI);
  };
  
  const toggleAIVsAIMode = () => {
    if (!aiVsAi) {
      // Switching TO AI vs AI mode
      
      // Auto-place ships if in setup phase
      if (gameState.gamePhase === 'setup') {
        handleRandomPlacement();
      }
      
      // ALWAYS force LM Studio AI to be used in AI vs AI mode
      setUseAI(true);
      
      // If AI instances don't exist yet, create them
      if (!aiInstance.current || !playerAiInstance.current) {
        const defaultConfig: AIConfig = {
          endpoint: 'http://localhost:1234',
          model: 'local-model',
          temperature: 0.7,
          maxTokens: 50,
          debug: true
        };
        
        aiInstance.current = new LMStudioAI(defaultConfig);
        playerAiInstance.current = new LMStudioAI(defaultConfig);
        console.log('🤖 Created new AI instances for AI vs AI mode');
      }
      
      console.log('🤖 Enabled AI vs AI mode with LM Studio AI');
    }
    
    // Toggle the mode
    setAiVsAi(!aiVsAi);
  };

  const handleResetGame = () => {
    const { board: aiBoard, placedShips: aiShips } = placeShipsRandomly(createInitialShips());
    
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
    setPlayerAiPreviousHits([]);
  };

  return (
    <div className="app">
      <div className="game-header">
        <h1>⚓ Battleship Game ⚓</h1>
        <div className="ai-controls">
          <button 
            className={`ai-toggle ${useAI ? 'active' : ''}`}
            onClick={toggleAIMode}
            disabled={aiVsAi} // Disable toggle when in AI vs AI mode
            title={useAI ? 'Using LM Studio AI' : 'Using Simple AI'}
          >
            {useAI ? '🤖 LM Studio AI' : '🎯 Simple AI'}
          </button>
          <button
            className={`ai-toggle ${aiVsAi ? 'active' : ''}`}
            onClick={toggleAIVsAIMode}
            title={aiVsAi ? 'AI vs AI Mode (LM Studio)' : 'Player vs AI Mode'}
          >
            {aiVsAi ? '🤖 AI vs AI' : '👤 Player vs AI'}
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
        <div className="board-container">
          <div className="board-wrapper player-board">
            <h2>{aiVsAi ? '� Blue AI Fleet' : '�🚢 Your Fleet'}</h2>
            <Board 
              board={gameState.playerBoard}
              ships={gameState.playerShips}
              isPlayer={true}
              showShips={true}
              onCellClick={() => {}} // Player can't attack own board
              gamePhase={gameState.gamePhase}
            />
          </div>
          <div className="board-wrapper enemy-board">
            <h2>{aiVsAi ? '🔴 Red AI Fleet' : '🏴‍☠️ Enemy Fleet'}</h2>
            <Board 
              board={gameState.aiBoard}
              ships={gameState.aiShips}
              isPlayer={false}
              showShips={gameState.gamePhase === 'gameOver'} 
              onCellClick={handlePlayerAttack}
              gamePhase={gameState.gamePhase}
            />
          </div>
        </div>

        <div className="game-sidebar">
          <GameStatus 
            gamePhase={gameState.gamePhase}
            currentTurn={gameState.currentTurn}
            winner={gameState.winner}
            playerShips={gameState.playerShips}
            aiShips={gameState.aiShips}
            onStartGame={handleStartGame}
            onResetGame={handleResetGame}
            aiVsAi={aiVsAi}
          />
          
          {gameState.gamePhase === 'setup' && !aiVsAi && (
            <ShipSelector 
              ships={gameState.playerShips}
              selectedShip={gameState.selectedShip}
              onShipSelect={handleShipSelect}
              onShipRotate={handleShipRotate}
              onRandomPlacement={handleRandomPlacement}
              onClearBoard={handleClearBoard}
            />
          )}
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
