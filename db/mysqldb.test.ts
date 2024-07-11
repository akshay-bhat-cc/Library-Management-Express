import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { IBook, IBookBase } from "../book-management/models/books.model";
import {
  generateInsertSql,
  generateSelectSql,
  generateUpdateSql,
} from "../core/mysql-query-generator";
import { printTableWithoutIndex } from "../core/printTableFormat";
import { AppEnvs } from "../read-env";
import { DBConfig, MySQLAdapter } from "./mysqldb";
import { NestedQuery, UpdateColumnSet, WhereExpression } from "../core/types";
describe("MySQL DB Adapter tests", () => {
  const config: DBConfig = {
    dbURL: AppEnvs.DATABASE_URL,
  };
  const db = new MySQLAdapter(config);
  afterAll(async () => {
    await db.shutDown();
  });
  test("Insert Query Tests", async () => {
    const book: IBookBase = {
      title: "Jai Hind",
      author: "Sudha Murthy",
      publisher: "Penguine",
      genre: "Non-fiction",
      isbnNo: "1234567890098",
      pages: 300,
      totalCopies: 10,
    };

    const insertBookQuery = generateInsertSql("books", book);
    console.log(insertBookQuery);
    const result = await db.runQuery(insertBookQuery.sql, insertBookQuery.data);
    console.log(result);
  });

  test("SELECT", async () => {
    const selectQuery = generateSelectSql<IBookBase>("books", {}, [], 0, 10);

    console.log(selectQuery);

    const result = await db.runQuery(selectQuery.sql, selectQuery.data);
    console.log(
      printTableWithoutIndex(result as (ResultSetHeader | RowDataPacket[])[])
    );
  });

  test("Update Query tests", async () => {
    const whereClause: WhereExpression<IBook> = {
      title: {
        value: "Jai Hind",
        op: "EQUALS",
      },
      OR: [
        {
          author: {
            value: "Akshay",
            op: "CONTAINS",
          },
        },
      ],
    };

    const row: UpdateColumnSet<IBook> = {
      title: "Mookajjiya kanasugalu",
    };

    const updateQuery = generateUpdateSql<IBook>("books", row, whereClause);
    console.log(updateQuery);
    const result = await db.runQuery(updateQuery.sql, updateQuery.data);
    console.log(result);
  });

  test("Where clause test", async () => {
    const sql = "UPDATE `books` SET title = ? WHERE (`title`  =  ?)";
    const data = ["Vande Matram", "Mookajjiya kanasugalu"];
    const result = await db.runQuery(sql, data);
    console.log(result);
  });

  test("NOT IN Query", async () => {
    const authorIsSudhaMurthy: WhereExpression<IBook> = {
      author: {
        value: "Sudha Murthy",
        op: "EQUALS",
      },
    };
    const idIs342: WhereExpression<IBook> = {
      id: {
        value: 342,
        op: "EQUALS",
      },
    };
    const nestedQuery1: NestedQuery<IBook> = {
      tableName: "books",
      selectedField: ["id"],
      where: idIs342,
    };
    const nestedQuery2: NestedQuery<IBook> = {
      tableName: "books",
      selectedField: ["id", "author"],
      where: authorIsSudhaMurthy,
    };

    const whereClause: WhereExpression<IBook> = {
      id: {
        op: "IN",
        value: [nestedQuery1, nestedQuery2, 100],
      },
      author: {
        op: "CONTAINS",
        value: "Sudha Murthy",
      },
    };

    const selectQuery = generateSelectSql("books", whereClause);
    console.log(selectQuery);
    const result = await db.runQuery(selectQuery.sql, selectQuery.data);
    console.log(result);
  });
});
