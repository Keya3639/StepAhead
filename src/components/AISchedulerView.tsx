import React from "react";
import { 
  Clock, 
  Sparkles, 
  Coffee, 
  Compass, 
  Brain, 
  TrendingUp, 
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  HelpCircle,
  Play
} from "lucide-react";
import { ScheduleBlock, Task } from "../types";

interface AISchedulerViewProps {
  schedule: ScheduleBlock[];
  tasks: Task[];
  onGenerateSchedule: () => Promise<void>;
  loading: boolean;
}

export default function AISchedulerView({
  schedule,
  tasks,
  onGenerateSchedule,
  loading
}: AISchedulerViewProps) {
  
  const pendingTasks = tasks.filter(t => t.status === "pending");
  const overdueOrTodayTasks = pendingTasks.filter(t => {
    const today = new Date("2026-06-29T08:35:00-07:00");
    const dl = new Date(t.deadline);
    const diffDays = Math.ceil((dl.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 0;
  });

  // Calculate total scheduled work hours (excluding breaks)
  const scheduledWorkHours = schedule
    .filter(b => !b.isBreak)
    .reduce((acc, b) => acc + b.duration, 0);

  // Workload analysis category
  const getWorkloadSeverity = (hrs: number) => {
    if (hrs >= 10) return { label: "🔥 Heavy Workload", desc: "Excessive stress. We advise utilizing session-splitting in Rescue mode.", colorClass: "text-red-400 bg-red-500/10 border-red-500/20" };
    if (hrs >= 7) return { label: "⚠️ Busy Load", desc: "Tight focus needed. Rest blocks are fully optimized.", colorClass: "text-violet-400 bg-violet-500/10 border-violet-500/20" };
    if (hrs >= 4) return { label: "🚀 Balanced Load", desc: "Healthy, stable momentum. Perfect for solid execution.", colorClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
    return { label: "🍃 Light Load", desc: "Spacious margin. Perfect for deep learning or skill-upwards.", colorClass: "text-blue-400 bg-blue-500/10 border-blue-500/20" };
  };

  const workload = getWorkloadSeverity(scheduledWorkHours);

  // The #1 Daily Mission (first pending task in the sorted sequence)
  const dailyMission = schedule.find(b => !b.isBreak);

  return (
    <div className="space-y-6">
      
      {/* Top action layout */}
      <div className="bg-white/5 rounded-3xl p-6 border border-white/10 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-violet-500/10 text-violet-400 rounded-xl">
              <Compass className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold font-display text-white">Autonomous Daily Scheduler</h1>
              <p className="text-xs text-slate-400">Auto-align active vectors starting at 09:00 AM local time</p>
            </div>
          </div>
        </div>

        <button
          id="generate-schedule-btn"
          onClick={onGenerateSchedule}
          disabled={loading}
          className="w-full md:w-auto py-3 px-6 bg-violet-600 hover:bg-violet-500 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-2xl transition-all shadow-xl shadow-violet-500/20 cursor-pointer flex items-center justify-center gap-2 disabled:bg-white/10 disabled:text-slate-500"
        >
          <Sparkles className="w-4 h-4 fill-current" />
          {loading ? "Re-aligning daily schedule..." : "Generate AI Daily Plan"}
        </button>
      </div>

      {/* Warnings & High risks bar */}
      {overdueOrTodayTasks.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-red-400 uppercase tracking-widest font-mono">CRITICAL DEADLINE VECTOR DETECTED</h4>
            <p className="text-slate-300 leading-relaxed">
              You have <span className="font-bold text-red-400">{overdueOrTodayTasks.length} task(s) overdue or due today</span> (Calculus Assignment curves is currently alarming). The schedule has positioned these first for high-priority resolution.
            </p>
          </div>
        </div>
      )}

      {/* Schedule presentation Grid */}
      {schedule.length === 0 ? (
        <div className="bg-white/5 rounded-3xl p-16 border border-white/10 text-center space-y-4">
          <Clock className="w-12 h-12 text-slate-500 mx-auto" />
          <div className="space-y-1.5">
            <h3 className="font-bold text-white text-base">Your Schedule is empty</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Ready to automate your workday? Click the generate button to sequence your pending tasks with smart rest breaks.
            </p>
          </div>
          <button
            id="empty-generate-btn"
            onClick={onGenerateSchedule}
            className="inline-flex items-center gap-2 text-xs font-bold font-mono px-5 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl transition-all shadow-xl shadow-violet-500/20 cursor-pointer"
          >
            Generate My Schedule
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Timeline listing */}
          <div className="lg:col-span-8 space-y-4">
            <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-slate-500">Scheduled Timeblocks</h3>
            
            <div className="space-y-3.5 relative before:absolute before:top-4 before:bottom-4 before:left-4 before:w-[2px] before:bg-white/10">
              {schedule.map((block, index) => {
                const isDeepWork = !block.isBreak && block.duration >= 3;
                const isQuickTask = !block.isBreak && block.duration <= 1.5;

                return (
                  <div 
                    key={block.id}
                    className={`ml-10 relative flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl border transition-all ${
                      block.isBreak 
                        ? "bg-white/5 border-white/5 opacity-70" 
                        : isDeepWork 
                          ? "bg-violet-500/5 border-violet-500/20 shadow-lg shadow-violet-500/5" 
                          : "bg-white/5 border-white/10"
                    }`}
                  >
                    {/* Time indicator Dot */}
                    <div className={`absolute -left-[30px] top-6 w-3 h-3 rounded-full border-2 ${
                      block.isBreak ? "bg-slate-500 border-[#0A0B10]" : "bg-violet-500 border-[#0A0B10]"
                    }`}></div>

                    {/* Time details */}
                    <div className="flex items-start gap-4">
                      <div className="text-xs font-mono font-bold text-slate-300 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 h-fit text-center min-w-[90px]">
                        {block.startTime} → {block.endTime}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className={`text-sm font-bold font-display ${block.isBreak ? "text-slate-500 italic" : "text-white"}`}>
                            {block.taskTitle}
                          </h4>
                          {isDeepWork && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[9px] font-bold font-mono bg-violet-600 text-white shadow-lg shadow-violet-500/10">
                              🧠 DEEP WORK FOCUS
                            </span>
                          )}
                          {isQuickTask && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[9px] font-bold font-mono bg-white/10 text-slate-300 border border-white/5 uppercase">
                              ⚡ QUICK BATCHABLE
                            </span>
                          )}
                        </div>
                        {!block.isBreak && (
                          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Estimated Duration: {block.duration} hrs</p>
                        )}
                      </div>
                    </div>

                    {/* Right side check status/icon */}
                    <div className="mt-3 md:mt-0 flex items-center justify-end">
                      {block.isBreak ? (
                        <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-400">
                          <Coffee className="w-4 h-4 text-violet-400" /> Rest Zone
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-mono font-bold text-violet-400 bg-violet-500/10 px-2.5 py-1 border border-violet-500/20 rounded-lg">
                          <Play className="w-3.5 h-3.5 text-violet-500 fill-current" /> Active Focus
                        </span>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          {/* Workload Analysis and daily mission */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Daily Mission Card */}
            {dailyMission && (
              <div className="stepahead-purple-card text-white rounded-3xl p-5 border shadow-xl space-y-4">
                <div className="flex items-center gap-2.5 border-b border-white/5 pb-3">
                  <Brain className="w-5 h-5 text-violet-400 animate-pulse" />
                  <div>
                    <h4 className="font-bold text-sm font-display uppercase tracking-wider text-slate-300">Daily Mission Objective</h4>
                    <p className="text-[10px] font-mono text-slate-500">Kickstart momentum</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-violet-400 font-bold uppercase tracking-widest">Execute First:</span>
                  <h3 className="font-black text-base text-white uppercase font-display leading-tight">{dailyMission.taskTitle}</h3>
                </div>

                <div className="p-3 bg-white/5 rounded-2xl border border-white/5 text-xs text-slate-300 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-violet-400 shrink-0" />
                  <p>Starting with a high-priority, well-structured task breaks cognitive friction. Set a Pomodoro and execute.</p>
                </div>
              </div>
            )}

            {/* Workload analysis widget */}
            <div className="bg-white/5 rounded-3xl p-5 border border-white/10 shadow-lg space-y-4">
              <h3 className="font-bold text-white text-sm">Workload Health Analysis</h3>
              
              <div className={`p-4 rounded-2xl border ${workload.colorClass} space-y-1.5 shadow-md`}>
                <h4 className="font-bold text-sm font-display">{workload.label}</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">{workload.desc}</p>
              </div>

              <div className="space-y-3.5 text-xs border-t border-white/5 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total Work blocks:</span>
                  <span className="font-bold font-mono text-white">{scheduledWorkHours} hrs</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Scheduled rest breaks:</span>
                  <span className="font-bold font-mono text-white">
                    {schedule.filter(b => b.isBreak).length * 15} mins
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Deep Work sessions:</span>
                  <span className="font-bold font-mono text-white">
                    {schedule.filter(b => !b.isBreak && b.duration >= 3).length} zones
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
