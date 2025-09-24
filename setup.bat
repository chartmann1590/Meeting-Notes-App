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
    echo [INFO] Checking OpenSSL availability...
    openssl version >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] OpenSSL is not installed!
        echo.
        echo [INFO] Please install OpenSSL:
        echo   Download from: https://slproweb.com/products/Win32OpenSSL.html
        echo   Or install via Chocolatey: choco install openssl
        echo.
        echo [WARNING] Skipping SSL setup. Microphone access will not work in browsers.
        set SSL_AVAILABLE=false
        goto ssl_setup_complete
    )
    
    echo [SUCCESS] OpenSSL is available
    
    REM Check if certificates already exist
    if exist "ssl-certs\server.crt" if exist "ssl-certs\server.key" (
        echo.
        echo [WARNING] SSL certificates already exist in ssl-certs
        echo.
        set /p REGENERATE="Would you like to regenerate them? (y/n): "
        if /i not "!REGENERATE!"=="y" (
            echo [SUCCESS] Using existing SSL certificates
            set SSL_AVAILABLE=true
            goto ssl_setup_complete
        )
    )
    
    echo.
    echo [INFO] Generating SSL certificates for domain: localhost
    
    REM Create certificates directory
    if not exist "ssl-certs" mkdir "ssl-certs"
    
    REM Generate private key
    echo [INFO] Generating private key...
    openssl genrsa -out "ssl-certs\server.key" 2048
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to generate private key
        set SSL_AVAILABLE=false
        goto ssl_setup_complete
    )
    
    REM Generate certificate signing request
    echo [INFO] Generating certificate signing request...
    openssl req -new -key "ssl-certs\server.key" -out "ssl-certs\server.csr" -subj "/C=US/ST=State/L=City/O=Organization/OU=Unit/CN=localhost"
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to generate certificate signing request
        set SSL_AVAILABLE=false
        goto ssl_setup_complete
    )
    
    REM Create OpenSSL config file for SAN
    echo [INFO] Creating OpenSSL configuration...
    (
    echo [req]
    echo distinguished_name = req_distinguished_name
    echo req_extensions = v3_req
    echo prompt = no
    echo.
    echo [req_distinguished_name]
    echo C = US
    echo ST = State
    echo L = City
    echo O = Organization
    echo OU = Unit
    echo CN = localhost
    echo.
    echo [v3_req]
    echo keyUsage = keyEncipherment, dataEncipherment
    echo extendedKeyUsage = serverAuth
    echo subjectAltName = @alt_names
    echo.
    echo [alt_names]
    echo DNS.1 = localhost
    echo DNS.2 = localhost
    echo IP.1 = 127.0.0.1
    echo IP.2 = ::1
    ) > "ssl-certs\openssl.conf"
    
    REM Generate self-signed certificate
    echo [INFO] Generating self-signed certificate...
    openssl x509 -req -days 365 -in "ssl-certs\server.csr" -signkey "ssl-certs\server.key" -out "ssl-certs\server.crt" -extensions v3_req -extfile "ssl-certs\openssl.conf"
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to generate certificate
        set SSL_AVAILABLE=false
        goto ssl_setup_complete
    )
    
    REM Clean up temporary files
    del "ssl-certs\server.csr" 2>nul
    del "ssl-certs\openssl.conf" 2>nul
    
    echo.
    echo [SUCCESS] SSL certificates generated successfully!
    echo [INFO] Certificate files:
    echo [INFO]   • Private Key: ssl-certs\server.key
    echo [INFO]   • Certificate: ssl-certs\server.crt
    echo.
    echo [WARNING] Important notes:
    echo [WARNING]   • These are self-signed certificates for development only
    echo [WARNING]   • Your browser will show a security warning - this is normal
    echo [WARNING]   • Click 'Advanced' and 'Proceed to localhost' to continue
    echo [WARNING]   • For production, use certificates from a trusted CA
    echo.
    set SSL_AVAILABLE=true
) else (
    echo [WARNING] Skipping SSL setup. Microphone access will not work in browsers.
    set SSL_AVAILABLE=false
)

:ssl_setup_complete

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
    if "%SSL_AVAILABLE%"=="true" (
        echo [SUCCESS] Application will be available at:
        echo [SUCCESS]   Frontend (HTTPS): https://localhost:3000
        echo [SUCCESS]   Backend (HTTPS):  https://localhost:3443
        echo [SUCCESS]   Backend (HTTP):   http://localhost:3001
        echo [SUCCESS]   🎤 Microphone access enabled via HTTPS
    ) else (
        echo [SUCCESS] Application will be available at:
        echo [SUCCESS]   Frontend: http://localhost:3000
        echo [SUCCESS]   Backend:  http://localhost:3001
        echo [WARNING]   ⚠️  Microphone access requires HTTPS
    )
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