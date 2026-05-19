import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  converse,
  type ConversationTurn,
  type ConverseResponse,
  type HistoryEntry,
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
      let final = "";
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript + " ";
        } else {
          interim += result[0].transcript;
        }
      }
      if (final) setTranscript((prev) => prev + final);
      setInterimTranscript(interim);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
  }, []);

  const start = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
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

/* ─── Feedback card ───────────────────────────────────────────────────── */

function FeedbackCard({ turn, speech }: { turn: ConversationTurn; speech: SpeechAnalysis | null }) {
  if (turn.score == null) return null;
  const color = turn.score >= 7 ? "var(--success)" : turn.score >= 5 ? "var(--warning)" : "var(--danger)";
  return (
    <div style={{
      padding: "0.85rem 1rem", borderRadius: 12,
      background: "rgba(255,255,255,0.025)", border: "1px solid var(--border)",
      display: "flex", flexDirection: "column", gap: "0.6rem",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--indigo-light)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Score
        </span>
        <span style={{ fontWeight: 800, fontSize: "1.2rem", color }}>
          {turn.score}<span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>/10</span>
        </span>
      </div>
      {turn.strengths.length > 0 && (
        <div style={{ fontSize: "0.82rem" }}>
          <span style={{ color: "var(--success)", fontWeight: 600 }}>Strengths: </span>
          {turn.strengths.join(", ")}
        </div>
      )}
      {turn.gaps.length > 0 && (
        <div style={{ fontSize: "0.82rem" }}>
          <span style={{ color: "var(--danger)", fontWeight: 600 }}>Gaps: </span>
          {turn.gaps.join(", ")}
        </div>
      )}
      {speech && (
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", fontSize: "0.78rem", color: "var(--text-dim)" }}>
          <span>{speech.estimated_wpm} WPM</span>
          <span>{speech.filler_count} fillers</span>
          <span>Clarity {speech.clarity_score}/10</span>
          <span>{speech.word_count} words</span>
        </div>
      )}
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
  const [phase, setPhase] = useState<"waiting" | "ai_speaking" | "user_speaking" | "processing" | "done">("waiting");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { isListening, transcript, interimTranscript, start: startSTT, stop: stopSTT, supported } = useSpeechRecognition();
  const { startCamera, startRecording, stopRecording, stopCamera, recording: _recording, recordedUrl } = useWebcam(videoRef);
  void _recording; // suppress unused warning

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, phase]);

  // Timer
  useEffect(() => {
    if (started && phase !== "done") {
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
      const newHistory = [...history];
      if (userTranscript) {
        newHistory.push({ role: "user", content: userTranscript });
      }

      const res: ConverseResponse = await converse(topics, level, interviewType, newHistory, userTranscript);

      newHistory.push({ role: "assistant", content: res.turn.ai_message });
      setHistory(newHistory);
      setTurns((prev) => [...prev, { turn: res.turn, speech: res.speech_analysis }]);

      // Speak the AI response
      setPhase("ai_speaking");
      await speak(res.turn.ai_message);

      if (res.turn.action === "wrap_up") {
        setPhase("done");
        stopRecording();
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

  async function handleStart() {
    setStarted(true);
    await startCamera();
    startRecording();
    // Get first AI turn (introduction + first question)
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

  function handleEnd() {
    stopRecording();
    stopCamera();
    setPhase("done");
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

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
                fontSize: "0.82rem", color: phase === "done" ? "var(--text-muted)" : "var(--danger)",
                fontWeight: 600,
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: phase === "done" ? "var(--text-muted)" : "var(--danger)",
                  boxShadow: phase === "done" ? "none" : "0 0 8px var(--danger)",
                  animation: phase === "done" ? "none" : "glow-pulse 2s ease-in-out infinite",
                }} />
                {phase === "done" ? "Ended" : "Recording"}
              </span>
              <span style={{ fontSize: "0.85rem", color: "var(--text-dim)", fontFamily: "monospace", fontWeight: 600 }}>
                {formatTime(elapsedSec)}
              </span>
            </>
          )}
          {started && phase !== "done" && (
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
        gap: 0, maxHeight: "calc(100vh - 60px)", overflow: "hidden",
      }}>
        {/* Left: chat / conversation */}
        <div style={{
          display: "flex", flexDirection: "column",
          borderRight: started ? "1px solid var(--border)" : "none",
          overflow: "hidden",
        }}>
          {/* Chat messages */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "1.5rem",
            display: "flex", flexDirection: "column", gap: "0.75rem",
          }}>
            {!started && (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1.5rem", textAlign: "center" }}>
                <div style={{ fontSize: "3rem" }}>🎤</div>
                <h1 style={{ fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.03em" }}>
                  Ready for your <span className="gradient-text">live interview</span>?
                </h1>
                <p style={{ color: "var(--text-dim)", maxWidth: 500, lineHeight: 1.65 }}>
                  The AI interviewer will ask you questions via voice. Speak naturally — your camera and mic will record the session.
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

            {started && turns.map((t, i) => (
              <div key={i}>
                {/* AI message */}
                <div style={{
                  display: "flex", gap: "0.65rem", marginBottom: "0.5rem",
                  alignItems: "flex-start",
                }}>
                  <span style={{
                    width: 30, height: 30, borderRadius: 9, fontSize: "0.8rem",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)",
                    flexShrink: 0, color: "var(--indigo-light)", fontWeight: 700,
                  }}>AI</span>
                  <div>
                    <div style={{
                      background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)",
                      borderRadius: "4px 14px 14px 14px", padding: "0.75rem 1rem",
                      fontSize: "0.92rem", lineHeight: 1.6, maxWidth: 600,
                    }}>
                      {t.turn.ai_message}
                    </div>
                    {t.turn.action === "feedback" && (
                      <div style={{ marginTop: "0.5rem", maxWidth: 500 }}>
                        <FeedbackCard turn={t.turn} speech={t.speech} />
                      </div>
                    )}
                  </div>
                </div>

                {/* User response (if exists in history after this AI turn) */}
                {history[i * 2 + 1] && (
                  <div style={{
                    display: "flex", gap: "0.65rem", justifyContent: "flex-end",
                    marginBottom: "0.5rem",
                  }}>
                    <div style={{
                      background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
                      borderRadius: "14px 4px 14px 14px", padding: "0.75rem 1rem",
                      fontSize: "0.92rem", lineHeight: 1.6, maxWidth: 600,
                      color: "var(--text-dim)",
                    }}>
                      {history[i * 2 + 1].content}
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
            ))}

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
          {started && phase !== "done" && (
            <div style={{
              padding: "1rem 1.5rem", borderTop: "1px solid var(--border)",
              background: "rgba(5,7,15,0.85)", backdropFilter: "blur(12px)",
              display: "flex", justifyContent: "center", gap: "0.85rem", alignItems: "center",
            }}>
              {phase === "waiting" && (
                <button
                  className="btn-primary btn-primary-lg"
                  onClick={handleStartSpeaking}
                  disabled={loading}
                  style={{ minWidth: 200 }}
                >
                  🎤 Hold to speak
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
          )}

          {/* Done state */}
          {phase === "done" && (
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
            overflow: "hidden",
          }}>
            {/* Video */}
            <div style={{ flex: 1, position: "relative", background: "#000" }}>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                style={{
                  width: "100%", height: "100%",
                  objectFit: "cover",
                  transform: "scaleX(-1)",
                }}
              />
              {/* Overlay label */}
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

            {/* Speech stats panel */}
            <div style={{
              padding: "1rem", borderTop: "1px solid var(--border)",
              display: "flex", flexDirection: "column", gap: "0.5rem",
            }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                Speech Stats
              </div>
              {(() => {
                const feedbacks = turns.filter(t => t.speech).map(t => t.speech!);
                const totalFillers = feedbacks.reduce((s, f) => s + f.filler_count, 0);
                const avgWpm = feedbacks.length ? Math.round(feedbacks.reduce((s, f) => s + f.estimated_wpm, 0) / feedbacks.length) : 0;
                const avgClarity = feedbacks.length ? Math.round((feedbacks.reduce((s, f) => s + f.clarity_score, 0) / feedbacks.length) * 10) / 10 : 0;
                return (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                    {[
                      { label: "Avg WPM", value: avgWpm || "—" },
                      { label: "Total fillers", value: totalFillers },
                      { label: "Avg clarity", value: avgClarity ? `${avgClarity}/10` : "—" },
                      { label: "Turns", value: feedbacks.length },
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
                );
              })()}

              {/* Last filler words */}
              {(() => {
                const allFillers = turns.flatMap(t => t.speech?.filler_words ?? []);
                const unique = [...new Set(allFillers)];
                if (unique.length === 0) return null;
                return (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                    {unique.map(f => (
                      <span key={f} style={{
                        padding: "0.15rem 0.45rem", borderRadius: 6,
                        background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)",
                        fontSize: "0.7rem", color: "var(--danger)",
                      }}>
                        "{f}"
                      </span>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
