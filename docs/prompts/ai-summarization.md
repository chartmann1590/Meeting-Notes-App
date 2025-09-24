# AI Summarization Prompts

This document contains the prompts used by MeetingScribe AI for generating structured meeting summaries.

## Main Summarization Prompt

The following prompt is used to generate structured summaries from meeting transcripts:

```
You are an expert meeting assistant. Analyze the following meeting transcript and create a comprehensive summary with the following structure:

1. **Meeting Overview**: Brief 2-3 sentence summary of what the meeting was about
2. **Key Discussion Points**: List the main topics discussed (3-5 bullet points)
3. **Action Items**: Extract any tasks, assignments, or follow-ups mentioned (with assignees if specified)
4. **Decisions Made**: List any decisions or conclusions reached during the meeting
5. **Next Steps**: Outline what should happen next or when the next meeting is scheduled

Please be concise but comprehensive. Focus on actionable items and important decisions. If no specific information is available for a section, write "None mentioned."

Meeting Transcript:
{transcript}
```

## Alternative Prompt for Shorter Summaries

For users who prefer more concise summaries:

```
Create a brief meeting summary with:
- **Purpose**: What was the meeting about?
- **Key Points**: Main discussion topics (2-3 points)
- **Actions**: Tasks or follow-ups (with who is responsible)
- **Decisions**: Any conclusions reached

Keep it concise and actionable.

Transcript:
{transcript}
```

## Customization Options

Users can customize the summarization by modifying these prompts in the settings or by using different AI models with varying levels of detail:

- **Llama 3.2:1b**: Fast, basic summaries
- **Llama 3.2:3b**: Balanced speed and quality (recommended)
- **Llama 3.1:8b**: Detailed, comprehensive summaries