// Shared types for Manasvi

export interface Strategy {
  type: string;   // 'coping' | 'music' | 'aroma' | 'food' | 'reading'
  icon: string;   // 'brain' | 'music' | 'wind' | 'coffee' | 'book'
  title: string;
  description: string;
}

export interface Mindfulness {
  shouldShow: boolean;
  title: string;
  duration: string;
  steps: string[];
}

export interface CognitiveDeclutter {
  score: number;        // 0 to 100 percentage
  unlocked: boolean;    // true if transitions from chaotic venting to insight/rationalize
  insightWords: string[]; // words detected e.g. ["because", "therefore", "realize", "understand"]
}

export interface StressMatrix {
  somatic: number;      // 0 to 10 intensity
  social: number;       // 0 to 10 intensity
  time: number;         // 0 to 10 intensity
}

export interface SelfDoubtReframer {
  detectedDistortion: string; // e.g. "Catastrophizing", "All-or-nothing thinking"
  compassionateReframe: string; // Reframed text using Kristin Neff's 3 pillars
}

export interface AppraisalState {
  threatLevel: number;    // 0 to 10
  challengeLevel: number; // 0 to 10
  focusPivotText: string; // Text to pivot mind from threat to challenge puzzle
}

export interface IfThenTrigger {
  condition: string;
  action: string;
}

export interface IfThenBlueprint {
  triggers: IfThenTrigger[];
}

export interface AIResponse {
  reflection: string;
  emotions: string[];
  crisisFlag: boolean;
  strategies: Strategy[];
  mindfulness: Mindfulness;
  motivation: string;
  weeklyFocus: string;
  cognitiveDeclutter: CognitiveDeclutter;
  stressMatrix: StressMatrix;
  selfDoubtReframer: SelfDoubtReframer;
  appraisalState: AppraisalState;
  ifThenBlueprint: IfThenBlueprint;
  error?: string;
}

export interface LogEntry {
  mood: number;    // 1-5
  tags: string[];
  text: string;
  aiResponse: AIResponse;
  date: string;    // ISO string
}
