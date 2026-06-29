import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini API Client
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey || "MOCK_KEY",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Dynamic API status tracking to handle free tier rate limit gracefully and transparently
let lastGeminiStatus: "connected" | "rate_limited" | "error" | "unconfigured" = apiKey ? "connected" : "unconfigured";
let lastGeminiErrorDetails = apiKey ? "Gemini 3.5 Flash is ready and active." : "No API key configured in settings. Running on local expert fallback model.";

// Helper to call Gemini with retry and exponential backoff
async function generateContentWithRetry(
  params: Parameters<typeof ai.models.generateContent>[0],
  retries = 3,
  delay = 1000
): Promise<Awaited<ReturnType<typeof ai.models.generateContent>>> {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await ai.models.generateContent(params);
      lastGeminiStatus = "connected";
      lastGeminiErrorDetails = "Gemini 3.5 Flash is active and fully optimized.";
      return result;
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      const isTransient = 
        err?.status === 503 || 
        err?.statusCode === 503 || 
        err?.status === 'UNAVAILABLE' || 
        errMsg.includes("503") || 
        errMsg.includes("UNAVAILABLE") || 
        errMsg.includes("high demand") || 
        errMsg.includes("temporary") ||
        errMsg.includes("overloaded");
      
      const isRateLimit = 
        err?.status === 429 || 
        err?.statusCode === 429 || 
        errMsg.includes("429") ||
        errMsg.includes("quota") ||
        errMsg.includes("RESOURCE_EXHAUSTED");

      if (isRateLimit) {
        lastGeminiStatus = "rate_limited";
        lastGeminiErrorDetails = "Google Free Tier Quota Limit reached (HTTP 429). Utilizing StepAhead offline local heuristic engine.";
      } else {
        lastGeminiStatus = "error";
        lastGeminiErrorDetails = errMsg || "Network communication failed.";
      }

      if ((isTransient || isRateLimit) && i < retries - 1) {
        const sleepTime = delay * Math.pow(2, i);
        console.warn(`[Gemini API Warning] Transient error encountered (attempt ${i + 1}/${retries}): ${errMsg}. Retrying in ${sleepTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, sleepTime));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Failed after maximum retries");
}

// Database Setup
const DB_PATH = path.join(process.cwd(), "db.json");

interface Subtask {
  id: string;
  title: string;
  duration: number;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  description: string;
  importance: 1 | 2 | 3 | 4 | 5;
  duration: number;
  deadline: string; // YYYY-MM-DD
  status: 'pending' | 'completed';
  createdAt: string;
  priorityScore: number;
  subtasks: Subtask[];
  aiReasoning?: string;
  category: string;
}

interface ScheduleBlock {
  id: string;
  taskId?: string;
  taskTitle: string;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  duration: number;
}

interface ReplanStep {
  date: string;
  tasks: Array<{
    taskId: string;
    title: string;
    hoursAllocated: number;
  }>;
}

interface RescuePlan {
  id: string;
  generatedAt: string;
  safetyScore: number;
  successProbability: number;
  verdict: 'Emergency' | 'Urgent' | 'Manageable' | 'Healthy';
  replanSteps: ReplanStep[];
  emergencyChecklist: string[];
}

interface CoachMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

interface DBState {
  tasks: Task[];
  schedule: ScheduleBlock[];
  rescuePlan: RescuePlan | null;
  coachMessages: CoachMessage[];
}

// Pre-populated demo state
const initialDB: DBState = {
  tasks: [
    {
      id: "demo-task-1",
      title: "Submit StepAhead Hackathon Project",
      description: "Complete full-stack implementation, verify deployment, and draft README.",
      importance: 5,
      duration: 6,
      deadline: "2026-06-30", // Tomorrow
      status: "pending",
      createdAt: "2026-06-28T12:00:00.000Z",
      priorityScore: 180,
      category: "Academics",
      aiReasoning: "Critical submission due tomorrow with high importance. Demands immediate focus.",
      subtasks: [
        { id: "demo-sub-1-1", title: "Complete server.ts backend", duration: 2, completed: true },
        { id: "demo-sub-1-2", title: "Implement interactive dashboard & rescue mode UI", duration: 2, completed: false },
        { id: "demo-sub-1-3", title: "Verify build correctness and write final documentation", duration: 2, completed: false }
      ]
    },
    {
      id: "demo-task-2",
      title: "Math Assignment 4: Calculus Curves",
      description: "Solve integration and curvature plotting problems from Chapter 8.",
      importance: 3,
      duration: 3,
      deadline: "2026-06-28", // Yesterday (Overdue!)
      status: "pending",
      createdAt: "2026-06-25T09:00:00.000Z",
      priorityScore: 215,
      category: "Academics",
      aiReasoning: "This task is OVERDUE. It takes top priority in the Rescue Agent queue.",
      subtasks: [
        { id: "demo-sub-2-1", title: "Draft problem set 1-5", duration: 1, completed: true },
        { id: "demo-sub-2-2", title: "Plot curve integrals", duration: 1, completed: false },
        { id: "demo-sub-2-3", title: "Compile final PDF & submit via student portal", duration: 1, completed: false }
      ]
    },
    {
      id: "demo-task-3",
      title: "Review Backend System Architecture",
      description: "Prepare for upcoming system design interview with focus on distributed pub-sub.",
      importance: 4,
      duration: 4,
      deadline: "2026-07-02", // 3 Days from now
      status: "pending",
      createdAt: "2026-06-27T14:00:00.000Z",
      priorityScore: 80,
      category: "Career",
      aiReasoning: "Significant Career milestone, but several days remain. Fit for structured deep work.",
      subtasks: [
        { id: "demo-sub-3-1", title: "Read Kafka partition replication papers", duration: 2, completed: false },
        { id: "demo-sub-3-2", title: "Sketch design diagrams for message broker", duration: 2, completed: false }
      ]
    },
    {
      id: "demo-task-4",
      title: "Buy Weekly Healthy Groceries",
      description: "Stock up on organic greens, milk, protein, and fruits for clean eating.",
      importance: 2,
      duration: 1,
      deadline: "2026-06-29", // Today
      status: "completed",
      createdAt: "2026-06-29T07:00:00.000Z",
      priorityScore: 20,
      category: "Personal",
      aiReasoning: "Completed task. Health state maintained.",
      subtasks: [
        { id: "demo-sub-4-1", title: "Write shopping checklist", duration: 0.5, completed: true },
        { id: "demo-sub-4-2", title: "Visit community grocery store", duration: 0.5, completed: true }
      ]
    }
  ],
  schedule: [],
  rescuePlan: null,
  coachMessages: [
    {
      id: "welcome-coach",
      role: "model",
      text: "Hello! I am your AI Productivity Coach. I analyzed your workload and noticed you have an overdue Calculus Curves assignment and a critical Hackathon project due tomorrow. I can help you budget your time, outline rescue steps, or coach you through the friction of starting. What's blocking you right now?",
      timestamp: "2026-06-29T08:35:00.000Z"
    }
  ]
};

function readDB(): DBState {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(initialDB, null, 2));
      return initialDB;
    }
    const data = fs.readFileSync(DB_PATH, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("DB reading failed, falling back to in-memory state:", err);
    return initialDB;
  }
}

function writeDB(state: DBState) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2));
  } catch (err) {
    console.error("DB writing failed:", err);
  }
}

// Multi-factor priority score calculation
const computePriorityScore = (task: Omit<Task, 'priorityScore' | 'createdAt'>) => {
  const today = new Date("2026-06-29T08:35:00-07:00");
  const deadlineDate = new Date(task.deadline);
  
  // Calculate difference in days relative to current local date
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let urgency = 1;
  if (diffDays < 0) {
    // Overdue task gets absolute peak weight
    urgency = 25 - diffDays; // scales higher the longer it's overdue
  } else if (diffDays === 0) {
    // Due today
    urgency = 20;
  } else if (diffDays === 1) {
    // Due tomorrow
    urgency = 15;
  } else if (diffDays === 2) {
    urgency = 10;
  } else if (diffDays <= 4) {
    urgency = 7;
  } else if (diffDays <= 7) {
    urgency = 4;
  } else {
    urgency = 2;
  }
  
  // priority score: (urgency * importance) / duration_factor
  // Square root dampens the effect of long durations so large tasks aren't penalized too heavily
  const durationFactor = Math.sqrt(task.duration || 1);
  const rawScore = (urgency * task.importance) / durationFactor;
  return Math.round(rawScore * 10);
};

// ==================== API ROUTES ====================

// GET ALL TASKS
app.get("/api/tasks", (req, res) => {
  const db = readDB();
  res.json(db.tasks);
});

// CREATE TASK WITH OPTIONAL AI BREAKDOWN & SCORE REASONING
app.post("/api/tasks", async (req, res) => {
  try {
    const { title, description, importance, duration, deadline, category, skipAI } = req.body;
    
    if (!title || !deadline || !importance || !duration) {
      return res.status(400).json({ error: "Missing required task parameters" });
    }

    const db = readDB();
    const taskId = "task-" + Date.now();
    
    // Create base task structure
    const baseTask: Omit<Task, 'priorityScore' | 'createdAt'> = {
      id: taskId,
      title,
      description: description || "",
      importance: Number(importance) as any,
      duration: Number(duration),
      deadline,
      status: "pending",
      category: category || "General",
      subtasks: []
    };

    const priorityScore = computePriorityScore(baseTask);
    const newTask: Task = {
      ...baseTask,
      priorityScore,
      createdAt: new Date().toISOString(),
      aiReasoning: "Calculated multi-factor priority score based on proximity and importance."
    };

    // If Gemini key is available and skipAI is not requested, get structured breakdown
    if (apiKey && !skipAI) {
      try {
        const prompt = `Task Title: "${title}"
Description: "${description || 'None'}"
Total Duration: ${duration} hours
Category: ${category}
Deadline: ${deadline}
Current Date Context: 2026-06-29

Perform a professional, tactical breakdown of this task. Break it down into 3-5 logical, sequenced subtasks. Write a brief sentence explaining why this task's deadline is critical or how the user should approach it (your Reasoning).`;

        const response = await generateContentWithRetry({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            systemInstruction: "You are an elite, highly detailed productivity agent that outputs rigorous subtask breakdowns and prioritizing reasonings in strict JSON format.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                aiReasoning: { type: Type.STRING, description: "A brief, punchy description of how to approach this task given its priority level." },
                subtasks: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      duration: { type: Type.NUMBER, description: "Subtask duration in hours" }
                    },
                    required: ["title", "duration"]
                  }
                }
              },
              required: ["aiReasoning", "subtasks"]
            }
          }
        });

        const result = JSON.parse(response.text || "{}");
        if (result.subtasks && result.subtasks.length > 0) {
          newTask.subtasks = result.subtasks.map((st: any, idx: number) => ({
            id: `sub-${taskId}-${idx}`,
            title: st.title,
            duration: st.duration,
            completed: false
          }));
        }
        if (result.aiReasoning) {
          newTask.aiReasoning = result.aiReasoning;
        }
      } catch (aiErr: any) {
        console.warn("[Tasks API] Gemini breakdown generation failed, using fallback:", aiErr?.message || aiErr);
        // Fallback default subtasks
        newTask.subtasks = [
          { id: `sub-${taskId}-1`, title: "Initial research and preparation", duration: Number(duration) * 0.4, completed: false },
          { id: `sub-${taskId}-2`, title: "Core work implementation", duration: Number(duration) * 0.4, completed: false },
          { id: `sub-${taskId}-3`, title: "Final review and submission", duration: Number(duration) * 0.2, completed: false }
        ];
      }
    } else {
      // Manual/Mock breakdown
      newTask.subtasks = [
        { id: `sub-${taskId}-1`, title: "Research & Plan", duration: Math.max(0.5, Number(duration) * 0.3), completed: false },
        { id: `sub-${taskId}-2`, title: "Execute core draft", duration: Math.max(0.5, Number(duration) * 0.5), completed: false },
        { id: `sub-${taskId}-3`, title: "Polish & Submit", duration: Math.max(0.5, Number(duration) * 0.2), completed: false }
      ];
    }

    db.tasks.unshift(newTask);
    writeDB(db);
    res.json(newTask);
  } catch (err) {
    console.error("Create task error:", err);
    res.status(500).json({ error: "Could not create task" });
  }
});

// UPDATE TASK (INCLUDING SUBTASK STATUS)
app.put("/api/tasks/:id", (req, res) => {
  const db = readDB();
  const index = db.tasks.findIndex(t => t.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: "Task not found" });
  }

  const existingTask = db.tasks[index];
  const updates = req.body;

  // Handle nested subtasks update if provided
  if (updates.subtasks) {
    existingTask.subtasks = updates.subtasks;
  }

  // Update primitive values
  if (updates.status) existingTask.status = updates.status;
  if (updates.title) existingTask.title = updates.title;
  if (updates.description !== undefined) existingTask.description = updates.description;
  if (updates.importance) existingTask.importance = Number(updates.importance) as any;
  if (updates.duration) existingTask.duration = Number(updates.duration);
  if (updates.deadline) existingTask.deadline = updates.deadline;
  if (updates.category) existingTask.category = updates.category;

  // Recalculate priority score
  existingTask.priorityScore = computePriorityScore(existingTask);

  db.tasks[index] = existingTask;
  writeDB(db);
  res.json(existingTask);
});

// DELETE TASK
app.delete("/api/tasks/:id", (req, res) => {
  const db = readDB();
  const filtered = db.tasks.filter(t => t.id !== req.params.id);
  
  if (filtered.length === db.tasks.length) {
    return res.status(404).json({ error: "Task not found" });
  }

  db.tasks = filtered;
  writeDB(db);
  res.json({ success: true });
});

// FORCE A NEW GEMINI SUBTASK BREAKDOWN
app.post("/api/tasks/:id/breakdown", async (req, res) => {
  try {
    const db = readDB();
    const task = db.tasks.find(t => t.id === req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    if (!apiKey) {
      return res.status(400).json({ error: "Gemini API key not configured. Enable in Settings > Secrets." });
    }

    const prompt = `Task Title: "${task.title}"
Description: "${task.description || 'None'}"
Total Duration: ${task.duration} hours
Category: ${task.category}
Deadline: ${task.deadline}
Current Date Context: 2026-06-29

Perform a professional, tactical breakdown of this task. Break it down into 3-5 logical, sequenced subtasks. Write a brief sentence explaining why this task's deadline is critical or how the user should approach it (your Reasoning).`;

    const response = await generateContentWithRetry({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an elite, highly detailed productivity agent that outputs rigorous subtask breakdowns and prioritizing reasonings in strict JSON format.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            aiReasoning: { type: Type.STRING },
            subtasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  duration: { type: Type.NUMBER }
                },
                required: ["title", "duration"]
              }
            }
          },
          required: ["aiReasoning", "subtasks"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    if (result.subtasks && result.subtasks.length > 0) {
      task.subtasks = result.subtasks.map((st: any, idx: number) => ({
        id: `sub-${task.id}-${idx}`,
        title: st.title,
        duration: st.duration,
        completed: false
      }));
    }
    if (result.aiReasoning) {
      task.aiReasoning = result.aiReasoning;
    }

    writeDB(db);
    res.json(task);
  } catch (err: any) {
    console.warn("[Tasks API] Force breakdown failed:", err?.message || err);
    res.status(500).json({ error: "Failed to generate AI breakdown: " + (err?.message || err) });
  }
});

// AUTONOMOUS DAILY SCHEDULER GENERATOR
app.post("/api/scheduler/generate", (req, res) => {
  const db = readDB();
  const pendingTasks = db.tasks
    .filter(t => t.status === "pending")
    .sort((a, b) => b.priorityScore - a.priorityScore);

  if (pendingTasks.length === 0) {
    db.schedule = [];
    writeDB(db);
    return res.json({ schedule: [], message: "No pending tasks to schedule!" });
  }

  const todayStr = "2026-06-29";
  const schedule: ScheduleBlock[] = [];
  
  // Decide starting hour based on user input or local time (2026-06-29T08:35:00)
  // Since it is currently 08:35, we can start the schedule at 09:00 AM!
  let currentHour = 9;
  let currentMin = 0;

  const formatTime = (h: number, m: number) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(h)}:${pad(m)}`;
  };

  const addMinutes = (h: number, m: number, totalMins: number) => {
    let newMins = m + totalMins;
    let newHours = h + Math.floor(newMins / 60);
    newMins = newMins % 60;
    return { h: newHours, m: newMins };
  };

  pendingTasks.forEach((task) => {
    // Schedule task up to a maximum of 3 hours per block to keep focus (Deep work flags)
    const workHours = Math.min(task.duration, 3);
    const startStr = formatTime(currentHour, currentMin);
    
    const end = addMinutes(currentHour, currentMin, workHours * 60);
    const endStr = formatTime(end.h, end.m);

    schedule.push({
      id: `sched-${task.id}`,
      taskId: task.id,
      taskTitle: task.title,
      startTime: startStr,
      endTime: endStr,
      isBreak: false,
      duration: workHours
    });

    // Add a 15-minute break
    currentHour = end.h;
    currentMin = end.m;
    
    const breakEnd = addMinutes(currentHour, currentMin, 15);
    const breakEndStr = formatTime(breakEnd.h, breakEnd.m);

    schedule.push({
      id: `sched-break-${task.id}`,
      taskTitle: "⚡ AI Quick Recharge (Break)",
      startTime: formatTime(currentHour, currentMin),
      endTime: breakEndStr,
      isBreak: true,
      duration: 0.25
    });

    currentHour = breakEnd.h;
    currentMin = breakEnd.m;
  });

  db.schedule = schedule;
  writeDB(db);
  res.json(schedule);
});

// GET CURRENT DAILY SCHEDULE
app.get("/api/scheduler", (req, res) => {
  const db = readDB();
  res.json(db.schedule);
});

// AUTONOMOUS DEADLINE RESCUE AGENT REPLANNING
app.post("/api/rescue/generate", async (req, res) => {
  try {
    const db = readDB();
    const pendingTasks = db.tasks.filter(t => t.status === "pending");

    if (pendingTasks.length === 0) {
      return res.json({
        id: "rescue-empty",
        generatedAt: new Date().toISOString(),
        safetyScore: 100,
        successProbability: 100,
        verdict: "Healthy",
        replanSteps: [],
        emergencyChecklist: ["You currently have no pending tasks to rescue. Keep up the high standard!"]
      });
    }

    const today = new Date("2026-06-29T08:35:00-07:00");
    
    // Scan risks
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

    // Compute dynamic safety score
    let safetyScore = 100;
    safetyScore -= overdueCount * 25;
    safetyScore -= todayCount * 20;
    safetyScore -= upcomingCount * 10;
    safetyScore = Math.max(0, safetyScore);

    // Replan steps generator
    let rescuePlan: RescuePlan;

    if (apiKey) {
      try {
        const tasksJson = JSON.stringify(pendingTasks.map(t => ({
          id: t.id,
          title: t.title,
          deadline: t.deadline,
          duration: t.duration,
          importance: t.importance,
          category: t.category
        })));

        const prompt = `System: You are StepAhead's autonomous Deadline Rescue Agent.
Current Date: 2026-06-29.
We have an active workload with safety score ${safetyScore}%. Overdue tasks count: ${overdueCount}, due today: ${todayCount}, upcoming inside 3 days: ${upcomingCount}.

Tasks list to replan:
${tasksJson}

Create an optimized daily recovery plan distributing work hours across the next 4 days starting from June 29 (June 29, June 30, July 1, July 2).
Rules:
1. Max total work hours per day should not exceed 8 hours to maintain safety.
2. Limit work on any single task to maximum 4 hours per day to prevent cognitive burnout (Session Splitting).
3. Overdue and due today tasks must receive immediate, heavy allocation on the first day (June 29).
4. Provide a realistic success probability (0-100%) and a direct, tactical emergency checklist of 3-5 actionable instructions.`;

        const response = await generateContentWithRetry({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            systemInstruction: "You are an elite, highly precise emergency replanning agent. Return strict JSON conforming to the schema.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                successProbability: { type: Type.INTEGER },
                verdict: { type: Type.STRING, description: "Must be one of: Emergency, Urgent, Manageable, Healthy" },
                emergencyChecklist: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                replanSteps: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      date: { type: Type.STRING },
                      tasks: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            taskId: { type: Type.STRING },
                            title: { type: Type.STRING },
                            hoursAllocated: { type: Type.NUMBER }
                          },
                          required: ["taskId", "title", "hoursAllocated"]
                        }
                      }
                    },
                    required: ["date", "tasks"]
                  }
                }
              },
              required: ["successProbability", "verdict", "emergencyChecklist", "replanSteps"]
            }
          }
        });

        const aiResult = JSON.parse(response.text || "{}");
        rescuePlan = {
          id: "rescue-" + Date.now(),
          generatedAt: new Date().toISOString(),
          safetyScore,
          successProbability: aiResult.successProbability || 75,
          verdict: aiResult.verdict || (safetyScore < 40 ? "Emergency" : safetyScore < 70 ? "Urgent" : "Manageable"),
          replanSteps: aiResult.replanSteps || [],
          emergencyChecklist: aiResult.emergencyChecklist || []
        };
      } catch (err: any) {
        console.warn("[Rescue API] AI Rescue plan generation failed, using mock plan:", err?.message || err);
        // Fallback offline rescue plan
        rescuePlan = generateMockRescuePlan(pendingTasks, safetyScore);
      }
    } else {
      // Mock Rescue Plan if no API key
      rescuePlan = generateMockRescuePlan(pendingTasks, safetyScore);
    }

    db.rescuePlan = rescuePlan;
    writeDB(db);
    res.json(rescuePlan);
  } catch (err) {
    console.error("Rescue generate error:", err);
    res.status(500).json({ error: "Failed to generate Rescue plan" });
  }
});

// GET CURRENT RESCUE PLAN
app.get("/api/rescue", (req, res) => {
  const db = readDB();
  res.json(db.rescuePlan);
});

// GET COACH CHAT MESSAGES
app.get("/api/coach/messages", (req, res) => {
  const db = readDB();
  res.json(db.coachMessages);
});

// POST COACH CHAT MESSAGE (CONVERSATIONAL AI COACH)
app.post("/api/coach/chat", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Empty message" });
    }

    const db = readDB();
    const userMessage: CoachMessage = {
      id: "user-" + Date.now(),
      role: "user",
      text,
      timestamp: new Date().toISOString()
    };
    db.coachMessages.push(userMessage);

    let replyText = "";

    if (apiKey) {
      try {
        const pendingTasks = db.tasks.filter(t => t.status === "pending");
        const completedCount = db.tasks.filter(t => t.status === "completed").length;
        const totalCount = db.tasks.length;
        const compRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;

        const systemMessage = `You are StepAhead's AI Productivity Coach.
Current Date: 2026-06-29.
The user's current situation:
- Completion rate: ${compRate}%
- Completed tasks: ${completedCount}/${totalCount}
- Pending tasks list: ${JSON.stringify(pendingTasks.map(t => ({ title: t.title, deadline: t.deadline, duration: t.duration, importance: t.importance, priorityScore: t.priorityScore })))}

Be empathetic, highly encouraging, but focus on IMMEDIATE ACTION. Break through procrastination. Offer specific suggestions relative to their task queue. Keep it down-to-earth and avoid excessive greeting. Answer in 3-5 crisp paragraphs max. Use markdown formatting.`;

        const response = await generateContentWithRetry({
          model: "gemini-3.5-flash",
          contents: [
            ...db.coachMessages.slice(-6).map(m => ({ role: m.role, parts: [{ text: m.text }] })),
            { role: "user", parts: [{ text }] }
          ],
          config: {
            systemInstruction: systemMessage,
          }
        });

        replyText = response.text || "I'm processing your workload. Let's focus on completing one task first!";
      } catch (aiErr: any) {
        console.warn("[Coach Chat API] AI Coach Chat generation failed, using offline response:", aiErr?.message || aiErr);
        replyText = "I see your message! I'm currently operating in offline mode, but I recommend breaking down your tasks into tiny steps. Pick your highest priority item, set a 25-minute timer, and just do the first step.";
      }
    } else {
      replyText = "I see your message! I am currently running without a Gemini API key. Please configure your key in **Settings > Secrets** to enable direct conversational insights, but for now: try selecting the Overdue calculus curve plotting and work on it for 15 minutes right now.";
    }

    const modelMessage: CoachMessage = {
      id: "model-" + Date.now(),
      role: "model",
      text: replyText,
      timestamp: new Date().toISOString()
    };
    db.coachMessages.push(modelMessage);
    writeDB(db);

    res.json(modelMessage);
  } catch (err) {
    console.error("Coach chat error:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// GET PRODUCTIVITY ANALYTICS & STATS
app.get("/api/stats", async (req, res) => {
  try {
    const db = readDB();
    const tasks = db.tasks;
    const completedTasks = tasks.filter(t => t.status === "completed");
    const pendingTasks = tasks.filter(t => t.status === "pending");

    const totalCount = tasks.length;
    const completionRate = totalCount > 0 ? Math.round((completedTasks.length / totalCount) * 100) : 0;

    // Calculate pending hours and overdue counts
    const today = new Date("2026-06-29T08:35:00-07:00");
    let pendingHours = 0;
    let criticalCount = 0;

    pendingTasks.forEach(t => {
      pendingHours += t.duration;
      const dl = new Date(t.deadline);
      const diffDays = Math.ceil((dl.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 1) {
        criticalCount++;
      }
    });

    // Burnout risk calculations
    let riskScore = 0;
    if (pendingHours > 12) riskScore += 40;
    else if (pendingHours > 6) riskScore += 20;

    if (criticalCount >= 2) riskScore += 40;
    else if (criticalCount === 1) riskScore += 20;

    if (pendingTasks.length > 5) riskScore += 20;

    let burnoutRisk: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
    if (riskScore >= 80) burnoutRisk = 'Critical';
    else if (riskScore >= 50) burnoutRisk = 'High';
    else if (riskScore >= 30) burnoutRisk = 'Medium';

    // Productivity Score = CompletionRate with critical/overdue penalty
    let productivityScore = completionRate;
    productivityScore -= criticalCount * 10;
    productivityScore = Math.max(0, Math.min(100, Math.round(productivityScore)));

    // Weekly Timeline data
    const weeklyTimeline = [
      { date: "06-25", created: 1, completed: 0 },
      { date: "06-26", created: 0, completed: 0 },
      { date: "06-27", created: 1, completed: 0 },
      { date: "06-28", created: 2, completed: 1 },
      { date: "06-29", created: pendingTasks.length, completed: completedTasks.length }
    ];

    // Priority distribution
    const priorityDistribution = [
      { name: "Critical (Score > 150)", value: pendingTasks.filter(t => t.priorityScore > 150).length },
      { name: "High (Score 100-150)", value: pendingTasks.filter(t => t.priorityScore >= 100 && t.priorityScore <= 150).length },
      { name: "Medium (Score 50-100)", value: pendingTasks.filter(t => t.priorityScore >= 50 && t.priorityScore < 100).length },
      { name: "Low (Score < 50)", value: pendingTasks.filter(t => t.priorityScore < 50).length }
    ].filter(p => p.value > 0);

    // Hours by Priority
    const hoursByPriority = [
      { name: "Critical", hours: pendingTasks.filter(t => t.priorityScore > 150).reduce((acc, t) => acc + t.duration, 0) },
      { name: "High", hours: pendingTasks.filter(t => t.priorityScore >= 100 && t.priorityScore <= 150).reduce((acc, t) => acc + t.duration, 0) },
      { name: "Medium", hours: pendingTasks.filter(t => t.priorityScore >= 50 && t.priorityScore < 100).reduce((acc, t) => acc + t.duration, 0) },
      { name: "Low", hours: pendingTasks.filter(t => t.priorityScore < 50).reduce((acc, t) => acc + t.duration, 0) }
    ];

    // Dynamic AI insights
    let aiInsights = "Complete your overdue Chapter 8 Calculus curve exercises right now. It is dragging down your Productivity Score and raising safety alarms.";
    let monthlyStrategy = "Your current workload has heavy Academic and Career priorities. Consider dedicating 90-minute morning focus sessions specifically to Academics and afternoon blocks to interview preparations.";
    let reliefStrategy = "";

    if (apiKey) {
      try {
        const statsPrompt = `System: You are StepAhead's analytics engine.
Current statistics:
- Completion rate: ${completionRate}%
- Pending tasks count: ${pendingTasks.length}
- Total pending hours: ${pendingHours}h
- Critical/Urgent tasks count: ${criticalCount}
- Calculated Burnout Risk level: ${burnoutRisk}

Generate three distinct pieces of productivity guidance in JSON format:
1. "aiInsights" - a brief, hyper-focused coaching instruction (1-2 sentences) on what the user should execute first to minimize stress.
2. "monthlyStrategy" - a medium-term structural planning advice (2-3 sentences) based on their workload.
3. "reliefStrategy" - (only if burnoutRisk is High or Critical) an actionable relief advice to prevent burnout. Return empty string if risk is low.`;

        const response = await generateContentWithRetry({
          model: "gemini-3.5-flash",
          contents: statsPrompt,
          config: {
            systemInstruction: "You are a concise data insights model. Return strict JSON matching the schema.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                aiInsights: { type: Type.STRING },
                monthlyStrategy: { type: Type.STRING },
                reliefStrategy: { type: Type.STRING }
              },
              required: ["aiInsights", "monthlyStrategy"]
            }
          }
        });

        const aiResult = JSON.parse(response.text || "{}");
        if (aiResult.aiInsights) aiInsights = aiResult.aiInsights;
        if (aiResult.monthlyStrategy) monthlyStrategy = aiResult.monthlyStrategy;
        if (aiResult.reliefStrategy) reliefStrategy = aiResult.reliefStrategy;
      } catch (aiErr: any) {
        console.warn("[Stats API] AI insights generation failed or was unavailable:", aiErr?.message || aiErr);
      }
    }

    if (!reliefStrategy && (burnoutRisk === "High" || burnoutRisk === "Critical")) {
      reliefStrategy = "Action Plan: 1) Pause all non-urgent grocery/shopping errands. 2) Limit focused work to 4 hours today. 3) Block out 30 minutes for a screen-free walk.";
    }

    res.json({
      productivityScore,
      burnoutRisk,
      burnoutDetails: {
        pendingHours,
        criticalCount,
        queueSize: pendingTasks.length,
        completionRatio: completionRate
      },
      completionRate,
      weeklyTimeline,
      priorityDistribution: priorityDistribution.length > 0 ? priorityDistribution : [{ name: "No tasks", value: 0 }],
      hoursByPriority,
      aiInsights,
      monthlyStrategy,
      reliefStrategy,
      apiStatus: {
        status: lastGeminiStatus,
        details: lastGeminiErrorDetails
      }
    });
  } catch (err) {
    console.error("Stats API error:", err);
    res.status(500).json({ error: "Failed to load stats" });
  }
});

// Helper: fallback rescue plan generator when Gemini is offline/unconfigured
function generateMockRescuePlan(pendingTasks: Task[], safetyScore: number): RescuePlan {
  const steps: ReplanStep[] = [
    {
      date: "2026-06-29",
      tasks: pendingTasks.slice(0, 2).map(t => ({
        taskId: t.id,
        title: t.title,
        hoursAllocated: Math.min(t.duration, 3)
      }))
    },
    {
      date: "2026-06-30",
      tasks: pendingTasks.slice().reverse().map(t => ({
        taskId: t.id,
        title: t.title,
        hoursAllocated: Math.max(1, Math.min(t.duration, 2))
      }))
    }
  ];

  return {
    id: "rescue-mock-" + Date.now(),
    generatedAt: new Date().toISOString(),
    safetyScore,
    successProbability: safetyScore < 50 ? 60 : 85,
    verdict: safetyScore < 40 ? "Emergency" : safetyScore < 70 ? "Urgent" : "Manageable",
    replanSteps: steps,
    emergencyChecklist: [
      "Cancel or postpone all social events for the next 24 hours.",
      "Turn off all notifications on your smartphone except direct calls.",
      "Focus entirely on completing Chapter 8 Calculus curves problems before midnight."
    ]
  };
}

// ==================== VITE DEVELOPMENT ENVIRONMENT / PRODUCTION STATIC SERVER ====================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite Development Server middleware mounted");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production assets from dist/");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`StepAhead Full-Stack server booted and listening on http://localhost:${PORT}`);
  });
}

startServer();
