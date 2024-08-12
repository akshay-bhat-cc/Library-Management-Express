import { Request, Response } from "express";
import { AppEnvs } from "../../../read-env";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { memberRepository } from "../members.express.server";

export const handleLogin = async (request: Request, response: Response) => {
  try {
    const { email, password } = request.body;

    if (!email || !password) {
      return response
        .status(400)
        .json({ message: "Username and password are required." });
    }

    const foundUser = await memberRepository.getByEmail(email);

    if (!foundUser) {
      return response.sendStatus(401);
    }

    const match = await bcrypt.compare(password, foundUser.password);

    if (match) {
      const accessToken = jwt.sign(
        { id: foundUser.id, email: foundUser.email },
        AppEnvs.ACCESS_TOKEN_SECRET,
        { expiresIn: "30s" }
      );
      const refreshToken = jwt.sign(
        { id: foundUser.id, email: foundUser.email },
        AppEnvs.REFRESH_TOKEN_SECRET,
        { expiresIn: "1d" }
      );
      const user = await memberRepository.getByEmail(email);
      if (!user) {
        throw Error("User not found");
      }
      await memberRepository.update(user?.id, { refreshToken: refreshToken });
      response.cookie("jwt", refreshToken, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        maxAge: 24 * 60 * 60 * 1000,
      });

      response.json({ accessToken });
    } else {
      response.sendStatus(401);
    }
  } catch (error) {
    console.error("Error during login:", error);
    response.status(500).json({ message: "Internal server error." });
  }
};
