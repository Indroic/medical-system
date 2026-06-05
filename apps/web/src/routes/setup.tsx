import { createFileRoute, isRedirect, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button, FieldError, Input, Label, TextField } from "@heroui/react";

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
  const [error, setError] = useState<string | null>(null);

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

      const tokenRes = await fetch(`${env.VITE_SERVER_URL}/api/auth/token`, {
        headers: { Authorization: `Bearer ${data.token}` },
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
      setError(err instanceof Error ? err.message : "Error al crear el administrador");
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
            Medical Imaging System · Configuración inicial
          </p>
          <h1 className="text-[22px] font-normal text-snow leading-tight tracking-[-0.3px]">
            Crear administrador
          </h1>
          <p className="mt-2 text-[13px] text-silver leading-relaxed">
            No existe ningún usuario. Crea la cuenta de administrador para continuar.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-charcoal bg-ash p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <TextField
              name="nombre"
              type="text"
              value={nombre}
              onChange={setNombre}
              isRequired
              className="w-full"
            >
              <Label className="text-[13px] text-silver mb-1.5">Nombre completo</Label>
              <Input placeholder="Dr. Juan García" />
              <FieldError />
            </TextField>

            <TextField
              name="email"
              type="email"
              value={email}
              onChange={setEmail}
              isRequired
              className="w-full"
            >
              <Label className="text-[13px] text-silver mb-1.5">Correo electrónico</Label>
              <Input placeholder="admin@clinica.com" />
              <FieldError />
            </TextField>

            <TextField
              name="password"
              type="password"
              value={password}
              onChange={setPassword}
              isRequired
              minLength={8}
              className="w-full"
            >
              <Label className="text-[13px] text-silver mb-1.5">Contraseña</Label>
              <Input placeholder="Mínimo 8 caracteres" />
              <FieldError />
            </TextField>

            {/* Role indicator */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-charcoal bg-obsidian">
              <span className="text-[12px] text-smoke">Rol asignado:</span>
              <span className="text-[12px] font-medium text-green">Administrador</span>
            </div>

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
              {loading ? "Creando cuenta…" : "Crear administrador"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
