import { NextFunction, Request, Response } from "express";
import { CustomRequest, memberRepository } from "../members.express.server";

export const deleteUser = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    if (id != req.userId) {
      res.status(401).json({ message: "Forbidden" });
    }
    const deleted = await memberRepository.delete(id);
    if (!deleted) {
      return res
        .status(404)
        .json({ message: "User not found or deletion failed" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    next(err);
  }
};
