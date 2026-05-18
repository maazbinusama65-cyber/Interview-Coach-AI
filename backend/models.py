import uuid
from datetime import datetime

from sqlalchemy import (
    NUMERIC,
    CheckConstraint,
    ForeignKey,
    Integer,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB, TIMESTAMPTZ, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, server_default=func.now())

    sessions: Mapped[list["Session"]] = relationship(back_populates="user")
    weakness_entries: Mapped[list["WeaknessTracker"]] = relationship(back_populates="user")


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    role: Mapped[str] = mapped_column(Text, nullable=False)
    level: Mapped[str] = mapped_column(Text, nullable=False)
    interview_type: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(Text, default="active")
    total_score: Mapped[float | None] = mapped_column(NUMERIC(4, 2), nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, server_default=func.now())

    user: Mapped["User | None"] = relationship(back_populates="sessions")
    questions: Mapped[list["Question"]] = relationship(back_populates="session", order_by="Question.position")


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="CASCADE"))
    text: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(Text, nullable=False)
    topic: Mapped[str] = mapped_column(Text, nullable=False)
    difficulty: Mapped[str] = mapped_column(Text, nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    expected_topics: Mapped[list] = mapped_column(JSONB, nullable=True)

    session: Mapped["Session"] = relationship(back_populates="questions")
    answer: Mapped["Answer | None"] = relationship(back_populates="question", uselist=False)


class Answer(Base):
    __tablename__ = "answers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    question_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("questions.id", ondelete="CASCADE"))
    user_text: Mapped[str] = mapped_column(Text, nullable=False)
    score: Mapped[int | None] = mapped_column(Integer, CheckConstraint("score BETWEEN 1 AND 10"), nullable=True)
    strengths: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    gaps: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    model_answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    tips: Mapped[str | None] = mapped_column(Text, nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, server_default=func.now())

    question: Mapped["Question"] = relationship(back_populates="answer")


class WeaknessTracker(Base):
    __tablename__ = "weakness_tracker"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    topic: Mapped[str] = mapped_column(Text, nullable=False)
    avg_score: Mapped[float] = mapped_column(NUMERIC(4, 2), nullable=False)
    attempt_count: Mapped[int] = mapped_column(Integer, default=1)
    last_seen: Mapped[datetime] = mapped_column(TIMESTAMPTZ, server_default=func.now())

    __table_args__ = (UniqueConstraint("user_id", "topic", name="uq_weakness_user_topic"),)

    user: Mapped["User"] = relationship(back_populates="weakness_entries")
