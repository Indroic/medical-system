# Screenshots

These are real screenshots of the running stack — no mockups. They were captured
from a full `docker compose up` with live YOLOv8 inference and a live LLM report.

| File | Screen | Shows |
| --- | --- | --- |
| `01-login.png` | Sign in | Branded sign-in card |
| `02-dashboard.png` | Dashboard | Study counters + recent studies |
| `03-pacientes.png` | Patients | Seeded patient records |
| `04-estudios.png` | Studies | Status badges across `PENDIENTE` and `COMPLETADO` |
| `06-analisis-viewer.png` | **Hero** — AI viewer | Real `Meningioma 80%` bounding box on slice 4/5, risk badge, finding counters |
| `07-informe.png` | Report body | LLM report scrolled to its conclusion — vertical extension across slices 3–4 and the mandatory validation note |
| `08-reportes.png` | Reports | Report list |
| `09-usuarios.png` | User management | Admin-only table with `admin` and `medico` roles |
| `10-dark-mode.png` | Dark theme | The same viewer in dark mode |
| `11-swagger.png` | OpenAPI docs | Auto-generated Swagger UI at `/docs` |

Not captured: `05-nuevo-estudio.png` (the upload dialog). Its file input only
mounts after the patient autocomplete resolves, which the capture script could
not drive reliably. Add it by hand if you want it.

## Demo data & attribution

The MRI slices are from the **[Roboflow 100 `brain-tumor-m2pbp`](https://universe.roboflow.com/roboflow-100/brain-tumor-m2pbp)**
dataset (v2), licensed **CC BY 4.0** — the same dataset `models/yolo_resonancia.pt`
was trained on, which is why detections fire on them. The images are false-colour
in the source dataset; they are not conventional greyscale MRI, and the viewer is
rendering them faithfully.

Patient names and document IDs are fictional (`DEMO-` prefixed). No real patient
data appears in any screenshot.

## Regenerating them

1. Bring the stack up and make sure the AI path is live:
   ```bash
   docker compose up -d
   ```
   Requires `apps/api/models/yolo_resonancia.pt` and a real `GEMINI_API_KEY`
   (pass it via a local compose override so it never lands in the repo).

2. Complete first-run setup at `/setup` (creation key `MEDICAL-ADMIN-USER-CREATION`).

3. Seed patients and studies, then run an analysis and wait for the study to
   reach `COMPLETADO`. Screenshots of a zero-state table tell a reviewer nothing.

4. Capture at 1440×900 with `deviceScaleFactor: 2`, devtools closed, OS window
   frame cropped out.

### Two gotchas if you script this

- **Hard-loading an in-app URL bounces to the role's landing route**
  (`/usuarios` for `admin`, `/dashboard` for `medico`). Navigate by clicking the
  sidebar instead of calling `page.goto('/pacientes')`, or you will screenshot
  the same screen every time.
- **Don't wait on `networkidle`.** The app holds an SSE connection open, so it
  never goes idle — use `domcontentloaded` plus an explicit wait.
