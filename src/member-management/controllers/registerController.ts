import { Request, Response } from "express";
import { memberSchema } from "../models/member.model";
import bcrypt from "bcrypt";
import { memberRepository } from "../members.express.server";

export const handleNewMember = async (request: Request, response: Response) => {
  try {
    const data = request.body;
    const validateData = memberSchema.parse(data);
    validateData.password = await bcrypt.hash(validateData.password, 10);
    const member = await memberRepository.create(validateData);
    response.status(201).json({
      message: "Member created successfully",
      memberId: member?.id,
    });
  } catch (error) {
    response.status(500).json({
      message: "An error occurred while creating the member",
      error: (error as Error).message,
    });
  }
};
