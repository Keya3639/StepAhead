import React, { useState } from "react";
import { 
  AlertTriangle, 
  Sparkles, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  ListTodo, 
  Flame, 
  BrainCircuit, 
  Calendar,
  Zap,
  ArrowRight
} from "lucide-react";
import { RescuePlan, Task } from "../types";
import RescueFocusSession from "./RescueFocusSession";

interface DeadlineRescueViewProps {
  rescuePlan: RescuePlan | null;
  tasks: Task[];
  onGenerateRescuePlan: () => Promise<void>;
  loading: boolean;
}

export default function DeadlineRescueView({
  rescuePlan,
  tasks,
  onGenerateRescuePlan,
  loading
}: DeadlineRescueViewProps) {
  
  const [selectedRescueTask, setSelectedRescueTask] = useState<{ title: string; hoursAllocated: number } | null>(null);
  const pendingTasks = tasks.filter(t => t.status === "pending");
  const today = new Date("2026-06-29T08:35:00-07:00");

  // Local calculations to show live stats
  let overdueCount = 0;
  let todayCount = 0;
  let upcomingCount = 0;

  pendingTasks.forEach(task => {
    const dl = new Date(task.deadline);
    const diffTime = dl.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) overdueCount++;
    else if (diffDays === 0) todayCount++;
    else if (diffDays <= 3) upcomingCount++;
  });

  // Calculate safety score
  let safetyScore = 100;
  safetyScore -= overdueCount * 25;
  safetyScore -= todayCount * 20;
  safetyScore -= upcomingCount * 10;
  safetyScore = Math.max(0, safetyScore);

  // Verdict colors & tags
  const getVerdictStyles = (verdict: string) => {
    switch (verdict) {
      case "Emergency": return "text-red-400 bg-red-500/10 border-red-500/20";
      case "Urgent": return "text-violet-400 bg-violet-500/10 border-violet-500/20";
      case "Manageable": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      default: return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Intro & Emergency Header */}
      <div className="bg-white/5 rounded-3xl p-6 border border-white/10 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-red-500/10 text-red-400 rounded-xl animate-pulse">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold font-display text-white">Deadline Rescue Agent</h1>
              <p className="text-xs text-slate-400">Intelligent mitigation & recovery for at-risk commitments</p>
            </div>
          </div>
        </div>

        <button
          id="trigger-rescue-btn"
          onClick={onGenerateRescuePlan}
          disabled={loading}
          className="w-full md:w-auto py-3 px-6 bg-red-500 hover:bg-red-400 text-black font-mono text-xs font-bold uppercase tracking-wider rounded-2xl transition-all shadow-xl shadow-red-500/20 cursor-pointer flex items-center justify-center gap-2 disabled:bg-white/10 disabled:text-slate-500 border border-red-600"
        >
          <Sparkles className="w-4 h-4 fill-current" />
          {loading ? "Generating Recovery Plan..." : "Initiate AI Replanning"}
        </button>
      </div>

      {/* Metrics & safety rating row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="bg-white/5 rounded-3xl p-5 border border-white/10 shadow-lg flex flex-col items-center justify-center text-center space-y-1.5">
          <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Safety Index</p>
          <span className={`text-4xl font-black font-mono ${safetyScore < 40 ? "text-red-400" : safetyScore < 70 ? "text-violet-400" : safetyScore < 90 ? "text-amber-400" : "text-emerald-400"}`}>
            {safetyScore}%
          </span>
          <span className="text-[9px] font-mono font-bold text-slate-400 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-lg">
            {safetyScore < 40 ? "🔥 Crisis Level" : safetyScore < 70 ? "⚠️ Alert State" : safetyScore < 90 ? "🛡️ Stable" : "✅ Perfect"}
          </span>
        </div>

        <div className="bg-white/5 rounded-3xl p-5 border border-white/10 shadow-lg text-center space-y-1">
          <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Overdue Vector</p>
          <span className={`text-3xl font-extrabold font-mono ${overdueCount > 0 ? "text-red-400" : "text-slate-300"}`}>
            {overdueCount}
          </span>
          <p className="text-[10px] text-slate-400">Missed deadlines</p>
        </div>

        <div className="bg-white/5 rounded-3xl p-5 border border-white/10 shadow-lg text-center space-y-1">
          <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Due Today</p>
          <span className={`text-3xl font-extrabold font-mono ${todayCount > 0 ? "text-amber-400" : "text-slate-300"}`}>
            {todayCount}
          </span>
          <p className="text-[10px] text-slate-400">Requires focus today</p>
        </div>

        <div className="bg-white/5 rounded-3xl p-5 border border-white/10 shadow-lg text-center space-y-1">
          <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Due Inside 3 Days</p>
          <span className="text-3xl font-extrabold font-mono text-slate-300">
            {upcomingCount}
          </span>
          <p className="text-[10px] text-slate-400">Inbound deadlines</p>
        </div>

      </div>

      {/* Main rescue plan visualization */}
      {rescuePlan ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Recovery steps mapping (Left side) */}
          <div className="lg:col-span-8 space-y-5">
            <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-slate-500">Recovery Steps Timeline</h3>
            
            {rescuePlan.replanSteps.length === 0 ? (
              <div className="bg-white/5 rounded-3xl p-10 border border-white/10 text-center text-slate-400 text-xs">
                No active replanned timeline. Click 'Initiate AI Replanning' to draft.
              </div>
            ) : (
              <div className="space-y-5 relative before:absolute before:top-4 before:bottom-4 before:left-4 before:w-[2px] before:bg-white/10">
                {rescuePlan.replanSteps.map((step, idx) => {
                  const totalHrs = step.tasks.reduce((sum, t) => sum + t.hoursAllocated, 0);

                  return (
                    <div key={idx} className="ml-10 relative bg-white/5 p-5 rounded-3xl border border-white/10 space-y-4">
                      {/* Date indicator Dot */}
                      <div className="absolute -left-[30px] top-6 w-3 h-3 rounded-full border-2 bg-red-500 border-[#0A0B10]"></div>

                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-500" />
                          <h4 className="font-bold text-sm font-mono text-white">{step.date}</h4>
                        </div>
                        <span className="text-xs font-bold font-mono text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-lg">
                          Allocated: {totalHrs} hrs
                        </span>
                      </div>

                      {/* Tasks lists for this date */}
                      <div className="space-y-3">
                        {step.tasks.map((stTask, tIdx) => (
                          <div key={tIdx} className="p-3 bg-black/20 rounded-2xl border border-white/5 flex items-center justify-between gap-4">
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-slate-200">{stTask.title}</p>
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[8px] font-bold font-mono bg-violet-500/10 text-violet-400 uppercase border border-violet-500/20">
                                  Session Splitting
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">Max 4h/day safety limit</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-xs font-bold font-mono text-slate-300 bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg">
                                ⏱️ {stTask.hoursAllocated} hrs
                              </span>
                              <button
                                onClick={() => setSelectedRescueTask({ title: stTask.title, hoursAllocated: stTask.hoursAllocated })}
                                className="px-3.5 py-1.5 bg-red-500 hover:bg-red-400 text-black text-[10px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-red-500/15 cursor-pointer flex items-center gap-1.5 hover:scale-[1.03]"
                              >
                                <Zap className="w-3 h-3 fill-current animate-pulse text-black" />
                                Focus
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Rescue specs panel (Right side) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* AI Verdict */}
            <div className={`p-5 rounded-3xl border space-y-3 shadow-lg ${getVerdictStyles(rescuePlan.verdict)}`}>
              <div className="flex items-center gap-2.5 border-b border-white/10 pb-2.5">
                <BrainCircuit className="w-5 h-5 text-violet-400" />
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest font-bold">AI Rescue Verdict</p>
                  <p className="text-xs italic text-slate-400">Decision node status</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-slate-400 font-medium">System Designation:</p>
                <h3 className="text-2xl font-black font-display uppercase tracking-tight">{rescuePlan.verdict} Mode</h3>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-semibold">AI Success Probability:</span>
                  <span className="font-bold font-mono text-white">{rescuePlan.successProbability}%</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div className="bg-violet-500 h-full transition-all duration-300" style={{ width: `${rescuePlan.successProbability}%` }}></div>
                </div>
              </div>
            </div>

            {/* Emergency Checklist */}
            <div className="bg-white/5 rounded-3xl p-5 border border-white/10 shadow-lg space-y-4">
              <h3 className="font-bold font-display text-sm text-white border-b border-white/5 pb-2.5">
                🛑 Emergency Rescue Protocol
              </h3>

              <div className="space-y-3">
                {rescuePlan.emergencyChecklist.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs">
                    <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 text-violet-400 flex items-center justify-center font-bold font-mono shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-slate-300 leading-relaxed font-sans">{item}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      ) : (
        <div className="bg-white/5 rounded-3xl p-16 border border-white/10 text-center space-y-4">
          <ShieldCheck className="w-12 h-12 text-slate-500 mx-auto animate-pulse" />
          <div className="space-y-1.5">
            <h3 className="font-bold text-white text-base">No Active Rescue Plan</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Ready to construct an emergency multi-day mitigation timeline? The Rescue Agent will split long sessions, isolate risks, and write tactical steps.
            </p>
          </div>
          <button
            id="empty-rescue-btn"
            onClick={onGenerateRescuePlan}
            className="inline-flex items-center gap-1.5 text-xs font-bold font-mono px-5 py-3 bg-red-500 hover:bg-red-400 text-black border border-red-600 rounded-2xl transition-all shadow-xl shadow-red-500/20 cursor-pointer"
          >
            Initiate AI Rescue Agent
          </button>
        </div>
      )}
      
      {selectedRescueTask && (
        <RescueFocusSession
          taskTitle={selectedRescueTask.title}
          allocatedHours={selectedRescueTask.hoursAllocated}
          onClose={() => setSelectedRescueTask(null)}
        />
      )}

    </div>
  );
}
