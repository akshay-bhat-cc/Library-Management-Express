import { IMemberBase } from "../../models/member.model";
import { Language, User } from "../custom";
export {};

declare global {
  namespace Express {
    export interface Request {
      token: string | jwt.JwtPayload;
      userId: number;
    }
  }
}
