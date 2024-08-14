import jwt, { JwtPayload } from "jsonwebtoken";
import { Response } from "express";
import { getDB } from "../../db/drizzle/drizzleDb";
import { MemberRepository } from "../member.repository";
import { AppEnvs } from "../../../read-env";
import {
  CustomRequest,
  userRefreshTokenRepository,
} from "../members.express.server";

const db = getDB();
const memberRepository = new MemberRepository(db);

export const handleRefreshToken = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  const cookies = req.cookies;
  if (!cookies?.jwt) {
    res.sendStatus(401);
    return;
  }

  const refreshToken = cookies.jwt;

  try {
    const token =
      await userRefreshTokenRepository.getByRefreshToken(refreshToken);
    const foundUser = await memberRepository.getById(Number(token?.memberId));

    if (!foundUser) {
      res.sendStatus(403); // Forbidden
      return;
    }

    // Verify JWT
    jwt.verify(
      refreshToken,
      AppEnvs.REFRESH_TOKEN_SECRET,
      (err: Error | null, decoded: unknown) => {
        if (
          err ||
          !decoded ||
          typeof decoded === "string" ||
          (decoded as JwtPayload).id !== foundUser.id ||
          (decoded as JwtPayload).email !== foundUser.email
        ) {
          res.sendStatus(403); // Forbidden
          return;
        }

        const accessToken = jwt.sign(
          {
            id: (decoded as JwtPayload).id,
            email: (decoded as JwtPayload).email,
          },
          AppEnvs.ACCESS_TOKEN_SECRET,
          { expiresIn: "1m" }
        );

        res.json({ accessToken });
      }
    );
  } catch (error) {
    console.error("Error in handleRefreshToken:", error);
    res.sendStatus(500); // Internal Server Error
  }
};
