import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RealTranscriber } from '../real-transcriber';

// Controllable fakes for the browser APIs RealTranscriber depends on.
class MockMediaRecorder {
  static instances: MockMediaRecorder[] = [];
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  state = 'inactive';
  timeslice?: number;

  constructor(public stream: MediaStream) {
    MockMediaRecorder.instances.push(this);
  }

  start(timeslice?: number) {
    this.timeslice = timeslice;
    this.state = 'recording';
  }

  stop() {
    this.state = 'inactive';
    this.onstop?.();
  }

  emitData(bytes: number) {
    this.ondataavailable?.({ data: new Blob([new Uint8Array(bytes)], { type: 'audio/webm' }) });
  }
}

class MockSpeechRecognition {
  static instances: MockSpeechRecognition[] = [];
  continuous = false;
  interimResults = false;
  lang = '';
  onresult: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();

  constructor() {
    MockSpeechRecognition.instances.push(this);
  }

  emitResult(transcript: string, isFinal: boolean) {
    this.onresult?.({ resultIndex: 0, results: [{ isFinal, 0: { transcript, confidence: 0.9 } }] });
  }
}

const trackStop = vi.fn();
const mockGetUserMedia = vi.fn();
const mockFetch = vi.fn();

const okResponse = (transcript: string) => ({
  ok: true,
  json: () => Promise.resolve({ success: true, data: { transcript } }),
});

function setSpeechRecognition(available: boolean) {
  vi.stubGlobal('SpeechRecognition', available ? MockSpeechRecognition : undefined);
  vi.stubGlobal('webkitSpeechRecognition', available ? MockSpeechRecognition : undefined);
  if (!available) {
    // RealTranscriber checks `'SpeechRecognition' in window`, so the keys must be gone
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;
  }
}

describe('RealTranscriber', () => {
  let transcriber: RealTranscriber;

  beforeEach(() => {
    vi.useFakeTimers();
    MockMediaRecorder.instances = [];
    MockSpeechRecognition.instances = [];
    trackStop.mockReset();
    mockFetch.mockReset();
    mockGetUserMedia.mockReset();
    mockGetUserMedia.mockResolvedValue({ getTracks: () => [{ stop: trackStop }] });

    vi.stubGlobal('MediaRecorder', MockMediaRecorder);
    vi.stubGlobal('fetch', mockFetch);
    (navigator as any).mediaDevices = { getUserMedia: mockGetUserMedia };
    setSpeechRecognition(true);
    transcriber = new RealTranscriber();
  });

  afterEach(() => {
    transcriber.stop();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  describe('Browser Support Detection', () => {
    it('should detect MediaRecorder support', () => {
      expect(transcriber.isSupported()).toBe(true);
    });

    it('should detect browser speech recognition support', () => {
      expect(transcriber.hasBrowserRecognition()).toBe(true);
      const recognition = MockSpeechRecognition.instances[0];
      expect(recognition.continuous).toBe(true);
      expect(recognition.interimResults).toBe(true);
      expect(recognition.lang).toBe('en-US');
    });

    it('should return correct transcription method', async () => {
      // Before starting nothing has been chosen yet, so it reports the server default
      expect(transcriber.getTranscriptionMethod()).toBe('Server-side Whisper');
      await transcriber.start(vi.fn());
      expect(transcriber.getTranscriptionMethod()).toBe('Browser Speech Recognition');
    });
  });

  describe('Browser Speech Recognition', () => {
    it('should use browser speech recognition when available', async () => {
      const callback = vi.fn();
      await transcriber.start(callback);

      const recognition = MockSpeechRecognition.instances[0];
      expect(recognition.start).toHaveBeenCalled();
      expect(MockMediaRecorder.instances).toHaveLength(0);

      recognition.emitResult('Hello world', true);
      expect(callback).toHaveBeenLastCalledWith('Hello world');

      recognition.emitResult('how are you', true);
      expect(callback).toHaveBeenLastCalledWith('Hello world how are you');
    });

    it('should handle interim results', async () => {
      const callback = vi.fn();
      await transcriber.start(callback);
      const recognition = MockSpeechRecognition.instances[0];

      recognition.emitResult('Hello', false);
      expect(callback).toHaveBeenLastCalledWith('Hello');

      recognition.emitResult('Hello world', true);
      recognition.emitResult('and', false);
      expect(callback).toHaveBeenLastCalledWith('Hello world and');
    });

    it('should restart recognition when it ends while still recording', async () => {
      await transcriber.start(vi.fn());
      const recognition = MockSpeechRecognition.instances[0];
      expect(recognition.start).toHaveBeenCalledTimes(1);

      recognition.onend?.();
      vi.advanceTimersByTime(100);
      expect(recognition.start).toHaveBeenCalledTimes(2);

      transcriber.stop();
      recognition.onend?.();
      vi.advanceTimersByTime(100);
      expect(recognition.start).toHaveBeenCalledTimes(2);
    });

    it('should report recognition errors in the transcript, but ignore no-speech', async () => {
      const callback = vi.fn();
      await transcriber.start(callback);
      const recognition = MockSpeechRecognition.instances[0];

      recognition.onerror?.({ error: 'no-speech' });
      expect(callback).not.toHaveBeenCalled();

      recognition.onerror?.({ error: 'not-allowed' });
      expect(callback).toHaveBeenLastCalledWith(expect.stringContaining('[Microphone access denied]'));
    });
  });

  describe('Server-side Transcription', () => {
    beforeEach(() => {
      setSpeechRecognition(false);
      transcriber = new RealTranscriber();
    });

    it('should fallback to server-side transcription', async () => {
      const callback = vi.fn();
      mockFetch.mockResolvedValue(okResponse('Server transcription result'));

      await transcriber.start(callback);
      expect(transcriber.hasBrowserRecognition()).toBe(false);
      expect(transcriber.getTranscriptionMethod()).toBe('Server-side Whisper');

      const recorder = MockMediaRecorder.instances[0];
      expect(recorder.timeslice).toBe(2000);
      recorder.emitData(2000);

      await vi.advanceTimersByTimeAsync(3000);

      expect(mockFetch).toHaveBeenCalledWith('/api/transcribe', expect.objectContaining({ method: 'POST' }));
      const body = mockFetch.mock.calls[0][1].body as FormData;
      expect(body.get('audio')).toBeInstanceOf(Blob);
      expect(callback).toHaveBeenCalledWith('Server transcription result');
    });

    it('should skip chunks too small to contain speech', async () => {
      await transcriber.start(vi.fn());
      MockMediaRecorder.instances[0].emitData(500);

      await vi.advanceTimersByTimeAsync(3000);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle server transcription errors gracefully', async () => {
      const callback = vi.fn();
      mockFetch.mockResolvedValue({ ok: false, status: 500 });

      await transcriber.start(callback);
      MockMediaRecorder.instances[0].emitData(2000);

      // Individual chunk failures are retried quietly...
      await vi.advanceTimersByTimeAsync(3000);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(callback).not.toHaveBeenCalled();

      // ...and only after repeated failures does the user see a notice (never an "Error:" string)
      await vi.advanceTimersByTimeAsync(6000);
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(callback).toHaveBeenLastCalledWith(expect.stringContaining('[Transcription temporarily unavailable]'));
      expect(callback).not.toHaveBeenCalledWith(expect.stringContaining('Error'));
    });

    it('should transcribe the whole recording when stopped', async () => {
      const callback = vi.fn();
      await transcriber.start(callback);
      MockMediaRecorder.instances[0].emitData(2000);

      mockFetch.mockResolvedValueOnce(okResponse('The full meeting transcript'));
      transcriber.stop();
      await vi.runAllTimersAsync();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenLastCalledWith('The full meeting transcript');
    });
  });

  describe('Final pass', () => {
    it('should keep the live transcript when the final pass comes back empty', async () => {
      setSpeechRecognition(false);
      transcriber = new RealTranscriber();
      const callback = vi.fn();
      await transcriber.start(callback);
      MockMediaRecorder.instances[0].emitData(2000);

      mockFetch.mockResolvedValueOnce(okResponse('Live text'));
      await vi.advanceTimersByTimeAsync(3000);
      expect(callback).toHaveBeenLastCalledWith('Live text');

      mockFetch.mockResolvedValueOnce(okResponse(''));
      transcriber.stop();
      await vi.runAllTimersAsync();
      expect(callback).toHaveBeenLastCalledWith('Live text');
      expect(callback).not.toHaveBeenCalledWith(expect.stringContaining('Error'));
    });
  });

  describe('Error Handling', () => {
    it('should handle microphone access denied', async () => {
      mockGetUserMedia.mockRejectedValueOnce(new Error('Permission denied'));

      await expect(transcriber.start(vi.fn())).rejects.toThrow('Permission denied');
    });

    it('should handle MediaRecorder not supported', async () => {
      vi.stubGlobal('MediaRecorder', undefined);

      transcriber = new RealTranscriber();

      expect(transcriber.isSupported()).toBe(false);
      await expect(transcriber.start(vi.fn())).rejects.toThrow('MediaRecorder not supported');
    });
  });

  describe('Lifecycle Management', () => {
    it('should properly stop recording and clean up resources', async () => {
      await transcriber.start(vi.fn());
      const recognition = MockSpeechRecognition.instances[0];

      transcriber.stop();

      expect(transcriber['isRecording']).toBe(false);
      expect(recognition.stop).toHaveBeenCalled();
      expect(trackStop).toHaveBeenCalled();
    });

    it('should handle multiple start/stop cycles', async () => {
      setSpeechRecognition(false);
      transcriber = new RealTranscriber();
      mockFetch.mockImplementation(() => Promise.resolve(okResponse(`chunk ${mockFetch.mock.calls.length}`)));
      const callback = vi.fn();

      // First cycle: two chunks get processed
      await transcriber.start(callback);
      MockMediaRecorder.instances[0].emitData(2000);
      MockMediaRecorder.instances[0].emitData(2000);
      await vi.advanceTimersByTimeAsync(3000);
      transcriber.stop();
      await vi.runAllTimersAsync();
      const callsAfterFirstCycle = mockFetch.mock.calls.length;

      // Second cycle: its first chunk must be transcribed too
      await transcriber.start(callback);
      MockMediaRecorder.instances[1].emitData(2000);
      await vi.advanceTimersByTimeAsync(3000);

      expect(mockFetch.mock.calls.length).toBe(callsAfterFirstCycle + 1);
      expect(callback).toHaveBeenLastCalledWith(`chunk ${callsAfterFirstCycle + 1}`);
    });
  });

  describe('Audio Processing', () => {
    it('should process audio chunks at correct intervals', async () => {
      setSpeechRecognition(false);
      transcriber = new RealTranscriber();
      mockFetch.mockResolvedValue(okResponse('Chunk transcription'));
      await transcriber.start(vi.fn());
      const recorder = MockMediaRecorder.instances[0];

      recorder.emitData(2000);
      await vi.advanceTimersByTimeAsync(2999);
      expect(mockFetch).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Nothing new recorded: the next tick sends nothing
      await vi.advanceTimersByTimeAsync(3000);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // New audio: picked up on the following tick
      recorder.emitData(2000);
      await vi.advanceTimersByTimeAsync(3000);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // After stop, the interval no longer fires
      transcriber.stop();
      await vi.runAllTimersAsync();
      const calls = mockFetch.mock.calls.length;
      recorder.emitData(2000);
      await vi.advanceTimersByTimeAsync(9000);
      expect(mockFetch).toHaveBeenCalledTimes(calls);
    });
  });
});
