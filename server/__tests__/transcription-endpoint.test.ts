import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import multer from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { transcribeAudio } from '../services/whisper.js';

// Mock the whisper service
vi.mock('../services/whisper.js', () => ({
  transcribeAudio: vi.fn()
}));

// Mock fs
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  unlinkSync: vi.fn()
}));

// Mock multer
vi.mock('multer', () => ({
  default: {
    diskStorage: vi.fn(() => ({})),
    limits: vi.fn(() => ({})),
    single: vi.fn(() => (req: any, res: any, next: any) => {
      // Mock file upload
      req.file = {
        filename: 'test-audio.webm',
        path: '/tmp/test-audio.webm',
        size: 1024,
        originalname: 'test-audio.webm'
      };
      next();
    })
  }
}));

describe('Transcription Endpoint', () => {
  let app: express.Application;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create a test Express app
    app = express();
    app.use(express.json());
    
    // Mock the transcription endpoint
    app.post('/api/transcribe', (req, res) => {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No audio file provided'
        });
      }
      
      // Mock transcription
      transcribeAudio(req.file.path)
        .then(transcript => {
          // Mock file cleanup
          fs.unlinkSync(req.file.path);
          
          res.json({
            success: true,
            data: { transcript }
          });
        })
        .catch(error => {
          res.status(500).json({
            success: false,
            error: 'Failed to transcribe audio'
          });
        });
    });
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('POST /api/transcribe', () => {
    it('should successfully transcribe audio file', async () => {
      const mockTranscript = 'This is a test transcription of the audio file.';
      (transcribeAudio as any).mockResolvedValue(mockTranscript);
      
      const response = await request(app)
        .post('/api/transcribe')
        .attach('audio', Buffer.from('mock audio data'), 'test-audio.webm');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: { transcript: mockTranscript }
      });
      
      expect(transcribeAudio).toHaveBeenCalledWith('/tmp/test-audio.webm');
      expect(fs.unlinkSync).toHaveBeenCalledWith('/tmp/test-audio.webm');
    });
    
    it('should handle missing audio file', async () => {
      // Mock multer to not provide a file
      const appWithoutFile = express();
      appWithoutFile.use(express.json());
      appWithoutFile.post('/api/transcribe', (req, res) => {
        if (!req.file) {
          return res.status(400).json({
            success: false,
            error: 'No audio file provided'
          });
        }
      });
      
      const response = await request(appWithoutFile)
        .post('/api/transcribe');
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: 'No audio file provided'
      });
    });
    
    it('should handle transcription errors', async () => {
      (transcribeAudio as any).mockRejectedValue(new Error('Transcription failed'));
      
      const response = await request(app)
        .post('/api/transcribe')
        .attach('audio', Buffer.from('mock audio data'), 'test-audio.webm');
      
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: 'Failed to transcribe audio'
      });
    });
    
    it('should handle different audio file formats', async () => {
      const mockTranscript = 'Transcription of different format.';
      (transcribeAudio as any).mockResolvedValue(mockTranscript);
      
      const formats = ['audio.webm', 'audio.mp3', 'audio.wav', 'audio.m4a'];
      
      for (const format of formats) {
        const response = await request(app)
          .post('/api/transcribe')
          .attach('audio', Buffer.from('mock audio data'), format);
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }
    });
    
    it('should handle large audio files', async () => {
      const mockTranscript = 'Transcription of large audio file.';
      (transcribeAudio as any).mockResolvedValue(mockTranscript);
      
      // Create a larger buffer to simulate a large file
      const largeBuffer = Buffer.alloc(10 * 1024 * 1024); // 10MB
      
      const response = await request(app)
        .post('/api/transcribe')
        .attach('audio', largeBuffer, 'large-audio.webm');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    it('should clean up temporary files after processing', async () => {
      const mockTranscript = 'Test transcription.';
      (transcribeAudio as any).mockResolvedValue(mockTranscript);
      
      await request(app)
        .post('/api/transcribe')
        .attach('audio', Buffer.from('mock audio data'), 'test-audio.webm');
      
      expect(fs.unlinkSync).toHaveBeenCalledWith('/tmp/test-audio.webm');
    });
    
    it('should handle file cleanup errors gracefully', async () => {
      const mockTranscript = 'Test transcription.';
      (transcribeAudio as any).mockResolvedValue(mockTranscript);
      (fs.unlinkSync as any).mockImplementation(() => {
        throw new Error('File cleanup failed');
      });
      
      // Should still return success even if cleanup fails
      const response = await request(app)
        .post('/api/transcribe')
        .attach('audio', Buffer.from('mock audio data'), 'test-audio.webm');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
  
  describe('Live Transcription Specific Tests', () => {
    it('should handle rapid successive requests (simulating live transcription)', async () => {
      const mockTranscripts = [
        'First chunk transcription.',
        'Second chunk transcription.',
        'Third chunk transcription.'
      ];
      
      let callCount = 0;
      (transcribeAudio as any).mockImplementation(() => {
        return Promise.resolve(mockTranscripts[callCount++]);
      });
      
      // Send multiple requests rapidly
      const promises = mockTranscripts.map((_, index) => 
        request(app)
          .post('/api/transcribe')
          .attach('audio', Buffer.from(`chunk-${index}`), `chunk-${index}.webm`)
      );
      
      const responses = await Promise.all(promises);
      
      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.body.data.transcript).toBe(mockTranscripts[index]);
      });
    });
    
    it('should handle empty audio chunks gracefully', async () => {
      (transcribeAudio as any).mockResolvedValue('');
      
      const response = await request(app)
        .post('/api/transcribe')
        .attach('audio', Buffer.alloc(0), 'empty-audio.webm');
      
      expect(response.status).toBe(200);
      expect(response.body.data.transcript).toBe('');
    });
    
    it('should handle very short audio chunks', async () => {
      const mockTranscript = 'Short audio.';
      (transcribeAudio as any).mockResolvedValue(mockTranscript);
      
      const response = await request(app)
        .post('/api/transcribe')
        .attach('audio', Buffer.from('short'), 'short-audio.webm');
      
      expect(response.status).toBe(200);
      expect(response.body.data.transcript).toBe(mockTranscript);
    });
  });
});