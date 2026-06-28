import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    // Vacío = mismo origen (el nginx de 'web' proxyea /api). En dev usa http://localhost:3000.
    VITE_SERVER_URL: z.string().default(""),
    VITE_PYTHON_API_URL: z.string().default(""),
  },
  runtimeEnv: (import.meta as any).env,
  emptyStringAsUndefined: true,
});
