@echo off
setlocal enabledelayedexpansion

REM SSL Certificate Generation Script for MeetingScribe AI (Windows)
REM This script generates self-signed SSL certificates for HTTPS support

echo.
echo ==================================================
echo   SSL Certificate Generator for MeetingScribe AI
echo ==================================================
echo.

REM Check if OpenSSL is available
openssl version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] OpenSSL is not installed!
    echo.
    echo [INFO] Please install OpenSSL:
    echo   Download from: https://slproweb.com/products/Win32OpenSSL.html
    echo   Or install via Chocolatey: choco install openssl
    echo.
    pause
    exit /b 1
)

echo [SUCCESS] OpenSSL is available

REM Set default values
set CERT_DIR=%~1
if "%CERT_DIR%"=="" set CERT_DIR=.\ssl-certs
set DOMAIN=%~2
if "%DOMAIN%"=="" set DOMAIN=localhost

REM Check if certificates already exist
if exist "%CERT_DIR%\server.crt" if exist "%CERT_DIR%\server.key" (
    echo.
    echo [WARNING] SSL certificates already exist in %CERT_DIR%
    echo.
    set /p REGENERATE="Would you like to regenerate them? (y/n): "
    if /i not "!REGENERATE!"=="y" (
        echo [SUCCESS] Using existing SSL certificates
        goto :end
    )
)

REM Create certificates directory
if not exist "%CERT_DIR%" mkdir "%CERT_DIR%"

echo.
echo [INFO] Generating SSL certificates for domain: %DOMAIN%

REM Generate private key
echo [INFO] Generating private key...
openssl genrsa -out "%CERT_DIR%\server.key" 2048
if %errorlevel% neq 0 (
    echo [ERROR] Failed to generate private key
    pause
    exit /b 1
)

REM Generate certificate signing request
echo [INFO] Generating certificate signing request...
openssl req -new -key "%CERT_DIR%\server.key" -out "%CERT_DIR%\server.csr" -subj "/C=US/ST=State/L=City/O=Organization/OU=Unit/CN=%DOMAIN%"
if %errorlevel% neq 0 (
    echo [ERROR] Failed to generate certificate signing request
    pause
    exit /b 1
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
echo CN = %DOMAIN%
echo.
echo [v3_req]
echo keyUsage = keyEncipherment, dataEncipherment
echo extendedKeyUsage = serverAuth
echo subjectAltName = @alt_names
echo.
echo [alt_names]
echo DNS.1 = %DOMAIN%
echo DNS.2 = localhost
echo IP.1 = 127.0.0.1
echo IP.2 = ::1
) > "%CERT_DIR%\openssl.conf"

REM Generate self-signed certificate
echo [INFO] Generating self-signed certificate...
openssl x509 -req -days 365 -in "%CERT_DIR%\server.csr" -signkey "%CERT_DIR%\server.key" -out "%CERT_DIR%\server.crt" -extensions v3_req -extfile "%CERT_DIR%\openssl.conf"
if %errorlevel% neq 0 (
    echo [ERROR] Failed to generate certificate
    pause
    exit /b 1
)

REM Clean up temporary files
del "%CERT_DIR%\server.csr" 2>nul
del "%CERT_DIR%\openssl.conf" 2>nul

echo.
echo [SUCCESS] SSL certificates generated successfully!
echo [INFO] Certificate files:
echo [INFO]   • Private Key: %CERT_DIR%\server.key
echo [INFO]   • Certificate: %CERT_DIR%\server.crt
echo.
echo [SUCCESS] SSL setup complete!
echo.
echo [WARNING] Important notes:
echo [WARNING]   • These are self-signed certificates for development only
echo [WARNING]   • Your browser will show a security warning - this is normal
echo [WARNING]   • Click 'Advanced' and 'Proceed to localhost' to continue
echo [WARNING]   • For production, use certificates from a trusted CA
echo.

:end
echo [INFO] SSL certificate generation complete.