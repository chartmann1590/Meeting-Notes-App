# MeetingScribe AI - API Documentation

## Overview

MeetingScribe AI provides a RESTful API for local meeting transcription and summarization. All endpoints are served by the Express.js backend running on port 3001.

## Base URL

```
http://localhost:3001
```

## Authentication

Currently, no authentication is required as the application runs locally. All endpoints are accessible without API keys.

## Endpoints

### Health Check

#### GET /api/health

Check if the API server is running and healthy.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
```

**Status Codes:**
- `200` - Server is healthy
- `500` - Server error

---

### Audio Transcription

#### POST /api/transcribe

Transcribe audio file using Whisper AI model.

**Request:**
- **Content-Type:** `multipart/form-data`
- **Body:** Audio file (WAV, MP3, M4A, etc.)

**Example using curl:**
```bash
curl -X POST http://localhost:3001/api/transcribe \
  -F "audio=@meeting.wav"
```

**Response:**
```json
{
  "success": true,
  "transcript": "This is the transcribed text from the audio file...",
  "language": "en",
  "duration": 120.5,
  "model": "whisper"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Failed to transcribe audio",
  "details": "Ollama service not available"
}
```

**Status Codes:**
- `200` - Transcription successful
- `400` - Invalid audio file or missing file
- `500` - Transcription failed or Ollama service unavailable

---

### AI Summarization

#### POST /api/summarize

Generate AI-powered summary from meeting transcript.

**Request:**
```json
{
  "transcript": "Meeting transcript text here...",
  "model": "llama3.2:3b"
}
```

**Parameters:**
- `transcript` (string, required) - The meeting transcript to summarize
- `model` (string, optional) - AI model to use (default: "llama3.2:3b")

**Available Models:**
- `llama3.2:1b` - Fast, basic quality
- `llama3.2:3b` - Balanced speed and quality (recommended)
- `llama3.1:8b` - Slower, higher quality

**Response:**
```json
{
  "success": true,
  "summary": {
    "overview": "Brief meeting overview...",
    "keyPoints": [
      "Key discussion point 1",
      "Key discussion point 2"
    ],
    "actionItems": [
      {
        "task": "Complete project proposal",
        "assignee": "John Doe",
        "dueDate": "2024-01-20"
      }
    ],
    "decisions": [
      "Decision made during meeting"
    ],
    "nextSteps": "Schedule follow-up meeting for next week"
  },
  "model": "llama3.2:3b",
  "processingTime": 2.5
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Failed to generate summary",
  "details": "Ollama service not available"
}
```

**Status Codes:**
- `200` - Summary generated successfully
- `400` - Invalid transcript or missing parameters
- `500` - Summarization failed or Ollama service unavailable

---

### Meeting Management

#### GET /api/meetings

Retrieve list of saved meetings.

**Response:**
```json
{
  "success": true,
  "meetings": [
    {
      "id": "meeting-123",
      "title": "Weekly Team Standup",
      "date": "2024-01-15T10:00:00.000Z",
      "duration": 30,
      "transcript": "Meeting transcript...",
      "summary": {
        "overview": "Weekly team standup meeting...",
        "keyPoints": ["Point 1", "Point 2"],
        "actionItems": [],
        "decisions": [],
        "nextSteps": "Continue current sprint"
      }
    }
  ]
}
```

**Status Codes:**
- `200` - Meetings retrieved successfully
- `500` - Server error

#### POST /api/meetings

Save a new meeting.

**Request:**
```json
{
  "title": "Weekly Team Standup",
  "transcript": "Meeting transcript...",
  "summary": {
    "overview": "Weekly team standup meeting...",
    "keyPoints": ["Point 1", "Point 2"],
    "actionItems": [],
    "decisions": [],
    "nextSteps": "Continue current sprint"
  }
}
```

**Response:**
```json
{
  "success": true,
  "meeting": {
    "id": "meeting-123",
    "title": "Weekly Team Standup",
    "date": "2024-01-15T10:00:00.000Z",
    "duration": 30,
    "transcript": "Meeting transcript...",
    "summary": {
      "overview": "Weekly team standup meeting...",
      "keyPoints": ["Point 1", "Point 2"],
      "actionItems": [],
      "decisions": [],
      "nextSteps": "Continue current sprint"
    }
  }
}
```

**Status Codes:**
- `201` - Meeting saved successfully
- `400` - Invalid meeting data
- `500` - Server error

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

### Common Error Codes

- `400` - Bad Request (invalid input)
- `404` - Not Found (endpoint doesn't exist)
- `500` - Internal Server Error (server or AI service issues)

## Rate Limiting

Currently, no rate limiting is implemented. However, AI model processing may take time, especially for longer audio files or complex summaries.

## File Upload Limits

- **Maximum file size:** 100MB
- **Supported formats:** WAV, MP3, M4A, FLAC, OGG
- **Recommended format:** WAV for best quality

## Environment Variables

The API behavior can be configured using environment variables:

```bash
# Whisper model for transcription
WHISPER_MODEL=whisper

# LLM model for summarization
OLLAMA_MODEL=llama3.2:3b

# Ollama API URL
OLLAMA_API_URL=http://localhost:11434/api/generate

# Server port
PORT=3001
```

## CORS Configuration

The API is configured to accept requests from:
- `http://localhost:3000` (development frontend)
- `http://localhost:4173` (preview frontend)
- Any origin in development mode

## WebSocket Support

Currently, the API only supports HTTP requests. Real-time updates for transcription progress are handled through polling or the frontend's state management.

## Testing

You can test the API using the provided test script:

```bash
node test-app.js
```

Or use curl commands as shown in the endpoint examples above.

## Troubleshooting

### Common Issues

1. **"Ollama service not available"**
   - Ensure Ollama is running: `ollama serve`
   - Check if models are installed: `ollama list`

2. **"Failed to transcribe audio"**
   - Verify audio file format is supported
   - Check file size (must be under 100MB)
   - Ensure Whisper model is available

3. **"Failed to generate summary"**
   - Verify LLM model is installed
   - Check if transcript is not empty
   - Ensure Ollama service is responding

### Health Check

Always start by checking the health endpoint to verify the API is running:

```bash
curl http://localhost:3001/api/health
```