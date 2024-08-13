import { IMemberBase } from "../../models/member.model";
import { Language, User } from "../custom";
export {};

declare global {
  namespace Express {
    export interface Request {
      userId: number;
      user: string;
    }
  }
}
