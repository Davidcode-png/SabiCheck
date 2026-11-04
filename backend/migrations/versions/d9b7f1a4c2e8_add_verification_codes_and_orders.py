"""add verification codes and code orders

Revision ID: d9b7f1a4c2e8
Revises: c4a8d2e6f1b3
Create Date: 2026-10-31 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd9b7f1a4c2e8'
down_revision: Union[str, Sequence[str], None] = 'c4a8d2e6f1b3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add the manufacturer prefix and the verification-code tables."""
    op.add_column(
        'organizations',
        sa.Column('manufacturer_prefix', sa.String(length=3), nullable=True),
    )
    op.execute(
        """
        UPDATE organizations
        SET manufacturer_prefix = CASE
            WHEN length(
                upper(regexp_replace(name, '[^A-Za-z0-9]', '', 'g'))
            ) >= 3 THEN substring(
                upper(regexp_replace(name, '[^A-Za-z0-9]', '', 'g'))
                from 1 for 3
            )
            ELSE 'ORG'
        END
        WHERE manufacturer_prefix IS NULL
        """
    )
    op.alter_column(
        'organizations', 'manufacturer_prefix', nullable=False
    )

    op.create_table(
        'verification_code_orders',
        sa.Column('reference', sa.String(length=64), nullable=False),
        sa.Column('organization_id', sa.UUID(), nullable=False),
        sa.Column('product_id', sa.UUID(), nullable=False),
        sa.Column('batch_id', sa.UUID(), nullable=True),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('unit_price_kobo', sa.Integer(), nullable=False),
        sa.Column('service_fee_kobo', sa.Integer(), nullable=False),
        sa.Column('total_amount_kobo', sa.Integer(), nullable=False),
        sa.Column(
            'payment_method',
            sa.Enum('CARD', 'BANK_TRANSFER', name='codepaymentmethod'),
            nullable=False,
        ),
        sa.Column(
            'status',
            sa.Enum('PENDING', 'PAID', 'FAILED', name='codeorderstatus'),
            nullable=False,
        ),
        sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True),
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
            ['organization_id'], ['organizations.id'], ondelete='CASCADE'
        ),
        sa.ForeignKeyConstraint(
            ['product_id'], ['products.id'], ondelete='CASCADE'
        ),
        sa.ForeignKeyConstraint(
            ['batch_id'], ['product_batches.id'], ondelete='SET NULL'
        ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        op.f('ix_verification_code_orders_id'),
        'verification_code_orders',
        ['id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_verification_code_orders_reference'),
        'verification_code_orders',
        ['reference'],
        unique=True,
    )
    op.create_index(
        op.f('ix_verification_code_orders_organization_id'),
        'verification_code_orders',
        ['organization_id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_verification_code_orders_product_id'),
        'verification_code_orders',
        ['product_id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_verification_code_orders_batch_id'),
        'verification_code_orders',
        ['batch_id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_verification_code_orders_status'),
        'verification_code_orders',
        ['status'],
        unique=False,
    )

    op.create_table(
        'verification_codes',
        sa.Column('code', sa.String(length=16), nullable=False),
        sa.Column('organization_id', sa.UUID(), nullable=False),
        sa.Column('product_id', sa.UUID(), nullable=False),
        sa.Column('batch_id', sa.UUID(), nullable=True),
        sa.Column('order_id', sa.UUID(), nullable=True),
        sa.Column(
            'status',
            sa.Enum(
                'UNUSED',
                'VERIFIED',
                'USED',
                'REPORTED',
                name='verificationcodestatus',
            ),
            nullable=False,
        ),
        sa.Column(
            'status_changed_at', sa.DateTime(timezone=True), nullable=True
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
            ['organization_id'], ['organizations.id'], ondelete='CASCADE'
        ),
        sa.ForeignKeyConstraint(
            ['product_id'], ['products.id'], ondelete='CASCADE'
        ),
        sa.ForeignKeyConstraint(
            ['batch_id'], ['product_batches.id'], ondelete='SET NULL'
        ),
        sa.ForeignKeyConstraint(
            ['order_id'],
            ['verification_code_orders.id'],
            ondelete='CASCADE',
        ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        op.f('ix_verification_codes_id'),
        'verification_codes',
        ['id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_verification_codes_code'),
        'verification_codes',
        ['code'],
        unique=True,
    )
    op.create_index(
        op.f('ix_verification_codes_organization_id'),
        'verification_codes',
        ['organization_id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_verification_codes_product_id'),
        'verification_codes',
        ['product_id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_verification_codes_batch_id'),
        'verification_codes',
        ['batch_id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_verification_codes_order_id'),
        'verification_codes',
        ['order_id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_verification_codes_status'),
        'verification_codes',
        ['status'],
        unique=False,
    )


def downgrade() -> None:
    """Drop the verification-code tables and the manufacturer prefix."""
    op.drop_table('verification_codes')
    op.drop_table('verification_code_orders')
    op.execute('DROP TYPE IF EXISTS verificationcodestatus')
    op.execute('DROP TYPE IF EXISTS codeorderstatus')
    op.execute('DROP TYPE IF EXISTS codepaymentmethod')
    op.drop_column('organizations', 'manufacturer_prefix')
