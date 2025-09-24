import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { chatService } from '@/lib/chat';
import { getMeetings, saveMeeting as saveMeetingApi } from '@/lib/api';
import type { MeetingRecord } from 'worker/types';
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
      const prompt = `
        You are an expert meeting assistant. Please analyze the following meeting transcript and provide a structured summary.
        The output must be a valid JSON object with the following keys: "summary", "keyPoints", "actionItems", "decisions".
        - "summary": A concise paragraph summarizing the entire meeting.
        - "keyPoints": An array of strings, with each string being a crucial point discussed.
        - "actionItems": An array of strings, with each string being a clear, actionable task assigned to someone.
        - "decisions": An array of strings, with each string being a final decision made during the meeting.
        The entire response should be only the JSON object, without any markdown formatting or surrounding text.
        Here is the transcript:
        ---
        ${transcript}
        ---
      `;
      try {
        const summaryChatService = new (chatService as any).constructor();
        let fullResponse = '';
        await new Promise<void>((resolve, reject) => {
            summaryChatService.sendMessage(prompt, 'openai/gpt-4o', (chunk: string) => {
                fullResponse += chunk;
            }).then(() => resolve()).catch((err: any) => reject(err));
        });
        const jsonResponseMatch = fullResponse.match(/```json\n([\s\S]*?)\n```|({[\s\S]*})/);
        let jsonString = '';
        if (jsonResponseMatch) {
            jsonString = jsonResponseMatch[1] || jsonResponseMatch[2];
        } else {
            jsonString = fullResponse;
        }
        try {
            const parsedSummary: Summary = JSON.parse(jsonString);
            set({ summary: parsedSummary, isSummarizing: false });
        } catch (e) {
            console.error("Failed to parse summary JSON:", e, "Raw response:", fullResponse);
            throw new Error("Invalid summary format from AI. Expected a JSON object.");
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