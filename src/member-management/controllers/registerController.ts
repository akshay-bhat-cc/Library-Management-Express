import { memberSchema } from "../models/member.model";
import bcrypt from "bcrypt";
import { memberRepository } from "../members.express.server";
import { Request, Response } from "express";

export const handleNewMember = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const validateData = memberSchema.parse(data);
    validateData.password = await bcrypt.hash(validateData.password, 10);
    const member = await memberRepository.create(validateData);
    res.status(201).json({
      message: "Member created successfully",
      memberId: member?.id,
    });
  } catch (error) {
    res.status(500).json({
      message: "An error occurred while creating the member",
      error: (error as Error).message,
    });
  }
};
