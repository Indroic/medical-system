"""Integridad referencial: FKs entre pacientes, estudios, analisis y reportes

Hasta esta revisión ninguna tabla del slice tenía ForeignKey declarada: los
campos `paciente_id`, `estudio_id` y `analisis_id` eran columnas sueltas (unas
UUID, otras String con UUIDs serializados) con sólo un índice. Eso permitía
filas huérfanas y JOINs inconsistentes.

Esta migración:

1. Convierte a `uuid` nativo las columnas que guardaban UUIDs como texto
   (`analisis.estudio_id`, `reportes.estudio_id`, `reportes.analisis_id`) para
   que puedan referenciar `estudios.id` / `analisis.id`, que ya son `uuid`.
2. Declara las ForeignKey correspondientes.
3. Declara la FK de `estudios.medico_id` contra la tabla `user` de Better-Auth
   (misma base de datos, gestionada por Drizzle en apps/server) — NO contra
   `usuarios`: lo que se guarda ahí es el claim `sub` del JWT de Better-Auth, un
   CUID de texto que no existe en `usuarios`. Ver el docstring de UserModel.

Seguridad de los datos: no se borra ni se reescribe ninguna fila. Antes de
crear cada FK se cuentan las filas huérfanas; si hubiera alguna, la restricción
se crea como NOT VALID (Postgres la aplica a las escrituras futuras sin
rechazar el histórico) y se avisa por stderr en lugar de abortar el deploy.

Revision ID: c4e8a1d5f7b2
Revises: b1f3c9a7d2e4
Create Date: 2026-07-30 00:00:00.000000

"""
import sys
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c4e8a1d5f7b2'
down_revision: Union[str, Sequence[str], None] = 'b1f3c9a7d2e4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _log(mensaje: str) -> None:
    print(f"[c4e8a1d5f7b2] {mensaje}", file=sys.stderr)


def _es_postgres() -> bool:
    return op.get_bind().dialect.name == "postgresql"


def _tabla_existe(nombre: str) -> bool:
    return nombre in sa.inspect(op.get_bind()).get_table_names()


def _contar_huerfanos(
    tabla_origen: str, col_origen: str, tabla_destino: str, col_destino: str
) -> int:
    """Filas de `tabla_origen` cuyo valor no existe en `tabla_destino`."""
    conn = op.get_bind()
    sql = sa.text(
        f'SELECT count(*) FROM "{tabla_origen}" AS o '
        f'LEFT JOIN "{tabla_destino}" AS d ON d."{col_destino}" = o."{col_origen}" '
        f'WHERE o."{col_origen}" IS NOT NULL AND d."{col_destino}" IS NULL'
    )
    return conn.execute(sql).scalar_one() or 0


def _crear_fk_segura(
    nombre: str,
    tabla_origen: str,
    col_origen: str,
    tabla_destino: str,
    col_destino: str,
    ondelete: str,
) -> None:
    """Crea la FK validada si no hay huérfanos; si los hay, la crea NOT VALID."""
    huerfanos = _contar_huerfanos(tabla_origen, col_origen, tabla_destino, col_destino)

    if huerfanos == 0:
        op.create_foreign_key(
            nombre,
            tabla_origen,
            tabla_destino,
            [col_origen],
            [col_destino],
            ondelete=ondelete,
        )
        _log(f"OK  {nombre}: {tabla_origen}.{col_origen} -> {tabla_destino}.{col_destino}")
        return

    _log(
        f"AVISO {nombre}: {huerfanos} fila(s) huérfana(s) en "
        f"{tabla_origen}.{col_origen}. La FK se crea como NOT VALID para no "
        f"tocar datos existentes; se aplicará a las escrituras futuras. "
        f"Revisar y luego: ALTER TABLE \"{tabla_origen}\" VALIDATE CONSTRAINT \"{nombre}\";"
    )
    op.execute(
        sa.text(
            f'ALTER TABLE "{tabla_origen}" ADD CONSTRAINT "{nombre}" '
            f'FOREIGN KEY ("{col_origen}") REFERENCES "{tabla_destino}" ("{col_destino}") '
            f'ON DELETE {ondelete} NOT VALID'
        )
    )


def upgrade() -> None:
    """Upgrade schema."""
    if not _es_postgres():
        # Las conversiones de tipo y los ADD CONSTRAINT usados aquí son
        # específicos de Postgres. En dev sobre SQLite el esquema se crea con
        # BaseModel.metadata.create_all (ver main.py), que ya incluye las FKs.
        _log("Dialecto no-Postgres detectado: migración omitida.")
        return

    # ── 1. Alinear tipos: String con UUIDs serializados -> uuid nativo ───────
    op.alter_column(
        "analisis",
        "estudio_id",
        existing_type=sa.String(),
        type_=sa.UUID(),
        existing_nullable=False,
        postgresql_using="estudio_id::uuid",
    )
    op.alter_column(
        "reportes",
        "estudio_id",
        existing_type=sa.String(),
        type_=sa.UUID(),
        existing_nullable=False,
        postgresql_using="estudio_id::uuid",
    )
    op.alter_column(
        "reportes",
        "analisis_id",
        existing_type=sa.String(),
        type_=sa.UUID(),
        existing_nullable=False,
        postgresql_using="analisis_id::uuid",
    )

    # `reportes.analisis_id` no tenía índice y ahora es clave foránea.
    op.create_index(
        op.f("ix_reportes_analisis_id"), "reportes", ["analisis_id"], unique=False
    )

    # ── 2. ForeignKeys entre las tablas propias de la API ───────────────────
    # RESTRICT en paciente: un expediente con estudios no debe poder borrarse.
    _crear_fk_segura(
        "fk_estudios_paciente_id", "estudios", "paciente_id", "pacientes", "id", "RESTRICT"
    )
    # CASCADE hacia abajo: el análisis y los reportes son derivados del estudio.
    _crear_fk_segura(
        "fk_analisis_estudio_id", "analisis", "estudio_id", "estudios", "id", "CASCADE"
    )
    _crear_fk_segura(
        "fk_reportes_estudio_id", "reportes", "estudio_id", "estudios", "id", "CASCADE"
    )
    _crear_fk_segura(
        "fk_reportes_analisis_id", "reportes", "analisis_id", "analisis", "id", "CASCADE"
    )

    # ── 3. FK del médico contra la tabla `user` de Better-Auth ──────────────
    # `user` es propiedad de Drizzle (apps/server) y vive en el mismo Postgres.
    # Si el migrador del server aún no se ha ejecutado, la tabla no existe: se
    # omite con aviso en vez de tumbar el arranque de la API.
    if _tabla_existe("user"):
        _crear_fk_segura(
            "fk_estudios_medico_id", "estudios", "medico_id", "user", "id", "RESTRICT"
        )
    else:
        _log(
            'AVISO: la tabla "user" (Better-Auth/Drizzle) no existe todavía; se '
            "omite fk_estudios_medico_id. Ejecutar el migrador del server y "
            "volver a aplicar esta revisión para crearla."
        )


def downgrade() -> None:
    """Downgrade schema."""
    if not _es_postgres():
        return

    for nombre, tabla in (
        ("fk_estudios_medico_id", "estudios"),
        ("fk_reportes_analisis_id", "reportes"),
        ("fk_reportes_estudio_id", "reportes"),
        ("fk_analisis_estudio_id", "analisis"),
        ("fk_estudios_paciente_id", "estudios"),
    ):
        op.execute(sa.text(f'ALTER TABLE "{tabla}" DROP CONSTRAINT IF EXISTS "{nombre}"'))

    op.drop_index(op.f("ix_reportes_analisis_id"), table_name="reportes")

    op.alter_column(
        "reportes",
        "analisis_id",
        existing_type=sa.UUID(),
        type_=sa.String(),
        existing_nullable=False,
        postgresql_using="analisis_id::text",
    )
    op.alter_column(
        "reportes",
        "estudio_id",
        existing_type=sa.UUID(),
        type_=sa.String(),
        existing_nullable=False,
        postgresql_using="estudio_id::text",
    )
    op.alter_column(
        "analisis",
        "estudio_id",
        existing_type=sa.UUID(),
        type_=sa.String(),
        existing_nullable=False,
        postgresql_using="estudio_id::text",
    )
