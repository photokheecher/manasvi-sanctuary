import { generateText, tool, isStepCount } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { buildMemoryContext } from "@/lib/memory";
import type { LogEntry } from "@/types";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export const maxDuration = 30; // max duration for edge/serverless

export async function POST(req: Request) {
  try {
    const { messages, currentUser, logs }: { 
      messages: { role: string; content: string }[];
      currentUser: { name?: string; exam?: string };
      logs: LogEntry[];
    } = await req.json();

    const memoryContext = buildMemoryContext(logs || []);
    const systemPrompt = `You are Manasvi, a warm, highly empathetic AI wellness companion for Indian students preparing for competitive exams.
You have access to tools that can fetch the user's profile and log data. 
If you do not know the user's name or need to check their mood history, use the 'getUserData' tool.
If the user asks for a specific meditation or coping technique, you can use the 'suggestStrategy' tool to provide one.

Use the ReAct framework to reason about the user's input:
Thought: Think about what the user said, their emotional state, and what information or strategy you need.
Action: Call a tool if necessary (e.g., getUserData or suggestStrategy).
Observation: Look at the tool result (if a tool was called).
Response: Provide your conversational, empathetic reply directly to the user.

Keep your final Response supportive, conversational, and concise. Occasionally use natural Hinglish.`;

    let modelName = process.env.GEMINI_MODEL as string;
    if (modelName && !modelName.startsWith("models/")) {
      modelName = `models/${modelName}`;
    }

    const result = await generateText({
      model: google(modelName),
      system: systemPrompt,
      stopWhen: isStepCount(3),
      messages: messages.map((m: { role: string; content: string }) => ({ role: m.role === "model" ? "assistant" : m.role, content: m.content })),
      tools: {
        getUserData: tool({
          description: "Fetches the current user's profile and their historical mood and journal logs.",
          inputSchema: z.object({}),
          execute: async () => {
            return {
              name: currentUser?.name || "Student",
              exam: currentUser?.exam || "Exams",
              recentContext: memoryContext
            };
          }
        }),
        suggestStrategy: tool({
          description: "Provides a structured coping strategy or mindfulness exercise for the user.",
          inputSchema: z.object({
            stressLevel: z.enum(["low", "medium", "high"]).describe("The perceived stress level of the user."),
            category: z.enum(["breathing", "grounding", "cognitive"]).describe("The type of strategy to suggest.")
          }),
          execute: async ({ category }: { stressLevel: "low" | "medium" | "high"; category: "breathing" | "grounding" | "cognitive" }) => {
            if (category === "breathing") return "Box Breathing: Inhale for 4s, hold for 4s, exhale for 4s, hold for 4s. Repeat 4 times.";
            if (category === "grounding") return "5-4-3-2-1 Technique: Acknowledge 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.";
            return "Cognitive Reframing: Write down the negative thought, then write three objective facts that challenge it.";
          }
        })
      }
    });

    return Response.json({ text: result.text });
  } catch (error) {
    console.error("Error generating chat response:", error);
    return new Response("Failed to generate chat response", { status: 500 });
  }
}
