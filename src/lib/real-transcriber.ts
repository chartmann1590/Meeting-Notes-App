export class RealTranscriber {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private onTranscriptUpdate: (transcript: string) => void = () => {};
  private isRecording = false;

  constructor() {
    // Check if MediaRecorder is supported
    if (!window.MediaRecorder) {
      console.error('MediaRecorder API not supported in this browser.');
    }
  }

  public isSupported(): boolean {
    return window.MediaRecorder !== undefined;
  }

  public async start(onTranscriptUpdate: (transcript: string) => void): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('MediaRecorder not supported');
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.stream);
      this.onTranscriptUpdate = onTranscriptUpdate;
      this.audioChunks = [];
      this.isRecording = true;

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        if (this.audioChunks.length > 0) {
          await this.processAudio();
        }
      };

      this.mediaRecorder.start(1000); // Collect data every second
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  public stop(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }
    }
  }

  private async processAudio(): Promise<void> {
    try {
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      
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
        this.onTranscriptUpdate(result.data.transcript);
      } else {
        throw new Error(result.error || 'Transcription failed');
      }
    } catch (error) {
      console.error('Audio processing error:', error);
      this.onTranscriptUpdate('Error: Failed to transcribe audio. Please try again.');
    }
  }
}