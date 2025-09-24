@echo off
setlocal enabledelayedexpansion

REM MeetingScribe AI - Docker Quickstart Setup Script for Windows
REM This script sets up the entire application using Docker for easy deployment

echo.
echo ================================
echo   MeetingScribe AI - Docker Setup
echo ================================
echo.

REM Check if Docker is installed
echo [INFO] Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed!
    echo.
    echo [INFO] Please install Docker Desktop first:
    echo   Download from: https://docs.docker.com/desktop/windows/install/
    echo.
    echo [INFO] After installing Docker Desktop, restart this script.
    pause
    exit /b 1
)

REM Check if Docker is running
echo [INFO] Checking if Docker is running...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is installed but not running!
    echo.
    echo [INFO] Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo [SUCCESS] Docker is installed and running

REM Check Docker Compose
echo [INFO] Checking Docker Compose...
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    docker compose version >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] Docker Compose is not available!
        echo.
        echo [INFO] Please install Docker Compose or update Docker to a newer version.
        pause
        exit /b 1
    )
)

echo [SUCCESS] Docker Compose is available

REM Start Ollama service
echo [INFO] Starting Ollama service...
docker-compose up -d ollama
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start Ollama service
    pause
    exit /b 1
)

REM Wait for Ollama to be ready
echo [INFO] Waiting for Ollama to be ready...
set timeout=60
:wait_ollama
docker-compose exec ollama ollama list >nul 2>&1
if %errorlevel% equ 0 goto ollama_ready
timeout /t 2 /nobreak >nul
set /a timeout-=2
if %timeout% leq 0 (
    echo [ERROR] Ollama failed to start within 60 seconds
    pause
    exit /b 1
)
goto wait_ollama

:ollama_ready
echo [SUCCESS] Ollama is ready

REM Check and download Whisper model
echo [INFO] Checking for existing AI models...
docker-compose exec ollama ollama list | findstr "whisper" >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Whisper model already installed
) else (
    echo [INFO] Downloading Whisper model (this may take a few minutes)...
    docker-compose exec ollama ollama pull whisper
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to download Whisper model
        pause
        exit /b 1
    )
    echo [SUCCESS] Whisper model downloaded
)

REM Check and download Llama model
docker-compose exec ollama ollama list | findstr "llama3.2:3b" >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Llama 3.2 model already installed
) else (
    echo [INFO] Downloading Llama 3.2 model (this may take several minutes)...
    docker-compose exec ollama ollama pull llama3.2:3b
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to download Llama 3.2 model
        pause
        exit /b 1
    )
    echo [SUCCESS] Llama 3.2 model downloaded
)

REM SSL Certificate Setup
echo.
echo ========================================
echo   SSL Certificate Setup
echo ========================================
echo.
echo [WARNING] Web browsers require HTTPS to access microphone permissions.
echo [WARNING] Without HTTPS, you won't be able to use the microphone feature.
echo.
echo [INFO] Options:
echo [INFO]   1. Generate self-signed certificates (recommended for development)
echo [INFO]   2. Skip SSL setup (microphone won't work in browsers)
echo.

set /p SSL_SETUP="Would you like to generate self-signed SSL certificates? (y/n): "
if /i "%SSL_SETUP%"=="y" (
    echo.
    echo [INFO] Generating SSL certificates...
    if exist "scripts\generate-ssl-certs.bat" (
        call scripts\generate-ssl-certs.bat ssl-certs localhost
        if %errorlevel% equ 0 (
            echo [SUCCESS] SSL certificates generated successfully!
            set SSL_AVAILABLE=true
        ) else (
            echo [ERROR] Failed to generate SSL certificates
            set SSL_AVAILABLE=false
        )
    ) else (
        echo [ERROR] SSL certificate generation script not found
        set SSL_AVAILABLE=false
    )
) else (
    echo [WARNING] Skipping SSL setup. Microphone access will not work in browsers.
    set SSL_AVAILABLE=false
)

REM Build and start the application
echo.
echo [INFO] Building and starting the application...
docker-compose up -d --build
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start the application
    pause
    exit /b 1
)

echo.
echo [SUCCESS] ^🎉 MeetingScribe AI is now running in Docker!
echo.
echo Access your application:
if "%SSL_AVAILABLE%"=="true" (
    echo   • Frontend (HTTPS): https://localhost:3000
    echo   • Backend (HTTPS):  https://localhost:3443
    echo   • Backend (HTTP):   http://localhost:3001
    echo   • Ollama API:       http://localhost:11434
    echo   • 🎤 Microphone access enabled via HTTPS
) else (
    echo   • Frontend: http://localhost:3000
    echo   • Backend API: http://localhost:3001
    echo   • Ollama API: http://localhost:11434
    echo   • ⚠️  Microphone access requires HTTPS
)
echo.
echo Useful commands:
echo   • View logs: docker-compose logs -f
echo   • Stop services: docker-compose down
echo   • Restart services: docker-compose restart
echo   • Update models: docker-compose exec ollama ollama pull ^<model-name^>
echo.
echo To stop the application:
echo   docker-compose down
echo.
echo To remove everything (including data):
echo   docker-compose down -v
echo.
pause