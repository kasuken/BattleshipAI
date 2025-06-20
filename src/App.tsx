import { useState, useEffect, useRef, useCallback } from 'react';
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
  }));  // AI states
  const [aiPreviousHits, setAiPreviousHits] = useState<Position[]>([]);
  const [playerAiPreviousHits, setPlayerAiPreviousHits] = useState<Position[]>([]);
  const [showAISettings, setShowAISettings] = useState(false);
  const [aiMoveInProgress, setAiMoveInProgress] = useState(false);
  const [playerAiMoveInProgress, setPlayerAiMoveInProgress] = useState(false);
  const [autoRestartCountdown, setAutoRestartCountdown] = useState<number | null>(null);
  const [blueAIWins, setBlueAIWins] = useState(0);
  const [redAIWins, setRedAIWins] = useState(0);
  const [gameLogs, setGameLogs] = useState<string[]>([]);
  const [showGameLogs, setShowGameLogs] = useState(false);
  
  // Function to add entries to the game log (at the beginning to avoid reference issues)
  const addGameLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setGameLogs(prev => [...prev, logEntry]);
    
    // Scroll log to bottom after update (delayed to ensure DOM has updated)
    setTimeout(() => {
      const logContainer = document.getElementById('game-log-entries');
      if (logContainer) {
        logContainer.scrollTop = logContainer.scrollHeight;
      }
    }, 50);
  }, []);
  
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
    
    // Log game start
    addGameLog('⚓ New game started! Blue AI goes first.');
  };
  // Red AI turn logic
  useEffect(() => {
    if (gameState.gamePhase === 'playing' && gameState.currentTurn === 'ai' && !aiMoveInProgress) {
      const timer = setTimeout(async () => {
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
        }        const { newBoard, newShips, hit, sunk } = makeAttack(gameState.playerBoard, gameState.playerShips, aiMove);

        // Add log entry for the move
        const col = String.fromCharCode(65 + aiMove.col);
        const row = aiMove.row + 1;
        const moveCoord = `${col}${row}`;
          // Update AI tracking
        if (hit) {
          aiHitPositions.current.push(aiMove);
          setAiPreviousHits(prev => [...prev, aiMove]);
          addGameLog(`🔴 Red AI fired at ${moveCoord} - HIT! 🔥`);
          // Record move result for AI learning
          if (aiInstance.current) {
            aiInstance.current.recordMoveResult(aiMove, true, sunk, sunk ? newShips.find(ship => 
              ship.positions.some(pos => pos.row === aiMove.row && pos.col === aiMove.col))?.name : undefined);
          }
        } else {
          addGameLog(`🔴 Red AI fired at ${moveCoord} - Miss 💦`);
          // Record move result for AI learning
          if (aiInstance.current) {
            aiInstance.current.recordMoveResult(aiMove, false, false);
          }
        }

        // Check if a ship was sunk
        if (sunk) {
          const sunkShip = newShips.find(ship => 
            ship.positions.some(pos => pos.row === aiMove.row && pos.col === aiMove.col) &&
            ship.hits.every(hit => hit)
          );
          if (sunkShip && !aiSunkShips.current.includes(sunkShip.name)) {
            aiSunkShips.current.push(sunkShip.name);
            addGameLog(`🔴 Red AI sunk Blue AI's ${sunkShip.name}! 💥`);
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
        }));        // Check for AI win
        if (isGameOver(newShips)) {
          // Increment Red AI win count
          setRedAIWins(prevWins => prevWins + 1);
          console.log('🔴 Red AI won a game!');
          
          // Log game over
          addGameLog('🏆 Game over! Red AI wins the battle!');
          
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
  }, [gameState.currentTurn, gameState.gamePhase, gameState.playerBoard, gameState.playerShips, aiPreviousHits, aiMoveInProgress, addGameLog]);

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
        }        const { newBoard, newShips, hit, sunk } = makeAttack(gameState.aiBoard, gameState.aiShips, playerAiMove);

        // Add log entry for the move
        const col = String.fromCharCode(65 + playerAiMove.col);
        const row = playerAiMove.row + 1;
        const moveCoord = `${col}${row}`;
        
        // Update Player AI tracking
        if (hit) {
          playerAiHitPositions.current.push(playerAiMove);
          setPlayerAiPreviousHits(prev => [...prev, playerAiMove]);
          addGameLog(`🔵 Blue AI fired at ${moveCoord} - HIT! 🔥`);
        } else {
          addGameLog(`🔵 Blue AI fired at ${moveCoord} - Miss 💦`);
        }

        // Check if Player AI sunk a ship
        if (sunk) {
          const sunkShip = newShips.find(ship => 
            ship.positions.some(pos => pos.row === playerAiMove.row && pos.col === playerAiMove.col) &&
            ship.hits.every(hit => hit)
          );
          if (sunkShip && !playerAiSunkShips.current.includes(sunkShip.name)) {
            playerAiSunkShips.current.push(sunkShip.name);
            addGameLog(`🔵 Blue AI sunk Red AI's ${sunkShip.name}! 💥`);
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
        }));        // Check for Player AI win
        if (isGameOver(newShips)) {
          // Increment Blue AI win count
          setBlueAIWins(prevWins => prevWins + 1);
          console.log('🔵 Blue AI won a game!');
          
          // Log game over
          addGameLog('🏆 Game over! Blue AI wins the battle!');
          
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
  }, [gameState.currentTurn, gameState.gamePhase, gameState.aiBoard, gameState.aiShips, playerAiPreviousHits, playerAiMoveInProgress, addGameLog]);

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
  };  const handleResetGame = useCallback(() => {
    const { board: aiBoard, placedShips: aiShips } = placeShipsRandomly(createInitialShips());
    const { board: playerBoard, placedShips: playerShips } = placeShipsRandomly(createInitialShips());
    
    // Log game reset
    addGameLog('🔄 Game reset! Ships randomly placed for both AIs.');
    
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
    
    // First reset to setup state
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
    
    // Then automatically start a new game after a short delay
    setTimeout(() => {
      console.log('🎮 Auto-starting new game!');
      setGameState(prev => ({
        ...prev,
        gamePhase: 'playing',      }));    }, 500);
  }, [addGameLog]);

  // Auto-restart effect
  useEffect(() => {    // Start countdown when game is over
    if (gameState.gamePhase === 'gameOver' && autoRestartCountdown === null) {
      console.log('🔄 Game over! Starting auto-restart countdown: 20 seconds');
      addGameLog('⏱️ Auto-restart countdown started (20 seconds)');
      setAutoRestartCountdown(20);
    }
    
    // Handle the countdown timer
    if (autoRestartCountdown !== null && autoRestartCountdown > 0) {
      const timer = setTimeout(() => {
        setAutoRestartCountdown(prev => prev !== null ? prev - 1 : null);
        
        // Log only at certain intervals to avoid too many messages
        if (autoRestartCountdown === 15 || autoRestartCountdown === 10 || 
            autoRestartCountdown === 5 || autoRestartCountdown <= 3) {
          console.log(`⏱️ Auto-restart in ${autoRestartCountdown - 1} seconds...`);
          if (autoRestartCountdown === 5) {
            addGameLog(`⏱️ Auto-restart in 5 seconds...`);
          }
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
    
    // Auto-restart the game when countdown reaches zero
    if (autoRestartCountdown === 0) {
      console.log('🎮 Auto-restarting new game!');
      addGameLog('🎮 Auto-restarting new game!');
      handleResetGame();
      setAutoRestartCountdown(null);
    }
  }, [gameState.gamePhase, autoRestartCountdown, handleResetGame, addGameLog]);

  // Load win counts from local storage
  useEffect(() => {
    const savedBlueWins = localStorage.getItem('blueAIWins');
    const savedRedWins = localStorage.getItem('redAIWins');
    
    if (savedBlueWins) {
      setBlueAIWins(parseInt(savedBlueWins, 10));
    }
    
    if (savedRedWins) {
      setRedAIWins(parseInt(savedRedWins, 10));
    }  }, []);
  // The addGameLog function is now defined at the beginning of the component

  // Save win counts to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('blueAIWins', blueAIWins.toString());
  }, [blueAIWins]);
  
  useEffect(() => {
    localStorage.setItem('redAIWins', redAIWins.toString());
  }, [redAIWins]);

  return (
    <div className="app">      <div className="game-header">
        <h1>⚓ Battleship AI vs AI ⚓</h1>
        
        <div className="win-counter-display">
          <div className="win-counter blue">
            <span className="win-counter-icon">🔵</span>
            <span className="win-counter-label">Blue AI:</span>
            <span className="win-counter-value">{blueAIWins}</span>
            <span className="win-counter-text">wins</span>
          </div>
          
          <div className="win-counter-separator">vs</div>
          
          <div className="win-counter red">
            <span className="win-counter-icon">🔴</span>
            <span className="win-counter-label">Red AI:</span>
            <span className="win-counter-value">{redAIWins}</span>
            <span className="win-counter-text">wins</span>
          </div>
        </div>
          <div className="ai-controls">          <button 
            className="ai-settings-btn"
            onClick={() => setShowAISettings(true)}
            title="Configure AI Settings"
          >
            ⚙️ AI Settings
          </button>
          <button 
            className="reset-stats-btn"
            onClick={() => {
              setBlueAIWins(0);
              setRedAIWins(0);
              localStorage.removeItem('blueAIWins');
              localStorage.removeItem('redAIWins');
            }}
            title="Reset Win Statistics"
          >
            🔄 Reset Stats
          </button>
          <button 
            className={`toggle-log-btn ${showGameLogs ? 'active' : ''}`}
            onClick={() => setShowGameLogs(!showGameLogs)}
            title="Toggle Game Log"
          >
            📜 Game Log
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
            onStartGame={handleStartGame}            onResetGame={handleResetGame}
          />
          {gameState.gamePhase === 'gameOver' && autoRestartCountdown !== null && (
            <div className="auto-restart-countdown">
              <p>🔄 New game starting in {autoRestartCountdown} seconds...</p>
              <button onClick={() => setAutoRestartCountdown(null)}>
                Cancel Auto-Restart
              </button>
            </div>
          )}
        </div>
      </div>      {showAISettings && (
        <AISettings 
          isVisible={showAISettings}
          onClose={() => setShowAISettings(false)}
          onConfigChange={handleAIConfigChange}
          onTestConnection={handleTestConnection}
        />
      )}
        {/* Game Log Panel */}
      <div className="game-log-container">
        <div className="game-log-header" onClick={() => setShowGameLogs(!showGameLogs)}>
          <span>📜 Game Log {gameLogs.length > 0 && `(${gameLogs.length})`}</span>
          <button>{showGameLogs ? '▼ Hide' : '▲ Show'}</button>
        </div>
        
        {showGameLogs && (
          <div className="game-log-content">
            {gameLogs.length === 0 ? (
              <div className="game-log-empty">No game events yet. Start a game to see the action!</div>
            ) : (
              <>
                <div className="game-log-entries" id="game-log-entries">
                  {gameLogs.map((log, index) => (
                    <div key={index} className="game-log-entry">
                      {log}
                    </div>
                  ))}
                </div>
                <div className="game-log-controls">
                  <button 
                    className="clear-log-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setGameLogs([]);
                      addGameLog('Log cleared');
                    }}
                  >
                    🗑️ Clear Log
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
