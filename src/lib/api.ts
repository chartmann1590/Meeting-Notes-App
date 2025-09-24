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

export async function getMeetings(): Promise<MeetingRecord[]> {
  const response = await fetch('/api/meetings');
  if (!response.ok) {
    throw new Error('Failed to fetch meetings');
  }
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'API returned an error');
  }
  return result.data;
}

export async function saveMeeting(meeting: { transcript: string; summary: Summary }): Promise<void> {
  const response = await fetch('/api/meetings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(meeting),
  });
  if (!response.ok) {
    throw new Error('Failed to save meeting');
  }
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'API returned an error on save');
  }
}