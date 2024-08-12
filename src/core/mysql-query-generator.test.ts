import { describe, test, expect } from "vitest";
import { IBook, IBookBase } from "../book-management/models/books.model";
import {
  generateCountSql,
  generateDeleteSql,
  generateInsertSql,
  generateSelectSql,
  generateUpdateSql,
  generateWhereClauseSql,
} from "./mysql-query-generator";
import {
  OrWhereExpression,
  SimpleWhereExpression,
  WhereExpression,
} from "./types";

describe("Test SQL generator with queries on Book DB", () => {
  test("where clause generation", () => {
    const whereCondition: SimpleWhereExpression<IBook> = {
      author: {
        op: "CONTAINS",
        value: "Sudha Murthy",
      },
    };
    const queryStr = generateWhereClauseSql<IBook>(whereCondition);
    expect(queryStr.sql).toEqual("(`author` LIKE ?)");
    const authAndPublisher: SimpleWhereExpression<IBook> = {
      author: {
        op: "CONTAINS",
        value: "Sudha Murthy",
      },
      publisher: {
        op: "EQUALS",
        value: "Penguin UK",
      },
    };
    const authAndPublisherQuery =
      generateWhereClauseSql<IBook>(authAndPublisher);
    expect(authAndPublisherQuery.sql).toEqual(
      "(`author` LIKE ? AND `publisher` = ?)"
    );
    //(`author`  LIKE  "%Sudha Murthy%" AND `publisher`  =  "Penguin UK") OR ('totalNumOfCOpies' >= 10)
    const authAndPublisherOrCopies: OrWhereExpression<IBook> = {
      OR: [
        {
          author: {
            op: "CONTAINS",
            value: "Sudha Murthy",
          },
          publisher: {
            op: "CONTAINS",
            value: "Penguine UK",
          },
        },
        {
          totalCopies: {
            op: "GREATER_THAN_EQUALS",
            value: 10,
          },
        },
      ],
    };

    const authAndPublisherOrCopiesClause = generateWhereClauseSql(
      authAndPublisherOrCopies
    );

    console.log(authAndPublisherOrCopiesClause);

    const authorOrPublisher: OrWhereExpression<IBook> = {
      OR: [
        {
          author: {
            value: "Sudha murthy",
            op: "CONTAINS",
          },
        },
        {
          publisher: {
            value: "Penguine",
            op: "EQUALS",
          },
        },
      ],
    };

    const authorOrPublisherClause = generateWhereClauseSql(authorOrPublisher);
    console.log(authorOrPublisherClause);
    const authorOrTotalCopies: OrWhereExpression<IBook> = {
      OR: [
        {
          author: {
            value: "sudha murthy",
            op: "EQUALS",
          },
        },

        {
          totalCopies: {
            value: 10,
            op: "GREATER_THAN_EQUALS",
          },
        },
      ],
    };
    const authorOrTotalCopiesCluase =
      generateWhereClauseSql(authorOrTotalCopies);
    console.log(authorOrTotalCopiesCluase);

    const totalNumOfCopiessIsNull: SimpleWhereExpression<IBook> = {
      totalCopies: {
        value: null,
        op: "EQUALS",
      },
    };
    const totalNumOfCopiesIsNullClause = generateWhereClauseSql(
      totalNumOfCopiessIsNull
    );
    console.log(totalNumOfCopiesIsNullClause);

    const titleORtitle: WhereExpression<IBook> = {
      OR: [
        {
          title: {
            value: "Mukajjiya kanasugalu",
            op: "EQUALS",
          },
        },
        {
          publisher: {
            value: "appa andre akasha",
            op: "ENDS_WITH",
          },
        },
        {
          AND: [
            {
              title: {
                value: "AKshay",
                op: "EQUALS",
              },
            },
          ],
        },
      ],
    };
    const titleORtitleClause = generateWhereClauseSql(titleORtitle);
    console.log(titleORtitleClause);
  });

  test("Insert Query", () => {
    const book: IBookBase = {
      title: "Jai Hind",
      author: "Sudha Murthy",
      publisher: "Penguine",
      genre: "Non-fiction",
      isbnNo: "1234567890098",
      pages: 200,
      totalCopies: 10,
    };

    const insertBookQuery = generateInsertSql("Books", book);
    console.log(insertBookQuery);
  });

  test("Select Query", () => {
    const genreIsComputer: SimpleWhereExpression<IBook> = {
      genre: {
        value: "Computers",
        op: "EQUALS",
      },
    };
    const computersgenreClause = generateSelectSql<IBook>(
      "books",
      genreIsComputer,
      [],
      1,
      10
    );
    console.log(computersgenreClause);
  });

  test("Select Query", () => {
    const selectQuery = generateSelectSql<IBookBase>(
      "books",
      {},
      ["author"],
      0,
      10
    );
    console.log(selectQuery);
  });

  test("Delete Query", () => {
    const whereClause: WhereExpression<IBook> = {
      OR: [
        {
          title: {
            value: "Akshay",
            op: "CONTAINS",
          },
        },
        {
          publisher: {
            value: "Penguine",
            op: "EQUALS",
          },
        },
      ],
    };
    const deleteQuery = generateDeleteSql("Books", whereClause);
    console.log(deleteQuery);
  });

  test("Update Query", () => {
    const updateBook: Partial<IBook> = {
      title: "Meghalya",
      pages: 300,
    };
    const whereClause: WhereExpression<IBook> = {
      title: {
        value: "Jai Hind",
        op: "CONTAINS",
      },
    };
    const result = generateUpdateSql<IBook>("books", updateBook, whereClause);
    console.log(result);
  });

  test("NOT IN Query", () => {
    const whereClause: WhereExpression<IBook> = {
      title: {
        op: "NOT_IN",
        value: ["Jai Hind", "Vande Matram", true, false, null],
      },
    };

    const where = generateWhereClauseSql(whereClause);
    const selectQuery = generateSelectSql("books", whereClause, [], 0, 10);
    console.log(where);
    console.log(selectQuery);
  });

  test("Count query", () => {
    const result = generateCountSql<IBook>("books", {});
    console.log(result.sql);
  });
});
