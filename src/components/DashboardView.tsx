import React from "react";
import { 
  Flame, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Compass, 
  Clock, 
  ArrowRight,
  TrendingUp,
  BrainCircuit,
  Zap
} from "lucide-react";
import { Task, ProductivityStats } from "../types";

interface DashboardViewProps {
  tasks: Task[];
  stats: ProductivityStats | null;
  onNavigate: (module: string) => void;
  onCompleteTask: (taskId: string, subtaskId?: string) => void;
  loading: boolean;
}

export default function DashboardView({ 
  tasks, 
  stats, 
  onNavigate, 
  onCompleteTask,
  loading 
}: DashboardViewProps) {
  
  const [istTime, setIstTime] = React.useState("");

  React.useEffect(() => {
    const updateTime = () => {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      };
      setIstTime(new Intl.DateTimeFormat("en-IN", options).format(new Date()) + " IST");
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const getISTGreeting = () => {
    const nowInIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const hrs = nowInIST.getHours();
    if (hrs >= 5 && hrs < 12) {
      return "Good Morning 🌞";
    } else if (hrs >= 12 && hrs < 17) {
      return "Good Afternoon ☀️";
    } else if (hrs >= 17 && hrs < 19) {
      return "Good Evening 🌤️";
    } else {
      // 7 PM to 3 AM (and up to 5 AM)
      return "Good Evening 🌙";
    }
  };

  // Highlight Priority Task Spotlight
  const pendingTasks = tasks.filter(t => t.status === "pending");
  const spotlightTask = pendingTasks.length > 0 
    ? pendingTasks.sort((a, b) => b.priorityScore - a.priorityScore)[0]
    : null;

  // Render Risk Badge
  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case "Critical": return "bg-red-500/10 text-red-400 border-red-500/20 ring-red-500/10";
      case "High": return "bg-violet-500/10 text-violet-400 border-violet-500/20 ring-violet-500/10";
      case "Medium": return "bg-amber-500/10 text-amber-400 border-amber-500/20 ring-amber-500/10";
      default: return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 ring-emerald-500/10";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden stepahead-purple-card rounded-3xl p-8 text-white border shadow-2xl shadow-violet-950/10">
        <div className="relative z-10 max-w-3xl space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold font-mono bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <BrainCircuit className="w-3.5 h-3.5 animate-pulse text-violet-500" /> StepAhead Core AI Active
          </span>
          <h1 className="text-3xl md:text-5xl font-black font-display tracking-tight uppercase leading-none text-white">
            {getISTGreeting()}
          </h1>
          <p className="text-violet-400 font-mono text-xs uppercase tracking-widest font-bold">
            AI-Powered Smart Task Prioritization & Deadline Rescue Agent
          </p>
          <p className="text-slate-200 text-base md:text-lg font-semibold leading-relaxed max-w-xl">
            Think Ahead. Stay Ahead. Beat Deadlines.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core AI Command Briefing & Score */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* AI Briefing Card */}
          <div className="bg-white/5 rounded-3xl p-6 border border-white/10 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-500/10 text-violet-400 rounded-xl">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-base">AI Live Command Briefing</h2>
                  <p className="text-[10px] text-slate-500 font-mono">{istTime || "Loading IST..."}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 font-mono text-[10px] text-slate-400 bg-white/5 border border-white/5 rounded-lg">
                v3.5-Flash
              </span>
            </div>

            {loading ? (
              <div className="space-y-2 py-4">
                <div className="h-4 bg-white/5 rounded-sm w-3/4 animate-pulse"></div>
                <div className="h-4 bg-white/5 rounded-sm w-5/6 animate-pulse"></div>
                <div className="h-4 bg-white/5 rounded-sm w-2/3 animate-pulse"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-300 leading-relaxed font-sans font-medium">
                  "{stats?.aiInsights || "Synchronizing dynamic insights from your active deadline vectors..."}"
                </p>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">Monthly Strategy Preview</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {stats?.monthlyStrategy || "Awaiting structural categories compilation..."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Priority Spotlight Task */}
          {spotlightTask ? (
            <div className="stepahead-purple-card-transparent rounded-3xl p-6 border shadow-xl space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 text-violet-500/5 select-none pointer-events-none">
                <Zap className="w-36 h-36" />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold font-mono bg-violet-500 text-black shadow-lg shadow-violet-500/20">
                  <Zap className="w-3.5 h-3.5 fill-current" /> FOCUS SPOTLIGHT
                </span>
                <span className="text-xs font-mono text-slate-400">Priority Score: <span className="font-bold text-violet-400">{spotlightTask.priorityScore}</span></span>
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-lg text-white">{spotlightTask.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2">{spotlightTask.description}</p>
              </div>

              {/* Subtask Showcase */}
              {spotlightTask.subtasks && spotlightTask.subtasks.length > 0 && (
                <div className="bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/5 space-y-3">
                  <p className="text-xs font-bold text-slate-300 font-mono">Immediate Next Actions:</p>
                  <div className="space-y-2">
                    {spotlightTask.subtasks.slice(0, 3).map((st) => (
                      <div key={st.id} className="flex items-center justify-between text-xs border-b border-white/5 pb-2 last:border-0 last:pb-0">
                        <span className={`line-clamp-1 ${st.completed ? "line-through text-slate-500" : "text-slate-300 font-medium"}`}>
                          {st.title} ({st.duration}h)
                        </span>
                        {!st.completed ? (
                          <button
                            id={`spotlight-complete-${st.id}`}
                            onClick={() => onCompleteTask(spotlightTask.id, st.id)}
                            className="text-[10px] font-mono text-violet-400 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold"
                          >
                            Mark Done
                          </button>
                        ) : (
                          <span className="text-[10px] font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">Done</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {spotlightTask.aiReasoning && (
                <p className="text-xs text-violet-300 italic bg-violet-500/5 p-3 rounded-2xl border border-violet-500/10 leading-relaxed">
                  <strong>AI Verdict:</strong> {spotlightTask.aiReasoning}
                </p>
              )}

              <div className="flex justify-end pt-2">
                <button
                  id="go-to-manager"
                  onClick={() => onNavigate("Task Manager")}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-400 hover:text-violet-300 font-mono group cursor-pointer"
                >
                  Manage tasks <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 rounded-3xl p-10 border border-white/10 text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
              <div className="space-y-1">
                <h3 className="font-bold text-white text-base">Your Action Queue is Fully Cleared!</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  StepAhead has neutralized all deadlines. Grab a tea, or add a new commitment to begin scheduling!
                </p>
              </div>
              <button
                id="add-first-task"
                onClick={() => onNavigate("Task Manager")}
                className="inline-flex items-center gap-2 text-xs font-bold font-mono px-5 py-3 bg-violet-500 hover:bg-violet-400 text-black rounded-2xl transition-all shadow-xl shadow-violet-500/20 cursor-pointer"
              >
                Create a Task
              </button>
            </div>
          )}

        </div>

        {/* Dashboard Sidebar Stats */}
        <div className="space-y-6">
          
          {/* Productivity Score Ring */}
          <div className="bg-white/5 rounded-3xl p-6 border border-white/10 shadow-lg space-y-4 flex flex-col items-center text-center">
            <h3 className="font-bold text-white text-sm">Productivity Performance</h3>
            
            <div className="relative flex items-center justify-center">
              {/* Simple beautiful SVG Donut progress */}
              <svg className="w-36 h-36 transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="58"
                  className="stroke-white/5"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="58"
                  className="stroke-violet-500 transition-all duration-1000 ease-out"
                  strokeWidth="10"
                  strokeDasharray={364.4}
                  strokeDashoffset={364.4 - (364.4 * (stats?.productivityScore || 0)) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-black font-mono text-white">{stats?.productivityScore || 0}</span>
                <span className="text-[9px] font-mono tracking-widest text-slate-500 font-bold uppercase">Index Rating</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full border-t border-white/5 pt-4 text-left">
              <div>
                <p className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-wider">Completion Rate</p>
                <p className="text-lg font-bold font-mono text-white">{stats?.completionRate || 0}%</p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-wider">Pending Burden</p>
                <p className="text-lg font-bold font-mono text-white">{stats?.burnoutDetails.pendingHours || 0} hrs</p>
              </div>
            </div>
          </div>

          {/* Burnout Risk Monitor */}
          <div className="bg-white/5 rounded-3xl p-6 border border-white/10 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">Burnout Risk Monitor</h3>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono border ${getRiskBadgeColor(stats?.burnoutRisk || "Low")}`}>
                {stats?.burnoutRisk || "Low"}
              </span>
            </div>

            {/* Health Bar indicator */}
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  stats?.burnoutRisk === "Critical" ? "bg-red-500 w-full" :
                  stats?.burnoutRisk === "High" ? "bg-violet-500 w-3/4" :
                  stats?.burnoutRisk === "Medium" ? "bg-amber-500 w-1/2" : "bg-emerald-500 w-1/4"
                }`}
              ></div>
            </div>

            {/* Burnout metrics details */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400">Active Queue Size:</span>
                <span className="font-bold font-mono text-white">{stats?.burnoutDetails.queueSize || 0} tasks</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400">Remaining work block:</span>
                <span className="font-bold font-mono text-white">{stats?.burnoutDetails.pendingHours || 0} hrs</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-slate-400">Overdue / Critical Count:</span>
                <span className={`font-bold font-mono ${stats?.burnoutDetails.criticalCount ? "text-red-400" : "text-white"}`}>
                  {stats?.burnoutDetails.criticalCount || 0} alerts
                </span>
              </div>
            </div>

            {/* Emergency Action recommendation if high risk */}
            {stats?.reliefStrategy && (
              <div className="p-4 stepahead-purple-badge border rounded-2xl text-xs space-y-1.5 shadow-md">
                <p className="font-bold text-violet-400 flex items-center gap-1.5 font-mono uppercase tracking-widest text-[10px]">
                  <Flame className="w-3.5 h-3.5 text-violet-500 shadow-[0_0_8px_#8b5cf6] rounded-full" /> Burnout Relief Protocol
                </p>
                <p className="text-slate-300 leading-relaxed font-sans">{stats.reliefStrategy}</p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Quick Launchpad Grid */}
      <div className="space-y-4 pt-4">
        <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-slate-500">Tactical Launchpad</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div 
            onClick={() => onNavigate("Task Manager")}
            className="bg-white/5 p-5 rounded-3xl border border-white/10 hover:border-violet-500/30 shadow-lg transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="p-2.5 bg-violet-500/10 text-violet-400 rounded-xl group-hover:bg-violet-500/20 transition-colors">
                <CheckCircle className="w-5 h-5" />
              </span>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 group-hover:text-violet-400 transition-all" />
            </div>
            <h4 className="font-bold text-sm text-white">Neural Task Manager</h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">Deploy structured priorities and decompose deliverables with Gemini.</p>
          </div>

          <div 
            onClick={() => onNavigate("AI Scheduler")}
            className="bg-white/5 p-5 rounded-3xl border border-white/10 hover:border-violet-500/30 shadow-lg transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="p-2.5 bg-violet-500/10 text-violet-400 rounded-xl group-hover:bg-violet-500/20 transition-colors">
                <Clock className="w-5 h-5" />
              </span>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 group-hover:text-violet-400 transition-all" />
            </div>
            <h4 className="font-bold text-sm text-white">Autonomous Daily Scheduler</h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">Generate dynamic timetables with automated focus and recharge zones.</p>
          </div>

          <div 
            onClick={() => onNavigate("Deadline Rescue")}
            className="bg-white/5 p-5 rounded-3xl border border-white/10 hover:border-violet-500/30 shadow-lg transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="p-2.5 bg-violet-500/10 text-violet-400 rounded-xl group-hover:bg-violet-500/20 transition-colors">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 group-hover:text-violet-400 transition-all" />
            </div>
            <h4 className="font-bold text-sm text-white">Emergency Rescue Agent</h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">Initiate autonomous multi-day recovery loops for high-risk overdue tasks.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
