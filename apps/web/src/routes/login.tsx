import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { Button, FieldError, Input, Label, TextField, toast } from "@heroui/react";
import { Scan, ShieldCheck } from "lucide-react";

import { ModeToggle } from "@/components/mode-toggle";
import { authClient } from "@/lib/auth-client";
import { destinoPostLogin, esRedirectInterno } from "@/lib/auth-routing";
import { useAuthStore } from "@/lib/auth-store";

interface LoginSearch {
  /** Ruta interna a la que volver tras autenticarse (la añade `_app`). */
  redirect?: string;
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  beforeLoad: ({ search }) => {
    const token = localStorage.getItem("ms_token");
    if (!token) return;

    // Ya hay sesión: respetar el returnTo si es interno; si no, ir al landing
    // que corresponda al rol guardado.
    let rol: string | undefined;
    try {
      rol = JSON.parse(localStorage.getItem("ms_user") ?? "{}").rol;
    } catch {}

    throw redirect({ to: destinoPostLogin(search.redirect, rol) as never });
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect: returnTo } = Route.useSearch();
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

        const rol = (data.user as { role?: string }).role ?? "medico";

        // La autenticación real va por cookie de Better-Auth (las peticiones
        // usan credentials: "include"); este valor sólo marca "sesión activa".
        login("cookie-based", {
          id: data.user.id,
          email: data.user.email,
          nombre: data.user.name,
          rol,
          is_active: true,
        });

        navigate({ to: destinoPostLogin(returnTo, rol) as never });
      } catch (err) {
        toast.danger(err instanceof Error ? err.message : "Error al iniciar sesión");
      }
    },
  });

  return (
    <div className="min-h-svh bg-background flex flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-accent">
            <Scan size={13} className="text-accent-foreground" />
          </div>
          <span className="text-[13px] font-medium tracking-tight text-foreground">
            MedImaging
          </span>
        </div>
        <ModeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-90">
          <div className="mb-8">
            <p className="text-[11px] font-semibold text-accent uppercase tracking-widest mb-3">
              Medical Imaging System
            </p>
            <h1 className="text-[22px] font-semibold text-foreground leading-tight tracking-[-0.3px]">
              Acceder al sistema
            </h1>
            <p className="mt-2 text-[13px] text-muted">
              Introduce tus credenciales clínicas para continuar.
            </p>
          </div>

          <div className="rounded-cards bg-surface shadow-surface p-6">
            {esRedirectInterno(returnTo) && (
              <div className="mb-5 rounded-nav bg-info-soft px-3 py-2 text-[12px] text-info-soft-foreground">
                Tu sesión expiró. Al entrar volverás a donde estabas.
              </div>
            )}

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
                    autoComplete="email"
                    className="w-full"
                  >
                    <Label className="text-[13px] text-muted mb-1.5">Correo electrónico</Label>
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
                    autoComplete="current-password"
                    className="w-full"
                  >
                    <Label className="text-[13px] text-muted mb-1.5">Contraseña</Label>
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
                    className="mt-1 w-full rounded-full bg-accent text-accent-foreground font-medium text-[14px] py-2.5 disabled:opacity-50 transition-opacity"
                  >
                    {isSubmitting ? "Accediendo…" : "Acceder"}
                  </Button>
                )}
              </form.Subscribe>
            </form>
          </div>

          <p className="mt-5 flex items-center justify-center gap-1.5 text-[12px] text-muted">
            <ShieldCheck size={13} aria-hidden="true" />
            Acceso restringido a personal autorizado
          </p>
        </div>
      </main>
    </div>
  );
}
