import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import distinct, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_db
from models import Answer, Question, Session, WeaknessTracker
from schemas import ProgressOut, TopicScore

router = APIRouter(prefix="/api", tags=["progress"])


@router.get("/progress", response_model=ProgressOut)
async def get_progress(
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user),
):
    wt_result = await db.execute(
        select(WeaknessTracker).where(WeaknessTracker.user_id == user_id)
    )
    entries = wt_result.scalars().all()

    weaknesses = [
        TopicScore(topic=e.topic, avg_score=float(e.avg_score), attempt_count=e.attempt_count)
        for e in entries
        if float(e.avg_score) < 6
    ]
    strengths = [
        TopicScore(topic=e.topic, avg_score=float(e.avg_score), attempt_count=e.attempt_count)
        for e in entries
        if float(e.avg_score) >= 7
    ]

    session_count_result = await db.execute(
        select(func.count(Session.id)).where(Session.user_id == user_id)
    )
    total_sessions = session_count_result.scalar_one() or 0

    overall_avg = (
        sum(e.avg_score * e.attempt_count for e in entries) / sum(e.attempt_count for e in entries)
        if entries
        else 0.0
    )

    return ProgressOut(
        weaknesses=weaknesses,
        strengths=strengths,
        total_sessions=total_sessions,
        overall_avg_score=round(float(overall_avg), 2),
    )


@router.get("/topics", response_model=list[str])
async def list_topics(
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user),
):
    result = await db.execute(
        select(distinct(Question.topic))
        .join(Session, Question.session_id == Session.id)
        .where(Session.user_id == user_id)
        .order_by(Question.topic)
    )
    return result.scalars().all()
