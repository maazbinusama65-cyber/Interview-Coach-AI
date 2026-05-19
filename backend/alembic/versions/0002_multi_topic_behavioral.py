"""Add multi-topic sections and behavioral feedback

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-19
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── interview_sections table ──
    op.create_table(
        "interview_sections",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("session_id", UUID(as_uuid=True), sa.ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("topic_category", sa.Text(), nullable=False),
        sa.Column("topic_name", sa.Text(), nullable=False),
        sa.Column("question_count", sa.Integer(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
    )

    # ── sessions: add topics JSONB ──
    op.add_column("sessions", sa.Column("topics", JSONB, nullable=True))

    # ── questions: add section_id FK ──
    op.add_column(
        "questions",
        sa.Column("section_id", UUID(as_uuid=True), sa.ForeignKey("interview_sections.id", ondelete="SET NULL"), nullable=True),
    )

    # ── answers: add behavioral_feedback JSONB ──
    op.add_column("answers", sa.Column("behavioral_feedback", JSONB, nullable=True))


def downgrade() -> None:
    op.drop_column("answers", "behavioral_feedback")
    op.drop_column("questions", "section_id")
    op.drop_column("sessions", "topics")
    op.drop_table("interview_sections")
