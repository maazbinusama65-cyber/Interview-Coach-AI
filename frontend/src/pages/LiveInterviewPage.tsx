import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  converse,
  evaluateInterview,
  type ConversationTurn,
  type ConverseResponse,
  type EvaluateResponse,
  type HistoryEntry,
  type InterviewEvaluation,
  type SpeechAnalysis,
} from "../api/interview";

/* ─── SpeechRecognition type shim ─────────────────────────────────────── */

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionInstance = any;

/* ─── Hook: useSpeechRecognition ──────────────────────────────────────── */

function useSpeechRecognition() {
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [supported, setSupported] = useState(true);
  const processedIndexRef = useRef(0);

  useEffect(() => {
    const SR = (window as unknown as Record<string, unknown>).SpeechRecognition ??
               (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    const recognition = new (SR as new () => SpeechRecognitionInstance)();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let newFinal = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          if (i >= processedIndexRef.current) {
            newFinal += result[0].transcript + " ";
            processedIndexRef.current = i + 1;
          }
        } else {
          interim += result[0].transcript;
        }
      }
      if (newFinal) setTranscript((prev) => prev + newFinal);
      setInterimTranscript(interim);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
  }, []);

  const start = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    processedIndexRef.current = 0;
    try {
      recognitionRef.current?.start();
      setIsListening(true);
    } catch {
      /* already started */
    }
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return { isListening, transcript, interimTranscript, start, stop, supported };
}

/* ─── Hook: useWebcam ─────────────────────────────────────────────────── */

function useWebcam(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      /* camera denied */
    }
  }, [videoRef]);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mr = new MediaRecorder(streamRef.current, { mimeType: "video/webm" });
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setRecordedUrl(URL.createObjectURL(blob));
    };
    mr.start(1000);
    recorderRef.current = mr;
    setRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
    setRecording(false);
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  return { startCamera, startRecording, stopRecording, stopCamera, recording, recordedUrl };
}

/* ─── TTS ─────────────────────────────────────────────────────────────── */

function speak(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) { resolve(); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.0;
    u.pitch = 1.0;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
  });
}

/* ─── Score bar helper ────────────────────────────────────────────────── */

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = (value / 10) * 100;
  const color = value >= 7 ? "var(--success)" : value >= 5 ? "var(--warning)" : "var(--danger)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <span style={{ fontSize: "0.82rem", color: "var(--text-dim)", minWidth: 160 }}>{label}</span>
      <div style={{ flex: 1, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 4, background: color, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ fontSize: "0.88rem", fontWeight: 700, minWidth: 32, textAlign: "right", color }}>{value}/10</span>
    </div>
  );
}

/* ─── Results Dashboard ───────────────────────────────────────────────── */

function ResultsDashboard({
  evaluation,
  speechStats,
  recordedUrl,
  sessionId,
  onNewInterview,
}: {
  evaluation: InterviewEvaluation;
  speechStats: { avgWpm: number; totalFillers: number; avgClarity: number; turns: number; fillerWords: string[] };
  recordedUrl: string | null;
  sessionId: string | null;
  onNewInterview: () => void;
}) {
  const scoreColor = (s: number) => s >= 7 ? "var(--success)" : s >= 5 ? "var(--warning)" : "var(--danger)";

  return (
    <div style={{ padding: "2rem 1.5rem", maxWidth: 800, margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Overall score hero */}
      <div style={{ textAlign: "center", padding: "2rem 0" }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
          Overall Score
        </div>
        <div style={{ fontSize: "4rem", fontWeight: 900, color: scoreColor(evaluation.overall_score), lineHeight: 1 }}>
          {evaluation.overall_score}<span style={{ fontSize: "1.5rem", color: "var(--text-muted)" }}>/10</span>
        </div>
        <p style={{ color: "var(--text-dim)", marginTop: "0.75rem", fontSize: "0.95rem", lineHeight: 1.6, maxWidth: 600, margin: "0.75rem auto 0" }}>
          {evaluation.summary}
        </p>
      </div>

      {/* Dimension scores */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
          Performance Breakdown
        </div>
        <ScoreBar label="Communication Clarity" value={evaluation.communication_clarity} />
        <ScoreBar label="Structure & Organization" value={evaluation.structure_organization} />
        <ScoreBar label="Technical Depth" value={evaluation.technical_depth} />
        <ScoreBar label="Use of Examples" value={evaluation.use_of_examples} />
        <ScoreBar label="Confidence" value={evaluation.confidence} />
      </div>

      {/* Topic scores */}
      {evaluation.topic_scores.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.25rem" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
            Topic Scores
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {evaluation.topic_scores.map((ts) => (
              <div key={ts.topic} style={{ padding: "0.75rem", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{ts.topic}</span>
                  <span style={{ fontWeight: 800, fontSize: "1.1rem", color: scoreColor(ts.score) }}>
                    {ts.score}<span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>/10</span>
                  </span>
                </div>
                {ts.strengths.length > 0 && (
                  <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginBottom: "0.2rem" }}>
                    <span style={{ color: "var(--success)", fontWeight: 600 }}>+</span> {ts.strengths.join(" · ")}
                  </div>
                )}
                {ts.gaps.length > 0 && (
                  <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
                    <span style={{ color: "var(--danger)", fontWeight: 600 }}>-</span> {ts.gaps.join(" · ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths & improvements */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12, padding: "1rem" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--success)", marginBottom: "0.5rem" }}>
            Top Strengths
          </div>
          <ul style={{ margin: 0, padding: "0 0 0 1rem", fontSize: "0.85rem", lineHeight: 1.7, color: "var(--text-dim)" }}>
            {evaluation.top_strengths.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
        <div style={{ background: "rgba(248,113,113,0.04)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 12, padding: "1rem" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--danger)", marginBottom: "0.5rem" }}>
            Areas to Improve
          </div>
          <ul style={{ margin: 0, padding: "0 0 0 1rem", fontSize: "0.85rem", lineHeight: 1.7, color: "var(--text-dim)" }}>
            {evaluation.areas_to_improve.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      </div>

      {/* Speech stats */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.25rem" }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
          Speech Analysis
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
          {[
            { label: "Avg WPM", value: speechStats.avgWpm || "—" },
            { label: "Total Fillers", value: speechStats.totalFillers },
            { label: "Avg Clarity", value: speechStats.avgClarity ? `${speechStats.avgClarity}/10` : "—" },
            { label: "Turns", value: speechStats.turns },
          ].map(s => (
            <div key={s.label} style={{ padding: "0.65rem", borderRadius: 8, background: "rgba(255,255,255,0.025)", border: "1px solid var(--border)", textAlign: "center" }}>
              <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>{s.value}</div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>
        {speechStats.fillerWords.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginTop: "0.75rem" }}>
            {speechStats.fillerWords.map(f => (
              <span key={f} style={{
                padding: "0.15rem 0.45rem", borderRadius: 6,
                background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)",
                fontSize: "0.7rem", color: "var(--danger)",
              }}>
                "{f}"
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap", paddingTop: "0.5rem" }}>
        <button className="btn-primary" onClick={onNewInterview}>New Interview →</button>
        {recordedUrl && (
          <a href={recordedUrl} download="interview-recording.webm">
            <button className="btn-secondary">Download Recording</button>
          </a>
        )}
        {sessionId && (
          <Link to={`/interview/${sessionId}/done`}><button className="btn-secondary">View Saved Report</button></Link>
        )}
        <Link to="/dashboard"><button className="btn-secondary">Dashboard</button></Link>
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

interface LocationState {
  topics: string[];
  level: string;
  interview_type: string;
}

export default function LiveInterviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [turns, setTurns] = useState<{ turn: ConversationTurn; speech: SpeechAnalysis | null }[]>([]);
  const [phase, setPhase] = useState<"waiting" | "ai_speaking" | "user_speaking" | "processing" | "done" | "evaluating" | "results">("waiting");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [evaluation, setEvaluation] = useState<InterviewEvaluation | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { isListening, transcript, interimTranscript, start: startSTT, stop: stopSTT, supported } = useSpeechRecognition();
  const { startCamera, startRecording, stopRecording, stopCamera, recording: _recording, recordedUrl } = useWebcam(videoRef);
  void _recording;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, phase]);

  useEffect(() => {
    if (started && phase !== "done" && phase !== "evaluating" && phase !== "results") {
      timerRef.current = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [started, phase]);

  const topics = state?.topics ?? [];
  const level = state?.level ?? "mid";
  const interviewType = state?.interview_type ?? "mixed";

  if (!state || topics.length === 0) {
    return (
      <div className="page" style={{ textAlign: "center", paddingTop: "6rem" }}>
        <h2 style={{ fontWeight: 700, marginBottom: "0.75rem" }}>No interview configured</h2>
        <p style={{ color: "var(--text-dim)", marginBottom: "1.5rem" }}>Go back and select your topics first.</p>
        <Link to="/setup"><button className="btn-primary">Go to Setup →</button></Link>
      </div>
    );
  }

  async function callAI(userTranscript?: string) {
    setLoading(true);
    setPhase("processing");
    try {
      const res: ConverseResponse = await converse(topics, level, interviewType, history, userTranscript);

      const newHistory = [...history];
      if (userTranscript) {
        newHistory.push({ role: "user", content: userTranscript });
      }
      newHistory.push({ role: "assistant", content: res.turn.ai_message });
      setHistory(newHistory);
      setTurns((prev) => [...prev, { turn: res.turn, speech: res.speech_analysis }]);

      setPhase("ai_speaking");
      await speak(res.turn.ai_message);

      if (res.turn.action === "wrap_up") {
        await finishInterview(newHistory);
      } else {
        setPhase("waiting");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI failed to respond");
      setPhase("waiting");
    } finally {
      setLoading(false);
    }
  }

  async function finishInterview(finalHistory: HistoryEntry[]) {
    stopRecording();
    stopCamera();
    setPhase("evaluating");
    try {
      const res: EvaluateResponse = await evaluateInterview(topics, level, interviewType, finalHistory);
      setEvaluation(res.evaluation);
      setSessionId(res.session_id);
      setPhase("results");
    } catch {
      setEvaluation(null);
      setPhase("done");
    }
  }

  async function handleStart() {
    setStarted(true);
    await startCamera();
    startRecording();
    await callAI();
  }

  function handleStartSpeaking() {
    startSTT();
    setPhase("user_speaking");
  }

  async function handleStopSpeaking() {
    stopSTT();
    const finalTranscript = (transcript + " " + interimTranscript).trim();
    if (finalTranscript) {
      await callAI(finalTranscript);
    } else {
      setPhase("waiting");
    }
  }

  async function handleChatSubmit() {
    const text = chatInput.trim();
    if (!text || loading) return;
    setChatInput("");
    await callAI(text);
  }

  function handleEnd() {
    stopRecording();
    stopCamera();
    finishInterview(history);
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const speechStats = (() => {
    const feedbacks = turns.filter(t => t.speech).map(t => t.speech!);
    return {
      avgWpm: feedbacks.length ? Math.round(feedbacks.reduce((s, f) => s + f.estimated_wpm, 0) / feedbacks.length) : 0,
      totalFillers: feedbacks.reduce((s, f) => s + f.filler_count, 0),
      avgClarity: feedbacks.length ? Math.round((feedbacks.reduce((s, f) => s + f.clarity_score, 0) / feedbacks.length) * 10) / 10 : 0,
      turns: feedbacks.length,
      fillerWords: [...new Set(turns.flatMap(t => t.speech?.filler_words ?? []))],
    };
  })();

  // Results dashboard view
  if (phase === "results" && evaluation) {
    return (
      <div style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <div className="hero-glow" style={{ top: -500, opacity: 0.3 }} />
        <nav className="nav">
          <div className="nav-brand">
            <span className="nav-brand-mark" />
            Interview Results
          </div>
          <span style={{ fontSize: "0.85rem", color: "var(--text-dim)", fontFamily: "monospace", fontWeight: 600 }}>
            {formatTime(elapsedSec)}
          </span>
        </nav>
        <div style={{ flex: 1, overflowY: "auto" }}>
          <ResultsDashboard
            evaluation={evaluation}
            speechStats={speechStats}
            recordedUrl={recordedUrl}
            sessionId={sessionId}
            onNewInterview={() => navigate("/setup")}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div className="hero-glow" style={{ top: -500, opacity: 0.3 }} />

      {/* ── Nav ── */}
      <nav className="nav">
        <div className="nav-brand">
          <span className="nav-brand-mark" />
          Live Interview
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {started && (
            <>
              <span style={{
                display: "flex", alignItems: "center", gap: "0.4rem",
                fontSize: "0.82rem", color: phase === "done" || phase === "evaluating" ? "var(--text-muted)" : "var(--danger)",
                fontWeight: 600,
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: phase === "done" || phase === "evaluating" ? "var(--text-muted)" : "var(--danger)",
                  boxShadow: phase === "done" || phase === "evaluating" ? "none" : "0 0 8px var(--danger)",
                  animation: phase === "done" || phase === "evaluating" ? "none" : "glow-pulse 2s ease-in-out infinite",
                }} />
                {phase === "done" || phase === "evaluating" ? "Ended" : "Recording"}
              </span>
              <span style={{ fontSize: "0.85rem", color: "var(--text-dim)", fontFamily: "monospace", fontWeight: 600 }}>
                {formatTime(elapsedSec)}
              </span>
            </>
          )}
          {started && phase !== "done" && phase !== "evaluating" && (
            <button className="btn-secondary" onClick={handleEnd} style={{ fontSize: "0.82rem" }}>
              End Interview
            </button>
          )}
        </div>
      </nav>

      {/* ── Main layout ── */}
      <div style={{
        flex: 1, display: "grid",
        gridTemplateColumns: started ? "1fr 380px" : "1fr",
        gap: 0, height: "calc(100vh - 60px)", minHeight: 0, overflow: "hidden",
      }}>
        {/* Left: chat / conversation */}
        <div style={{
          display: "flex", flexDirection: "column",
          borderRight: started ? "1px solid var(--border)" : "none",
          minHeight: 0, overflow: "hidden",
        }}>
          {/* Chat messages */}
          <div style={{
            flex: 1, minHeight: 0, overflowY: "auto", padding: "1.5rem",
            display: "flex", flexDirection: "column", gap: "0.75rem",
          }}>
            {!started && (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1.5rem", textAlign: "center" }}>
                <div style={{ fontSize: "3rem" }}>🎤</div>
                <h1 style={{ fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.03em" }}>
                  Ready for your <span className="gradient-text">live interview</span>?
                </h1>
                <p style={{ color: "var(--text-dim)", maxWidth: 500, lineHeight: 1.65 }}>
                  The AI interviewer will ask you questions via voice. Speak naturally — your camera and mic will record the session. Feedback and scores will be shown after the interview.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", justifyContent: "center" }}>
                  {topics.map((t) => (
                    <span key={t} className="chip chip-topic">{t}</span>
                  ))}
                </div>
                {!supported && (
                  <div className="error-banner">
                    Speech recognition is not supported in this browser. Please use Chrome or Edge.
                  </div>
                )}
                <button
                  className="btn-primary btn-primary-lg anim-pulse"
                  onClick={handleStart}
                  disabled={!supported}
                  style={{ marginTop: "0.5rem" }}
                >
                  Start Interview →
                </button>
              </div>
            )}

            {/* Show only the current (latest) AI question and user's answer */}
            {started && turns.length > 0 && (() => {
              const lastIdx = turns.length - 1;
              const t = turns[lastIdx];
              const userMsg = history[lastIdx * 2 + 1];
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", flex: 1, justifyContent: "center" }}>
                  <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", textAlign: "center" }}>
                    Question {turns.length} of ~{Math.max(topics.length * 2, turns.length)}
                  </div>
                  {/* AI question */}
                  <div style={{
                    display: "flex", gap: "0.65rem", alignItems: "flex-start",
                  }}>
                    <span style={{
                      width: 30, height: 30, borderRadius: 9, fontSize: "0.8rem",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)",
                      flexShrink: 0, color: "var(--indigo-light)", fontWeight: 700,
                    }}>AI</span>
                    <div style={{
                      background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)",
                      borderRadius: "4px 14px 14px 14px", padding: "0.75rem 1rem",
                      fontSize: "0.95rem", lineHeight: 1.7, flex: 1,
                    }}>
                      {t.turn.ai_message}
                    </div>
                  </div>

                  {/* User response (if answered) */}
                  {userMsg && (
                    <div style={{
                      display: "flex", gap: "0.65rem", justifyContent: "flex-end",
                      alignItems: "flex-start",
                    }}>
                      <div style={{
                        background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
                        borderRadius: "14px 4px 14px 14px", padding: "0.75rem 1rem",
                        fontSize: "0.92rem", lineHeight: 1.6, maxWidth: "80%",
                        color: "var(--text-dim)",
                      }}>
                        {userMsg.content}
                      </div>
                      <span style={{
                        width: 30, height: 30, borderRadius: 9, fontSize: "0.8rem",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)",
                        flexShrink: 0, color: "var(--success)", fontWeight: 700,
                      }}>You</span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Loading indicator */}
            {loading && (
              <div style={{ display: "flex", gap: "0.65rem", alignItems: "center" }}>
                <span style={{
                  width: 30, height: 30, borderRadius: 9,
                  background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <span style={{
                    width: 14, height: 14, border: "2px solid rgba(99,102,241,0.3)",
                    borderTopColor: "var(--indigo-light)", borderRadius: "50%",
                    animation: "spin-slow 0.8s linear infinite",
                  }} />
                </span>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>AI is thinking…</span>
              </div>
            )}

            {/* Live transcript */}
            {isListening && (transcript || interimTranscript) && (
              <div style={{
                display: "flex", gap: "0.65rem", justifyContent: "flex-end",
                alignItems: "flex-start", opacity: 0.7,
              }}>
                <div style={{
                  background: "rgba(16,185,129,0.05)", border: "1px dashed rgba(16,185,129,0.25)",
                  borderRadius: "14px 4px 14px 14px", padding: "0.75rem 1rem",
                  fontSize: "0.88rem", lineHeight: 1.6, maxWidth: 600,
                  color: "var(--text-dim)", fontStyle: "italic",
                }}>
                  {transcript}{interimTranscript}
                  <span style={{ color: "var(--indigo-light)", fontWeight: 600 }}>▌</span>
                </div>
              </div>
            )}

            {error && <div className="error-banner">{error}</div>}

            <div ref={chatEndRef} />
          </div>

          {/* Bottom controls */}
          {started && phase !== "done" && phase !== "evaluating" && (
            <div style={{
              padding: "0.75rem 1.5rem", borderTop: "1px solid var(--border)",
              background: "rgba(5,7,15,0.85)", backdropFilter: "blur(12px)",
              display: "flex", flexDirection: "column", gap: "0.6rem",
            }}>
              {/* Text chat input */}
              <form
                onSubmit={(e) => { e.preventDefault(); handleChatSubmit(); }}
                style={{ display: "flex", gap: "0.5rem" }}
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type your answer here (for code, SQL, etc.)…"
                  disabled={loading || phase === "ai_speaking" || phase === "processing"}
                  style={{
                    flex: 1, padding: "0.6rem 0.85rem", borderRadius: 8,
                    border: "1px solid var(--border)", background: "rgba(255,255,255,0.04)",
                    color: "var(--text)", fontSize: "0.88rem", outline: "none",
                    fontFamily: "inherit",
                  }}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={!chatInput.trim() || loading || phase === "ai_speaking" || phase === "processing"}
                  style={{ padding: "0.6rem 1.2rem", fontSize: "0.85rem" }}
                >
                  Send
                </button>
              </form>

              {/* Voice controls */}
              <div style={{ display: "flex", justifyContent: "center", gap: "0.85rem", alignItems: "center" }}>
                {phase === "waiting" && (
                  <button
                    className="btn-primary btn-primary-lg"
                    onClick={handleStartSpeaking}
                    disabled={loading}
                    style={{ minWidth: 200 }}
                  >
                    🎤 Speak answer
                  </button>
                )}
                {phase === "user_speaking" && (
                  <button
                    className="btn-primary btn-primary-lg"
                    onClick={handleStopSpeaking}
                    style={{
                      minWidth: 200,
                      background: "linear-gradient(135deg, #EF4444, #F97316)",
                      boxShadow: "0 4px 16px rgba(239,68,68,0.4)",
                      animation: "glow-pulse 1.5s ease-in-out infinite",
                    }}
                  >
                    ⏹ Done speaking
                  </button>
                )}
                {phase === "ai_speaking" && (
                  <span style={{ fontSize: "0.88rem", color: "var(--indigo-light)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ animation: "glow-pulse 1.5s ease-in-out infinite", display: "inline-block" }}>🔊</span>
                    AI is speaking…
                  </span>
                )}
                {phase === "processing" && (
                  <span style={{ fontSize: "0.88rem", color: "var(--text-dim)" }}>
                    Processing your response…
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Evaluating state */}
          {phase === "evaluating" && (
            <div style={{
              padding: "1.5rem", borderTop: "1px solid var(--border)",
              background: "rgba(5,7,15,0.85)", textAlign: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
                <span style={{
                  width: 20, height: 20, border: "2.5px solid rgba(99,102,241,0.3)",
                  borderTopColor: "var(--indigo-light)", borderRadius: "50%",
                  animation: "spin-slow 0.8s linear infinite", display: "inline-block",
                }} />
                <span style={{ fontWeight: 600, color: "var(--text-dim)" }}>Generating your results…</span>
              </div>
            </div>
          )}

          {/* Done without evaluation (fallback) */}
          {phase === "done" && !evaluation && (
            <div style={{
              padding: "1.5rem", borderTop: "1px solid var(--border)",
              background: "rgba(5,7,15,0.85)", textAlign: "center",
            }}>
              <p style={{ fontWeight: 700, marginBottom: "0.75rem" }}>Interview complete!</p>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                <button className="btn-primary" onClick={() => navigate("/setup")}>
                  New Interview →
                </button>
                {recordedUrl && (
                  <a href={recordedUrl} download="interview-recording.webm">
                    <button className="btn-secondary">Download Recording</button>
                  </a>
                )}
                <Link to="/dashboard">
                  <button className="btn-secondary">Dashboard</button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right: webcam feed */}
        {started && (
          <div style={{
            display: "flex", flexDirection: "column",
            background: "var(--bg-2)",
            minHeight: 0, overflow: "hidden",
          }}>
            {/* Video */}
            <div style={{ flex: 1, minHeight: 0, position: "relative", background: "#000", overflow: "hidden" }}>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                style={{
                  position: "absolute", inset: 0,
                  width: "100%", height: "100%",
                  objectFit: "cover",
                  transform: "scaleX(-1)",
                }}
              />
              <div style={{
                position: "absolute", bottom: 12, left: 12, right: 12,
                display: "flex", justifyContent: "space-between",
                fontSize: "0.72rem", fontWeight: 600,
              }}>
                <span style={{
                  background: "rgba(0,0,0,0.6)", padding: "0.3rem 0.6rem",
                  borderRadius: 6, color: "#fff", backdropFilter: "blur(4px)",
                }}>
                  You
                </span>
                {isListening && (
                  <span style={{
                    background: "rgba(239,68,68,0.8)", padding: "0.3rem 0.6rem",
                    borderRadius: 6, color: "#fff",
                    animation: "glow-pulse 1.5s ease-in-out infinite",
                  }}>
                    🎤 Listening
                  </span>
                )}
              </div>
            </div>

            {/* Minimal live stats — just turn count and timer */}
            <div style={{
              padding: "1rem", borderTop: "1px solid var(--border)",
              display: "flex", flexDirection: "column", gap: "0.5rem",
              flexShrink: 0,
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                {[
                  { label: "Duration", value: formatTime(elapsedSec) },
                  { label: "Questions", value: turns.length },
                ].map(s => (
                  <div key={s.label} style={{
                    padding: "0.5rem", borderRadius: 8,
                    background: "rgba(255,255,255,0.025)", border: "1px solid var(--border)",
                  }}>
                    <div style={{ fontSize: "1rem", fontWeight: 700 }}>{s.value}</div>
                    <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                {topics.map(t => (
                  <span key={t} className="chip chip-topic" style={{ fontSize: "0.68rem" }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
