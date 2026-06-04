# Sistema de Análisis de Tomografías - API Backend

Este proyecto proporciona el backend para un sistema integral de ingesta, análisis y reporte de estudios de tomografía computarizada (CT Scans). Utiliza Inteligencia Artificial (YOLO) para la detección automatizada de hallazgos críticos (tumores, isquemias, etc.) e integra la generación asíncrona de reportes médicos en PDF.

## 🏗️ Arquitectura y Diseño

El sistema está construido bajo los principios de **Vertical-Slice Architecture** y **Domain-Driven Design (DDD)** utilizando el framework propietario **Hexcore**. 

El código se organiza estrictamente por características funcionales (slices), aislando las dependencias de persistencia (SQLAlchemy) e infraestructura externa de la lógica de negocio pura.

### Slices Funcionales (`src/features/`)

1. **`usuarios`**: Gestión de identidades, registro de personal médico y autenticación (JWT).
2. **`estudios`**: Ingesta de archivos (tomografías DICOM/PNG) asíncrona vía `aiofiles` y asociación robusta a un Value Object `Paciente` (incrustado como JSON transparente en la persistencia).
3. **`analizador`**: El núcleo de inferencia. Envuelve la ejecución de redes neuronales (YOLO/PyTorch) en adaptadores no-bloqueantes (`run_in_executor`) y define las reglas de severidad del dominio puro (`BAJO`, `MODERADO`, `CRITICO`). Emite el evento de dominio `AnalisisCompletadoEvent`.
4. **`reportes`**: Reacciona de manera desacoplada a los eventos del analizador mediante un ciclo independiente de `UnitOfWork`. Orquesta la generación asíncrona de PDFs usando `ReportLab`.

## 🛠️ Tecnologías Principales

- **Lenguaje**: Python 3.14 (gestionado vía `uv`)
- **Framework Web**: FastAPI (Asíncrono de alto rendimiento)
- **Estructura Base**: Hexcore 2.0+
- **Base de Datos**: 
  - SQLite asíncrono (`aiosqlite`) para desarrollo y tests.
  - Diseñado para transicionar sin fricción a PostgreSQL (`asyncpg`) en producción.
- **ORM**: SQLAlchemy 2.0 (Models, Mapped Columns, JSON field resolvers)
- **Inteligencia Artificial**: Ultralytics YOLOv8 + OpenCV

---

## 🚀 Instalación y Configuración

El proyecto utiliza [`uv`](https://github.com/astral-sh/uv) como gestor rápido de dependencias de Python.

1. **Clonar e iniciar entorno**:
   ```bash
   cd apps/api
   uv sync --python 3.14
   ```

2. **Carga de Modelos de IA** (Opcional para desarrollo básico):
   Asegúrate de colocar los pesos de la red en la ruta configurada (por defecto: `models/yolo_tomografia.pt`). En ausencia del modelo, la suite de pruebas utilizará *mocks*.

3. **Arrancar el servidor de desarrollo**:
   ```bash
   # Activa el entorno virtual
   source .venv/bin/activate
   
   # Arranca FastAPI con recarga en caliente
   fastapi dev main.py
   ```
   La documentación de la API (Swagger UI) estará disponible automáticamente en `http://127.0.0.1:8000/docs`.

---

## 🧪 Suite de Pruebas (Testing)

Se ha diseñado una suite rigurosa utilizando `pytest` en capas, garantizando el aislamiento con una base de datos SQLite temporal física por sesión.

### Niveles de Pruebas

- **Unitarias (`tests/unit/`)**: Verifican las reglas de dominio complejas y Value Objects. Se ejecutan en milisegundos sin interacción de Base de Datos ni I/O.
- **Integración (`tests/integration/`)**: Validan la persistencia híbrida (mapeos de objetos anidados hacia columnas JSON en SQLAlchemy) y la serialización.
- **End-to-End (`tests/e2e/`)**: Orquestan flujos completos HTTP (Registro → Subida de Estudio Multipart → Inferencia simulada → Estado de Reporte). Los puertos externos pesados de CPU (YOLO) o I/O (Storage/PDF) están *mockeados* por defecto (usando subclases nativas de `ProjectConfig` en lugar de `dependency_overrides`).

### Comandos de Testing

```bash
# Ejecutar toda la suite rápida (Mocking de IA activado)
uv run pytest -v tests/

# Ver cobertura de código
uv run pytest --cov=src tests/
```

### 🧠 Pruebas Reales de IA (Bajo Demanda)

Para no bloquear la integración continua, las pruebas pesadas contra el modelo PyTorch físico están aisladas. Para asegurar la consistencia real de los tensores contra el hardware local (o GPU de CI):

```bash
# Descargará/cargará YOLO y ejecutará tensores en un hilo secundario
uv run pytest -m ia -v
```

---

## 📝 Mantenimiento de la Arquitectura

**Directrices para nuevos desarrollos**:
1. **Nunca** importar Modelos ORM (`UserModel`, `AnalisisModel`) dentro de las carpetas `domain/` o `application/`. El acoplamiento debe ir exclusivamente desde `infrastructure/` hacia el centro.
2. Toda comunicación inter-módulos que implique "reacción" (ej. "cuando un estudio se analiza, crear un reporte") debe realizarse publicando y suscribiendo al `EventDispatcher` asíncrono configurado en `config.py` (`AsyncEventDispatcher`), con su propio `UnitOfWork`.
3. Para disparar eventos correctamente, el patrón recomendado es extraerlos en el *UseCase* justo antes de confirmar la transacción principal y publicarlos mediante `await self.uow.events_dispatcher.dispatch(event)`, ya que Hexcore `SqlAlchemyUnitOfWork` puede presentar comportamientos no deseados al combinar `merge` y `commit` con dominios anidados.
4. **Manejo de UUIDs e Identificadores**: Al mapear entidades que contengan identificadores foráneos de UUID y guarden en texto (SQLite/JSON), asegúrate de definir `fields_resolvers` y `fields_serializers` en el Repositorio de la capa `infrastructure`. Esto garantiza conversiones transparentes sin ensuciar la entidad con lógica de serialización. Utiliza el helper nativo `to_entity_from_model_or_document` provisto por `hexcore.infrastructure.repositories.utils` en reemplazo del antiguo `_to_entity`.
5. Cualquier componente CPU-bound (compresión de imágenes, inferencia IA, generación de PDFs densos) debe aislarse en infraestructura usando `loop.run_in_executor()` para no detener el *event loop* principal de FastAPI.