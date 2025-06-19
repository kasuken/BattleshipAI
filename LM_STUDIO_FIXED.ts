// This is a simpler fixed version to replace aiService.ts
// Run npm run dev and then copy this content over the existing aiService.ts file

// AI service for integrating with LM Studio
import type { Board, Position } from './types';

export interface AIConfig {
  endpoint: string;
  model: string;
  temperature: number;
  maxTokens: number;
  debug?: boolean;
}

export interface GameState {
  board: string[][];
  previousMoves: Position[];
  hitPositions: Position[];
  missPositions: Position[];
  sunkShips: string[];
  gameHistory: string[];
}

export class LMStudioAI {
  private config: AIConfig;
  private gameHistory: string[] = [];

  constructor(config: AIConfig) {
    this.config = config;
  }

  private boardToString(board: Board): string[][] {
    return board.map(row =>
      row.map(cell => {
        if (cell.isHit && cell.hasShip) return 'H'; // Hit
        if (cell.isMiss) return 'M'; // Miss
        if (cell.hasShip) return 'S'; // Ship (AI shouldn't see this)
        return '.'; // Empty water
      })
    );
  }

  private formatBoardForAI(board: string[][]): string {
    let formatted = '   A B C D E F G H I J\n';
    board.forEach((row, index) => {
      const rowNum = (index + 1).toString().padStart(2, ' ');
      formatted += `${rowNum} ${row.join(' ')}\n`;
    });
    return formatted;
  }

  private createGameStateContext(gameState: GameState): string {
    const boardDisplay = this.formatBoardForAI(gameState.board);
    
    return `BATTLESHIP AI - Choose your next move.

Current Board State:
${boardDisplay}

Legend: '.' = water, 'H' = hit, 'M' = miss

Previous moves: ${gameState.previousMoves.map(pos => 
  `${String.fromCharCode(65 + pos.col)}${pos.row + 1}`
).join(', ') || 'None'}

Current hits: ${gameState.hitPositions.map(pos => 
  `${String.fromCharCode(65 + pos.col)}${pos.row + 1}`
).join(', ') || 'None'}

Ships sunk: ${gameState.sunkShips.join(', ') || 'None'}

Choose the most strategic grid coordinate to attack next. Respond with ONLY the coordinate like "A1", "B5", or "J10".`;
  }

  async makeMove(
    board: Board,
    previousMoves: Position[],
    hitPositions: Position[],
    sunkShips: string[] = []
  ): Promise<Position> {
    try {
      // Prepare game state
      const gameState: GameState = {
        board: this.boardToString(board),
        previousMoves,
        hitPositions,
        missPositions: previousMoves.filter(pos => board[pos.row][pos.col].isMiss),
        sunkShips,
        gameHistory: this.gameHistory
      };

      const prompt = this.createGameStateContext(gameState);
      
      console.log("🔄 AI is making a move...");
      
      try {
        // Direct API call with simple format
        const response = await fetch(`${this.config.endpoint}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: "user", content: prompt }],
            max_tokens: 10
          })
        });
        
        console.log(`📡 Response status: ${response.status}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ API Error: ${errorText}`);
          throw new Error(`API call failed: ${errorText}`);
        }
        
        const data = await response.json();
        console.log("📊 API Response:", data);
        
        // Extract the response text
        let responseText = "";
        if (data.choices?.[0]?.message?.content) {
          responseText = data.choices[0].message.content.trim();
        } else if (data.choices?.[0]?.text) {
          responseText = data.choices[0].text.trim();
        } else {
          throw new Error("No valid response from API");
        }
        
        console.log(`🎯 AI chose: ${responseText}`);
        
        // Parse coordinate from response
        const coordinate = this.parseCoordinate(responseText);
        
        // Validate move
        if (this.isValidMove(coordinate, board)) {
          // Record the move
          const moveDesc = `AI targeted ${String.fromCharCode(65 + coordinate.col)}${coordinate.row + 1}`;
          this.gameHistory.push(moveDesc);
          
          if (this.gameHistory.length > 10) {
            this.gameHistory = this.gameHistory.slice(-8);
          }
          
          return coordinate;
        } else {
          throw new Error(`Invalid move: ${responseText}`);
        }
      } catch (error) {
        console.error(`❌ API call failed: ${error}`);
        // Fall through to backup strategy
      }
      
      // If direct approach fails, use backup strategy
      return this.getStrategicBackupMove(board, hitPositions);
    } catch (error) {
      console.error('🔄 Using strategic fallback due to error:', error);
      return this.getStrategicBackupMove(board, hitPositions);
    }
  }

  private parseCoordinate(response: string): Position {
    // Look for coordinate pattern (A1, B5, J10, etc.)
    const match = response.match(/([A-J])(\d{1,2})/i);
    
    if (!match) {
      throw new Error(`Cannot parse coordinate from: "${response}"`);
    }

    const col = match[1].toUpperCase().charCodeAt(0) - 65; // A=0, B=1, etc.
    const row = parseInt(match[2]) - 1; // 1=0, 2=1, etc.

    return { row, col };
  }

  private isValidMove(position: Position, board: Board): boolean {
    const { row, col } = position;
    
    // Check bounds
    if (row < 0 || row >= 10 || col < 0 || col >= 10) {
      return false;
    }

    // Check if already targeted
    if (board[row][col].isHit || board[row][col].isMiss) {
      return false;
    }

    return true;
  }

  private getStrategicBackupMove(board: Board, hitPositions: Position[]): Position {
    console.log("🎲 Using strategic backup move");
    
    // If there are previous hits, try adjacent positions
    if (hitPositions.length > 0) {
      const recentHit = hitPositions[hitPositions.length - 1];
      const adjacents = [
        { row: recentHit.row - 1, col: recentHit.col },
        { row: recentHit.row + 1, col: recentHit.col },
        { row: recentHit.row, col: recentHit.col - 1 },
        { row: recentHit.row, col: recentHit.col + 1 }
      ].filter(pos => this.isValidMove(pos, board));

      if (adjacents.length > 0) {
        return adjacents[Math.floor(Math.random() * adjacents.length)];
      }
    }

    // Fallback: random available position
    const available: Position[] = [];
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        if (this.isValidMove({ row, col }, board)) {
          available.push({ row, col });
        }
      }
    }

    if (available.length === 0) {
      return { row: 0, col: 0 }; // Emergency fallback
    }

    return available[Math.floor(Math.random() * available.length)];
  }

  // Record move results for AI learning
  recordMoveResult(position: Position, wasHit: boolean, wasSunk: boolean, shipName?: string): void {
    const coord = `${String.fromCharCode(65 + position.col)}${position.row + 1}`;
    
    if (wasSunk && shipName) {
      this.gameHistory.push(`SUNK ${shipName} at ${coord}!`);
    } else if (wasHit) {
      this.gameHistory.push(`HIT at ${coord}`);
    } else {
      this.gameHistory.push(`MISS at ${coord}`);
    }
  }

  // Test connection to LM Studio
  async testConnection(): Promise<{ success: boolean; models?: string[]; error?: string }> {
    try {
      console.log('🔍 Testing LM Studio connection...');
      
      // Simple chat completions test
      const response = await fetch(`${this.config.endpoint}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Say hello" }],
          max_tokens: 10
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `API error: ${errorText}` };
      }
      
      const data = await response.json();
      console.log('✅ Connection test successful:', data);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Update configuration
  updateConfig(newConfig: AIConfig): void {
    this.config = { ...newConfig };
    console.log('🔧 AI config updated:', this.config);
  }

  // Reset for new game
  resetGame(): void {
    this.gameHistory = [];
    console.log('🔄 AI game state reset');
  }
}
