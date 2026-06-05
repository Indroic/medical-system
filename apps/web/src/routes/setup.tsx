import { createFileRoute, isRedirect, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { useAuthStore } from "@/lib/auth-store";
import { env } from "@medical-system/env/web";

export const Route = createFileRoute("/setup")({
  beforeLoad: async () => {
    const token = localStorage.getItem("ms_token");
    if (token) throw redirect({ to: "/dashboard" });

    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/check-setup`);
      const { setup_required } = await res.json();
      if (!setup_required) throw redirect({ to: "/login" });
    } catch (err) {
      if (isRedirect(err)) throw err;
    }
  },
  component: SetupPage,
});

function SetupPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !email || !password) return;
    setLoading(true);
    try {
      const { error: signUpError } = await authClient.signUp.email({
        name: nombre,
        email,
        password,
        role: "admin",
      } as any);
      if (signUpError) throw new Error(signUpError.message ?? "Error al crear el administrador");

      const { data, error: signInError } = await authClient.signIn.email({ email, password });
      if (signInError || !data) throw new Error(signInError?.message ?? "Error al iniciar sesión");

      // Intercambiar el token opaco de sesión por un JWT firmado con JWKS
      const tokenRes = await fetch(`${env.VITE_SERVER_URL}/api/auth/token`, {
        headers: { Authorization: `Bearer ${data.session.token}` },
      });
      if (!tokenRes.ok) throw new Error("No se pudo obtener el token JWT");
      const { token: jwtToken } = await tokenRes.json();

      login(jwtToken, {
        id: data.user.id,
        email: data.user.email,
        nombre: data.user.name,
        rol: "admin",
        is_active: true,
      });
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear el administrador");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-svh bg-chalk flex items-center justify-center p-6">
      <div className="w-full max-w-90">
        <div className="mb-8">
          <p className="text-[12px] font-medium text-concrete uppercase tracking-wide mb-2">
            Medical Imaging System · Configuración inicial
          </p>
          <h1 className="text-[24px] font-semibold text-graphite tracking-tight">
            Crear administrador
          </h1>
          <p className="mt-2 text-[13px] text-concrete leading-relaxed">
            No existe ningún usuario en el sistema. Crea la cuenta de administrador para continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Nombre completo">
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Dr. Juan García"
              required
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Correo electrónico">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@clinica.com"
              required
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Contraseña">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
              minLength={8}
              className={INPUT_CLASS}
            />
          </Field>

          <div className="rounded-[10px] border border-hairline bg-chalk px-3 py-2.5 flex items-center gap-2">
            <span className="text-[12px] text-concrete">Rol asignado:</span>
            <span className="text-[12px] font-medium text-graphite">Administrador</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-[10px] bg-graphite py-2.5 text-[14px] font-medium text-chalk hover:bg-carbon disabled:opacity-50 transition-colors"
          >
            {loading ? "Creando cuenta…" : "Crear administrador"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-graphite">{label}</label>
      {children}
    </div>
  );
}

const INPUT_CLASS =
  "w-full rounded-[10px] border border-hairline bg-chalk px-3 py-2.5 font-mono text-[14px] text-graphite placeholder:text-concrete focus:outline-none focus:border-graphite transition-colors";
