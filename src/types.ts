export interface Subtask {
  id: string;
  title: string;
  duration: number; // estimated hours
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  importance: 1 | 2 | 3 | 4 | 5; // 5 is highest
  duration: number; // estimated hours
  deadline: string; // YYYY-MM-DD
  status: 'pending' | 'completed';
  createdAt: string;
  priorityScore: number; // calculated as: (urgency_factor * importance) / duration_factor
  subtasks: Subtask[];
  aiReasoning?: string;
  category: string;
}

export interface ScheduleBlock {
  id: string;
  taskId?: string;
  taskTitle: string;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  isBreak: boolean;
  duration: number; // hours
}

export interface ReplanStep {
  date: string;
  tasks: Array<{
    taskId: string;
    title: string;
    hoursAllocated: number;
  }>;
}

export interface RescuePlan {
  id: string;
  generatedAt: string;
  safetyScore: number; // 0-100
  successProbability: number; // 0-100
  verdict: 'Emergency' | 'Urgent' | 'Manageable' | 'Healthy';
  replanSteps: ReplanStep[];
  emergencyChecklist: string[];
}

export interface CoachMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface ProductivityStats {
  productivityScore: number; // 0-100
  burnoutRisk: 'Low' | 'Medium' | 'High' | 'Critical';
  burnoutDetails: {
    pendingHours: number;
    criticalCount: number;
    queueSize: number;
    completionRatio: number;
  };
  completionRate: number; // percentage
  weeklyTimeline: Array<{ date: string; created: number; completed: number }>;
  priorityDistribution: Array<{ name: string; value: number }>;
  hoursByPriority: Array<{ name: string; hours: number }>;
  aiInsights: string;
  monthlyStrategy: string;
  reliefStrategy?: string;
  apiStatus?: {
    status: 'connected' | 'rate_limited' | 'error' | 'unconfigured';
    details: string;
  };
}
