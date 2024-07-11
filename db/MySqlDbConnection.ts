import mysql, { QueryResult } from "mysql2/promise";
import { DBConfig } from "./mysqldb";
export interface IConnection<QR> {
  initialize(): Promise<mysql.PoolConnection | mysql.Connection | void>;
  query: <T extends QR>(sql: string, values: any) => Promise<T>;
}

export interface IPoolConnectionFactory<QR> {
  acquirePoolConnection(): MySqlPoolConnection;
  acquireTransactionPoolConnection(): MysqlTransactionPoolConnection;
}
export interface IConnectionFactory<QR> {
  acquireStandAloneConnection(): MySqlStandaloneConnection;
  acquireStandAloneTransactionConnection(): MySqlTransactionConnection;
}

export abstract class StandaloneConnection<QR> implements IConnection<QR> {
  abstract initialize(): Promise<void>;
  abstract query<T extends QR>(sql: string, values: any): Promise<T>;
  abstract close(): Promise<void>;
}

export abstract class PoolConnection<QR> implements IConnection<QR> {
  abstract initialize(): Promise<void>;
  abstract query<T extends QR>(sql: string, values: any): Promise<T>;
  abstract release(): void;
}

export abstract class TransactionConnection<QR> implements IConnection<QR> {
  abstract initialize(): Promise<void>;
  abstract query<T extends QR>(sql: string, values: any): Promise<T>;
  abstract close(): Promise<void>;
  abstract commit(): Promise<void>;
  abstract rollback(): Promise<void>;
}

export abstract class TransactionPoolConnection<QR> implements IConnection<QR> {
  abstract initialize(): Promise<void>;
  abstract query<T extends QR>(sql: string, values: any): Promise<T>;
  abstract release(): void;
  abstract commit(): Promise<void>;
  abstract rollback(): Promise<void>;
}

// -----XXXXX-----

export class MySqlStandaloneConnection extends StandaloneConnection<QueryResult> {
  private connection: mysql.Connection | undefined;
  constructor(private readonly connectionString: string) {
    super();
  }

  async initialize() {
    if (this.connection) return;
    this.connection = await mysql.createConnection(this.connectionString);
  }
  async query<T extends QueryResult>(sql: string, values: any): Promise<T> {
    if (!this.connection) {
      await this.initialize();
    }
    const [result] = await this.connection!.query<T>(sql, values);
    return result;
  }
  async close(): Promise<void> {
    if (!this.connection) return;
    return this.connection.end();
  }
}

export class MySqlPoolConnection extends PoolConnection<QueryResult> {
  private connection: mysql.PoolConnection | undefined;
  constructor(private readonly pool: mysql.Pool) {
    super();
  }

  async initialize(): Promise<void> {
    this.connection = await this.pool?.getConnection();
  }

  async query<T extends QueryResult>(sql: string, values: any): Promise<T> {
    try {
      if (!this.connection) await this.initialize();
      const [result] = await this.connection!.query<T>(sql, values);
      return result;
    } catch (err) {
      throw err;
    }
  }

  release(): void {
    if (!this.connection) return;
    this.pool?.releaseConnection(this.connection);
  }
}

export class MySqlTransactionConnection extends TransactionConnection<QueryResult> {
  private connection: mysql.Connection | undefined;
  constructor(private readonly connectionString: string) {
    super();
  }
  async initialize(): Promise<void> {
    this.connection = await mysql.createConnection(this.connectionString);
    this.connection.beginTransaction();
  }
  async query<T extends mysql.QueryResult>(
    sql: string,
    values: any
  ): Promise<T> {
    if (!this.connection) await this.initialize();
    const [result] = await this.connection!.query<T>(sql, values);
    return result;
  }
  async close(): Promise<void> {
    if (!this.connection) return;
    this.connection?.end();
  }
  async commit(): Promise<void> {
    this.connection?.commit();
  }
  async rollback(): Promise<void> {
    if (!this.connection) return;
    this.connection?.rollback();
  }
}

export class MysqlTransactionPoolConnection extends TransactionPoolConnection<QueryResult> {
  connection: mysql.PoolConnection | undefined;
  constructor(private pool: mysql.Pool) {
    super();
    this.pool = pool;
  }
  async initialize(): Promise<void> {
    this.connection = await this.pool?.getConnection();
  }
  async query<T extends mysql.QueryResult>(
    sql: string,
    values: any
  ): Promise<T> {
    if (!this.connection) await this.initialize();
    const [result] = await this.connection!.query<T>(sql, values);
    return result;
  }
  release(): void {
    if (!this.connection) return;
    this.pool?.releaseConnection(this.connection);
  }
  async commit(): Promise<void> {
    await this.connection?.commit();
    this.release();
    this.connection = undefined;
  }
  async rollback(): Promise<void> {
    await this.connection?.rollback();
    this.release();
    this.connection = undefined;
  }
}

export class MySqlConnectionFactory
  implements
    IPoolConnectionFactory<QueryResult>,
    IConnectionFactory<QueryResult>
{
  private pool: mysql.Pool;
  private connectionString: string | undefined;
  constructor(private readonly config: DBConfig) {
    this.pool = mysql.createPool(this.config.dbURL);
    this.connectionString = config.dbURL;
  }
  acquirePoolConnection(): MySqlPoolConnection {
    const connection = new MySqlPoolConnection(this.pool);
    return connection;
  }
  acquireTransactionPoolConnection(): MysqlTransactionPoolConnection {
    const connection = new MysqlTransactionPoolConnection(this.pool);
    return connection;
  }
  acquireStandAloneConnection(): MySqlStandaloneConnection {
    const connection = new MySqlStandaloneConnection(this.connectionString!);
    return connection;
  }
  acquireStandAloneTransactionConnection(): MySqlTransactionConnection {
    const connection = new MySqlTransactionConnection(this.connectionString!);
    return connection;
  }
}
