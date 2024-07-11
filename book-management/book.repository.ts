import { ResultSetHeader, RowDataPacket } from "mysql2";
import { IPageRequest, IPagesResponse } from "../core/pagination";
import { IRepository } from "../core/repository";
import { IBook, IBookBase } from "./models/books.model";
import { WhereExpression } from "../core/types";
import { MySqlConnectionFactory } from "../db/MySqlDbConnection";
import {
  generateCountSql,
  generateDeleteSql,
  generateInsertSql,
  generateSelectSql,
  generateUpdateSql,
} from "../core/mysql-query-generator";

export class BookRepository implements IRepository<IBookBase, IBook> {
  constructor(private poolConnectionFactory: MySqlConnectionFactory) {}
  async create(data: IBookBase): Promise<IBook | undefined> {
    const connection =
      this.poolConnectionFactory.acquireTransactionPoolConnection();
    try {
      await connection.initialize();
      const book: Omit<IBook, "id"> = {
        ...data,
        availableCopies: data.totalCopies,
      };

      const insertQuery = generateInsertSql<IBookBase>("books", book);
      const result = await connection.query<ResultSetHeader>(
        insertQuery.sql,
        insertQuery.data
      );

      if (result) {
        const insertedBookId = result.insertId;
        const insertedBook = await this.getById(insertedBookId);
        return insertedBook as IBook;
      }
    } catch (error) {
      throw error;
    } finally {
      await connection.release();
    }
  }

  async update(
    bookId: number,
    data: Partial<IBook>
  ): Promise<IBook | undefined> {
    const connection = this.poolConnectionFactory.acquirePoolConnection();
    try {
      await connection.initialize();
      const updateQuery = generateUpdateSql<Partial<IBook>>(data, "books", {
        id: {
          value: bookId,
          op: "EQUALS",
        },
      });
      const result = await connection.query<ResultSetHeader>(
        updateQuery.sql,
        updateQuery.data
      );

      if (result) {
        const updatedBook = await this.getById(bookId);
        return updatedBook as IBook;
      }
    } catch (error) {
      throw error;
    } finally {
      await connection.release();
    }
  }

  async delete(bookId: number): Promise<IBook | undefined> {
    const connection = this.poolConnectionFactory.acquirePoolConnection();
    try {
      await connection.initialize();
      const deletedBook = await this.getById(bookId);
      const deleteQuery = generateDeleteSql<IBook>("books", {
        id: {
          value: bookId,
          op: "EQUALS",
        },
      });
      const result = await connection.query<ResultSetHeader>(
        deleteQuery.sql,
        deleteQuery.data
      );

      if (result && result.affectedRows > 0) {
        return deletedBook as IBook;
      }
    } catch (error) {
      throw error;
    } finally {
      await connection.release();
    }
  }

  async list(params: IPageRequest): Promise<IPagesResponse<IBook> | undefined> {
    const connection = this.poolConnectionFactory.acquirePoolConnection();
    try {
      await connection.initialize();
      const { limit, offset, search } = params;
      const searchFilter: WhereExpression<IBook> = search
        ? {
            OR: [
              {
                title: { value: search, op: "CONTAINS" },
              },
              {
                isbnNo: { value: search, op: "CONTAINS" },
              },
            ],
          }
        : {};

      const totalCountQuery = generateCountSql<IBook>("books", searchFilter);
      const totalCount = (
        await connection.query<RowDataPacket[]>(
          totalCountQuery.sql,
          totalCountQuery.data
        )
      )[0]["COUNT(*)"] as number;
      if (!totalCount) throw new Error("Could not fetch the count");

      const selectQuery = generateSelectSql<IBook>(
        "books",
        searchFilter,
        [],
        offset,
        limit
      );
      const result = await connection.query(selectQuery.sql, selectQuery.data);
      if (result) {
        return {
          items: result as IBook[],
          pagination: {
            offset,
            limit,
            total: totalCount,
          },
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
      const deleteSql = generateDeleteSql<IBook>("books", {});
      const result = await connection.query<ResultSetHeader>(
        deleteSql.sql,
        deleteSql.data
      );

      if (result && result.affectedRows > 0) {
        return result;
      }
    } catch (error) {
      throw error;
    } finally {
      await connection.release();
    }
  }

  async getTotalCount() {
    const connection = this.poolConnectionFactory.acquirePoolConnection();
    try {
      await connection.initialize();
      const totalCountQuery = generateCountSql<IBook>("books", {});
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

  async getById(bookId: number): Promise<IBook | undefined> {
    const connection = this.poolConnectionFactory.acquirePoolConnection();
    try {
      await connection.initialize();
      const selectBookQuery = generateSelectSql(
        "books",
        {
          id: { value: bookId, op: "EQUALS" },
        },
        [],
        0,
        1
      );
      const book = await connection.query<RowDataPacket[]>(
        selectBookQuery.sql,
        selectBookQuery.data
      );
      return book[0] as IBook;
    } catch (error) {
      throw error;
    } finally {
      await connection.release();
    }
  }

  async getByIsbnNumber(isbnNo: string): Promise<IBook> {
    const connection = this.poolConnectionFactory.acquirePoolConnection();
    try {
      await connection.initialize();
      const selectBookQuery = generateSelectSql(
        "books",
        {
          id: { value: isbnNo, op: "EQUALS" },
        },
        [],
        0,
        1
      );
      const book = await connection.query<RowDataPacket[]>(
        selectBookQuery.sql,
        selectBookQuery.data
      );
      return book[0] as IBook;
    } catch (error) {
      throw error;
    } finally {
      await connection.release();
    }
  }
}
