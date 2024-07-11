import { IBook } from "../book-management/models/books.model";
import { LibraryDB } from "./library-db";
import { WhereExpression } from "../core/types";
import { DBConfig } from "./mysqldb";
import { AppEnvs } from "../read-env";
import { ResultSetHeader, RowDataPacket } from "mysql2";

describe("Library-ds Tests", () => {
  const config: DBConfig = {
    dbURL: AppEnvs.DATABASE_URL,
  };
  const libraryDB = new LibraryDB(config);
  test("Insert Record", async () => {
    const book: IBook = {
      id: 301,
      title: "Jai Hind",
      author: "Akshay",
      genre: "Politics",
      pages: 200,
      availableCopies: 3,
      totalCopies: 10,
      publisher: "Hindustan",
      isbnNo: "1234567890098",
    };

    const result = await libraryDB.insert<RowDataPacket[], IBook>(
      book,
      "books"
    );
    console.log(result);
  });

  test("Select Record", async () => {
    const titleIsJaiHind: WhereExpression<IBook> = {
      title: {
        value: "Jai Hind",
        op: "EQUALS",
      },
    };
    const result = await libraryDB.select(
      "books",
      titleIsJaiHind,
      ["id", "title"],
      0,
      10
    );
    console.log(result);
  });

  test("Update Record", async () => {
    const book: Partial<IBook> = {
      title: "Namaste Karnataka",
    };
    const whereClause: WhereExpression<IBook> = {
      title: {
        value: "Jai Hind",
        op: "EQUALS",
      },
    };
    const result = await libraryDB.update(book, "books", whereClause);
    console.log(result);

    const titleIsJaiHind: WhereExpression<IBook> = {
      title: {
        value: "Namaste Karnataka",
        op: "EQUALS",
      },
    };
    const updatedResult = await libraryDB.select(
      "books",
      titleIsJaiHind,
      ["id", "title"],
      0,
      10
    );
    console.log(updatedResult);
  });

  test("Delete Record", async () => {
    const titleIsNamasteKarnataka: WhereExpression<IBook> = {
      title: {
        value: "Namaste Karnataka",
        op: "EQUALS",
      },
    };
    const result = await libraryDB.deleteRecord<ResultSetHeader, IBook>(
      "books",
      titleIsNamasteKarnataka
    );
    console.log(result);
  });

  test("Get Record by Id", async () => {
    const id: WhereExpression<IBook> = {
      id: {
        value: 1,
        op: "EQUALS",
      },
    };

    const result = await libraryDB.select<RowDataPacket[], IBook>(
      "books",
      id,
      ["author"],
      0,
      1
    );
    console.log(result);
  });
});
