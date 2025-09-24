import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { getMeetings, saveMeeting as saveMeetingApi, type MeetingRecord } from '@/lib/api';
export type Summary = {
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  decisions: string[];
};
type MeetingState = {
  isRecording: boolean;
  isSummarizing: boolean;
  transcript: string;
  summary: Summary | null;
  error: string | null;
  pastMeetings: MeetingRecord[];
};
type MeetingActions = {
  startRecording: () => void;
  stopRecording: () => void;
  setTranscript: (transcript: string) => void;
  generateSummary: () => Promise<void>;
  reset: () => void;
  fetchPastMeetings: () => Promise<void>;
  saveMeeting: (meeting: { transcript: string; summary: Summary }) => Promise<void>;
};
const initialState: MeetingState = {
  isRecording: false,
  isSummarizing: false,
  transcript: '',
  summary: null,
  error: null,
  pastMeetings: [],
};
export const useMeetingStore = create<MeetingState & MeetingActions>()(
  immer((set, get) => ({
    ...initialState,
    startRecording: () => {
      set((state) => {
        state.isRecording = true;
        state.transcript = '';
        state.summary = null;
        state.error = null;
      });
    },
    stopRecording: () => {
      set({ isRecording: false });
    },
    setTranscript: (transcript) => {
      set({ transcript });
    },
    generateSummary: async () => {
      const transcript = get().transcript;
      if (!transcript.trim()) {
        set({ error: "Transcript is empty, cannot generate summary." });
        return;
      }
      set({ isSummarizing: true, error: null });
      
      try {
        const response = await fetch('/api/summarize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ transcript }),
        });

        if (!response.ok) {
          throw new Error(`Summary generation failed: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success && result.data.summary) {
          set({ summary: result.data.summary, isSummarizing: false });
        } else {
          throw new Error(result.error || 'Summary generation failed');
        }
      } catch (error) {
        console.error("Error generating summary:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during summarization.";
        set({ error: `Failed to generate summary. ${errorMessage}`, isSummarizing: false });
      }
    },
    reset: () => {
      set(initialState);
    },
    fetchPastMeetings: async () => {
      try {
        const meetings = await getMeetings();
        set({ pastMeetings: meetings });
      } catch (error) {
        console.error("Failed to fetch past meetings:", error);
        set({ error: "Could not load past meetings." });
      }
    },
    saveMeeting: async (meeting) => {
      try {
        await saveMeetingApi(meeting);
      } catch (error) {
        console.error("Failed to save meeting:", error);
        set({ error: "Could not save the meeting." });
      }
    },
  }))
);