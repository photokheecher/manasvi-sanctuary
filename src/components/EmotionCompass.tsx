"use client";
/**
 * EmotionCompass — Helps students understand what their feelings mean
 * Maps detected emotions to plain-language explanations and comfort messages.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface EmotionInfo {
  emoji: string;
  color: string;
  bg: string;
  border: string;
  category: string;
  meaning: string;
  comfort: string;
  action: string;
}

const EMOTION_LIBRARY: Record<string, EmotionInfo> = {
  // ── Anxiety cluster ──
  Anxiety: {
    emoji: "😰",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    category: "Anticipatory Stress",
    meaning: "Your brain is scanning the future for threats — it's trying to protect you from failure or embarrassment.",
    comfort: "Anxiety is actually a sign you care deeply about your goals. The nervous energy you feel? That's the same physiological state as excitement.",
    action: "Try naming what specifically you're afraid of. A concrete fear is easier to plan around than a vague dread.",
  },
  Overwhelm: {
    emoji: "🌊",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    category: "Cognitive Overload",
    meaning: "You have too many open loops — tasks, worries, and decisions all competing for mental space at once.",
    comfort: "Overwhelm isn't a sign of weakness. It's your mind saying the load is too heavy. You're not failing; the load is failing you.",
    action: "Write down every single thing in your head — tasks, fears, unread messages. Externalizing them reduces the cognitive weight immediately.",
  },
  Hopelessness: {
    emoji: "🌑",
    color: "text-slate-700",
    bg: "bg-slate-50",
    border: "border-slate-200",
    category: "Negative Future Thinking",
    meaning: "Your brain has gotten stuck in a loop where it can only see evidence that things won't get better. This is a thinking pattern, not a fact.",
    comfort: "Hopelessness is one of the most painful feelings there is — and one of the most treatable. The future you're imagining is one possible version, not the only one.",
    action: "Ask yourself: 'What is the smallest thing that could be true that would mean my situation isn't completely hopeless?' Even one tiny exception breaks the loop.",
  },
  Frustration: {
    emoji: "😤",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    category: "Blocked Goal Response",
    meaning: "You're frustrated because you CARE. Frustration only exists when something matters to you and an obstacle is in the way.",
    comfort: "Frustration is energy — it's just pointed in the wrong direction right now. The caring that causes your frustration is also what will carry you forward.",
    action: "Identify the specific obstacle causing the frustration. Often, frustration is about one thing that seems like everything.",
  },
  "Self-doubt": {
    emoji: "🪞",
    color: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-200",
    category: "Imposter Feelings",
    meaning: "You're questioning whether you're capable or deserving. This is almost universal among driven people — it's called the Impostor Phenomenon.",
    comfort: "Almost every person who has cleared JEE, NEET, or UPSC has felt exactly what you're feeling right now. Self-doubt at the threshold of achievement is normal.",
    action: "List 3 things you've understood or accomplished this week, no matter how small. Evidence over feeling.",
  },
  Burnout: {
    emoji: "🕯️",
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
    category: "Chronic Depletion",
    meaning: "Burnout is your body and mind saying they've been running on empty for too long. It's not laziness — it's a protective shutdown.",
    comfort: "Rest is not a reward for finishing your work. Rest is what makes finishing your work possible. Burnout is asking for recovery, not willpower.",
    action: "Take one genuine break today — not 'I'll study after this YouTube video' — but a real 20-minute rest with no screens.",
  },
  Loneliness: {
    emoji: "🌙",
    color: "text-indigo-700",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    category: "Social Disconnection",
    meaning: "Preparation can be isolating. You've temporarily stepped away from your social world, and that absence is felt deeply.",
    comfort: "Feeling lonely doesn't mean you're alone in your journey. Millions of students are in the same situation right now — many of them feeling exactly what you feel.",
    action: "Send one message today to someone you care about — even just 'Hey, thinking of you.' Connection doesn't require hours.",
  },
  "Exam anxiety": {
    emoji: "📋",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    category: "Performance Stress",
    meaning: "Your nervous system is preparing for something it perceives as a high-stakes threat. This is a survival response, not a personal failing.",
    comfort: "A small amount of exam anxiety actually improves performance (this is called the Yerkes-Dodson Law). Your body is getting ready — channel it.",
    action: "Try the 5-4-3-2-1 grounding technique: 5 things you see, 4 you touch, 3 you hear, 2 you smell, 1 you taste. It brings you back to the present.",
  },
  Guilt: {
    emoji: "⚖️",
    color: "text-teal-700",
    bg: "bg-teal-50",
    border: "border-teal-200",
    category: "Moral Emotion",
    meaning: "Guilt is you holding yourself to a standard — often a standard that's harsher than you'd hold anyone else to.",
    comfort: "You're probably doing more than you realize, and being far less forgiving of yourself than you deserve. You don't owe anyone a perfect study day.",
    action: "Ask: 'Would I judge a friend as harshly for this same thing?' If not, apply that same fairness to yourself.",
  },
  Sadness: {
    emoji: "💙",
    color: "text-sky-700",
    bg: "bg-sky-50",
    border: "border-sky-200",
    category: "Grief / Loss",
    meaning: "Sadness often means something important to you has been lost, threatened, or not turned out the way you hoped.",
    comfort: "Sadness is one of the most honest emotions. It doesn't need to be fixed immediately — it needs to be felt. You're allowed to grieve what's hard.",
    action: "Give yourself 5 minutes to fully feel the sadness — don't push it away. Paradoxically, allowing it helps it move through you faster.",
  },
  Stress: {
    emoji: "🌀",
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    category: "Pressure Response",
    meaning: "Stress is your body's response to demands that feel like they exceed your resources. It's not a character flaw — it's a measurement.",
    comfort: "The research is clear: how you think about stress matters as much as the stress itself. Viewing it as 'my body preparing me' reduces its harm.",
    action: "Identify one stressor you can control today and one you cannot. Focus your energy on the first, and practice letting go of the second.",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function EmotionCompass({ emotions }: { emotions: string[] }) {
  const [openEmotion, setOpenEmotion] = useState<string | null>(null);

  // Match detected emotions to our library (case-insensitive)
  const matchedEmotions = emotions
    .map((e) => {
      const key = Object.keys(EMOTION_LIBRARY).find(
        (k) => k.toLowerCase() === e.toLowerCase() || e.toLowerCase().includes(k.toLowerCase())
      );
      return key ? { name: key, ...EMOTION_LIBRARY[key] } : null;
    })
    .filter(Boolean) as (EmotionInfo & { name: string })[];

  // Also show a few from library if no matches
  const displayEmotions = matchedEmotions.length > 0
    ? matchedEmotions
    : (["Anxiety", "Overwhelm", "Frustration"] as const).map((k) => ({ name: k, ...EMOTION_LIBRARY[k] }));

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
        Emotion Compass — What You're Feeling
      </p>
      {displayEmotions.map((emo) => (
        <div key={emo.name} className={`rounded-2xl border overflow-hidden ${emo.bg} ${emo.border}`}>
          <button
            onClick={() => setOpenEmotion(openEmotion === emo.name ? null : emo.name)}
            className="w-full flex items-center gap-3 p-3.5 text-left"
          >
            <span className="text-2xl">{emo.emoji}</span>
            <div className="flex-1">
              <p className={`font-semibold text-sm ${emo.color}`}>{emo.name}</p>
              <p className="text-xs text-slate-500">{emo.category}</p>
            </div>
            <motion.div animate={{ rotate: openEmotion === emo.name ? 180 : 0 }}>
              <ChevronDown size={16} className="text-slate-400" />
            </motion.div>
          </button>
          <AnimatePresence>
            {openEmotion === emo.name && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-2.5 border-t border-slate-100">
                  <div className="pt-3">
                    <p className="text-xs font-semibold text-slate-500 mb-1">What's happening</p>
                    <p className="text-xs text-slate-700 leading-relaxed">{emo.meaning}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-teal-700 mb-1">💛 Comfort</p>
                    <p className="text-xs text-slate-700 leading-relaxed">{emo.comfort}</p>
                  </div>
                  <div className={`p-2.5 rounded-xl bg-white/60`}>
                    <p className="text-xs font-semibold text-slate-600 mb-1">→ Try this</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{emo.action}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
