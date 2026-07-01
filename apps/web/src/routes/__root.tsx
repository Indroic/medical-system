import { HeadContent, Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { Toast } from "@heroui/react";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { AuthContext, useAuthState } from "@/lib/auth-store";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

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
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={auth}>
          <HeadContent />
          <Toast.Provider placement="bottom end" />
          <Outlet />
          <TanStackRouterDevtools position="bottom-left" />
        </AuthContext.Provider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
