@echo off
REM MeetingScribe AI - Windows Setup Script
REM This script sets up MeetingScribe AI on Windows systems

echo.
echo ========================================
echo   MeetingScribe AI - Windows Setup
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo Make sure to add it to your PATH during installation
    pause
    exit /b 1
)

echo [SUCCESS] Node.js is installed
node --version

REM Check Node.js version
for /f "tokens=1 delims=." %%a in ('node --version') do set NODE_MAJOR=%%a
set NODE_MAJOR=%NODE_MAJOR:v=%
if %NODE_MAJOR% lss 18 (
    echo [ERROR] Node.js version %NODE_MAJOR% is too old. Please install Node.js 18 or higher.
    pause
    exit /b 1
)

echo [SUCCESS] Node.js version is compatible

REM Install dependencies
echo.
echo [INFO] Installing npm dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo [SUCCESS] Dependencies installed successfully

REM Check if Ollama is installed
ollama --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [WARNING] Ollama is not installed
    echo Please install Ollama from https://ollama.ai/download
    echo After installation, restart this script
    pause
    exit /b 1
)

echo [SUCCESS] Ollama is installed

REM Check if Ollama service is already running
echo.
echo [INFO] Checking Ollama service status...
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Ollama service is already running
    goto ollama_ready
)

REM Start Ollama service
echo [INFO] Starting Ollama service...
start /b ollama serve
timeout /t 5 /nobreak >nul

REM Wait for Ollama to be ready
echo [INFO] Waiting for Ollama service to be ready...
:wait_loop
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% equ 0 goto ollama_ready
timeout /t 2 /nobreak >nul
goto wait_loop

:ollama_ready
echo [SUCCESS] Ollama service is ready

REM Check for existing AI models
echo.
echo [INFO] Checking for existing AI models...

REM Check for Whisper model
ollama list | findstr /i "whisper" >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Whisper model is already installed
) else (
    echo [INFO] Downloading Whisper model for transcription (this may take a while)...
    ollama pull whisper
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to download Whisper model
        pause
        exit /b 1
    )
    echo [SUCCESS] Whisper model downloaded successfully
)

REM Check for Llama 3.2 model
ollama list | findstr /i "llama3.2:3b" >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Llama 3.2:3b model is already installed
) else (
    echo [INFO] Downloading Llama 3.2:3b model for summarization (this may take a while)...
    ollama pull llama3.2:3b
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to download Llama 3.2:3b model
        pause
        exit /b 1
    )
    echo [SUCCESS] Llama 3.2:3b model downloaded successfully
)

REM Show installed models
echo.
echo [INFO] Currently installed models:
ollama list

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo [SUCCESS] MeetingScribe AI is ready to use!
echo [SUCCESS] Your local AI services are configured with:
echo [SUCCESS]   • Whisper model: whisper (for transcription)
echo [SUCCESS]   • LLM model: llama3.2:3b (for summarization)
echo.

set /p START_APP="Would you like to start the application now? (y/n): "
if /i "%START_APP%"=="y" (
    echo.
    echo [INFO] Starting MeetingScribe AI...
    echo [SUCCESS] Application will be available at:
    echo [SUCCESS]   Frontend: http://localhost:3000
    echo [SUCCESS]   Backend:  http://localhost:3001
    echo.
    echo [INFO] Press Ctrl+C to stop the application
    echo.
    call npm run dev
) else (
    echo.
    echo [INFO] Setup complete! To start the application later, run:
    echo [INFO]   npm run dev
)

pause