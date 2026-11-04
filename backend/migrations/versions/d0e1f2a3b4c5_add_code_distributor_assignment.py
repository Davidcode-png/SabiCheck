"""assign verification codes to distributors

Revision ID: d0e1f2a3b4c5
Revises: c9d0e1f2a3b4
Create Date: 2026-11-04 10:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd0e1f2a3b4c5'
down_revision: Union[str, Sequence[str], None] = 'c9d0e1f2a3b4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Track which distributor a code (and each check) came from."""
    op.execute(
        "ALTER TYPE distributortype ADD VALUE IF NOT EXISTS 'WHOLESALER'"
    )
    op.execute(
        "ALTER TYPE distributortype ADD VALUE IF NOT EXISTS 'SUPERMARKET'"
    )

    op.add_column(
        'verification_codes',
        sa.Column('distributor_id', sa.UUID(), nullable=True),
    )
    op.create_foreign_key(
        'fk_verification_codes_distributor_id_distributors',
        'verification_codes',
        'distributors',
        ['distributor_id'],
        ['id'],
        ondelete='SET NULL',
    )
    op.create_index(
        op.f('ix_verification_codes_distributor_id'),
        'verification_codes',
        ['distributor_id'],
        unique=False,
    )

    # Snapshot the distributor on each check so later reassignments do not
    # rewrite where a past attempt came from.
    op.add_column(
        'code_checks',
        sa.Column('distributor_id', sa.UUID(), nullable=True),
    )
    op.create_foreign_key(
        'fk_code_checks_distributor_id_distributors',
        'code_checks',
        'distributors',
        ['distributor_id'],
        ['id'],
        ondelete='SET NULL',
    )
    op.create_index(
        op.f('ix_code_checks_distributor_id'),
        'code_checks',
        ['distributor_id'],
        unique=False,
    )


def downgrade() -> None:
    """Remove the code/distributor links.

    PostgreSQL cannot drop a single enum value, so the added distributor
    types are intentionally left in place.
    """
    op.drop_index(
        op.f('ix_code_checks_distributor_id'), table_name='code_checks'
    )
    op.drop_constraint(
        'fk_code_checks_distributor_id_distributors',
        'code_checks',
        type_='foreignkey',
    )
    op.drop_column('code_checks', 'distributor_id')

    op.drop_index(
        op.f('ix_verification_codes_distributor_id'),
        table_name='verification_codes',
    )
    op.drop_constraint(
        'fk_verification_codes_distributor_id_distributors',
        'verification_codes',
        type_='foreignkey',
    )
    op.drop_column('verification_codes', 'distributor_id')
