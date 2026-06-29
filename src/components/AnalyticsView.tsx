import React, { useState } from "react";
import { 
  Calendar as CalendarIcon, 
  TrendingUp, 
  BarChart4, 
  PieChart, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  BrainCircuit,
  Award,
  Calendar
} from "lucide-react";
import { Task, ProductivityStats } from "../types";

interface AnalyticsViewProps {
  tasks: Task[];
  stats: ProductivityStats | null;
  loading: boolean;
}

export default function AnalyticsView({
  tasks,
  stats,
  loading
}: AnalyticsViewProps) {
  
  const [currentMonth, setCurrentMonth] = useState(new Date("2026-06-29T08:35:00-07:00"));

  // Calendar rendering math
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Map tasks to dates
  const getTasksForDay = (day: number) => {
    const formattedMonth = (month + 1).toString().padStart(2, '0');
    const formattedDay = day.toString().padStart(2, '0');
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;

    return tasks.filter(t => t.deadline === dateStr);
  };

  // Switch months
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  // Helper values for rendering clean pure SVG custom double bar graphs (weekly trends)
  const timelineData = stats?.weeklyTimeline || [];
  const maxCreated = Math.max(...timelineData.map(d => d.created), 1);
  const maxCompleted = Math.max(...timelineData.map(d => d.completed), 1);
  const maxVal = Math.max(maxCreated, maxCompleted, 2);

  // Status breakdown metrics
  const completedCount = tasks.filter(t => t.status === "completed").length;
  const pendingCount = tasks.filter(t => t.status === "pending").length;
  const totalCount = tasks.length;
  const compRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* Analytics Page Intro Banner */}
      <div className="bg-white/5 rounded-3xl p-6 border border-white/10 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-violet-500/10 text-violet-400 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold font-display text-white">Productivity Intelligence Center</h1>
            <p className="text-xs text-slate-400">Rigorous data trends, calendar tracking, and strategic advice</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Calendar & Weekly trends */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Calendar Widget */}
          <div className="bg-white/5 rounded-3xl p-6 border border-white/10 shadow-lg space-y-4">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4.5 h-4.5 text-slate-400" />
                <h3 className="font-bold text-sm font-display text-white">Commitment Tracker</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="prev-month-btn"
                  onClick={handlePrevMonth}
                  className="p-1 border border-white/10 hover:bg-white/10 rounded-lg cursor-pointer text-slate-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-bold font-mono text-xs text-slate-200 min-w-[100px] text-center">
                  {monthNames[month]} {year}
                </span>
                <button
                  id="next-month-btn"
                  onClick={handleNextMonth}
                  className="p-1 border border-white/10 hover:bg-white/10 rounded-lg cursor-pointer text-slate-300"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of week headers */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Grid days */}
            <div className="grid grid-cols-7 gap-1 bg-white/5 p-1 rounded-2xl">
              {/* Empty offset days */}
              {Array.from({ length: firstDay }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-16 bg-white/[0.02] rounded-xl border border-white/[0.03]"></div>
              ))}

              {/* Real month days */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const dayTasks = getTasksForDay(dayNum);
                const hasPending = dayTasks.some(t => t.status === "pending");
                const hasCompleted = dayTasks.length > 0 && dayTasks.every(t => t.status === "completed");

                const isTodayStr = dayNum === 29 && month === 5 && year === 2026; // 2026-06-29

                return (
                  <div 
                    key={`day-${dayNum}`}
                    className={`h-16 bg-black/20 rounded-xl p-1.5 border border-white/5 flex flex-col justify-between relative select-none hover:bg-black/45 transition-all ${
                      isTodayStr ? 'ring-2 ring-violet-500/50 ring-offset-2 ring-offset-[#0A0B10]' : ''
                    }`}
                  >
                    {/* Day number */}
                    <span className={`text-[10px] font-mono font-bold ${isTodayStr ? 'text-violet-400' : 'text-slate-500'}`}>
                      {dayNum}
                    </span>

                    {/* Task due indicator dots */}
                    {dayTasks.length > 0 && (
                      <div className="space-y-1">
                        {dayTasks.slice(0, 2).map((t) => (
                          <div 
                            key={t.id}
                            className={`text-[8px] font-mono leading-none truncate px-1 py-0.5 rounded-md border font-bold ${
                              t.status === "completed"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-red-500/10 text-red-400 border-red-500/20"
                            }`}
                          >
                            {t.title}
                          </div>
                        ))}
                        {dayTasks.length > 2 && (
                          <div className="text-[7px] text-slate-500 font-bold font-mono text-right leading-none pr-1">
                            +{dayTasks.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weekly trends created vs completed (Pure Custom SVG Graph) */}
          <div className="bg-white/5 rounded-3xl p-6 border border-white/10 shadow-lg space-y-5">
            <div className="flex items-center gap-2">
              <BarChart4 className="w-4.5 h-4.5 text-slate-400" />
              <h3 className="font-bold text-sm font-display text-white">Weekly Created vs. Completed Velocity</h3>
            </div>

            <div className="h-44 flex items-end gap-6 pt-4 border-b border-white/10 pb-2 relative">
              
              {/* Baseline markers */}
              <div className="absolute right-0 top-0 text-[10px] font-mono text-slate-500 text-right space-y-10 w-full pointer-events-none select-none">
                <div className="border-t border-white/5 w-full pt-1">Max Burden ({maxVal} tasks)</div>
                <div className="border-t border-white/5 w-full pt-1">Half Capacity</div>
                <div className="border-t border-white/5 w-full pt-1">Base load</div>
              </div>

              {/* Bar items */}
              {timelineData.map((d, index) => {
                const createdHeight = (d.created / maxVal) * 100;
                const completedHeight = (d.completed / maxVal) * 100;

                return (
                  <div key={index} className="flex-1 flex flex-col items-center h-full justify-end relative z-10">
                    <div className="flex items-end gap-1.5 w-full justify-center">
                      {/* Created bar */}
                      <div 
                        className="bg-violet-500 rounded-t-lg w-3.5 transition-all duration-700 hover:brightness-110 shadow-lg shadow-violet-500/10" 
                        style={{ height: `${createdHeight}%`, minHeight: d.created > 0 ? '4px' : '0px' }}
                        title={`Created: ${d.created}`}
                      ></div>
                      {/* Completed bar */}
                      <div 
                        className="bg-emerald-500 rounded-t-lg w-3.5 transition-all duration-700 hover:brightness-110 shadow-lg shadow-emerald-500/10" 
                        style={{ height: `${completedHeight}%`, minHeight: d.completed > 0 ? '4px' : '0px' }}
                        title={`Completed: ${d.completed}`}
                      ></div>
                    </div>
                    {/* Label */}
                    <span className="text-[10px] font-mono font-bold text-slate-500 mt-2">{d.date}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center gap-6 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-3 h-3 bg-violet-500 rounded-lg"></span> Created Vectors
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-3 h-3 bg-emerald-500 rounded-lg"></span> Neutralized (Completed)
              </span>
            </div>
          </div>

        </div>

        {/* Right Column: Workload composition, long-term strategic report */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Workload composition donut progress */}
          <div className="bg-white/5 rounded-3xl p-5 border border-white/10 shadow-lg space-y-4">
            <h3 className="font-bold text-white font-display text-xs uppercase tracking-widest text-slate-500 border-b border-white/5 pb-2">
              Workload composition
            </h3>

            <div className="flex items-center gap-4">
              {/* Semi simple Donut progress bar */}
              <div className="relative flex items-center justify-center shrink-0">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    className="stroke-white/10"
                    strokeWidth="6"
                    fill="transparent"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    className="stroke-emerald-500"
                    strokeWidth="6"
                    strokeDasharray={201}
                    strokeDashoffset={201 - (201 * compRate) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <span className="absolute text-sm font-black font-mono text-white">{compRate}%</span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Completed: {completedCount} tasks
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-white/10 border border-white/5"></span>
                  Pending: {pendingCount} tasks
                </div>
              </div>
            </div>
          </div>

          {/* Hours by priority rating */}
          <div className="bg-white/5 rounded-3xl p-5 border border-white/10 shadow-lg space-y-4">
            <h3 className="font-bold text-white font-display text-xs uppercase tracking-widest text-slate-500 border-b border-white/5 pb-2">
              Remaining Hours by Priority
            </h3>

            <div className="space-y-3">
              {stats?.hoursByPriority.map((item, idx) => {
                const totalHours = stats.hoursByPriority.reduce((acc, h) => acc + h.hours, 0) || 1;
                const ratio = Math.round((item.hours / totalHours) * 100);

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium">{item.name}</span>
                      <span className="font-bold font-mono text-white">{item.hours} hrs</span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          item.name === "Critical" ? "bg-red-500" :
                          item.name === "High" ? "bg-violet-500" :
                          item.name === "Medium" ? "bg-amber-500" : "bg-blue-500"
                        }`}
                        style={{ width: `${ratio}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gemini Monthly strategy panel */}
          <div className="stepahead-purple-card text-white rounded-3xl p-5 border shadow-xl space-y-3">
            <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
              <BrainCircuit className="w-4.5 h-4.5 text-violet-400 animate-pulse" />
              <h4 className="font-bold text-xs font-mono uppercase tracking-widest text-slate-300">AI Strategic Assessment</h4>
            </div>

            {loading ? (
              <div className="space-y-2 py-2">
                <div className="h-3.5 bg-white/5 rounded w-full animate-pulse"></div>
                <div className="h-3.5 bg-white/5 rounded w-5/6 animate-pulse"></div>
                <div className="h-3.5 bg-white/5 rounded w-2/3 animate-pulse"></div>
              </div>
            ) : (
              <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium">
                "{stats?.monthlyStrategy || "Awaiting category compilation trends..."}"
              </p>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
