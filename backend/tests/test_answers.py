from unittest.mock import AsyncMock, patch

import pytest

from services.ai_service import AnswerEvaluation, Question

MOCK_QUESTIONS = [
    Question(
        text="What is a race condition?",
        type="technical",
        topic="concurrency",
        difficulty="medium",
        expected_topics=["shared state", "non-determinism"],
    )
]

MOCK_EVAL = AnswerEvaluation(
    score=8,
    strengths=["Correctly described shared state issue"],
    gaps=["No mention of mutex solutions"],
    model_answer="A race condition occurs when two threads access shared state without synchronization...",
    tips="Mention mutexes and semaphores as standard solutions.",
)


@pytest.mark.asyncio
async def test_submit_answer_returns_evaluation(client):
    with patch("routers.sessions.generate_questions", new=AsyncMock(return_value=MOCK_QUESTIONS)):
        session_resp = await client.post(
            "/api/sessions",
            json={"role": "Backend Dev", "level": "mid", "interview_type": "technical", "question_count": 1},
        )
    question_id = session_resp.json()["questions"][0]["id"]

    with patch("routers.answers.evaluate_answer", new=AsyncMock(return_value=MOCK_EVAL)):
        answer_resp = await client.post(
            "/api/answers",
            json={"question_id": question_id, "user_text": "A race condition is when two threads..."},
        )

    assert answer_resp.status_code == 200
    data = answer_resp.json()
    assert data["score"] == 8
    assert len(data["strengths"]) == 1
    assert len(data["gaps"]) == 1


@pytest.mark.asyncio
async def test_submit_answer_duplicate_returns_409(client):
    with patch("routers.sessions.generate_questions", new=AsyncMock(return_value=MOCK_QUESTIONS)):
        session_resp = await client.post(
            "/api/sessions",
            json={"role": "Backend Dev", "level": "mid", "interview_type": "technical", "question_count": 1},
        )
    question_id = session_resp.json()["questions"][0]["id"]

    with patch("routers.answers.evaluate_answer", new=AsyncMock(return_value=MOCK_EVAL)):
        await client.post("/api/answers", json={"question_id": question_id, "user_text": "first answer"})
        resp2 = await client.post("/api/answers", json={"question_id": question_id, "user_text": "second answer"})

    assert resp2.status_code == 409
