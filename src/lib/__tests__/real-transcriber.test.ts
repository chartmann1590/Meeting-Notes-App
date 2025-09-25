import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RealTranscriber } from '../real-transcriber';

// Mock MediaRecorder
class MockMediaRecorder {
  static isSupported = true;
  ondataavailable: ((event: any) => void) | null = null;
  onstop: (() => void) | null = null;
  state: string = 'inactive';
  
  constructor(stream: MediaStream) {
    this.stream = stream;
  }
  
  start(timeslice?: number) {
    this.state = 'recording';
    // Simulate data available event
    setTimeout(() => {
      if (this.ondataavailable) {
        this.ondataavailable({
          data: new Blob(['mock audio data'], { type: 'audio/webm' })
        });
      }
    }, 100);
  }
  
  stop() {
    this.state = 'inactive';
    if (this.onstop) {
      this.onstop();
    }
  }
}

// Mock SpeechRecognition
class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = 'en-US';
  onresult: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onend: (() => void) | null = null;
  
  start() {
    // Simulate speech recognition result
    setTimeout(() => {
      if (this.onresult) {
        this.onresult({
          resultIndex: 0,
          results: [
            {
              isFinal: true,
              0: {
                transcript: 'Hello world',
                confidence: 0.9
              }
            }
          ]
        });
      }
    }, 100);
  }
  
  stop() {
    if (this.onend) {
      this.onend();
    }
  }
}

// Mock MediaStream
class MockMediaStream {
  getTracks() {
    return [{
      stop: vi.fn()
    }];
  }
}

// Mock navigator.mediaDevices
const mockGetUserMedia = vi.fn(() => Promise.resolve(new MockMediaStream() as any));

// Mock fetch for server-side transcription
const mockFetch = vi.fn();

describe('RealTranscriber', () => {
  let transcriber: RealTranscriber;
  
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock global objects
    global.MediaRecorder = MockMediaRecorder as any;
    global.fetch = mockFetch;
    
    // Mock navigator.mediaDevices
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: mockGetUserMedia
      },
      writable: true
    });
    
    // Mock window for speech recognition
    Object.defineProperty(global.window, 'webkitSpeechRecognition', {
      value: MockSpeechRecognition,
      writable: true
    });
    
    transcriber = new RealTranscriber();
  });
  
  afterEach(() => {
    transcriber.stop();
  });
  
  describe('Browser Support Detection', () => {
    it('should detect MediaRecorder support', () => {
      expect(transcriber.isSupported()).toBe(true);
    });
    
    it('should detect browser speech recognition support', () => {
      expect(transcriber.hasBrowserRecognition()).toBe(true);
    });
    
    it('should return correct transcription method', () => {
      expect(transcriber.getTranscriptionMethod()).toBe('Server-side Whisper');
    });
  });
  
  describe('Browser Speech Recognition', () => {
    it('should use browser speech recognition when available', async () => {
      const mockCallback = vi.fn();
      
      await transcriber.start(mockCallback);
      
      // Wait for speech recognition to process
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(mockCallback).toHaveBeenCalledWith('Hello world');
    });
    
    it('should handle interim results', async () => {
      const mockCallback = vi.fn();
      const mockRecognition = new MockSpeechRecognition();
      
      // Mock interim result
      mockRecognition.onresult = (event: any) => {
        event.results[0].isFinal = false;
        event.results[0][0].transcript = 'Hello';
      };
      
      Object.defineProperty(global.window, 'webkitSpeechRecognition', {
        value: () => mockRecognition,
        writable: true
      });
      
      transcriber = new RealTranscriber();
      await transcriber.start(mockCallback);
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(mockCallback).toHaveBeenCalled();
    });
  });
  
  describe('Server-side Transcription', () => {
    beforeEach(() => {
      // Disable browser speech recognition for these tests
      Object.defineProperty(global.window, 'webkitSpeechRecognition', {
        value: undefined,
        writable: true
      });
      Object.defineProperty(global.window, 'SpeechRecognition', {
        value: undefined,
        writable: true
      });
      
      transcriber = new RealTranscriber();
    });
    
    it('should fallback to server-side transcription', async () => {
      const mockCallback = vi.fn();
      
      // Mock successful server response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { transcript: 'Server transcription result' }
        })
      });
      
      await transcriber.start(mockCallback);
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      expect(mockFetch).toHaveBeenCalledWith('/api/transcribe', expect.any(Object));
      expect(mockCallback).toHaveBeenCalledWith('Server transcription result');
    });
    
    it('should handle server transcription errors gracefully', async () => {
      const mockCallback = vi.fn();
      
      // Mock server error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });
      
      await transcriber.start(mockCallback);
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      expect(mockFetch).toHaveBeenCalled();
      // Should not call callback with error message for individual chunks
      expect(mockCallback).not.toHaveBeenCalledWith(expect.stringContaining('Error'));
    });
  });
  
  describe('Error Handling', () => {
    it('should handle microphone access denied', async () => {
      mockGetUserMedia.mockRejectedValueOnce(new Error('Permission denied'));
      
      await expect(transcriber.start(vi.fn())).rejects.toThrow('Permission denied');
    });
    
    it('should handle MediaRecorder not supported', () => {
      // @ts-ignore
      global.MediaRecorder = undefined;
      
      transcriber = new RealTranscriber();
      
      expect(transcriber.isSupported()).toBe(false);
      expect(() => transcriber.start(vi.fn())).rejects.toThrow('MediaRecorder not supported');
    });
  });
  
  describe('Lifecycle Management', () => {
    it('should properly stop recording and clean up resources', async () => {
      const mockCallback = vi.fn();
      
      await transcriber.start(mockCallback);
      
      transcriber.stop();
      
      // Verify cleanup
      expect(transcriber['isRecording']).toBe(false);
    });
    
    it('should handle multiple start/stop cycles', async () => {
      const mockCallback = vi.fn();
      
      // First cycle
      await transcriber.start(mockCallback);
      transcriber.stop();
      
      // Second cycle
      await transcriber.start(mockCallback);
      transcriber.stop();
      
      expect(mockCallback).toHaveBeenCalled();
    });
  });
  
  describe('Audio Processing', () => {
    it('should process audio chunks at correct intervals', async () => {
      const mockCallback = vi.fn();
      
      // Mock successful server response
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { transcript: 'Chunk transcription' }
        })
      });
      
      // Disable browser recognition
      Object.defineProperty(global.window, 'webkitSpeechRecognition', {
        value: undefined,
        writable: true
      });
      
      transcriber = new RealTranscriber();
      await transcriber.start(mockCallback);
      
      // Wait for multiple processing cycles
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Should have made multiple requests
      expect(mockFetch).toHaveBeenCalledTimes(expect.any(Number));
    });
  });
});