import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, StopCircle, Loader2, Copy, Sparkles, FileText, AlertTriangle, BrainCircuit, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useMeetingStore, Summary } from '@/hooks/use-meeting-store';
import { RealTranscriber } from '@/lib/real-transcriber';
import { cn } from '@/lib/utils';
import { AudioVisualizer } from '@/components/AudioVisualizer';
type RecordingState = 'idle' | 'permission' | 'recording' | 'summarizing' | 'done' | 'notsupported';
const getButtonState = (isRecording: boolean, isSummarizing: boolean, summary: Summary | null, isSupported: boolean): RecordingState => {
  if (!isSupported) return 'notsupported';
  if (isRecording) return 'recording';
  if (isSummarizing) return 'summarizing';
  if (summary) return 'done';
  return 'idle';
};
const RecordingButton: React.FC<{ state: RecordingState; onClick: () => void }> = ({ state, onClick }) => {
  const buttonConfig = {
    idle: { text: 'Start Recording', icon: <Mic className="w-6 h-6" />, className: 'bg-blue-600 hover:bg-blue-700' },
    permission: { text: 'Waiting...', icon: <Loader2 className="w-6 h-6 animate-spin" />, className: 'bg-gray-500' },
    recording: { text: 'Stop Recording', icon: <StopCircle className="w-6 h-6" />, className: 'bg-red-600 hover:bg-red-700' },
    summarizing: { text: 'Summarizing...', icon: <Loader2 className="w-6 h-6 animate-spin" />, className: 'bg-slate-500' },
    done: { text: 'Start New', icon: <RotateCcw className="w-6 h-6" />, className: 'bg-blue-600 hover:bg-blue-700' },
    notsupported: { text: 'Not Supported', icon: <Mic className="w-6 h-6" />, className: 'bg-gray-400' },
  };
  const current = buttonConfig[state];
  const isDisabled = state === 'summarizing' || state === 'permission' || state === 'notsupported';
  return (
    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}>
      <Button
        onClick={onClick}
        disabled={isDisabled}
        className={cn(
          'w-52 h-52 rounded-full text-white text-xl font-bold shadow-lg flex flex-col items-center justify-center gap-2 transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 focus:ring-4 focus:ring-offset-2',
          current.className,
          isDisabled ? 'cursor-not-allowed' : '',
          state === 'recording' ? 'animate-pulse' : ''
        )}
      >
        {current.icon}
        <span>{current.text}</span>
      </Button>
    </motion.div>
  );
};
const ContentCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  showCopy?: boolean;
  contentToCopy?: string;
  extraContent?: React.ReactNode;
}> = ({ title, icon, children, showCopy = false, contentToCopy = '', extraContent }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(contentToCopy);
    toast.success(`${title} copied to clipboard!`);
  };
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-md rounded-xl w-full overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b bg-slate-50/50">
        <div className="flex items-center gap-3">
          {icon}
          <CardTitle className="text-lg font-semibold text-slate-800">{title}</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          {extraContent}
          {showCopy && (
            <Button variant="ghost" size="icon" onClick={handleCopy} className="text-slate-500 hover:bg-slate-200">
              <Copy className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6">{children}</CardContent>
    </Card>
  );
};
const SummarySkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="space-y-2"><Skeleton className="h-5 w-1/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></div>
    <div className="space-y-2"><Skeleton className="h-5 w-1/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></div>
    <div className="space-y-2"><Skeleton className="h-5 w-1/4" /><Skeleton className="h-4 w-full" /></div>
  </div>
);
export function HomePage() {
  const { isRecording, isSummarizing, transcript, summary, error, startRecording, stopRecording, setTranscript, generateSummary, reset, saveMeeting } = useMeetingStore();
  const transcriberRef = useRef<RealTranscriber | null>(null);
  const [permissionState, setPermissionState] = useState<'idle' | 'pending' | 'granted' | 'denied'>('idle');
  const [isSupported, setIsSupported] = useState(true);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  useEffect(() => {
    const transcriber = new RealTranscriber();
    if (transcriber.isSupported()) {
      transcriberRef.current = transcriber;
    } else {
      setIsSupported(false);
      toast.error("Speech recognition is not supported in your browser.");
    }
    return () => {
      transcriberRef.current?.stop();
      mediaStream?.getTracks().forEach(track => track.stop());
    };
  }, [mediaStream]);
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);
  const handleStopRecording = async () => {
    transcriberRef.current?.stop();
    mediaStream?.getTracks().forEach(track => track.stop());
    setMediaStream(null);
    stopRecording();
    await generateSummary();
  };
  useEffect(() => {
    if (!isSummarizing && summary && transcript) {
      saveMeeting({ transcript, summary });
    }
  }, [isSummarizing, summary, transcript, saveMeeting]);
  const handleRecordingToggle = async () => {
    if (summary) {
      reset();
      return;
    }
    if (isRecording) {
      handleStopRecording();
    } else {
      setPermissionState('pending');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMediaStream(stream);
        setPermissionState('granted');
        startRecording();
        transcriberRef.current?.start(setTranscript);
      } catch (err) {
        setPermissionState('denied');
        toast.error('Microphone access denied. Please allow access to record.');
        console.error('Microphone access denied', err);
      }
    }
  };
  const buttonState = getButtonState(isRecording, isSummarizing, summary, isSupported);
  const effectiveButtonState = permissionState === 'pending' ? 'permission' : buttonState;
  const formatSummaryForCopy = (s: Summary | null): string => {
    if (!s) return '';
    return `## Meeting Summary\n${s.summary}\n\n## Key Points\n${s.keyPoints.map(p => `- ${p}`).join('\n')}\n\n## Action Items\n${s.actionItems.map(a => `- ${a}`).join('\n')}\n\n## Decisions Made\n${s.decisions.map(d => `- ${d}`).join('\n')}`.trim();
  };
  return (
    <div className="flex flex-col items-center text-center space-y-12">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-4">
        <div className="inline-flex items-center gap-2.5 rounded-full bg-blue-100 px-4 py-1.5 text-sm font-semibold text-blue-700"><BrainCircuit className="h-5 w-5" /><span>Powered by Cloudflare AI</span></div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900">MeetingScribe AI</h1>
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl">Focus on the conversation. We'll handle the notes. Record, transcribe, and get intelligent summaries in seconds.</p>
      </motion.div>
      <RecordingButton state={effectiveButtonState} onClick={handleRecordingToggle} />
      <AnimatePresence>
        {(isRecording || transcript) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full">
            <ContentCard
              title="Live Transcript"
              icon={<FileText className="w-5 h-5 text-slate-600" />}
              showCopy={!!transcript && !isRecording}
              contentToCopy={transcript}
              extraContent={isRecording && <AudioVisualizer mediaStream={mediaStream} />}
            >
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap min-h-[100px]">
                {transcript || <span className="text-slate-400">Waiting for you to speak...</span>}
                {isRecording && <span className="inline-block w-2 h-5 bg-blue-600 ml-1 animate-pulse" />}
              </p>
            </ContentCard>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {(isSummarizing || summary) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full">
            <ContentCard title="AI Summary" icon={<Sparkles className="w-5 h-5 text-blue-600" />} showCopy={!!summary} contentToCopy={formatSummaryForCopy(summary)}>
              {isSummarizing ? <SummarySkeleton /> : summary ? (
                <div className="space-y-6 text-left">
                  <div><h3 className="font-semibold text-slate-800 mb-2">Summary</h3><p className="text-slate-700 leading-relaxed">{summary.summary}</p></div>
                  <div><h3 className="font-semibold text-slate-800 mb-2">Key Points</h3><ul className="list-disc list-inside space-y-1 text-slate-700">{summary.keyPoints.map((point, i) => <li key={i}>{point}</li>)}</ul></div>
                  <div><h3 className="font-semibold text-slate-800 mb-2">Action Items</h3><ul className="list-disc list-inside space-y-1 text-slate-700">{summary.actionItems.map((item, i) => <li key={i}>{item}</li>)}</ul></div>
                  <div><h3 className="font-semibold text-slate-800 mb-2">Decisions Made</h3><ul className="list-disc list-inside space-y-1 text-slate-700">{summary.decisions.map((decision, i) => <li key={i}>{decision}</li>)}</ul></div>
                </div>
              ) : null}
            </ContentCard>
          </motion.div>
        )}
      </AnimatePresence>
      {permissionState === 'denied' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 rounded-lg bg-yellow-100 p-4 text-yellow-800 border border-yellow-200">
          <AlertTriangle className="w-5 h-5" />
          <p className="font-medium">Microphone access was denied. Please enable it in your browser settings to use the recording feature.</p>
        </motion.div>
      )}
    </div>
  );
}