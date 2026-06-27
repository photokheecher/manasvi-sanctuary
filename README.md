# Manasvi: GenAI-Powered Mental Wellness Tracker

## 1. Chosen Vertical
**Mental Wellness Tracker for Competitive Exams**
This project addresses the severe stress, burnout, and self-doubt experienced by students preparing for high-stakes board exams and competitive entrance tests (e.g., NEET, JEE, CUET, CAT, GATE, UPSC). "Manasvi" acts as an empathetic, always-available digital companion that uses Generative AI to monitor, analyze, and support a student's mental well-being.

## 2. Approach and Logic
Standard trackers often miss the nuances of emotional patterns because they rely solely on rigid multiple-choice answers or simple numbered ratings. Manasvi combines quantitative data (a 1-5 stress level slider and context tags) with qualitative data (open-ended daily journaling).

**The Logic:**
1. **Data Collection:** Students log their current mood, select relevant context tags (e.g., "Mock test result", "Syllabus pressure"), and write a free-form journal entry.
2. **AI Analysis:** The journal entry and context are securely sent to the Gemini 1.5 Flash model.
3. **Hyper-Personalized Support:** The AI acts as an empathetic companion, analyzing the text to uncover hidden stress triggers and emotional patterns. It responds with:
   - An empathetic reflection of the student's feelings.
   - Identified core emotions.
   - Tailored coping strategies (e.g., CBT/ACT techniques).
   - Sensory and nutritional suggestions (e.g., aromatherapy, lo-fi music, specific hydration/food).
   - Grounded motivational encouragement.
4. **Local Persistence:** All data is saved to the browser's `localStorage`, ensuring a fast, lightweight, and private experience without the need for complex database setups.

## 3. How the Solution Works
- **Frontend:** Built with Next.js (App Router) and Tailwind CSS v4. The UI is designed with a "Serene Academic Core" aesthetic (calming teal and soft peach) to visually lower cortisol levels.
- **Backend/AI:** A Next.js API Route (`/api/journal`) securely communicates with the Gemini API using the `@google/genai` SDK.
- **State Management:** React hooks (`useState`) manage the interactive components (sliders, context tags), and logs are persisted locally.
- **Accessibility & UX:** The application features responsive design, clear contrast ratios, interactive hover states, and a built-in breathing animation module for immediate anxiety relief.

### Running Locally
1. Clone the repository.
2. Navigate to the project directory: `cd manasvi`
3. Install dependencies: `npm install`
4. Create a `.env.local` file in the root directory and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
5. Start the development server: `npm run dev`
6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 4. Assumptions Made
- **API Availability:** It is assumed that the user has a valid Google Gemini API key to process the journal entries.
- **Local Storage Scope:** For the purpose of this MVP, it is assumed that persisting user data in `localStorage` provides sufficient privacy and performance. A production application would migrate to a secure, encrypted database with user authentication.
- **Target Audience:** The application assumes the user is a student in the Indian education ecosystem (e.g., JEE, NEET), meaning the AI is prompted to provide culturally and contextually relevant advice (though it adapts to any input).
- **Not a Medical Device:** The AI acts as a supportive companion, not a replacement for professional psychiatric or therapeutic help.
