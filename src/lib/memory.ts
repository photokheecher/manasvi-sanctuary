/**
 * Memory System — Three-tier personalization memory
 *
 * STM (Short-Term Memory): Last 5 raw journal entries
 * LTM (Long-Term Memory): Aggregated patterns across all entries
 * Episodic Memory: Pinned significant moments (crisis, breakthrough, low, high)
 */

import type { LogEntry } from "@/types";

// ─── LTM Shape ────────────────────────────────────────────────────────────────

export interface LTMemory {
  avgMood: number;
  topEmotions: string[];      // Most frequent emotions, sorted
  topTriggers: string[];      // Most frequent tags/triggers, sorted
  suggestedStrategies: string[]; // Strategy titles used before (to avoid repetition)
  moodTrend: "improving" | "declining" | "stable";
  totalEntries: number;
  moodByDayOfWeek: number[];  // avg mood per day index (0=Sun, 6=Sat)
}

// ─── Episodic Shape ───────────────────────────────────────────────────────────

export interface EpisodicMoment {
  date: string;
  mood: number;
  type: "crisis" | "breakthrough" | "low_point" | "high_point";
  description: string;
}

// ─── LTM Builder ─────────────────────────────────────────────────────────────

export function buildLTM(logs: LogEntry[]): LTMemory {
  if (!logs.length) {
    return {
      avgMood: 0, topEmotions: [], topTriggers: [],
      suggestedStrategies: [], moodTrend: "stable",
      totalEntries: 0, moodByDayOfWeek: [],
    };
  }

  // Average mood
  const avgMood = parseFloat(
    (logs.reduce((s, l) => s + l.mood, 0) / logs.length).toFixed(1)
  );

  // Emotion frequency
  const emotionCount: Record<string, number> = {};
  logs.forEach((l) => {
    l.aiResponse?.emotions?.forEach((e) => {
      emotionCount[e] = (emotionCount[e] || 0) + 1;
    });
  });
  const topEmotions = Object.entries(emotionCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([e]) => e);

  // Trigger frequency
  const triggerCount: Record<string, number> = {};
  logs.forEach((l) => {
    l.tags?.forEach((t) => {
      triggerCount[t] = (triggerCount[t] || 0) + 1;
    });
  });
  const topTriggers = Object.entries(triggerCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([t]) => t);

  // Previously suggested strategies (avoid repetition)
  const strategySet = new Set<string>();
  logs.slice(-10).forEach((l) => {
    l.aiResponse?.strategies?.forEach((s) => {
      if (s.title) strategySet.add(s.title);
    });
  });
  const suggestedStrategies = [...strategySet].slice(0, 8);

  // Mood trend: compare recent half vs earlier half
  let moodTrend: "improving" | "declining" | "stable" = "stable";
  if (logs.length >= 6) {
    const half = Math.floor(logs.length / 2);
    const recent = logs.slice(-half);
    const earlier = logs.slice(0, -half);
    const recentAvg = recent.reduce((s, l) => s + l.mood, 0) / recent.length;
    const earlierAvg = earlier.reduce((s, l) => s + l.mood, 0) / earlier.length;
    if (recentAvg > earlierAvg + 0.4) moodTrend = "improving";
    else if (recentAvg < earlierAvg - 0.4) moodTrend = "declining";
  }

  // Mood by day of week
  const moodByDay: { sum: number; count: number }[] = Array.from({ length: 7 }, () => ({ sum: 0, count: 0 }));
  logs.forEach((l) => {
    const dow = new Date(l.date).getDay();
    moodByDay[dow].sum += l.mood;
    moodByDay[dow].count++;
  });
  const moodByDayOfWeek = moodByDay.map((d) =>
    d.count > 0 ? parseFloat((d.sum / d.count).toFixed(1)) : 0
  );

  return { avgMood, topEmotions, topTriggers, suggestedStrategies, moodTrend, totalEntries: logs.length, moodByDayOfWeek };
}

// ─── Episodic Memory Builder ──────────────────────────────────────────────────

export function buildEpisodicMemory(logs: LogEntry[]): EpisodicMoment[] {
  const moments: EpisodicMoment[] = [];

  logs.forEach((l) => {
    const dateStr = new Date(l.date).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const description = l.text.slice(0, 100) + (l.text.length > 100 ? "..." : "");

    if (l.aiResponse?.crisisFlag) {
      moments.push({ date: dateStr, mood: l.mood, type: "crisis", description });
    } else if (l.mood === 5) {
      moments.push({ date: dateStr, mood: l.mood, type: "high_point", description });
    } else if (l.mood === 1) {
      moments.push({ date: dateStr, mood: l.mood, type: "low_point", description });
    }
  });

  // Keep most recent 6 episodes
  return moments.slice(-6);
}

// ─── Full Memory Context Builder ──────────────────────────────────────────────

/**
 * Builds a rich, structured memory context string to inject into the AI prompt.
 * This is the core of the personalization system.
 */
export function buildMemoryContext(logs: LogEntry[]): string {
  if (!logs.length) return "";

  const stm = logs.slice(-5);
  const ltm = buildLTM(logs);
  const episodes = buildEpisodicMemory(logs);

  const trendMsg =
    ltm.moodTrend === "improving"
      ? "📈 gradually improving"
      : ltm.moodTrend === "declining"
      ? "📉 declining — be extra gentle with yourself"
      : "→ relatively stable";

  const stmLines = stm
    .map((e) => {
      const d = new Date(e.date).toLocaleDateString("en-IN", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      const emos = e.aiResponse?.emotions?.slice(0, 2).join(", ") || "unspecified";
      return `  • ${d} (Mood ${e.mood}/5, felt: ${emos}): "${e.text.slice(0, 90)}..."`;
    })
    .join("\n");

  const episodicLines =
    episodes.length > 0
      ? episodes
          .map(
            (ep) =>
              `  • [${ep.type.replace("_", " ").toUpperCase()}, ${ep.date}] Mood ${ep.mood}/5: "${ep.description}"`
          )
          .join("\n")
      : "  • No major episodes yet";

  const avoidStrategies =
    ltm.suggestedStrategies.length > 0
      ? `\n- Strategies already suggested (try not to repeat these exactly): ${ltm.suggestedStrategies.join(", ")}`
      : "";

  return `
=== MANASVI PERSONALIZATION MEMORY ===

SHORT-TERM MEMORY — Last ${stm.length} entries:
${stmLines}

LONG-TERM PATTERNS — Across all ${ltm.totalEntries} entries:
- Mood average: ${ltm.avgMood}/5 (trend: ${trendMsg})
- Most recurring emotions: ${ltm.topEmotions.join(", ") || "none yet"}
- Most recurring stress triggers: ${ltm.topTriggers.join(", ") || "none yet"}${avoidStrategies}

EPISODIC MEMORY — Key moments:
${episodicLines}

PERSONALIZATION INSTRUCTIONS:
1. Reference past entries naturally ("Last time you mentioned feeling overwhelmed after the mock...")
2. Acknowledge mood trends ("I've noticed things have been harder this week...")
3. Validate recurring struggles ("You've mentioned [trigger] a few times now — it seems like a real pressure point")
4. Build on past episodes when relevant
5. Avoid repeating the same strategies that were already suggested
=== END MEMORY ===`;
}
