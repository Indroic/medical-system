from ...domain.exceptions import TipoArchivoNoPermitidoException
from ...domain.services import EstudioService, IArchivoStorageAdapter
from ..dtos import SubirImagenResponse


class SubirImagenEstudioUseCase:
    def __init__(self, storage: IArchivoStorageAdapter) -> None:
        self._storage = storage

    async def execute(
        self,
        nombre_archivo: str,
        contenido: bytes,
        mime_type: str,
    ) -> SubirImagenResponse:
        if mime_type not in EstudioService.TIPOS_PERMITIDOS:
            raise TipoArchivoNoPermitidoException(mime_type)

        path = await self._storage.guardar(nombre_archivo, contenido)
        return SubirImagenResponse(path=path, mime_type=mime_type)
