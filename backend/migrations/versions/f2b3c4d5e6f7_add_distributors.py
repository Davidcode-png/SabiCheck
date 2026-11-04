"""add distributors

Revision ID: f2b3c4d5e6f7
Revises: e5f6a7b8c9d0
Create Date: 2026-11-03 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f2b3c4d5e6f7'
down_revision: Union[str, Sequence[str], None] = 'e5f6a7b8c9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create the per-organization distributor directory."""
    op.create_table(
        'distributors',
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('tracking_code', sa.String(length=32), nullable=False),
        sa.Column(
            'distributor_type',
            sa.Enum('PHARMACY', 'RETAILER', name='distributortype'),
            nullable=False,
        ),
        sa.Column('contact_name', sa.String(length=255), nullable=True),
        sa.Column('phone', sa.String(length=32), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('address', sa.String(length=512), nullable=True),
        sa.Column('city', sa.String(length=120), nullable=True),
        sa.Column('state', sa.String(length=120), nullable=True),
        sa.Column(
            'total_supplies',
            sa.Integer(),
            server_default='0',
            nullable=False,
        ),
        sa.Column('organization_id', sa.UUID(), nullable=False),
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
            ['organization_id'],
            ['organizations.id'],
            ondelete='CASCADE',
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint(
            'organization_id',
            'tracking_code',
            name='uq_distributors_organization_tracking_code',
        ),
    )
    op.create_index(
        op.f('ix_distributors_id'), 'distributors', ['id'], unique=False
    )
    op.create_index(
        op.f('ix_distributors_name'),
        'distributors',
        ['name'],
        unique=False,
    )
    op.create_index(
        op.f('ix_distributors_tracking_code'),
        'distributors',
        ['tracking_code'],
        unique=False,
    )
    op.create_index(
        op.f('ix_distributors_city'),
        'distributors',
        ['city'],
        unique=False,
    )
    op.create_index(
        op.f('ix_distributors_organization_id'),
        'distributors',
        ['organization_id'],
        unique=False,
    )


def downgrade() -> None:
    """Drop the distributor directory."""
    op.drop_table('distributors')
    op.execute('DROP TYPE IF EXISTS distributortype')
