import React, { useRef, useEffect } from 'react';
interface AudioVisualizerProps {
  mediaStream: MediaStream | null;
}
export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ mediaStream }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>();
  useEffect(() => {
    if (!mediaStream || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(mediaStream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const draw = () => {
      animationFrameId.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      canvasCtx.fillStyle = 'rgb(248 250 252)'; // bg-slate-50
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] / 2;
        canvasCtx.fillStyle = `rgba(59, 130, 246, ${barHeight / 100})`; // blue-500 with opacity
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };
    draw();
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      audioContext.close();
    };
  }, [mediaStream]);
  return <canvas ref={canvasRef} width="300" height="75" className="rounded-lg" />;
};