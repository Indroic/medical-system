import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import EstadoBadge from "@/components/estado-badge";
import PageHeader from "@/components/page-header";
import { useAuthStore } from "@/lib/auth-store";
import { ApiError, estudiosApi } from "@/lib/python-api";
import type { EstudioResponse } from "@/lib/python-api";

export const Route = createFileRoute("/_app/estudios/")({
  component: EstudiosList,
});

function EstudiosList() {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [estudios, setEstudios] = useState<EstudioResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    estudiosApi
      .listar(token)
      .then((res) => setEstudios(res.items))
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Error cargando estudios"))
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
            onClick={() => navigate({ to: "/estudios/nuevo", search: { pacienteId: undefined } })}
            className="rounded-[10px] bg-graphite px-4 py-2 text-[13px] font-medium text-chalk hover:bg-carbon transition-colors"
          >
            Nuevo estudio
          </button>
        }
      />

      <div className="mt-8">
        {loading ? (
          <div className="rounded-[14px] border border-hairline p-8 text-center text-[13px] text-concrete">
            Cargando…
          </div>
        ) : estudios.length === 0 ? (
          <div className="rounded-[14px] border border-hairline p-12 text-center">
            <p className="text-[14px] font-medium text-graphite mb-2">Sin estudios</p>
            <p className="text-[13px] text-concrete mb-6">
              Sube el primer estudio de resonancia magnética (MRI) para comenzar el análisis.
            </p>
            <button
              type="button"
              onClick={() => navigate({ to: "/estudios/nuevo", search: { pacienteId: undefined } })}
              className="rounded-[10px] bg-graphite px-5 py-2.5 text-[14px] font-medium text-chalk hover:bg-carbon transition-colors"
            >
              Nuevo estudio
            </button>
          </div>
        ) : (
          <div className="rounded-[14px] border border-hairline overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-hairline bg-mist">
                  <th className="px-4 py-3 text-left font-medium text-concrete">ID</th>
                  <th className="px-4 py-3 text-left font-medium text-concrete">Paciente ID</th>
                  <th className="px-4 py-3 text-left font-medium text-concrete">Estado</th>
                  <th className="px-4 py-3 text-left font-medium text-concrete">Tipo</th>
                  <th className="px-4 py-3 text-right font-medium text-concrete">Acción</th>
                </tr>
              </thead>
              <tbody>
                {estudios.map((e, i) => (
                  <tr
                    key={e.id}
                    className={i < estudios.length - 1 ? "border-b border-hairline" : ""}
                  >
                    <td className="px-4 py-3 font-mono text-concrete">{e.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3 font-mono text-concrete">{e.paciente_id.slice(0, 8)}…</td>
                    <td className="px-4 py-3">
                      <EstadoBadge estado={e.estado} />
                    </td>
                    <td className="px-4 py-3 text-concrete">{e.mime_type}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          navigate({ to: "/estudios/$estudioId", params: { estudioId: e.id } })
                        }
                        className="text-graphite font-medium hover:underline"
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
    </div>
  );
}
