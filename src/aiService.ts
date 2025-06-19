// AI service for integrating with LM Studio
import type { Board, Position } from './types';

export interface AIConfig {
  endpoint: string;
  model: string;
  temperature: number;
  maxTokens: number;
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

      // Try multiple request formats for better LM Studio compatibility
      const result = await this.tryMultipleFormats(prompt, board, hitPositions);
      
      return result;

    } catch (error) {
      console.error('🤖 LM Studio AI failed, using strategic fallback:', error);
      return this.getStrategicBackupMove(board, hitPositions);
    }
  }

  private async tryMultipleFormats(prompt: string, board: Board, hitPositions: Position[]): Promise<Position> {
    const formats = [
      // Format 1: Standard OpenAI-compatible format
      {
        url: `${this.config.endpoint}/v1/chat/completions`,
        body: {
          messages: [
            {
              role: "system",
              content: "You are a Battleship AI. Respond with only a coordinate like A1, B5, etc."
            },
            {
              role: "user", 
              content: prompt
            }
          ],
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
          stream: false,
          ...(this.config.model && this.config.model !== 'local-model' ? { model: this.config.model } : {})
        }
      },
      
      // Format 2: Simple chat format
      {
        url: `${this.config.endpoint}/v1/chat/completions`,
        body: {
          messages: [{ role: "user", content: prompt }],
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens
        }
      },

      // Format 3: Legacy completions format
      {
        url: `${this.config.endpoint}/v1/completions`,
        body: {
          prompt: prompt,
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
          stop: ["\n", " "]
        }
      }
    ];

    for (let i = 0; i < formats.length; i++) {
      try {
        console.log(`🔄 Trying LM Studio format ${i + 1}/3...`);
        const result = await this.makeRequest(formats[i], board, hitPositions);
        console.log(`✅ Format ${i + 1} succeeded!`);
        return result;
      } catch (error) {
        console.warn(`❌ Format ${i + 1} failed:`, error);
        continue;
      }
    }

    throw new Error('All LM Studio formats failed');
  }

  private async makeRequest(
    format: { url: string; body: Record<string, unknown> }, 
    board: Board, 
    hitPositions: Position[]
  ): Promise<Position> {
    console.log('📡 Request URL:', format.url);
    console.log('📋 Request body:', JSON.stringify(format.body, null, 2));

    const response = await fetch(format.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(format.body)
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('📦 Response data:', data);

    // Extract AI response from different formats
    let aiResponse: string | undefined;
    
    if (data.choices?.[0]?.message?.content) {
      aiResponse = data.choices[0].message.content.trim();
    } else if (data.choices?.[0]?.text) {
      aiResponse = data.choices[0].text.trim();
    } else if (data.response) {
      aiResponse = data.response.trim();
    }

    if (!aiResponse) {
      throw new Error('No response content from AI');
    }

    console.log('🎯 AI response:', aiResponse);

    // Parse coordinate from response
    const coordinate = this.parseCoordinate(aiResponse);
    
    // Validate move
    if (!this.isValidMove(coordinate, board)) {
      console.warn('⚠️ Invalid move suggested, using fallback');
      return this.getStrategicBackupMove(board, hitPositions);
    }

    // Record move
    const moveDesc = `AI targeted ${String.fromCharCode(65 + coordinate.col)}${coordinate.row + 1}`;
    this.gameHistory.push(moveDesc);
    
    if (this.gameHistory.length > 10) {
      this.gameHistory = this.gameHistory.slice(-8);
    }

    return coordinate;
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
    // Smart fallback when AI fails
    
    // First priority: adjacent to recent hits
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
      
      const response = await fetch(`${this.config.endpoint}/v1/models`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const data = await response.json();
      const models = data.data?.map((model: { id: string }) => model.id) || [];
      
      console.log('✅ Connection successful, models:', models);
      return { success: true, models };

    } catch (error) {
      console.error('❌ Connection failed:', error);
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
