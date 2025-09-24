#!/bin/bash

# MeetingScribe AI - All-in-One Setup Script
# This script sets up everything needed to run MeetingScribe AI with minimal user interaction

set -e  # Exit on any error

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
    echo -e "${PURPLE}$1${NC}"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to get Node.js version
get_node_version() {
    if command_exists node; then
        node --version | sed 's/v//' | cut -d. -f1
    else
        echo "0"
    fi
}

# Function to install Node.js on different systems
install_nodejs() {
    print_status "Installing Node.js..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command_exists brew; then
            brew install node
        else
            print_error "Homebrew not found. Please install Node.js manually from https://nodejs.org/"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command_exists apt-get; then
            # Ubuntu/Debian
            curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
            sudo apt-get install -y nodejs
        elif command_exists yum; then
            # CentOS/RHEL
            curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
            sudo yum install -y nodejs
        elif command_exists dnf; then
            # Fedora
            curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
            sudo dnf install -y nodejs
        else
            print_error "Unsupported Linux distribution. Please install Node.js manually from https://nodejs.org/"
            exit 1
        fi
    else
        print_error "Unsupported operating system. Please install Node.js manually from https://nodejs.org/"
        exit 1
    fi
}

# Function to install Ollama
install_ollama() {
    print_status "Installing Ollama..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command_exists brew; then
            brew install ollama
        else
            print_warning "Homebrew not found. Please install Ollama manually from https://ollama.ai/download"
            return 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -fsSL https://ollama.ai/install.sh | sh
    else
        print_warning "Unsupported operating system. Please install Ollama manually from https://ollama.ai/download"
        return 1
    fi
}

# Function to check if Ollama service is running
is_ollama_running() {
    curl -s http://localhost:11434/api/tags >/dev/null 2>&1
}

# Function to wait for Ollama service to be ready
wait_for_ollama() {
    print_status "Waiting for Ollama service to be ready..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if is_ollama_running; then
            print_success "Ollama service is ready!"
            return 0
        fi
        
        print_status "Attempt $attempt/$max_attempts - waiting for Ollama..."
        sleep 2
        ((attempt++))
    done
    
    print_error "Ollama service failed to start within 60 seconds"
    return 1
}

# Function to check if a model is already installed
is_model_installed() {
    local model_name="$1"
    if is_ollama_running; then
        ollama list 2>/dev/null | grep -q "$model_name"
    else
        return 1
    fi
}

# Function to get list of installed models
get_installed_models() {
    if is_ollama_running; then
        ollama list 2>/dev/null | grep -v "NAME" | awk '{print $1}' | tr '\n' ' '
    else
        echo ""
    fi
}

# Function to pull AI models
pull_models() {
    print_status "Checking for existing AI models..."
    
    # Check for Whisper model
    if is_model_installed "whisper"; then
        print_success "Whisper model is already installed"
    else
        print_status "Downloading Whisper model for transcription (this may take a while)..."
        if ollama pull whisper; then
            print_success "Whisper model downloaded successfully"
        else
            print_error "Failed to download Whisper model"
            return 1
        fi
    fi
    
    # Check for Llama 3.2 model
    if is_model_installed "llama3.2:3b"; then
        print_success "Llama 3.2:3b model is already installed"
    else
        print_status "Downloading Llama 3.2:3b model for summarization (this may take a while)..."
        if ollama pull llama3.2:3b; then
            print_success "Llama 3.2:3b model downloaded successfully"
        else
            print_error "Failed to download Llama 3.2:3b model"
            return 1
        fi
    fi
    
    # Show installed models
    local installed_models=$(get_installed_models)
    if [ -n "$installed_models" ]; then
        print_status "Currently installed models: $installed_models"
    fi
}

# Function to setup SSL certificates
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
                print_status "Generating SSL certificates..."
                if [ -f "./scripts/generate-ssl-certs.sh" ]; then
                    chmod +x ./scripts/generate-ssl-certs.sh
                    ./scripts/generate-ssl-certs.sh ./ssl-certs localhost
                    if [ $? -eq 0 ]; then
                        print_success "SSL certificates generated successfully!"
                        return 0
                    else
                        print_error "Failed to generate SSL certificates"
                        return 1
                    fi
                else
                    print_error "SSL certificate generation script not found"
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

# Function to start the application
start_application() {
    print_status "Starting MeetingScribe AI..."
    
    # Check if SSL certificates exist
    local ssl_available=false
    if [ -f "./ssl-certs/server.crt" ] && [ -f "./ssl-certs/server.key" ]; then
        ssl_available=true
    fi
    
    # Check if user wants to start the app
    echo ""
    read -p "Would you like to start the application now? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Starting the application..."
        if [ "$ssl_available" = true ]; then
            print_success "Application will be available at:"
            print_success "  Frontend (HTTPS): https://localhost:3000"
            print_success "  Backend (HTTPS):  https://localhost:3443"
            print_success "  Backend (HTTP):   http://localhost:3001"
            print_success "  🎤 Microphone access enabled via HTTPS"
        else
            print_success "Application will be available at:"
            print_success "  Frontend: http://localhost:3000"
            print_success "  Backend:  http://localhost:3001"
            print_warning "  ⚠️  Microphone access requires HTTPS"
        fi
        echo ""
        print_status "Press Ctrl+C to stop the application"
        echo ""
        
        # Start the application
        npm run dev
    else
        print_status "Setup complete! To start the application later, run:"
        print_status "  npm run dev"
    fi
}

# Main setup function
main() {
    print_header "🚀 MeetingScribe AI - All-in-One Setup"
    print_header "======================================"
    echo ""
    
    # Step 1: Check and install Node.js
    print_header "📦 Step 1: Checking Node.js..."
    NODE_VERSION=$(get_node_version)
    
    if [ "$NODE_VERSION" -lt 18 ]; then
        if [ "$NODE_VERSION" -eq 0 ]; then
            print_warning "Node.js is not installed"
        else
            print_warning "Node.js version $NODE_VERSION is too old (minimum required: 18)"
        fi
        
        echo ""
        read -p "Would you like to install/update Node.js automatically? (y/n): " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_nodejs
            print_success "Node.js installed successfully"
        else
            print_error "Node.js installation required. Please install Node.js 18+ manually from https://nodejs.org/"
            exit 1
        fi
    else
        print_success "Node.js $(node --version) is installed and compatible"
    fi
    
    # Step 2: Install npm dependencies
    print_header "📦 Step 2: Installing dependencies..."
    if [ ! -d "node_modules" ]; then
        print_status "Installing npm dependencies..."
        if npm install; then
            print_success "Dependencies installed successfully"
        else
            print_error "Failed to install dependencies"
            exit 1
        fi
    else
        print_success "Dependencies already installed"
    fi
    
    # Step 3: Check and install Ollama
    print_header "🤖 Step 3: Setting up AI services..."
    if ! command_exists ollama; then
        print_warning "Ollama is not installed"
        echo ""
        read -p "Would you like to install Ollama automatically? (y/n): " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if install_ollama; then
                print_success "Ollama installed successfully"
            else
                print_error "Failed to install Ollama automatically"
                print_warning "Please install Ollama manually from https://ollama.ai/download"
                exit 1
            fi
        else
            print_error "Ollama installation required. Please install Ollama manually from https://ollama.ai/download"
            exit 1
        fi
    else
        print_success "Ollama is installed"
    fi
    
    # Step 4: Start Ollama service
    print_status "Checking Ollama service status..."
    if is_ollama_running; then
        print_success "Ollama service is already running"
    else
        print_status "Starting Ollama service..."
        if ! pgrep -x "ollama" > /dev/null; then
            ollama serve &
            sleep 3
        fi
        
        # Wait for Ollama to be ready
        if ! wait_for_ollama; then
            print_error "Failed to start Ollama service"
            exit 1
        fi
    fi
    
    # Step 5: Download AI models
    print_header "📥 Step 4: Downloading AI models..."
    if ! pull_models; then
        print_error "Failed to download AI models"
        exit 1
    fi
    
    # Step 6: Setup SSL certificates
    print_header "🔒 Step 5: SSL Certificate Setup..."
    setup_ssl_certificates
    
    # Step 7: Final setup and start
    print_header "🎉 Setup Complete!"
    echo ""
    print_success "MeetingScribe AI is ready to use!"
    print_success "Your local AI services are configured with:"
    print_success "  • Whisper model: whisper (for transcription)"
    print_success "  • LLM model: llama3.2:3b (for summarization)"
    echo ""
    
    # Start the application
    start_application
}

# Handle script interruption
trap 'print_error "Setup interrupted by user"; exit 1' INT

# Run main function
main "$@"