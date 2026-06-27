"use client";
/**
 * MoodChart — Area chart for 14-day mood trend
 * Uses Recharts with gradient fill. Client-only.
 */

import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from "recharts";
import type { LogEntry } from "@/types";

const MOOD_EMOJIS = ["😫", "😟", "😐", "🙂", "😌"];
const MOOD_LABELS = ["Overwhelmed", "Stressed", "Neutral", "Good", "Calm"];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      mood: number;
      fullDate: string;
      emotions?: string[];
      tags?: string[];
    };
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white rounded-2xl shadow-lg p-3.5 border border-slate-100 min-w-[140px]">
      <p className="text-2xl mb-1">{MOOD_EMOJIS[d.mood - 1]}</p>
      <p className="text-sm font-bold text-slate-800">{MOOD_LABELS[d.mood - 1]}</p>
      <p className="text-xs text-slate-500 mt-0.5">{d.fullDate}</p>
      {d.emotions && d.emotions.length > 0 && (
        <p className="text-xs text-teal-600 mt-1.5 font-medium">
          {d.emotions.slice(0, 2).join(" · ")}
        </p>
      )}
      {d.tags && d.tags.length > 0 && (
        <p className="text-xs text-slate-400 mt-0.5">{d.tags.slice(0, 2).join(", ")}</p>
      )}
    </div>
  );
}

interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: {
    mood: number;
  };
}

function CustomDot({ cx, cy, payload }: CustomDotProps) {
  if (!cx || !cy || !payload) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={5} fill="#0d9488" stroke="white" strokeWidth={2} />
      <text x={cx} y={cy - 10} textAnchor="middle" fontSize={14}>
        {MOOD_EMOJIS[payload.mood - 1]}
      </text>
    </g>
  );
}

export default function MoodChart({ logs }: { logs: LogEntry[] }) {
  const chartData = logs.slice(-14).map((l) => ({
    date: new Date(l.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
    fullDate: new Date(l.date).toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" }),
    mood: l.mood,
    tags: l.tags,
    emotions: l.aiResponse?.emotions,
  }));

  if (chartData.length < 2) {
    return (
      <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
        Log at least 2 entries to see your mood trend
      </div>
    );
  }

  const avg = chartData.reduce((s, d) => s + d.mood, 0) / chartData.length;

  return (
    <div className="w-full h-52">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 20, right: 10, left: -28, bottom: 0 }}>
          <defs>
            <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0d9488" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickLine={false} axisLine={false}
          />
          <YAxis
            domain={[1, 5]} ticks={[1, 2, 3, 4, 5]}
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickLine={false} axisLine={false}
          />
          <ReferenceLine
            y={avg} stroke="#0d9488" strokeDasharray="4 4" strokeOpacity={0.4}
            label={{ value: `Avg ${avg.toFixed(1)}`, position: "right", fontSize: 9, fill: "#0d9488" }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone" dataKey="mood"
            stroke="#0d9488" strokeWidth={2.5}
            fill="url(#moodGrad)"
            dot={<CustomDot />}
            activeDot={{ r: 7, fill: "#0d9488", stroke: "white", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
