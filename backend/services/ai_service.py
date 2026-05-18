import json
import logging
from functools import lru_cache

from groq import Groq
from pydantic import BaseModel, Field

from config import settings

logger = logging.getLogger(__name__)

_RETRY_ATTEMPTS = 2


class AIServiceError(Exception):
    pass


# ── Pydantic output schemas ────────────────────────────────────────────────


class Question(BaseModel):
    text: str
    type: str = Field(description="technical | behavioral | system_design")
    topic: str
    difficulty: str = Field(description="easy | medium | hard")
    expected_topics: list[str]


class QuestionSet(BaseModel):
    questions: list[Question]


class AnswerEvaluation(BaseModel):
    score: int = Field(ge=1, le=10)
    strengths: list[str]
    gaps: list[str]
    model_answer: str
    tips: str


# ── Groq client (cached singleton) ────────────────────────────────────────

@lru_cache(maxsize=1)
def _get_client() -> Groq:
    return Groq(api_key=settings.groq_api_key)


def _chat(prompt: str) -> str:
    """Send a prompt, force JSON output, return raw response text."""
    response = _get_client().chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0.7,
    )
    return response.choices[0].message.content


# ── Prompt builders ────────────────────────────────────────────────────────

def _question_gen_prompt(role: str, level: str, interview_type: str, count: int) -> str:
    return f"""You are an expert technical interviewer at a top tech company.

Generate {count} interview questions for a {level} {role}.
Interview type: {interview_type}

Rules:
- Mix difficulty: 30% easy, 50% medium, 20% hard
- For "mixed" type: 60% technical, 40% behavioral
- Questions must be specific to the role, not generic
- Include expected_topics: key points a good answer must mention

Respond with valid JSON only, in this exact shape:
{{
  "questions": [
    {{
      "text": "...",
      "type": "technical | behavioral | system_design",
      "topic": "...",
      "difficulty": "easy | medium | hard",
      "expected_topics": ["...", "..."]
    }}
  ]
}}"""


def _eval_prompt(question: str, expected_topics: list[str], user_answer: str) -> str:
    topics_str = ", ".join(expected_topics)
    return f"""You are a senior interviewer evaluating a candidate's answer.

Question: {question}
Expected topics a good answer should cover: {topics_str}
Candidate's answer: {user_answer}

Score from 1-10:
  1-3: Fundamentally wrong or missing
  4-6: Partially correct, key gaps
  7-8: Good, minor gaps
  9-10: Excellent, complete

Be constructive but honest. The candidate is preparing for a real interview.

Respond with valid JSON only, in this exact shape:
{{
  "score": <integer 1-10>,
  "strengths": ["...", "..."],
  "gaps": ["...", "..."],
  "model_answer": "...",
  "tips": "..."
}}"""


# ── Public API ─────────────────────────────────────────────────────────────

async def generate_questions(
    role: str,
    level: str,
    interview_type: str,
    count: int,
) -> list[Question]:
    prompt = _question_gen_prompt(role, level, interview_type, count)

    for attempt in range(1, _RETRY_ATTEMPTS + 1):
        try:
            raw = _chat(prompt)
            data = json.loads(raw)
            return QuestionSet.model_validate(data).questions
        except Exception as exc:
            logger.warning("Question generation attempt %d failed: %s", attempt, exc)
            if attempt == _RETRY_ATTEMPTS:
                raise AIServiceError(
                    f"Failed to generate questions after {_RETRY_ATTEMPTS} attempts"
                ) from exc

    raise AIServiceError("Unreachable")


async def evaluate_answer(
    question_text: str,
    expected_topics: list[str],
    user_answer: str,
) -> AnswerEvaluation:
    prompt = _eval_prompt(question_text, expected_topics, user_answer)

    for attempt in range(1, _RETRY_ATTEMPTS + 1):
        try:
            raw = _chat(prompt)
            data = json.loads(raw)
            return AnswerEvaluation.model_validate(data)
        except Exception as exc:
            logger.warning("Answer evaluation attempt %d failed: %s", attempt, exc)
            if attempt == _RETRY_ATTEMPTS:
                raise AIServiceError(
                    f"Failed to evaluate answer after {_RETRY_ATTEMPTS} attempts"
                ) from exc

    raise AIServiceError("Unreachable")
