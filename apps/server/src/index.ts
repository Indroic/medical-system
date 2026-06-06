import { auth } from "@medical-system/auth";
import { db } from "@medical-system/db";
import { user } from "@medical-system/db/schema/auth";
import { env } from "@medical-system/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { pacientes } from "./routes/pacientes";
import { estudios } from "./routes/estudios";
import { analisis } from "./routes/analisis";
import { reportes } from "./routes/reportes";
import { usuarios } from "./routes/usuarios";

const app = new Hono();

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
  .route("/api/usuarios", usuarios);

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
