"use client";
/**
 * MeditationSession — Full-screen animated guided meditation overlay
 *
 * Sessions: 4-7-8 Breathing, Box Breathing, Body Scan, Focus (Pomodoro), Gratitude Bloom
 * Each session is auto-recommended based on the user's mood and detected emotions.
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, Wind, Heart, Focus, Sunrise, ChevronRight, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { SESSIONS, type SessionType } from "@/lib/sessions";

// Re-export so page.tsx can still do: import { SESSIONS } from this file if needed
export { SESSIONS, type SessionType };

// Icons mapped per session type (client-only)
const SESSION_ICONS: Record<SessionType, React.ComponentType<{ size?: number; className?: string }>> = {
  breathing_478: Wind,
  box: Wind,
  bodyscan: Sunrise,
  focus: Focus,
  gratitude: Heart,
};

// ─── Speech Engine ────────────────────────────────────────────────────────────
function speak(text: string, isMuted: boolean) {
  if (isMuted || typeof window === "undefined" || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.82; // slightly slower, calmer pacing
    utterance.pitch = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith("en") && v.name.toLowerCase().includes("natural")) ||
                  voices.find(v => v.lang.startsWith("en")) ||
                  voices[0];
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.error("SpeechSynthesis error:", e);
  }
}

interface BreathingPhase {
  label: string;
  instruction: string;
  seconds: number;
  targetScale: number;
  color: string;
}

const BREATHING_478_PHASES: BreathingPhase[] = [
  { label: "Inhale", instruction: "Breathe in deeply through your nose", seconds: 4, targetScale: 1.55, color: "#2dd4bf" },
  { label: "Hold", instruction: "Hold your breath, relaxing your face", seconds: 7, targetScale: 1.55, color: "#818cf8" },
  { label: "Exhale", instruction: "Sigh out slowly through your mouth", seconds: 8, targetScale: 0.8, color: "#67e8f9" },
];

const BOX_PHASES: BreathingPhase[] = [
  { label: "Inhale", instruction: "Breathe in slowly, filling your chest", seconds: 4, targetScale: 1.5, color: "#818cf8" },
  { label: "Hold", instruction: "Suspend your breath peacefully", seconds: 4, targetScale: 1.5, color: "#a78bfa" },
  { label: "Exhale", instruction: "Breath out smoothly and completely", seconds: 4, targetScale: 0.85, color: "#60a5fa" },
  { label: "Hold", instruction: "Rest in the empty stillness", seconds: 4, targetScale: 0.85, color: "#818cf8" },
];

const BODY_SCAN_STEPS = [
  { at: 0, text: "Close your eyes. Bring your awareness to your feet. Feel the weight resting on the ground." },
  { at: 30, text: "Move your attention up to your shins, calves, and knees. Release any tightness you feel here." },
  { at: 90, text: "Focus now on your thighs and hips. Let them soften into your chair with every breath." },
  { at: 150, text: "Gently notice your lower back, upper back, and stomach. Soften the core of your body." },
  { at: 210, text: "Bring attention to your shoulders, arms, and hands. Allow your shoulders to drop." },
  { at: 260, text: "Finally, relax your jaw, your forehead, and the muscles around your eyes. Rest in absolute quiet." },
];

const GRATITUDE_PROMPTS = [
  "Write down one simple comfort you are grateful for today (e.g., a warm cup of tea, a comfortable chair).",
  "Write down one person in your preparation journey who helped or supported you recently.",
  "Write down one small thing you appreciate about your own mind or resilience today."
];

const PARTICLE_POSITIONS = [
  { top: "15%", left: "10%" },
  { top: "25%", left: "80%" },
  { top: "70%", left: "15%" },
  { top: "85%", left: "75%" },
  { top: "50%", left: "90%" },
  { top: "40%", left: "5%" },
];

// ─── Recommendation Logic ─────────────────────────────────────────────────────

export function getRecommendedSession(mood: number, emotions: string[]): SessionType {
  const lower = emotions.map((e) => e.toLowerCase());
  if (mood <= 2 || lower.some((e) => ["anxiety", "panic", "overwhelm", "fear"].some(k => e.includes(k)))) return "breathing_478";
  if (lower.some((e) => ["burnout", "exhaustion", "fatigue", "tired"].some(k => e.includes(k)))) return "bodyscan";
  if (lower.some((e) => ["hopelessness", "self-doubt", "lonely", "sadness"].some(k => e.includes(k)))) return "gratitude";
  if (mood >= 4) return "focus";
  return "box";
}

// ─── Sub-renderers ───────────────────────────────────────────────────────────

function BreathingVisual({ phases, totalCycles, isMuted }: {
  phases: BreathingPhase[];
  totalCycles: number;
  isMuted: boolean;
}) {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [cycle, setCycle] = useState(1);
  const [timeLeft, setTimeLeft] = useState(phases[0].seconds);
  const [completed, setCompleted] = useState(false);

  const phase = phases[phaseIdx];

  const advancePhase = useCallback(() => {
    setPhaseIdx((prev) => {
      const next = prev + 1;
      if (next >= phases.length) {
        setCycle((c) => {
          if (c >= totalCycles) { setCompleted(true); return c; }
          setPhaseIdx(0);
          setTimeLeft(phases[0].seconds);
          return c + 1;
        });
        return prev;
      }
      setTimeLeft(phases[next].seconds);
      return next;
    });
  }, [phases, totalCycles]);

  useEffect(() => {
    if (completed) {
      speak("Breathing exercise complete. Well done.", isMuted);
    } else {
      speak(`${phase.label}. ${phase.instruction}`, isMuted);
    }
  }, [phaseIdx, cycle, completed, isMuted, phase.label, phase.instruction]);

  useEffect(() => {
    if (completed) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(interval); advancePhase(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phaseIdx, cycle, completed, advancePhase]);

  const RING = 120;
  const circumference = 2 * Math.PI * RING;
  const ringOffset = circumference * (timeLeft / phase.seconds);

  if (completed) {
    return (
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center gap-6 text-white text-center">
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: 2, duration: 0.5 }}
          className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center">
          <CheckCircle size={48} className="text-white" />
        </motion.div>
        <h2 className="text-3xl font-light">Well done</h2>
        <p className="text-white/70 max-w-xs leading-relaxed">
          You completed {totalCycles} breathing cycles. Your nervous system is more regulated now.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Main orb + ring */}
      <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
        {/* Ambient glow */}
        <motion.div
          animate={{ scale: phase.targetScale * 1.2, opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: phase.seconds, ease: "easeInOut" }}
          style={{ position: "absolute", inset: 0, borderRadius: "50%", backgroundColor: phase.color, filter: "blur(50px)" }}
        />
        {/* SVG progress ring */}
        <svg width={280} height={280} style={{ position: "absolute", top: 0, left: 0 }}>
          <circle cx={140} cy={140} r={RING} fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.12" />
          <motion.circle
            cx={140} cy={140} r={RING} fill="none"
            stroke={phase.color} strokeWidth="4" strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={ringOffset}
            transform="rotate(-90 140 140)"
            style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.8s ease" }}
          />
        </svg>
        {/* Breathing orb */}
        <motion.div
          animate={{ scale: phase.targetScale }}
          transition={{ duration: phase.seconds, ease: [0.4, 0, 0.2, 1] }}
          style={{ position: "absolute", width: 120, height: 120, borderRadius: "50%", backgroundColor: phase.color + "55" }}
        />
        {/* Center text */}
        <div style={{ position: "relative", zIndex: 10, textAlign: "center" }}>
          <motion.p
            key={timeLeft}
            initial={{ opacity: 0.6 }} animate={{ opacity: 1 }}
            style={{ color: "white", fontSize: 52, fontWeight: 200, lineHeight: 1 }}
          >{timeLeft}</motion.p>
          <AnimatePresence mode="wait">
            <motion.p key={phase.label}
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 6, fontWeight: 400, letterSpacing: "0.05em" }}
            >{phase.label}</motion.p>
          </AnimatePresence>
        </div>
      </div>
      {/* Instruction */}
      <AnimatePresence mode="wait">
        <motion.p key={phase.label}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          className="text-white/70 text-base text-center max-w-xs font-light"
        >{phase.instruction}</motion.p>
      </AnimatePresence>
      {/* Cycle counter */}
      <div className="flex items-center gap-2">
        {Array.from({ length: totalCycles }).map((_, i) => (
          <motion.div key={i}
            animate={{ scale: i + 1 === cycle ? 1.3 : 1, opacity: i + 1 <= cycle ? 1 : 0.3 }}
            className="w-2 h-2 rounded-full bg-white"
          />
        ))}
      </div>
    </div>
  );
}

function BodyScanVisual({ isMuted }: { isMuted: boolean }) {
  const [elapsed, setElapsed] = useState(0);
  const [completed, setCompleted] = useState(false);
  const totalDuration = 300;

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => {
        if (prev >= totalDuration) { clearInterval(interval); setCompleted(true); return prev; }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentStep = [...BODY_SCAN_STEPS].reverse().find((s) => elapsed >= s.at) || BODY_SCAN_STEPS[0];
  const progress = elapsed / totalDuration;

  useEffect(() => {
    if (completed) {
      speak("Body scan complete. Gently open your eyes whenever you are ready. You did amazing.", isMuted);
    } else {
      speak(currentStep.text, isMuted);
    }
  }, [currentStep.at, currentStep.text, completed, isMuted]);

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-sm">
      {/* Body silhouette with traveling highlight */}
      <div className="relative h-64 w-40">
        {/* Gradient orb that travels down */}
        <motion.div
          animate={{ top: `${progress * 80}%` }}
          transition={{ duration: 1, ease: "linear" }}
          style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", width: 80, height: 80,
            borderRadius: "50%", backgroundColor: "#c084fc50", filter: "blur(30px)" }}
        />
        {/* Simplified body outline using divs */}
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, paddingTop: 8 }}>
          {/* Head */}
          <div style={{ width: 36, height: 36, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.25)" }} />
          {/* Neck */}
          <div style={{ width: 12, height: 12, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 4 }} />
          {/* Torso */}
          <div style={{ width: 52, height: 80, border: "2px solid rgba(255,255,255,0.25)", borderRadius: 12 }} />
          {/* Hips */}
          <div style={{ width: 44, height: 20, border: "2px solid rgba(255,255,255,0.25)", borderRadius: 8 }} />
          {/* Legs */}
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ width: 18, height: 50, border: "2px solid rgba(255,255,255,0.25)", borderRadius: 8 }} />
            <div style={{ width: 18, height: 50, border: "2px solid rgba(255,255,255,0.25)", borderRadius: 8 }} />
          </div>
        </div>
      </div>
      {/* Current prompt */}
      <AnimatePresence mode="wait">
        <motion.p key={currentStep.at}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="text-white/80 text-sm text-center max-w-xs leading-relaxed"
        >{completed ? "Body scan complete. Gently wiggle your fingers and return to the room. 🌿" : currentStep.text}</motion.p>
      </AnimatePresence>
      {/* Progress bar */}
      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div animate={{ width: `${progress * 100}%` }} transition={{ duration: 1 }}
          className="h-full bg-purple-400 rounded-full" />
      </div>
    </div>
  );
}

function FocusVisual({ onComplete }: { onComplete: () => void }) {
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(true);
  const [completed, setCompleted] = useState(false);
  const totalSeconds = 25 * 60;

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) { clearInterval(interval); setCompleted(true); onComplete(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running, onComplete]);

  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  const progress = 1 - seconds / totalSeconds;
  const RING = 110;
  const circumference = 2 * Math.PI * RING;

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="relative flex items-center justify-center" style={{ width: 270, height: 270 }}>
        <svg width={270} height={270} style={{ position: "absolute" }}>
          <circle cx={135} cy={135} r={RING} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
          <circle cx={135} cy={135} r={RING} fill="none" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={circumference * (1 - progress)}
            transform="rotate(-90 135 135)"
            style={{ transition: "stroke-dashoffset 0.9s linear" }}
          />
        </svg>
        {/* Ambient */}
        <motion.div animate={{ opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 4, repeat: Infinity }}
          style={{ position: "absolute", inset: 0, borderRadius: "50%", backgroundColor: "#f59e0b", filter: "blur(60px)" }} />
        <div style={{ position: "relative", zIndex: 10, textAlign: "center" }}>
          <p style={{ color: "white", fontSize: 56, fontWeight: 100, letterSpacing: "0.05em", lineHeight: 1 }}>{mins}:{secs}</p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {completed ? "Session Complete!" : "Deep Focus"}
          </p>
        </div>
      </div>
      <button onClick={() => setRunning(r => !r)}
        className="flex items-center gap-2 px-6 py-3 bg-white/10 rounded-2xl text-white text-sm hover:bg-white/20 transition-colors">
        {running ? <Pause size={16}/> : <Play size={16}/>}
        {running ? "Pause" : "Resume"}
      </button>
      <p className="text-white/50 text-xs text-center max-w-xs">Work on one thing. No phone, no tabs. When the timer ends, take a 5-minute break.</p>
    </div>
  );
}

function GratitudeVisual({ isMuted }: { isMuted: boolean }) {
  const [promptIdx, setPromptIdx] = useState(0);
  const [responses, setResponses] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [completed, setCompleted] = useState(false);
  const [bloom, setBloom] = useState(false);

  useEffect(() => {
    if (completed) {
      speak("Your gratitude cycle is complete. Shift back into study mode with a calm mind.", isMuted);
    } else {
      speak(GRATITUDE_PROMPTS[promptIdx], isMuted);
    }
  }, [promptIdx, completed, isMuted]);

  const handleSubmit = () => {
    if (!current.trim()) return;
    const newResponses = [...responses, current.trim()];
    setResponses(newResponses);
    setCurrent("");
    setBloom(true);
    setTimeout(() => {
      setBloom(false);
      if (promptIdx + 1 >= GRATITUDE_PROMPTS.length) { setCompleted(true); }
      else { setPromptIdx(idx => idx + 1); }
    }, 1200);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
      {/* Bloom animation */}
      <div className="relative w-32 h-32 flex items-center justify-center">
        <AnimatePresence>
          {bloom && (
            <>
              {[0, 60, 120, 180, 240, 300].map((angle) => (
                <motion.div key={angle}
                  initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                  animate={{ scale: 1, x: Math.cos((angle * Math.PI) / 180) * 60, y: Math.sin((angle * Math.PI) / 180) * 60, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  style={{ position: "absolute", width: 12, height: 12, borderRadius: "50%", backgroundColor: "#fb923c" }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
        <motion.div animate={{ scale: [1, 1.1, 1], opacity: bloom ? 1 : 0.7 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-20 h-20 rounded-full bg-orange-400/30 flex items-center justify-center">
          <Heart size={32} className="text-orange-300" />
        </motion.div>
      </div>

      {completed ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4">
          <CheckCircle size={40} className="text-orange-300 mx-auto" />
          <h3 className="text-xl font-light text-white">Beautiful</h3>
          <div className="space-y-2">
            {GRATITUDE_PROMPTS.map((p, i) => (
              <div key={i} className="text-left bg-white/10 rounded-xl p-3">
                <p className="text-white/50 text-xs mb-1">{p}</p>
                <p className="text-white/90 text-sm">{responses[i]}</p>
              </div>
            ))}
          </div>
        </motion.div>
      ) : (
        <>
          <div className="text-center">
            <p className="text-white/50 text-xs mb-2">{promptIdx + 1} of {GRATITUDE_PROMPTS.length}</p>
            <AnimatePresence mode="wait">
              <motion.p key={promptIdx}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="text-white text-base leading-relaxed max-w-xs"
              >{GRATITUDE_PROMPTS[promptIdx]}</motion.p>
            </AnimatePresence>
          </div>
          <textarea
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            placeholder="Write anything that comes to mind..."
            className="w-full h-24 p-4 bg-white/10 rounded-2xl text-white placeholder-white/30 text-sm resize-none outline-none border border-white/20 focus:border-orange-400/50 focus:bg-white/15 transition-all"
          />
          <button onClick={handleSubmit}
            disabled={!current.trim()}
            className="flex items-center gap-2 px-8 py-3 bg-orange-500/80 text-white rounded-2xl text-sm font-medium hover:bg-orange-500 disabled:opacity-40 transition-colors">
            Reflect <ChevronRight size={16} />
          </button>
        </>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MeditationSession({
  sessionType,
  onClose,
}: {
  sessionType: SessionType;
  onClose: () => void;
}) {
  const session = SESSIONS[sessionType];
  const [started, setStarted] = useState(false);
  const [focusComplete, setFocusComplete] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const bgGradient = `linear-gradient(135deg, ${session.gradient[0]} 0%, ${session.gradient[1]} 100%)`;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ background: bgGradient }}
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
    >
      {/* Floating particles */}
      {PARTICLE_POSITIONS.map((pos, i) => (
        <motion.div key={i}
          animate={{ y: [0, -20, 0], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 4 + i * 0.8, repeat: Infinity, delay: i * 0.4 }}
          style={{ position: "absolute", ...pos, width: 6, height: 6,
            borderRadius: "50%", backgroundColor: session.accentColor, filter: "blur(1px)" }}
        />
      ))}

      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-10 pb-4 relative z-10">
        <div>
          <p className="text-white/50 text-xs uppercase tracking-widest font-medium">{session.duration}</p>
          <h2 className="text-xl font-light text-white">{session.name}</h2>
        </div>
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsMuted(m => !m)}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-all">
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-all">
            <X size={20} />
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        {!started ? (
          /* Intro screen */
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-8 text-center">
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center"
              style={{ backgroundColor: session.accentColor + "25", border: `2px solid ${session.accentColor}40` }}>
              {(() => { const Icon = SESSION_ICONS[sessionType]; return <Icon size={40} className="text-white/80" />; })()}
            </div>
            <div>
              <h3 className="text-3xl font-extralight text-white mb-2">{session.name}</h3>
              <p className="text-white/60 text-sm max-w-xs leading-relaxed">{session.tagline}</p>
              <p className="text-white/40 text-xs mt-3">Good for: {session.forWhen}</p>
            </div>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setStarted(true)}
              style={{ backgroundColor: session.accentColor + "30", borderColor: session.accentColor + "60" }}
              className="flex items-center gap-3 px-10 py-4 rounded-2xl border text-white font-medium text-base">
              <Play size={18} /> Begin
            </motion.button>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-6 w-full">
            {sessionType === "focus" && focusComplete ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-4 max-w-sm">
                <CheckCircle size={48} className="text-amber-300 mx-auto" />
                <h3 className="text-2xl font-light text-white">Focus Block Complete!</h3>
                <p className="text-white/80 text-sm leading-relaxed">
                  Excellent work. You completed your 25-minute Pomodoro study sprint. Time to take a 5-minute break to refresh your mind.
                </p>
              </motion.div>
            ) : (
              <>
                {sessionType === "breathing_478" && <BreathingVisual phases={BREATHING_478_PHASES} totalCycles={4} isMuted={isMuted} />}
                {sessionType === "box" && <BreathingVisual phases={BOX_PHASES} totalCycles={5} isMuted={isMuted} />}
                {sessionType === "bodyscan" && <BodyScanVisual isMuted={isMuted} />}
                {sessionType === "focus" && <FocusVisual onComplete={() => setFocusComplete(true)} />}
                {sessionType === "gratitude" && <GratitudeVisual isMuted={isMuted} />}
              </>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
