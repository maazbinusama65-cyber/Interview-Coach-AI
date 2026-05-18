import uuid
from datetime import datetime

from pydantic import BaseModel, Field


# ── Session ────────────────────────────────────────────────────────────────

class SessionCreate(BaseModel):
    role: str
    level: str = Field(pattern="^(junior|mid|senior)$")
    interview_type: str = Field(pattern="^(technical|behavioral|mixed)$")
    question_count: int = Field(ge=5, le=15, default=10)


class QuestionOut(BaseModel):
    id: uuid.UUID
    position: int
    text: str
    type: str
    topic: str
    difficulty: str
    expected_topics: list[str] | None = None

    model_config = {"from_attributes": True}


class SessionOut(BaseModel):
    session_id: uuid.UUID
    questions: list[QuestionOut]


class SessionListItem(BaseModel):
    id: uuid.UUID
    role: str
    level: str
    interview_type: str
    status: str
    total_score: float | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Answer ─────────────────────────────────────────────────────────────────

class AnswerSubmit(BaseModel):
    question_id: uuid.UUID
    user_text: str = Field(min_length=1)


class EvaluationOut(BaseModel):
    score: int
    strengths: list[str]
    gaps: list[str]
    model_answer: str
    tips: str


# ── Summary ────────────────────────────────────────────────────────────────

class AnswerOut(BaseModel):
    id: uuid.UUID
    user_text: str
    score: int | None
    strengths: list[str] | None
    gaps: list[str] | None
    model_answer: str | None
    tips: str | None
    submitted_at: datetime

    model_config = {"from_attributes": True}


class QuestionWithAnswer(BaseModel):
    id: uuid.UUID
    position: int
    text: str
    type: str
    topic: str
    difficulty: str
    answer: AnswerOut | None = None

    model_config = {"from_attributes": True}


class SessionSummary(BaseModel):
    id: uuid.UUID
    role: str
    level: str
    interview_type: str
    status: str
    total_score: float | None
    created_at: datetime
    questions: list[QuestionWithAnswer]

    model_config = {"from_attributes": True}


# ── Progress ───────────────────────────────────────────────────────────────

class TopicScore(BaseModel):
    topic: str
    avg_score: float
    attempt_count: int


class ProgressOut(BaseModel):
    weaknesses: list[TopicScore]
    strengths: list[TopicScore]
    total_sessions: int
    overall_avg_score: float
