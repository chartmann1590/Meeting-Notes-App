export interface MeetingRecord {
  id: string;
  createdAt: number;
  transcript: string;
  summary: Summary;
}

export interface Summary {
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  decisions: string[];
}