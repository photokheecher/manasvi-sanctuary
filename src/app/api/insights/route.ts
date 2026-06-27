import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import type { LogEntry } from "@/types";

const ai = new GoogleGenAI({});

export async function POST(req: Request) {
  try {
    const { logs }: { logs: LogEntry[] } = await req.json();

    if (!logs || logs.length < 3) {
      return NextResponse.json({ error: "Need at least 3 entries for a weekly insight" }, { status: 400 });
    }

    const recentLogs = logs.slice(-7);

    const summary = recentLogs.map((l) => {
      const d = new Date(l.date).toLocaleDateString("en-IN", { weekday: "long", month: "short", day: "numeric" });
      return `- ${d}: Mood ${l.mood}/5, Emotions: [${l.aiResponse?.emotions?.join(", ")}], Tags: [${l.tags.join(", ")}], Entry: "${l.text.slice(0, 100)}..."`;
    }).join("\n");

    const avgMood = (recentLogs.reduce((s, l) => s + l.mood, 0) / recentLogs.length).toFixed(1);

    const prompt = `You are Manasvi, a compassionate AI wellness companion. A student has been journaling for the past week and you're generating a personalized weekly insight report.

Here are their entries from this week:
${summary}

Average mood this week: ${avgMood}/5

Write a 3-4 paragraph weekly insight narrative. Structure it as:
1. A compassionate overview of their emotional arc this week (acknowledge patterns, trends, and what you observed)
2. Identification of 1-2 recurring themes or triggers that appeared across entries
3. What they did well / moments of strength or resilience worth acknowledging
4. A gentle, specific focus area and suggestion for the coming week

Tone: Warm, like a trusted friend who has been paying close attention. Not clinical. Not generic. Use specific details from their entries. Occasionally use natural Hinglish.

Respond with ONLY a plain JSON object:
{
  "narrative": "Full narrative text, use newlines between paragraphs",
  "topPattern": "One sentence describing the main pattern observed",
  "strength": "One sentence about a strength or resilience they showed",
  "nextWeekFocus": "One specific, actionable focus for next week"
}`;

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-flash-latest",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    const result = JSON.parse(response.text || "{}");
    return NextResponse.json(result);
  } catch (error) {
    console.error("Insights error:", error);
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}
