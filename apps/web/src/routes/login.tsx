import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { Button, FieldError, Input, Label, TextField, toast } from "@heroui/react";

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

  const form = useForm({
    defaultValues: { email: "", password: "" },
    onSubmit: async ({ value }) => {
      try {
        const { data, error } = await authClient.signIn.email({
          email: value.email,
          password: value.password,
        });
        if (error || !data) throw new Error(error?.message ?? "Credenciales inválidas");

        login("cookie-based", {
          id: data.user.id,
          email: data.user.email,
          nombre: data.user.name,
          rol: (data.user as any).role ?? "medico",
          is_active: true,
        });
        navigate({ to: "/dashboard" });
      } catch (err) {
        toast.danger(err instanceof Error ? err.message : "Error al iniciar sesión");
      }
    },
  });

  return (
    <div className="min-h-svh bg-obsidian flex items-center justify-center p-6">
      <div className="w-full max-w-90">
        <div className="mb-8">
          <p className="text-[11px] font-medium text-smoke uppercase tracking-widest mb-3">
            Medical Imaging System
          </p>
          <h1 className="text-[22px] font-normal text-snow leading-tight tracking-[-0.3px]">
            Acceder al sistema
          </h1>
        </div>

        <div className="rounded-2xl border border-charcoal bg-ash p-6">
          <form
            onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}
            className="flex flex-col gap-5"
          >
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
                  <Input placeholder="doctor@clinica.com" />
                  <FieldError />
                </TextField>
              )}
            </form.Field>

            <form.Field name="password">
              {(field) => (
                <TextField
                  name={field.name}
                  type="password"
                  value={field.state.value}
                  onChange={field.handleChange}
                  isRequired
                  className="w-full"
                >
                  <Label className="text-[13px] text-silver mb-1.5">Contraseña</Label>
                  <Input placeholder="••••••••" />
                  <FieldError />
                </TextField>
              )}
            </form.Field>

            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(isSubmitting) => (
                <Button
                  type="submit"
                  isDisabled={isSubmitting}
                  className="mt-1 w-full rounded-full bg-green text-obsidian font-medium text-[14px] py-2.5 disabled:opacity-50 transition-opacity"
                >
                  {isSubmitting ? "Accediendo…" : "Acceder"}
                </Button>
              )}
            </form.Subscribe>
          </form>
        </div>
      </div>
    </div>
  );
}
