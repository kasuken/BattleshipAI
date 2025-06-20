// AI service for integrating with LM Studio
import type { Board, Position } from "./types";
import { OpenAI } from "openai";

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
  private lastMoves: { position: Position; wasHit: boolean }[] = [];
  private openai: OpenAI; // Add OpenAI client instance

  constructor(config: AIConfig) {
    this.config = config;    // Initialize the OpenAI client with custom baseURL pointing to LM Studio
    this.openai = new OpenAI({
      baseURL: this.config.endpoint,
      apiKey: "not-needed", // LM Studio doesn't require an API key by default
      dangerouslyAllowBrowser: true, // Allow usage in browser
      // In a Node.js environment we'd use fetch with ProxyAgent, but for browser we can just use the baseURL
    });
  }

  private boardToString(board: Board): string[][] {
    return board.map((row) =>
      row.map((cell) => {
        if (cell.isHit && cell.hasShip) return "H"; // Hit
        if (cell.isMiss) return "M"; // Miss
        if (cell.hasShip) return "S"; // Ship (AI shouldn't see this)
        return "."; // Empty water
      })
    );
  }

  private formatBoardForAI(board: string[][]): string {
    let formatted = "   A B C D E F G H I J\n";
    board.forEach((row, index) => {
      const rowNum = (index + 1).toString().padStart(2, " ");
      formatted += `${rowNum} ${row.join(" ")}\n`;
    });
    return formatted;
  }

  private createGameStateContext(gameState: GameState): string {
    const boardDisplay = this.formatBoardForAI(gameState.board);

    // Format the last moves with their results
    let lastMovesInfo = "";
    if (this.lastMoves.length > 0) {
      lastMovesInfo =
        "\nLast moves and results:\n" +
        this.lastMoves
          .map((move) => {
            const coord = `${String.fromCharCode(65 + move.position.col)}${
              move.position.row + 1
            }`;
            return `- ${coord}: ${move.wasHit ? "HIT" : "MISS"}`;
          })
          .join("\n");
    }

    return `BATTLESHIP AI - Choose your next move.

Ships are placed on a 10x10 grid (A1 to J10).
Ships fleet:
- Carrier (5 cells)
- Battleship (4 cells)
- Cruiser (3 cells)
- Submarine (3 cells)
- Destroyer (2 cells)

Current Board State:
${boardDisplay}

Legend: '.' = water, 'H' = hit, 'M' = miss

Previous moves: ${
      gameState.previousMoves
        .map((pos) => `${String.fromCharCode(65 + pos.col)}${pos.row + 1}`)
        .join(", ") || "None"
    }

Current hits: ${
      gameState.hitPositions
        .map((pos) => `${String.fromCharCode(65 + pos.col)}${pos.row + 1}`)
        .join(", ") || "None"
    }

Ships sunk: ${gameState.sunkShips.join(", ") || "None"}${lastMovesInfo}

Battleship Strategy Guide:
1. If you just got a HIT in your last move, you MUST target ONLY an adjacent cell (up, down, left, right), based on the Ship Fleet information and previous hits direction
2. If you have multiple HITS in a line, you MUST continue in that direction (based on the Ship Fleet information and previous hits direction)
3. If you hit the end of a ship (got a MISS after HITs), you MUST try the opposite direction (based on the Ship Fleet information and previous hits direction)
4. Space your shots efficiently if searching for new ships
5. Remember ships are 2-5 cells long and cannot be placed diagonally

Choose the most strategic coordinate to attack next. Respond with ONLY the coordinate like "A1", "B5", or "J10".`;
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
        missPositions: previousMoves.filter(
          (pos) => board[pos.row][pos.col].isMiss
        ),
        sunkShips,
        gameHistory: this.gameHistory,
      };

      const prompt = this.createGameStateContext(gameState);

      console.log("🔍 AI Prompt:", prompt);

      console.log("🔄 AI is making a move...");
      try {
        // Direct API call with simple format
        const apiStartTime = Date.now();
        console.log(
          `📡 Sending request to API endpoint: ${this.config.endpoint}`
        );

        console.log(this.openai);

        const response = await this.openai.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          max_tokens: 10,
          model: this.config.model,
          temperature: this.config.temperature,
        });

        const apiTime = Date.now() - apiStartTime;
        console.log(
          `📡 Response received successfully (took ${apiTime}ms)`
        );

        // Extract the response text
        let responseText = "";
        if (response.choices?.[0]?.message?.content) {
          responseText = response.choices[0].message.content.trim();
        } else {
          throw new Error(
            "No valid response content found in API response: " +
              JSON.stringify(response.choices || [])
          );
        }

        console.log(`🎯 AI chose: ${responseText}`);

        // Parse coordinate from response
        const coordinate = this.parseCoordinate(responseText);

        // Validate move
        if (this.isValidMove(coordinate, board)) {
          // Record the move
          const moveDesc = `AI targeted ${String.fromCharCode(
            65 + coordinate.col
          )}${coordinate.row + 1}`;
          this.gameHistory.push(moveDesc);          if (this.gameHistory.length > 10) {
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
      console.error("🔄 Using strategic fallback due to error:", error);
      return this.getStrategicBackupMove(board, hitPositions);
    }
  }
  private parseCoordinate(response: string): Position {
    // Look for coordinate pattern (A1, B5, J10, etc.)
    console.log(`🔍 Attempting to parse coordinate from: "${response}"`);

    // Try to extract using regex pattern
    const match = response.match(/([A-J])(\d{1,2})/i);

    if (!match) {
      // If no match, try to find any letters and numbers that could be a coordinate
      console.error(
        `🚫 No standard coordinate pattern found in: "${response}"`
      );

      // Look for any single letter followed by any number as a fallback
      const fallbackMatch = response.match(/([A-Za-z])(\d{1,2})/);

      if (fallbackMatch) {
        const letter = fallbackMatch[1].toUpperCase();
        const number = parseInt(fallbackMatch[2]);

        // Check if this could plausibly be a coordinate
        if (letter >= "A" && letter <= "J" && number >= 1 && number <= 10) {
          console.log(
            `⚠️ Found potential coordinate with fallback method: ${letter}${number}`
          );
          const col = letter.charCodeAt(0) - 65; // A=0, B=1, etc.
          const row = number - 1; // 1=0, 2=1, etc.
          return { row, col };
        }
      }

      throw new Error(`Cannot parse coordinate from: "${response}"`);
    }

    const letter = match[1].toUpperCase();
    const number = parseInt(match[2]);

    // Validate the extracted values
    if (letter < "A" || letter > "J") {
      throw new Error(`Invalid column letter: ${letter}`);
    }

    if (number < 1 || number > 10) {
      throw new Error(`Invalid row number: ${number}`);
    }

    const col = letter.charCodeAt(0) - 65; // A=0, B=1, etc.
    const row = number - 1; // 1=0, 2=1, etc.

    console.log(
      `✅ Successfully parsed coordinate: ${letter}${number} -> [${row},${col}]`
    );
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

  private getStrategicBackupMove(
    board: Board,
    hitPositions: Position[]
  ): Position {
    console.log("🎲 Using strategic backup move");

    // If there are previous hits, try adjacent positions
    if (hitPositions.length > 0) {
      const recentHit = hitPositions[hitPositions.length - 1];
      const adjacents = [
        { row: recentHit.row - 1, col: recentHit.col },
        { row: recentHit.row + 1, col: recentHit.col },
        { row: recentHit.row, col: recentHit.col - 1 },
        { row: recentHit.row, col: recentHit.col + 1 },
      ].filter((pos) => this.isValidMove(pos, board));

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

  // Get the last moves with results (for strategic decision making)
  getLastMoves(): { position: Position; wasHit: boolean }[] {
    return [...this.lastMoves];
  }

  // Record move results for AI learning
  recordMoveResult(
    position: Position,
    wasHit: boolean,
    wasSunk: boolean,
    shipName?: string
  ): void {
    const coord = `${String.fromCharCode(65 + position.col)}${
      position.row + 1
    }`;

    // Add to last moves (limit to last 3)
    this.lastMoves.push({ position, wasHit });
    if (this.lastMoves.length > 3) {
      this.lastMoves.shift(); // Remove oldest move
    }

    if (wasSunk && shipName) {
      this.gameHistory.push(`SUNK ${shipName} at ${coord}!`);
    } else if (wasHit) {
      this.gameHistory.push(`HIT at ${coord}`);
    } else {
      this.gameHistory.push(`MISS at ${coord}`);
    }
  }

  // Test connection to LM Studio
  async testConnection(): Promise<{
    success: boolean;
    models?: string[];
    error?: string;
  }> {
    try {      console.log("🔍 Testing LM Studio connection...");      // Simple chat completions test using OpenAI SDK
      const response = await this.openai.chat.completions.create({
        messages: [{ role: "user", content: "Say hello" }],
        max_tokens: 10,
        model: this.config.model,
      });

      console.log("✅ Connection test successful:", response);

      return { success: true };
    } catch (error) {
      console.error("❌ Connection test failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Update configuration
  updateConfig(newConfig: AIConfig): void {
    this.config = { ...newConfig };
    console.log("🔧 AI config updated:", this.config);
  }

  // Reset for new game
  resetGame(): void {
    this.gameHistory = [];
    console.log("🔄 AI game state reset");
  }
}
