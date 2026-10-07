import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// These tests exercise the real /api/transcribe route from server/index.ts
// (real multer upload, real file cleanup). Only the external services are mocked.
vi.mock('../services/whisper.js', () => ({
  transcribeAudio: vi.fn(),
}));
vi.mock('../services/ollama.js', () => ({
  generateSummary: vi.fn(),
}));

// Wrap unlinkSync so a test can make cleanup fail; it calls the real one by default.
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  const unlinkSync = vi.fn((p: fs.PathLike) => actual.unlinkSync(p));
  return { ...actual, default: { ...actual, unlinkSync }, unlinkSync };
});

const uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mna-uploads-'));
process.env.UPLOAD_DIR = uploadDir;

const { app } = await import('../index.js');
const { transcribeAudio } = await import('../services/whisper.js');
const mockTranscribe = vi.mocked(transcribeAudio);

const uploadedFiles = () => fs.readdirSync(uploadDir);

describe('Transcription Endpoint', () => {
  beforeAll(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  beforeEach(() => {
    mockTranscribe.mockReset();
    vi.mocked(fs.unlinkSync).mockClear();
    for (const f of uploadedFiles()) fs.rmSync(path.join(uploadDir, f));
  });

  afterAll(() => {
    fs.rmSync(uploadDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  describe('POST /api/transcribe', () => {
    it('should successfully transcribe audio file', async () => {
      const mockTranscript = 'This is a test transcription of the audio file.';
      mockTranscribe.mockResolvedValue(mockTranscript);

      const response = await request(app)
        .post('/api/transcribe')
        .attach('audio', Buffer.from('mock audio data'), 'test-audio.webm');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: { transcript: mockTranscript },
      });

      // The uploaded file was handed to Whisper from the upload directory
      expect(mockTranscribe).toHaveBeenCalledTimes(1);
      const filePath = mockTranscribe.mock.calls[0][0];
      expect(path.dirname(filePath)).toBe(uploadDir);
      expect(path.basename(filePath)).toMatch(/-test-audio\.webm$/);
    });

    it('should handle missing audio file', async () => {
      const response = await request(app).post('/api/transcribe');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: 'No audio file provided',
      });
      expect(mockTranscribe).not.toHaveBeenCalled();
    });

    it('should handle transcription errors', async () => {
      mockTranscribe.mockRejectedValue(new Error('Transcription failed'));

      const response = await request(app)
        .post('/api/transcribe')
        .attach('audio', Buffer.from('mock audio data'), 'test-audio.webm');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: 'Failed to transcribe audio',
      });
    });

    it('should clean up the uploaded file when transcription fails', async () => {
      mockTranscribe.mockRejectedValue(new Error('Transcription failed'));

      await request(app)
        .post('/api/transcribe')
        .attach('audio', Buffer.from('mock audio data'), 'test-audio.webm');

      expect(uploadedFiles()).toEqual([]);
    });

    it('should handle different audio file formats', async () => {
      mockTranscribe.mockResolvedValue('Transcription of different format.');

      const formats = ['audio.webm', 'audio.mp3', 'audio.wav', 'audio.m4a'];

      for (const format of formats) {
        const response = await request(app)
          .post('/api/transcribe')
          .attach('audio', Buffer.from('mock audio data'), format);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }
      expect(mockTranscribe).toHaveBeenCalledTimes(formats.length);
    });

    it('should handle large audio files', async () => {
      mockTranscribe.mockResolvedValue('Transcription of large audio file.');

      const largeBuffer = Buffer.alloc(10 * 1024 * 1024); // 10MB, under the 25MB limit

      const response = await request(app)
        .post('/api/transcribe')
        .attach('audio', largeBuffer, 'large-audio.webm');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject files over the 25MB limit with a JSON 413', async () => {
      const tooLarge = Buffer.alloc(25 * 1024 * 1024 + 1);

      const response = await request(app)
        .post('/api/transcribe')
        .attach('audio', tooLarge, 'huge-audio.webm');

      expect(response.status).toBe(413);
      expect(response.body.success).toBe(false);
      expect(mockTranscribe).not.toHaveBeenCalled();
    });

    it('should clean up temporary files after processing', async () => {
      mockTranscribe.mockResolvedValue('Test transcription.');

      await request(app)
        .post('/api/transcribe')
        .attach('audio', Buffer.from('mock audio data'), 'test-audio.webm');

      const filePath = mockTranscribe.mock.calls[0][0];
      expect(fs.unlinkSync).toHaveBeenCalledWith(filePath);
      expect(uploadedFiles()).toEqual([]);
    });

    it('should handle file cleanup errors gracefully', async () => {
      mockTranscribe.mockResolvedValue('Test transcription.');
      vi.mocked(fs.unlinkSync).mockImplementationOnce(() => {
        throw new Error('File cleanup failed');
      });

      // Should still return success even if cleanup fails
      const response = await request(app)
        .post('/api/transcribe')
        .attach('audio', Buffer.from('mock audio data'), 'test-audio.webm');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: { transcript: 'Test transcription.' },
      });
    });
  });

  describe('Live Transcription Specific Tests', () => {
    it('should handle rapid successive requests (simulating live transcription)', async () => {
      // Each chunk's transcript is derived from its own file, so concurrent
      // requests can't be mixed up regardless of completion order.
      mockTranscribe.mockImplementation(async (filePath: string) => {
        const name = path.basename(filePath).replace(/^\d+-/, '');
        return `transcript of ${name}`;
      });

      const chunks = [0, 1, 2];
      const responses = await Promise.all(
        chunks.map((index) =>
          request(app)
            .post('/api/transcribe')
            .attach('audio', Buffer.from(`chunk-${index}`), `chunk-${index}.webm`),
        ),
      );

      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.body.data.transcript).toBe(`transcript of chunk-${index}.webm`);
      });
      expect(uploadedFiles()).toEqual([]);
    });

    it('should handle empty audio chunks gracefully', async () => {
      mockTranscribe.mockResolvedValue('');

      const response = await request(app)
        .post('/api/transcribe')
        .attach('audio', Buffer.alloc(0), 'empty-audio.webm');

      expect(response.status).toBe(200);
      expect(response.body.data.transcript).toBe('');
    });

    it('should handle very short audio chunks', async () => {
      mockTranscribe.mockResolvedValue('Short audio.');

      const response = await request(app)
        .post('/api/transcribe')
        .attach('audio', Buffer.from('short'), 'short-audio.webm');

      expect(response.status).toBe(200);
      expect(response.body.data.transcript).toBe('Short audio.');
    });
  });
});
