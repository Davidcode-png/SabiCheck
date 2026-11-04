"""organization onboarding fields, memberships and file attachments

Revision ID: e3cd8f8408fc
Revises: 138db65d2177
Create Date: 2026-10-26 12:44:43.572780

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e3cd8f8408fc'
down_revision: Union[str, Sequence[str], None] = '138db65d2177'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema.

    ``organizations`` and ``organization_users`` were never populated, so the
    onboarding fields are introduced by recreating both tables instead of
    juggling several non-nullable columns.
    """
    op.drop_table('organization_users')
    op.drop_table('organizations')
    op.execute('DROP TYPE IF EXISTS organizationrole')
    op.execute('DROP TYPE IF EXISTS industry')
    op.execute('DROP TYPE IF EXISTS registrationtype')

    op.create_table(
        'organizations',
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column(
            'registration_type',
            sa.Enum(
                'LLC',
                'PLC',
                'PARTNERSHIP',
                'SOLE_PROPRIETORSHIP',
                'NGO',
                'UNKNOWN',
                name='registrationtype',
            ),
            nullable=False,
        ),
        sa.Column('registration_code', sa.String(length=255), nullable=False),
        sa.Column(
            'industry_type',
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
                name='industry',
            ),
            nullable=False,
        ),
        sa.Column('website', sa.String(length=255), nullable=True),
        sa.Column('state', sa.String(length=255), nullable=False),
        sa.Column('country', sa.String(length=255), nullable=False),
        sa.Column('address', sa.String(length=512), nullable=False),
        sa.Column('contact_person_full_name', sa.String(length=255), nullable=False),
        sa.Column('business_email', sa.String(length=255), nullable=False),
        sa.Column('phone_no', sa.String(length=32), nullable=False),
        sa.Column('registration_details', sa.Text(), nullable=True),
        sa.Column('reference_number', sa.String(length=64), nullable=False),
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
    op.create_index(op.f('ix_organizations_id'), 'organizations', ['id'], unique=False)
    op.create_index(
        op.f('ix_organizations_reference_number'),
        'organizations',
        ['reference_number'],
        unique=True,
    )

    op.create_table(
        'organization_users',
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('organization_id', sa.UUID(), nullable=False),
        sa.Column(
            'role',
            sa.Enum('OWNER', 'ADMIN', 'MEMBER', name='organizationrole'),
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
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(
            ['organization_id'], ['organizations.id'], ondelete='CASCADE'
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint(
            'user_id',
            'organization_id',
            name='uq_organization_users_user_organization',
        ),
    )
    op.create_index(
        op.f('ix_organization_users_id'),
        'organization_users',
        ['id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_organization_users_user_id'),
        'organization_users',
        ['user_id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_organization_users_organization_id'),
        'organization_users',
        ['organization_id'],
        unique=False,
    )

    op.create_table(
        'file_attachments',
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column('file_url', sa.String(length=1024), nullable=False),
        sa.Column('public_id', sa.String(length=512), nullable=False),
        sa.Column('resource_type', sa.String(length=32), nullable=False),
        sa.Column('file_format', sa.String(length=32), nullable=True),
        sa.Column('content_type', sa.String(length=128), nullable=True),
        sa.Column('file_size', sa.Integer(), nullable=True),
        sa.Column('entity_type', sa.String(length=64), nullable=False),
        sa.Column('entity_id', sa.UUID(), nullable=False),
        sa.Column('uploaded_by_id', sa.UUID(), nullable=True),
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
            ['uploaded_by_id'], ['users.id'], ondelete='SET NULL'
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('public_id'),
    )
    op.create_index(
        'ix_file_attachments_entity',
        'file_attachments',
        ['entity_type', 'entity_id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_file_attachments_entity_id'),
        'file_attachments',
        ['entity_id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_file_attachments_entity_type'),
        'file_attachments',
        ['entity_type'],
        unique=False,
    )
    op.create_index(
        op.f('ix_file_attachments_id'), 'file_attachments', ['id'], unique=False
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('file_attachments')
    op.drop_table('organization_users')
    op.drop_table('organizations')
    op.execute('DROP TYPE IF EXISTS registrationtype')
    op.execute('DROP TYPE IF EXISTS organizationrole')
    op.execute('DROP TYPE IF EXISTS industry')

    op.create_table(
        'organizations',
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=255), nullable=False),
        sa.Column('state', sa.String(length=255), nullable=False),
        sa.Column('country', sa.String(length=255), nullable=False),
        sa.Column('address', sa.String(length=255), nullable=False),
        sa.Column('website', sa.String(length=255), nullable=False),
        sa.Column('zip_code', sa.String(length=255), nullable=False),
        sa.Column(
            'industry_type',
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
                name='industry',
            ),
            nullable=False,
        ),
        sa.Column('registration_code', sa.String(length=255), nullable=False),
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
    op.create_index(op.f('ix_organizations_id'), 'organizations', ['id'], unique=False)

    op.create_table(
        'organization_users',
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('organization_id', sa.UUID(), nullable=False),
        sa.Column(
            'role',
            sa.Enum('OWNER', 'ADMIN', 'MEMBER', name='organizationrole'),
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
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        op.f('ix_organization_users_id'),
        'organization_users',
        ['id'],
        unique=False,
    )
