# 🚀 MeetingScribe AI - Quick Start Guide

## One-Command Setup

### For Linux/macOS:
```bash
./setup.sh
```

### For Windows:
```cmd
setup.bat
```

## What You Need

- **Internet connection** (to download dependencies and AI models)
- **Administrator/sudo access** (to install Node.js and Ollama if needed)
- **Microphone** (for recording meetings)

## What the Setup Does

1. ✅ **Checks Node.js** - Installs if missing (requires v18+)
2. ✅ **Installs dependencies** - Downloads all npm packages
3. ✅ **Sets up Ollama** - Installs and starts the AI service (if not already running)
4. ✅ **Checks existing models** - Skips download if Whisper/Llama are already installed
5. ✅ **Downloads AI models** - Only downloads what's missing (saves time & bandwidth)
6. ✅ **Starts the app** - Optionally launches the application

## After Setup

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:3001

## Troubleshooting

### "Node.js not found"
- **Linux/macOS:** The script will offer to install it automatically
- **Windows:** Download from https://nodejs.org/ and restart the script

### "Ollama not found"
- **Linux/macOS:** The script will offer to install it automatically
- **Windows:** Download from https://ollama.ai/download and restart the script

### "Permission denied" (Linux/macOS)
```bash
chmod +x setup.sh
./setup.sh
```

### Models download slowly
- This is normal for the first time
- Whisper model: ~1.5GB
- Llama 3.2 model: ~2GB
- Total download time: 5-15 minutes depending on your internet
- **Good news:** The script checks for existing models and skips downloads if already installed!

## Manual Start

If you want to start the app later:
```bash
npm run dev
```

## Need Help?

Check the full [README.md](README.md) for detailed documentation and troubleshooting.