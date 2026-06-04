import pytest
from uuid import uuid4

from src.features.analizador.domain.entities import AnalisisTomografia
from src.features.analizador.domain.value_objects import CoordenadasBBox, Hallazgo
from src.features.analizador.infrastructure.repositories import AnalisisRepositoryImpl
from src.features.estudios.domain.entities import Estudio
from src.features.estudios.infrastructure.repositories import EstudioRepositoryImpl


@pytest.mark.asyncio
async def test_estudio_repository_serialization(uow):
    """Prueba que el estudio se persiste correctamente usando paciente_id."""
    paciente_id = uuid4()
    estudio = Estudio(
        paciente_id=paciente_id,
        imagen_path="/tmp/test.png",
        mime_type="image/png",
        medico_id="med-123",
    )
    
    async with uow:
        repo = EstudioRepositoryImpl(uow)
        await repo.save(estudio)
        await uow.commit()
    
    # Recuperamos
    async with uow:
        repo = EstudioRepositoryImpl(uow)
        estudio_bd = await repo.get_by_id(estudio.id)
        
        assert estudio_bd is not None
        assert estudio_bd.paciente_id == paciente_id
        assert estudio_bd.imagen_path == "/tmp/test.png"


@pytest.mark.asyncio
async def test_analisis_repository_serialization(uow):
    """Prueba que la lista de Hallazgo (VOs) se serializa a JSON de forma híbrida."""
    analisis = AnalisisTomografia(
        estudio_id=uuid4(),
        imagen_path="/tmp/test.png"
    )
    hallazgos = [
        Hallazgo("tumor", 0.95, CoordenadasBBox(0,0,10,10)),
        Hallazgo("tejido_sano", 0.99, CoordenadasBBox(20,20,30,30))
    ]
    analisis.registrar_resultados(hallazgos)
    
    async with uow:
        repo = AnalisisRepositoryImpl(uow)
        await repo.save(analisis)
        await uow.commit()
        
    # Recuperamos
    async with uow:
        repo = AnalisisRepositoryImpl(uow)
        analisis_bd = await repo.get_by_id(analisis.id)
        
        assert analisis_bd is not None
        assert analisis_bd.nivel_riesgo == "CRITICO"
        assert len(analisis_bd.hallazgos) == 2
        
        h1 = analisis_bd.hallazgos[0]
        assert h1.etiqueta == "tumor"
        assert h1.bbox.x_max == 10.0
