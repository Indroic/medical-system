import logging
import asyncio
import json

from google import genai
from google.genai import types

from src.features.analizador.domain.ports import ILLMAdapter
from src.features.analizador.domain.value_objects import Hallazgo

logger = logging.getLogger(__name__)

# Texto que se guarda como informe cuando la redacción automática falla. Es el
# único mensaje de error que llega al PDF, así que no nombra al proveedor ni al
# motor: sólo indica al médico que debe redactar el informe.
_MENSAJE_ERROR_INFORME = (
    "No fue posible redactar automáticamente el informe de este estudio. "
    "Los hallazgos detectados se listan en la tabla del reporte; el informe "
    "debe ser redactado y validado por el médico."
)


class GeminiAdapter(ILLMAdapter):
    def __init__(self, api_key: str, model_name: str, prompt_template: str):
        self.client = genai.Client(api_key=api_key) if api_key else genai.Client()
        self.model_name = model_name
        self.prompt_template = prompt_template

    def _generar_sincrono(self, prompt: str) -> str:
        contents = [
            types.Content(
                role="user",
                parts=[
                    types.Part.from_text(text=prompt),
                ],
            ),
        ]
        
        generate_content_config = types.GenerateContentConfig(
            thinking_config=types.ThinkingConfig(
                thinking_level="MEDIUM",
            ),
            response_mime_type="application/json",
            response_schema=genai.types.Schema(
                type=genai.types.Type.OBJECT,
                properties={
                    "response": genai.types.Schema(
                        type=genai.types.Type.STRING,
                    ),
                },
            ),
            temperature=0.2, # Baja temperatura para máxima precisión clínica
        )

        response = self.client.models.generate_content(
            model=self.model_name,
            contents=contents,
            config=generate_content_config,
        )
        
        try:
            data = json.loads(response.text)
            return data.get("response", _MENSAJE_ERROR_INFORME)
        except Exception as e:
            # El proveedor sólo se nombra en los logs: el texto que devolvemos
            # acaba en el informe que ve el médico.
            logger.error(f"Error parseando la respuesta del proveedor LLM: {e}. Raw text: {response.text}")
            return _MENSAJE_ERROR_INFORME

    async def generar_reporte_clinico(self, hallazgos: list[Hallazgo]) -> str:
        datos_crudos = []
        for h in hallazgos:
            datos_crudos.append(
                f"- Corte {h.image_index}: Etiqueta: {h.etiqueta}, "
                f"Confianza: {h.confianza*100:.1f}%, BBox: ({h.bbox.x_min},{h.bbox.y_min})->({h.bbox.x_max},{h.bbox.y_max})"
            )
        
        datos_str = "\n".join(datos_crudos) if datos_crudos else "Sin hallazgos detectados."
        prompt = self.prompt_template.replace("{datos_crudos}", datos_str)

        logger.info(f"Enviando solicitud al LLM ({self.model_name}) con {len(hallazgos)} hallazgos.")

        try:
            # Envolvemos la llamada síncrona en un hilo para no bloquear el Worker asíncrono
            return await asyncio.to_thread(self._generar_sincrono, prompt)
        except Exception as e:
            logger.error(f"Error comunicando con el proveedor LLM: {repr(e)}")
            return _MENSAJE_ERROR_INFORME
