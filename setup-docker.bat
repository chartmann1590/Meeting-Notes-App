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

REM Build and start the application
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
echo   • Frontend: http://localhost:3000
echo   • Backend API: http://localhost:3001
echo   • Ollama API: http://localhost:11434
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