from unittest.mock import AsyncMock, patch

import pytest

from services.ai_service import Question, QuestionSet

MOCK_QUESTIONS = [
    Question(
        text="Explain the CAP theorem.",
        type="technical",
        topic="distributed systems",
        difficulty="medium",
        expected_topics=["consistency", "availability", "partition tolerance"],
    ),
    Question(
        text="Tell me about a time you led a project.",
        type="behavioral",
        topic="leadership",
        difficulty="easy",
        expected_topics=["ownership", "outcome"],
    ),
]


@pytest.mark.asyncio
async def test_create_session(client):
    with patch(
        "routers.sessions.generate_questions",
        new=AsyncMock(return_value=MOCK_QUESTIONS),
    ):
        resp = await client.post(
            "/api/sessions",
            json={"role": "Backend Dev", "level": "mid", "interview_type": "mixed", "question_count": 2},
        )

    assert resp.status_code == 201
    data = resp.json()
    assert "session_id" in data
    assert len(data["questions"]) == 2
    assert data["questions"][0]["position"] == 1


@pytest.mark.asyncio
async def test_create_session_ai_failure_returns_503(client):
    from services.ai_service import AIServiceError

    with patch(
        "routers.sessions.generate_questions",
        new=AsyncMock(side_effect=AIServiceError("LLM down")),
    ):
        resp = await client.post(
            "/api/sessions",
            json={"role": "Backend Dev", "level": "mid", "interview_type": "mixed", "question_count": 5},
        )

    assert resp.status_code == 503


@pytest.mark.asyncio
async def test_get_session_not_found(client):
    import uuid
    resp = await client.get(f"/api/sessions/{uuid.uuid4()}")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_complete_session(client):
    with patch(
        "routers.sessions.generate_questions",
        new=AsyncMock(return_value=MOCK_QUESTIONS),
    ):
        create_resp = await client.post(
            "/api/sessions",
            json={"role": "Backend Dev", "level": "mid", "interview_type": "mixed", "question_count": 2},
        )
    session_id = create_resp.json()["session_id"]

    complete_resp = await client.post(f"/api/sessions/{session_id}/complete")
    assert complete_resp.status_code == 200
    assert complete_resp.json()["status"] == "completed"
