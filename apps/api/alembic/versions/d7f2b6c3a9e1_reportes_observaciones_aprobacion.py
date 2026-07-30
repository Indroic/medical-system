"""Reportes: observaciones editables y trazabilidad de aprobación

Añade a `reportes`:
  - `observaciones`  → notas clínicas que el médico complementa mientras el
                       reporte está pendiente.
  - `aprobado_por`   → CUID de Better-Auth del médico que lo aprobó.
  - `aprobado_en`    → cuándo se aprobó.

El nuevo estado `APROBADO` es terminal: a partir de él el reporte deja de ser
editable (regla en `Reporte.esta_editable()`). No se modifica ninguna fila
existente — todos los reportes actuales siguen en su estado actual y por tanto
siguen siendo editables.

Revision ID: d7f2b6c3a9e1
Revises: c4e8a1d5f7b2
Create Date: 2026-07-30 00:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd7f2b6c3a9e1'
down_revision: Union[str, Sequence[str], None] = 'c4e8a1d5f7b2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("reportes", sa.Column("observaciones", sa.Text(), nullable=True))
    op.add_column("reportes", sa.Column("aprobado_por", sa.String(), nullable=True))
    op.add_column(
        "reportes",
        sa.Column("aprobado_en", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("reportes", "aprobado_en")
    op.drop_column("reportes", "aprobado_por")
    op.drop_column("reportes", "observaciones")
