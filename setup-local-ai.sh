#!/bin/bash

# MeetingScribe AI - Local Setup Script
# This script helps you set up the local AI services (Ollama with Whisper and LLM models)

echo "🚀 Setting up MeetingScribe AI with Local AI Services"
echo "=================================================="

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama is not installed. Please install it first:"
    echo "   Visit: https://ollama.ai/download"
    echo "   Or run: curl -fsSL https://ollama.ai/install.sh | sh"
    exit 1
fi

echo "✅ Ollama is installed"

# Check if Ollama service is already running
if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
    echo "✅ Ollama service is already running"
else
    # Start Ollama service if not running
    if ! pgrep -x "ollama" > /dev/null; then
        echo "🔄 Starting Ollama service..."
        ollama serve &
        sleep 3
    fi
    echo "✅ Ollama service is running"
fi

# Check for existing models before downloading
echo "🔍 Checking for existing AI models..."

# Check for Whisper model
if ollama list 2>/dev/null | grep -q "whisper"; then
    echo "✅ Whisper model is already installed"
else
    echo "📥 Downloading Whisper model for transcription..."
    ollama pull whisper
fi

# Check for Llama 3.2 model
if ollama list 2>/dev/null | grep -q "llama3.2:3b"; then
    echo "✅ Llama 3.2:3b model is already installed"
else
    echo "📥 Downloading Llama 3.2 model for summarization..."
    ollama pull llama3.2:3b
fi

# Show installed models
echo ""
echo "📋 Currently installed models:"
ollama list

echo ""
echo "🎉 Setup complete! Your local AI services are ready:"
echo "   • Whisper model: whisper (for transcription)"
echo "   • LLM model: llama3.2:3b (for summarization)"
echo ""
echo "🚀 To start the application:"
echo "   npm run dev"
echo ""
echo "📝 The app will be available at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo ""
echo "💡 Tips:"
echo "   • Make sure your microphone is working"
echo "   • The first transcription/summary might take longer as models load"
echo "   • You can use other Ollama models by setting environment variables"