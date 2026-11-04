"""add NAFDAC Greenbook snapshot tables

Revision ID: c4a8d2e6f1b3
Revises: 7b9e2f4c1a6d
Create Date: 2026-10-31 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'c4a8d2e6f1b3'
down_revision: Union[str, Sequence[str], None] = '7b9e2f4c1a6d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create the Greenbook snapshot and sync-run audit tables."""
    op.create_table(
        'nafdac_greenbook_products',
        sa.Column('greenbook_product_id', sa.Integer(), nullable=False),
        sa.Column('product_name', sa.String(length=512), nullable=False),
        sa.Column('normalized_name', sa.String(length=512), nullable=False),
        sa.Column('nrn', sa.String(length=64), nullable=True),
        sa.Column('normalized_nrn', sa.String(length=64), nullable=True),
        sa.Column('status', sa.String(length=64), nullable=True),
        sa.Column('approval_date', sa.Date(), nullable=True),
        sa.Column('expiry_date', sa.Date(), nullable=True),
        sa.Column('applicant_name', sa.String(length=512), nullable=True),
        sa.Column('ingredient_name', sa.String(length=512), nullable=True),
        sa.Column('form', sa.String(length=128), nullable=True),
        sa.Column('route', sa.String(length=128), nullable=True),
        sa.Column('strength', sa.String(length=255), nullable=True),
        sa.Column('pack_size', sa.String(length=255), nullable=True),
        sa.Column('product_category', sa.String(length=128), nullable=True),
        sa.Column('product_category_id', sa.Integer(), nullable=True),
        sa.Column('applicant_id', sa.Integer(), nullable=True),
        sa.Column('ingredient_id', sa.Integer(), nullable=True),
        sa.Column('manufacturer_id', sa.Integer(), nullable=True),
        sa.Column(
            'greenbook_created_at',
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            'greenbook_updated_at',
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            'raw_payload',
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column(
            'first_seen_at', sa.DateTime(timezone=True), nullable=False
        ),
        sa.Column('last_seen_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            'last_synced_at', sa.DateTime(timezone=True), nullable=False
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
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        op.f('ix_nafdac_greenbook_products_id'),
        'nafdac_greenbook_products',
        ['id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_nafdac_greenbook_products_greenbook_product_id'),
        'nafdac_greenbook_products',
        ['greenbook_product_id'],
        unique=True,
    )
    op.create_index(
        op.f('ix_nafdac_greenbook_products_normalized_name'),
        'nafdac_greenbook_products',
        ['normalized_name'],
        unique=False,
    )
    op.create_index(
        op.f('ix_nafdac_greenbook_products_nrn'),
        'nafdac_greenbook_products',
        ['nrn'],
        unique=False,
    )
    op.create_index(
        op.f('ix_nafdac_greenbook_products_normalized_nrn'),
        'nafdac_greenbook_products',
        ['normalized_nrn'],
        unique=False,
    )
    op.create_index(
        op.f('ix_nafdac_greenbook_products_status'),
        'nafdac_greenbook_products',
        ['status'],
        unique=False,
    )

    op.create_table(
        'nafdac_greenbook_sync_runs',
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('source_url', sa.String(length=512), nullable=False),
        sa.Column('requested_limit', sa.Integer(), nullable=False),
        sa.Column('page_size', sa.Integer(), nullable=False),
        sa.Column(
            'fetched_count',
            sa.Integer(),
            server_default=sa.text('0'),
            nullable=False,
        ),
        sa.Column(
            'inserted_count',
            sa.Integer(),
            server_default=sa.text('0'),
            nullable=False,
        ),
        sa.Column(
            'updated_count',
            sa.Integer(),
            server_default=sa.text('0'),
            nullable=False,
        ),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('finished_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
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
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        op.f('ix_nafdac_greenbook_sync_runs_id'),
        'nafdac_greenbook_sync_runs',
        ['id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_nafdac_greenbook_sync_runs_status'),
        'nafdac_greenbook_sync_runs',
        ['status'],
        unique=False,
    )


def downgrade() -> None:
    """Drop the Greenbook snapshot and sync-run audit tables."""
    op.drop_table('nafdac_greenbook_sync_runs')
    op.drop_table('nafdac_greenbook_products')
