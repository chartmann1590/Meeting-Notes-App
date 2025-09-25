import '@testing-library/jest-dom';

// Mock MediaRecorder
global.MediaRecorder = class MockMediaRecorder {
  static isSupported = true;
  ondataavailable: ((event: any) => void) | null = null;
  onstop: (() => void) | null = null;
  state: string = 'inactive';
  
  constructor(stream: MediaStream) {
    this.stream = stream;
  }
  
  start(timeslice?: number) {
    this.state = 'recording';
  }
  
  stop() {
    this.state = 'inactive';
    if (this.onstop) {
      this.onstop();
    }
  }
} as any;

// Mock SpeechRecognition
global.SpeechRecognition = class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = 'en-US';
  onresult: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onend: (() => void) | null = null;
  
  start() {}
  stop() {}
} as any;

global.webkitSpeechRecognition = global.SpeechRecognition;

// Mock navigator.mediaDevices
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn(() => Promise.resolve({
      getTracks: () => [{
        stop: vi.fn()
      }]
    }))
  },
  writable: true
});

// Mock fetch
global.fetch = vi.fn();

// Mock crypto for UUID generation
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-123'
  },
  writable: true
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};