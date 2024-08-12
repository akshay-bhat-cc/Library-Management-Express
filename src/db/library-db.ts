import { RowDataPacket } from "mysql2";
import {
  generateCountSql,
  generateDeleteSql,
  generateInsertSql,
  generateSelectSql,
  generateUpdateSql,
} from "../core/mysql-query-generator";
import { WhereExpression } from "../core/types";
import { DBConfig, MySQLAdapter } from "./mysqldb";
import { LibraryDataset } from "./library-dataset";
import { MySqlPoolConnectionFactory } from "./MySqlDbConnection";

export class LibraryDB {
  mySQLAdapter: MySQLAdapter | null = null;
  private poolConnection: MySqlPoolConnectionFactory | null = null;
  constructor(private readonly config: DBConfig) {
    this.poolConnection = new MySqlPoolConnectionFactory(this.config);
  }
  connection = this.poolConnection?.acquireConnection();
  async insert<ReturnType, CompleteModel>(
    data: CompleteModel,
    tableName: keyof LibraryDataset
  ): Promise<ReturnType | undefined> {
    try {
      const insertQuery = generateInsertSql<CompleteModel>(tableName, data);
      const result = await this.mySQLAdapter?.runQuery<ReturnType>(
        insertQuery.sql,
        insertQuery.data
      );
      return result;
    } catch (err) {
      throw err;
    }
  }

  async update<ReturnType, CompleteModel>(
    data: Partial<CompleteModel>,
    tableName: keyof LibraryDataset,
    whereExpression: WhereExpression<CompleteModel>
  ): Promise<ReturnType | undefined> {
    try {
      const updateQuery = generateUpdateSql<CompleteModel>(
        data,
        tableName,
        whereExpression
      );
      const result = await this.mySQLAdapter?.runQuery<ReturnType>(
        updateQuery.sql,
        updateQuery.data
      );
      return result;
    } catch (err) {
      throw err;
    }
  }

  async select<ReturnType, CompleteModel>(
    tableName: keyof LibraryDataset,
    whereExpression: WhereExpression<CompleteModel>,
    fields?: Partial<keyof CompleteModel>[],
    offset?: number,
    limit?: number
  ): Promise<ReturnType | undefined> {
    try {
      const selectQuery = generateSelectSql<CompleteModel>(
        tableName,
        whereExpression,
        fields,
        offset,
        limit
      );
      const result = await this.mySQLAdapter?.runQuery<ReturnType>(
        selectQuery.sql,
        selectQuery.data
      );
      return result;
    } catch (err) {
      throw err;
    }
  }

  async deleteRecord<ReturnType, CompleteModel>(
    tableName: keyof LibraryDataset,
    whereExpression: WhereExpression<CompleteModel>
  ): Promise<ReturnType | undefined> {
    try {
      const deleteQuery = generateDeleteSql<CompleteModel>(
        tableName,
        whereExpression
      );
      const result = await this.mySQLAdapter?.runQuery<ReturnType>(
        deleteQuery.sql,
        deleteQuery.data
      );
      return result;
    } catch (err) {
      throw err;
    }
  }

  async count<CompleteModel>(
    tableName: keyof LibraryDataset,
    where: WhereExpression<CompleteModel>,
    columnName?: keyof CompleteModel,
    columnNameAlias?: string
  ): Promise<number | undefined> {
    try {
      const countQuery = generateCountSql(
        tableName,
        where,
        columnName,
        columnNameAlias
      );
      const result = await this.mySQLAdapter?.runQuery<RowDataPacket[]>(
        countQuery.sql,
        countQuery.data
      );
      if (result) return result[0][columnNameAlias ?? "COUNT(*)"] as number;
    } catch (err) {
      throw err;
    }
  }
}
