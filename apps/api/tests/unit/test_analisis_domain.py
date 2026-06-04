import pytest
from uuid import uuid4

from src.features.analizador.domain.entities import AnalisisResonancia
from src.features.analizador.domain.value_objects import CoordenadasBBox, Hallazgo


def test_evaluar_severidad_sin_hallazgos():
    analisis = AnalisisResonancia(estudio_id=uuid4(), imagen_path="/dummy/path")
    analisis.registrar_resultados([])
    
    assert analisis.nivel_riesgo == "BAJO"
    assert analisis.estado == "COMPLETADO"


def test_evaluar_severidad_con_hallazgo_critico_alta_confianza():
    analisis = AnalisisResonancia(estudio_id=uuid4(), imagen_path="/dummy/path")
    hallazgo = Hallazgo(
        etiqueta="tumor",
        confianza=0.90,
        bbox=CoordenadasBBox(0.0, 0.0, 10.0, 10.0)
    )
    analisis.registrar_resultados([hallazgo])
    
    assert analisis.nivel_riesgo == "CRITICO"
    
    # Verificar evento
    eventos = analisis.pull_domain_events()
    assert len(eventos) == 1
    assert eventos[0].nivel_riesgo == "CRITICO"
    assert eventos[0].total_hallazgos == 1


def test_evaluar_severidad_con_multiples_hallazgos_moderados():
    analisis = AnalisisResonancia(estudio_id=uuid4(), imagen_path="/dummy/path")
    hallazgos = [
        Hallazgo(etiqueta="calcificacion", confianza=0.60, bbox=CoordenadasBBox(0,0,1,1)),
        Hallazgo(etiqueta="cicatriz", confianza=0.60, bbox=CoordenadasBBox(0,0,1,1)),
        Hallazgo(etiqueta="artefacto", confianza=0.60, bbox=CoordenadasBBox(0,0,1,1)),
    ]
    analisis.registrar_resultados(hallazgos)
    
    # 3 o más hallazgos desencadenan MODERADO, a menos que sean críticos con >0.85
    assert analisis.nivel_riesgo == "MODERADO"
