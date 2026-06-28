import { createFileRoute, isRedirect, redirect, useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { Button, FieldError, Input, Label, TextField, toast } from "@heroui/react";

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

  const form = useForm({
    defaultValues: { nombre: "", email: "", password: "" },
    onSubmit: async ({ value }) => {
      try {
        // 1. Crear usuario (sin role — Better Auth no lo permite en signUp público)
        const { data: signUpData, error: signUpError } = await authClient.signUp.email({
          name: value.nombre,
          email: value.email,
          password: value.password,
        });
        if (signUpError || !signUpData) throw new Error(signUpError?.message ?? "Error al crear el administrador");

        // 2. Iniciar sesión para obtener sesión activa
        const { data, error: signInError } = await authClient.signIn.email({
          email: value.email,
          password: value.password,
        });
        if (signInError || !data) throw new Error(signInError?.message ?? "Error al iniciar sesión");

        // 3. Asignar rol admin usando la sesión activa (adminClient)
        const { error: roleError } = await authClient.admin.setRole({
          userId: signUpData.user.id,
          role: "admin",
        });
        if (roleError) throw new Error(roleError.message ?? "Error al asignar rol de administrador");

        // 4. Obtener token JWT del backend
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
        toast.danger(err instanceof Error ? err.message : "Error al crear el administrador");
      }
    },
  });

  return (
    <div className="min-h-svh bg-obsidian flex items-center justify-center p-6">
      <div className="w-full max-w-90">
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

        <div className="rounded-2xl border border-charcoal bg-ash p-6">
          <form
            onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}
            className="flex flex-col gap-5"
          >
            <form.Field name="nombre">
              {(field) => (
                <TextField
                  name={field.name}
                  value={field.state.value}
                  onChange={field.handleChange}
                  isRequired
                  className="w-full"
                >
                  <Label className="text-[13px] text-silver mb-1.5">Nombre completo</Label>
                  <Input placeholder="Dr. Juan García" />
                  <FieldError />
                </TextField>
              )}
            </form.Field>

            <form.Field name="email">
              {(field) => (
                <TextField
                  name={field.name}
                  type="email"
                  value={field.state.value}
                  onChange={field.handleChange}
                  isRequired
                  className="w-full"
                >
                  <Label className="text-[13px] text-silver mb-1.5">Correo electrónico</Label>
                  <Input placeholder="admin@clinica.com" />
                  <FieldError />
                </TextField>
              )}
            </form.Field>

            <form.Field
              name="password"
              validators={{ onChange: ({ value }) => value.length > 0 && value.length < 8 ? "Mínimo 8 caracteres" : undefined }}
            >
              {(field) => (
                <TextField
                  name={field.name}
                  type="password"
                  value={field.state.value}
                  onChange={field.handleChange}
                  isRequired
                  isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                  className="w-full"
                >
                  <Label className="text-[13px] text-silver mb-1.5">Contraseña</Label>
                  <Input placeholder="Mínimo 8 caracteres" />
                  <FieldError>
                    {field.state.meta.isTouched && field.state.meta.errors[0]}
                  </FieldError>
                </TextField>
              )}
            </form.Field>

            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-charcoal bg-obsidian">
              <span className="text-[12px] text-smoke">Rol asignado:</span>
              <span className="text-[12px] font-medium text-green">Administrador</span>
            </div>

            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(isSubmitting) => (
                <Button
                  type="submit"
                  isDisabled={isSubmitting}
                  className="mt-1 w-full rounded-full bg-green text-obsidian font-medium text-[14px] py-2.5 disabled:opacity-50 transition-opacity"
                >
                  {isSubmitting ? "Creando cuenta…" : "Crear administrador"}
                </Button>
              )}
            </form.Subscribe>
          </form>
        </div>
      </div>
    </div>
  );
}
