"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [mood, setMood] = useState(3);
  const [tags, setTags] = useState<string[]>([]);
  const [journal, setJournal] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiResponse, setAiResponse] = useState<any>(null);

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const availableTags = [
    "Mock test result",
    "Syllabus pressure",
    "Lack of sleep",
    "Feeling prepared",
    "Family pressure",
  ];

  const handleSubmit = async () => {
    if (!journal.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood, tags, text: journal }),
      });
      const data = await res.json();
      setAiResponse(data);
      // Save to local storage for persistence
      const logs = JSON.parse(localStorage.getItem("logs") || "[]");
      logs.push({ mood, tags, text: journal, aiResponse: data, date: new Date() });
      localStorage.setItem("logs", JSON.stringify(logs));
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen font-body-md antialiased flex flex-col relative pb-32 md:pb-0">
      <header className="w-full top-0 sticky bg-surface dark:bg-background shadow-[0px_4px_20px_rgba(45,125,142,0.05)] z-40 transition-all duration-300 ease-in-out">
        <div className="flex justify-between items-center px-md py-sm max-w-[1200px] mx-auto">
          <div className="flex items-center gap-sm">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-headline-md text-headline-md hover:opacity-80 transition-opacity cursor-pointer overflow-hidden">
              <span className="material-symbols-outlined text-[20px]">person</span>
            </div>
          </div>
          <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-primary dark:text-primary-fixed-dim text-center tracking-tight font-extrabold flex-1">
            Manasvi Sanctuary
          </h1>
          <button aria-label="Settings" className="w-10 h-10 flex items-center justify-center text-on-surface-variant dark:text-outline-variant hover:opacity-80 transition-opacity">
            <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>settings</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 md:px-md py-lg grid grid-cols-1 md:grid-cols-12 gap-md md:gap-md items-start">
        <div className="col-span-1 md:col-span-7 flex flex-col gap-lg">
          <div className="mb-sm mt-4">
            <h2 className="font-headline-md text-headline-md text-on-background mb-2">How are you feeling right now?</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Take a moment to pause and reflect. Your feelings are valid.</p>
          </div>

          <section className="bg-surface-container-lowest rounded-[16px] p-md ambient-shadow border border-surface-container-low relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-error via-secondary-container to-primary opacity-80"></div>
            <h3 className="font-label-sm text-label-sm text-outline mb-6 uppercase tracking-wider">Current Stress Level</h3>
            <div className="flex justify-between items-center mb-4 px-2">
              <span className={`text-3xl transition-transform ${mood === 1 ? 'scale-125 opacity-100' : 'opacity-50'}`}>😫</span>
              <span className={`text-3xl transition-transform ${mood === 2 ? 'scale-125 opacity-100' : 'opacity-50'}`}>😟</span>
              <span className={`text-3xl transition-transform ${mood === 3 ? 'scale-125 opacity-100' : 'opacity-50'}`}>😐</span>
              <span className={`text-3xl transition-transform ${mood === 4 ? 'scale-125 opacity-100' : 'opacity-50'}`}>🙂</span>
              <span className={`text-3xl transition-transform ${mood === 5 ? 'scale-125 opacity-100' : 'opacity-50'}`}>😌</span>
            </div>
            <div className="px-2 mb-8">
              <input 
                className="w-full" 
                id="moodSlider" 
                max="5" 
                min="1" 
                type="range" 
                value={mood} 
                onChange={(e) => setMood(Number(e.target.value))} 
              />
            </div>
            
            <h4 className="font-label-sm text-label-sm text-outline mb-3">Context Tags (Select all that apply)</h4>
            <div className="flex flex-wrap gap-sm no-scrollbar pb-2">
              {availableTags.map((tag) => (
                <button 
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-4 py-2 rounded-full font-label-sm text-label-sm border border-surface-variant focus:outline-none transition-colors ${
                    tags.includes(tag) 
                    ? "bg-primary-container text-on-primary-container" 
                    : "bg-surface-container text-on-surface hover:bg-secondary-container hover:text-on-secondary-container"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </section>

          <section className="bg-surface-container-lowest rounded-[16px] p-md ambient-shadow border border-surface-container-low flex flex-col mt-4">
            <h3 className="font-label-sm text-label-sm text-outline mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">edit_note</span> Write your heart out
            </h3>
            <div className="relative mb-6">
              <textarea 
                className="w-full min-h-[160px] p-4 bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-y font-body-md text-body-md text-on-surface placeholder:text-outline/60" 
                placeholder="What's on your mind? This space is just for you..."
                value={journal}
                onChange={(e) => setJournal(e.target.value)}
              ></textarea>
            </div>
            <div className="flex justify-end">
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting || !journal.trim()}
                className="bg-primary hover:bg-primary/90 text-on-primary font-label-sm text-label-sm py-3 px-6 rounded-[8px] flex items-center gap-2 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {isSubmitting ? "hourglass_empty" : "spa"}
                </span>
                {isSubmitting ? "Thinking..." : "Get Support"}
              </button>
            </div>
          </section>
        </div>

        <div className="col-span-1 md:col-span-5 flex flex-col gap-lg mt-4 md:mt-0">
          
          {aiResponse ? (
            <section className="bg-surface-container-lowest rounded-[16px] p-md ambient-shadow border border-surface-container-low relative isolate">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-secondary-container/20 rounded-full blur-2xl -z-10"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-container/10 rounded-full blur-xl -z-10"></div>
              
              <div className="flex items-start gap-4 mb-6 border-b border-surface-variant pb-4">
                <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1", fontSize: "24px" }}>volunteer_activism</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface">I hear you...</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-1">{aiResponse.reflection}</p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-label-sm text-label-sm text-outline mb-3 uppercase tracking-wider">Identified Feelings</h4>
                <div className="flex flex-wrap gap-2">
                  {aiResponse.emotions?.map((emotion: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-error-container text-on-error-container rounded-full font-label-sm text-label-sm text-[12px] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">psychiatry</span> {emotion}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <h4 className="font-label-sm text-label-sm text-outline mb-3 uppercase tracking-wider">Gentle Suggestions</h4>
                <ul className="space-y-3">
                  {aiResponse.strategies?.map((strategy: string, i: number) => (
                    <li key={i} className="flex items-center gap-3 p-3 bg-surface rounded-lg border border-surface-variant/50 hover:bg-surface-variant/30 transition-colors cursor-pointer">
                      <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                        <span className="material-symbols-outlined text-[18px]">self_improvement</span>
                      </div>
                      <span className="font-body-md text-body-md text-on-surface text-[14px]">{strategy}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {aiResponse.motivation && (
                <div className="mt-4 p-4 bg-primary-container/20 rounded-lg border border-primary/20 text-on-surface italic text-sm">
                  "{aiResponse.motivation}"
                </div>
              )}
            </section>
          ) : (
            <section className="bg-surface-container-lowest rounded-[16px] p-md ambient-shadow border border-surface-container-low flex flex-col items-center justify-center py-10 overflow-hidden relative opacity-60">
               <span className="material-symbols-outlined text-[48px] text-outline mb-4">support_agent</span>
               <p className="text-center text-outline">Write your entry to receive personalized support.</p>
            </section>
          )}

          <section className="bg-surface-container-lowest rounded-[16px] p-md ambient-shadow border border-surface-container-low flex flex-col items-center justify-center py-10 overflow-hidden relative mt-4">
            <h3 className="font-label-sm text-label-sm text-outline absolute top-4 left-md uppercase tracking-wider">Take a Breath</h3>
            <div className="relative w-48 h-48 flex items-center justify-center mt-6">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-secondary-container to-primary-container opacity-20 blur-xl animate-breath"></div>
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-inverse-primary to-surface-tint opacity-40 blur-md animate-breath" style={{ animationDelay: "1s" }}></div>
              <div className="relative z-10 w-24 h-24 rounded-full bg-surface-container-lowest shadow-[0_0_30px_rgba(45,125,142,0.3)] flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[32px]">air</span>
              </div>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant mt-8 text-center px-4">
              Inhale slowly...<br/>Exhale fully...
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
