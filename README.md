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
- **Frontend:** Built with Next.js (App Router), Tailwind CSS v4, and Recharts. The UI is designed with a "Serene Academic Core" glassmorphism aesthetic to visually lower cortisol levels.
- **Backend/AI:** A Next.js API Route (`/api/journal`) securely communicates with the Gemini API using the `@google/genai` SDK and enforces strict structured output schemas.
- **Guardrails:** Synchronous client-side crisis detection (checking 30+ keywords in English/Hindi/Hinglish) with immediate helpline overlays, prompt injection sanitization, rate limiting, and fallback schemas.
- **State Management:** Logs and psychological matrices are persisted securely via browser `localStorage`.
- **Testing:** Comprehensive test suite containing 70 unit and integration tests verifying crisis detection boundaries, sanitization, response schemas, and memory correctness.

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

## 4. Assumptions Made
- **API Availability:** It is assumed that the user has a valid Google Gemini API key to process the journal entries.
- **Local Storage Scope:** For the purpose of this MVP, it is assumed that persisting user data in `localStorage` provides sufficient privacy and performance. A production application would migrate to a secure, encrypted database with user authentication.
- **Target Audience:** The application assumes the user is a student in the Indian education ecosystem (e.g., JEE, NEET), meaning the AI is prompted to provide culturally and contextually relevant advice (though it adapts to any input).
- **Not a Medical Device:** The AI acts as a supportive companion, not a replacement for professional psychiatric or therapeutic help.
