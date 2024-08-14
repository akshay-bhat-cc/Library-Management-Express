import { AppEnvs } from "../../../read-env";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import {
  CustomRequest,
  memberRepository,
  userRefreshTokenRepository,
} from "../members.express.server";
import { Response } from "express";

export const handleLogin = async (req: CustomRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required." });
    }

    const foundUser = await memberRepository.getByEmail(email);

    if (!foundUser) {
      return res.sendStatus(401);
    }

    const match = await bcrypt.compare(password, foundUser.password);

    if (match) {
      const accessToken = jwt.sign(
        { id: foundUser.id, email: foundUser.email },
        AppEnvs.ACCESS_TOKEN_SECRET,
        { expiresIn: "1m" }
      );
      const refreshToken = jwt.sign(
        { id: foundUser.id, email: foundUser.email },
        AppEnvs.REFRESH_TOKEN_SECRET,
        { expiresIn: "1d" }
      );

      await userRefreshTokenRepository.create({
        memberId: BigInt(foundUser.id),
        refreshToken: refreshToken,
      });

      res.cookie("jwt", refreshToken, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.json({ accessToken });
    } else {
      res.sendStatus(401);
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
