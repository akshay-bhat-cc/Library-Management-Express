import { defineConfig } from "drizzle-kit";
import { AppEnvs } from "./read-env";
export default defineConfig({
  schema: "src/db/drizzle/schema.ts",
  out: "src/db/drizzle/migrations",
  dialect: "mysql",
  verbose: true,
  strict: true,
  dbCredentials: {
    url: AppEnvs.DATABASE_URL,
  },
});
