import json
import logging
from functools import lru_cache

from groq import Groq
from pydantic import BaseModel, Field

from config import settings

logger = logging.getLogger(__name__)

_RETRY_ATTEMPTS = 3


class AIServiceError(Exception):
    pass


# ── Pydantic output schemas ──────────────────────────────────────────────


class Question(BaseModel):
    text: str
    type: str = Field(description="technical | behavioral | system_design")
    topic: str
    difficulty: str = Field(description="easy | medium | hard")
    expected_topics: list[str]


class QuestionSet(BaseModel):
    questions: list[Question]


class BehavioralFeedback(BaseModel):
    communication_clarity: int = Field(ge=1, le=10)
    structure_organization: int = Field(ge=1, le=10)
    technical_depth: int = Field(ge=1, le=10)
    use_of_examples: int = Field(ge=1, le=10)
    confidence: int = Field(ge=1, le=10)
    overall_impression: str


class AnswerEvaluation(BaseModel):
    score: int = Field(ge=1, le=10)
    strengths: list[str]
    gaps: list[str]
    model_answer: str
    tips: str
    behavioral_feedback: BehavioralFeedback


# ── Groq client (cached singleton) ───────────────────────────────────────

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


# ── Prompt builders ───────────────────────────────────────────────────────

def _question_gen_prompt(role: str, level: str, interview_type: str, count: int) -> str:
    """V1: role-based question generation."""
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


def _section_question_gen_prompt(
    topic_name: str,
    topic_category: str,
    level: str,
    interview_type: str,
    count: int,
) -> str:
    """V2: topic-specific question generation for multi-topic sessions."""
    return f"""You are an expert technical interviewer at a top tech company.

Generate {count} interview questions about **{topic_name}** (category: {topic_category})
for a {level}-level candidate.
Interview type: {interview_type}

Rules:
- Mix difficulty: 30% easy, 50% medium, 20% hard
- Questions must be specific to {topic_name}, testing real depth
- For behavioral topics, ask situational STAR-format questions
- Include expected_topics: key points a good answer must mention
- The "topic" field should be "{topic_name}"

Respond with valid JSON only, in this exact shape:
{{
  "questions": [
    {{
      "text": "...",
      "type": "technical | behavioral | system_design",
      "topic": "{topic_name}",
      "difficulty": "easy | medium | hard",
      "expected_topics": ["...", "..."]
    }}
  ]
}}"""


def _eval_prompt(question: str, expected_topics: list[str], user_answer: str) -> str:
    topics_str = ", ".join(expected_topics) if expected_topics else "N/A"
    return f"""You are a senior interviewer evaluating a candidate's answer.

Question: {question}
Expected topics a good answer should cover: {topics_str}
Candidate's answer: {user_answer}

Score from 1-10:
  1-3: Fundamentally wrong or missing
  4-6: Partially correct, key gaps
  7-8: Good, minor gaps
  9-10: Excellent, complete

Also evaluate the candidate's behavioural dimensions:
- communication_clarity (1-10): How clear and articulate is the response?
- structure_organization (1-10): Is the answer well-structured with a logical flow?
- technical_depth (1-10): Does the answer show deep understanding?
- use_of_examples (1-10): Does the candidate use concrete examples?
- confidence (1-10): Does the answer sound confident and assured?
- overall_impression: A 1-2 sentence narrative summary of the candidate's performance.

Be constructive but honest. The candidate is preparing for a real interview.

Respond with valid JSON only, in this exact shape:
{{
  "score": <integer 1-10>,
  "strengths": ["...", "..."],
  "gaps": ["...", "..."],
  "model_answer": "...",
  "tips": "...",
  "behavioral_feedback": {{
    "communication_clarity": <integer 1-10>,
    "structure_organization": <integer 1-10>,
    "technical_depth": <integer 1-10>,
    "use_of_examples": <integer 1-10>,
    "confidence": <integer 1-10>,
    "overall_impression": "..."
  }}
}}"""


# ── Public API ────────────────────────────────────────────────────────────

async def generate_questions(
    role: str,
    level: str,
    interview_type: str,
    count: int,
) -> list[Question]:
    """V1: Generate questions for a single role."""
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


async def generate_section_questions(
    topic_name: str,
    topic_category: str,
    level: str,
    interview_type: str,
    count: int,
) -> list[Question]:
    """V2: Generate questions for a specific topic section."""
    prompt = _section_question_gen_prompt(
        topic_name, topic_category, level, interview_type, count,
    )

    for attempt in range(1, _RETRY_ATTEMPTS + 1):
        try:
            raw = _chat(prompt)
            data = json.loads(raw)
            return QuestionSet.model_validate(data).questions
        except Exception as exc:
            logger.warning("Section question gen attempt %d failed (%s): %s", attempt, topic_name, exc)
            if attempt == _RETRY_ATTEMPTS:
                raise AIServiceError(
                    f"Failed to generate {topic_name} questions after {_RETRY_ATTEMPTS} attempts"
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
