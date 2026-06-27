import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({});

export async function POST(req: Request) {
  try {
    const { mood, tags, text } = await req.json();

    const prompt = `
You are Manasvi, a warm and empathetic AI wellness companion for students preparing for competitive exams in India (JEE, NEET, UPSC, etc.). You are NOT a therapist. You listen deeply, reflect accurately, and respond with practical, evidence-based support.

User Context:
Today's mood: ${mood}/5 (1 is very stressed/low, 5 is very calm/happy).
Context Tags selected: ${tags.join(', ')}
Journal Entry: "${text}"

Task Instruction:
Analyze today's journal entry. Respond with a JSON object exactly matching this structure:
{
  "reflection": "An empathetic paraphrase showing you understand",
  "emotions": ["Emotion 1", "Emotion 2"],
  "strategies": [
    "One specific coping technique (e.g., CBT/ACT)",
    "One sensory suggestion (calming reading, aroma therapy, OR focus music)",
    "One mood-boosting food/hydration suggestion"
  ],
  "motivation": "A short, genuine encouragement grounded in what the student shared."
}

Do NOT wrap the JSON in markdown code blocks. Return ONLY valid JSON.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const result = JSON.parse(response.text || '{}');
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating AI response:", error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
