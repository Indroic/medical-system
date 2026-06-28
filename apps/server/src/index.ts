import { auth } from "@medical-system/auth";
import { db } from "@medical-system/db";
import { user } from "@medical-system/db/schema/auth";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { pacientes } from "./routes/pacientes";
import { estudios } from "./routes/estudios";
import { analisis } from "./routes/analisis";
import { reportes } from "./routes/reportes";
import { usuarios } from "./routes/usuarios";
import { eventsRouter } from "./routes/events";
import { trimTrailingSlash } from "hono/trailing-slash";

const app = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

app.use(trimTrailingSlash());

app.use(logger());
app.use(
  "/*",
  cors({
    origin: "https://medical.indroic.dev",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use("*", async (c, next) => {
  if (c.req.path.startsWith("/api/auth") || c.req.path === "/check-setup" || c.req.path === "/") {
    return next();
  }

  const cookieStr = c.req.raw.headers.get("cookie") || "";
  console.log(`[AUTH] Path: ${c.req.path} | Cookies presentes: ${cookieStr.includes("better-auth.session_token")}`);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    c.set("user", null);
    c.set("session", null);
    // Si es una ruta protegida (empieza por /api/ y no es auth), lanzar 401 inmediato
    if (c.req.path.startsWith("/api/")) {
      return c.json({ message: "Unauthorized" }, 401);
    }
  } else {
    c.set("user", session.user);
    c.set("session", session.session);
  }

  await next();
});

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.get("/check-setup", async (c) => {
  const rows = await db.select({ id: user.id }).from(user).limit(1);
  return c.json({ setup_required: rows.length === 0 });
});

app.get("/", (c) => {
  return c.text("OK");
});

const routes = app
  .route("/api/pacientes", pacientes)
  .route("/api/estudios", estudios)
  .route("/api/analisis", analisis)
  .route("/api/reportes", reportes)
  .route("/api/usuarios", usuarios)
  .route("/api/events", eventsRouter);

export type AppType = typeof routes;

import { serve } from "@hono/node-server";

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
