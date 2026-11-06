"""add report priority and AI triage fields

Revision ID: f1a2b3c4d5e6
Revises: d0e1f2a3b4c5
Create Date: 2026-11-06 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, Sequence[str], None] = 'd0e1f2a3b4c5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add the human-owned priority and the stored AI suggestion."""
    op.add_column(
        'code_reports',
        sa.Column(
            'priority',
            sa.String(length=16),
            nullable=False,
            server_default='normal',
        ),
    )
    op.create_index(
        op.f('ix_code_reports_priority'),
        'code_reports',
        ['priority'],
        unique=False,
    )

    op.add_column(
        'code_reports', sa.Column('ai_summary', sa.Text(), nullable=True)
    )
    op.add_column(
        'code_reports',
        sa.Column('ai_suggested_concern', sa.String(length=64), nullable=True),
    )
    op.add_column(
        'code_reports',
        sa.Column('ai_priority', sa.String(length=16), nullable=True),
    )
    op.add_column(
        'code_reports',
        sa.Column('ai_priority_reason', sa.Text(), nullable=True),
    )
    op.add_column(
        'code_reports', sa.Column('ai_next_step', sa.Text(), nullable=True)
    )
    op.add_column(
        'code_reports',
        sa.Column('ai_duplicate_reference', sa.String(length=32), nullable=True),
    )
    op.add_column(
        'code_reports', sa.Column('ai_flags', sa.JSON(), nullable=True)
    )
    op.add_column(
        'code_reports',
        sa.Column('ai_confidence', sa.String(length=16), nullable=True),
    )
    op.add_column(
        'code_reports',
        sa.Column('ai_model', sa.String(length=64), nullable=True),
    )
    op.add_column(
        'code_reports',
        sa.Column('ai_prompt_version', sa.String(length=32), nullable=True),
    )
    op.add_column(
        'code_reports',
        sa.Column(
            'ai_generated_at', sa.DateTime(timezone=True), nullable=True
        ),
    )


def downgrade() -> None:
    """Remove the priority and AI triage fields."""
    op.drop_column('code_reports', 'ai_generated_at')
    op.drop_column('code_reports', 'ai_prompt_version')
    op.drop_column('code_reports', 'ai_model')
    op.drop_column('code_reports', 'ai_confidence')
    op.drop_column('code_reports', 'ai_flags')
    op.drop_column('code_reports', 'ai_duplicate_reference')
    op.drop_column('code_reports', 'ai_next_step')
    op.drop_column('code_reports', 'ai_priority_reason')
    op.drop_column('code_reports', 'ai_priority')
    op.drop_column('code_reports', 'ai_suggested_concern')
    op.drop_column('code_reports', 'ai_summary')
    op.drop_index(
        op.f('ix_code_reports_priority'), table_name='code_reports'
    )
    op.drop_column('code_reports', 'priority')
