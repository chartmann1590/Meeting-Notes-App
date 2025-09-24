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

REM Check if Ollama is already running locally
echo [INFO] Checking if Ollama is already running locally...
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Ollama is already running locally on port 11434
    
    REM Check if required models are available locally
    echo [INFO] Checking for required AI models in local Ollama...
    
    REM Check for Whisper model
    curl -s http://localhost:11434/api/tags | findstr "whisper" >nul 2>&1
    if %errorlevel% equ 0 (
        echo [SUCCESS] Whisper model is available locally
        set WHISPER_AVAILABLE=true
    ) else (
        echo [WARNING] Whisper model not found locally
        set WHISPER_AVAILABLE=false
    )
    
    REM Check for Llama model
    curl -s http://localhost:11434/api/tags | findstr "llama3.2:3b" >nul 2>&1
    if %errorlevel% equ 0 (
        echo [SUCCESS] Llama 3.2 model is available locally
        set LLAMA_AVAILABLE=true
    ) else (
        echo [WARNING] Llama 3.2 model not found locally
        set LLAMA_AVAILABLE=false
    )
    
    if "%WHISPER_AVAILABLE%"=="true" if "%LLAMA_AVAILABLE%"=="true" (
        echo [SUCCESS] All required models are available locally
        echo [INFO] Skipping Docker Ollama setup - using local installation
        set USE_LOCAL_OLLAMA=true
        goto skip_docker_ollama
    ) else (
        echo [WARNING] Local Ollama is running but missing required models
        echo.
        echo [INFO] You can install the missing models manually:
        echo [INFO]   • For Whisper: ollama pull whisper
        echo [INFO]   • For Llama: ollama pull llama3.2:3b
        echo.
        set /p CONTINUE_DOCKER="Would you like to continue with Docker setup instead? (y/n): "
        if /i not "!CONTINUE_DOCKER!"=="y" (
            echo [ERROR] Please install the required models manually or choose Docker setup
            pause
            exit /b 1
        )
    )
) else (
    REM Check if Ollama process is running
    tasklist /FI "IMAGENAME eq ollama.exe" 2>NUL | find /I /N "ollama.exe" >nul
    if %errorlevel% equ 0 (
        echo [WARNING] Ollama process is running but not accessible on port 11434
    ) else (
        echo [INFO] Ollama is not running locally
    )
)

REM Start Ollama service via Docker
echo [INFO] Starting Ollama service via Docker...
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

:skip_docker_ollama

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
        echo [WARNING] OpenSSL is not installed!
        echo.
        echo [INFO] Attempting to install OpenSSL automatically...
        
        REM Try to install via Chocolatey first
        choco --version >nul 2>&1
        if %errorlevel% equ 0 (
            echo [INFO] Installing OpenSSL via Chocolatey...
            choco install openssl -y
            if %errorlevel% equ 0 (
                echo [SUCCESS] OpenSSL installed successfully via Chocolatey
                REM Refresh PATH
                call refreshenv
            ) else (
                echo [ERROR] Failed to install OpenSSL via Chocolatey
                goto openssl_manual_install
            )
        ) else (
            REM Try to install via winget
            winget --version >nul 2>&1
            if %errorlevel% equ 0 (
                echo [INFO] Installing OpenSSL via winget...
                winget install --id ShiningLight.OpenSSL -e --accept-package-agreements --accept-source-agreements
                if %errorlevel% equ 0 (
                    echo [SUCCESS] OpenSSL installed successfully via winget
                ) else (
                    echo [ERROR] Failed to install OpenSSL via winget
                    goto openssl_manual_install
                )
            ) else (
                goto openssl_manual_install
            )
        )
        
        REM Verify installation
        openssl version >nul 2>&1
        if %errorlevel% neq 0 (
            echo [ERROR] OpenSSL installation completed but not found in PATH
            echo [INFO] You may need to restart your terminal or add OpenSSL to PATH manually
            goto openssl_manual_install
        )
        
        echo [SUCCESS] OpenSSL is now available
        goto openssl_ready
        
        :openssl_manual_install
        echo.
        echo [ERROR] Could not install OpenSSL automatically
        echo.
        echo [INFO] Please install OpenSSL manually:
        echo   • Download from: https://slproweb.com/products/Win32OpenSSL.html
        echo   • Or install via Chocolatey: choco install openssl
        echo   • Or install via winget: winget install ShiningLight.OpenSSL
        echo.
        echo [WARNING] Skipping SSL setup. Microphone access will not work in browsers.
        set SSL_AVAILABLE=false
        goto ssl_setup_complete
        
        :openssl_ready
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

REM Build and start the application
echo.
echo [INFO] Building and starting the application...

REM Check if we're using local Ollama
if "%USE_LOCAL_OLLAMA%"=="true" (
    echo [INFO] Using local Ollama - starting application without Docker Ollama service...
    
    REM Create a temporary docker-compose override for local Ollama
    echo [INFO] Creating temporary configuration for local Ollama...
    (
    echo version: '3.8'
    echo services:
    echo   app:
    echo     environment:
    echo       - NODE_ENV=production
    echo       - OLLAMA_API_URL=http://host.docker.internal:11434/api/generate
    echo       - WHISPER_MODEL=whisper
    echo       - OLLAMA_MODEL=llama3.2:3b
    echo       - HTTPS_PORT=3443
    echo     depends_on: []
    echo     extra_hosts:
    echo       - "host.docker.internal:host-gateway"
    ) > docker-compose.override.yml
    
    docker-compose up -d --build app
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to start the application
        pause
        exit /b 1
    )
    timeout /t 5 /nobreak >nul
    echo [SUCCESS] Application started successfully with local Ollama!
) else (
    echo [INFO] Starting application with Docker Ollama service...
    docker-compose up -d --build
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to start the application
        pause
        exit /b 1
    )
    echo [SUCCESS] Application started successfully!
)

echo.
if "%USE_LOCAL_OLLAMA%"=="true" (
    echo [SUCCESS] ^🎉 MeetingScribe AI is now running with local Ollama!
) else (
    echo [SUCCESS] ^🎉 MeetingScribe AI is now running in Docker!
)
echo.
echo Access your application:
if "%SSL_AVAILABLE%"=="true" (
    echo   • Frontend (HTTPS): https://localhost:3000
    echo   • Backend (HTTPS):  https://localhost:3443
    echo   • Backend (HTTP):   http://localhost:3001
    if "%USE_LOCAL_OLLAMA%"=="true" (
        echo   • Ollama API:       http://localhost:11434 (local)
    ) else (
        echo   • Ollama API:       http://localhost:11434 (Docker)
    )
    echo   • 🎤 Microphone access enabled via HTTPS
) else (
    echo   • Frontend: http://localhost:3000
    echo   • Backend API: http://localhost:3001
    if "%USE_LOCAL_OLLAMA%"=="true" (
        echo   • Ollama API: http://localhost:11434 (local)
    ) else (
        echo   • Ollama API: http://localhost:11434 (Docker)
    )
    echo   • ⚠️  Microphone access requires HTTPS
)
echo.
echo Useful commands:
echo   • View logs: docker-compose logs -f
echo   • Stop services: docker-compose down
echo   • Restart services: docker-compose restart
if "%USE_LOCAL_OLLAMA%"=="true" (
    echo   • Update models: ollama pull ^<model-name^>
    echo   • List models: ollama list
) else (
    echo   • Update models: docker-compose exec ollama ollama pull ^<model-name^>
)
echo.
echo To stop the application:
echo   docker-compose down
echo.
echo To remove everything (including data):
echo   docker-compose down -v
echo.

REM Clean up temporary override file if it exists
if exist "docker-compose.override.yml" (
    del "docker-compose.override.yml" 2>nul
)

pause