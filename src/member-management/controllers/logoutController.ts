import { userRefreshTokenRepository } from "../members.express.server";
import { Request, Response } from "express";

export const handleLogout = async (req: Request, res: Response) => {
  // On client, also delete the accessToken

  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); //No content
  const refreshToken = cookies.jwt;

  // Is refreshToken in db?
  const foundUser =
    await userRefreshTokenRepository.getByRefreshToken(refreshToken);
  if (!foundUser) {
    res.clearCookie("jwt", { httpOnly: true, sameSite: "none", secure: true });
    return res.sendStatus(204);
  }

  // Delete refreshToken in db
  await userRefreshTokenRepository.deleteByRefreshToken(refreshToken);

  res.clearCookie("jwt", { httpOnly: true, sameSite: "none", secure: true });
  res.sendStatus(204);
};
