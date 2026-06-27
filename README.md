# Manasvi: GenAI-Powered Mental Wellness Tracker

## 1. Chosen Vertical
**Mental Wellness Tracker for Competitive Exams**
This project addresses the severe stress, burnout, and self-doubt experienced by students preparing for high-stakes board exams and competitive entrance tests (e.g., NEET, JEE, CUET, CAT, GATE, UPSC). "Manasvi" acts as an empathetic, always-available digital companion that uses Generative AI to monitor, analyze, and support a student's mental well-being.

---

## 2. Approach and Logic
Standard trackers often miss the nuances of emotional patterns because they rely solely on rigid multiple-choice answers or simple numbered ratings. Manasvi combines quantitative data (a 1-5 stress level slider and context tags) with qualitative data (open-ended daily journaling) to deliver clinically grounded psychological tools.

### 5 Core Psychological Frameworks Implemented:
1. **Cognitive De-cluttering (Klein & Boals, 2001):** Analyzes narrative coherence and tracks cause/insight transitions (*because, understand, realize, therefore*) to measure "Cognitive Bandwidth unlocked %" in real-time, highlighting a student's peak studying window.
2. **Hidden Trigger Mapping (Pennebaker, 1997):** Entity-extraction stress matrix analyzing somatic stress (fatigue, sleep depth), social/comparison pressure (mock test ranks, peer comparison), and time-anxiety (backlogs, countdown panic) across a rolling 7-day window.
3. **Self-Doubt Reframer (Neff, 2003):** Identifies cognitive distortions (catastrophizing, all-or-nothing thinking, overgeneralization) and reframes them using Neff's 3 pillars (Self-kindness, Common Humanity, Mindfulness).
4. **Threat-to-Challenge appraisal pivot (Lazarus & Folkman, 1984):** Tracks threat vs. challenge levels. If threat dominates, the AI intervenes with a focus pivot suggestion to look at the exam as a conquerable puzzle.
5. **Anxiety-to-Action Blueprint (Gollwitzer, 1999):** Constructs automated behavioral "If-Then" triggers to lower the cognitive load of decision-making and bypass analysis paralysis.

---

## 3. How the Solution Works

### 🧠 3-Tier Personalization Memory
Unlike standard AI companions that treat each check-in as isolated, Manasvi maintains a local memory context injected into every prompt:
- **Short-Term Memory (STM):** The last 5 raw journal entries and emotions to preserve conversation/state continuity.
- **Long-Term Memory (LTM):** Synthesized user patterns including average mood, top triggers, top emotions, and previously recommended strategies (to avoid repetitive suggestions).
- **Episodic Memory:** Automatically stores significant breakthroughs, high points, low points, and crisis flag triggers to maintain contextual continuity over weeks.

### 🧘 Interactive Meditation & Focus Sessions
Features a custom animated overlay offering 5 distinct exercises based on mood and emotional analysis:
- **4-7-8 Breathing (Anxiety/Panic):** Animated expanding orb regulating breath to lower high physiological arousal.
- **Box Breathing (Stress/Frustration):** 4s box cycle with step indicators.
- **Body Scan (Burnout/Exhaustion):** Timed relaxation prompts guided by a moving body highlight.
- **25-Min Focus (Distraction/Study Backlogs):** A custom Pomodoro study timer with ambient particles to keep students focused.
- **Gratitude Bloom (Self-doubt/Hopelessness):** A guided three-step positive-focus prompt that blooms visual feedback on completion.

### 📊 Insights Dashboard & UI Components
- **14-Day Mood Trend Line Chart:** Renders mood history with average mood reference lines and interactive tooltips.
- **Emotion Compass:** A lookup library for 11 exam-related emotions (Anxiety, imposter syndrome, etc.), translating abstract feelings into plain-language psychological explanations, comfort notes, and micro-actions.
- **Cognitive Bandwidth Meter:** Displays real-time working memory capacity freed during the current session.
- **If-Then Blueprint:** Lists automated behavior triggers created specifically for the student's study blocks.

---

## 4. Technical Architecture
- **Frontend:** Built with Next.js (App Router), Tailwind CSS v4, and Recharts. The UI is designed with a "Serene Academic Core" glassmorphism aesthetic to visually lower cortisol levels.
- **Backend/AI:** A Next.js API Route (`/api/journal`) securely communicates with the Gemini API using the `@google/genai` SDK and enforces strict structured output schemas.
- **Guardrails:** Synchronous client-side crisis detection (checking 30+ keywords in English/Hindi/Hinglish) with immediate helpline overlays, prompt injection sanitization, rate limiting, and fallback schemas.
- **Authentication & Multi-User Support:** Built-in React Context auth system managing signup, login, session states, and logging out. Multi-user logs are completely isolated via user-specific namespace hashing (`manasvi_logs_${userId}`).
- **Quick Evaluator Access:** Exposes pre-populated evaluation accounts (JEE, NEET, UPSC) loaded with 3-5 days of mock journal history, stress matrices, and trends to allow instant evaluation without signing up.
- **Testing:** Comprehensive test suite containing 77 unit and integration tests verifying crisis detection boundaries, sanitization, response schemas, memory correctness, and auth credentials logic.

### Running Locally
1. Clone the repository.
2. Navigate to the project directory: `cd manasvi`
3. Install dependencies: `npm install`
4. Create a `.env.local` file in the root directory and add your Gemini API Key and Model:
   ```env
   GEMINI_API_KEY=your_api_key_here
   GEMINI_MODEL=gemini-flash-latest
   ```
5. Start the development server: `npm run dev`
6. Open [http://localhost:3000](http://localhost:3000) in your browser.
7. Run tests: `npm test`

---

## 5. Assumptions Made
- **API Availability:** It is assumed that the user has a valid Google Gemini API key to process the journal entries.
- **Local Storage Scope:** For the purpose of this MVP, it is assumed that persisting user data in `localStorage` provides sufficient privacy and performance. A production application would migrate to a secure, encrypted database with user authentication.
- **Target Audience:** The application assumes the user is a student in the Indian education ecosystem (e.g., JEE, NEET), meaning the AI is prompted to provide culturally and contextually relevant advice (though it adapts to any input).
- **Not a Medical Device:** The AI acts as a supportive companion, not a replacement for professional psychiatric or therapeutic help.
