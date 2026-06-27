/**
 * Memory System Test Suite
 * Tests STM, LTM, and Episodic memory building and context generation.
 */

import { buildLTM, buildEpisodicMemory, buildMemoryContext } from "../lib/memory";
import type { LogEntry } from "../types";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const makeEntry = (mood: number, tags: string[], text: string, emotions: string[], crisisFlag = false): LogEntry => ({
  mood,
  tags,
  text,
  date: new Date().toISOString(),
  aiResponse: {
    reflection: "Mock reflection",
    emotions,
    crisisFlag,
    strategies: [
      { type: "coping", icon: "brain", title: "Deep Breathing", description: "Breathe slowly" },
    ],
    mindfulness: { shouldShow: false, title: "", duration: "", steps: [] },
    motivation: "You've got this!",
    weeklyFocus: "Focus on one thing at a time.",
    cognitiveDeclutter: { score: 70, unlocked: true, insightWords: ["realize"] },
    stressMatrix: { somatic: 2, social: 3, time: 4 },
    selfDoubtReframer: { detectedDistortion: "All-or-nothing", compassionateReframe: "Reframed" },
    appraisalState: { threatLevel: 2, challengeLevel: 8, focusPivotText: "Let's pivot" },
    ifThenBlueprint: { triggers: [{ condition: "If X", action: "Then Y" }] }
  },
});

const MOCK_LOGS: LogEntry[] = [
  makeEntry(2, ["Mock test result", "Syllabus pressure"], "Failed my chemistry mock badly.", ["Anxiety", "Shame"]),
  makeEntry(3, ["Revision stress"], "Better day, finished organic chapter.", ["Stress", "Hope"]),
  makeEntry(1, ["Family pressure", "Lack of sleep"], "Couldn't sleep. Parents arguing about fees.", ["Anxiety", "Hopelessness"], true),
  makeEntry(4, ["Good study session"], "Actually understood thermodynamics today!", ["Relief", "Confidence"]),
  makeEntry(5, ["Feeling prepared"], "Best study day in months. Feel ready.", ["Confidence", "Joy"]),
  makeEntry(2, ["Mock test result", "Peer comparison"], "Rank dropped. Comparing myself to others.", ["Anxiety", "Self-doubt"]),
  makeEntry(3, ["Revision stress", "Lack of sleep"], "Moderate day. Need more sleep.", ["Stress", "Fatigue"]),
];

// ─── LTM Tests ────────────────────────────────────────────────────────────────

describe("buildLTM", () => {
  test("returns empty LTM for empty logs", () => {
    const ltm = buildLTM([]);
    expect(ltm.totalEntries).toBe(0);
    expect(ltm.avgMood).toBe(0);
    expect(ltm.topEmotions).toHaveLength(0);
  });

  test("computes correct average mood", () => {
    const ltm = buildLTM(MOCK_LOGS);
    const expectedAvg = MOCK_LOGS.reduce((s, l) => s + l.mood, 0) / MOCK_LOGS.length;
    expect(parseFloat(ltm.avgMood.toString())).toBeCloseTo(expectedAvg, 1);
  });

  test("correctly counts total entries", () => {
    const ltm = buildLTM(MOCK_LOGS);
    expect(ltm.totalEntries).toBe(MOCK_LOGS.length);
  });

  test("identifies top emotions correctly", () => {
    const ltm = buildLTM(MOCK_LOGS);
    // Anxiety appears in 3 entries — should be top or near top
    expect(ltm.topEmotions).toContain("Anxiety");
  });

  test("identifies top triggers correctly", () => {
    const ltm = buildLTM(MOCK_LOGS);
    // Mock test result appears twice, Revision stress appears twice
    expect(ltm.topTriggers.length).toBeGreaterThan(0);
    expect(ltm.topTriggers.some(t => ["Mock test result", "Revision stress", "Lack of sleep"].includes(t))).toBe(true);
  });

  test("collects suggested strategies", () => {
    const ltm = buildLTM(MOCK_LOGS);
    expect(ltm.suggestedStrategies).toContain("Deep Breathing");
  });

  test("returns a valid mood trend", () => {
    const ltm = buildLTM(MOCK_LOGS);
    expect(["improving", "declining", "stable"]).toContain(ltm.moodTrend);
  });

  test("handles single entry", () => {
    const ltm = buildLTM([MOCK_LOGS[0]]);
    expect(ltm.avgMood).toBe(MOCK_LOGS[0].mood);
    expect(ltm.totalEntries).toBe(1);
    expect(ltm.moodTrend).toBe("stable"); // Need at least 6 for trend
  });
});

// ─── Episodic Memory Tests ────────────────────────────────────────────────────

describe("buildEpisodicMemory", () => {
  test("returns empty array for empty logs", () => {
    expect(buildEpisodicMemory([])).toHaveLength(0);
  });

  test("marks crisis entries as type 'crisis'", () => {
    const episodes = buildEpisodicMemory(MOCK_LOGS);
    const crisisEpisode = episodes.find(e => e.type === "crisis");
    expect(crisisEpisode).toBeDefined();
    expect(crisisEpisode?.mood).toBe(1);
  });

  test("marks mood-5 entries as type 'high_point'", () => {
    const episodes = buildEpisodicMemory(MOCK_LOGS);
    const highEpisode = episodes.find(e => e.type === "high_point");
    expect(highEpisode).toBeDefined();
    expect(highEpisode?.mood).toBe(5);
  });

  test("marks mood-1 non-crisis entries as type 'low_point'", () => {
    // Our mood-1 entry also has crisisFlag, so let's add a pure low one
    const pureLow = makeEntry(1, [], "Just a very hard day.", ["Hopelessness"], false);
    const episodes = buildEpisodicMemory([pureLow]);
    expect(episodes.find(e => e.type === "low_point")).toBeDefined();
  });

  test("limits to 6 most recent episodes", () => {
    // Create 10 crisis entries
    const manyLogs = Array.from({ length: 10 }, (_, i) =>
      makeEntry(1, [], `Hard day ${i}`, ["Hopelessness"], true)
    );
    const episodes = buildEpisodicMemory(manyLogs);
    expect(episodes.length).toBeLessThanOrEqual(6);
  });

  test("includes entry description in episode", () => {
    const episodes = buildEpisodicMemory(MOCK_LOGS);
    episodes.forEach(ep => {
      expect(ep.description).toBeTruthy();
      expect(ep.description.length).toBeGreaterThan(0);
    });
  });
});

// ─── Memory Context Builder ───────────────────────────────────────────────────

describe("buildMemoryContext", () => {
  test("returns empty string for empty logs", () => {
    expect(buildMemoryContext([])).toBe("");
  });

  test("includes all three memory sections", () => {
    const ctx = buildMemoryContext(MOCK_LOGS);
    expect(ctx).toContain("SHORT-TERM MEMORY");
    expect(ctx).toContain("LONG-TERM PATTERNS");
    expect(ctx).toContain("EPISODIC MEMORY");
  });

  test("includes mood trend information", () => {
    const ctx = buildMemoryContext(MOCK_LOGS);
    expect(ctx).toMatch(/trend:|improving|declining|stable/i);
  });

  test("limits STM to last 5 entries", () => {
    const manyLogs = Array.from({ length: 20 }, (_, i) =>
      makeEntry(3, [], `Entry ${i}`, ["Stress"])
    );
    const ctx = buildMemoryContext(manyLogs);
    // STM section should reference "Last 5 entries"
    expect(ctx).toContain("Last 5");
  });

  test("context string is non-empty with valid data", () => {
    const ctx = buildMemoryContext(MOCK_LOGS);
    expect(ctx.length).toBeGreaterThan(200);
  });
});
