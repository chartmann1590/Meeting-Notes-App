# MeetingScribe AI

MeetingScribe AI is a privacy-first, locally-powered meeting transcription and summarization application. It captures audio directly from your browser, transcribes it using Whisper AI running locally via Ollama, and generates structured summaries using local LLM models. All processing happens on your machine - no data leaves your device, ensuring complete privacy and security.

> **🚀 Want to get started quickly?** Check out our [Quick Start Guide](docs/QUICK_START.md) for the fastest way to get up and running!

## Key Features

-   **🎤 In-Browser Audio Recording:** Capture meeting audio directly from your browser with a single click
-   **✍️ Local AI Transcription:** Uses Whisper AI running locally via Ollama for accurate transcription
-   **🤖 Local AI Summarization:** Automatically generate structured summaries using local LLM models via Ollama
-   **✨ Modern & Elegant UI:** Clean, responsive interface built with React, Tailwind CSS, and shadcn/ui components
-   **📋 One-Click Copy:** Easily copy the full transcript or the AI-generated summary to your clipboard
-   **🔒 Privacy-First:** All processing happens locally - no data leaves your machine
-   **💾 Meeting History:** Save and manage past meetings with persistent storage
-   **🌙 Dark/Light Theme:** Built-in theme switching for comfortable viewing
-   **📱 Mobile Responsive:** Works seamlessly on desktop, tablet, and mobile devices

## Technology Stack

### Frontend
-   **Framework:** React 18 with TypeScript
-   **Build Tool:** Vite
-   **Styling:** Tailwind CSS with custom animations
-   **UI Components:** shadcn/ui (Radix UI primitives)
-   **State Management:** Zustand
-   **Animation:** Framer Motion
-   **Icons:** Lucide React
-   **Notifications:** Sonner
-   **Routing:** React Router DOM

### Backend
-   **Server:** Express.js with TypeScript
-   **File Upload:** Multer
-   **CORS:** Cross-origin resource sharing support
-   **Development:** Nodemon with tsx for hot reloading

### AI Services
-   **Local AI Platform:** Ollama
-   **Transcription:** Whisper model
-   **Summarization:** Llama 3.2 models (1b, 3b, 8b variants)
-   **API Integration:** OpenAI-compatible API endpoints

## Prerequisites

**For Docker setup (Recommended):**
- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- A modern web browser with microphone support
- Internet connection (for downloading Docker images and AI models)
- 4GB+ RAM (for running AI models in containers)

**For the automated local setup script (`./setup.sh`):**
- A modern web browser with microphone support
- Internet connection (for downloading dependencies and AI models)
- Administrator/sudo access (for installing Node.js and Ollama if needed)

**For manual local setup:**
- [Node.js](https://nodejs.org/) (v22 or higher; the Vite 8 / Vitest 5 toolchain needs it)
- [Ollama](https://ollama.ai/) for local AI models
- A modern web browser with microphone support

> **💡 Tip:** The Docker setup requires no local installations - everything runs in containers! The local setup script will install Node.js and Ollama for you if they're not already installed!

## 🚀 Quick Start (One-Command Setup)

**Choose your preferred setup method:**

### Option 1: Docker Setup (Recommended for Easy Deployment)

**The easiest way to get started with Docker:**

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/chartmann1590/Meeting-Notes-App.git
    cd Meeting-Notes-App
    ```

2.  **Run the Docker setup script:**
    
    **Linux/macOS:**
    ```bash
    ./setup-docker.sh
    ```
    
    **Windows:**
    ```cmd
    setup-docker.bat
    ```

### Option 2: Local Setup (Direct Installation)

**For running directly on your system:**

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/chartmann1590/Meeting-Notes-App.git
    cd Meeting-Notes-App
    ```

2.  **Run the local setup script:**
    
    **Linux/macOS:**
    ```bash
    ./setup.sh
    ```
    
    **Windows:**
    ```cmd
    setup.bat
    ```
    
    This single command will:
    - ✅ Check and install Node.js (if needed)
    - ✅ Install all npm dependencies
    - ✅ Check and install Ollama (if needed)
    - ✅ Start the Ollama service (if not already running)
    - ✅ Check for existing AI models before downloading
    - ✅ Download Whisper model for transcription (if not installed)
    - ✅ Download Llama 3.2 model for summarization (if not installed)
    - ✅ Optionally start the application automatically

3.  **Open your browser:**
    Navigate to [http://localhost:3000](http://localhost:3000)

**That's it! The setup script handles everything automatically. 🎉**

### 🐳 Docker Setup Features

The Docker setup provides a complete containerized environment:

- **🔧 Zero Configuration:** No need to install Node.js, Ollama, or any dependencies
- **📦 Isolated Environment:** Everything runs in containers, keeping your system clean
- **🚀 Quick Deployment:** Perfect for development, testing, or production deployment
- **🔄 Easy Updates:** Simple `docker-compose pull` to update to latest versions
- **💾 Persistent Data:** AI models and data are preserved between restarts
- **🌐 Network Ready:** All services are properly networked and accessible
- **📊 Health Checks:** Built-in health monitoring for all services
- **🛡️ Security:** Non-root user execution and minimal attack surface

### 🛠️ Local Setup Script Features

The `./setup.sh` script is designed to make getting started as easy as possible:

- **🔍 Smart Detection:** Automatically detects your operating system and existing installations
- **📦 Auto-Installation:** Installs Node.js and Ollama if they're missing
- **⚡ Dependency Management:** Installs all npm dependencies automatically
- **🤖 AI Model Setup:** Checks for existing models before downloading, saves time and bandwidth
- **🔄 Service Detection:** Detects if Ollama is already running and skips unnecessary startup
- **🚀 One-Click Start:** Optionally starts the application immediately after setup
- **🎨 Beautiful Output:** Color-coded progress indicators and clear status messages
- **🛡️ Error Handling:** Graceful error handling with helpful troubleshooting tips
- **🔄 Cross-Platform:** Works on macOS, Ubuntu/Debian, CentOS/RHEL, and Fedora

### 📋 What the Setup Script Does

1. **Node.js Check:** Verifies Node.js 18+ is installed, offers to install if missing
2. **Dependencies:** Runs `npm install` to get all required packages
3. **Ollama Setup:** Checks for Ollama, installs if needed, starts the service (if not running)
4. **AI Models:** Checks for existing models, downloads only what's missing (Whisper + Llama 3.2:3b)
5. **Ready to Go:** Optionally starts the application and opens it in your browser

## Manual Setup (Alternative)

If you prefer to set up everything manually or the automated script doesn't work for your system:

1.  **Install Ollama:**
    Visit [https://ollama.ai/download](https://ollama.ai/download) and follow the installation instructions.

2.  **Start Ollama service:**
    ```bash
    ollama serve
    ```

3.  **Download required models:**
    ```bash
    # For transcription
    ollama pull whisper
    
    # For summarization (choose one)
    ollama pull llama3.2:3b    # Fast, good quality
    ollama pull llama3.2:1b    # Very fast, basic quality
    ollama pull llama3.1:8b    # Slower, higher quality
    ```

4.  **Start the application:**
    ```bash
    npm run dev
    ```

## Usage

1.  Open the application in your browser.
2.  Click the **Start Recording** button.
3.  Your browser will prompt you for microphone access. Click **Allow**.
4.  The button will turn red, indicating that recording has started.
5.  Speak clearly into your microphone.
6.  When your meeting is finished, click the **Stop Recording** button.
7.  The app will transcribe your audio using Whisper and then generate a summary using the LLM.
8.  The AI-generated summary, key points, and action items will appear in the "AI Summary" card.
9.  Use the copy buttons to save the transcript or summary to your clipboard.

## Configuration

You can customize the AI models by setting environment variables:

```bash
# Whisper model for transcription
export WHISPER_MODEL=whisper

# LLM model for summarization
export OLLAMA_MODEL=llama3.2:3b

# Ollama API URL (default: http://localhost:11434)
export OLLAMA_API_URL=http://localhost:11434/api/generate
```

## Development

The application consists of two parts:

-   **Frontend:** React app running on port 3000
-   **Backend:** Express.js server running on port 3001
-   **Ollama:** AI service running on port 11434 (Docker setup only)

### Development Commands

**Docker Development:**
```bash
# Start all services (app + Ollama)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# Access Ollama shell
docker-compose exec ollama bash

# Pull new AI models
docker-compose exec ollama ollama pull <model-name>
```

**Local Development:**
```bash
# Start both frontend and backend
npm run dev

# Start only frontend
npm run dev:frontend

# Start only backend
npm run dev:backend

# Build for production
npm run build

# Start production server
npm start
```

### Project Structure

```
├── src/                           # Frontend React application
│   ├── components/                # React components
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── AudioVisualizer.tsx   # Audio visualization component
│   │   ├── ErrorBoundary.tsx     # Error handling components
│   │   ├── Layout.tsx            # Main layout component
│   │   └── ThemeToggle.tsx       # Theme switching component
│   ├── hooks/                    # Custom React hooks
│   │   ├── use-meeting-store.ts  # Meeting state management
│   │   ├── use-mobile.tsx        # Mobile detection hook
│   │   └── use-theme.ts          # Theme management hook
│   ├── lib/                      # Utility functions
│   │   ├── api.ts                # API client functions
│   │   ├── chat.ts               # Chat/meeting logic
│   │   ├── real-transcriber.ts   # Audio transcription logic
│   │   └── utils.ts              # General utilities
│   ├── pages/                    # Page components
│   │   ├── DemoPage.tsx          # Demo/landing page
│   │   ├── HomePage.tsx          # Main meeting interface
│   │   ├── PastMeetingsPage.tsx  # Meeting history
│   │   └── SettingsPage.tsx      # Application settings
│   └── types/                    # TypeScript type definitions
├── server/                       # Backend Express.js server
│   ├── services/                 # AI service integrations
│   │   ├── ollama.ts             # Ollama LLM service
│   │   └── whisper.ts            # Whisper transcription service
│   ├── index.ts                  # Main server file
│   └── types.ts                  # Server type definitions
├── public/                       # Static assets
├── docs/                         # Documentation directory
│   ├── prompts/                  # AI prompts and guidelines
│   └── *.md                      # Documentation files
└── setup scripts                 # Automated setup scripts
```

## Troubleshooting

### Common Issues

1.  **"Ollama API not available" error:**
    - Make sure Ollama is running: `ollama serve`
    - Check if the models are downloaded: `ollama list`

2.  **Microphone access denied:**
    - Check your browser's microphone permissions
    - Make sure you're using HTTPS in production

3.  **Transcription is slow:**
    - The first transcription might be slow as models load
    - Consider using a smaller/faster model like `llama3.2:1b`

4.  **Poor transcription quality:**
    - Speak clearly and reduce background noise
    - Make sure your microphone is working properly

### Performance Tips

-   Use `llama3.2:1b` for faster summarization
-   Use `llama3.2:3b` for better quality
-   Use `llama3.1:8b` for highest quality (requires more RAM)

## 📚 Documentation

Complete documentation is available in the [`docs/`](docs/) directory:

- **[📖 Documentation Index](docs/DOCUMENTATION_INDEX.md)** - Complete documentation overview and navigation
- **[🚀 Quick Start Guide](docs/QUICK_START.md)** - Fastest way to get up and running
- **[🛠️ Development Guide](docs/DEVELOPMENT_GUIDE.md)** - Complete development setup and guidelines
- **[🔌 API Documentation](docs/API_DOCUMENTATION.md)** - Complete API reference for backend services
- **[📋 Migration Summary](docs/MIGRATION_SUMMARY.md)** - Migration from Cloudflare to local AI (completed)
- **[🤖 AI Prompts](docs/prompts/)** - AI summarization prompts and development guidelines

### Quick Navigation
- **New Users:** Start with [Quick Start Guide](docs/QUICK_START.md)
- **Developers:** See [Development Guide](docs/DEVELOPMENT_GUIDE.md)
- **API Integration:** Check [API Documentation](docs/API_DOCUMENTATION.md)
- **Contributors:** Review [Development Guidelines](docs/prompts/development-guidelines.md)

## Contributing

1.  Fork the repository
2.  Create a feature branch: `git checkout -b feature-name`
3.  Make your changes
4.  Commit your changes: `git commit -m 'Add some feature'`
5.  Push to the branch: `git push origin feature-name`
6.  Submit a pull request

For detailed contributing guidelines, see the [Development Guide](docs/DEVELOPMENT_GUIDE.md).

## Testing

The application includes comprehensive testing for live transcription functionality:

### Quick Test
```bash
# Run basic functionality test
node test-app.js
```

### Comprehensive Live Transcription Testing
```bash
# Run end-to-end live transcription tests
npm run test:live-transcription-e2e

# Run unit tests for transcription components
npm run test:live-transcription

# Run server-side transcription tests
npm run test:server

# Run all tests with coverage
npm run test:coverage
```

### Test Coverage

The testing suite includes:

- **Unit Tests**: RealTranscriber class, Whisper service, API endpoints
- **Integration Tests**: Complete live transcription workflow
- **End-to-End Tests**: Full application testing with real services
- **Browser Compatibility**: Speech recognition and MediaRecorder support
- **Error Handling**: Network failures, permission issues, service unavailability

### Test Results

Tests verify:
- ✅ Backend server health and API endpoints
- ✅ Frontend build and browser compatibility
- ✅ Ollama service and AI model availability
- ✅ Live transcription functionality (browser + server-side)
- ✅ Error handling and fallback mechanisms
- ✅ Performance and reliability

For detailed testing information, see [Live Transcription Testing Guide](docs/LIVE_TRANSCRIPTION_TESTING.md).

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

-   [Ollama](https://ollama.ai/) for providing easy local AI model management
-   [Whisper](https://openai.com/research/whisper) for speech recognition
-   [Meta's Llama](https://ai.meta.com/llama/) for language models
-   [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components