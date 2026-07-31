import { createFileRoute, isRedirect, redirect, useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { Button, FieldError, Input, Label, TextField, toast } from "@heroui/react";
import { LogoMark } from "@/components/logo";
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
    defaultValues: { creationKey: "", nombre: "", email: "", password: "" },
    onSubmit: async ({ value }) => {
      try {
        // 1. Crear el administrador vía endpoint dedicado (crea el usuario ya con role="admin")
        const createRes = await fetch(`${env.VITE_SERVER_URL}/create-admin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creation_key: value.creationKey,
            name: value.nombre,
            email: value.email,
            password: value.password,
          }),
        });
        const createData = await createRes.json();
        if (!createRes.ok) throw new Error(createData?.error ?? "Error al crear el administrador");

        // 2. Iniciar sesión para obtener sesión activa
        const { data, error: signInError } = await authClient.signIn.email({
          email: value.email,
          password: value.password,
        });
        if (signInError || !data) throw new Error(signInError?.message ?? "Error al iniciar sesión");

        // 3. Obtener token JWT del backend
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
    <div className="min-h-svh bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-90">
        <div className="mb-8">
          <LogoMark size={40} className="mb-4" />
          <p className="text-[11px] font-semibold text-accent uppercase tracking-widest mb-3">
            Medical Imaging System · Configuración inicial
          </p>
          <h1 className="text-[22px] font-semibold text-foreground leading-tight tracking-[-0.3px]">
            Crear administrador
          </h1>
          <p className="mt-2 text-[13px] text-muted leading-relaxed">
            No existe ningún usuario. Crea la cuenta de administrador para continuar.
          </p>
        </div>

        <div className="rounded-cards bg-surface shadow-surface p-6">
          <form
            onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}
            className="flex flex-col gap-5"
          >
            <form.Field name="creationKey">
              {(field) => (
                <TextField
                  name={field.name}
                  type="password"
                  value={field.state.value}
                  onChange={field.handleChange}
                  isRequired
                  className="w-full"
                >
                  <Label className="text-[13px] text-muted mb-1.5">Clave de creación</Label>
                  <Input placeholder="Clave provista por el sistema" />
                  <FieldError />
                </TextField>
              )}
            </form.Field>

            <form.Field name="nombre">
              {(field) => (
                <TextField
                  name={field.name}
                  value={field.state.value}
                  onChange={field.handleChange}
                  isRequired
                  className="w-full"
                >
                  <Label className="text-[13px] text-muted mb-1.5">Nombre completo</Label>
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
                  <Label className="text-[13px] text-muted mb-1.5">Correo electrónico</Label>
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
                  <Label className="text-[13px] text-muted mb-1.5">Contraseña</Label>
                  <Input placeholder="Mínimo 8 caracteres" />
                  <FieldError>
                    {field.state.meta.isTouched && field.state.meta.errors[0]}
                  </FieldError>
                </TextField>
              )}
            </form.Field>

            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background">
              <span className="text-[12px] text-muted">Rol asignado:</span>
              <span className="text-[12px] font-medium text-accent">Administrador</span>
            </div>

            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(isSubmitting) => (
                <Button
                  type="submit"
                  isDisabled={isSubmitting}
                  className="mt-1 w-full rounded-full bg-accent text-accent-foreground font-medium text-[14px] py-2.5 disabled:opacity-50 transition-opacity"
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
