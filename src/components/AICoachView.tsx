import React, { useState, useEffect, useRef } from "react";
import { 
  Send, 
  Sparkles, 
  Award, 
  Zap, 
  HelpCircle, 
  User, 
  BrainCircuit, 
  Flame, 
  ChevronRight,
  TrendingUp,
  Brain
} from "lucide-react";
import { CoachMessage, Task, ProductivityStats } from "../types";

interface AICoachViewProps {
  messages: CoachMessage[];
  tasks: Task[];
  stats: ProductivityStats | null;
  onSendMessage: (text: string) => Promise<void>;
  loading: boolean;
}

export default function AICoachView({
  messages,
  tasks,
  stats,
  onSendMessage,
  loading
}: AICoachViewProps) {
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    setSending(true);
    const text = inputText;
    setInputText("");

    try {
      await onSendMessage(text);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  // Determine Work Style Detection based on task composition
  const getWorkStyle = () => {
    const total = tasks.length;
    if (total === 0) return { label: "Fresh Slate", desc: "No active style profile detected yet." };
    
    const longTasks = tasks.filter(t => t.duration >= 4).length;
    const shortTasks = tasks.filter(t => t.duration <= 1.5).length;

    if (longTasks > shortTasks) {
      return { label: "🧠 Deep Worker", desc: "You thrive on extended, single-focused blocks of intense concentration." };
    } else if (shortTasks > longTasks) {
      return { label: "⚡ Quick Executor", desc: "You are elite at batching and crushing small, high-velocity tasks." };
    } else {
      return { label: "⚖️ Balanced Performer", desc: "You maintain equal competence in long projects and quick sprints." };
    }
  };

  const workStyle = getWorkStyle();

  // Dynamic Daily Challenge
  const getDailyChallenge = () => {
    const overdue = tasks.find(t => t.status === "pending" && new Date(t.deadline) < new Date("2026-06-29"));
    const dueToday = tasks.find(t => t.status === "pending" && t.deadline === "2026-06-29");
    
    if (overdue) {
      return `Neutralize Overdue Crisis: Finish "${overdue.title}" before 4:00 PM today!`;
    } else if (dueToday) {
      return `Today's Hard Lock: Secure "${dueToday.title}" to protect your Safety Score.`;
    } else {
      return "Maintain Clean Streak: Complete at least 2 structured subtasks today.";
    }
  };

  const handleSuggestionClick = async (text: string) => {
    if (sending || loading) return;
    setSending(true);
    setInputText("");
    try {
      await onSendMessage(text);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-140px)]">
      
      {/* Chat Area Panel (Left side) */}
      <div className="lg:col-span-8 bg-white/5 rounded-3xl border border-white/10 shadow-lg flex flex-col h-full overflow-hidden">
        
        {/* Chat Header */}
        <div className="bg-white/5 p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-500/10 text-violet-400 rounded-xl shrink-0">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold font-display text-white text-sm">AI Productivity Coach</h2>
              <span className="inline-flex items-center gap-1 text-[10px] text-violet-400 font-mono font-bold">
                ● ONLINE (CONTEXT ACTIVE)
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg text-slate-400">
            Powered by Gemini
          </span>
        </div>

        {/* Scrollable messages container */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 scroll-smooth">
          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-md ${
                msg.role === 'user' 
                  ? 'bg-violet-500/10 text-violet-400 border-violet-500/25' 
                  : 'bg-violet-600 text-white border-violet-700'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
              </div>

              {/* Text Balloon */}
              <div className={`p-4 rounded-2xl border leading-relaxed text-sm ${
                msg.role === 'user'
                  ? 'stepahead-chat-user rounded-tr-none shadow-md'
                  : 'stepahead-chat-coach rounded-tl-none font-sans space-y-1 shadow-md'
              }`}>
                {/* Parse simple list spacing or split double lines in replies */}
                <div className="whitespace-pre-line text-xs leading-relaxed">
                  {msg.text}
                </div>
              </div>
            </div>
          ))}

          {/* AI generating loader */}
          {(sending || loading) && (
            <div className="flex gap-3 max-w-[85%] mr-auto animate-pulse">
              <div className="w-8 h-8 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
                <BrainCircuit className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-4 rounded-2xl stepahead-chat-coach rounded-tl-none text-xs">
                Gemini is evaluating your task history and typing response...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Dynamic Quick Suggestion Pills */}
        <div className="px-4 py-2 bg-black/10 border-t border-white/5 flex flex-wrap gap-2">
          {[
            { label: "💡 Break Procrastination", text: "Why am I procrastinating, and how do I take the first small step?" },
            { label: "🎯 Prioritize Tasks", text: "What should be my immediate top priority to prevent deadlines from crashing?" },
            { label: "🔋 Fatigue/Burnout Check", text: "I feel exhausted. How should I adjust my schedule today to recover energy?" },
            { label: "⚡ Fast Focus Sprint", text: "Give me a quick 15-minute action block blueprint right now." }
          ].map((pill, idx) => (
            <button
              key={idx}
              type="button"
              id={`coach-pill-${idx}`}
              onClick={() => handleSuggestionClick(pill.text)}
              disabled={sending || loading}
              className="text-[10px] font-bold font-mono px-3 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/5 hover:bg-violet-500/15 hover:border-violet-500/40 text-violet-300 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Chat input box */}
        <form onSubmit={handleSend} className="p-4 bg-white/5 border-t border-white/10 flex gap-3">
          <input
            id="coach-input"
            type="text"
            required
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={sending || loading}
            placeholder="e.g., Why am I struggling to start my CalculusCurves curves homework?"
            className="flex-1 bg-black/20 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:bg-black/40 focus:outline-violet-500/30 transition-all disabled:bg-white/5 placeholder:text-slate-600"
          />
          <button
            id="coach-send-btn"
            type="submit"
            disabled={sending || loading || !inputText.trim()}
            className="p-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl cursor-pointer transition-all shrink-0 disabled:bg-white/10 border border-violet-700 shadow-lg shadow-violet-500/10"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>

      {/* Metrics & Performance Sidebar (Right side) */}
      <div className="lg:col-span-4 h-full overflow-y-auto space-y-6 pr-1">
        
        {/* StepAhead AI Engine Status */}
        <div className="bg-white/5 rounded-3xl p-5 border border-white/10 shadow-lg space-y-3">
          <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
            <BrainCircuit className="w-4.5 h-4.5 text-violet-400" />
            <h4 className="font-bold text-xs font-mono uppercase tracking-widest text-slate-400">StepAhead AI Status</h4>
          </div>
          
          <div className="space-y-3">
            {/* Connection Status Badge */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-sans">Active Pipeline:</span>
              {stats?.apiStatus?.status === "connected" ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  🟢 Gemini Online
                </span>
              ) : stats?.apiStatus?.status === "rate_limited" ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 animate-pulse">
                  ⚠️ Quota Fallback
                </span>
              ) : stats?.apiStatus?.status === "error" ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/20">
                  🔴 Network Fallback
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono text-slate-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
                  ⚪ Offline Heuristic
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              {stats?.apiStatus?.details || "StepAhead standard heuristics activated. Insights generated on internal safety weights."}
            </p>

            {/* Coach Active Memory */}
            <div className="bg-black/20 rounded-2xl p-3 border border-white/5 space-y-2">
              <span className="text-[9px] font-mono font-bold text-violet-400 uppercase tracking-widest block">Active Context Stream</span>
              <ul className="space-y-1.5 text-[10px] font-mono text-slate-300">
                <li className="flex items-center gap-1.5">
                  <span className="text-violet-500">▶</span> Active Tasks Evaluated: {tasks.length}
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-violet-500">▶</span> Overdue Alert: {tasks.filter(t => t.status === "pending" && new Date(t.deadline) < new Date("2026-06-29")).length > 0 ? "🔥 HIGH CRISIS" : "🟢 STABLE"}
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-violet-500">▶</span> Live Focus Rate: {stats?.productivityScore || 0}%
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Motivation & Focus Meters */}
        <div className="bg-white/5 rounded-3xl p-5 border border-white/10 shadow-lg space-y-4">
          <h3 className="font-bold text-white font-display text-xs uppercase tracking-widest text-slate-400 border-b border-white/5 pb-2">
            Neuro Coaching Status
          </h3>

          <div className="space-y-3.5">
            {/* Motivation meter */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Motivation Meter</span>
                <span className="font-bold font-mono text-violet-400">{stats?.completionRate || 0}%</span>
              </div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="bg-violet-600 h-full transition-all duration-500" 
                  style={{ width: `${stats?.completionRate || 0}%` }}
                ></div>
              </div>
            </div>

            {/* Focus Score */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Concentration Index</span>
                <span className="font-bold font-mono text-amber-400">{stats?.productivityScore || 0}%</span>
              </div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="bg-amber-500 h-full transition-all duration-500" 
                  style={{ width: `${stats?.productivityScore || 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Work Style Badge */}
        <div className="bg-white/5 rounded-3xl p-5 border border-white/10 shadow-lg space-y-2">
          <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Work Style Profile</p>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-violet-500/10 text-violet-400 rounded-lg shrink-0">
              <Award className="w-4 h-4" />
            </span>
            <span className="font-bold text-white text-sm">{workStyle.label}</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">{workStyle.desc}</p>
        </div>

        {/* Challenge of the day */}
        <div className="stepahead-purple-card rounded-3xl p-5 border shadow-xl space-y-3">
          <div className="flex items-center gap-1.5">
            <Flame className="w-4.5 h-4.5 text-violet-400 animate-pulse" />
            <h4 className="font-bold text-xs font-mono uppercase tracking-widest text-violet-400">Coaching Challenge</h4>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed font-semibold">
            "{getDailyChallenge()}"
          </p>
        </div>

      </div>

    </div>
  );
}
