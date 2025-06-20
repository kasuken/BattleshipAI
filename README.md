# ⚓ Battleship Game - AI vs AI Edition

A modern, browser-based Battleship game built with TypeScript, React, and Vite that showcases AI vs AI battles using local LLM models.

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
git clone <repository-url>
cd battleship
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

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 🎯 Game Controls

### Ship Placement
- **Left Click**: Select ship / Place ship on board
- **Right Click**: Rotate ship during placement
- **Random Placement**: Automatically place all ships randomly
- **Clear Board**: Remove all placed ships to start over

### Gameplay
- **Left Click**: Attack enemy grid positions
- **Start Battle**: Begin the game once all ships are placed
- **Reset Game**: Start a new game at any time

### AI Controls
- **🎯 Simple AI / 🤖 LM Studio AI**: Toggle between AI modes
- **⚙️ AI Settings**: Configure LM Studio connection and parameters
- **Test Connection**: Verify LM Studio server availability

## 🤖 AI Strategy

### Simple AI
- Random targeting for initial shots
- Smart adjacent targeting after hitting a ship
- Systematic hunting patterns for ship completion

### LM Studio AI (Advanced)
- **Context Awareness**: Analyzes board state and move history
- **Strategic Planning**: Makes decisions based on probability and patterns
- **Learning Behavior**: Adapts strategy based on successful moves
- **Natural Language Processing**: Uses LLM reasoning for tactical decisions
- **Dynamic Difficulty**: Adjusts based on configured temperature settings

## 📱 Responsive Design

The game is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## 🎨 UI Features

- Gradient backgrounds with ocean themes
- Smooth hover effects and animations
- Visual feedback for game states
- Intuitive ship placement with preview
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
│   ├── ShipSelector.tsx# Ship placement UI
│   ├── ShipSelector.css
│   ├── GameStatus.tsx  # Game state display
│   └── GameStatus.css
├── types.ts            # TypeScript type definitions
├── utils.ts            # Game logic utilities
├── App.tsx             # Main application component
├── App.css             # Main application styles
├── index.css           # Global styles
└── main.tsx            # Application entry point
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🎉 Enjoy the Game!

Have fun playing Battleship! May your shots be true and your ships stay afloat! ⚓️
