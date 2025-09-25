import express from 'express';
import multer from 'multer';
import cors from 'cors';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';
import * as http from 'http';
import { fileURLToPath } from 'url';
import { transcribeAudio } from './services/whisper.js';
import { generateSummary } from './services/ollama.js';
import { MeetingRecord, Summary } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB limit
  }
});

// In-memory storage for meetings (in production, use a database)
const meetings: MeetingRecord[] = [];

// Service status check functions
async function checkOllamaStatus(): Promise<{ 
  connected: boolean; 
  currentModel?: string; 
  availableModels?: string[];
  error?: string 
}> {
  try {
    const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';
    
    // First, try to get available models
    let availableModels: string[] = [];
    try {
      const modelsResponse = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (modelsResponse.ok) {
        const modelsData = await modelsResponse.json();
        availableModels = modelsData.models?.map((model: any) => model.name) || [];
      }
    } catch (modelsError) {
      console.warn('Could not fetch available models:', modelsError);
    }
    
    // Test the current model
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: 'test',
        stream: false
      })
    });
    
    if (response.ok) {
      return { 
        connected: true, 
        currentModel: OLLAMA_MODEL,
        availableModels: availableModels
      };
    } else {
      return { 
        connected: false, 
        currentModel: OLLAMA_MODEL,
        availableModels: availableModels,
        error: `HTTP ${response.status}` 
      };
    }
  } catch (error) {
    return { 
      connected: false, 
      currentModel: process.env.OLLAMA_MODEL || 'llama3.2:3b',
      availableModels: [],
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

async function checkWhisperStatus(): Promise<{ 
  connected: boolean; 
  currentModel?: string; 
  availableModels?: string[];
  error?: string 
}> {
  try {
    const WHISPER_BASE_URL = process.env.WHISPER_BASE_URL || 'http://localhost:11434';
    const WHISPER_MODEL = process.env.WHISPER_MODEL || 'whisper';
    
    // First, try to get available models
    let availableModels: string[] = [];
    try {
      const modelsResponse = await fetch(`${WHISPER_BASE_URL}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (modelsResponse.ok) {
        const modelsData = await modelsResponse.json();
        // Filter for whisper models
        availableModels = modelsData.models?.filter((model: any) => 
          model.name.toLowerCase().includes('whisper')
        ).map((model: any) => model.name) || [];
      }
    } catch (modelsError) {
      console.warn('Could not fetch available whisper models:', modelsError);
    }
    
    // Test the current model
    const response = await fetch(`${WHISPER_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: WHISPER_MODEL,
        prompt: 'test',
        stream: false
      })
    });
    
    if (response.ok) {
      return { 
        connected: true, 
        currentModel: WHISPER_MODEL,
        availableModels: availableModels
      };
    } else {
      return { 
        connected: false, 
        currentModel: WHISPER_MODEL,
        availableModels: availableModels,
        error: `HTTP ${response.status}` 
      };
    }
  } catch (error) {
    return { 
      connected: false, 
      currentModel: process.env.WHISPER_MODEL || 'whisper',
      availableModels: [],
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    },
  });
});

// Service status check endpoint
app.get('/api/services/status', async (req, res) => {
  try {
    console.log('🔍 Checking service status...');
    
    // Check Ollama service
    const ollamaStatus = await checkOllamaStatus();
    console.log(`🤖 Ollama status: ${ollamaStatus.connected ? '✅ Connected' : '❌ Disconnected'}`);
    
    // Check Whisper service
    const whisperStatus = await checkWhisperStatus();
    console.log(`🎤 Whisper status: ${whisperStatus.connected ? '✅ Connected' : '❌ Disconnected'}`);
    
    res.json({
      success: true,
      data: {
        ollama: ollamaStatus,
        whisper: whisperStatus,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ Service status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check service status'
    });
  }
});

// Transcribe audio endpoint
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      console.log('❌ No audio file provided in transcription request');
      return res.status(400).json({
        success: false,
        error: 'No audio file provided'
      });
    }

    console.log(`🎵 Transcribing audio file: ${req.file.filename} (${req.file.size} bytes)`);
    console.log(`📁 File path: ${req.file.path}`);
    
    const startTime = Date.now();
    const transcript = await transcribeAudio(req.file.path);
    const processingTime = Date.now() - startTime;
    
    console.log(`✅ Transcription completed in ${processingTime}ms`);
    console.log(`📝 Transcript length: ${transcript.length} characters`);
    console.log(`📝 Transcript preview: "${transcript.substring(0, 100)}${transcript.length > 100 ? '...' : ''}"`);
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    console.log(`🗑️ Cleaned up temporary file: ${req.file.filename}`);
    
    res.json({
      success: true,
      data: { transcript }
    });
  } catch (error) {
    console.error('❌ Transcription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to transcribe audio'
    });
  }
});

// Generate summary endpoint
app.post('/api/summarize', async (req, res) => {
  try {
    const { transcript } = req.body;
    
    if (!transcript || !transcript.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Transcript is required'
      });
    }

    console.log('Generating summary for transcript length:', transcript.length);
    const summary = await generateSummary(transcript);
    
    res.json({
      success: true,
      data: { summary }
    });
  } catch (error) {
    console.error('Summary generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate summary'
    });
  }
});

// Get meetings endpoint
app.get('/api/meetings', (req, res) => {
  try {
    res.json({
      success: true,
      data: meetings.sort((a, b) => b.createdAt - a.createdAt)
    });
  } catch (error) {
    console.error('Failed to fetch meetings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve meetings'
    });
  }
});

// Save meeting endpoint
app.post('/api/meetings', (req, res) => {
  try {
    const { transcript, summary } = req.body;
    
    if (!transcript || !summary) {
      return res.status(400).json({
        success: false,
        error: 'Transcript and summary are required'
      });
    }

    const newMeeting: MeetingRecord = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      transcript,
      summary
    };

    meetings.push(newMeeting);
    
    res.json({
      success: true,
      data: newMeeting
    });
  } catch (error) {
    console.error('Failed to save meeting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save meeting'
    });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Function to check if SSL certificates exist
function checkSSLCertificates() {
  const certPath = path.join(__dirname, '../ssl-certs/server.crt');
  const keyPath = path.join(__dirname, '../ssl-certs/server.key');
  return fs.existsSync(certPath) && fs.existsSync(keyPath);
}

// Function to start HTTP server
function startHTTPServer() {
  const server = http.createServer(app);
  server.listen(PORT, () => {
    console.log(`🚀 HTTP Server running on http://localhost:${PORT}`);
    console.log(`📝 Whisper transcription service ready`);
    console.log(`🤖 Ollama LLM service ready`);
    console.log(`⚠️  Note: Microphone access requires HTTPS`);
  });
  return server;
}

// Function to start HTTPS server
function startHTTPSServer() {
  const certPath = path.join(__dirname, '../ssl-certs/server.crt');
  const keyPath = path.join(__dirname, '../ssl-certs/server.key');
  
  try {
    const options = {
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath)
    };
    
    const server = https.createServer(options, app);
    server.listen(HTTPS_PORT, () => {
      console.log(`🔒 HTTPS Server running on https://localhost:${HTTPS_PORT}`);
      console.log(`📝 Whisper transcription service ready`);
      console.log(`🤖 Ollama LLM service ready`);
      console.log(`🎤 Microphone access enabled via HTTPS`);
    });
    return server;
  } catch (error) {
    console.error('Failed to start HTTPS server:', error);
    return null;
  }
}

// Start servers based on SSL certificate availability
if (checkSSLCertificates()) {
  console.log('🔒 SSL certificates found, starting HTTPS server...');
  const httpsServer = startHTTPSServer();
  
  if (httpsServer) {
    // Also start HTTP server for fallback
    startHTTPServer();
  } else {
    console.log('⚠️  HTTPS server failed to start, falling back to HTTP only');
    startHTTPServer();
  }
} else {
  console.log('⚠️  No SSL certificates found, starting HTTP server only');
  console.log('   Run the setup script with SSL option to enable microphone access');
  startHTTPServer();
}