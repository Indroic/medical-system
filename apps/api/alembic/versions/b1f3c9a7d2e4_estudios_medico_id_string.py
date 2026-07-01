"""estudios medico_id to string

Revision ID: b1f3c9a7d2e4
Revises: 73684978038a
Create Date: 2026-07-01 20:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b1f3c9a7d2e4'
down_revision: Union[str, Sequence[str], None] = '73684978038a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column(
        'estudios',
        'medico_id',
        existing_type=sa.UUID(),
        type_=sa.String(),
        nullable=False,
        postgresql_using='medico_id::text',
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column(
        'estudios',
        'medico_id',
        existing_type=sa.String(),
        type_=sa.UUID(),
        nullable=False,
        postgresql_using='medico_id::uuid',
    )
