import { Request, Response } from "express";
import { ChatSession } from "../../../models/chatSession.model";
import { runAgent } from "../../../services/ai/ai.service";
import { catchAsync, AppError, sendSuccess } from "../../../utils/response.utils"

export const chat = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw new AppError("Unauthorized", 401);

  const { message } = req.body;
  if (!message || typeof message !== "string") {
    throw new AppError("message is required", 422);
  }

  let session = await ChatSession.findOne({ userId: req.user._id });
  if (!session) {
    session = await ChatSession.create({ userId: req.user._id, history: [] });
  }

  const reply = await runAgent(req.user._id.toString(), session, message);

  sendSuccess(res, { reply });
});