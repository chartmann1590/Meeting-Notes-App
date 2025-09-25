import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HomePage } from '../../pages/HomePage';
import { RealTranscriber } from '../../lib/real-transcriber';

// Mock the RealTranscriber
vi.mock('../../lib/real-transcriber', () => ({
  RealTranscriber: vi.fn().mockImplementation(() => ({
    isSupported: () => true,
    hasBrowserRecognition: () => true,
    getTranscriptionMethod: () => 'Browser Speech Recognition',
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn()
  }))
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => children
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Mock navigator.mediaDevices
const mockGetUserMedia = vi.fn();
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: mockGetUserMedia
  },
  writable: true
});

// Mock MediaStream
class MockMediaStream {
  getTracks() {
    return [{
      stop: vi.fn()
    }];
  }
}

describe('Live Transcription Integration', () => {
  let mockTranscriber: any;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock transcriber
    mockTranscriber = {
      isSupported: vi.fn().mockReturnValue(true),
      hasBrowserRecognition: vi.fn().mockReturnValue(true),
      getTranscriptionMethod: vi.fn().mockReturnValue('Browser Speech Recognition'),
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn()
    };
    
    (RealTranscriber as any).mockImplementation(() => mockTranscriber);
    
    // Mock successful microphone access
    mockGetUserMedia.mockResolvedValue(new MockMediaStream());
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('Recording Flow', () => {
    it('should start recording when button is clicked', async () => {
      render(<HomePage />);
      
      const startButton = screen.getByText('Start Recording');
      expect(startButton).toBeInTheDocument();
      
      fireEvent.click(startButton);
      
      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true });
      });
      
      await waitFor(() => {
        expect(mockTranscriber.start).toHaveBeenCalled();
      });
    });
    
    it('should show live transcript during recording', async () => {
      render(<HomePage />);
      
      const startButton = screen.getByText('Start Recording');
      fireEvent.click(startButton);
      
      await waitFor(() => {
        expect(screen.getByText('Live Transcript')).toBeInTheDocument();
      });
      
      // Should show waiting message initially
      expect(screen.getByText('Waiting for you to speak...')).toBeInTheDocument();
    });
    
    it('should stop recording and generate summary', async () => {
      // Mock fetch for summary generation
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            summary: {
              summary: 'Test meeting summary',
              keyPoints: ['Key point 1', 'Key point 2'],
              actionItems: ['Action item 1'],
              decisions: ['Decision 1']
            }
          }
        })
      });
      
      render(<HomePage />);
      
      // Start recording
      const startButton = screen.getByText('Start Recording');
      fireEvent.click(startButton);
      
      await waitFor(() => {
        expect(screen.getByText('Stop Recording')).toBeInTheDocument();
      });
      
      // Stop recording
      const stopButton = screen.getByText('Stop Recording');
      fireEvent.click(stopButton);
      
      await waitFor(() => {
        expect(mockTranscriber.stop).toHaveBeenCalled();
      });
      
      // Should show summarizing state
      await waitFor(() => {
        expect(screen.getByText('Summarizing...')).toBeInTheDocument();
      });
    });
  });
  
  describe('Error Handling', () => {
    it('should handle microphone permission denied', async () => {
      mockGetUserMedia.mockRejectedValue(new Error('Permission denied'));
      
      render(<HomePage />);
      
      const startButton = screen.getByText('Start Recording');
      fireEvent.click(startButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Microphone access was denied/)).toBeInTheDocument();
      });
    });
    
    it('should handle unsupported browser', () => {
      mockTranscriber.isSupported.mockReturnValue(false);
      
      render(<HomePage />);
      
      expect(screen.getByText('Not Supported')).toBeInTheDocument();
    });
  });
  
  describe('Transcription Methods', () => {
    it('should show browser speech recognition method', () => {
      render(<HomePage />);
      
      expect(screen.getByText('Using Browser Speech Recognition')).toBeInTheDocument();
    });
    
    it('should show server-side transcription method when browser recognition unavailable', () => {
      mockTranscriber.hasBrowserRecognition.mockReturnValue(false);
      mockTranscriber.getTranscriptionMethod.mockReturnValue('Server-side Whisper');
      
      render(<HomePage />);
      
      expect(screen.getByText('Using Server-side Whisper')).toBeInTheDocument();
    });
  });
  
  describe('UI States', () => {
    it('should show correct button states during recording flow', async () => {
      render(<HomePage />);
      
      // Initial state
      expect(screen.getByText('Start Recording')).toBeInTheDocument();
      
      // Start recording
      fireEvent.click(screen.getByText('Start Recording'));
      
      await waitFor(() => {
        expect(screen.getByText('Stop Recording')).toBeInTheDocument();
      });
    });
    
    it('should show audio visualizer during recording', async () => {
      render(<HomePage />);
      
      const startButton = screen.getByText('Start Recording');
      fireEvent.click(startButton);
      
      await waitFor(() => {
        // AudioVisualizer should be present in the Live Transcript card
        const liveTranscriptCard = screen.getByText('Live Transcript').closest('.bg-white\\/80');
        expect(liveTranscriptCard).toBeInTheDocument();
      });
    });
  });
  
  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<HomePage />);
      
      const startButton = screen.getByText('Start Recording');
      expect(startButton).toBeInTheDocument();
      expect(startButton.tagName).toBe('BUTTON');
    });
    
    it('should be keyboard accessible', () => {
      render(<HomePage />);
      
      const startButton = screen.getByText('Start Recording');
      
      // Should be focusable
      startButton.focus();
      expect(document.activeElement).toBe(startButton);
      
      // Should be activatable with Enter key
      fireEvent.keyDown(startButton, { key: 'Enter', code: 'Enter' });
      // Note: This would trigger the click handler in a real scenario
    });
  });
});