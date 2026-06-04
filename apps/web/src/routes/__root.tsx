import { Toaster } from "@medical-system/ui/components/sonner";
import { HeadContent, Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { AuthContext, useAuthState } from "@/lib/auth-store";

import "../index.css";

export interface RouterAppContext {}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      { title: "Medical Imaging System" },
      { name: "description", content: "CT scan analysis platform for medical professionals" },
    ],
    links: [{ rel: "icon", href: "/favicon.ico" }],
  }),
});

function RootComponent() {
  const auth = useAuthState();

  return (
    <AuthContext.Provider value={auth}>
      <HeadContent />
      <Outlet />
      <Toaster />
      <TanStackRouterDevtools position="bottom-left" />
    </AuthContext.Provider>
  );
}
