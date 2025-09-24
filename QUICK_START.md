# 🚀 MeetingScribe AI - Quick Start Guide

## Choose Your Setup Method

### Option 1: Docker Setup (Recommended)

**For Linux/macOS:**
```bash
./setup-docker.sh
```

**For Windows:**
```cmd
setup-docker.bat
```

### Option 2: Local Setup

**For Linux/macOS:**
```bash
./setup.sh
```

**For Windows:**
```cmd
setup.bat
```

## What You Need

### For Docker Setup:
- **Docker and Docker Compose** (installed and running)
- **Internet connection** (to download Docker images and AI models)
- **4GB+ RAM** (for running AI models in containers)
- **Microphone** (for recording meetings)

### For Local Setup:
- **Internet connection** (to download dependencies and AI models)
- **Administrator/sudo access** (to install Node.js and Ollama if needed)
- **Microphone** (for recording meetings)

## What the Setup Does

### Docker Setup:
1. ✅ **Checks Docker** - Verifies Docker and Docker Compose are installed and running
2. ✅ **Starts Ollama** - Launches Ollama service in a container
3. ✅ **Checks existing models** - Skips download if Whisper/Llama are already installed
4. ✅ **Downloads AI models** - Only downloads what's missing (saves time & bandwidth)
5. ✅ **Builds application** - Creates the app container with all dependencies
6. ✅ **Starts all services** - Launches the complete application stack

### Local Setup:
1. ✅ **Checks Node.js** - Installs if missing (requires v18+)
2. ✅ **Installs dependencies** - Downloads all npm packages
3. ✅ **Sets up Ollama** - Installs and starts the AI service (if not already running)
4. ✅ **Checks existing models** - Skips download if Whisper/Llama are already installed
5. ✅ **Downloads AI models** - Only downloads what's missing (saves time & bandwidth)
6. ✅ **Starts the app** - Optionally launches the application

## After Setup

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:3001
- **Ollama API:** http://localhost:11434 (Docker setup only)

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

Check the full [README.md](README.md) for detailed documentation and troubleshooting.