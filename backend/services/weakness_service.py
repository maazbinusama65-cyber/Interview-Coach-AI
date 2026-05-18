import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import WeaknessTracker


async def update_weakness_tracker(
    user_id: uuid.UUID,
    topic: str,
    score: int,
    db: AsyncSession,
) -> None:
    result = await db.execute(
        select(WeaknessTracker).where(
            WeaknessTracker.user_id == user_id,
            WeaknessTracker.topic == topic,
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        new_avg = (existing.avg_score * existing.attempt_count + score) / (existing.attempt_count + 1)
        existing.avg_score = round(float(new_avg), 2)
        existing.attempt_count += 1
        existing.last_seen = datetime.now(tz=timezone.utc)
    else:
        db.add(
            WeaknessTracker(
                user_id=user_id,
                topic=topic,
                avg_score=float(score),
                attempt_count=1,
            )
        )

    await db.commit()
