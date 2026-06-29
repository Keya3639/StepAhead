import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  BrainCircuit, 
  CheckCircle2, 
  HelpCircle,
  Zap,
  Waves,
  Music,
  Activity,
  Smile,
  AlertOctagon,
  Flame
} from "lucide-react";

interface RescueFocusSessionProps {
  taskTitle: string;
  allocatedHours: number;
  onClose: () => void;
}

export default function RescueFocusSession({
  taskTitle,
  allocatedHours,
  onClose
}: RescueFocusSessionProps) {
  // Timer States
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60); // 25 minutes
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);

  // Subtasks generated instantly for the focus session
  const [sessionSubtasks, setSessionSubtasks] = useState<Array<{ id: string; title: string; done: boolean }>>([
    { id: "s1", title: "Isolate immediate blocker & close distractions", done: false },
    { id: "s2", title: "Write initial skeletal drafts or draft main functions", done: false },
    { id: "s3", title: "Intense core development block (20 minutes of silence)", done: false },
    { id: "s4", title: "Self-validate outputs & prepare for review", done: false }
  ]);

  // Panic Level (1-100)
  const [panicLevel, setPanicLevel] = useState<number>(50);

  // Soundscape States
  const [soundscapeActive, setSoundscapeActive] = useState<boolean>(false);
  const [soundscapeType, setSoundscapeType] = useState<"binaural" | "brownian" | "cosmic">("binaural");
  const [volume, setVolume] = useState<number>(0.5);

  // Audio Refs for Web Audio API
  const audioCtxRef = useRef<AudioContext | null>(null);
  const osc1Ref = useRef<OscillatorNode | null>(null);
  const osc2Ref = useRef<OscillatorNode | null>(null);
  const noiseNodeRef = useRef<AudioWorkletNode | ScriptProcessorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      setSessionCompleted(true);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft]);

  // Web Audio API Synthesis implementation
  useEffect(() => {
    // If soundscape is active, trigger generation. If not, clean it up.
    if (soundscapeActive) {
      startSynth();
    } else {
      stopSynth();
    }
    return () => {
      stopSynth();
    };
  }, [soundscapeActive, soundscapeType]);

  // Adjust Volume in real-time
  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(volume * 0.15, audioCtxRef.current.currentTime);
    }
  }, [volume]);

  // Start Synthesizer Engine
  const startSynth = () => {
    try {
      // Initialize Audio Context on user interaction
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      // Stop previous synthesis nodes if any exist
      cleanupNodes();

      // Master Gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume * 0.15, ctx.currentTime);
      masterGain.connect(ctx.destination);
      gainNodeRef.current = masterGain;

      if (soundscapeType === "binaural") {
        // Binaural Beats: Oscillator 1 on left channel, Oscillator 2 on right channel
        // Left ear: 100 Hz, Right ear: 104 Hz (Creating 4 Hz Theta Brainwave frequency)
        const oscLeft = ctx.createOscillator();
        const oscRight = ctx.createOscillator();

        oscLeft.type = "sine";
        oscLeft.frequency.value = 100;

        oscRight.type = "sine";
        oscRight.frequency.value = 104;

        // Stereo Panning
        const pannerLeft = ctx.createStereoPanner();
        pannerLeft.pan.value = -1; // Left channel

        const pannerRight = ctx.createStereoPanner();
        pannerRight.pan.value = 1; // Right channel

        // Connect
        oscLeft.connect(pannerLeft).connect(masterGain);
        oscRight.connect(pannerRight).connect(masterGain);

        oscLeft.start();
        oscRight.start();

        osc1Ref.current = oscLeft;
        osc2Ref.current = oscRight;

      } else if (soundscapeType === "brownian") {
        // Brownian Noise Generation (Synthesizing randomized brownian rain noise)
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          // Brownian noise filter math: brown = (lastOut + (0.02 * white)) / 1.02
          output[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5; // Gain compensation
        }

        const source = ctx.createBufferSource();
        source.buffer = noiseBuffer;
        source.loop = true;

        // Add a soft lowpass filter for deep rain feel
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 400;

        source.connect(filter).connect(masterGain);
        source.start();
        noiseNodeRef.current = source as any;

      } else if (soundscapeType === "cosmic") {
        // Deep space cosmic pulsar sweep
        const drone = ctx.createOscillator();
        drone.type = "sawtooth";
        drone.frequency.value = 55; // Low A note

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 80;

        // LFO to modulate filter cutoff (Creating dynamic ambient sweeps)
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.15; // extremely slow oscillation (6s cycle)

        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 30;

        lfo.connect(lfoGain).connect(filter.frequency);
        drone.connect(filter).connect(masterGain);

        drone.start();
        lfo.start();

        osc1Ref.current = drone;
        osc2Ref.current = lfo;
      }

    } catch (err) {
      console.error("Failed to start soundscape synthesis:", err);
    }
  };

  const cleanupNodes = () => {
    if (osc1Ref.current) {
      try { osc1Ref.current.stop(); } catch (e) {}
      osc1Ref.current.disconnect();
      osc1Ref.current = null;
    }
    if (osc2Ref.current) {
      try { osc2Ref.current.stop(); } catch (e) {}
      osc2Ref.current.disconnect();
      osc2Ref.current = null;
    }
    if (noiseNodeRef.current) {
      try { (noiseNodeRef.current as any).stop(); } catch (e) {}
      noiseNodeRef.current.disconnect();
      noiseNodeRef.current = null;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }
  };

  const stopSynth = () => {
    cleanupNodes();
    if (audioCtxRef.current) {
      // Keep context alive but suspend to save CPU cycles
      try {
        audioCtxRef.current.suspend();
      } catch (e) {}
    }
  };

  // Format Timer text
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get dynamic focus message based on Panic slider
  const getDynamicPanicAdvice = (level: number) => {
    if (level <= 30) {
      return {
        vibe: "Cozy Flow State",
        message: "You are in complete control. Your heart rate is balanced. Keep a steady, peaceful cadence on coding.",
        accent: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
        icon: <Smile className="w-5 h-5 text-emerald-400" />
      };
    } else if (level <= 70) {
      return {
        vibe: "Controlled Urgency",
        message: "Action cures fear. Put down social media. Let's do a quick deep breath: inhale for 4s, hold 4s, release 4s. Now focus on subtask 1.",
        accent: "text-violet-400 border-violet-500/20 bg-violet-500/5",
        icon: <Activity className="w-5 h-5 text-violet-400 animate-pulse" />
      };
    } else {
      return {
        vibe: "CRISIS MITIGATION ACTIVE",
        message: "EMERGENCY PROTOCOL. Stop worrying about the absolute final deadline. Pick up your pen. Write exactly ONE line of code or one sentence. Action breaks the freeze response.",
        accent: "text-red-400 border-red-500/20 bg-red-500/10 animate-pulse",
        icon: <Flame className="w-5 h-5 text-red-500" />
      };
    }
  };

  const activeAdvice = getDynamicPanicAdvice(panicLevel);

  // Toggle single subtask status
  const toggleSubtask = (id: string) => {
    setSessionSubtasks(prev => prev.map(s => s.id === id ? { ...s, done: !s.done } : s));
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#06070a]/95 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      
      <div className="bg-[#0c0e17] border border-white/10 rounded-[32px] w-full max-w-4xl shadow-2xl p-6 md:p-8 space-y-8 relative overflow-hidden">
        
        {/* Abstract cyber backdrop glow */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-white/5 pb-5">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-red-500/10 text-red-400 rounded-xl animate-pulse">
              <Zap className="w-5 h-5" />
            </span>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">Active Rescue Session</p>
              <h2 className="text-lg font-bold text-white font-display truncate max-w-md">{taskTitle}</h2>
            </div>
          </div>
          <button 
            onClick={() => {
              stopSynth();
              onClose();
            }}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Pomodoro Circular Timer & Synth */}
          <div className="md:col-span-5 flex flex-col items-center justify-center space-y-6">
            
            {/* Glowing countdown display */}
            <div className="relative w-56 h-56 flex flex-col items-center justify-center rounded-full border-4 border-white/5 bg-black/40 shadow-xl shadow-red-500/5">
              
              {/* Dynamic glowing ring progress bar */}
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle
                  cx="112"
                  cy="112"
                  r="104"
                  className="stroke-white/5"
                  strokeWidth="4"
                  fill="transparent"
                />
                <circle
                  cx="112"
                  cy="112"
                  r="104"
                  className="stroke-red-500 transition-all duration-1000"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 104}
                  strokeDashoffset={2 * Math.PI * 104 * (1 - timeLeft / (25 * 60))}
                />
              </svg>

              <span className="text-4xl font-black font-mono tracking-tight text-white select-none">
                {formatTime(timeLeft)}
              </span>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-1">Rescue Timer</p>
              
              {isRunning && (
                <span className="absolute bottom-6 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
            </div>

            {/* Timer Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`py-3 px-6 rounded-2xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                  isRunning 
                    ? "bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20" 
                    : "bg-red-500 hover:bg-red-400 text-black shadow-lg shadow-red-500/20"
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" /> Pause Focus
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" /> Launch Block
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setIsRunning(false);
                  setTimeLeft(25 * 60);
                  setSessionCompleted(false);
                }}
                className="p-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-2xl border border-white/5 cursor-pointer transition-all"
                title="Reset session block"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Ambient Focus Synth Controller */}
            <div className="w-full bg-white/5 rounded-3xl p-5 border border-white/10 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <Waves className="w-4.5 h-4.5 text-violet-400 animate-pulse" />
                  <span className="text-xs font-bold font-mono text-white">Focus Soundscape Synthesizer</span>
                </div>
                <button
                  onClick={() => setSoundscapeActive(!soundscapeActive)}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                    soundscapeActive
                      ? "bg-violet-500/20 border-violet-500/30 text-violet-400"
                      : "bg-white/5 border-white/5 text-slate-500 hover:text-slate-300"
                  }`}
                  title={soundscapeActive ? "Stop focus soundscape" : "Start synthesized focus soundscape"}
                >
                  {soundscapeActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(["binaural", "brownian", "cosmic"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setSoundscapeType(type);
                      setSoundscapeActive(true);
                    }}
                    className={`p-2 rounded-xl text-[10px] font-mono font-bold capitalize border transition-all cursor-pointer ${
                      soundscapeType === type && soundscapeActive
                        ? "bg-violet-500/10 border-violet-500/30 text-violet-400 shadow-md"
                        : "bg-black/30 border-white/5 text-slate-400 hover:border-white/10"
                    }`}
                  >
                    {type === "binaural" ? "Binaural (4Hz)" : type === "brownian" ? "Rain Storm" : "Cosmic Pulsar"}
                  </button>
                ))}
              </div>

              {/* Volume Slider */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                  <span>Synthesizer Gain</span>
                  <span>{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full accent-violet-500 bg-white/10 rounded-lg cursor-pointer h-1.5"
                />
              </div>
            </div>

          </div>

          {/* Right Column: Subtasks & Panic Gauge Advice */}
          <div className="md:col-span-7 space-y-6">
            
            {/* Live Subtask Checkboard */}
            <div className="bg-white/5 rounded-3xl p-5 border border-white/10 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                <CheckCircle2 className="w-4.5 h-4.5 text-violet-400" />
                <h3 className="font-bold text-xs font-mono uppercase tracking-widest text-slate-400">Step Breakdown Checklist</h3>
              </div>

              <div className="space-y-2.5">
                {sessionSubtasks.map((st) => (
                  <div
                    key={st.id}
                    onClick={() => toggleSubtask(st.id)}
                    className={`p-3 bg-black/20 hover:bg-black/40 border rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      st.done 
                        ? "border-emerald-500/20 text-slate-400" 
                        : "border-white/5 text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        st.done 
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" 
                          : "border-white/20 hover:border-violet-500"
                      }`}>
                        {st.done && <span className="text-[10px] font-black">✓</span>}
                      </div>
                      <span className={`text-xs ${st.done ? "line-through text-slate-500" : ""}`}>{st.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Panic Slider */}
            <div className="bg-white/5 rounded-3xl p-5 border border-white/10 space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest">Active Anxiety Level</span>
                  <span className="text-xs font-mono font-bold text-violet-400">{panicLevel}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={panicLevel}
                  onChange={(e) => setPanicLevel(parseInt(e.target.value))}
                  className="w-full accent-red-500 bg-white/10 rounded-lg cursor-pointer h-2"
                />
              </div>

              {/* Dynamic Mind/Coaching Feedback Box */}
              <div className={`p-4 rounded-2xl border transition-all duration-300 flex items-start gap-3.5 ${activeAdvice.accent}`}>
                <span className="p-2 bg-black/30 rounded-xl shrink-0 mt-0.5">
                  {activeAdvice.icon}
                </span>
                <div className="space-y-1">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-80">{activeAdvice.vibe}</p>
                  <p className="text-xs leading-relaxed font-sans font-medium">{activeAdvice.message}</p>
                </div>
              </div>
            </div>

            {/* Motivational message or completion */}
            {sessionCompleted ? (
              <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-3xl text-center space-y-2">
                <h4 className="font-bold text-sm">🏆 Pomodoro Block Completed!</h4>
                <p className="text-xs text-slate-300 leading-relaxed">Excellent effort. Stand up, stretch, and grab some water. Your momentum is increasing!</p>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 justify-center text-xs text-slate-500 italic">
                <BrainCircuit className="w-4 h-4 text-slate-600 animate-pulse" />
                <span>The Web Audio Binaural beat plays right inside your headset to sync deep focus waves.</span>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
