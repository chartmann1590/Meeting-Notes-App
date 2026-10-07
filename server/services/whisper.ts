import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Whisper API configuration. Read on every call (not at import time) so the
// values always reflect the current environment, e.g. after dotenv has loaded.
function getWhisperConfig() {
  return {
    WHISPER_API_URL: process.env.WHISPER_API_URL || 'http://localhost:11434/api/generate',
    WHISPER_MODEL: process.env.WHISPER_MODEL || 'whisper',
  };
}

export async function transcribeAudio(audioFilePath: string): Promise<string> {
  const { WHISPER_API_URL, WHISPER_MODEL } = getWhisperConfig();
  try {
    console.log(`🔍 Starting Whisper transcription for: ${audioFilePath}`);
    console.log(`🌐 Whisper API URL: ${WHISPER_API_URL}`);
    console.log(`🤖 Whisper Model: ${WHISPER_MODEL}`);
    
    // Read the audio file
    const audioBuffer = fs.readFileSync(audioFilePath);
    const audioBase64 = audioBuffer.toString('base64');
    
    console.log(`📊 Audio file size: ${audioBuffer.length} bytes`);
    console.log(`📊 Base64 size: ${audioBase64.length} characters`);

    console.log(`📤 Sending request to Whisper API...`);
    const requestStartTime = Date.now();

    // For Ollama Whisper, we need to use the correct API format
    // Ollama Whisper expects the audio as base64 in the request body
    let response: Response;
    try {
      response = await fetch(WHISPER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
          },
          // For Ollama Whisper, we need to include the audio data
          audio: audioBase64
        })
      });
    } catch (networkError) {
      // fetch() only rejects when the server can't be reached at all (DNS failure,
      // connection refused, reset...). Any such failure means Whisper is unavailable.
      console.warn('⚠️ Whisper API not reachable, using fallback transcription:', networkError);
      return await fallbackTranscription(audioFilePath);
    }

    const requestTime = Date.now() - requestStartTime;
    console.log(`⏱️ Whisper API request took: ${requestTime}ms`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Whisper API error: ${response.status} ${response.statusText}`);
      console.error(`❌ Error details: ${errorText}`);
      
      // If the Whisper model is not available, try a fallback approach
      if (response.status === 404) {
        console.warn('⚠️ Whisper model not found, trying fallback transcription');
        return await fallbackTranscription(audioFilePath);
      }
      
      throw new Error(`Whisper API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`📥 Whisper API response received`);
    console.log(`📝 Raw response:`, JSON.stringify(result, null, 2));
    
    // An empty string is a valid result (e.g. a silent live-transcription chunk).
    if (typeof result?.response === 'string') {
      const transcript = result.response.trim();
      console.log(`✅ Transcription successful: "${transcript}"`);
      return transcript;
    } else {
      console.error(`❌ No transcription result in response:`, result);
      throw new Error('No transcription result received from Whisper API');
    }
  } catch (error) {
    console.error('❌ Whisper transcription error:', error);
    
    // Fallback: If Whisper is not available, return a placeholder
    // In production, you should handle this more gracefully
    if (error instanceof Error && error.message.includes('fetch')) {
      console.warn('⚠️ Whisper API not available, using fallback transcription');
      return await fallbackTranscription(audioFilePath);
    }
    
    throw error;
  }
}

// Fallback transcription function
async function fallbackTranscription(audioFilePath: string): Promise<string> {
  try {
    console.log('🔄 Attempting fallback transcription...');
    
    // For now, return a placeholder that indicates the service is not available
    // In a real implementation, you might want to:
    // 1. Use a different transcription service
    // 2. Use browser-based speech recognition
    // 3. Provide instructions to the user
    
    return 'Transcription service is not available. Please ensure Ollama is running with a Whisper model installed. Run: ollama pull whisper';
  } catch (error) {
    console.error('❌ Fallback transcription failed:', error);
    return 'Transcription failed. Please check your audio input and try again.';
  }
}

// Alternative implementation using OpenAI Whisper API (if you prefer)
export async function transcribeAudioWithOpenAI(audioFilePath: string): Promise<string> {
  try {
    const { default: FormData } = await import('form-data');
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
      body: formData as any,
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