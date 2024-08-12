import express from "express";
import { getDB } from "../db/drizzle/drizzleDb";
import { MemberRepository } from "./member.repository";
import { BookRepository } from "../book-management/book.repository";
import cors from "cors";
import corsOptions from "../configs/corsOptions";
import cookieParser from "cookie-parser";
import memberRoutes from "./routes/memberRoutes";

export const db = getDB();
export const memberRepository = new MemberRepository(db);
export const bookRepository = new BookRepository(db);

const app = express();

app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

// Use the member routes
app.use("/library/members", memberRoutes);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
