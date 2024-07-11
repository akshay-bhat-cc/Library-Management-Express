import { ResultSetHeader, RowDataPacket } from "mysql2";
import { IPageRequest, IPagesResponse } from "../core/pagination";
import { IRepository } from "../core/repository";
import { IMemberBase, IMember } from "./models/member.model";
import { WhereExpression } from "../core/types";
import { MySqlConnectionFactory } from "../db/MySqlDbConnection";
import {
  generateCountSql,
  generateDeleteSql,
  generateInsertSql,
  generateSelectSql,
  generateUpdateSql,
} from "../core/mysql-query-generator";

export class MemberRepository implements IRepository<IMemberBase, IMember> {
  constructor(private poolConnectionFactory: MySqlConnectionFactory) {}

  async create(data: IMemberBase): Promise<IMember | undefined> {
    const connection =
      this.poolConnectionFactory.acquireTransactionPoolConnection();
    try {
      await connection.initialize();
      const member: Omit<IMember, "id"> = { ...data };

      const insertQuery = generateInsertSql<Omit<IMember, "id">>(
        "members",
        member
      );
      const result = await connection.query<ResultSetHeader>(
        insertQuery.sql,
        insertQuery.data
      );

      if (result) {
        const insertedMemberId = result.insertId;
        const insertedMember = await this.getById(insertedMemberId);
        return insertedMember as IMember;
      }
    } catch (error) {
      throw error;
    } finally {
      await connection.release();
    }
  }

  async update(
    memberId: number,
    data: IMemberBase
  ): Promise<IMember | undefined> {
    const connection = this.poolConnectionFactory.acquirePoolConnection();
    try {
      await connection.initialize();
      const updateQuery = generateUpdateSql<Partial<IMember>>(data, "members", {
        id: { value: memberId, op: "EQUALS" },
      });
      const result = await connection.query<ResultSetHeader>(
        updateQuery.sql,
        updateQuery.data
      );

      if (result) {
        const updatedMember = await this.getById(memberId);
        return updatedMember as IMember;
      }
    } catch (error) {
      throw error;
    } finally {
      await connection.release();
    }
  }

  async delete(memberId: number): Promise<IMember | undefined> {
    const connection = this.poolConnectionFactory.acquirePoolConnection();
    try {
      await connection.initialize();
      const deletedMember = await this.getById(memberId);
      const deleteQuery = generateDeleteSql<IMember>("members", {
        id: { value: memberId, op: "EQUALS" },
      });
      const result = await connection.query<ResultSetHeader>(
        deleteQuery.sql,
        deleteQuery.data
      );

      if (result && result.affectedRows > 0) {
        return deletedMember as IMember;
      }
    } catch (error) {
      throw error;
    } finally {
      await connection.release();
    }
  }

  async getById(memberId: number): Promise<IMember | undefined> {
    const connection = this.poolConnectionFactory.acquirePoolConnection();
    try {
      await connection.initialize();
      const selectMemberQuery = generateSelectSql<IMember>(
        "members",
        { id: { value: memberId, op: "EQUALS" } },
        [],
        0,
        1
      );
      const member = await connection.query<RowDataPacket[]>(
        selectMemberQuery.sql,
        selectMemberQuery.data
      );
      return member[0] as IMember;
    } catch (error) {
      throw error;
    } finally {
      await connection.release();
    }
  }

  async list(
    params: IPageRequest
  ): Promise<IPagesResponse<IMember> | undefined> {
    const connection = this.poolConnectionFactory.acquirePoolConnection();
    try {
      await connection.initialize();
      const { limit, offset, search } = params;
      const searchFilter: WhereExpression<IMember> = search
        ? {
            OR: [
              { firstName: { value: search, op: "CONTAINS" } },
              { phoneNumber: { value: search, op: "CONTAINS" } },
            ],
          }
        : {};

      const totalCount = await this.getTotalCount();
      const selectQuery = generateSelectSql<IMember>(
        "members",
        searchFilter,
        [],
        offset,
        limit
      );
      const result = await connection.query<RowDataPacket[]>(
        selectQuery.sql,
        selectQuery.data
      );

      if (result) {
        return {
          items: result as IMember[],
          pagination: { offset, limit, total: totalCount! },
        };
      }
    } catch (error) {
      throw error;
    } finally {
      await connection.release();
    }
  }

  async deleteAll() {
    const connection = this.poolConnectionFactory.acquirePoolConnection();
    try {
      await connection.initialize();
      const deleteSql = generateDeleteSql<IMember>("members", {});
      const result = await connection.query<ResultSetHeader>(
        deleteSql.sql,
        deleteSql.data
      );

      if (result && result.affectedRows > 0) {
        return result.affectedRows;
      }
    } catch (error) {
      console.error("Error deleting all members:", error);
      throw error;
    } finally {
      await connection.release();
    }
  }

  async getTotalCount() {
    const connection = this.poolConnectionFactory.acquirePoolConnection();
    try {
      await connection.initialize();
      const totalCountQuery = generateCountSql<IMember>("members", {});
      const result = await connection.query<RowDataPacket[]>(
        totalCountQuery.sql,
        totalCountQuery.data
      );
      if (result) {
        return result[0]["COUNT(*)"] as number;
      }
    } catch (error) {
      throw error;
    } finally {
      await connection.release();
    }
  }
}
