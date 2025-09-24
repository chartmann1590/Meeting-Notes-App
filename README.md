# MeetingScribe AI

MeetingScribe AI is a visually stunning, minimalist web application designed to streamline meeting documentation. It leverages the browser's microphone to capture audio, transcribes it using local Whisper AI, and then uses a local LLM (via Ollama) to generate a concise, structured summary. The summary includes key discussion points, action items, and decisions made. The entire experience is contained within a single, elegant interface, focusing on simplicity and efficiency.

> **🚀 Want to get started quickly?** Check out our [Quick Start Guide](QUICK_START.md) for the fastest way to get up and running!

## Key Features

-   **🎤 In-Browser Audio Recording:** Capture meeting audio directly from your browser with a single click.
-   **✍️ Local AI Transcription:** Uses Whisper AI running locally via Ollama for accurate transcription.
-   **🤖 Local AI Summarization:** Automatically generate structured summaries using local LLM models via Ollama.
-   **✨ Minimalist & Elegant UI:** A clean, uncluttered, and visually appealing interface that is a joy to use.
-   **📋 One-Click Copy:** Easily copy the full transcript or the AI-generated summary to your clipboard.
-   **🔒 Privacy-First:** All processing happens locally - no data leaves your machine.

## Technology Stack

-   **Frontend:** React, Vite, Tailwind CSS
-   **UI Components:** shadcn/ui
-   **State Management:** Zustand
-   **Animation & Interactions:** Framer Motion
-   **Icons:** Lucide React
-   **Notifications:** Sonner
-   **Backend:** Express.js
-   **AI Services:** Ollama (Whisper + LLM models)

## Prerequisites

**For the automated setup script (`./setup.sh`):**
- A modern web browser with microphone support
- Internet connection (for downloading dependencies and AI models)
- Administrator/sudo access (for installing Node.js and Ollama if needed)

**For manual setup:**
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Ollama](https://ollama.ai/) for local AI models
- A modern web browser with microphone support

> **💡 Tip:** The automated setup script will install Node.js and Ollama for you if they're not already installed!

## 🚀 Quick Start (One-Command Setup)

**The easiest way to get started is with our all-in-one setup script:**

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/meetingscribe-ai.git
    cd meetingscribe-ai
    ```

2.  **Run the setup script:**
    
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
    - ✅ Start the Ollama service
    - ✅ Download Whisper model for transcription
    - ✅ Download Llama 3.2 model for summarization
    - ✅ Optionally start the application automatically

3.  **Open your browser:**
    Navigate to [http://localhost:3000](http://localhost:3000)

**That's it! The setup script handles everything automatically. 🎉**

### 🛠️ Setup Script Features

The `./setup.sh` script is designed to make getting started as easy as possible:

- **🔍 Smart Detection:** Automatically detects your operating system and existing installations
- **📦 Auto-Installation:** Installs Node.js and Ollama if they're missing
- **⚡ Dependency Management:** Installs all npm dependencies automatically
- **🤖 AI Model Setup:** Downloads and configures Whisper and Llama models
- **🚀 One-Click Start:** Optionally starts the application immediately after setup
- **🎨 Beautiful Output:** Color-coded progress indicators and clear status messages
- **🛡️ Error Handling:** Graceful error handling with helpful troubleshooting tips
- **🔄 Cross-Platform:** Works on macOS, Ubuntu/Debian, CentOS/RHEL, and Fedora

### 📋 What the Setup Script Does

1. **Node.js Check:** Verifies Node.js 18+ is installed, offers to install if missing
2. **Dependencies:** Runs `npm install` to get all required packages
3. **Ollama Setup:** Checks for Ollama, installs if needed, starts the service
4. **AI Models:** Downloads Whisper (transcription) and Llama 3.2:3b (summarization)
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

### Development Commands

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
├── src/                    # Frontend React application
│   ├── components/         # React components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   └── pages/             # Page components
├── server/                # Backend Express.js server
│   ├── services/          # AI service integrations
│   └── index.ts           # Main server file
└── public/                # Static assets
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

## Contributing

1.  Fork the repository
2.  Create a feature branch: `git checkout -b feature-name`
3.  Make your changes
4.  Commit your changes: `git commit -m 'Add some feature'`
5.  Push to the branch: `git push origin feature-name`
6.  Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

-   [Ollama](https://ollama.ai/) for providing easy local AI model management
-   [Whisper](https://openai.com/research/whisper) for speech recognition
-   [Meta's Llama](https://ai.meta.com/llama/) for language models
-   [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components