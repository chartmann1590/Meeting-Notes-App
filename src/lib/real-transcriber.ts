export class RealTranscriber {
  private recognition: SpeechRecognition | null = null;
  private finalTranscript = '';
  private onTranscriptUpdate: (transcript: string) => void = () => {};
  constructor() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            this.finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        this.onTranscriptUpdate(this.finalTranscript + interimTranscript);
      };
    } else {
      console.error('Speech Recognition API not supported in this browser.');
    }
  }
  public isSupported(): boolean {
    return this.recognition !== null;
  }
  public start(onTranscriptUpdate: (transcript: string) => void): void {
    if (this.recognition) {
      this.onTranscriptUpdate = onTranscriptUpdate;
      this.finalTranscript = '';
      this.recognition.start();
    }
  }
  public stop(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
  }
}