import { NextFunction, Request, Response } from "express";
import { memberRepository } from "../members.express.server";

export const getUserDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    if (id != req.userId) {
      res.status(401).json({ message: "Unauthorized" });
    }
    const user = await memberRepository.getById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
};
