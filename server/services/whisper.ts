import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Whisper API configuration
const WHISPER_API_URL = process.env.WHISPER_API_URL || 'http://localhost:11434/api/generate';
const WHISPER_MODEL = process.env.WHISPER_MODEL || 'whisper';

export async function transcribeAudio(audioFilePath: string): Promise<string> {
  try {
    // Read the audio file
    const audioBuffer = fs.readFileSync(audioFilePath);
    const audioBase64 = audioBuffer.toString('base64');

    // Prepare the request payload for Ollama Whisper
    const payload = {
      model: WHISPER_MODEL,
      prompt: "Transcribe the following audio to text. Return only the transcribed text without any additional formatting or commentary.",
      stream: false,
      context: [],
      options: {
        temperature: 0.0,
        top_p: 0.9,
        top_k: 40,
        repeat_penalty: 1.1,
        num_ctx: 2048
      }
    };

    // For Ollama Whisper, we need to send the audio as base64
    // Note: This is a simplified approach. In practice, you might need to use
    // a different method depending on your Whisper setup
    const response = await fetch(WHISPER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        audio: audioBase64
      })
    });

    if (!response.ok) {
      throw new Error(`Whisper API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.response) {
      return result.response.trim();
    } else {
      throw new Error('No transcription result received from Whisper API');
    }
  } catch (error) {
    console.error('Whisper transcription error:', error);
    
    // Fallback: If Whisper is not available, return a placeholder
    // In production, you should handle this more gracefully
    if (error instanceof Error && error.message.includes('fetch')) {
      console.warn('Whisper API not available, using fallback transcription');
      return 'Transcription service is not available. Please ensure Whisper is running on localhost:11434';
    }
    
    throw error;
  }
}

// Alternative implementation using OpenAI Whisper API (if you prefer)
export async function transcribeAudioWithOpenAI(audioFilePath: string): Promise<string> {
  try {
    const FormData = (await import('form-data')).default;
    const formData = new FormData();
    
    formData.append('file', fs.createReadStream(audioFilePath));
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');
    formData.append('response_format', 'text');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`OpenAI Whisper API error: ${response.status} ${response.statusText}`);
    }

    const transcript = await response.text();
    return transcript.trim();
  } catch (error) {
    console.error('OpenAI Whisper transcription error:', error);
    throw error;
  }
}