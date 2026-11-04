"""add code check counters and consumer reports

Revision ID: e5f6a7b8c9d0
Revises: d9b7f1a4c2e8
Create Date: 2026-10-31 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, Sequence[str], None] = 'd9b7f1a4c2e8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Track code checks and store consumer concern reports."""
    op.add_column(
        'verification_codes',
        sa.Column(
            'check_count',
            sa.Integer(),
            nullable=False,
            server_default='0',
        ),
    )
    op.add_column(
        'verification_codes',
        sa.Column(
            'first_checked_at', sa.DateTime(timezone=True), nullable=True
        ),
    )
    op.add_column(
        'verification_codes',
        sa.Column(
            'last_checked_at', sa.DateTime(timezone=True), nullable=True
        ),
    )

    op.create_table(
        'code_reports',
        sa.Column('reference', sa.String(length=32), nullable=False),
        sa.Column('code', sa.String(length=16), nullable=False),
        sa.Column('verification_code_id', sa.UUID(), nullable=True),
        sa.Column('product_id', sa.UUID(), nullable=True),
        sa.Column('organization_id', sa.UUID(), nullable=True),
        sa.Column('product_name', sa.String(length=512), nullable=True),
        sa.Column(
            'concern',
            sa.Enum(
                'SUSPECTED_COUNTERFEIT',
                'UNMATCHED_CODE',
                'DAMAGED_PACKAGING',
                'CODE_ALREADY_USED',
                'UNUSUAL_APPEARANCE',
                'ILLNESS',
                'EXPIRED',
                'OTHER',
                name='concerntype',
            ),
            nullable=False,
        ),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column(
            'purchase_location', sa.String(length=255), nullable=True
        ),
        sa.Column('purchase_date', sa.Date(), nullable=True),
        sa.Column('status', sa.String(length=32), nullable=False),
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
            ondelete='SET NULL',
        ),
        sa.ForeignKeyConstraint(
            ['product_id'], ['products.id'], ondelete='SET NULL'
        ),
        sa.ForeignKeyConstraint(
            ['organization_id'], ['organizations.id'], ondelete='SET NULL'
        ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        op.f('ix_code_reports_id'), 'code_reports', ['id'], unique=False
    )
    op.create_index(
        op.f('ix_code_reports_reference'),
        'code_reports',
        ['reference'],
        unique=True,
    )
    op.create_index(
        op.f('ix_code_reports_code'), 'code_reports', ['code'], unique=False
    )
    op.create_index(
        op.f('ix_code_reports_verification_code_id'),
        'code_reports',
        ['verification_code_id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_code_reports_product_id'),
        'code_reports',
        ['product_id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_code_reports_organization_id'),
        'code_reports',
        ['organization_id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_code_reports_concern'),
        'code_reports',
        ['concern'],
        unique=False,
    )


def downgrade() -> None:
    """Drop consumer reports and the code check counters."""
    op.drop_table('code_reports')
    op.execute('DROP TYPE IF EXISTS concerntype')
    op.drop_column('verification_codes', 'last_checked_at')
    op.drop_column('verification_codes', 'first_checked_at')
    op.drop_column('verification_codes', 'check_count')
