"""add waitlist signups

Revision ID: b2c3d4e5f6a7
Revises: f1a2b3c4d5e6
Create Date: 2026-11-15 09:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, Sequence[str], None] = 'f1a2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Store landing-page waitlist signups."""
    op.create_table(
        'waitlist_signups',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=320), nullable=False),
        sa.Column('role', sa.String(length=32), nullable=False),
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
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        op.f('ix_waitlist_signups_id'),
        'waitlist_signups',
        ['id'],
        unique=True,
    )
    op.create_index(
        op.f('ix_waitlist_signups_email'),
        'waitlist_signups',
        ['email'],
        unique=True,
    )


def downgrade() -> None:
    """Remove the waitlist table."""
    op.drop_index(
        op.f('ix_waitlist_signups_email'), table_name='waitlist_signups'
    )
    op.drop_index(
        op.f('ix_waitlist_signups_id'), table_name='waitlist_signups'
    )
    op.drop_table('waitlist_signups')
