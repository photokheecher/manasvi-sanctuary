"use client";
/**
 * AuthContext — Manages user state, login, signup, logout
 * Pre-populates 3 dummy users (JEE, NEET, UPSC) with mock journal history.
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import type { UserProfile, LogEntry } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextType {
  currentUser: UserProfile | null;
  login: (email: string, pass: string) => boolean;
  signup: (name: string, email: string, pass: string, exam: string) => boolean;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Mock Data Generators ──────────────────────────────────────────────────────

const MOCK_STRATEGIES = [
  { type: "coping", icon: "brain", title: "CBT Box Reframe", description: "Identify the absolute worst case scenario and list 3 realistic alternatives." },
  { type: "music", icon: "music", title: "Study Focus Waves", description: "Search 'Weightless by Marconi Union' on Spotify — shown to lower anxiety." },
  { type: "aroma", icon: "wind", title: "Peppermint Boost", description: "Inhale peppermint oil from wrists to stimulate the central nervous system." },
  { type: "food", icon: "coffee", title: "Almonds & Honey", description: "A handful of soaked almonds provides magnesium to stabilize mood." },
  { type: "reading", icon: "book", title: "Atomic Systems", description: "Read atomic systems chapter in Atomic Habits — focus on setup, not goals." }
];

const buildMockLogs = (exam: string): LogEntry[] => {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  if (exam === "JEE") {
    // Somatic + Time stress theme
    return [
      {
        mood: 2,
        tags: ["Mock test result", "Lack of sleep"],
        text: "Got 120/300 in yesterday's mock test. Feel like I don't remember any formulas in physics. Slept for only 4 hours because I was panicking about backlogs.",
        date: new Date(now - 4 * day).toISOString(),
        aiResponse: {
          reflection: "I hear you. Balancing poor sleep with mock scores is incredibly draining, especially when formulas slip away.",
          emotions: ["Anxiety", "Overwhelm", "Fatigue"],
          crisisFlag: false,
          strategies: [MOCK_STRATEGIES[0], MOCK_STRATEGIES[1], MOCK_STRATEGIES[3]],
          mindfulness: { shouldShow: true, title: "Box Breathing", duration: "3 minutes", steps: ["Inhale 4s", "Hold 4s", "Exhale 4s", "Hold 4s"] },
          motivation: "Keep going, Rahul. A mock score is practice diagnostic data, not your final JEE rank.",
          weeklyFocus: "Prioritize 7 hours of sleep over extra practice sets.",
          cognitiveDeclutter: { score: 40, unlocked: false, insightWords: [] },
          stressMatrix: { somatic: 7, social: 4, time: 8 },
          selfDoubtReframer: { detectedDistortion: "All-or-nothing", compassionateReframe: "Missing formulas during a stressed mock test is a normal reaction to sleep debt. It means you need rest, not that you cannot crack JEE." },
          appraisalState: { threatLevel: 8, challengeLevel: 3, focusPivotText: "Let's treat physics formulas as puzzle blocks today." },
          ifThenBlueprint: { triggers: [{ condition: "I feel stuck on a physics formula", action: "I will open my cheat sheet immediately instead of guessing." }] }
        }
      },
      {
        mood: 3,
        tags: ["Revision stress"],
        text: "Spent the whole day practicing integration. It is starting to make sense but I still feel like I am running out of time. My backlog in chemistry is massive.",
        date: new Date(now - 2 * day).toISOString(),
        aiResponse: {
          reflection: "Good work on integration. Tackling complex integration blocks takes real focus. The backlog is there, but you are moving.",
          emotions: ["Stress", "Hope", "Determination"],
          crisisFlag: false,
          strategies: [MOCK_STRATEGIES[0], MOCK_STRATEGIES[2], MOCK_STRATEGIES[4]],
          mindfulness: { shouldShow: false, title: "", duration: "", steps: [] },
          motivation: "Step by step is the only way to build a top rank. You're tackling the math blocks systematically.",
          weeklyFocus: "Keep chemistry backlogs scheduled for Saturdays only to avoid daily panic.",
          cognitiveDeclutter: { score: 65, unlocked: true, insightWords: ["because", "understand"] },
          stressMatrix: { somatic: 4, social: 3, time: 7 },
          selfDoubtReframer: { detectedDistortion: "None detected", compassionateReframe: "You are active and learning." },
          appraisalState: { threatLevel: 5, challengeLevel: 6, focusPivotText: "Backlogs are just tasks. Let's schedule them." },
          ifThenBlueprint: { triggers: [{ condition: "I worry about chemistry backlog during math", action: "I will write the topic on my Saturday list and get back to math." }] }
        }
      }
    ];
  } else if (exam === "NEET") {
    // Social / comparison pressure theme
    return [
      {
        mood: 2,
        tags: ["Peer comparison", "Family pressure"],
        text: "Sharma uncle's daughter got 680 in her mock test. My parents keep asking me why I am stuck at 550. I feel like I'm letting everyone down and I will fail to get a govt seat.",
        date: new Date(now - 3 * day).toISOString(),
        aiResponse: {
          reflection: "That parent comparison hurts. Peer scores are external noise, but they feel so close and personal right now.",
          emotions: ["Guilt", "Self-doubt", "Anxiety"],
          crisisFlag: false,
          strategies: [MOCK_STRATEGIES[0], MOCK_STRATEGIES[1], MOCK_STRATEGIES[4]],
          mindfulness: { shouldShow: true, title: "Mindful Grounding", duration: "4 minutes", steps: ["Notice feet on floor", "Observe breathing rhythm", "Let comparison thoughts float away"] },
          motivation: "Your path to NEET is yours alone. 550 is a solid baseline with room to unlock growth.",
          weeklyFocus: "Focus on your error analysis notebook rather than others' scores.",
          cognitiveDeclutter: { score: 35, unlocked: false, insightWords: [] },
          stressMatrix: { somatic: 4, social: 8, time: 5 },
          selfDoubtReframer: { detectedDistortion: "Catastrophizing", compassionateReframe: "Your mock score is a diagnostic tool, not your worth to your family. Comparison doesn't make you study faster; self-kindness does." },
          appraisalState: { threatLevel: 7, challengeLevel: 4, focusPivotText: "Let's pivot attention back to our biology charts." },
          ifThenBlueprint: { triggers: [{ condition: "My parents ask about mock scores", action: "I will say: I am working on my error tracker to bring it up, and return to my desk." }] }
        }
      }
    ];
  }

  // UPSC aspirant mock logs
  return [
    {
      mood: 4,
      tags: ["Achieved target", "Feeling prepared"],
      text: "Finished mapping the geography core syllabus today. Answer writing practice went well. Still some revision stress, but I feel structured.",
      date: new Date(now - 1 * day).toISOString(),
      aiResponse: {
        reflection: "Excellent progress. Finishing geography core targets gives a strong structural anchor to your prep.",
        emotions: ["Confidence", "Relief", "Focus"],
        crisisFlag: false,
        strategies: [MOCK_STRATEGIES[2], MOCK_STRATEGIES[4]],
        mindfulness: { shouldShow: false, title: "", duration: "", steps: [] },
        motivation: "You are structuring your days like a top ranker. Keep this steady momentum.",
        weeklyFocus: "Maintain answer writing blocks every morning.",
        cognitiveDeclutter: { score: 85, unlocked: true, insightWords: ["realize", "therefore"] },
        stressMatrix: { somatic: 2, social: 2, time: 3 },
        selfDoubtReframer: { detectedDistortion: "None detected", compassionateReframe: "You are pacing yourself perfectly." },
        appraisalState: { threatLevel: 2, challengeLevel: 8, focusPivotText: "Geography is clear. Ready for history tomorrow." },
        ifThenBlueprint: { triggers: [{ condition: "I finish my geography block", action: "I will stand up and walk for 5 minutes before opening history." }] }
      }
    }
  ];
};

// ─── Provider Component ────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Check if dummy users exist in localStorage, if not initialize them
    const existingUsers = localStorage.getItem("manasvi_users");
    if (!existingUsers) {
      const dummyUsers = [
        { id: "user_rahul", name: "Rahul Sharma", email: "rahul@manasvi.edu", pass: "rahul123", exam: "JEE" },
        { id: "user_priya", name: "Priya Patel", email: "priya@manasvi.edu", pass: "priya123", exam: "NEET" },
        { id: "user_aarav", name: "Aarav Mehta", email: "aarav@manasvi.edu", pass: "aarav123", exam: "UPSC" },
      ];
      localStorage.setItem("manasvi_users", JSON.stringify(dummyUsers));

      // Populate their logs
      dummyUsers.forEach((u) => {
        const logs = buildMockLogs(u.exam);
        localStorage.setItem(`manasvi_logs_${u.id}`, JSON.stringify(logs));
      });
    }

    // 2. Check if there's a logged-in user session
    const loggedIn = localStorage.getItem("manasvi_current_user");
    if (loggedIn) {
      setCurrentUser(JSON.parse(loggedIn));
    }
    setIsLoading(false);
  }, []);

  const login = (email: string, pass: string): boolean => {
    const users = JSON.parse(localStorage.getItem("manasvi_users") || "[]");
    const found = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.pass === pass);
    if (found) {
      const profile: UserProfile = { id: found.id, name: found.name, email: found.email, exam: found.exam };
      setCurrentUser(profile);
      localStorage.setItem("manasvi_current_user", JSON.stringify(profile));
      return true;
    }
    return false;
  };

  const signup = (name: string, email: string, pass: string, exam: string): boolean => {
    const users = JSON.parse(localStorage.getItem("manasvi_users") || "[]");
    if (users.some((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
      return false; // Email already registered
    }

    const newUser = { id: `user_${Date.now()}`, name, email, pass, exam };
    users.push(newUser);
    localStorage.setItem("manasvi_users", JSON.stringify(users));

    const profile: UserProfile = { id: newUser.id, name: newUser.name, email: newUser.email, exam: newUser.exam };
    setCurrentUser(profile);
    localStorage.setItem("manasvi_current_user", JSON.stringify(profile));
    // Create empty log array for new user
    localStorage.setItem(`manasvi_logs_${newUser.id}`, JSON.stringify([]));
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("manasvi_current_user");
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
