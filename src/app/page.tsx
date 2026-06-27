"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import {
  User, PenLine, Sparkles, Wind, BarChart2, BookOpen,
  Brain, Coffee, Music, Quote, Flame, TrendingUp, Clock,
  ChevronDown, AlertTriangle, Phone, HeartPulse, Leaf,
  Play, MessageCircle
} from "lucide-react";

import { detectCrisis, sanitizeInput, checkRateLimit } from "@/lib/guardrails";
import { buildLTM } from "@/lib/memory";
import MeditationSession from "@/components/MeditationSession";
import CompanionChat from "@/components/CompanionChat";
import { SESSIONS as MEDITATION_SESSIONS, getRecommendedSession, type SessionType } from "@/lib/sessions";
import EmotionCompass from "@/components/EmotionCompass";
import type { LogEntry, AIResponse, Strategy, UserProfile } from "@/types";
import { useAuth } from "@/context/AuthContext";
import AuthScreen from "@/components/AuthScreen";
import { LogOut } from "lucide-react";

// ─── Session icon mapping (client-side only) ───────────────────────────────────
const SESSION_ICONS: Record<string, React.FC<{ size?: number; className?: string }>> = {
  breathing_478: Wind,
  box: Wind,
  bodyscan: Leaf,
  focus: Clock,
  gratitude: HeartPulse,
};

// Dynamic imports to avoid SSR issues
const MoodChart = dynamic(() => import("@/components/MoodChart"), { ssr: false });

// ─── Constants ────────────────────────────────────────────────────────────────
const MOOD_EMOJIS = ["😫", "😟", "😐", "🙂", "😌"];
const MOOD_LABELS = ["Overwhelmed", "Stressed", "Neutral", "Good", "Calm"];
const MOOD_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6"];

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  brain: Brain, music: Music, wind: Wind, coffee: Coffee, book: BookOpen, leaf: Leaf,
};
const STRATEGY_STYLE: Record<string, { card: string; icon: string }> = {
  coping:  { card: "bg-purple-50 border-purple-100 text-purple-800",  icon: "bg-purple-100 text-purple-600" },
  music:   { card: "bg-blue-50 border-blue-100 text-blue-800",        icon: "bg-blue-100 text-blue-600" },
  aroma:   { card: "bg-emerald-50 border-emerald-100 text-emerald-800", icon: "bg-emerald-100 text-emerald-600" },
  food:    { card: "bg-orange-50 border-orange-100 text-orange-800",  icon: "bg-orange-100 text-orange-600" },
  reading: { card: "bg-rose-50 border-rose-100 text-rose-800",        icon: "bg-rose-100 text-rose-600" },
};

const AVAILABLE_TAGS = [
  "Mock test result", "Syllabus pressure", "Lack of sleep", "Feeling prepared",
  "Family pressure", "Peer comparison", "Revision stress", "Loneliness",
  "Good study session", "Physical exhaustion", "Skipped meals", "Achieved target",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" });
}
function fmtTime(s: string) {
  return new Date(s).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}
function calcStreak(logs: LogEntry[]) {
  if (!logs.length) return 0;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const seenDays = new Set(logs.map(l => { const d = new Date(l.date); d.setHours(0,0,0,0); return d.getTime(); }));
  let streak = 0, cursor = today.getTime();
  while (seenDays.has(cursor)) { streak++; cursor -= 86400000; }
  return streak;
}

// ─── Crisis Overlay ──────────────────────────────────────────────────────────
function CrisisScreen({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-rose-950/95 backdrop-blur-xl flex items-center justify-center p-6">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-6">
          <HeartPulse size={28} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-3">You Matter</h2>
        <p className="text-slate-600 leading-relaxed mb-6">
          It sounds like you&apos;re carrying something really heavy right now. You don&apos;t have to face this alone.
          Reaching out takes courage — and you have it.
        </p>
        <div className="space-y-3 mb-6">
          {[
            { name: "iCall (TISS)", number: "9152987821", desc: "Mon-Sat, 8am-10pm" },
            { name: "Vandrevala Foundation", number: "1860-2662-345", desc: "24/7" },
            { name: "NIMHANS Helpline", number: "080-46110007", desc: "24/7" },
          ].map((h) => (
            <a key={h.name} href={`tel:${h.number.replace(/-/g,"")}`}
              className="flex items-center gap-4 p-4 bg-rose-50 rounded-2xl border border-rose-100 hover:bg-rose-100 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-rose-200 flex items-center justify-center text-rose-700">
                <Phone size={18} />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">{h.name}</p>
                <p className="text-rose-700 font-bold">{h.number}</p>
                <p className="text-xs text-slate-500">{h.desc}</p>
              </div>
            </a>
          ))}
        </div>
        <button onClick={onDismiss}
          className="w-full py-3 rounded-2xl bg-slate-100 text-slate-600 font-medium hover:bg-slate-200 transition-colors">
          I&apos;m okay — go back
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── History Card ─────────────────────────────────────────────────────────────
function HistoryCard({ entry, index }: { entry: LogEntry; index: number }) {
  const [open, setOpen] = useState(false);
  const moodColor = MOOD_COLORS[entry.mood - 1];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: "spring", stiffness: 300, damping: 26 }}
      className="bg-white/80 backdrop-blur-md rounded-2xl border border-white shadow-sm overflow-hidden"
    >
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-slate-50/50 transition-colors">
        <div className="shrink-0 flex flex-col items-center gap-1 pt-0.5">
          <span className="text-2xl">{MOOD_EMOJIS[entry.mood - 1]}</span>
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: moodColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-xs font-semibold text-slate-500">{fmtDate(entry.date)} · {fmtTime(entry.date)}</p>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: moodColor + "20", color: moodColor }}>
              {MOOD_LABELS[entry.mood - 1]}
            </span>
          </div>
          <p className="text-sm text-slate-700 line-clamp-2 leading-snug">{entry.text}</p>
          {entry.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {entry.tags.map((t) => (
                <span key={t} className="text-xs px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-100">{t}</span>
              ))}
            </div>
          )}
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} className="shrink-0 pt-1">
          <ChevronDown size={15} className="text-slate-400" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && entry.aiResponse && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-3">
              <p className="text-sm text-slate-600 leading-relaxed italic border-l-2 border-teal-300 pl-3">
                {entry.aiResponse.reflection}
              </p>
              {entry.aiResponse.emotions?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {entry.aiResponse.emotions.map((e) => (
                    <span key={e} className="text-xs px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 border border-orange-100 font-medium">{e}</span>
                  ))}
                </div>
              )}
              {entry.aiResponse.strategies?.length > 0 && (
                <div className="space-y-2">
                  {entry.aiResponse.strategies.slice(0, 3).map((s: Strategy, i) => {
                    const Icon = ICON_MAP[s.icon] || BookOpen;
                    const style = STRATEGY_STYLE[s.type] || { card: "bg-slate-50 border-slate-100 text-slate-700", icon: "bg-slate-100 text-slate-600" };
                    return (
                      <div key={`${s.title}-${i}`} className={`flex items-start gap-2.5 p-2.5 rounded-xl border ${style.card}`}>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${style.icon}`}>
                          <Icon size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-bold">{s.title}</p>
                          <p className="text-xs opacity-75 leading-snug">{s.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {entry.aiResponse.motivation && (
                <div className="p-3 bg-teal-50 rounded-xl border border-teal-100 relative">
                  <Quote size={14} className="absolute top-2 right-2 text-teal-200" />
                  <p className="text-xs text-teal-800 italic leading-relaxed pr-4">&ldquo;{entry.aiResponse.motivation}&rdquo;</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
type Tab = "checkin" | "companion" | "meditate" | "insights" | "journey";

interface WeeklyInsight {
  narrative: string;
  strength?: string;
  nextWeekFocus?: string;
}

function DashboardContent({ currentUser, logout }: { currentUser: UserProfile; logout: () => void }) {
  // ── Core state
  const [mood, setMood] = useState(3);
  const [tags, setTags] = useState<string[]>([]);
  const [journal, setJournal] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(`manasvi_logs_${currentUser.id}`);
    return stored ? JSON.parse(stored) : [];
  });
  const [activeTab, setActiveTab] = useState<Tab>("checkin");
  const [activeMeditation, setActiveMeditation] = useState<SessionType | null>(null);
  const [showCrisis, setShowCrisis] = useState(false);
  const [rateLimitMsg, setRateLimitMsg] = useState("");
  const [weeklyInsight, setWeeklyInsight] = useState<WeeklyInsight | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  // ── Derived data
  const streak = useMemo(() => calcStreak(logs), [logs]);
  const ltm = useMemo(() => buildLTM(logs), [logs]);
  const lastEntry = logs[logs.length - 1];
  const recommendedSession: SessionType = lastEntry
    ? getRecommendedSession(lastEntry.mood, lastEntry.aiResponse?.emotions || [])
    : "box";

  // All recent emotions (for EmotionCompass and insights)
  const recentEmotions = useMemo(() => {
    const freq: Record<string, number> = {};
    logs.slice(-7).forEach(l => l.aiResponse?.emotions?.forEach(e => { freq[e] = (freq[e] || 0) + 1; }));
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([e]) => e);
  }, [logs]);

  const toggleTag = (tag: string) =>
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);

  // ── Journal submit handler
  const handleSubmit = async () => {
    if (!journal.trim() || isSubmitting) return;

    // Client-side crisis check (synchronous, before API call)
    const crisis = detectCrisis(journal);
    if (crisis.isCrisis) {
      setShowCrisis(true);
      if (crisis.riskLevel === "high") return; // Don't process further for high risk
    }

    // Rate limit check
    const rateCheck = checkRateLimit();
    if (!rateCheck.allowed) {
      setRateLimitMsg(`Take a breather — you've journaled a lot today! Try again in ${rateCheck.waitMinutes} minutes.`);
      setTimeout(() => setRateLimitMsg(""), 6000);
      return;
    }

    setIsSubmitting(true);
    setAiResponse(null);
    try {
      const { sanitized } = sanitizeInput(journal);
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood, tags, text: sanitized, logs }),
      });
      const data: AIResponse = await res.json();
      setAiResponse(data);

      // AI-level crisis flag also triggers overlay
      if (data.crisisFlag && !showCrisis) setShowCrisis(true);

      const newEntry: LogEntry = {
        mood, tags, text: sanitized, aiResponse: data,
        date: new Date().toISOString(),
      };
      const updated = [...logs, newEntry];
      setLogs(updated);
      if (currentUser) {
        localStorage.setItem(`manasvi_logs_${currentUser.id}`, JSON.stringify(updated));
      }

      // Reset form
      setJournal("");
      setTags([]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchWeeklyInsight = async () => {
    if (logs.length < 3 || loadingInsight) return;
    setLoadingInsight(true);
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logs }),
      });
      setWeeklyInsight(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoadingInsight(false); }
  };

  const containerV = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } } as const;
  const itemV = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 26 } } } as const;

  const TABS = [
    { id: "checkin" as Tab, label: "Check-in",  Icon: HeartPulse },
    { id: "companion" as Tab, label: "Companion", Icon: MessageCircle },
    { id: "meditate" as Tab, label: "Meditate",   Icon: Wind },
    { id: "insights" as Tab, label: "Insights",   Icon: BarChart2 },
    { id: "journey" as Tab,  label: "Journey",    Icon: BookOpen  },
  ];

  return (
    <div className="min-h-screen bg-[#f0f4f8] text-[#1e293b] font-sans overflow-x-hidden relative selection:bg-teal-200">

      {/* Overlays */}
      <AnimatePresence>
        {showCrisis && <CrisisScreen onDismiss={() => setShowCrisis(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {activeMeditation && (
          <MeditationSession sessionType={activeMeditation} onClose={() => setActiveMeditation(null)} />
        )}
      </AnimatePresence>

      {/* Background mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-200 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-orange-100 blur-[150px]" />
        <div className="absolute top-[30%] right-[5%] w-[30%] h-[30%] rounded-full bg-blue-100 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/60 border-b border-white/30 shadow-[0_4px_30px_rgba(0,0,0,0.04)]">
        <div className="flex justify-between items-center px-5 py-3 max-w-5xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center shadow-sm border border-teal-200">
              <User size={18} />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-none">{currentUser.name}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-none">Target: {currentUser.exam}</p>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-700 to-cyan-600 tracking-tight leading-none">
              Manasvi
            </h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wider">मन + अश्वि · Your Sanctuary</p>
          </div>
          <div className="flex items-center gap-3">
            {streak > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-orange-50 border border-orange-200 rounded-full">
                <Flame size={12} className="text-orange-500" />
                <span className="text-xs font-bold text-orange-600">{streak}d</span>
              </div>
            )}
            <button onClick={logout} title="Log Out"
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 flex items-center justify-center transition-colors border border-slate-200/50">
              <LogOut size={14} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex max-w-5xl mx-auto px-4 gap-1 pb-2">
          {TABS.map((tab) => (
            <motion.button key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileTap={{ scale: 0.96 }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-teal-600 text-white shadow-sm shadow-teal-200"
                  : "text-slate-500 hover:bg-slate-100"
              }`}>
              <tab.Icon size={12} />
              {tab.label}
            </motion.button>
          ))}
        </div>
      </header>

      <AnimatePresence mode="wait">

        {/* ════════════════ CHECK-IN TAB ════════════════ */}
        {activeTab === "checkin" && (
          <motion.main key="checkin" variants={containerV} initial="hidden" animate="show" exit={{ opacity: 0, y: -8 }}
            className="relative z-10 max-w-2xl mx-auto w-full px-4 py-5 flex flex-col gap-5">

            {/* Stats row */}
            {logs.length > 0 && (
              <motion.div variants={itemV} className="grid grid-cols-3 gap-3">
                {[
                  { Icon: Flame, label: "Streak", value: `${streak}d`, cls: "text-orange-500", bg: "bg-orange-50 border-orange-100" },
                  { Icon: TrendingUp, label: "Avg Mood (7d)", value: ltm.avgMood > 0 ? `${ltm.avgMood}/5` : "--", cls: "text-teal-600", bg: "bg-teal-50 border-teal-100" },
                  { Icon: Clock, label: "Total Entries", value: String(logs.length), cls: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
                ].map((s) => (
                  <div key={s.label} className={`${s.bg} border rounded-2xl p-3 flex items-center gap-2.5`}>
                    <s.Icon size={18} className={s.cls} />
                    <div>
                      <p className="text-base font-bold text-slate-800 leading-none">{s.value}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {!aiResponse ? (
              /* Check-In Inputs Stage */
              <div className="flex flex-col gap-5">
                {/* Mood picker */}
                <motion.section variants={itemV}
                  className="bg-white/80 backdrop-blur-md rounded-3xl p-5 shadow-sm border border-white">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">How are you feeling?</p>
                  <div className="flex justify-between items-end mb-2 px-1">
                    {[1,2,3,4,5].map((level, i) => (
                      <div key={level} className="flex flex-col items-center gap-1.5">
                        <motion.span
                          animate={{ scale: mood === level ? 1.5 : 1, opacity: mood === level ? 1 : 0.32, y: mood === level ? -6 : 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 18 }}
                          className="text-3xl cursor-pointer"
                          onClick={() => setMood(level)}
                        >{MOOD_EMOJIS[i]}</motion.span>
                        <motion.div
                          animate={{ opacity: mood === level ? 1 : 0, width: mood === level ? 20 : 0 }}
                          className="h-1 rounded-full"
                          style={{ backgroundColor: MOOD_COLORS[level - 1] }}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-center text-sm font-semibold mt-2" style={{ color: MOOD_COLORS[mood - 1] }}>
                    {MOOD_LABELS[mood - 1]}
                  </p>

                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-5 mb-3">What&apos;s contributing?</p>
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_TAGS.map((tag) => (
                      <motion.button key={tag} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                          tags.includes(tag) ? "bg-teal-600 text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}>
                        {tag}
                      </motion.button>
                    ))}
                  </div>
                </motion.section>

                {/* Journal */}
                <motion.section variants={itemV}
                  className="bg-white/80 backdrop-blur-md rounded-3xl p-5 shadow-sm border border-white flex flex-col">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <PenLine size={12} /> Journal
                  </p>
                  <textarea
                    className="w-full min-h-[120px] p-4 bg-slate-50/60 rounded-2xl border border-slate-200 focus:border-teal-400 focus:ring-4 focus:ring-teal-100 transition-all resize-none text-sm text-slate-700 placeholder:text-slate-400 outline-none"
                    placeholder="What's on your mind? This space is just for you..."
                    value={journal}
                    onChange={(e) => setJournal(e.target.value)}
                    maxLength={2000}
                  />
                  {rateLimitMsg && (
                    <p className="text-xs text-amber-700 mt-2 flex items-center gap-1.5">
                      <AlertTriangle size={12} /> {rateLimitMsg}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-slate-400">{journal.length}/2000</span>
                    <motion.button
                      whileHover={{ scale: !journal.trim() || isSubmitting ? 1 : 1.02 }}
                      whileTap={{ scale: !journal.trim() || isSubmitting ? 1 : 0.97 }}
                      onClick={handleSubmit}
                      disabled={!journal.trim() || isSubmitting}
                      className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-semibold text-xs py-2.5 px-5 rounded-xl flex items-center gap-1.5 shadow-md shadow-teal-200/50 disabled:opacity-50 disabled:cursor-not-allowed">
                      {isSubmitting
                        ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}><Sparkles size={14} /></motion.div>
                        : <Sparkles size={14} />}
                      {isSubmitting ? "Analyzing..." : "Get Support"}
                    </motion.button>
                  </div>
                </motion.section>

                {/* Breathing widget */}
                <motion.section variants={itemV}
                  className="bg-white/70 backdrop-blur-md rounded-3xl p-4 shadow-sm border border-white flex items-center gap-4 relative overflow-hidden">
                  <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                    <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.5, 0.2] }}
                      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 rounded-full bg-teal-300 blur-xl" />
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                      className="relative z-10 w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-teal-600">
                      <Wind size={18} />
                    </motion.div>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700 text-sm">Box Breathing</p>
                    <p className="text-xs text-slate-500 leading-snug mt-0.5">Inhale 4s · Hold 4s · Exhale 4s · Hold 4s</p>
                    <button onClick={() => setActiveMeditation("box")}
                      className="text-xs text-teal-600 font-semibold mt-1.5 hover:underline">Start guided session →</button>
                  </div>
                </motion.section>
              </div>
            ) : (
              /* AI Response & Support Stage */
              <div className="flex flex-col gap-5">
                {/* Compact check-in header */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-white shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{MOOD_EMOJIS[mood - 1]}</span>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Logged check-in</p>
                      <p className="text-sm font-semibold text-slate-700">Mood: {MOOD_LABELS[mood - 1]}</p>
                    </div>
                  </div>
                  <button onClick={() => setAiResponse(null)}
                    className="text-xs font-bold px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all">
                    New Check-In
                  </button>
                </motion.div>

                <AnimatePresence mode="wait">
                  <motion.div key="response"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 280, damping: 26 }}
                    className="flex flex-col gap-5"
                  >
                    {/* Reflection */}
                    <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-5 shadow-md border border-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-bl-full opacity-50 -z-0" />
                      <div className="flex items-start gap-3 relative z-10">
                        <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
                          <Brain size={20} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-800 mb-1">I hear you...</h3>
                          <p className="text-sm text-slate-600 leading-relaxed">{aiResponse.reflection}</p>
                        </div>
                      </div>
                      {aiResponse.emotions?.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Feelings Identified</p>
                          <div className="flex flex-wrap gap-1.5">
                            {aiResponse.emotions.map((e, i) => (
                              <motion.span key={e} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.07 }}
                                className="px-2.5 py-1 bg-orange-50 text-orange-700 rounded-lg text-xs font-semibold border border-orange-100">
                                {e}
                              </motion.span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Strategies */}
                    {aiResponse.strategies?.length > 0 && (
                      <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-5 shadow-sm border border-white">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Personalized Suggestions</p>
                        <div className="space-y-2">
                          {aiResponse.strategies.map((s: Strategy, i) => {
                            const Icon = ICON_MAP[s.icon] || BookOpen;
                            const style = STRATEGY_STYLE[s.type] || { card: "bg-slate-50 border-slate-100 text-slate-700", icon: "bg-slate-100 text-slate-600" };
                            return (
                              <motion.div key={`${s.title}-${i}`}
                                initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.09 }}
                                whileHover={{ x: 3 }}
                                className={`flex items-start gap-3 p-3 rounded-2xl border ${style.card} transition-transform`}
                              >
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${style.icon}`}>
                                  <Icon size={15} />
                                </div>
                                <div>
                                  <p className="text-xs font-bold">{s.title}</p>
                                  <p className="text-xs opacity-75 leading-snug mt-0.5">{s.description}</p>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Cognitive Bandwidth Meter */}
                    {aiResponse.cognitiveDeclutter && (
                      <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-5 shadow-sm border border-white">
                        <div className="flex justify-between items-center mb-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cognitive Bandwidth Meter</p>
                          {aiResponse.cognitiveDeclutter.unlocked && (
                            <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Cognitive Space Unlocked
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${aiResponse.cognitiveDeclutter.score}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full"
                              />
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-semibold">
                              <span>Intrusive Thoughts</span>
                              <span>Bandwidth Free: {aiResponse.cognitiveDeclutter.score}%</span>
                            </div>
                          </div>
                        </div>
                        {aiResponse.cognitiveDeclutter.unlocked && (
                          <div className="mt-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-3 text-xs text-emerald-800 leading-relaxed">
                            <p className="font-bold mb-0.5">🧠 Peak Focus Window Open</p>
                            Your working memory is optimized right now. This is your peak window to tackle that tough physics, math, or analytical section you&apos;ve been putting off!
                            {aiResponse.cognitiveDeclutter.insightWords?.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1 items-center">
                                <span className="text-[10px] text-slate-400 font-semibold mr-1">Insight transitions:</span>
                                {aiResponse.cognitiveDeclutter.insightWords.map(w => (
                                  <span key={w} className="bg-white px-1.5 py-0.5 rounded border text-[10px] font-semibold text-emerald-700">{w}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Self-Doubt Reframer */}
                    {aiResponse.selfDoubtReframer && aiResponse.selfDoubtReframer.detectedDistortion !== "None detected" && (
                      <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-5 shadow-sm border border-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-rose-50 rounded-bl-full opacity-40 -z-0" />
                        <div className="relative z-10">
                          <div className="flex items-center gap-1.5 mb-2.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Self-Doubt Reframer</span>
                            <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {aiResponse.selfDoubtReframer.detectedDistortion} detected
                            </span>
                          </div>
                          <div className="p-3 bg-rose-50/50 rounded-2xl border border-rose-100/50 text-xs text-slate-600 mb-3 italic">
                            &ldquo;{journal || "Your self-critical thoughts"}&rdquo;
                          </div>
                          <div className="p-3.5 bg-gradient-to-r from-teal-55 to-emerald-55 rounded-2xl border border-teal-100 text-xs text-teal-900 leading-relaxed font-medium">
                            <p className="font-bold text-teal-800 mb-1">💡 Compassionate Reframe (Neff&apos;s 3 Pillars)</p>
                            {aiResponse.selfDoubtReframer.compassionateReframe}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Threat-to-Challenge appraisal pivot */}
                    {aiResponse.appraisalState && (
                      <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-5 shadow-sm border border-white">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Stress Appraisal Balance</p>
                        <div className="grid grid-cols-2 gap-4 text-center mb-3">
                          <div className="bg-rose-50 border border-rose-100 p-2.5 rounded-2xl">
                            <p className="text-xs text-slate-500 font-semibold leading-none">Threat appraisal</p>
                            <p className="text-2xl font-black text-rose-600 mt-1">{aiResponse.appraisalState.threatLevel}/10</p>
                          </div>
                          <div className="bg-teal-50 border border-teal-100 p-2.5 rounded-2xl">
                            <p className="text-xs text-slate-500 font-semibold leading-none">Challenge appraisal</p>
                            <p className="text-2xl font-black text-teal-600 mt-1">{aiResponse.appraisalState.challengeLevel}/10</p>
                          </div>
                        </div>
                        {aiResponse.appraisalState.threatLevel > aiResponse.appraisalState.challengeLevel && (
                          <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-2xl text-xs text-amber-905 leading-relaxed">
                            <p className="font-bold text-amber-800 mb-1">🎯 Appraisal Pivot Plan</p>
                            {aiResponse.appraisalState.focusPivotText}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Anxiety-to-Action Blueprint */}
                    {aiResponse.ifThenBlueprint && aiResponse.ifThenBlueprint.triggers?.length > 0 && (
                      <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-5 shadow-sm border border-white">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">If-Then Action Blueprint</p>
                        <div className="space-y-2">
                          {aiResponse.ifThenBlueprint.triggers.map((trigger, idx) => (
                            <div key={`${trigger.condition}-${idx}`} className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                                {idx + 1}
                              </span>
                              <div className="leading-relaxed">
                                <p className="text-slate-500 font-semibold">IF: <span className="text-slate-800">{trigger.condition}</span></p>
                                <p className="text-teal-700 font-bold mt-0.5">THEN: <span>{trigger.action}</span></p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mindfulness */}
                    {aiResponse.mindfulness?.shouldShow && aiResponse.mindfulness.steps?.length > 0 && (
                      <div className="bg-violet-50 border border-violet-100 rounded-3xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
                            <Wind size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-violet-800">{aiResponse.mindfulness.title}</p>
                            <p className="text-[10px] text-violet-500">{aiResponse.mindfulness.duration}</p>
                          </div>
                        </div>
                        <ol className="space-y-1.5">
                          {aiResponse.mindfulness.steps.map((step, i) => (
                            <li key={`${step}-${i}`} className="flex items-start gap-2 text-xs text-violet-800">
                              <span className="w-5 h-5 rounded-full bg-violet-200 text-violet-700 font-bold flex items-center justify-center shrink-0 text-[10px]">{i+1}</span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* Motivation + Focus */}
                    {aiResponse.motivation && (
                      <div className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl border border-teal-100 relative">
                        <Quote size={18} className="absolute top-3 right-3 text-teal-200/60" />
                        <p className="text-sm text-teal-800 font-medium italic leading-relaxed pr-5">&ldquo;{aiResponse.motivation}&rdquo;</p>
                      </div>
                    )}
                    {aiResponse.weeklyFocus && (
                      <div className="px-4 py-3 bg-violet-50 rounded-2xl border border-violet-100 flex items-start gap-2">
                        <TrendingUp size={14} className="text-violet-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-violet-800 leading-snug">
                          <span className="font-bold">This week: </span>{aiResponse.weeklyFocus}
                        </p>
                      </div>
                    )}

                    {/* Meditation CTA */}
                    <motion.button
                      whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      onClick={() => setActiveMeditation(recommendedSession)}
                      className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl text-white hover:from-teal-900 hover:to-teal-800 transition-all"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                        <Play size={18} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold">{MEDITATION_SESSIONS[recommendedSession].name}</p>
                        <p className="text-xs text-white/60">{MEDITATION_SESSIONS[recommendedSession].tagline}</p>
                      </div>
                      <div className="ml-auto text-xs text-white/50 font-medium">
                        {MEDITATION_SESSIONS[recommendedSession].duration}
                      </div>
                    </motion.button>
                  </motion.div>
                </AnimatePresence>
                {/* Reset button at the bottom of the feed */}
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setAiResponse(null)}
                  className="w-full py-4 bg-slate-200 hover:bg-slate-350 text-slate-700 font-semibold text-xs rounded-2xl transition-all shadow-sm">
                  Start Another Check-In
                </motion.button>
              </div>
            )}
          </motion.main>
        )}

        {/* ════════════════ COMPANION TAB ════════════════ */}
        {activeTab === "companion" && (
          <motion.main key="companion" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="relative z-10 max-w-5xl mx-auto w-full px-4 py-5 h-[calc(100vh-100px)]">
            <CompanionChat currentUser={currentUser} logs={logs} />
          </motion.main>
        )}

        {/* ════════════════ MEDITATE TAB ════════════════ */}
        {activeTab === "meditate" && (
          <motion.main key="meditate" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="relative z-10 max-w-5xl mx-auto w-full px-4 py-5">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-800">Guided Sessions</h2>
              <p className="text-sm text-slate-500 mt-0.5">Choose a session, or let Manasvi guide you to the right one.</p>
            </div>

            {lastEntry && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-3xl p-5 mb-5 text-white flex items-center justify-between shadow-lg shadow-teal-200">
                <div>
                  <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">Recommended for you</p>
                  <p className="text-xl font-light">{MEDITATION_SESSIONS[recommendedSession].name}</p>
                  <p className="text-white/70 text-sm mt-0.5">{MEDITATION_SESSIONS[recommendedSession].tagline}</p>
                </div>
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => setActiveMeditation(recommendedSession)}
                  className="w-14 h-14 rounded-2xl bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center shrink-0">
                  <Play size={24} />
                </motion.button>
              </motion.div>
            )}

            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">All Sessions</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.values(MEDITATION_SESSIONS) as typeof MEDITATION_SESSIONS[keyof typeof MEDITATION_SESSIONS][]).map((s, i) => (
                <motion.button key={s.id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveMeditation(s.id)}
                  className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-white shadow-sm flex items-center gap-4 text-left hover:shadow-md transition-all"
                >
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: `linear-gradient(135deg, ${s.gradient[0]}, ${s.gradient[1]})` }}>
                    {(() => { const Icon = SESSION_ICONS[s.id] || Wind; return <Icon size={22} className="text-white/80" />; })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm">{s.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{s.tagline}</p>
                  </div>
                  <span className="text-xs text-slate-400 font-medium shrink-0">{s.duration}</span>
                </motion.button>
              ))}
            </div>
          </motion.main>
        )}

        {/* ════════════════ INSIGHTS TAB ════════════════ */}
        {activeTab === "insights" && (
          <motion.main key="insights" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="relative z-10 max-w-5xl mx-auto w-full px-4 py-5 space-y-5">

            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <BarChart2 size={40} className="mb-3 opacity-30" />
                <p className="text-base font-semibold text-slate-500">No data yet</p>
                <p className="text-sm mt-1 text-center max-w-xs">Complete your first check-in to start building your insights.</p>
              </div>
            ) : (
              <>
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { Icon: Flame, label: "Streak", value: `${streak}d`, cls: "text-orange-500", bg: "bg-orange-50 border-orange-100" },
                    { Icon: TrendingUp, label: "Avg Mood", value: ltm.avgMood > 0 ? `${ltm.avgMood}/5` : "--", cls: "text-teal-600", bg: "bg-teal-50 border-teal-100" },
                    { Icon: Clock, label: "Entries", value: String(logs.length), cls: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
                  ].map((s) => (
                    <div key={s.label} className={`${s.bg} border rounded-2xl p-3 flex items-center gap-2.5`}>
                      <s.Icon size={18} className={s.cls} />
                      <div>
                        <p className="text-base font-bold text-slate-800 leading-none">{s.value}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mood chart */}
                <div className="bg-white/80 backdrop-blur-md rounded-3xl p-5 border border-white shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">14-Day Mood Trend</p>
                  <MoodChart logs={logs} />
                  <div className="flex items-center justify-between mt-3 px-1">
                    <p className="text-xs text-slate-500">
                      Trend: <span className={ltm.moodTrend === "improving" ? "text-green-600 font-semibold" : ltm.moodTrend === "declining" ? "text-red-500 font-semibold" : "text-slate-600 font-semibold"}>
                        {ltm.moodTrend === "improving" ? "📈 Improving" : ltm.moodTrend === "declining" ? "📉 Declining" : "→ Stable"}
                      </span>
                    </p>
                    <p className="text-xs text-slate-400">Avg: {ltm.avgMood}/5</p>
                  </div>
                </div>

                {/* Emotion frequency + triggers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {ltm.topEmotions.length > 0 && (
                    <div className="bg-white/80 backdrop-blur-md rounded-3xl p-5 border border-white shadow-sm">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Most Felt This Week</p>
                      <div className="space-y-2">
                        {ltm.topEmotions.slice(0, 5).map((e, i) => (
                          <div key={e} className="flex items-center gap-2">
                            <span className="text-xs text-slate-600 w-24 truncate">{e}</span>
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${100 - i * 18}%` }}
                                transition={{ delay: i * 0.1 }}
                                className="h-full bg-orange-400 rounded-full" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {ltm.topTriggers.length > 0 && (
                    <div className="bg-white/80 backdrop-blur-md rounded-3xl p-5 border border-white shadow-sm">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Common Triggers</p>
                      <div className="flex flex-wrap gap-2">
                        {ltm.topTriggers.map((t, i) => (
                          <motion.span key={t} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.06 }}
                            className="px-3 py-1 bg-rose-50 text-rose-700 rounded-lg text-xs font-semibold border border-rose-100">
                            {t}
                          </motion.span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Subconscious Stress Matrix Tracker */}
                <div className="bg-white/80 backdrop-blur-md rounded-3xl p-5 border border-white shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Subconscious Stress Matrix (7-day Average)</p>
                  <div className="space-y-3">
                    {[
                      {
                        label: "Somatic Stress (Physical symptoms, fatigue, sleep depth)",
                        score: logs.slice(-7).reduce((acc, l) => acc + (l.aiResponse?.stressMatrix?.somatic || 0), 0) / Math.min(logs.length, 7),
                        color: "from-rose-500 to-red-400",
                        tip: "Common somatic exam stressors include tight shoulders, jaw bracing, or shallow breathing. Focus on physical release."
                      },
                      {
                        label: "Social/Comparison Pressure (Peer comparison, mock ranks, parental expectations)",
                        score: logs.slice(-7).reduce((acc, l) => acc + (l.aiResponse?.stressMatrix?.social || 0), 0) / Math.min(logs.length, 7),
                        color: "from-amber-500 to-orange-400",
                        tip: "Social pressure often targets self-worth. Remember, practice mock ranks do not define final output."
                      },
                      {
                        label: "Time-Anxiety (Backlog panic, lack of hours, countdown pressure)",
                        score: logs.slice(-7).reduce((acc, l) => acc + (l.aiResponse?.stressMatrix?.time || 0), 0) / Math.min(logs.length, 7),
                        color: "from-teal-500 to-cyan-400",
                        tip: "Time-anxiety builds when focusing on size instead of system. Use tiny If-Then blocks to reset."
                      }
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                          <span>{item.label}</span>
                          <span>{item.score.toFixed(1)}/10</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.score * 10}%` }}
                            transition={{ duration: 1 }}
                            className={`h-full bg-gradient-to-r ${item.color} rounded-full`}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug mt-0.5 italic">{item.tip}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Emotion Compass */}
                {recentEmotions.length > 0 && (
                  <div className="bg-white/80 backdrop-blur-md rounded-3xl p-5 border border-white shadow-sm">
                    <EmotionCompass emotions={recentEmotions} />
                  </div>
                )}

                {/* Weekly AI Narrative */}
                <div className="bg-white/80 backdrop-blur-md rounded-3xl p-5 border border-white shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Weekly AI Narrative</p>
                    <motion.button whileTap={{ scale: 0.96 }} onClick={fetchWeeklyInsight}
                      disabled={logs.length < 3 || loadingInsight}
                      className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1.5 disabled:opacity-40">
                      {loadingInsight
                        ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}><Sparkles size={12}/></motion.div>
                        : <Sparkles size={12}/>}
                      {weeklyInsight ? "Refresh" : "Generate"}
                    </motion.button>
                  </div>
                  {weeklyInsight ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{weeklyInsight.narrative}</p>
                      {weeklyInsight.strength && (
                        <div className="p-3 bg-teal-50 rounded-xl border border-teal-100">
                          <p className="text-xs font-bold text-teal-700 mb-1">💪 Strength spotted</p>
                          <p className="text-xs text-teal-800">{weeklyInsight.strength}</p>
                        </div>
                      )}
                      {weeklyInsight.nextWeekFocus && (
                        <div className="p-3 bg-violet-50 rounded-xl border border-violet-100">
                          <p className="text-xs font-bold text-violet-700 mb-1">→ Next week</p>
                          <p className="text-xs text-violet-800">{weeklyInsight.nextWeekFocus}</p>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {logs.length < 3 ? "Add at least 3 journal entries to generate your personalized weekly narrative." : "Click Generate for a personalized AI reflection on your emotional arc this week."}
                    </p>
                  )}
                </div>
              </>
            )}
          </motion.main>
        )}

        {/* ════════════════ JOURNEY TAB ════════════════ */}
        {activeTab === "journey" && (
          <motion.main key="journey" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="relative z-10 max-w-5xl mx-auto w-full px-4 py-5">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <BookOpen size={40} className="mb-3 opacity-30" />
                <p className="text-base font-semibold text-slate-500">Your journey starts here</p>
                <p className="text-sm mt-1 text-center max-w-xs">Each journal entry becomes a chapter in your wellness story.</p>
                <button onClick={() => setActiveTab("checkin")}
                  className="mt-5 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors">
                  Start Check-In
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-slate-700">Your Journey</h2>
                  <span className="text-xs text-slate-400">{logs.length} entries · tap to expand</span>
                </div>
                <div className="space-y-3">
                  {[...logs].reverse().map((entry, i) => (
                    <HistoryCard key={entry.date} entry={entry} index={i} />
                  ))}
                </div>
              </>
            )}
          </motion.main>
        )}

      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  const { currentUser, logout, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen />;
  }

  return <DashboardContent key={currentUser.id} currentUser={currentUser} logout={logout} />;
}
