import asyncio
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from auth import get_current_user, get_optional_user
from data.topic_catalog import TOPIC_TO_CATEGORY, VALID_TOPICS
from database import get_db
from models import Answer, InterviewSection, Question, Session
from schemas import (
    InterviewSectionOut,
    QuestionOut,
    SessionCreate,
    SessionCreateV2,
    SessionListItem,
    SessionOut,
    SessionSummary,
)
from services.ai_service import AIServiceError, generate_questions, generate_section_questions

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


# ── V1: single-role session ──────────────────────────────────────────────

@router.post("", response_model=SessionOut, status_code=status.HTTP_201_CREATED)
async def create_session(
    body: SessionCreate,
    db: AsyncSession = Depends(get_db),
    user_id: Optional[uuid.UUID] = Depends(get_optional_user),
):
    try:
        ai_questions = await generate_questions(
            role=body.role,
            level=body.level,
            interview_type=body.interview_type,
            count=body.question_count,
        )
    except AIServiceError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))

    session = Session(
        user_id=user_id,
        role=body.role,
        level=body.level,
        interview_type=body.interview_type,
    )
    db.add(session)
    await db.flush()

    questions = [
        Question(
            session_id=session.id,
            text=q.text,
            type=q.type,
            topic=q.topic,
            difficulty=q.difficulty,
            position=i + 1,
            expected_topics=q.expected_topics,
        )
        for i, q in enumerate(ai_questions)
    ]
    db.add_all(questions)
    await db.commit()
    await db.refresh(session)

    return SessionOut(
        session_id=session.id,
        role=session.role,
        level=session.level,
        interview_type=session.interview_type,
        questions=[QuestionOut.model_validate(q) for q in questions],
    )


# ── V2: multi-topic session ─────────────────────────────────────────────

@router.post("/v2", response_model=SessionOut, status_code=status.HTTP_201_CREATED)
async def create_session_v2(
    body: SessionCreateV2,
    db: AsyncSession = Depends(get_db),
    user_id: Optional[uuid.UUID] = Depends(get_optional_user),
):
    # Validate all topics exist in catalog
    for ts in body.topics:
        if ts.topic_name not in VALID_TOPICS:
            raise HTTPException(
                status_code=422,
                detail=f"Unknown topic: {ts.topic_name}",
            )

    topic_names = [t.topic_name for t in body.topics]
    role_label = " + ".join(topic_names[:3])
    if len(topic_names) > 3:
        role_label += f" +{len(topic_names) - 3} more"

    session = Session(
        user_id=user_id,
        role=role_label,
        level=body.level,
        interview_type=body.interview_type,
        topics=topic_names,
    )
    db.add(session)
    await db.flush()

    # Create sections
    sections: list[InterviewSection] = []
    for i, ts in enumerate(body.topics):
        section = InterviewSection(
            session_id=session.id,
            topic_category=TOPIC_TO_CATEGORY.get(ts.topic_name, "Other"),
            topic_name=ts.topic_name,
            question_count=ts.question_count,
            position=i + 1,
        )
        sections.append(section)
    db.add_all(sections)
    await db.flush()

    # Generate questions concurrently for all sections
    async def gen_for_section(section: InterviewSection) -> list:
        return await generate_section_questions(
            topic_name=section.topic_name,
            topic_category=section.topic_category,
            level=body.level,
            interview_type=body.interview_type,
            count=section.question_count,
        )

    try:
        results = await asyncio.gather(
            *(gen_for_section(s) for s in sections),
            return_exceptions=True,
        )
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    # Flatten questions with proper global position and section_id
    all_questions: list[Question] = []
    global_pos = 1
    for section, result in zip(sections, results):
        if isinstance(result, Exception):
            raise HTTPException(
                status_code=503,
                detail=f"Failed to generate questions for {section.topic_name}: {result}",
            )
        for q in result:
            all_questions.append(
                Question(
                    session_id=session.id,
                    section_id=section.id,
                    text=q.text,
                    type=q.type,
                    topic=q.topic,
                    difficulty=q.difficulty,
                    position=global_pos,
                    expected_topics=q.expected_topics,
                )
            )
            global_pos += 1

    db.add_all(all_questions)
    await db.commit()
    await db.refresh(session)

    return SessionOut(
        session_id=session.id,
        role=session.role,
        level=session.level,
        interview_type=session.interview_type,
        topics=topic_names,
        sections=[InterviewSectionOut.model_validate(s) for s in sections],
        questions=[QuestionOut.model_validate(q) for q in all_questions],
    )


# ── List / Get / Complete / Summary (unchanged except SessionOut update) ─

@router.get("", response_model=list[SessionListItem])
async def list_sessions(
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user),
):
    result = await db.execute(
        select(Session)
        .where(Session.user_id == user_id)
        .order_by(Session.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{session_id}", response_model=SessionOut)
async def get_session(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user_id: Optional[uuid.UUID] = Depends(get_optional_user),
):
    result = await db.execute(
        select(Session)
        .options(
            selectinload(Session.questions),
            selectinload(Session.sections),
        )
        .where(Session.id == session_id)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    return SessionOut(
        session_id=session.id,
        role=session.role,
        level=session.level,
        interview_type=session.interview_type,
        topics=session.topics,
        sections=[InterviewSectionOut.model_validate(s) for s in session.sections] if session.sections else None,
        questions=[QuestionOut.model_validate(q) for q in session.questions],
    )


@router.post("/{session_id}/complete", response_model=SessionListItem)
async def complete_session(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user_id: Optional[uuid.UUID] = Depends(get_optional_user),
):
    result = await db.execute(
        select(Session)
        .options(selectinload(Session.questions).selectinload(Question.answer))
        .where(Session.id == session_id)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    scores = [q.answer.score for q in session.questions if q.answer and q.answer.score is not None]
    session.total_score = round(sum(scores) / len(scores), 2) if scores else None
    session.status = "completed"
    await db.commit()
    await db.refresh(session)
    return session


@router.get("/{session_id}/summary", response_model=SessionSummary)
async def session_summary(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user_id: Optional[uuid.UUID] = Depends(get_optional_user),
):
    result = await db.execute(
        select(Session)
        .options(
            selectinload(Session.questions).selectinload(Question.answer),
            selectinload(Session.sections),
        )
        .where(Session.id == session_id)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return session
