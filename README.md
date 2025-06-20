# ⚓ Battleship Game - AI vs AI Edition

A browser-based Battleship game built with TypeScript, React, and Vite that showcases AI vs AI battles using local LLM models. This specialized version focuses exclusively on AI vs AI combat, with two LM Studio-powered AIs (Blue and Red) competing against each other in a fully automated naval battle.

![demo](https://github.com/user-attachments/assets/bd30effe-07dc-4880-b6f6-3b70f60281e1)

![battleshipwithlmstudio](https://github.com/user-attachments/assets/b50f54ff-a1c7-403f-9d91-dabab2d3370e)

## 🎮 Features

### AI vs AI Mode
- **Automated Battles**: Watch two AI opponents battle it out automatically
- **Win Counter**: Track and display total wins for Blue AI and Red AI
- **Auto-Restart**: Games automatically restart 20 seconds after completion
- **Game Log**: Detailed timestamped log of all game events and moves
- **Beautiful Modern UI**: Responsive design with smooth animations and ocean themes
- **Standard Battleship Rules**: 10x10 grid with ships of sizes 5, 4, 3, 3, and 2

### Advanced AI Integration
- **LM Studio Support**: Connect to local LLM models for intelligent, context-aware gameplay
- **Robust Retry Mechanism**: Up to 3 attempts with progressively simpler context
- **AI Configuration**: Customize endpoint, model parameters, temperature, and token limits
- **Strategic Decision Making**: Advanced AI with pattern recognition and move history analysis
- **Graceful Fallback**: Automatic switch to Simple AI if LM Studio is unavailable
- **Enhanced Error Handling**: Detailed error logging and recovery strategies

## 🚢 How It Works

1. **Game Setup**: 
   - Ships are randomly placed for both AI players
   - Blue AI (Player 1) and Red AI (Player 2) alternate turns

2. **AI Decision Making**:
   - Each AI analyzes the current board state
   - LM Studio processes the context and returns optimal moves
   - Moves are validated and executed automatically

3. **Game Progression**:
   - Watch as ships are attacked and sunk
   - Game log records all moves and events
   - Win counter tracks performance of each AI
   - Games auto-restart after completion

## 🛠 Technologies Used

- **TypeScript** - Type-safe JavaScript
- **React** - Modern UI framework
- **Vite** - Fast build tool and dev server
- **CSS3** - Beautiful styling with gradients and animations

## 🚀 Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/kasuken/BattleshipAI
cd BattleshipAI
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### LM Studio AI Setup (Required)

This AI vs AI game requires LM Studio to function properly:

1. **Install LM Studio**: Download from [LM Studio](https://lmstudio.ai/)

2. **Load a Model**: Download and load a compatible model (Llama, Mistral, etc.)
   - Recommended: models with at least 7B parameters for best performance
   - Good options: Llama-2, Mistral-7B, or any model with strategic capabilities

3. **Start Local Server**: 
   - In LM Studio, go to the "API" tab
   - Toggle the API server to "On"
   - Default server is http://localhost:1234

4. **Configure in Game**:
   - Click the gear icon (⚙️) in the top right of the game
   - Verify the endpoint URL (usually http://localhost:1234)
   - Adjust temperature (lower = more focused moves)
   - Set max tokens (30-50 recommended)
   - Click "Save"

### Game Features

- **Win Counter**: Track Blue AI vs Red AI performance over multiple games
- **Auto-Restart**: Games automatically restart after 20-second countdown
- **Game Log**: Toggle to view detailed history of moves and events
- **Reset Stats**: Clear win counters and start fresh
- **Robust AI**: Multiple retry attempts if AI makes invalid moves

### Troubleshooting

If you encounter issues with the AI:

1. **LM Studio Connection Issues**:
   - Ensure LM Studio is running with the API server enabled
   - Check that the endpoint URL is correct (usually http://localhost:1234)
   - Verify your model is loaded and ready in LM Studio

2. **AI Move Problems**:
   - Try using a different model with better reasoning capabilities
   - Lower the temperature setting (0.3-0.5 often works better)
   - Increase max tokens if responses are getting cut off
   - Monitor the game log for error patterns

3. **Performance Issues**:
   - Close other CPU-intensive applications
   - Reduce animation effects in your browser
   - Try a different browser if you experience lag

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 🎯 Game Controls

### Main Controls
- **Start AI Battle**: Begin a new AI vs AI game
- **Reset Game**: Start a new game at any time
- **Show/Hide Game Log**: Toggle visibility of the game event log
- **Clear Log**: Erase all log entries
- **Reset Stats**: Clear win counters for both AIs

### Auto-Restart
- **Cancel Auto-Restart**: Stop the 20-second countdown to the next game
- Auto-restart begins automatically when a game ends

### AI Settings
- **⚙️ Settings**: Configure LM Studio connection and parameters
  - Endpoint URL
  - Model name
  - Temperature (randomness of responses)
  - Max tokens (maximum response length)

## 🤖 AI Strategy

### Blue AI & Red AI (LM Studio-powered)
- **Context Awareness**: Analyzes board state and move history
- **Strategic Planning**: Makes decisions based on probability and patterns
- **Natural Language Processing**: Uses LLM reasoning for tactical decisions
- **Dynamic Difficulty**: Adjusts based on configured temperature settings
- **Robust Retry System**:
  - First attempt: Full context (board, hits, misses, sunk ships)
  - Second attempt: Simplified context (board and hits only)
  - Third attempt: Minimal context (just the board)
  - Final fallback: Simple adjacent targeting algorithm

### Fallback AI (Used only if LM Studio fails)
- Random targeting for initial shots
- Smart adjacent targeting after hitting a ship
- Systematic hunting patterns for ship completion

## 📱 Responsive Design

The game is fully responsive and works on:
- Desktop computers (optimal viewing experience)
- Tablets
- Mobile phones

## 🎨 UI Features

- Gradient backgrounds with ocean themes
- Smooth hover effects and animations
- Visual feedback for game states
- Win counter with persistent statistics
- Auto-scrolling game log with timestamps
- Auto-restart countdown animation
- Real-time fleet status tracking

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── components/          # React components
│   ├── Board.tsx       # Game board component
│   ├── Board.css       # Board styling
│   ├── AISettings.tsx  # LM Studio AI configuration
│   ├── AISettings.css
│   ├── GameStatus.tsx  # Game state display
│   └── GameStatus.css
├── aiService.ts        # LM Studio AI integration
├── types.ts            # TypeScript type definitions
├── utils.ts            # Game logic utilities
├── App.tsx             # Main application component
├── App.css             # Main application styles
├── index.css           # Global styles
└── main.tsx            # Application entry point
```

## 🔎 Game Log System

The game includes a comprehensive logging system that tracks all game events:

- **Timestamped Entries**: All log entries include time for analysis
- **Event Categories**:
  - Game starts and resets
  - AI moves (coordinates, hits, and misses)
  - Ships sunk (with ship types)
  - Game outcomes (winner)
  - Auto-restart events
  - Settings changes
- **Persistent Display**: Log remains visible across games
- **Expandable Interface**: Show/hide with a single click
- **Auto-scrolling**: Always shows most recent events
- **Clear Function**: Reset log as needed

## 📊 Win Statistics

The game tracks AI performance over time:

- **Persistent Counters**: Win counts for Blue AI and Red AI
- **Local Storage**: Statistics preserved between sessions
- **Reset Option**: Clear statistics when desired
- **Visual Indicators**: Winning AI gets highlighted

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📋 Additional Documentation

For more detailed information about the AI vs AI mode, please see:
- `AI_VS_AI_INSTRUCTIONS.md` - Complete guide to the AI battle system
- `GAME_FEATURES.md` - Detailed breakdown of all game features

## 📄 License

This project is open source and available under the MIT License.

## 🎉 Enjoy the Game!

Have fun playing Battleship! May your shots be true and your ships stay afloat! ⚓️
