import uuid
from datetime import datetime

from pydantic import BaseModel, Field, model_validator


# ── Session V1 (backward compat) ─────────────────────────────────────────

class SessionCreate(BaseModel):
    role: str
    level: str = Field(pattern="^(junior|mid|senior)$")
    interview_type: str = Field(pattern="^(technical|behavioral|mixed)$")
    question_count: int = Field(ge=5, le=15, default=10)


# ── Session V2 (multi-topic) ─────────────────────────────────────────────

class TopicSelection(BaseModel):
    topic_name: str
    question_count: int = Field(ge=1, le=10, default=3)


class SessionCreateV2(BaseModel):
    level: str = Field(pattern="^(junior|mid|senior)$")
    interview_type: str = Field(pattern="^(technical|behavioral|mixed)$")
    topics: list[TopicSelection] = Field(min_length=1, max_length=8)

    @model_validator(mode="after")
    def validate_total_questions(self) -> "SessionCreateV2":
        total = sum(t.question_count for t in self.topics)
        if total < 3 or total > 25:
            raise ValueError(f"Total questions must be 3–25, got {total}")
        return self


class InterviewSectionOut(BaseModel):
    id: uuid.UUID
    topic_category: str
    topic_name: str
    question_count: int
    position: int

    model_config = {"from_attributes": True}


# ── Question / Session out ────────────────────────────────────────────────

class QuestionOut(BaseModel):
    id: uuid.UUID
    position: int
    text: str
    type: str
    topic: str
    difficulty: str
    expected_topics: list[str] | None = None
    section_id: uuid.UUID | None = None

    model_config = {"from_attributes": True}


class SessionOut(BaseModel):
    session_id: uuid.UUID
    role: str
    level: str
    interview_type: str
    questions: list[QuestionOut]
    sections: list[InterviewSectionOut] | None = None
    topics: list[str] | None = None


class SessionListItem(BaseModel):
    id: uuid.UUID
    role: str
    level: str
    interview_type: str
    status: str
    total_score: float | None
    created_at: datetime
    topics: list[str] | None = None

    model_config = {"from_attributes": True}


# ── Topic catalog ─────────────────────────────────────────────────────────

class TopicCategoryOut(BaseModel):
    category: str
    topics: list[str]


# ── Answer / Evaluation ──────────────────────────────────────────────────

class AnswerSubmit(BaseModel):
    question_id: uuid.UUID
    user_text: str = Field(min_length=1)


class BehavioralFeedbackOut(BaseModel):
    communication_clarity: int = Field(ge=1, le=10)
    structure_organization: int = Field(ge=1, le=10)
    technical_depth: int = Field(ge=1, le=10)
    use_of_examples: int = Field(ge=1, le=10)
    confidence: int = Field(ge=1, le=10)
    overall_impression: str


class EvaluationOut(BaseModel):
    score: int
    strengths: list[str]
    gaps: list[str]
    model_answer: str
    tips: str
    behavioral_feedback: BehavioralFeedbackOut | None = None


# ── Summary ───────────────────────────────────────────────────────────────

class AnswerOut(BaseModel):
    id: uuid.UUID
    user_text: str
    score: int | None
    strengths: list[str] | None
    gaps: list[str] | None
    model_answer: str | None
    tips: str | None
    behavioral_feedback: BehavioralFeedbackOut | None = None
    submitted_at: datetime

    model_config = {"from_attributes": True}


class QuestionWithAnswer(BaseModel):
    id: uuid.UUID
    position: int
    text: str
    type: str
    topic: str
    difficulty: str
    section_id: uuid.UUID | None = None
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
    topics: list[str] | None = None
    sections: list[InterviewSectionOut] | None = None
    questions: list[QuestionWithAnswer]

    model_config = {"from_attributes": True}


# ── Progress ──────────────────────────────────────────────────────────────

class TopicScore(BaseModel):
    topic: str
    avg_score: float
    attempt_count: int


class ProgressOut(BaseModel):
    weaknesses: list[TopicScore]
    strengths: list[TopicScore]
    total_sessions: int
    overall_avg_score: float
