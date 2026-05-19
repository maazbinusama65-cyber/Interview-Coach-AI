import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from auth import get_optional_user
from database import get_db
from models import Answer, Question
from schemas import AnswerSubmit, BehavioralFeedbackOut, EvaluationOut
from services.ai_service import AIServiceError, evaluate_answer
from services.weakness_service import update_weakness_tracker

router = APIRouter(prefix="/api/answers", tags=["answers"])


@router.post("", response_model=EvaluationOut)
async def submit_answer(
    body: AnswerSubmit,
    db: AsyncSession = Depends(get_db),
    user_id: Optional[uuid.UUID] = Depends(get_optional_user),
):
    result = await db.execute(
        select(Question)
        .options(selectinload(Question.answer))
        .where(Question.id == body.question_id)
    )
    question = result.scalar_one_or_none()
    if question is None:
        raise HTTPException(status_code=404, detail="Question not found")

    if question.answer is not None:
        raise HTTPException(status_code=409, detail="Answer already submitted for this question")

    try:
        evaluation = await evaluate_answer(
            question_text=question.text,
            expected_topics=question.expected_topics or [],
            user_answer=body.user_text,
        )
    except AIServiceError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))

    # Build behavioral feedback dict for storage
    bf_dict = None
    bf_out = None
    if evaluation.behavioral_feedback:
        bf_dict = evaluation.behavioral_feedback.model_dump()
        bf_out = BehavioralFeedbackOut(**bf_dict)

    answer = Answer(
        question_id=question.id,
        user_text=body.user_text,
        score=evaluation.score,
        strengths=evaluation.strengths,
        gaps=evaluation.gaps,
        model_answer=evaluation.model_answer,
        tips=evaluation.tips,
        behavioral_feedback=bf_dict,
    )
    db.add(answer)
    await db.commit()

    if user_id is not None:
        await update_weakness_tracker(user_id, question.topic, evaluation.score, db)

    return EvaluationOut(
        score=evaluation.score,
        strengths=evaluation.strengths,
        gaps=evaluation.gaps,
        model_answer=evaluation.model_answer,
        tips=evaluation.tips,
        behavioral_feedback=bf_out,
    )
