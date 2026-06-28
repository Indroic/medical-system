import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config({
  path: "../../apps/server/.env",
});

export default defineConfig({
  schema: "./src/schema",
  out: "./src/migrations",
  dialect: "postgresql",
  tablesFilter: ["user", "session", "account", "verification", "jwks"],
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
});
