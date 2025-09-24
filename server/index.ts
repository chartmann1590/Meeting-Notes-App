import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { transcribeAudio } from './services/whisper.js';
import { generateSummary } from './services/ollama.js';
import { MeetingRecord, Summary } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

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

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Whisper transcription service ready`);
  console.log(`🤖 Ollama LLM service ready`);
});