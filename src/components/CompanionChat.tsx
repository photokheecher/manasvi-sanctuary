"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, User, Bot, Loader2, Sparkles } from "lucide-react";
import type { LogEntry, UserProfile } from "@/types";

interface Message {
  role: "user" | "model";
  content: string;
}

import { useChat } from "ai/react";

export default function CompanionChat({
  currentUser,
  logs,
}: {
  currentUser: UserProfile;
  logs: LogEntry[];
}) {
  const [isMounted, setIsMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    body: {
      currentUser,
      logs,
    },
    initialMessages: (() => {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(`manasvi_chat_${currentUser.id}`);
        if (stored) return JSON.parse(stored);
      }
      return [
        {
          id: "welcome",
          role: "assistant",
          content: `Hi ${currentUser.name.split(" ")[0]}! I'm Manasvi. I'm here to listen and help you through your ${currentUser.exam} prep journey. How are you feeling right now?`
        }
      ];
    })()
  });

  useEffect(() => {
    queueMicrotask(() => {
      setIsMounted(true);
    });
  }, []);

  // Save to local storage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`manasvi_chat_${currentUser.id}`, JSON.stringify(messages));
    }
  }, [messages, currentUser.id]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isMounted) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[600px] max-h-[80vh] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-gradient-to-r from-teal-50 to-emerald-50">
        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 shadow-sm">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-bold text-slate-800">Manasvi Companion</h2>
          <p className="text-xs text-teal-600 font-medium">Always here for you</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
        {messages.map((msg: any, i: number) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={i}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === "user"
                  ? "bg-teal-500 text-white"
                  : "bg-white border border-teal-100 text-teal-500 shadow-sm"
              }`}
            >
              {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-teal-500 text-white rounded-tr-none shadow-sm"
                  : "bg-white text-slate-700 border border-slate-100 rounded-tl-none shadow-sm"
              }`}
            >
              {msg.content.split("\n").map((line: string, j: number) => (
                <p key={j} className={j > 0 ? "mt-2" : ""}>
                  {line}
                </p>
              ))}
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-100">
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            disabled={isLoading}
            className="w-full bg-slate-50 border border-slate-200 rounded-full py-3 pl-5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all disabled:opacity-50 text-slate-800"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2 bg-teal-500 text-white rounded-full hover:bg-teal-600 disabled:opacity-50 disabled:hover:bg-teal-500 transition-colors"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
