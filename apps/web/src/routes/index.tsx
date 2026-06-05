import { createFileRoute, isRedirect, redirect } from "@tanstack/react-router";
import { usuariosApi } from "@/lib/python-api";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const token = localStorage.getItem("ms_token");
    if (token) throw redirect({ to: "/dashboard" });

    try {
      const { setup_required } = await usuariosApi.checkSetup();
      if (setup_required) throw redirect({ to: "/setup" });
    } catch (err) {
      if (isRedirect(err)) throw err;
      // Si la API no responde, ir al login de todas formas
    }

    throw redirect({ to: "/login" });
  },
  component: () => null,
});
