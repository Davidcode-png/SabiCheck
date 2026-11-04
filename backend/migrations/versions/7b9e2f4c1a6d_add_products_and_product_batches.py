"""add products and product batches

Revision ID: 7b9e2f4c1a6d
Revises: e3cd8f8408fc
Create Date: 2026-10-31 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7b9e2f4c1a6d'
down_revision: Union[str, Sequence[str], None] = 'e3cd8f8408fc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create product batches and products."""
    op.create_table(
        'product_batches',
        sa.Column('batch_no', sa.String(length=255), nullable=False),
        sa.Column('organization_id', sa.UUID(), nullable=False),
        sa.Column(
            'production_date', sa.DateTime(timezone=True), nullable=True
        ),
        sa.Column('is_active', sa.Boolean(), nullable=False),
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
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint(
            'organization_id',
            'batch_no',
            name='uq_product_batches_organization_batch_no',
        ),
    )
    op.create_index(
        op.f('ix_product_batches_id'),
        'product_batches',
        ['id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_product_batches_batch_no'),
        'product_batches',
        ['batch_no'],
        unique=False,
    )
    op.create_index(
        op.f('ix_product_batches_organization_id'),
        'product_batches',
        ['organization_id'],
        unique=False,
    )

    op.create_table(
        'products',
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('sku', sa.String(length=255), nullable=False),
        sa.Column('brand_name', sa.String(length=255), nullable=True),
        sa.Column(
            'category',
            sa.Enum(
                'ELECTRONICS',
                'COMPUTERS',
                'GAMES',
                'HOME_GOODS',
                'TOYS',
                'CLOTHING',
                'BEAUTY',
                'FOOD',
                'HEALTH',
                'HOUSEHOLD',
                'SPORTS',
                'OTHER',
                name='productcategory',
            ),
            nullable=False,
        ),
        sa.Column('batch_id', sa.UUID(), nullable=True),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column(
            'packaging_type',
            sa.Enum(
                'BOX',
                'PACK',
                'SEALED_POUCH',
                'OTHER',
                name='packagetype',
            ),
            nullable=True,
        ),
        sa.Column('unit', sa.String(length=32), nullable=True),
        sa.Column('pack_size', sa.String(length=64), nullable=True),
        sa.Column('reg_no', sa.String(length=255), nullable=False),
        sa.Column('barcode', sa.String(length=64), nullable=True),
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
            ['batch_id'], ['product_batches.id'], ondelete='SET NULL'
        ),
        sa.ForeignKeyConstraint(
            ['organization_id'], ['organizations.id'], ondelete='CASCADE'
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint(
            'organization_id', 'sku', name='uq_products_organization_sku'
        ),
    )
    op.create_index(op.f('ix_products_id'), 'products', ['id'], unique=False)
    op.create_index(op.f('ix_products_sku'), 'products', ['sku'], unique=False)
    op.create_index(
        op.f('ix_products_batch_id'), 'products', ['batch_id'], unique=False
    )
    op.create_index(
        op.f('ix_products_organization_id'),
        'products',
        ['organization_id'],
        unique=False,
    )


def downgrade() -> None:
    """Drop products and product batches."""
    op.drop_table('products')
    op.drop_table('product_batches')
    op.execute('DROP TYPE IF EXISTS packagetype')
    op.execute('DROP TYPE IF EXISTS productcategory')
