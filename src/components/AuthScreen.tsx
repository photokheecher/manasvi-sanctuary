"use client";
/**
 * AuthScreen — Auth entry point
 * Glassmorphic login/signup panel with mock student selector buttons for testing.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Sparkles, User, Mail, Lock, BookOpen } from "lucide-react";

export default function AuthScreen() {
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [exam, setExam] = useState("JEE");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (isLogin) {
      const success = login(email, password);
      if (!success) setErrorMsg("Invalid credentials. Try our quick login buttons below!");
    } else {
      if (!name || !email || !password) {
        setErrorMsg("Please fill out all fields.");
        return;
      }
      const success = signup(name, email, password, exam);
      if (!success) setErrorMsg("Email already in use.");
    }
  };

  const handleQuickLogin = (mEmail: string, mPass: string) => {
    login(mEmail, mPass);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] p-6 relative overflow-hidden">
      {/* Background mesh shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-200 blur-[120px] opacity-40" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-orange-100 blur-[150px] opacity-40" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full border border-white shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mb-3 border border-teal-200">
            <Sparkles size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Welcome to Manasvi</h1>
          <p className="text-xs text-slate-400 mt-1">Empathetic GenAI Wellness Partner for Student Success</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <User size={16} className="absolute left-4 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-teal-400 focus:ring-4 focus:ring-teal-100 outline-none transition-all text-slate-800"
              />
            </div>
          )}

          <div className="relative">
            <Mail size={16} className="absolute left-4 top-3.5 text-slate-400" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-teal-400 focus:ring-4 focus:ring-teal-100 outline-none transition-all text-slate-800"
            />
          </div>

          <div className="relative">
            <Lock size={16} className="absolute left-4 top-3.5 text-slate-400" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-teal-400 focus:ring-4 focus:ring-teal-100 outline-none transition-all text-slate-800"
            />
          </div>

          {!isLogin && (
            <div className="relative">
              <BookOpen size={16} className="absolute left-4 top-3.5 text-slate-400" />
              <select
                value={exam}
                onChange={(e) => setExam(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-teal-400 focus:ring-4 focus:ring-teal-100 outline-none transition-all text-slate-700 appearance-none font-semibold"
              >
                <option value="JEE">Preparing for JEE</option>
                <option value="NEET">Preparing for NEET</option>
                <option value="UPSC">Preparing for UPSC</option>
                <option value="GATE">Preparing for GATE</option>
                <option value="CAT">Preparing for CAT</option>
              </select>
            </div>
          )}

          {errorMsg && (
            <p className="text-xs text-rose-600 font-semibold px-1">{errorMsg}</p>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-colors shadow-lg shadow-teal-200/50 text-sm"
          >
            {isLogin ? "Sign In" : "Register"}
          </button>
        </form>

        <div className="text-center mt-4">
          <button
            onClick={() => { setIsLogin(!isLogin); setErrorMsg(""); }}
            className="text-xs text-teal-600 font-bold hover:underline"
          >
            {isLogin ? "Need an account? Sign up here" : "Have an account? Login here"}
          </button>
        </div>

        {/* Quick evaluation accounts */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">
            Quick-Login Student Profiles (For Evaluator)
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Rahul (JEE)", email: "rahul@manasvi.edu", pass: "rahul123" },
              { label: "Priya (NEET)", email: "priya@manasvi.edu", pass: "priya123" },
              { label: "Aarav (UPSC)", email: "aarav@manasvi.edu", pass: "aarav123" },
            ].map((user) => (
              <button
                key={user.label}
                onClick={() => handleQuickLogin(user.email, user.pass)}
                className="px-2 py-2 bg-slate-100 hover:bg-teal-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 hover:text-teal-700 hover:border-teal-200 transition-all text-center leading-tight"
              >
                {user.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
