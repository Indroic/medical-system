import { createFileRoute, isRedirect, redirect } from "@tanstack/react-router";
import { env } from "@medical-system/env/web";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const token = localStorage.getItem("ms_token");
    if (token) throw redirect({ to: "/dashboard" });

    try {
      const res = await fetch(`${env.VITE_SERVER_URL}/check-setup`);
      const { setup_required } = await res.json();
      if (setup_required) throw redirect({ to: "/setup" });
    } catch (err) {
      if (isRedirect(err)) throw err;
      // Si el servidor no responde, ir al login de todas formas
    }

    throw redirect({ to: "/login" });
  },
  component: () => null,
});
