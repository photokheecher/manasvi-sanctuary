/**
 * Meditation session definitions — shared between client and server.
 * Kept separate from MeditationSession.tsx to avoid "use client" conflicts.
 */

export type SessionType = "breathing_478" | "box" | "bodyscan" | "focus" | "gratitude";

export interface SessionDef {
  id: SessionType;
  name: string;
  tagline: string;
  forWhen: string;
  duration: string;
  totalSeconds: number;
  gradient: [string, string];
  accentColor: string;
}

export const SESSIONS: Record<SessionType, SessionDef> = {
  breathing_478: {
    id: "breathing_478",
    name: "4-7-8 Breathing",
    tagline: "Calm anxiety in 90 seconds",
    forWhen: "Anxiety, panic, overwhelm",
    duration: "1.5 min",
    totalSeconds: 90,
    gradient: ["#0f4c5c", "#083d3d"],
    accentColor: "#2dd4bf",
  },
  box: {
    id: "box",
    name: "Box Breathing",
    tagline: "Reset your nervous system",
    forWhen: "Stress, frustration, tension",
    duration: "2 min",
    totalSeconds: 120,
    gradient: ["#1e1b4b", "#1d2951"],
    accentColor: "#818cf8",
  },
  bodyscan: {
    id: "bodyscan",
    name: "Body Scan",
    tagline: "Release physical tension",
    forWhen: "Burnout, exhaustion, physical stress",
    duration: "5 min",
    totalSeconds: 300,
    gradient: ["#2e1065", "#1a0533"],
    accentColor: "#c084fc",
  },
  focus: {
    id: "focus",
    name: "25-Min Focus",
    tagline: "One deep work session",
    forWhen: "Distraction, procrastination",
    duration: "25 min",
    totalSeconds: 1500,
    gradient: ["#0c0a09", "#1c1917"],
    accentColor: "#f59e0b",
  },
  gratitude: {
    id: "gratitude",
    name: "Gratitude Bloom",
    tagline: "Shift your perspective gently",
    forWhen: "Hopelessness, self-doubt, loneliness",
    duration: "3 min",
    totalSeconds: 180,
    gradient: ["#450a0a", "#431407"],
    accentColor: "#fb923c",
  },
};

export function getRecommendedSession(mood: number, emotions: string[]): SessionType {
  const lower = emotions.map((e) => e.toLowerCase());
  if (mood <= 2 || lower.some((e) => ["anxiety", "panic", "overwhelm", "fear"].some((k) => e.includes(k)))) return "breathing_478";
  if (lower.some((e) => ["burnout", "exhaustion", "fatigue", "tired"].some((k) => e.includes(k)))) return "bodyscan";
  if (lower.some((e) => ["hopelessness", "self-doubt", "lonely", "sadness"].some((k) => e.includes(k)))) return "gratitude";
  if (mood >= 4) return "focus";
  return "box";
}
