export class RealTranscriber {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private onTranscriptUpdate: (transcript: string) => void = () => {};
  private isRecording = false;
  private processingInterval: number | null = null;
  private accumulatedTranscript = '';
  private recognition: any = null;
  private useBrowserRecognition = false;

  constructor() {
    // Check if MediaRecorder is supported
    if (!window.MediaRecorder) {
      console.error('MediaRecorder API not supported in this browser.');
    }

    // Check if browser speech recognition is available as fallback
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      
      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          console.log(`🎤 Browser recognition final: "${finalTranscript}"`);
          this.accumulatedTranscript += (this.accumulatedTranscript ? ' ' : '') + finalTranscript;
          this.onTranscriptUpdate(this.accumulatedTranscript);
        } else if (interimTranscript) {
          console.log(`🎤 Browser recognition interim: "${interimTranscript}"`);
          this.onTranscriptUpdate(this.accumulatedTranscript + ' ' + interimTranscript);
        }
      };
      
      this.recognition.onerror = (event: any) => {
        console.error('❌ Browser speech recognition error:', event.error);
      };
    }
  }

  public isSupported(): boolean {
    return window.MediaRecorder !== undefined;
  }

  public hasBrowserRecognition(): boolean {
    return this.recognition !== null;
  }

  public getTranscriptionMethod(): string {
    if (this.useBrowserRecognition) {
      return 'Browser Speech Recognition';
    } else {
      return 'Server-side Whisper';
    }
  }

  public async start(onTranscriptUpdate: (transcript: string) => void): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('MediaRecorder not supported');
    }

    try {
      console.log('🎤 Starting live transcription...');
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ Microphone access granted');
      
      this.onTranscriptUpdate = onTranscriptUpdate;
      this.accumulatedTranscript = '';
      this.isRecording = true;

      // Try browser speech recognition first as it's more reliable for live transcription
      if (this.recognition) {
        console.log('🎤 Using browser speech recognition for live transcription');
        this.useBrowserRecognition = true;
        this.recognition.start();
        return;
      }

      // Fallback to server-side transcription
      console.log('🔄 Using server-side transcription (browser recognition not available)');
      this.useBrowserRecognition = false;
      
      this.mediaRecorder = new MediaRecorder(this.stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log(`📊 Audio chunk received: ${event.data.size} bytes`);
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        console.log('🛑 Recording stopped, processing final audio...');
        if (this.audioChunks.length > 0) {
          await this.processAudio();
        }
      };

      // Start recording with 2-second intervals for better live transcription
      this.mediaRecorder.start(2000);
      console.log('🔴 Recording started with 2-second intervals');

      // Start continuous processing every 3 seconds
      this.processingInterval = setInterval(async () => {
        if (this.audioChunks.length > 0) {
          console.log('🔄 Processing audio chunk for live transcription...');
          await this.processAudioChunk();
        }
      }, 3000);

    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      throw error;
    }
  }

  public stop(): void {
    if (this.isRecording) {
      console.log('🛑 Stopping live transcription...');
      this.isRecording = false;
      
      if (this.useBrowserRecognition && this.recognition) {
        console.log('🛑 Stopping browser speech recognition...');
        this.recognition.stop();
      } else if (this.mediaRecorder) {
        console.log('🛑 Stopping media recorder...');
        this.mediaRecorder.stop();
      }
      
      // Clear the processing interval
      if (this.processingInterval) {
        clearInterval(this.processingInterval);
        this.processingInterval = null;
        console.log('⏹️ Processing interval cleared');
      }
      
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
        console.log('🔇 Audio stream stopped');
      }
    }
  }

  private async processAudioChunk(): Promise<void> {
    if (this.audioChunks.length === 0) return;

    try {
      // Process only the latest chunk for live transcription
      const latestChunk = this.audioChunks[this.audioChunks.length - 1];
      const audioBlob = new Blob([latestChunk], { type: 'audio/webm' });
      
      console.log(`🔄 Processing audio chunk: ${audioBlob.size} bytes`);
      
      // Send audio to Whisper API
      const formData = new FormData();
      formData.append('audio', audioBlob, 'live-chunk.webm');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data.transcript) {
        const newTranscript = result.data.transcript.trim();
        if (newTranscript && newTranscript !== '') {
          console.log(`📝 New transcript chunk: "${newTranscript}"`);
          this.accumulatedTranscript += (this.accumulatedTranscript ? ' ' : '') + newTranscript;
          this.onTranscriptUpdate(this.accumulatedTranscript);
        }
      } else {
        console.warn('⚠️ No transcript received from chunk:', result.error);
      }
    } catch (error) {
      console.error('❌ Audio chunk processing error:', error);
      // Don't show error to user for individual chunks, just log it
    }
  }

  private async processAudio(): Promise<void> {
    try {
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      
      console.log(`🔄 Processing final audio: ${audioBlob.size} bytes`);
      
      // Send audio to Whisper API
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data.transcript) {
        const finalTranscript = result.data.transcript.trim();
        console.log(`📝 Final transcript: "${finalTranscript}"`);
        this.onTranscriptUpdate(finalTranscript);
      } else {
        throw new Error(result.error || 'Transcription failed');
      }
    } catch (error) {
      console.error('❌ Final audio processing error:', error);
      this.onTranscriptUpdate('Error: Failed to transcribe audio. Please try again.');
    }
  }
}