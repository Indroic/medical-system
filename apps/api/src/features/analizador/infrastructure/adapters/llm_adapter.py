import logging

import httpx

from src.features.analizador.domain.ports import ILLMAdapter
from src.features.analizador.domain.value_objects import Hallazgo

logger = logging.getLogger(__name__)

class OllamaAdapter(ILLMAdapter):
    def __init__(self, ollama_url: str, model_name: str, prompt_template: str):
        self.ollama_url = ollama_url
        self.model_name = model_name
        self.prompt_template = prompt_template

    async def generar_reporte_clinico(self, hallazgos: list[Hallazgo]) -> str:
        """
        Toma los hallazgos crudos y construye un Prompt Estructurado para el LLM.
        """
        datos_crudos = []
        for h in hallazgos:
            datos_crudos.append(
                f"- Corte {h.image_index}: Etiqueta: {h.etiqueta}, "
                f"Confianza: {h.confianza*100:.1f}%, BBox: ({h.bbox.x_min},{h.bbox.y_min})->({h.bbox.x_max},{h.bbox.y_max})"
            )
        
        datos_str = "\n".join(datos_crudos) if datos_crudos else "Sin hallazgos detectados."
        prompt = self.prompt_template.replace("{datos_crudos}", datos_str)

        logger.info(f"Enviando solicitud a Ollama ({self.model_name}) con {len(hallazgos)} hallazgos.")

        # 2. Llamada asíncrona a la API de Ollama
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.ollama_url}/api/generate",
                    json={
                        "model": self.model_name,
                        "prompt": prompt,
                        "stream": False,
                        "options": {
                            "temperature": 0.2  # Baja temperatura para máxima precisión clínica
                        }
                    }
                )
                response.raise_for_status()
                data = response.json()
                reporte = data.get("response", "El modelo no generó una respuesta.")
                return reporte
        except httpx.HTTPStatusError as e:
            error_body = e.response.text
            if e.response.status_code == 404 and "not found" in error_body.lower():
                logger.info(f"Modelo {self.model_name} no encontrado en Ollama. Iniciando descarga automática... (Esto puede tardar varios minutos)")
                try:
                    async with httpx.AsyncClient(timeout=600.0) as client_pull:
                        pull_resp = await client_pull.post(
                            f"{self.ollama_url}/api/pull",
                            json={"name": self.model_name, "stream": False}
                        )
                        pull_resp.raise_for_status()
                    logger.info(f"Modelo {self.model_name} descargado exitosamente. Reintentando inferencia...")
                    # Reintento recursivo (solo 1 vez en la práctica ya que ahora el modelo existe)
                    return await self.generar_reporte_clinico(hallazgos)
                except Exception as ex_pull:
                    logger.error(f"Error al intentar descargar el modelo automáticamente: {ex_pull}")
                    return f"Hubo un error al generar el reporte: El modelo {self.model_name} no está instalado y falló su descarga automática."

            logger.error(f"Error HTTP de Ollama ({e.response.status_code}): {error_body}")
            return f"Hubo un error al generar el reporte avanzado (HTTP {e.response.status_code}): {error_body}"
        except Exception as e:
            logger.error(f"Error comunicando con Ollama: {e}")
            return f"Hubo un error al generar el reporte avanzado usando IA: {e}"
