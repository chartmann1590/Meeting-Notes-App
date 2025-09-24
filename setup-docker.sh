#!/bin/bash

# MeetingScribe AI - Docker Quickstart Setup Script
# This script sets up the entire application using Docker for easy deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}  MeetingScribe AI - Docker Setup${NC}"
    echo -e "${PURPLE}================================${NC}"
    echo
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Docker installation
check_docker() {
    print_status "Checking Docker installation..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed!"
        echo
        print_status "Please install Docker first:"
        echo "  • Linux: https://docs.docker.com/engine/install/"
        echo "  • macOS: https://docs.docker.com/desktop/mac/install/"
        echo "  • Windows: https://docs.docker.com/desktop/windows/install/"
        echo
        print_status "After installing Docker, restart this script."
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is installed but not running!"
        echo
        print_status "Please start Docker and try again:"
        echo "  • Linux: sudo systemctl start docker"
        echo "  • macOS/Windows: Start Docker Desktop"
        exit 1
    fi
    
    print_success "Docker is installed and running"
}

# Function to check Docker Compose
check_docker_compose() {
    print_status "Checking Docker Compose..."
    
    if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
        print_error "Docker Compose is not available!"
        echo
        print_status "Please install Docker Compose or update Docker to a newer version."
        exit 1
    fi
    
    print_success "Docker Compose is available"
}

# Function to pull AI models
pull_models() {
    print_status "Setting up AI models..."
    
    # Start Ollama service first
    print_status "Starting Ollama service..."
    docker-compose up -d ollama
    
    # Wait for Ollama to be ready
    print_status "Waiting for Ollama to be ready..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if docker-compose exec ollama ollama list >/dev/null 2>&1; then
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -le 0 ]; then
        print_error "Ollama failed to start within 60 seconds"
        exit 1
    fi
    
    print_success "Ollama is ready"
    
    # Check if models already exist
    print_status "Checking for existing AI models..."
    
    # Check for Whisper model
    if docker-compose exec ollama ollama list | grep -q "whisper"; then
        print_success "Whisper model already installed"
    else
        print_status "Downloading Whisper model (this may take a few minutes)..."
        docker-compose exec ollama ollama pull whisper
        print_success "Whisper model downloaded"
    fi
    
    # Check for Llama model
    if docker-compose exec ollama ollama list | grep -q "llama3.2:3b"; then
        print_success "Llama 3.2 model already installed"
    else
        print_status "Downloading Llama 3.2 model (this may take several minutes)..."
        docker-compose exec ollama ollama pull llama3.2:3b
        print_success "Llama 3.2 model downloaded"
    fi
}

# Function to check if OpenSSL is available
check_openssl() {
    if ! command -v openssl >/dev/null 2>&1; then
        print_error "OpenSSL is not installed!"
        echo
        print_status "Please install OpenSSL:"
        echo "  • Ubuntu/Debian: sudo apt-get install openssl"
        echo "  • CentOS/RHEL: sudo yum install openssl"
        echo "  • macOS: brew install openssl"
        echo "  • Windows: Download from https://slproweb.com/products/Win32OpenSSL.html"
        return 1
    fi
    return 0
}

# Function to generate SSL certificates directly
generate_ssl_certificates() {
    local cert_dir="./ssl-certs"
    local domain="localhost"
    
    print_status "Generating SSL certificates for domain: $domain"
    
    # Create certificates directory
    mkdir -p "$cert_dir"
    
    # Generate private key
    print_status "Generating private key..."
    openssl genrsa -out "$cert_dir/server.key" 2048
    
    # Generate certificate signing request
    print_status "Generating certificate signing request..."
    openssl req -new -key "$cert_dir/server.key" -out "$cert_dir/server.csr" -subj "/C=US/ST=State/L=City/O=Organization/OU=Unit/CN=$domain"
    
    # Generate self-signed certificate
    print_status "Generating self-signed certificate..."
    openssl x509 -req -days 365 -in "$cert_dir/server.csr" -signkey "$cert_dir/server.key" -out "$cert_dir/server.crt" -extensions v3_req -extfile <(
        echo "[req]"
        echo "distinguished_name = req_distinguished_name"
        echo "req_extensions = v3_req"
        echo "prompt = no"
        echo ""
        echo "[req_distinguished_name]"
        echo "C = US"
        echo "ST = State"
        echo "L = City"
        echo "O = Organization"
        echo "OU = Unit"
        echo "CN = $domain"
        echo ""
        echo "[v3_req]"
        echo "keyUsage = keyEncipherment, dataEncipherment"
        echo "extendedKeyUsage = serverAuth"
        echo "subjectAltName = @alt_names"
        echo ""
        echo "[alt_names]"
        echo "DNS.1 = $domain"
        echo "DNS.2 = localhost"
        echo "IP.1 = 127.0.0.1"
        echo "IP.2 = ::1"
    )
    
    # Set proper permissions
    chmod 600 "$cert_dir/server.key"
    chmod 644 "$cert_dir/server.crt"
    
    # Clean up CSR file
    rm "$cert_dir/server.csr"
    
    print_success "SSL certificates generated successfully!"
    print_status "Certificate files:"
    print_status "  • Private Key: $cert_dir/server.key"
    print_status "  • Certificate: $cert_dir/server.crt"
    
    return 0
}

# Function to setup SSL certificates for Docker
setup_ssl_certificates() {
    print_status "🔒 SSL Certificate Setup"
    print_status "========================"
    echo ""
    print_warning "Web browsers require HTTPS to access microphone permissions."
    print_warning "Without HTTPS, you won't be able to use the microphone feature."
    echo ""
    print_status "Options:"
    print_status "  1. Generate self-signed certificates (recommended for development)"
    print_status "  2. Skip SSL setup (microphone won't work in browsers)"
    echo ""
    
    while true; do
        read -p "Would you like to generate self-signed SSL certificates? (y/n): " -n 1 -r
        echo ""
        case $REPLY in
            [Yy]* ) 
                # Check if certificates already exist
                if [ -f "./ssl-certs/server.crt" ] && [ -f "./ssl-certs/server.key" ]; then
                    print_warning "SSL certificates already exist in ./ssl-certs"
                    echo ""
                    read -p "Would you like to regenerate them? (y/n): " -n 1 -r
                    echo ""
                    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                        print_success "Using existing SSL certificates"
                        return 0
                    fi
                fi
                
                # Check if OpenSSL is available
                if ! check_openssl; then
                    print_error "Cannot generate SSL certificates without OpenSSL"
                    return 1
                fi
                
                # Generate certificates directly
                print_status "Generating SSL certificates..."
                if generate_ssl_certificates; then
                    print_success "SSL certificates generated successfully!"
                    echo ""
                    print_warning "Important notes:"
                    print_warning "  • These are self-signed certificates for development only"
                    print_warning "  • Your browser will show a security warning - this is normal"
                    print_warning "  • Click 'Advanced' and 'Proceed to localhost' to continue"
                    print_warning "  • For production, use certificates from a trusted CA"
                    return 0
                else
                    print_error "Failed to generate SSL certificates"
                    return 1
                fi
                ;;
            [Nn]* ) 
                print_warning "Skipping SSL setup. Microphone access will not work in browsers."
                return 1
                ;;
            * ) print_warning "Please answer yes (y) or no (n).";;
        esac
    done
}

# Function to build and start the application
start_application() {
    print_status "Building and starting the application..."
    
    # Build and start all services
    docker-compose up -d --build
    
    print_success "Application started successfully!"
}

# Function to show final instructions
show_final_instructions() {
    local ssl_available=${1:-1}
    
    echo
    print_success "🎉 MeetingScribe AI is now running in Docker!"
    echo
    echo -e "${CYAN}Access your application:${NC}"
    if [ $ssl_available -eq 0 ]; then
        echo "  • Frontend (HTTPS): https://localhost:3000"
        echo "  • Backend (HTTPS):  https://localhost:3443"
        echo "  • Backend (HTTP):   http://localhost:3001"
        echo "  • Ollama API:       http://localhost:11434"
        echo "  • 🎤 Microphone access enabled via HTTPS"
    else
        echo "  • Frontend: http://localhost:3000"
        echo "  • Backend API: http://localhost:3001"
        echo "  • Ollama API: http://localhost:11434"
        echo "  • ⚠️  Microphone access requires HTTPS"
    fi
    echo
    echo -e "${CYAN}Useful commands:${NC}"
    echo "  • View logs: docker-compose logs -f"
    echo "  • Stop services: docker-compose down"
    echo "  • Restart services: docker-compose restart"
    echo "  • Update models: docker-compose exec ollama ollama pull <model-name>"
    echo
    echo -e "${CYAN}To stop the application:${NC}"
    echo "  docker-compose down"
    echo
    echo -e "${CYAN}To remove everything (including data):${NC}"
    echo "  docker-compose down -v"
    echo
}

# Function to handle cleanup on exit
cleanup() {
    if [ $? -ne 0 ]; then
        print_error "Setup failed. Cleaning up..."
        docker-compose down >/dev/null 2>&1 || true
    fi
}

# Set trap for cleanup
trap cleanup EXIT

# Main execution
main() {
    print_header
    
    # Check prerequisites
    check_docker
    check_docker_compose
    
    # Pull AI models
    pull_models
    
    # Setup SSL certificates
    setup_ssl_certificates
    local ssl_available=$?
    
    # Start the application
    start_application
    
    # Show final instructions
    show_final_instructions $ssl_available
}

# Run main function
main "$@"