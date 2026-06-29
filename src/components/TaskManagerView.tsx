import React, { useState } from "react";
import { 
  CheckSquare, 
  Trash2, 
  Plus, 
  BrainCircuit, 
  Sparkles, 
  Calendar, 
  Clock, 
  Tag, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle,
  HelpCircle
} from "lucide-react";
import { Task, Subtask } from "../types";

interface TaskManagerViewProps {
  tasks: Task[];
  onCreateTask: (taskData: any) => Promise<void>;
  onUpdateTask: (taskId: string, updates: any) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onForceBreakdown: (taskId: string) => Promise<void>;
  loading: boolean;
}

export default function TaskManagerView({
  tasks,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onForceBreakdown,
  loading
}: TaskManagerViewProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [importance, setImportance] = useState<number>(3);
  const [duration, setDuration] = useState<number>(2);
  const [deadline, setDeadline] = useState("2026-06-30");
  const [category, setCategory] = useState("Academics");
  const [skipAI, setSkipAI] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Filter & Sorting state
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [sortBy, setSortBy] = useState<'priority' | 'deadline' | 'created'>('priority');
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  const toggleExpand = (taskId: string) => {
    setExpandedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !deadline) return;

    setFormLoading(true);
    try {
      await onCreateTask({
        title,
        description,
        importance,
        duration,
        deadline,
        category,
        skipAI
      });
      // Reset form
      setTitle("");
      setDescription("");
      setImportance(3);
      setDuration(2);
      setDeadline("2026-06-30");
    } catch (err) {
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubtaskToggle = async (task: Task, subtaskId: string) => {
    const updatedSubtasks = task.subtasks.map(st => 
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );

    // If all subtasks are completed, check if the parent task should also be completed
    const allCompleted = updatedSubtasks.every(st => st.completed);
    const newStatus = allCompleted ? 'completed' : 'pending';

    await onUpdateTask(task.id, {
      subtasks: updatedSubtasks,
      status: newStatus
    });
  };

  const handleTaskCompleteToggle = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    
    // Also toggle all subtasks to complete if task is marked complete
    const updatedSubtasks = task.subtasks.map(st => ({
      ...st,
      completed: newStatus === 'completed'
    }));

    await onUpdateTask(task.id, {
      status: newStatus,
      subtasks: updatedSubtasks
    });
  };

  // Determine priority classes and colors
  const getPriorityBadge = (score: number) => {
    if (score >= 150) {
      return { label: "🔴 Critical Risk", containerClass: "bg-red-500/10 text-red-400 border-red-500/20" };
    } else if (score >= 100) {
      return { label: "🟣 High Priority", containerClass: "bg-violet-500/10 text-violet-400 border-violet-500/20" };
    } else if (score >= 50) {
      return { label: "🟡 Medium", containerClass: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
    } else {
      return { label: "🟢 Low Burden", containerClass: "bg-white/5 text-slate-400 border-white/10" };
    }
  };

  const getCategoryClass = (cat: string) => {
    switch (cat) {
      case "Academics": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "Career": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "Work": return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "Personal": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      default: return "bg-white/5 text-slate-300 border-white/10";
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (filter === 'pending') return task.status === 'pending';
    if (filter === 'completed') return task.status === 'completed';
    return true;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'priority') {
      return b.priorityScore - a.priorityScore;
    } else if (sortBy === 'deadline') {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    } else {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* Create Task Form Panel */}
      <div className="lg:col-span-5 bg-white/5 rounded-3xl p-6 border border-white/10 shadow-lg h-fit space-y-6">
        <div className="flex items-center gap-2.5 border-b border-white/5 pb-3">
          <Sparkles className="w-5 h-5 text-violet-400" />
          <h2 className="font-bold text-white">Task Ingestion Portal</h2>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase font-mono tracking-widest">Task Title</label>
            <input
              id="task-title-input"
              type="text"
              required
              placeholder="e.g., Finalize Calculus Curve Set"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm border border-white/10 rounded-xl px-3 py-2.5 bg-black/20 text-white focus:bg-black/40 focus:outline-violet-500/30 transition-all placeholder:text-slate-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase font-mono tracking-widest">Description (Context)</label>
            <textarea
              id="task-desc-input"
              rows={2}
              placeholder="Provide extra deadlines context or subtask goals..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm border border-white/10 rounded-xl px-3 py-2.5 bg-black/20 text-white focus:bg-black/40 focus:outline-violet-500/30 transition-all placeholder:text-slate-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase font-mono tracking-widest flex items-center gap-1">
                Category <Tag className="w-3 h-3 text-slate-500" />
              </label>
              <select
                id="task-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-sm border border-white/10 rounded-xl px-2 py-2.5 bg-black/20 text-slate-200 focus:outline-violet-500/30 cursor-pointer"
              >
                <option value="Academics" className="bg-[#0A0B10]">Academics</option>
                <option value="Career" className="bg-[#0A0B10]">Career</option>
                <option value="Work" className="bg-[#0A0B10]">Work</option>
                <option value="Personal" className="bg-[#0A0B10]">Personal</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase font-mono tracking-widest flex items-center gap-1">
                Deadline <Calendar className="w-3 h-3 text-slate-500" />
              </label>
              <input
                id="task-deadline-input"
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full text-sm border border-white/10 rounded-xl px-2.5 py-2 bg-black/20 text-slate-200 focus:outline-violet-500/30 cursor-pointer"
              />
            </div>
          </div>

          {/* Sizing & Metrics sliders */}
          <div className="space-y-4 bg-white/5 rounded-2xl p-4 border border-white/5">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">
                <span>Importance / Impact</span>
                <span className="text-violet-400">{importance} / 5</span>
              </div>
              <input
                id="task-importance-slider"
                type="range"
                min="1"
                max="5"
                value={importance}
                onChange={(e) => setImportance(Number(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-500"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">
                <span>Estimated Duration</span>
                <span className="text-violet-400">{duration} hrs</span>
              </div>
              <input
                id="task-duration-slider"
                type="range"
                min="1"
                max="12"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-500"
              />
            </div>
          </div>

          {/* AI breakdown toggler */}
          <div className="flex items-center justify-between bg-violet-500/5 p-4 rounded-2xl border border-violet-500/10">
            <div className="flex items-center gap-2.5">
              <BrainCircuit className="w-5 h-5 text-violet-400" />
              <div>
                <p className="text-xs font-bold text-white">AI Intelligent Breakdown</p>
                <p className="text-[10px] text-slate-400">Auto-decompose into sequenced subtasks</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                id="task-ai-breakdown-toggle"
                type="checkbox"
                checked={!skipAI}
                onChange={(e) => setSkipAI(!e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/10 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
            </label>
          </div>

          <button
            id="create-task-btn"
            type="submit"
            disabled={formLoading}
            className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-2xl transition-all shadow-xl shadow-violet-500/20 cursor-pointer flex items-center justify-center gap-2 disabled:bg-white/10 disabled:text-slate-500"
          >
            {formLoading ? (
              <>Decomposing Task with Gemini...</>
            ) : (
              <>
                <Plus className="w-4 h-4 stroke-[3px]" /> Create & prioritize task
              </>
            )}
          </button>
        </form>
      </div>

      {/* Task List Panel */}
      <div className="lg:col-span-7 space-y-4">
        
        {/* Controls block */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 shadow-md">
          
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
            <button
              id="filter-pending-btn"
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 text-xs font-bold font-mono rounded-lg cursor-pointer transition-all ${filter === 'pending' ? 'bg-white/10 text-white shadow-inner' : 'text-slate-400 hover:text-white'}`}
            >
              Pending
            </button>
            <button
              id="filter-completed-btn"
              onClick={() => setFilter('completed')}
              className={`px-3 py-1.5 text-xs font-bold font-mono rounded-lg cursor-pointer transition-all ${filter === 'completed' ? 'bg-white/10 text-white shadow-inner' : 'text-slate-400 hover:text-white'}`}
            >
              Completed
            </button>
            <button
              id="filter-all-btn"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-bold font-mono rounded-lg cursor-pointer transition-all ${filter === 'all' ? 'bg-white/10 text-white shadow-inner' : 'text-slate-400 hover:text-white'}`}
            >
              All
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-mono uppercase text-slate-500 tracking-wider">Sort By</span>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs border border-white/10 rounded-lg bg-black/20 text-slate-300 px-3 py-1.5 font-mono focus:outline-none font-bold cursor-pointer"
            >
              <option value="priority" className="bg-[#0A0B10]">Priority Score</option>
              <option value="deadline" className="bg-[#0A0B10]">Deadline Proximity</option>
              <option value="created" className="bg-[#0A0B10]">Date Created</option>
            </select>
          </div>

        </div>

        {/* Tasks Stream */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="bg-white/5 rounded-3xl p-6 border border-white/5 h-32 animate-pulse space-y-3">
                <div className="h-4 bg-white/5 rounded w-1/3"></div>
                <div className="h-6 bg-white/5 rounded w-3/4"></div>
                <div className="h-4 bg-white/5 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : sortedTasks.length === 0 ? (
          <div className="bg-white/5 rounded-3xl p-12 border border-white/10 text-center space-y-4">
            <CheckSquare className="w-12 h-12 text-slate-500 mx-auto" />
            <h3 className="font-bold text-white text-base">No matching tasks found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Your filter settings are empty. Try clearing the filters or adding a new priority vector.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedTasks.map((task) => {
              const priority = getPriorityBadge(task.priorityScore);
              const isExpanded = !!expandedTasks[task.id];
              
              // Compute subtasks stats
              const totalSub = task.subtasks?.length || 0;
              const completedSub = task.subtasks?.filter(st => st.completed).length || 0;
              const percentSub = totalSub > 0 ? Math.round((completedSub / totalSub) * 100) : 0;
 
              return (
                <div 
                  key={task.id}
                  className={`bg-white/5 rounded-3xl border border-white/10 hover:border-violet-500/30 shadow-lg transition-all overflow-hidden ${task.status === 'completed' ? 'opacity-65' : ''}`}
                >
                  
                  {/* Card Header Area */}
                  <div className="p-5 space-y-3.5">
                    <div className="flex items-start justify-between gap-4">
                      
                      {/* Left Badge composition */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider border ${getCategoryClass(task.category)}`}>
                          {task.category}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border ${priority.containerClass}`}>
                          {priority.label}
                        </span>
                        
                        {/* Overdue alert indicator */}
                        {task.status === "pending" && new Date(task.deadline) < new Date("2026-06-29") && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-red-500 text-black border border-red-600 animate-pulse">
                            ⚠️ OVERDUE
                          </span>
                        )}
                      </div>
 
                      {/* Score Spotlight */}
                      <div className="text-right flex flex-col">
                        <span className="text-xl font-black font-mono text-white leading-none">
                          {task.priorityScore}
                        </span>
                        <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest mt-1">Priority Score</span>
                      </div>
 
                    </div>
 
                    <div className="space-y-1">
                      <h3 className={`text-base font-bold font-display text-white leading-snug flex items-center gap-3 ${task.status === 'completed' ? 'line-through text-slate-500' : ''}`}>
                        <input
                          id={`task-complete-toggle-${task.id}`}
                          type="checkbox"
                          checked={task.status === 'completed'}
                          onChange={() => handleTaskCompleteToggle(task)}
                          className="w-4 h-4 rounded-lg border-white/10 text-violet-500 focus:ring-violet-500 cursor-pointer accent-violet-500"
                        />
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className={`text-xs leading-relaxed ${task.status === 'completed' ? 'text-slate-500' : 'text-slate-400'}`}>{task.description}</p>
                      )}
                    </div>
 
                    {/* Timeline & Duration row */}
                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 border-t border-white/5 pt-3">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" /> Deadline: <span className="font-bold text-slate-200">{task.deadline}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" /> Block: <span className="font-bold text-slate-200">{task.duration}h</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        ⭐ Impact: <span className="font-bold text-slate-200">{task.importance}/5</span>
                      </span>
                    </div>
 
                    {/* Expand toggler & Progress */}
                    {totalSub > 0 && (
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-3 w-2/3">
                          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-violet-500 h-full transition-all duration-300" style={{ width: `${percentSub}%` }}></div>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 font-bold">{percentSub}%</span>
                        </div>
 
                        <button
                          id={`task-expand-btn-${task.id}`}
                          onClick={() => toggleExpand(task.id)}
                          className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-bold font-mono cursor-pointer"
                        >
                          {isExpanded ? (
                            <>Collapse <ChevronUp className="w-4 h-4" /></>
                          ) : (
                            <>Checklist ({completedSub}/{totalSub}) <ChevronDown className="w-4 h-4" /></>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
 
                  {/* Expandable Subtask checklist & AI reasoning section */}
                  {isExpanded && (
                    <div className="bg-black/30 border-t border-white/5 p-5 space-y-4">
                      
                      {/* AI Reasoning Block */}
                      {task.aiReasoning && (
                        <div className="p-3.5 bg-violet-500/5 rounded-2xl border border-violet-500/10 space-y-1.5 border-l-2 border-violet-500">
                          <p className="text-[10px] font-mono font-bold text-violet-400 flex items-center gap-1.5 uppercase tracking-widest">
                            <BrainCircuit className="w-3.5 h-3.5" /> Gemini Priority Analysis
                          </p>
                          <p className="text-xs text-slate-300 leading-relaxed font-sans">{task.aiReasoning}</p>
                        </div>
                      )}
 
                      {/* Subtasks checklists */}
                      {totalSub > 0 && (
                        <div className="space-y-2.5">
                          <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Subtask Decomposition</p>
                          <div className="space-y-2">
                            {task.subtasks.map((st) => (
                              <label 
                                key={st.id}
                                className={`flex items-center justify-between p-3 rounded-2xl border bg-black/20 cursor-pointer select-none transition-colors hover:bg-black/45 ${st.completed ? 'border-white/5 opacity-60' : 'border-white/10'}`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <input
                                    id={`subtask-toggle-${st.id}`}
                                    type="checkbox"
                                    checked={st.completed}
                                    onChange={() => handleSubtaskToggle(task, st.id)}
                                    className="w-4 h-4 rounded-lg text-violet-500 border-white/10 focus:ring-violet-500 cursor-pointer accent-violet-500"
                                  />
                                  <span className={`text-xs font-semibold text-slate-300 ${st.completed ? 'line-through text-slate-500' : ''}`}>
                                    {st.title}
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono font-bold text-slate-400 bg-white/5 border border-white/5 px-2 py-0.5 rounded-lg">
                                  {st.duration} hrs
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
 
                      {/* Extra Actions row */}
                      <div className="flex justify-between items-center border-t border-white/5 pt-3">
                        <button
                          id={`rebuild-subtasks-btn-${task.id}`}
                          onClick={() => onForceBreakdown(task.id)}
                          className="text-xs text-slate-400 hover:text-white font-bold font-mono cursor-pointer flex items-center gap-1"
                        >
                          🔄 Regen AI Checklist
                        </button>
 
                        <button
                          id={`delete-task-btn-${task.id}`}
                          onClick={() => onDeleteTask(task.id)}
                          className="text-xs text-red-400 hover:text-red-300 font-bold font-mono cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete Task
                        </button>
                      </div>
 
                    </div>
                  )}
 
                </div>
              );
            })}
          </div>
        )}
 
      </div>
 
    </div>
  );
}
