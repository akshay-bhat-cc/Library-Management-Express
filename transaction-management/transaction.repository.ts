import mysql, {
  QueryResult,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";
import { IPageRequest, IPagesResponse } from "../core/pagination";
import { IRepository } from "../core/repository";
import { ITransaction, ITransactionBase } from "./models/transaction.model";
import { WhereExpression } from "../core/types";
import {
  generateCountSql,
  generateDeleteSql,
  generateInsertSql,
  generateSelectSql,
  generateUpdateSql,
} from "../core/mysql-query-generator";
import { formatDate } from "../core/formatdate";
import { MySqlConnectionFactory } from "../db/MySqlDbConnection";
import { BookRepository } from "../book-management/book.repository";
import { MemberRepository } from "../member-management/member.repository";

export class TransactionRepository
  implements IRepository<ITransactionBase, ITransaction>
{
  bookRepo: BookRepository;
  memberRepo: MemberRepository;

  constructor(private poolConnectionFactory: MySqlConnectionFactory) {
    this.bookRepo = new BookRepository(this.poolConnectionFactory);
    this.memberRepo = new MemberRepository(this.poolConnectionFactory);
  }

  async create(data: ITransactionBase): Promise<ITransaction | undefined> {
    const connection =
      this.poolConnectionFactory.acquireTransactionPoolConnection();
    try {
      await connection.initialize();
      const currentDate = new Date();
      const dueDays = 7;
      const dueDate = new Date(currentDate);
      dueDate.setDate(currentDate.getDate() + dueDays);

      const transaction: Omit<ITransaction, "id"> = {
        ...data,
        issueDate: formatDate(currentDate),
        dueDate: formatDate(dueDate),
        returnDate: null,
        status: "Issued",
      };

      const insertQuery = generateInsertSql<Omit<ITransaction, "id">>(
        "transactions",
        transaction
      );
      const result = await connection.query<ResultSetHeader>(
        insertQuery.sql,
        insertQuery.data
      );
      if (result) {
        const transactionId = result.insertId;
        const insertedTransaction = await this.getById(transactionId);
        await connection.commit();
        return insertedTransaction as ITransaction;
      }
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async update(transactionId: number): Promise<ITransaction | undefined> {
    const connection =
      this.poolConnectionFactory.acquireTransactionPoolConnection();
    try {
      await connection.initialize();
      const transaction = await this.getById(transactionId);
      if (transaction) {
        const book = await this.bookRepo.getById(transaction.bookId);
        if (transaction.status === "Returned" && book) {
          await this.bookRepo.update(book.id, {
            availableCopies: book.availableCopies++,
          });
        } else if (transaction.status === "Issued" && book) {
          await this.bookRepo.update(book.id, {
            availableCopies: book.availableCopies--,
          });
        }
        if (book) {
          const updateQuery = generateUpdateSql<Partial<ITransaction>>(
            {
              status: transaction.status === "Issued" ? "Returned" : "Issued",
              returnDate: formatDate(new Date()),
            },
            "transactions",
            { id: { value: transactionId, op: "EQUALS" } }
          );
          await connection.query<ResultSetHeader>(
            updateQuery.sql,
            updateQuery.data
          );
          await this.bookRepo.update(transaction.bookId, book);
          const updatedTransaction = await this.getById(transactionId);
          await connection.commit();
          return updatedTransaction;
        }
      }
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async delete(transactionId: number): Promise<ITransaction | undefined> {
    const connection =
      this.poolConnectionFactory.acquireTransactionPoolConnection();
    try {
      await connection.initialize();
      const deletedTransaction = await this.getById(transactionId);

      const deleteQuery = generateDeleteSql("transactions", {
        id: { value: transactionId, op: "EQUALS" },
      });
      const result = await connection.query<ResultSetHeader>(
        deleteQuery.sql,
        deleteQuery.data
      );

      if (result && result.affectedRows > 0) {
        await connection.commit();
        return deletedTransaction as ITransaction;
      }
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getById(transactionId: number): Promise<ITransaction | undefined> {
    const connection = this.poolConnectionFactory.acquirePoolConnection();
    try {
      await connection.initialize();

      const selectQuery = generateSelectSql<ITransaction>(
        "transactions",
        { id: { value: transactionId, op: "EQUALS" } },
        [],
        0,
        1
      );
      const transaction = await connection.query<RowDataPacket[]>(
        selectQuery.sql,
        selectQuery.data
      );

      if (transaction.length > 0) {
        return transaction[0] as ITransaction;
      }
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  async list(
    params: IPageRequest
  ): Promise<IPagesResponse<ITransaction> | undefined> {
    const connection = this.poolConnectionFactory.acquirePoolConnection();
    try {
      await connection.initialize();

      const { limit, offset, search } = params;
      const searchFilter: WhereExpression<ITransaction> = search
        ? {
            OR: [
              {
                bookId: { value: search, op: "CONTAINS" },
              },
              {
                memberId: { value: search, op: "CONTAINS" },
              },
            ],
          }
        : {};
      const totalCount = await this.getTotalCount();

      if (!totalCount) {
        throw new Error("Could not fetch the count");
      }

      const selectQuery = generateSelectSql<ITransaction>(
        "transactions",
        searchFilter,
        [],
        offset,
        limit
      );
      const result = await connection.query<RowDataPacket[]>(
        selectQuery.sql,
        selectQuery.data
      );

      return {
        items: result as ITransaction[],
        pagination: {
          offset,
          limit,
          total: totalCount,
        },
      };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  async deleteAll() {
    const connection =
      this.poolConnectionFactory.acquireTransactionPoolConnection();
    try {
      await connection.initialize();
      const deleteQuery = generateDeleteSql("transactions", {});
      const result = await connection.query<ResultSetHeader>(
        deleteQuery.sql,
        deleteQuery.data
      );

      if (result && result.affectedRows > 0) {
        await connection.commit();
        return result.affectedRows;
      }
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getTotalCount() {
    const connection = this.poolConnectionFactory.acquirePoolConnection();
    try {
      await connection.initialize();
      const totalCountQuery = generateCountSql<ITransaction>(
        "transactions",
        {}
      );
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
      connection.release();
    }
  }
  async getAllTransaction(): Promise<ITransaction[]> {
    const connection = this.poolConnectionFactory.acquirePoolConnection();
    try {
      await connection.initialize();
      const totalTransactions = await this.getTotalCount();
      const selectQuery = generateSelectSql<ITransaction>(
        "transactions",
        {},
        [],
        0,
        totalTransactions
      );
      const [result] = await connection.query<RowDataPacket[]>(
        selectQuery.sql,
        selectQuery.data
      );

      return result as ITransaction[];
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  async getTransactionByDate(date: string) {
    const todaysDueListWhereExp: WhereExpression<ITransaction> = {
      dueDate: {
        op: "CONTAINS",
        value: date,
      },
    };
    const selectQuery = generateSelectSql(
      "transactions",
      todaysDueListWhereExp
    );
    const connection = this.poolConnectionFactory.acquirePoolConnection();
    try {
      const todaysDueList = await connection.query<RowDataPacket[]>(
        selectQuery.sql,
        selectQuery.data
      );
      return todaysDueList;
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }
}
