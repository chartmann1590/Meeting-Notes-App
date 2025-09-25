import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { transcribeAudio } from '../services/whisper.js';
import * as fs from 'fs';

// Mock fs module
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  existsSync: vi.fn()
}));

// Mock fetch
const mockFetch = vi.fn();

describe('Whisper Transcription Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('transcribeAudio', () => {
    it('should successfully transcribe audio using Ollama Whisper', async () => {
      const mockAudioBuffer = Buffer.from('mock audio data');
      const mockBase64 = mockAudioBuffer.toString('base64');
      
      // Mock file system
      (fs.readFileSync as any).mockReturnValue(mockAudioBuffer);
      
      // Mock successful Ollama response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          response: 'This is the transcribed text from the audio file.'
        })
      });
      
      const result = await transcribeAudio('/path/to/audio.webm');
      
      expect(result).toBe('This is the transcribed text from the audio file.');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/generate',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: expect.stringContaining('whisper')
        })
      );
    });
    
    it('should handle Ollama API errors gracefully', async () => {
      const mockAudioBuffer = Buffer.from('mock audio data');
      
      (fs.readFileSync as any).mockReturnValue(mockAudioBuffer);
      
      // Mock API error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('Model not found')
      });
      
      await expect(transcribeAudio('/path/to/audio.webm')).rejects.toThrow('Whisper API error: 500 Internal Server Error');
    });
    
    it('should handle network errors and use fallback', async () => {
      const mockAudioBuffer = Buffer.from('mock audio data');
      
      (fs.readFileSync as any).mockReturnValue(mockAudioBuffer);
      
      // Mock network error
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      const result = await transcribeAudio('/path/to/audio.webm');
      
      expect(result).toContain('Transcription service is not available');
    });
    
    it('should handle 404 errors with fallback', async () => {
      const mockAudioBuffer = Buffer.from('mock audio data');
      
      (fs.readFileSync as any).mockReturnValue(mockAudioBuffer);
      
      // Mock 404 error (model not found)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: () => Promise.resolve('Model not found')
      });
      
      const result = await transcribeAudio('/path/to/audio.webm');
      
      expect(result).toContain('Transcription service is not available');
    });
    
    it('should handle invalid response format', async () => {
      const mockAudioBuffer = Buffer.from('mock audio data');
      
      (fs.readFileSync as any).mockReturnValue(mockAudioBuffer);
      
      // Mock response without expected format
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          // Missing 'response' field
          error: 'Invalid response format'
        })
      });
      
      await expect(transcribeAudio('/path/to/audio.webm')).rejects.toThrow('No transcription result received from Whisper API');
    });
    
    it('should use correct Ollama API parameters', async () => {
      const mockAudioBuffer = Buffer.from('mock audio data');
      
      (fs.readFileSync as any).mockReturnValue(mockAudioBuffer);
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          response: 'Test transcription'
        })
      });
      
      await transcribeAudio('/path/to/audio.webm');
      
      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      
      expect(requestBody).toMatchObject({
        model: 'whisper',
        prompt: expect.stringContaining('Transcribe the following audio'),
        stream: false,
        context: [],
        options: {
          temperature: 0.0,
          top_p: 0.9,
          top_k: 40,
          repeat_penalty: 1.1,
          num_ctx: 2048
        },
        audio: expect.any(String)
      });
    });
    
    it('should handle environment variable configuration', async () => {
      const originalEnv = process.env.WHISPER_API_URL;
      const originalModel = process.env.WHISPER_MODEL;
      
      try {
        // Set custom environment variables
        process.env.WHISPER_API_URL = 'http://custom-ollama:11434/api/generate';
        process.env.WHISPER_MODEL = 'custom-whisper';
        
        const mockAudioBuffer = Buffer.from('mock audio data');
        (fs.readFileSync as any).mockReturnValue(mockAudioBuffer);
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            response: 'Custom configuration test'
          })
        });
        
        await transcribeAudio('/path/to/audio.webm');
        
        expect(mockFetch).toHaveBeenCalledWith(
          'http://custom-ollama:11434/api/generate',
          expect.any(Object)
        );
        
        const callArgs = mockFetch.mock.calls[0];
        const requestBody = JSON.parse(callArgs[1].body);
        expect(requestBody.model).toBe('custom-whisper');
        
      } finally {
        // Restore original environment
        if (originalEnv) {
          process.env.WHISPER_API_URL = originalEnv;
        } else {
          delete process.env.WHISPER_API_URL;
        }
        
        if (originalModel) {
          process.env.WHISPER_MODEL = originalModel;
        } else {
          delete process.env.WHISPER_MODEL;
        }
      }
    });
  });
  
  describe('Error Handling', () => {
    it('should handle file read errors', async () => {
      (fs.readFileSync as any).mockImplementation(() => {
        throw new Error('File not found');
      });
      
      await expect(transcribeAudio('/nonexistent/audio.webm')).rejects.toThrow('File not found');
    });
    
    it('should handle malformed audio data', async () => {
      const mockAudioBuffer = Buffer.from('invalid audio data');
      
      (fs.readFileSync as any).mockReturnValue(mockAudioBuffer);
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          response: ''
        })
      });
      
      const result = await transcribeAudio('/path/to/audio.webm');
      
      expect(result).toBe('');
    });
  });
});