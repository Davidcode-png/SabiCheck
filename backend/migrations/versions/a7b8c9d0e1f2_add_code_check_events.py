"""add code check events for the verification trend

Revision ID: a7b8c9d0e1f2
Revises: f2b3c4d5e6f7
Create Date: 2026-11-03 20:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a7b8c9d0e1f2'
down_revision: Union[str, Sequence[str], None] = 'f2b3c4d5e6f7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create the append-only code-check event log."""
    op.create_table(
        'code_checks',
        sa.Column('verification_code_id', sa.UUID(), nullable=False),
        sa.Column('organization_id', sa.UUID(), nullable=False),
        sa.Column('product_id', sa.UUID(), nullable=False),
        sa.Column('result', sa.String(length=16), nullable=False),
        sa.Column(
            'checked_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ['verification_code_id'],
            ['verification_codes.id'],
            ondelete='CASCADE',
        ),
        sa.ForeignKeyConstraint(
            ['organization_id'],
            ['organizations.id'],
            ondelete='CASCADE',
        ),
        sa.ForeignKeyConstraint(
            ['product_id'],
            ['products.id'],
            ondelete='CASCADE',
        ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        op.f('ix_code_checks_id'), 'code_checks', ['id'], unique=False
    )
    op.create_index(
        op.f('ix_code_checks_verification_code_id'),
        'code_checks',
        ['verification_code_id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_code_checks_organization_id'),
        'code_checks',
        ['organization_id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_code_checks_product_id'),
        'code_checks',
        ['product_id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_code_checks_checked_at'),
        'code_checks',
        ['checked_at'],
        unique=False,
    )

    # Existing codes only store an aggregate count plus first/last timestamps.
    # Backfill one event per recorded check on the last-checked day so the
    # chart total matches the per-code counters.
    op.execute(
        """
        INSERT INTO code_checks (
            id,
            verification_code_id,
            organization_id,
            product_id,
            result,
            checked_at,
            created_at,
            updated_at
        )
        SELECT
            gen_random_uuid(),
            vc.id,
            vc.organization_id,
            vc.product_id,
            CASE WHEN n = 1 THEN 'match' ELSE 'repeat' END,
            COALESCE(vc.last_checked_at, vc.first_checked_at, vc.created_at),
            now(),
            now()
        FROM verification_codes vc
        CROSS JOIN LATERAL generate_series(1, vc.check_count) AS n
        WHERE vc.check_count > 0
        """
    )


def downgrade() -> None:
    """Drop the code-check event log."""
    op.drop_table('code_checks')
