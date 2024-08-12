import { drizzle } from "drizzle-orm/mysql2";
import { AppEnvs } from "../../../read-env";
import mysql from "mysql2/promise";

export function getDB() {
  const pool = mysql.createPool(AppEnvs.DATABASE_URL);
  const db = drizzle(pool);
  return db;
}

export async function getConnectionDB() {
  const connection = await mysql.createConnection(AppEnvs.DATABASE_URL);
  const db = drizzle(connection);
  return db;
}
