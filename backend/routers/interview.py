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
from services.ai_service import AIServiceError
from services.conversation_service import (
    ConversationTurn,
    SpeechAnalysis,
    analyze_speech,
    converse,
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
    # Analyze speech if user provided a transcript
    speech = None
    if body.user_transcript and body.user_transcript.strip():
        # Rough estimate: 150 wpm average, calculate duration from word count
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
