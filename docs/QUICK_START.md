# 🚀 MeetingScribe AI - Quick Start Guide

## One-Command Setup

Choose your preferred setup method:

### Option 1: Docker Setup (Recommended)
**Zero local dependencies - everything runs in containers**

**Linux/macOS:**
```bash
./setup-docker.sh
```

**Windows:**
```cmd
setup-docker.bat
```

### Option 2: Local Setup
**Direct installation on your system**

**Linux/macOS:**
```bash
./setup.sh
```

**Windows:**
```cmd
setup.bat
```

## System Requirements

### Docker Setup (Recommended)
- **Docker & Docker Compose** - [Install Docker](https://docs.docker.com/get-docker/)
- **4GB+ RAM** - For running AI models in containers
- **Internet connection** - To download Docker images and AI models
- **Microphone** - For recording meetings

### Local Setup
- **Internet connection** - To download dependencies and AI models
- **Administrator/sudo access** - To install Node.js and Ollama if needed
- **Microphone** - For recording meetings

## What Happens During Setup

### Docker Setup
1. ✅ **Verifies Docker** - Checks Docker and Docker Compose installation
2. ✅ **Launches Ollama** - Starts AI service in container
3. ✅ **Smart Model Download** - Only downloads missing AI models (Whisper + Llama 3.2)
4. ✅ **Builds Application** - Creates app container with all dependencies
5. ✅ **Starts Services** - Launches complete application stack

### Local Setup
1. ✅ **Node.js Check** - Installs Node.js 18+ if missing
2. ✅ **Dependencies** - Installs all npm packages
3. ✅ **Ollama Setup** - Installs and starts AI service
4. ✅ **Smart Model Download** - Only downloads missing AI models
5. ✅ **Ready to Go** - Optionally starts the application

## Access Your Application

After successful setup, access the application at:

- **Main Application:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Ollama API:** http://localhost:11434 (Docker setup only)

## Using MeetingScribe AI

1. **Open the app** in your browser at http://localhost:3000
2. **Click "Start Recording"** to begin capturing audio
3. **Allow microphone access** when prompted by your browser
4. **Speak clearly** during your meeting
5. **Click "Stop Recording"** when finished
6. **Wait for processing** - AI will transcribe and summarize your meeting
7. **Copy results** using the copy buttons for transcript or summary

## Troubleshooting

### Docker Setup Issues

### "Docker not found"
- **Linux:** Install Docker Engine: https://docs.docker.com/engine/install/
- **macOS/Windows:** Install Docker Desktop: https://docs.docker.com/desktop/
- **Restart your terminal/command prompt after installation**

### "Docker not running"
- **Linux:** Start Docker service: `sudo systemctl start docker`
- **macOS/Windows:** Start Docker Desktop application
- **Wait for Docker to fully start before running the script**

### "Permission denied" (Linux)
```bash
# Add your user to docker group
sudo usermod -aG docker $USER
# Log out and back in, then try again
```

### Local Setup Issues

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

### Docker Setup:
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Local Setup:
```bash
# Start the app
npm run dev
```

## Need Help?

Check the full [README.md](../README.md) for detailed documentation and troubleshooting.