import { Request, Response } from "express";
import { memberRepository } from "../members.express.server";

export const handleLogout = async (req: Request, res: Response) => {
  // On client, also delete the accessToken

  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); //No content
  const refreshToken = cookies.jwt;

  // Is refreshToken in db?
  const foundUser = await memberRepository.getByRefreshToken(refreshToken);
  if (!foundUser) {
    res.clearCookie("jwt", { httpOnly: true, sameSite: "none", secure: true });
    return res.sendStatus(204);
  }

  // Delete refreshToken in db

  const currentUser = await memberRepository.update(foundUser.id, {
    refreshToken: null,
  });

  res.clearCookie("jwt", { httpOnly: true, sameSite: "none", secure: true });
  res.sendStatus(204);
};

module.exports = { handleLogout };
