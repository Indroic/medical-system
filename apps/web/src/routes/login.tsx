import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button, FieldError, Input, Label, TextField } from "@heroui/react";

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
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError(null);
    setLoading(true);
    try {
      const { data, error } = await authClient.signIn.email({ email, password });
      if (error || !data) throw new Error(error?.message ?? "Credenciales inválidas");

      const tokenRes = await fetch(`${env.VITE_SERVER_URL}/api/auth/token`, {
        headers: { Authorization: `Bearer ${data.token}` },
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
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-svh bg-obsidian flex items-center justify-center p-6">
      <div className="w-full max-w-90">
        {/* Header */}
        <div className="mb-8">
          <p className="text-[11px] font-medium text-smoke uppercase tracking-widest mb-3">
            Medical Imaging System
          </p>
          <h1 className="text-[22px] font-normal text-snow leading-tight tracking-[-0.3px]">
            Acceder al sistema
          </h1>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-charcoal bg-ash p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <TextField
              name="email"
              type="email"
              value={email}
              onChange={setEmail}
              isRequired
              className="w-full"
            >
              <Label className="text-[13px] text-silver mb-1.5">Correo electrónico</Label>
              <Input placeholder="doctor@clinica.com" />
              <FieldError />
            </TextField>

            <TextField
              name="password"
              type="password"
              value={password}
              onChange={setPassword}
              isRequired
              className="w-full"
            >
              <Label className="text-[13px] text-silver mb-1.5">Contraseña</Label>
              <Input placeholder="••••••••" />
              <FieldError />
            </TextField>

            {error && (
              <p className="text-[13px] text-smoke border border-charcoal rounded-lg px-3 py-2 bg-ash">
                {error}
              </p>
            )}

            <Button
              type="submit"
              isDisabled={loading}
              className="mt-1 w-full rounded-full bg-green text-obsidian font-medium text-[14px] py-2.5 transition-opacity disabled:opacity-50"
            >
              {loading ? "Accediendo…" : "Acceder"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
