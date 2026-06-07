from collections.abc import AsyncGenerator

from fastapi import Depends
from hexcore.infrastructure.uow import SqlAlchemyUnitOfWork

import src.shared.infrastructure.database as shared_db
from config import config

from ...application.use_cases.ejecutar_inferencia import EjecutarInferenciaUseCase
from ...domain.services import AnalizadorDomainService
from ..adapters.yolo_adapter import YoloInferenciaAdapter
from ..adapters.llm_adapter import OllamaAdapter
from ..repositories import AnalisisRepositoryImpl

# Singleton del adaptador YOLO — el modelo se carga una sola vez
_yolo_adapter = YoloInferenciaAdapter(model_path=config.yolo_model_path)

# Singleton del adaptador LLM
_llm_adapter = OllamaAdapter(
    ollama_url=config.ollama_url, 
    model_name=config.ollama_model_name,
    prompt_template=config.ollama_prompt_template
)


async def get_uow() -> AsyncGenerator[SqlAlchemyUnitOfWork]:
    async with shared_db.async_session_factory() as session:
        yield SqlAlchemyUnitOfWork(session=session)


async def get_ejecutar_uc(
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
) -> EjecutarInferenciaUseCase:
    repo = AnalisisRepositoryImpl(uow)
    service = AnalizadorDomainService(repo=repo, ia_adapter=_yolo_adapter, llm_adapter=_llm_adapter)
    return EjecutarInferenciaUseCase(service=service, uow=uow)
