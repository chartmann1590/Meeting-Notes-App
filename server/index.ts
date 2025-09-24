import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import https from 'https';
import http from 'http';
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

// Transcribe audio endpoint
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No audio file provided'
      });
    }

    console.log('Transcribing audio file:', req.file.filename);
    const transcript = await transcribeAudio(req.file.path);
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    res.json({
      success: true,
      data: { transcript }
    });
  } catch (error) {
    console.error('Transcription error:', error);
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