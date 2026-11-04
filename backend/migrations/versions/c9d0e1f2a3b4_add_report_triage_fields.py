"""add triage fields to consumer reports

Revision ID: c9d0e1f2a3b4
Revises: a7b8c9d0e1f2
Create Date: 2026-11-04 09:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c9d0e1f2a3b4'
down_revision: Union[str, Sequence[str], None] = 'a7b8c9d0e1f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Link reports to a reviewer and distributor for case triage."""
    op.add_column(
        'code_reports',
        sa.Column('reviewer_id', sa.UUID(), nullable=True),
    )
    op.add_column(
        'code_reports',
        sa.Column('distributor_id', sa.UUID(), nullable=True),
    )
    op.add_column(
        'code_reports',
        sa.Column(
            'reviewed_at', sa.DateTime(timezone=True), nullable=True
        ),
    )

    op.create_foreign_key(
        'fk_code_reports_reviewer_id_users',
        'code_reports',
        'users',
        ['reviewer_id'],
        ['id'],
        ondelete='SET NULL',
    )
    op.create_foreign_key(
        'fk_code_reports_distributor_id_distributors',
        'code_reports',
        'distributors',
        ['distributor_id'],
        ['id'],
        ondelete='SET NULL',
    )

    op.create_index(
        op.f('ix_code_reports_reviewer_id'),
        'code_reports',
        ['reviewer_id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_code_reports_distributor_id'),
        'code_reports',
        ['distributor_id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_code_reports_status'),
        'code_reports',
        ['status'],
        unique=False,
    )


def downgrade() -> None:
    """Remove the report triage links."""
    op.drop_index(
        op.f('ix_code_reports_status'), table_name='code_reports'
    )
    op.drop_index(
        op.f('ix_code_reports_distributor_id'), table_name='code_reports'
    )
    op.drop_index(
        op.f('ix_code_reports_reviewer_id'), table_name='code_reports'
    )
    op.drop_constraint(
        'fk_code_reports_distributor_id_distributors',
        'code_reports',
        type_='foreignkey',
    )
    op.drop_constraint(
        'fk_code_reports_reviewer_id_users',
        'code_reports',
        type_='foreignkey',
    )
    op.drop_column('code_reports', 'reviewed_at')
    op.drop_column('code_reports', 'distributor_id')
    op.drop_column('code_reports', 'reviewer_id')
