# Live Transcription Testing Guide

This document provides comprehensive information about testing and troubleshooting the live transcription functionality in MeetingScribe AI.

## Overview

The live transcription system supports two modes:
1. **Browser Speech Recognition** - Real-time transcription using the browser's built-in speech recognition
2. **Server-side Whisper** - Transcription using Ollama's Whisper model for higher accuracy

## Testing Framework

### Unit Tests

Run unit tests for the transcription components:

```bash
# Test the RealTranscriber class
npm run test:live-transcription

# Test server-side transcription
npm run test:server

# Run all tests with coverage
npm run test:coverage
```

### Integration Tests

Test the complete live transcription workflow:

```bash
# End-to-end live transcription test
npm run test:live-transcription-e2e
```

### Manual Testing

1. **Start the application:**
   ```bash
   npm run dev
   ```

2. **Open the application:**
   - HTTP: http://localhost:3000 (limited microphone access)
   - HTTPS: https://localhost:3443 (full microphone access)

3. **Test live transcription:**
   - Click "Start Recording"
   - Allow microphone access when prompted
   - Speak clearly into your microphone
   - Verify real-time transcription appears
   - Click "Stop Recording" to generate summary

## Test Coverage

### Browser Speech Recognition Tests

- ✅ Speech recognition initialization
- ✅ Continuous recognition with interim results
- ✅ Error handling for various speech recognition errors
- ✅ Automatic restart on recognition end
- ✅ Language and configuration settings

### Server-side Transcription Tests

- ✅ Audio chunk processing
- ✅ Whisper API integration
- ✅ Error handling and retry logic
- ✅ Timeout handling
- ✅ File cleanup

### Integration Tests

- ✅ Complete recording workflow
- ✅ UI state management
- ✅ Error handling and user feedback
- ✅ Accessibility features

## Troubleshooting

### Common Issues

#### 1. Microphone Access Denied

**Symptoms:**
- "Microphone access denied" error message
- Recording button shows "Not Supported"

**Solutions:**
- Ensure you're using HTTPS (required for microphone access)
- Check browser permissions for microphone access
- Try refreshing the page and allowing access again
- Use a different browser if issues persist

#### 2. No Transcription Appearing

**Symptoms:**
- Recording starts but no text appears
- "Waiting for you to speak..." message persists

**Solutions:**
- Check if Whisper model is installed: `ollama list`
- Install Whisper model: `ollama pull whisper`
- Ensure Ollama is running: `ollama serve`
- Check browser console for errors
- Try speaking louder and more clearly

#### 3. Poor Transcription Quality

**Symptoms:**
- Inaccurate or garbled transcription
- Missing words or phrases

**Solutions:**
- Use a good quality microphone
- Speak clearly and at moderate pace
- Reduce background noise
- Try browser speech recognition (usually more accurate for live transcription)
- Check microphone levels in system settings

#### 4. Server Connection Issues

**Symptoms:**
- "Transcription service is not available" message
- Network errors in console

**Solutions:**
- Verify Ollama is running: `curl http://localhost:11434/api/tags`
- Check if Whisper model is available: `ollama list | grep whisper`
- Restart Ollama service: `ollama serve`
- Check firewall settings
- Verify no other services are using port 11434

### Browser Compatibility

#### Supported Browsers

| Browser | Speech Recognition | MediaRecorder | Status |
|---------|-------------------|---------------|---------|
| Chrome | ✅ | ✅ | Fully Supported |
| Edge | ✅ | ✅ | Fully Supported |
| Safari | ✅ | ✅ | Fully Supported |
| Firefox | ❌ | ✅ | Server-side only |

#### Feature Detection

The application automatically detects browser capabilities:

```javascript
// Check if browser supports speech recognition
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  // Use browser speech recognition
} else {
  // Fall back to server-side transcription
}
```

### Performance Optimization

#### For Better Live Transcription

1. **Use Browser Speech Recognition** when available (faster, more accurate)
2. **Optimize audio settings:**
   - Use a good quality microphone
   - Minimize background noise
   - Speak at moderate pace and volume

3. **Network optimization:**
   - Use local Ollama instance for server-side transcription
   - Ensure stable internet connection
   - Consider using HTTPS for better performance

#### For Better Server-side Transcription

1. **Hardware requirements:**
   - At least 4GB RAM for Whisper model
   - SSD storage for faster model loading
   - Good CPU for real-time processing

2. **Model selection:**
   - `whisper` - Good balance of speed and accuracy
   - `whisper-large` - Higher accuracy, slower processing
   - `whisper-tiny` - Faster processing, lower accuracy

## Testing Checklist

### Pre-deployment Testing

- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] End-to-end test script passes
- [ ] Browser compatibility verified
- [ ] Error handling tested
- [ ] Performance benchmarks met

### Manual Testing Scenarios

- [ ] Start/stop recording
- [ ] Microphone permission handling
- [ ] Live transcription accuracy
- [ ] Error recovery
- [ ] Summary generation
- [ ] Multiple recording sessions
- [ ] Different audio qualities
- [ ] Network interruption handling

### Browser Testing

- [ ] Chrome (latest)
- [ ] Edge (latest)
- [ ] Safari (latest)
- [ ] Firefox (server-side only)

## Monitoring and Logging

### Console Logs

The application provides detailed logging for debugging:

```
🎤 Starting live transcription...
✅ Microphone access granted
🎤 Using browser speech recognition for live transcription
📝 New transcript chunk: "Hello world"
🔄 Processing audio chunk: 2048 bytes
```

### Error Tracking

Common error patterns to monitor:

- `MediaRecorder not supported` - Browser compatibility issue
- `Permission denied` - Microphone access issue
- `Transcription service is not available` - Ollama/Whisper issue
- `Network error` - Connection problem

### Performance Metrics

Key metrics to track:

- Transcription latency (time from speech to text)
- Accuracy rate (manual verification)
- Error rate (failed transcriptions)
- Resource usage (CPU, memory)

## Advanced Configuration

### Environment Variables

```bash
# Ollama configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b

# Whisper configuration
WHISPER_API_URL=http://localhost:11434/api/generate
WHISPER_MODEL=whisper

# Server configuration
PORT=3001
HTTPS_PORT=3443
```

### Custom Whisper Models

To use a different Whisper model:

```bash
# Pull a specific model
ollama pull whisper-large

# Set environment variable
export WHISPER_MODEL=whisper-large
```

### SSL Configuration

For HTTPS support (required for microphone access):

```bash
# Generate SSL certificates
npm run ssl:generate

# Or use the setup script
./setup.sh --ssl
```

## Support and Resources

### Documentation

- [API Documentation](./API_DOCUMENTATION.md)
- [Development Guide](./DEVELOPMENT_GUIDE.md)
- [Quick Start Guide](./QUICK_START.md)

### Community

- GitHub Issues for bug reports
- Discussions for feature requests
- Wiki for additional documentation

### Tools

- Browser DevTools for debugging
- Ollama CLI for model management
- Network tab for API monitoring
- Console for error tracking