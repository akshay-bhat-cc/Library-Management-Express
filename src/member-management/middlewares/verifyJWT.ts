import jwt, { JwtPayload } from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { AppEnvs } from "../../../read-env";
import { memberRepository } from "../members.express.server";

export const verifyJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers["authorization"];
    console.log(authHeader);
    if (!authHeader) return res.sendStatus(401);
    console.log(authHeader); // Bearer token
    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, AppEnvs.ACCESS_TOKEN_SECRET);
    req.token = decoded;
    const user = await memberRepository.getById((decoded as JwtPayload).id);
    req.userId = user!.id;
    next();
  } catch (err) {
    res.status(401).send("Please authenticate");
  }
};
