import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from auth import get_current_user, get_optional_user
from database import get_db
from models import Answer, Question, Session
from schemas import (
    QuestionOut,
    SessionCreate,
    SessionListItem,
    SessionOut,
    SessionSummary,
)
from services.ai_service import AIServiceError, generate_questions

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


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
    await db.flush()  # get session.id before inserting questions

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
        questions=[QuestionOut.model_validate(q) for q in questions],
    )


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
        .options(selectinload(Session.questions))
        .where(Session.id == session_id)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    return SessionOut(
        session_id=session.id,
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
            selectinload(Session.questions).selectinload(Question.answer)
        )
        .where(Session.id == session_id)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return session
