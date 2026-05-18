import asyncio
import logging
from functools import lru_cache

from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
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


# ── Prompt templates ───────────────────────────────────────────────────────

_QUESTION_GEN_TEMPLATE = """\
You are an expert technical interviewer at a top tech company.

Generate {count} interview questions for a {level} {role}.
Interview type: {interview_type}

Rules:
- Mix difficulty: 30% easy, 50% medium, 20% hard
- For "mixed" type: 60% technical, 40% behavioral
- Questions must be specific to the role, not generic
- Include expected_topics: what a good answer must mention

{format_instructions}
"""

_EVAL_TEMPLATE = """\
You are a senior interviewer evaluating a candidate's answer.

Question: {question}
Expected topics a good answer should cover: {expected_topics}
Candidate's answer: {user_answer}

Score from 1-10:
  1-3: Fundamentally wrong or missing
  4-6: Partially correct, key gaps
  7-8: Good, minor gaps
  9-10: Excellent, complete

Be constructive but honest. The candidate is preparing for a real interview.

{format_instructions}
"""


# ── LLM client (cached singleton) ─────────────────────────────────────────

@lru_cache(maxsize=1)
def _get_llm() -> ChatGroq:
    return ChatGroq(
        model="llama-3.1-8b-instant",
        api_key=settings.groq_api_key,
        temperature=0.7,
    )


# ── Public API ─────────────────────────────────────────────────────────────

async def generate_questions(
    role: str,
    level: str,
    interview_type: str,
    count: int,
) -> list[Question]:
    parser = PydanticOutputParser(pydantic_object=QuestionSet)
    prompt = ChatPromptTemplate.from_template(_QUESTION_GEN_TEMPLATE)
    chain = prompt | _get_llm() | parser

    for attempt in range(1, _RETRY_ATTEMPTS + 1):
        try:
            result: QuestionSet = await asyncio.to_thread(
                chain.invoke,
                {
                    "count": count,
                    "level": level,
                    "role": role,
                    "interview_type": interview_type,
                    "format_instructions": parser.get_format_instructions(),
                },
            )
            return result.questions
        except Exception as exc:
            logger.warning("Question generation attempt %d failed: %s", attempt, exc)
            if attempt == _RETRY_ATTEMPTS:
                raise AIServiceError(f"Failed to generate questions after {_RETRY_ATTEMPTS} attempts") from exc

    raise AIServiceError("Unreachable")


async def evaluate_answer(
    question_text: str,
    expected_topics: list[str],
    user_answer: str,
) -> AnswerEvaluation:
    parser = PydanticOutputParser(pydantic_object=AnswerEvaluation)
    prompt = ChatPromptTemplate.from_template(_EVAL_TEMPLATE)
    chain = prompt | _get_llm() | parser

    for attempt in range(1, _RETRY_ATTEMPTS + 1):
        try:
            result: AnswerEvaluation = await asyncio.to_thread(
                chain.invoke,
                {
                    "question": question_text,
                    "expected_topics": ", ".join(expected_topics),
                    "user_answer": user_answer,
                    "format_instructions": parser.get_format_instructions(),
                },
            )
            return result
        except Exception as exc:
            logger.warning("Answer evaluation attempt %d failed: %s", attempt, exc)
            if attempt == _RETRY_ATTEMPTS:
                raise AIServiceError(f"Failed to evaluate answer after {_RETRY_ATTEMPTS} attempts") from exc

    raise AIServiceError("Unreachable")
