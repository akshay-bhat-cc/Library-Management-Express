import { beforeEach, describe, expect, test, afterEach } from "vitest";
import { IBook, IBookBase } from "./models/books.model";
import { LibraryDB } from "../db/library-db";
import { DBConfig } from "../db/mysqldb";
import { AppEnvs } from "../read-env";
import { BookRepository } from "./book.repository";
import { MySqlConnectionFactory } from "../db/MySqlDbConnection";

describe("Book Repository Tests", () => {
  const config: DBConfig = {
    dbURL: AppEnvs.DATABASE_URL,
  };

  const bookRepository = new BookRepository(new MySqlConnectionFactory(config));
  test("Create Book", async () => {
    const book: IBookBase = {
      title: "The Rust Programming Language (Covers Rust 2018)",
      author: "Steve Klabnik, Carol Nichols",
      publisher: "No Starch Press",
      genre: "Computers",
      isbnNo: "9781718500457",
      pages: 561,
      totalCopies: 3,
    };
    const createdBook = await bookRepository.create(book);
    console.log(createdBook);
  });

  test("Update Book", async () => {
    const book: Partial<IBook> = {
      title: "The C Programming Language",
    };
    const updatedBook = await bookRepository.update(457, book);
    console.log(updatedBook);
  });

  test("Get Count", async () => {
    const result = await bookRepository.getTotalCount();
    console.log(result);
  });

  test("Delete Book", async () => {
    const result = await bookRepository.delete(457);
    console.log("Deleted book", result);
  });

  // test("Delete All books", async () => {
  //   const countBefore = await bookRepository.getTotalCount();
  //   console.log("Count Before", countBefore);
  //   const result = await bookRepository.deleteAll();
  //   console.log(result);
  //   const countAfter = await bookRepository.getTotalCount();
  //   console.log("Count After", countAfter);
  // });
});
