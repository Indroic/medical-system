import { toast } from "@heroui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import EstadoBadge from "@/components/estado-badge";
import PageHeader from "@/components/page-header";
import { useAuthStore } from "@/lib/auth-store";
import { ApiError, estudiosApi, pacientesApi } from "@/lib/python-api";
import type { EstudioResponse, PacienteResponse } from "@/lib/python-api";
import { useOverlayState } from "@heroui/react";
import NuevoEstudioModal from "@/components/nuevo-estudio-modal";

export const Route = createFileRoute("/_app/estudios/")({
  component: EstudiosList,
});

function EstudiosList() {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [estudios, setEstudios] = useState<EstudioResponse[]>([]);
  const [pacientesMap, setPacientesMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const state = useOverlayState({ defaultOpen: false });

  useEffect(() => {
    if (!token) return;
    Promise.all([
      estudiosApi.listar(token),
      pacientesApi.listar(token)
    ])
      .then(([resEstudios, resPacientes]) => {
        setEstudios(resEstudios.items);
        const map: Record<string, string> = {};
        resPacientes.items.forEach((p) => {
          map[p.id] = `${p.nombre} ${p.apellido}`;
        });
        setPacientesMap(map);
      })
      .catch((err) => toast.danger("Error cargando estudios"))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="p-8">
      <PageHeader
        title="Estudios"
        subtitle={`${estudios.length} estudios en total`}
        action={
          <button
            type="button"
            onClick={state.open}
            className="rounded-full bg-green px-4 py-2 text-[13px] font-medium text-obsidian hover:bg-green-deep transition-colors"
          >
            Nuevo estudio
          </button>
        }
      />

      <div className="mt-8">
        {loading ? (
          <div className="rounded-2xl border border-charcoal p-8 text-center text-[13px] text-smoke">
            Cargando…
          </div>
        ) : estudios.length === 0 ? (
          <div className="rounded-2xl border border-charcoal p-12 text-center">
            <p className="text-[14px] text-snow mb-2">Sin estudios</p>
            <p className="text-[13px] text-smoke mb-6">
              Sube el primer estudio de resonancia magnética (MRI) para comenzar el análisis.
            </p>
            <button
              type="button"
              onClick={state.open}
              className="rounded-full bg-green px-5 py-2 text-[14px] font-medium text-obsidian hover:bg-green-deep transition-colors"
            >
              Nuevo estudio
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-charcoal overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-charcoal bg-ash">
                  <th className="px-4 py-3 text-left text-smoke font-normal">ID</th>
                  <th className="px-4 py-3 text-left text-smoke font-normal">Paciente</th>
                  <th className="px-4 py-3 text-left text-smoke font-normal">Estado</th>
                  <th className="px-4 py-3 text-left text-smoke font-normal">Tipo</th>
                  <th className="px-4 py-3 text-right text-smoke font-normal">Acción</th>
                </tr>
              </thead>
              <tbody>
                {estudios.map((e, i) => (
                  <tr key={e.id} className={i < estudios.length - 1 ? "border-b border-charcoal" : ""}>
                    <td className="px-4 py-3 font-mono text-smoke">{e.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3 text-snow">{pacientesMap[e.paciente_id] || "Desconocido"}</td>
                    <td className="px-4 py-3"><EstadoBadge estado={e.estado} /></td>
                    <td className="px-4 py-3 text-smoke">{e.mime_type}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => navigate({ to: "/estudios/$estudioId", params: { estudioId: e.id } })}
                        className="text-green font-medium hover:underline"
                      >
                        Ver →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <NuevoEstudioModal state={state} />
    </div>
  );
}
