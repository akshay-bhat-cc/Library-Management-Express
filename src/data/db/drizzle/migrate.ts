import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { AppEnvs } from "../../../read-env";

async function main() {
  const migrationClient = mysql.createPool({
    uri: AppEnvs.DATABASE_URL,
    multipleStatements: true,
  });

  const db = drizzle(migrationClient);
  await migrate(db, {
    migrationsFolder: "src/db/drizzle/migrations",
  });

  await migrationClient.end();
}

main();
