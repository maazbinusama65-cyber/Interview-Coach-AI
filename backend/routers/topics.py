from fastapi import APIRouter

from data.topic_catalog import TOPIC_CATALOG
from schemas import TopicCategoryOut

router = APIRouter(prefix="/api/topics", tags=["topics"])


@router.get("", response_model=list[TopicCategoryOut])
async def list_topics() -> list[TopicCategoryOut]:
    """Return the full topic catalog grouped by category."""
    return [
        TopicCategoryOut(category=cat.category, topics=list(cat.topics))
        for cat in TOPIC_CATALOG
    ]
