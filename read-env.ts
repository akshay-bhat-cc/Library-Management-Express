import "dotenv/config";
interface AppEnv {
  DATABASE_URL: string;
  ACCESS_TOKEN_SECRET: string;
  REFRESH_TOKEN_SECRET: string;
}

export const AppEnvs = process.env as unknown as AppEnv;
