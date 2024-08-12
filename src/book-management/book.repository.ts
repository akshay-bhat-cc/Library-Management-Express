import { IPageRequest, IPagesResponse } from "../core/pagination";
import { IRepository } from "../core/repository";
import { IBook, IBookBase } from "./models/books.model";
import { MySql2Database } from "drizzle-orm/mysql2";
import { count, eq, like, or, sql } from "drizzle-orm";
import { books } from "../db/drizzle/schema";

export class BookRepository implements IRepository<IBookBase, IBook> {
  constructor(private db: MySql2Database<Record<string, never>>) {}
  async create(data: IBookBase): Promise<IBook | void> {
    try {
      const [insertedBook] = await this.db
        .insert(books)
        .values({
          ...data,
          availableCopies: data.totalCopies,
        })
        .$returningId();

      const book = await this.getById(insertedBook.id);
      return book as IBook;
    } catch (error) {
      throw error;
    }
  }

  async update(
    bookId: number,
    data: Partial<IBook>
  ): Promise<IBook | undefined> {
    try {
      const [result] = await this.db
        .update(books)
        .set(data)
        .where(eq(books.id, bookId));
      if (result.affectedRows === 1) {
        const updatedBook = await this.getById(bookId);
        return updatedBook as IBook;
      }
    } catch (error) {
      throw error;
    }
  }

  async delete(bookId: number): Promise<IBook | undefined> {
    try {
      const deletedBook = await this.getById(bookId);

      const [result] = await this.db.delete(books).where(eq(books.id, bookId));
      if (result.affectedRows === 1) {
        return deletedBook as IBook;
      }
    } catch (error) {
      throw error;
    }
  }

  async list(params: IPageRequest): Promise<IPagesResponse<IBook> | undefined> {
    try {
      const { limit, offset, search } = params;
      const searchFilter = search
        ? or(
            like(books.isbnNo, `%${search}%`),
            like(books.title, `%${search}%`)
          )
        : undefined;
      const totalCount = await this.getTotalCount();
      if (!totalCount) throw new Error("Could not fetch the count");
      const result = await this.db
        .select()
        .from(books)
        .where(searchFilter)
        .offset(offset)
        .limit(limit);
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
    }
  }

  async deleteAll() {
    try {
      const [result] = await this.db.delete(books);
      if (result.affectedRows > 0) {
        return result;
      }
    } catch (error) {
      throw error;
    }
  }

  async getTotalCount() {
    try {
      const [totalCount] = await this.db.select({ value: count() }).from(books);
      return totalCount.value;
    } catch (error) {
      throw error;
    }
  }

  async getById(bookId: number): Promise<IBook | undefined> {
    try {
      const [book] = await this.db
        .select()
        .from(books)
        .where(eq(books.id, bookId));
      return book as IBook;
    } catch (error) {
      throw error;
    }
  }

  async getByIsbnNumber(isbnNo: string): Promise<IBook> {
    try {
      const [book] = await this.db
        .select()
        .from(books)
        .where(eq(books.isbnNo, isbnNo));
      return book as IBook;
    } catch (error) {
      throw error;
    }
  }
}
