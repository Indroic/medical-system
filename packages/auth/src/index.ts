import { createDb } from "@medical-system/db";
import * as schema from "@medical-system/db/schema/auth";
import { env } from "@medical-system/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins/bearer";
import { jwt } from "better-auth/plugins/jwt";

import { admin } from "better-auth/plugins/admin";

export function createAuth() {
  const db = createDb();

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",

      schema: schema,
    }),
    trustedOrigins: [env.CORS_ORIGIN, "https://medical.indroic.dev"],
    emailAndPassword: {
      enabled: true,
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          required: false,
          defaultValue: "medico",
          input: true,
        },
      },
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    basePath: "/api/auth",
    advanced: {
      crossSubDomainCookies: {
        enabled: true,
      },
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
        httpOnly: true,
      },
    },
    plugins: [
      admin(),
      bearer(),
      jwt({
        jwt: {
          // El issuer del token debe coincidir con BETTER_AUTH_URL
          // (lo que el Python API valida en audience/issuer)
          issuer: env.BETTER_AUTH_URL,
          audience: env.BETTER_AUTH_URL,
        },
      }),
    ],
  });
}

export const auth = createAuth();
