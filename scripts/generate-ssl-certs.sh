#!/bin/bash

# SSL Certificate Generation Script for MeetingScribe AI
# This script generates self-signed SSL certificates for HTTPS support

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Function to generate SSL certificates
generate_ssl_certs() {
    local cert_dir="$1"
    local domain="${2:-localhost}"
    
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

# Function to prompt user for SSL certificate generation
prompt_for_ssl() {
    echo
    print_status "🔒 SSL Certificate Setup"
    print_status "========================"
    echo
    print_warning "Web browsers require HTTPS to access microphone permissions."
    print_warning "Without HTTPS, you won't be able to use the microphone feature."
    echo
    print_status "Options:"
    print_status "  1. Generate self-signed certificates (recommended for development)"
    print_status "  2. Skip SSL setup (microphone won't work in browsers)"
    echo
    
    while true; do
        read -p "Would you like to generate self-signed SSL certificates? (y/n): " -n 1 -r
        echo
        case $REPLY in
            [Yy]* ) return 0;;
            [Nn]* ) return 1;;
            * ) print_warning "Please answer yes (y) or no (n).";;
        esac
    done
}

# Main function
main() {
    local cert_dir="${1:-./ssl-certs}"
    local domain="${2:-localhost}"
    
    print_status "🔒 SSL Certificate Generator for MeetingScribe AI"
    print_status "================================================="
    echo
    
    # Check if OpenSSL is available
    if ! check_openssl; then
        exit 1
    fi
    
    # Check if certificates already exist
    if [ -f "$cert_dir/server.crt" ] && [ -f "$cert_dir/server.key" ]; then
        print_warning "SSL certificates already exist in $cert_dir"
        echo
        read -p "Would you like to regenerate them? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_success "Using existing SSL certificates"
            return 0
        fi
    fi
    
    # Generate certificates
    if generate_ssl_certs "$cert_dir" "$domain"; then
        print_success "SSL setup complete!"
        echo
        print_warning "Important notes:"
        print_warning "  • These are self-signed certificates for development only"
        print_warning "  • Your browser will show a security warning - this is normal"
        print_warning "  • Click 'Advanced' and 'Proceed to localhost' to continue"
        print_warning "  • For production, use certificates from a trusted CA"
        echo
        return 0
    else
        print_error "Failed to generate SSL certificates"
        return 1
    fi
}

# Run main function with arguments
main "$@"