import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { useAuthStore } from "@/lib/auth-store";
import { env } from "@medical-system/env/web";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    const token = localStorage.getItem("ms_token");
    if (token) throw redirect({ to: "/dashboard" });
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      const { data, error } = await authClient.signIn.email({ email, password });
      if (error || !data) throw new Error(error?.message ?? "Error al iniciar sesión");

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
        rol: (data.user as any).role ?? "medico",
        is_active: true,
      });
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-svh bg-chalk flex items-center justify-center p-6">
      <div className="w-full max-w-90">
        <div className="mb-8">
          <p className="text-[12px] font-medium text-concrete uppercase tracking-wide mb-2">
            Medical Imaging System
          </p>
          <h1 className="text-[24px] font-semibold text-graphite tracking-tight">
            Acceder al sistema
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Correo electrónico">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@clinica.com"
              required
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Contraseña">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className={INPUT_CLASS}
            />
          </Field>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-[10px] bg-graphite py-2.5 text-[14px] font-medium text-chalk hover:bg-carbon disabled:opacity-50 transition-colors"
          >
            {loading ? "Accediendo…" : "Acceder"}
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
