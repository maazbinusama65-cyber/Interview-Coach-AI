import logging

from fastapi import APIRouter

from data.topic_catalog import TOPIC_CATALOG
from schemas import TopicCategoryOut

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/topics", tags=["topics"])


@router.get("", response_model=list[TopicCategoryOut])
async def list_topics() -> list[TopicCategoryOut]:
    """Return the full topic catalog grouped by category."""
    logger.info(">>> list_topics endpoint HIT <<<")
    return [
        TopicCategoryOut(category=cat.category, topics=list(cat.topics))
        for cat in TOPIC_CATALOG
    ]
