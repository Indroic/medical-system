import aiofiles
import uuid
from pathlib import Path
from typing import override

from ..domain.services import IArchivoStorageAdapter

UPLOAD_DIR = Path("uploads/estudios")


class LocalStorageAdapter(IArchivoStorageAdapter):
    """Implementación local del puerto de storage. Swap por S3Adapter en producción."""

    def __init__(self, base_dir: Path = UPLOAD_DIR) -> None:
        self._base_dir = base_dir
        self._base_dir.mkdir(parents=True, exist_ok=True)

    @override
    async def guardar(self, nombre_archivo: str, contenido: bytes) -> str:
        sufijo = Path(nombre_archivo).suffix
        nombre_unico = f"{uuid.uuid4()}{sufijo}"
        ruta = self._base_dir / nombre_unico

        async with aiofiles.open(ruta, "wb") as f:
            await f.write(contenido)

        return str(ruta)
