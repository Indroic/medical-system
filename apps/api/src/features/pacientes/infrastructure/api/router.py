from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException

from src.features.usuarios.infrastructure.api.dependencies import get_current_user

from ...application.dtos import CrearPacienteCommand, PacienteResponse
from ...application.use_cases.crear_paciente import CrearPacienteUseCase
from ...application.use_cases.obtener_paciente import ObtenerPacienteUseCase
from ...domain.exceptions import DocumentoDuplicadoException, PacienteNotFoundException
from .dependencies import get_crear_paciente_uc, get_obtener_paciente_uc

router = APIRouter(prefix="/pacientes", tags=["Pacientes"])


@router.post("/", response_model=PacienteResponse, status_code=201)
async def crear_paciente(
    command: CrearPacienteCommand,
    uc: CrearPacienteUseCase = Depends(get_crear_paciente_uc),
    current_user=Depends(get_current_user),
):
    try:
        return await uc.execute(command)
    except DocumentoDuplicadoException as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.get("/{paciente_id}", response_model=PacienteResponse)
async def obtener_paciente(
    paciente_id: UUID,
    uc: ObtenerPacienteUseCase = Depends(get_obtener_paciente_uc),
    current_user=Depends(get_current_user),
):
    try:
        return await uc.execute(paciente_id)
    except PacienteNotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))
