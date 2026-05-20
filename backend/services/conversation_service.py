"""
Conversational interview service — the AI acts as a real interviewer,
asking questions, follow-ups, and making transition decisions in real time.
"""

import json
import logging
from dataclasses import dataclass

from pydantic import BaseModel, Field

from services.ai_service import _chat, AIServiceError

logger = logging.getLogger(__name__)

_RETRY = 3


# ── Output schemas ────────────────────────────────────────────────────────

class SpeechAnalysis(BaseModel):
    filler_count: int = 0
    filler_words: list[str] = Field(default_factory=list)
    word_count: int = 0
    estimated_wpm: float = 0
    long_pauses: int = 0
    clarity_score: int = Field(ge=1, le=10, default=5)


class ConversationTurn(BaseModel):
    """What the AI says/does next."""
    ai_message: str
    action: str = Field(description="question | follow_up | transition | wrap_up")


# ── Speech analysis (called client-side but also verifiable server-side) ──

FILLER_WORDS = frozenset([
    "um", "uh", "er", "ah", "like", "you know", "basically",
    "essentially", "actually", "literally", "right", "so yeah",
    "i mean", "kind of", "sort of",
])


def analyze_speech(transcript: str, duration_seconds: float) -> SpeechAnalysis:
    """Analyze a transcript for filler words, pace, etc."""
    words = transcript.lower().split()
    word_count = len(words)
    wpm = (word_count / max(duration_seconds, 1)) * 60

    found_fillers: list[str] = []
    text_lower = transcript.lower()
    for filler in FILLER_WORDS:
        count = text_lower.count(filler)
        if count > 0:
            found_fillers.extend([filler] * count)

    # Clarity heuristic: penalize high filler ratio + extreme pace
    filler_ratio = len(found_fillers) / max(word_count, 1)
    clarity = 10
    if filler_ratio > 0.15:
        clarity -= 3
    elif filler_ratio > 0.08:
        clarity -= 1
    if wpm > 180:
        clarity -= 1  # too fast
    if wpm < 80 and word_count > 10:
        clarity -= 1  # too slow
    clarity = max(1, min(10, clarity))

    return SpeechAnalysis(
        filler_count=len(found_fillers),
        filler_words=list(set(found_fillers)),
        word_count=word_count,
        estimated_wpm=round(wpm, 1),
        long_pauses=0,  # detected client-side
        clarity_score=clarity,
    )


# ── Conversation prompts ─────────────────────────────────────────────────

def _interviewer_system_prompt(
    topics: list[str],
    level: str,
    interview_type: str,
) -> str:
    topics_str = ", ".join(topics)
    return f"""You are an expert technical interviewer at a top tech company conducting a LIVE video interview.

You are interviewing a {level}-level candidate. Topics to cover: {topics_str}.
Interview type: {interview_type}.

Behave like a real interviewer:
- Be professional, warm, and encouraging
- Ask one question at a time
- Listen to the answer, then decide: ask a follow-up, probe deeper, or move to the next topic
- If the candidate gives a weak or incomplete answer, probe gently — ask them to elaborate or clarify
- If the candidate gives a strong answer, acknowledge it briefly ("Good", "That makes sense") and move on
- Keep questions specific to the topics — never ask generic filler
- Transition smoothly between topics
- After covering all topics, wrap up the interview
- NEVER give scores, evaluations, or detailed feedback during the interview — just keep the conversation flowing naturally like a real interviewer would
- If the candidate repeats themselves or seems stuck, gently redirect with a new angle on the question or move to the next topic
- Treat each user message as a fresh answer — do NOT tell the candidate they are repeating themselves unless they truly are saying the exact same thing again

IMPORTANT: Keep your responses concise (1-3 sentences max). This is a spoken conversation, not a written essay. Sound natural, not robotic.

Respond with valid JSON only, in this exact shape:
{{
  "ai_message": "<what you say to the candidate>",
  "action": "question | follow_up | transition | wrap_up"
}}

action must be one of: "question", "follow_up", "transition", "wrap_up".
When action is "wrap_up": thank the candidate and end the interview naturally."""


def _build_conversation_messages(
    system_prompt: str,
    history: list[dict],
    user_transcript: str | None = None,
) -> list[dict]:
    messages = [{"role": "system", "content": system_prompt}]
    for turn in history:
        messages.append({"role": turn["role"], "content": turn["content"]})
    if user_transcript:
        messages.append({"role": "user", "content": user_transcript})
    return messages


# ── Public API ────────────────────────────────────────────────────────────

def converse(
    topics: list[str],
    level: str,
    interview_type: str,
    history: list[dict],
    user_transcript: str | None = None,
) -> ConversationTurn:
    """
    Generate the next interviewer turn.

    history: list of {"role": "assistant"|"user", "content": "..."}
    user_transcript: the candidate's latest spoken answer (if any)
    """
    system_prompt = _interviewer_system_prompt(topics, level, interview_type)

    from groq import Groq
    from config import settings
    from functools import lru_cache

    @lru_cache(maxsize=1)
    def _client() -> Groq:
        return Groq(api_key=settings.groq_api_key)

    messages = _build_conversation_messages(system_prompt, history, user_transcript)

    for attempt in range(1, _RETRY + 1):
        try:
            response = _client().chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=messages,
                response_format={"type": "json_object"},
                temperature=0.7,
            )
            raw = response.choices[0].message.content
            data = json.loads(raw)
            return ConversationTurn.model_validate(data)
        except Exception as exc:
            logger.warning("Conversation attempt %d failed: %s", attempt, exc)
            if attempt == _RETRY:
                raise AIServiceError(
                    f"Failed to get interviewer response after {_RETRY} attempts"
                ) from exc

    raise AIServiceError("Unreachable")


# ── Post-interview evaluation ────────────────────────────────────────────

class TopicEvaluation(BaseModel):
    topic: str
    score: int = Field(ge=1, le=10)
    strengths: list[str] = Field(default_factory=list)
    gaps: list[str] = Field(default_factory=list)

class InterviewEvaluation(BaseModel):
    overall_score: int = Field(ge=1, le=10)
    communication_clarity: int = Field(ge=1, le=10)
    structure_organization: int = Field(ge=1, le=10)
    technical_depth: int = Field(ge=1, le=10)
    use_of_examples: int = Field(ge=1, le=10)
    confidence: int = Field(ge=1, le=10)
    topic_scores: list[TopicEvaluation] = Field(default_factory=list)
    top_strengths: list[str] = Field(default_factory=list)
    areas_to_improve: list[str] = Field(default_factory=list)
    summary: str = ""


def evaluate_interview(
    topics: list[str],
    level: str,
    interview_type: str,
    history: list[dict],
) -> InterviewEvaluation:
    topics_str = ", ".join(topics)
    prompt = f"""You are a senior interview evaluator. Review this complete {interview_type} interview transcript for a {level}-level candidate on: {topics_str}.

Evaluate the FULL interview and respond with valid JSON only:
{{
  "overall_score": <1-10>,
  "communication_clarity": <1-10>,
  "structure_organization": <1-10>,
  "technical_depth": <1-10>,
  "use_of_examples": <1-10>,
  "confidence": <1-10>,
  "topic_scores": [
    {{"topic": "<topic name>", "score": <1-10>, "strengths": ["..."], "gaps": ["..."]}}
  ],
  "top_strengths": ["<3-5 key strengths across the whole interview>"],
  "areas_to_improve": ["<3-5 actionable improvements>"],
  "summary": "<2-3 sentence overall assessment>"
}}

Be fair but honest. Base scores only on what the candidate actually said."""

    from groq import Groq
    from config import settings
    from functools import lru_cache

    @lru_cache(maxsize=1)
    def _client() -> Groq:
        return Groq(api_key=settings.groq_api_key)

    messages: list[dict] = [{"role": "system", "content": prompt}]
    for turn in history:
        messages.append({"role": turn["role"], "content": turn["content"]})
    messages.append({"role": "user", "content": "The interview is now complete. Please evaluate the entire interview."})

    for attempt in range(1, _RETRY + 1):
        try:
            response = _client().chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=messages,
                response_format={"type": "json_object"},
                temperature=0.3,
            )
            raw = response.choices[0].message.content
            data = json.loads(raw)
            return InterviewEvaluation.model_validate(data)
        except Exception as exc:
            logger.warning("Evaluation attempt %d failed: %s", attempt, exc)
            if attempt == _RETRY:
                raise AIServiceError(
                    f"Failed to evaluate interview after {_RETRY} attempts"
                ) from exc

    raise AIServiceError("Unreachable")
