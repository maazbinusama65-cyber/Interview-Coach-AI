"""
Live conversational interview endpoints.
"""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_optional_user
from database import get_db
from models import Session, Question, Answer
from services.ai_service import AIServiceError
from services.conversation_service import (
    ConversationTurn,
    InterviewEvaluation,
    SpeechAnalysis,
    analyze_speech,
    converse,
    evaluate_interview,
)

router = APIRouter(prefix="/api/interview", tags=["interview"])


# ── Request / Response ────────────────────────────────────────────────────

class ConverseTurnIn(BaseModel):
    topics: list[str] = Field(min_length=1)
    level: str
    interview_type: str
    history: list[dict] = Field(default_factory=list)
    user_transcript: str | None = None


class ConverseResponse(BaseModel):
    turn: ConversationTurn
    speech_analysis: SpeechAnalysis | None = None


class SpeechAnalysisIn(BaseModel):
    transcript: str
    duration_seconds: float = Field(ge=0)


# ── Endpoints ─────────────────────────────────────────────────────────────

@router.post("/converse", response_model=ConverseResponse)
async def converse_turn(
    body: ConverseTurnIn,
    user_id: Optional[uuid.UUID] = Depends(get_optional_user),
):
    """Get the next AI interviewer turn. Send empty history + no transcript to start."""
    speech = None
    if body.user_transcript and body.user_transcript.strip():
        words = len(body.user_transcript.split())
        estimated_duration = max((words / 150) * 60, 5)
        speech = analyze_speech(body.user_transcript, estimated_duration)

    try:
        turn = converse(
            topics=body.topics,
            level=body.level,
            interview_type=body.interview_type,
            history=body.history,
            user_transcript=body.user_transcript,
        )
    except AIServiceError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    return ConverseResponse(turn=turn, speech_analysis=speech)


@router.post("/analyze-speech", response_model=SpeechAnalysis)
async def analyze_speech_endpoint(body: SpeechAnalysisIn):
    """Standalone speech analysis endpoint."""
    return analyze_speech(body.transcript, body.duration_seconds)


class EvaluateIn(BaseModel):
    topics: list[str] = Field(min_length=1)
    level: str
    interview_type: str
    history: list[dict] = Field(min_length=1)


class EvaluateResponse(BaseModel):
    evaluation: InterviewEvaluation
    session_id: str | None = None


@router.post("/evaluate", response_model=EvaluateResponse)
async def evaluate_interview_endpoint(
    body: EvaluateIn,
    db: AsyncSession = Depends(get_db),
    user_id: Optional[uuid.UUID] = Depends(get_optional_user),
):
    """Evaluate the full interview and persist it as a session."""
    try:
        result = evaluate_interview(
            topics=body.topics,
            level=body.level,
            interview_type=body.interview_type,
            history=body.history,
        )
    except AIServiceError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    session_id: str | None = None
    if user_id:
        try:
            session = Session(
                user_id=user_id,
                role="Live Interview",
                level=body.level,
                interview_type=body.interview_type,
                status="completed",
                total_score=result.overall_score,
                topics=body.topics,
            )
            db.add(session)
            await db.flush()

            ai_messages = [m for m in body.history if m.get("role") == "assistant"]
            user_messages = [m for m in body.history if m.get("role") == "user"]
            topic_score_map = {ts.topic.lower(): ts for ts in result.topic_scores}

            for i, ai_msg in enumerate(ai_messages):
                topic = body.topics[min(i, len(body.topics) - 1)]
                ts = topic_score_map.get(topic.lower())

                q = Question(
                    session_id=session.id,
                    text=ai_msg.get("content", ""),
                    type=body.interview_type,
                    topic=topic,
                    difficulty=body.level,
                    position=i + 1,
                )
                db.add(q)
                await db.flush()

                if i < len(user_messages):
                    a = Answer(
                        question_id=q.id,
                        user_text=user_messages[i].get("content", ""),
                        score=ts.score if ts else result.overall_score,
                        strengths=ts.strengths if ts else result.top_strengths,
                        gaps=ts.gaps if ts else result.areas_to_improve,
                        model_answer=None,
                        tips=None,
                        behavioral_feedback={
                            "communication_clarity": result.communication_clarity,
                            "structure_organization": result.structure_organization,
                            "technical_depth": result.technical_depth,
                            "use_of_examples": result.use_of_examples,
                            "confidence": result.confidence,
                            "overall_impression": result.summary,
                        },
                    )
                    db.add(a)

            await db.commit()
            session_id = str(session.id)
        except Exception:
            await db.rollback()

    return EvaluateResponse(evaluation=result, session_id=session_id)
