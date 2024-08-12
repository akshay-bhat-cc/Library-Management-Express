import mysql from "mysql2/promise";
import { ColumnData } from "./ds";
export interface DBConfig {
  dbURL: string;
}

interface Adapter {
  shutDown: () => Promise<void>;
  runQuery: <T>(sql: string, data: ColumnData[]) => Promise<T | undefined>;
}

export class MySQLAdapter implements Adapter {
  private pool: mysql.Pool;
  constructor(private readonly config: DBConfig) {
    this.pool = mysql.createPool(this.config.dbURL);
  }

  async shutDown() {
    return this.pool.end();
  }

  async runQuery<T>(sql: string, data: ColumnData[]): Promise<T | undefined> {
    let connection: mysql.PoolConnection | null = null;
    try {
      connection = await this.pool.getConnection();
      const [result] = await connection.query(sql, data);
      return result as T;
    } catch (err) {
      throw err;
    } finally {
      if (connection) {
        this.pool.releaseConnection(connection);
      }
    }
  }
}
