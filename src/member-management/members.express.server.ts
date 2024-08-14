import express, { Request } from "express";
import { getDB } from "../db/drizzle/drizzleDb";
import { MemberRepository } from "./member.repository";
import { BookRepository } from "../book-management/book.repository";
import cors from "cors";
import corsOptions from "../configs/corsOptions";
import cookieParser from "cookie-parser";
import memberRoutes from "./routes/memberRoutes";
import { UserRefreshTokenRepository } from "../User-RefresTokens/userRefreshTokens.repository";
import jwt from "jsonwebtoken";
export interface CustomRequest extends Request {
  token: string | jwt.JwtPayload;
  userId: number;
}

export const db = getDB();
export const memberRepository = new MemberRepository(db);
export const bookRepository = new BookRepository(db);
export const userRefreshTokenRepository = new UserRefreshTokenRepository(db);

const app = express();

app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

// Use the member routes
app.use("/library/members", memberRoutes);

app.get("/library/admin/deleteExpired", async (req, res) => {
  try {
    await userRefreshTokenRepository.deleteExpired();
    res.sendStatus(200);
  } catch (err) {
    console.log(err);
    res.sendStatus(404);
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
