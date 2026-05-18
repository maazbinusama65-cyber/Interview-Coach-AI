from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from services.ai_service import (
    AIServiceError,
    AnswerEvaluation,
    Question,
    QuestionSet,
    evaluate_answer,
    generate_questions,
)


@pytest.mark.asyncio
async def test_generate_questions_returns_list():
    mock_questions = QuestionSet(
        questions=[
            Question(
                text="Explain bagging vs boosting.",
                type="technical",
                topic="ensemble methods",
                difficulty="medium",
                expected_topics=["parallel vs sequential", "variance reduction"],
            )
        ]
    )

    with patch("services.ai_service._get_llm") as mock_llm_factory:
        mock_chain = MagicMock()
        mock_chain.invoke.return_value = mock_questions
        mock_llm_factory.return_value.__or__ = MagicMock(return_value=mock_chain)

        # patch asyncio.to_thread to call the function directly
        with patch("services.ai_service.asyncio.to_thread", new=AsyncMock(return_value=mock_questions)):
            result = await generate_questions("ML Engineer", "mid", "technical", 1)

    assert len(result) == 1
    assert result[0].text == "Explain bagging vs boosting."


@pytest.mark.asyncio
async def test_generate_questions_raises_on_repeated_failure():
    with patch("services.ai_service.asyncio.to_thread", side_effect=Exception("LLM down")):
        with pytest.raises(AIServiceError):
            await generate_questions("Backend Dev", "junior", "mixed", 5)


@pytest.mark.asyncio
async def test_evaluate_answer_returns_evaluation():
    mock_eval = AnswerEvaluation(
        score=7,
        strengths=["Correct definition"],
        gaps=["No example"],
        model_answer="Full answer here.",
        tips="Give a real-world example.",
    )

    with patch("services.ai_service.asyncio.to_thread", new=AsyncMock(return_value=mock_eval)):
        result = await evaluate_answer("What is bagging?", ["bootstrap sampling"], "Bagging trains models in parallel.")

    assert result.score == 7
    assert "Correct definition" in result.strengths


@pytest.mark.asyncio
async def test_evaluate_answer_raises_on_failure():
    with patch("services.ai_service.asyncio.to_thread", side_effect=Exception("timeout")):
        with pytest.raises(AIServiceError):
            await evaluate_answer("Q", [], "A")
