/**
 * Guardrails — Safety, Sanitization & Validation
 * Runs synchronously BEFORE the AI call for zero-latency crisis detection.
 */

// ─── Crisis Keywords ──────────────────────────────────────────────────────────

/** Phrases that indicate immediate, high-risk crisis */
const HIGH_RISK_PHRASES = [
  "want to die", "end my life", "kill myself", "take my life",
  "suicide", "suicidal",  "hurt myself", "self harm", "harm myself", "cut myself", "cutting myself",
  "harming myself", "hurting myself",
  "don't want to exist", "no point in living", "ending it all",
  "better off dead", "wish i was dead",
  "want to disappear forever", "end it all",
  // Hindi/Hinglish variants
  "marna chahta", "marna chahti", "mar jaana chahta",
  "jina nahi chahta", "jina nahi chahti",
];

/** Phrases indicating serious distress but not immediate crisis */
const MEDIUM_RISK_PHRASES = [
  "nobody would miss me", "better if i wasn't here",
  "can't live like this anymore", "want to give up on life",
  "done with everything", "no one cares if i exist",
  "wish i could disappear",
];

/** Patterns used for prompt injection attacks */
const INJECTION_PATTERNS = [
  /ignore (previous|prior|all) instructions/i,
  /you are now (a|an)/i,
  /forget (your|all) (instructions|training|previous)/i,
  /\[system\]/i,
  /system prompt/i,
  /jailbreak/i,
  /act as if you (are|were)/i,
  /disregard (all|your) (previous|prior) (instructions|training)/i,
  /new (persona|role|character|identity):/i,
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CrisisDetectionResult {
  isCrisis: boolean;
  riskLevel: "high" | "medium" | "none";
  matchedPhrase?: string;
}

// ─── Functions ────────────────────────────────────────────────────────────────

/**
 * Synchronous crisis detection — checks for high/medium risk phrases.
 * Runs client-side before any API call for immediate response.
 */
export function detectCrisis(text: string): CrisisDetectionResult {
  const lower = text.toLowerCase();

  for (const phrase of HIGH_RISK_PHRASES) {
    if (lower.includes(phrase)) {
      return { isCrisis: true, riskLevel: "high", matchedPhrase: phrase };
    }
  }

  for (const phrase of MEDIUM_RISK_PHRASES) {
    if (lower.includes(phrase)) {
      return { isCrisis: true, riskLevel: "medium", matchedPhrase: phrase };
    }
  }

  return { isCrisis: false, riskLevel: "none" };
}

/**
 * Sanitizes user input by:
 * 1. Trimming and enforcing max length
 * 2. Removing prompt injection attempts
 */
export function sanitizeInput(text: string): {
  sanitized: string;
  wasModified: boolean;
} {
  let sanitized = text.trim().slice(0, 2000);
  let wasModified = false;

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(sanitized)) {
      sanitized = sanitized.replace(pattern, "[content removed]");
      wasModified = true;
    }
  }

  return { sanitized, wasModified };
}

/**
 * Validates the AI response matches the expected schema.
 * Returns false if the response is malformed — triggers graceful fallback.
 */
export function validateAIResponse(response: unknown): boolean {
  if (!response || typeof response !== "object") return false;
  const r = response as Record<string, unknown>;

  if (typeof r.reflection !== "string" || r.reflection.length < 5) return false;
  if (!Array.isArray(r.emotions)) return false;
  if (!Array.isArray(r.strategies)) return false;
  if (typeof r.motivation !== "string" || r.motivation.length < 5) return false;

  // Validate at least one strategy
  if (r.strategies.length === 0) return false;
  const firstStrategy = r.strategies[0] as Record<string, unknown>;
  if (typeof firstStrategy?.title !== "string") return false;

  // Validate psychological features
  if (!r.cognitiveDeclutter || typeof r.cognitiveDeclutter !== "object") return false;
  const cd = r.cognitiveDeclutter as Record<string, unknown>;
  if (typeof cd.score !== "number" || typeof cd.unlocked !== "boolean") return false;

  if (!r.stressMatrix || typeof r.stressMatrix !== "object") return false;
  const sm = r.stressMatrix as Record<string, unknown>;
  if (typeof sm.somatic !== "number" || typeof sm.social !== "number" || typeof sm.time !== "number") return false;

  if (!r.selfDoubtReframer || typeof r.selfDoubtReframer !== "object") return false;
  const sd = r.selfDoubtReframer as Record<string, unknown>;
  if (typeof sd.detectedDistortion !== "string" || typeof sd.compassionateReframe !== "string") return false;

  if (!r.appraisalState || typeof r.appraisalState !== "object") return false;
  const ap = r.appraisalState as Record<string, unknown>;
  if (typeof ap.threatLevel !== "number" || typeof ap.challengeLevel !== "number" || typeof ap.focusPivotText !== "string") return false;

  if (!r.ifThenBlueprint || typeof r.ifThenBlueprint !== "object") return false;
  const it = r.ifThenBlueprint as Record<string, unknown>;
  if (!Array.isArray(it.triggers)) return false;

  return true;
}

/**
 * UI-level rate limit: max 5 journal submissions per hour.
 * Uses localStorage to track submission timestamps.
 */
export function checkRateLimit(): { allowed: boolean; waitMinutes?: number } {
  const key = "manasvi_submissions";
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  const stored: number[] = JSON.parse(localStorage.getItem(key) || "[]");
  const recent = stored.filter((t) => now - t < oneHour);

  if (recent.length >= 5) {
    const oldest = Math.min(...recent);
    const waitMs = oneHour - (now - oldest);
    return { allowed: false, waitMinutes: Math.ceil(waitMs / 60000) };
  }

  recent.push(now);
  localStorage.setItem(key, JSON.stringify(recent));
  return { allowed: true };
}
