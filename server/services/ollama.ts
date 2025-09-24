import { Summary } from '../types.js';

// Ollama API configuration
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';

export async function generateSummary(transcript: string): Promise<Summary> {
  try {
    const prompt = `You are an expert meeting assistant. Please analyze the following meeting transcript and provide a structured summary.

The output must be a valid JSON object with the following keys: "summary", "keyPoints", "actionItems", "decisions".

- "summary": A concise paragraph summarizing the entire meeting.
- "keyPoints": An array of strings, with each string being a crucial point discussed.
- "actionItems": An array of strings, with each string being a clear, actionable task assigned to someone.
- "decisions": An array of strings, with each string being a final decision made during the meeting.

The entire response should be only the JSON object, without any markdown formatting or surrounding text.

Here is the transcript:
---
${transcript}
---`;

    const payload = {
      model: OLLAMA_MODEL,
      prompt: prompt,
      stream: false,
      context: [],
      options: {
        temperature: 0.3,
        top_p: 0.9,
        top_k: 40,
        repeat_penalty: 1.1,
        num_ctx: 4096
      }
    };

    console.log('Sending request to Ollama:', OLLAMA_API_URL);
    console.log('Using model:', OLLAMA_MODEL);

    const response = await fetch(OLLAMA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.response) {
      throw new Error('No response received from Ollama API');
    }

    // Parse the JSON response
    let jsonString = result.response.trim();
    
    // Try to extract JSON from markdown code blocks if present
    const jsonMatch = jsonString.match(/```json\n([\s\S]*?)\n```|({[\s\S]*})/);
    if (jsonMatch) {
      jsonString = jsonMatch[1] || jsonMatch[2];
    }

    try {
      const parsedSummary: Summary = JSON.parse(jsonString);
      
      // Validate the structure
      if (!parsedSummary.summary || !Array.isArray(parsedSummary.keyPoints) || 
          !Array.isArray(parsedSummary.actionItems) || !Array.isArray(parsedSummary.decisions)) {
        throw new Error('Invalid summary structure received from AI');
      }

      return parsedSummary;
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Raw response:', result.response);
      
      // Fallback: create a basic summary structure
      return {
        summary: result.response.substring(0, 200) + '...',
        keyPoints: ['AI response could not be parsed properly'],
        actionItems: ['Please check the AI service configuration'],
        decisions: ['Manual review required']
      };
    }
  } catch (error) {
    console.error('Ollama summary generation error:', error);
    
    // Fallback: If Ollama is not available, return a placeholder
    if (error instanceof Error && error.message.includes('fetch')) {
      console.warn('Ollama API not available, using fallback summary');
      return {
        summary: 'AI summary service is not available. Please ensure Ollama is running on localhost:11434 with a compatible model.',
        keyPoints: ['AI service unavailable'],
        actionItems: ['Set up Ollama with a compatible model'],
        decisions: ['Manual review required']
      };
    }
    
    throw error;
  }
}

// Alternative implementation using OpenAI API (if you prefer)
export async function generateSummaryWithOpenAI(transcript: string): Promise<Summary> {
  try {
    const prompt = `You are an expert meeting assistant. Please analyze the following meeting transcript and provide a structured summary.

The output must be a valid JSON object with the following keys: "summary", "keyPoints", "actionItems", "decisions".

- "summary": A concise paragraph summarizing the entire meeting.
- "keyPoints": An array of strings, with each string being a crucial point discussed.
- "actionItems": An array of strings, with each string being a clear, actionable task assigned to someone.
- "decisions": An array of strings, with each string being a final decision made during the meeting.

The entire response should be only the JSON object, without any markdown formatting or surrounding text.

Here is the transcript:
---
${transcript}
---`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from OpenAI API');
    }

    // Parse the JSON response
    let jsonString = content.trim();
    
    // Try to extract JSON from markdown code blocks if present
    const jsonMatch = jsonString.match(/```json\n([\s\S]*?)\n```|({[\s\S]*})/);
    if (jsonMatch) {
      jsonString = jsonMatch[1] || jsonMatch[2];
    }

    const parsedSummary: Summary = JSON.parse(jsonString);
    
    // Validate the structure
    if (!parsedSummary.summary || !Array.isArray(parsedSummary.keyPoints) || 
        !Array.isArray(parsedSummary.actionItems) || !Array.isArray(parsedSummary.decisions)) {
      throw new Error('Invalid summary structure received from AI');
    }

    return parsedSummary;
  } catch (error) {
    console.error('OpenAI summary generation error:', error);
    throw error;
  }
}