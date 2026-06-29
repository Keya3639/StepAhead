import React, { useState, useEffect } from "react";
import { 
  Compass, 
  CheckSquare, 
  Clock, 
  AlertTriangle, 
  BrainCircuit, 
  TrendingUp, 
  Calendar,
  Layers,
  Menu,
  X,
  User,
  ExternalLink,
  ShieldAlert,
  Sliders,
  Settings,
  Sun,
  Moon
} from "lucide-react";
import { Task, ScheduleBlock, RescuePlan, CoachMessage, ProductivityStats } from "./types";
import DashboardView from "./components/DashboardView";
import TaskManagerView from "./components/TaskManagerView";
import AISchedulerView from "./components/AISchedulerView";
import DeadlineRescueView from "./components/DeadlineRescueView";
import AICoachView from "./components/AICoachView";
import AnalyticsView from "./components/AnalyticsView";

export default function App() {
  const [currentModule, setCurrentModule] = useState<string>("Dashboard");
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("stepahead-theme");
    return (saved as "dark" | "light") || "dark";
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [schedule, setSchedule] = useState<ScheduleBlock[]>([]);
  const [rescuePlan, setRescuePlan] = useState<RescuePlan | null>(null);
  const [coachMessages, setCoachMessages] = useState<CoachMessage[]>([]);
  const [stats, setStats] = useState<ProductivityStats | null>(null);

  // Loaders
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [loadingRescue, setLoadingRescue] = useState(true);
  const [loadingCoach, setLoadingCoach] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);

  // Mobile sidebar toggler
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // IST Time Dynamic Clock state
  const [istTime, setIstTime] = useState("");

  useEffect(() => {
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

  // Sync theme with root DOM
  useEffect(() => {
    localStorage.setItem("stepahead-theme", theme);
    const root = window.document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
    }
  }, [theme]);

  // Fetch helpers
  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setLoadingTasks(false);
    }
  };

  const fetchSchedule = async () => {
    try {
      const res = await fetch("/api/scheduler");
      const data = await res.json();
      setSchedule(data);
    } catch (err) {
      console.error("Error fetching schedule:", err);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const fetchRescuePlan = async () => {
    try {
      const res = await fetch("/api/rescue");
      const data = await res.json();
      setRescuePlan(data);
    } catch (err) {
      console.error("Error fetching rescue plan:", err);
    } finally {
      setLoadingRescue(false);
    }
  };

  const fetchCoachMessages = async () => {
    try {
      const res = await fetch("/api/coach/messages");
      const data = await res.json();
      setCoachMessages(data);
    } catch (err) {
      console.error("Error fetching coach messages:", err);
    } finally {
      setLoadingCoach(false);
    }
  };

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await fetch("/api/stats");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchTasks();
    fetchSchedule();
    fetchRescuePlan();
    fetchCoachMessages();
    fetchStats();
  }, []);

  // Sync utilities
  const handleCreateTask = async (taskData: any) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData)
      });
      if (res.ok) {
        await fetchTasks();
        await fetchStats();
      }
    } catch (err) {
      console.error("Task creation failed:", err);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: any) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        await fetchTasks();
        await fetchStats();
      }
    } catch (err) {
      console.error("Task update failed:", err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        await fetchTasks();
        await fetchStats();
      }
    } catch (err) {
      console.error("Task deletion failed:", err);
    }
  };

  const handleForceBreakdown = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/breakdown`, {
        method: "POST"
      });
      if (res.ok) {
        await fetchTasks();
      }
    } catch (err) {
      console.error("Breakdown generation failed:", err);
    }
  };

  const handleGenerateSchedule = async () => {
    try {
      setLoadingSchedule(true);
      const res = await fetch("/api/scheduler/generate", { method: "POST" });
      if (res.ok) {
        await fetchSchedule();
      }
    } catch (err) {
      console.error("Schedule generation failed:", err);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const handleGenerateRescuePlan = async () => {
    try {
      setLoadingRescue(true);
      const res = await fetch("/api/rescue/generate", { method: "POST" });
      if (res.ok) {
        await fetchRescuePlan();
      }
    } catch (err) {
      console.error("Rescue generation failed:", err);
    } finally {
      setLoadingRescue(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    const tempUserMsg: CoachMessage = {
      id: "temp-user-" + Date.now(),
      role: "user",
      text: text,
      timestamp: new Date().toISOString()
    };
    
    // Optimistically update the UI so the user sees their message instantly!
    setCoachMessages(prev => [...prev, tempUserMsg]);
    
    try {
      const res = await fetch("/api/coach/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      if (res.ok) {
        // Fetch the updated message list which now has both user message and model's response
        await fetchCoachMessages();
      } else {
        // If server failed, append a clear local error/offline message
        const errorMsg: CoachMessage = {
          id: "temp-error-" + Date.now(),
          role: "model",
          text: "I see your message! Since the live Gemini API is experiencing rate limits or is busy right now, here is my direct recovery coaching: pick your most critical task (e.g., your overdue math or upcoming hackathon) and break it down. I highly recommend spending just 15 minutes right now on your first small subtask. Taking that initial tiny step is the absolute best way to break the inertia of procrastination. Let's get that done!",
          timestamp: new Date().toISOString()
        };
        setCoachMessages(prev => [...prev, errorMsg]);
      }
    } catch (err) {
      console.error("Coach message dispatch failed:", err);
      const errorMsg: CoachMessage = {
        id: "temp-error-" + Date.now(),
        role: "model",
        text: "I see your message! Since the live Gemini API is experiencing rate limits or is busy right now, here is my direct recovery coaching: pick your most critical task (e.g., your overdue math or upcoming hackathon) and break it down. I highly recommend spending just 15 minutes right now on your first small subtask. Taking that initial tiny step is the absolute best way to break the inertia of procrastination. Let's get that done!",
        timestamp: new Date().toISOString()
      };
      setCoachMessages(prev => [...prev, errorMsg]);
    }
  };

  // Direct complete subtask action from Dashboard spotlight task
  const handleSpotlightComplete = async (taskId: string, subtaskId?: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    let updatedSubtasks = [...task.subtasks];
    if (subtaskId) {
      updatedSubtasks = task.subtasks.map(st => 
        st.id === subtaskId ? { ...st, completed: true } : st
      );
    }

    const allCompleted = updatedSubtasks.every(st => st.completed);
    const newStatus = allCompleted ? 'completed' : 'pending';

    await handleUpdateTask(taskId, {
      subtasks: updatedSubtasks,
      status: newStatus
    });
  };

  // Navigation Items
  const navItems = [
    { name: "Dashboard", label: "Command Center", icon: Compass },
    { name: "Task Manager", label: "Task Manager", icon: CheckSquare },
    { name: "AI Scheduler", label: "AI Scheduler", icon: Clock },
    { name: "Deadline Rescue", label: "Deadline Rescue", icon: AlertTriangle },
    { name: "AI Coach", label: "AI Coach", icon: BrainCircuit },
    { name: "Analytics", label: "Analytics Center", icon: TrendingUp },
  ];

  const renderModuleContent = () => {
    switch (currentModule) {
      case "Dashboard":
        return (
          <DashboardView 
            tasks={tasks}
            stats={stats}
            onNavigate={(mod) => setCurrentModule(mod)}
            onCompleteTask={handleSpotlightComplete}
            loading={loadingStats}
          />
        );
      case "Task Manager":
        return (
          <TaskManagerView 
            tasks={tasks}
            onCreateTask={handleCreateTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onForceBreakdown={handleForceBreakdown}
            loading={loadingTasks}
          />
        );
      case "AI Scheduler":
        return (
          <AISchedulerView 
            schedule={schedule}
            tasks={tasks}
            onGenerateSchedule={handleGenerateSchedule}
            loading={loadingSchedule}
          />
        );
      case "Deadline Rescue":
        return (
          <DeadlineRescueView 
            rescuePlan={rescuePlan}
            tasks={tasks}
            onGenerateRescuePlan={handleGenerateRescuePlan}
            loading={loadingRescue}
          />
        );
      case "AI Coach":
        return (
          <AICoachView 
            messages={coachMessages}
            tasks={tasks}
            stats={stats}
            onSendMessage={handleSendMessage}
            loading={loadingCoach}
          />
        );
      case "Analytics":
        return (
          <AnalyticsView 
            tasks={tasks}
            stats={stats}
            loading={loadingStats}
          />
        );
      default:
        return <div className="text-zinc-500 font-mono text-xs">Navigation lost. Returning to Command Center...</div>;
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0A0B10] text-slate-200">
      
      {/* PERSISTENT SIDEBAR - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-black/40 border-r border-white/10 text-slate-400 select-none shrink-0">
        
        {/* Sidebar Logo Header */}
        <div className="p-6 border-b border-white/10 flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-lg flex items-center justify-center text-white shadow-lg shadow-violet-500/20 font-black text-xl">
            S
          </div>
          <div>
            <h1 className="text-white font-bold font-display leading-none tracking-tight text-base">StepAhead</h1>
            <span className="text-[10px] font-mono font-medium text-violet-500 tracking-wider">Rescue Mode</span>
          </div>
        </div>

        {/* Navigation Stream */}
        <nav className="flex-1 p-4 space-y-1.5 pt-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentModule === item.name;

            return (
              <button
                id={`nav-${item.name.replace(/\s+/g, '-').toLowerCase()}`}
                key={item.name}
                onClick={() => {
                  setCurrentModule(item.name);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold font-mono transition-all group cursor-pointer ${
                  isActive 
                    ? "bg-white/10 text-white shadow-inner border-l-2 border-violet-500" 
                    : "hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? "text-violet-400" : "text-slate-500 group-hover:text-slate-300"
                }`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Developer Profile Footer */}
        <div className="p-4 border-t border-white/10 flex flex-col gap-3.5 bg-black/40">
          <div className="flex items-start gap-2.5">
            <div className="w-9 h-9 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold text-sm border border-violet-500/30 shrink-0 font-mono shadow-inner shadow-violet-500/10">
              KD
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-slate-100 text-xs leading-tight tracking-wide">Keya Das</span>
              <span className="text-[10px] font-medium text-slate-400 font-mono uppercase tracking-wider mt-0.5">Developer Profile</span>
            </div>
          </div>
          
          <div className="space-y-2 text-[10px] bg-white/5 p-3 rounded-xl border border-white/5">
            <div className="text-slate-300 font-medium leading-normal flex items-start gap-1">
              <span className="shrink-0 text-violet-400">🎓</span>
              <span>MCA Postgraduate | AI & Data Science</span>
            </div>
            
            <div className="border-t border-white/5 pt-2 space-y-1.5 font-mono text-slate-400">
              <div className="flex items-center gap-1.5 hover:text-slate-200 transition-colors">
                <span className="text-violet-400 text-xs">🔗</span>
                <a href="https://github.com/Keya3639" target="_blank" rel="noreferrer" className="truncate hover:underline">
                  github.com/Keya3639
                </a>
              </div>
              <div className="flex items-center gap-1.5 hover:text-slate-200 transition-colors">
                <span className="text-violet-400 text-xs">📧</span>
                <a href="mailto:keyakarunamoydas@gmail.com" className="truncate hover:underline">
                  keyakarunamoydas@gmail.com
                </a>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between border-t border-white/5 pt-2.5">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold">Options</span>
            <div className="flex items-center gap-1">
              <button
                id="sidebar-theme-toggle"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-1.5 hover:bg-white/5 rounded-md text-slate-500 hover:text-white transition-colors cursor-pointer"
                title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button 
                id="settings-trigger-btn"
                onClick={() => setSettingsOpen(true)}
                className="p-1.5 hover:bg-white/5 rounded-md text-slate-500 hover:text-white transition-colors cursor-pointer"
                title="Integrations & Secrets"
              >
                <Sliders className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </aside>

      {/* MOBILE FLOATING DRAWER */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-black/60 backdrop-blur-xs">
          <div className="relative flex flex-col w-64 bg-[#0A0B10] border-r border-white/10 text-slate-400">
            <button
              id="mobile-close-btn"
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-6 border-b border-white/10 flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-lg flex items-center justify-center text-white shadow-lg shadow-violet-500/20 font-black text-xl">
                S
              </div>
              <div>
                <h1 className="text-white font-bold font-display leading-none">StepAhead</h1>
                <span className="text-[10px] font-mono text-violet-400">Rescue Mode</span>
              </div>
            </div>

            <nav className="flex-1 p-4 space-y-1.5 pt-6">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentModule === item.name;

                return (
                  <button
                    id={`mobile-nav-${item.name.replace(/\s+/g, '-').toLowerCase()}`}
                    key={item.name}
                    onClick={() => {
                      setCurrentModule(item.name);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                      isActive 
                        ? "bg-white/10 text-white border-l-2 border-violet-500" 
                        : "hover:bg-white/5 hover:text-slate-200"
                    }`}
                  >
                    <Icon className="w-4 h-4 text-slate-500" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* MAIN VIEWPORT CANVAS */}
      <div className="flex-1 flex flex-col overflow-x-hidden min-w-0">
        
        {/* HEADER BAR */}
        <header className="bg-black/40 backdrop-blur-md border-b border-white/10 h-16 flex items-center justify-between px-8 shrink-0 select-none">
          
          <div className="flex items-center gap-4">
            <button
              id="mobile-menu-trigger"
              onClick={() => setSidebarOpen(true)}
              className="p-2 border border-white/10 rounded-lg lg:hidden hover:bg-white/5 text-slate-300 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white font-display capitalize">
                {currentModule}
              </span>
              <span className="text-white/20">/</span>
              <span className="text-xs font-mono font-medium text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-full border border-violet-500/20">Rescue Mode Active</span>
            </div>
          </div>

          {/* Time Context Indicator */}
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-mono font-bold text-slate-300">{istTime || "Loading IST..."}</span>
              <span className="text-[9px] font-mono font-medium text-slate-500 uppercase tracking-wider">Indian Standard Time (IST)</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                id="header-theme-toggle"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 hover:bg-white/5 border border-white/10 rounded-lg text-slate-400 transition-colors cursor-pointer"
                title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {theme === "dark" ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
              </button>
              <button
                id="header-settings-btn"
                onClick={() => setSettingsOpen(true)}
                className="p-2 hover:bg-white/5 border border-white/10 rounded-lg text-slate-400 transition-colors cursor-pointer"
                title="View system telemetry"
              >
                <Settings className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

        </header>

        {/* PRIMARY VIEWPORT CONTAINER */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {renderModuleContent()}
        </main>

      </div>

      {/* SYSTEM TELEMETRY / INTEGRATIONS MODAL */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-[#0A0B10] rounded-3xl border border-white/10 shadow-2xl max-w-md w-full overflow-hidden">
            
            <div className="bg-black/40 p-5 text-white flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-violet-400 animate-pulse" />
                <div>
                  <h3 className="font-bold text-sm font-mono uppercase tracking-wider">System Integration Status</h3>
                  <p className="text-[10px] text-slate-400 font-mono">StepAhead Environment v1.0</p>
                </div>
              </div>
              <button
                id="close-settings-btn"
                onClick={() => setSettingsOpen(false)}
                className="p-1 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-1.5 border-l-2 border-violet-500">
                <h4 className="text-xs font-bold text-violet-400 flex items-center gap-1">
                  🛡️ Server-Side API Security Key
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  Google Gemini models are initialized and computed strictly on the Express node backend. Your API key and system secrets remain completely hidden from browser inspect tools.
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-slate-500 font-mono">Node Container:</span>
                  <span className="font-bold text-slate-200 font-mono">Express + Vite (Port 3000)</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-slate-500 font-mono">Gemini Key State:</span>
                  <span className="font-bold text-emerald-400 font-mono">Active (Settings & Secrets)</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-slate-500 font-mono">Durable State Engine:</span>
                  <span className="font-bold text-slate-200 font-mono">Local JSON-DB Schema</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  id="close-telemetry-ok-btn"
                  onClick={() => setSettingsOpen(false)}
                  className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold font-mono text-xs uppercase tracking-wider rounded-2xl transition-all shadow-xl shadow-violet-500/20 cursor-pointer"
                >
                  Confirm telemetry state
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
