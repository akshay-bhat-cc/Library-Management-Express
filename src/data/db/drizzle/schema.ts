import {
  bigint,
  int,
  mysqlEnum,
  mysqlTable,
  serial,
  varchar,
} from "drizzle-orm/mysql-core";

export const books = mysqlTable("books", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  author: varchar("author", { length: 255 }).notNull(),
  publisher: varchar("publisher", { length: 255 }).notNull(),
  genre: varchar("genre", { length: 255 }).notNull(),
  isbnNo: varchar("isbnNo", { length: 13 }).notNull(),
  pages: int("pages").notNull(),
  totalCopies: int("totalCopies").notNull(),
  availableCopies: int("availableCopies").notNull(),
});

export const members = mysqlTable("members", {
  id: serial("id").primaryKey(),
  firstName: varchar("firstName", { length: 255 }).notNull(),
  lastName: varchar("lastName", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  phoneNumber: varchar("phoneNumber", { length: 10 }).notNull(),
});

export const transactions = mysqlTable("transactions", {
  id: serial("id").primaryKey(),
  bookId: bigint("bookId", { mode: "bigint", unsigned: true })
    .references(() => books.id)
    .notNull(),
  memberId: bigint("memberId", { mode: "bigint", unsigned: true })
    .references(() => members.id)
    .notNull(),
  issueDate: varchar("issueDate", { length: 100 }).notNull(),
  dueDays: int("dueDays").notNull(),
  dueDate: varchar("dueDate", { length: 100 }).notNull(),
  returnDate: varchar("returnDate", { length: 100 }),
  status: mysqlEnum("Status", ["Issued", "Returned", "OverDue"]),
});
