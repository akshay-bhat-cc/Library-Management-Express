import { IPageRequest, IPagesResponse } from "../core/pagination";
import { IRepository } from "../core/repository";
import { ITransaction, ITransactionBase } from "./models/transaction.model";
import { formatDate } from "../core/formatdate";
import { BookRepository } from "../book-management/book.repository";
import { MemberRepository } from "../member-management/member.repository";
import { MySql2Database } from "drizzle-orm/mysql2";
import { transactions } from "../db/drizzle/schema";
import { count, eq, like, or } from "drizzle-orm";

export class TransactionRepository
  implements IRepository<ITransactionBase, ITransaction>
{
  bookRepo: BookRepository;
  memberRepo: MemberRepository;

  constructor(private db: MySql2Database<Record<string, never>>) {
    this.bookRepo = new BookRepository(this.db);
    this.memberRepo = new MemberRepository(this.db);
  }

  async create(data: ITransactionBase): Promise<ITransaction | void> {
    try {
      const currentDate = new Date();
      const dueDays = data.dueDays;
      const dueDate = new Date(currentDate);
      dueDate.setDate(currentDate.getDate() + dueDays);
      const transaction = await this.db.transaction(async (txn) => {
        const [insertedTransaction] = await txn
          .insert(transactions)
          .values({
            bookId: BigInt(data.bookId),
            memberId: BigInt(data.memberId),
            issueDate: formatDate(currentDate),
            dueDate: formatDate(dueDate),
            dueDays: dueDays,
            returnDate: null,
            status: "Issued",
          })
          .$returningId();
        const transactionId = insertedTransaction.id;
        const [transaction] = await txn
          .select()
          .from(transactions)
          .where(eq(transactions.id, transactionId));
        return transaction;
      });
      return transaction as unknown as ITransaction;
    } catch (error) {
      throw error;
    }
  }

  async update(transactionId: number): Promise<ITransaction | void> {
    try {
      await this.db.transaction(async (txn) => {
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
          if (book && transaction.status === "Returned") {
            throw new Error("This book is already returned");
          }
          if (book && transaction.status === "Issued") {
            const [result] = await txn.update(transactions).set({
              status: "Returned",
              returnDate: formatDate(new Date()),
            });

            if (result.affectedRows === 1) {
              const updatedTransaction = await this.getById(transactionId);
              return updatedTransaction;
            }
          }
        }
      });
    } catch (error) {
      throw error;
    }
  }

  async delete(transactionId: number): Promise<ITransaction | undefined> {
    try {
      const deletedTransaction = await this.getById(transactionId);
      const [result] = await this.db
        .delete(transactions)
        .where(eq(transactions.id, transactionId));
      if (result && result.affectedRows > 0) {
        return deletedTransaction as ITransaction;
      }
    } catch (error) {
      throw error;
    }
  }

  async getById(transactionId: number): Promise<ITransaction | undefined> {
    try {
      const [transaction] = await this.db
        .select()
        .from(transactions)
        .where(eq(transactions.id, transactionId));
      return transaction as unknown as ITransaction;
    } catch (error) {
      throw error;
    }
  }

  async list(
    params: IPageRequest
  ): Promise<IPagesResponse<ITransaction> | undefined> {
    try {
      const { limit, offset, search } = params;
      const searchFilter = search
        ? or(
            like(transactions.bookId, `%${search}%`),
            like(transactions.memberId, `%${search}%`)
          )
        : undefined;
      const totalCount = await this.getTotalCount();
      if (!totalCount) throw new Error("Could not fetch the count");
      const [result] = await this.db
        .select()
        .from(transactions)
        .where(searchFilter)
        .offset(offset)
        .limit(limit);
      if (result) {
        return {
          items: result as unknown as ITransaction[],
          pagination: {
            offset,
            limit,
            total: totalCount,
          },
        };
      }
    } catch (error) {
      throw error;
    }
  }

  async deleteAll() {
    try {
      const [result] = await this.db.delete(transactions);
      if (result.affectedRows > 0) {
        return result;
      }
    } catch (error) {
      throw error;
    }
  }

  async getTotalCount() {
    try {
      const [totalCount] = await this.db
        .select({ value: count() })
        .from(transactions);
      return totalCount.value;
    } catch (error) {
      throw error;
    }
  }
  async getAllTransaction(): Promise<ITransaction[]> {
    try {
      const result = await this.db.select().from(transactions);

      return result as unknown as ITransaction[];
    } catch (error) {
      throw error;
    }
  }

  async getTransactionByDate(date: string) {
    try {
      const todaysDueList = await this.db
        .select()
        .from(transactions)
        .where(or(like(transactions.dueDate, `%${date}%`)));
      return todaysDueList;
    } catch (error) {
      throw error;
    }
  }
}
