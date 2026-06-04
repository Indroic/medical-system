import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

const CAPABILITIES = [
  {
    label: "Ingesta de estudios",
    description: "Carga imágenes DICOM o PNG de tomografías asociadas a pacientes registrados.",
  },
  {
    label: "Análisis IA",
    description: "YOLO v8 detecta hallazgos críticos (tumor, hemorragia, isquemia) con coordenadas de bounding box.",
  },
  {
    label: "Reporte PDF",
    description: "Generación automática de reportes clínicos con nivel de riesgo y detalle de hallazgos.",
  },
];

function HomeComponent() {
  return (
    <div className="min-h-svh bg-chalk flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        {/* Hero */}
        <div className="max-w-2xl w-full">
          <p className="text-[12px] font-medium text-concrete tracking-wide uppercase mb-6">
            Sistema de imagen médica · Uso interno
          </p>
          <h1
            className="text-[48px] font-semibold text-graphite leading-[1.1] tracking-[-0.05em] mb-5"
          >
            Medical Imaging
            <br />System
          </h1>
          <p className="text-[16px] text-concrete leading-relaxed mb-10 max-w-md">
            Plataforma de análisis de tomografías computarizadas con inteligencia artificial.
            Gestión de pacientes, estudios y reportes clínicos.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-[10px] bg-graphite px-5 py-2.5 text-[14px] font-medium text-chalk hover:bg-carbon transition-colors"
          >
            Iniciar sesión →
          </Link>
        </div>

        {/* Capabilities */}
        <div className="max-w-2xl w-full mt-20 grid grid-cols-3 gap-4">
          {CAPABILITIES.map((cap) => (
            <div
              key={cap.label}
              className="rounded-[14px] border border-hairline bg-chalk p-4"
            >
              <p className="text-[13px] font-semibold text-graphite mb-2">{cap.label}</p>
              <p className="text-[12px] text-concrete leading-relaxed">{cap.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-hairline px-6 py-4">
        <p className="text-[12px] text-concrete">Medical Imaging System · Uso exclusivamente interno</p>
      </footer>
    </div>
  );
}
