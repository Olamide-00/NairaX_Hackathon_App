import { Request, Response } from "express";
import { randomUUID } from "crypto";

import { Wallet } from "../../models/wallet.model";
// import { User } from "../../models/user.model";

import { confirmPinSchema } from "../../validations/pin.schema";



export const confirmPin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const parsed = confirmPinSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(422).json({
        success: false,
        errors: parsed.error.flatten(),
      });
      return;
    }

    const { pin } = parsed.data;

    const wallet = await Wallet.findOne({ userId: req.user._id }).select("+pin");

    if (!wallet) {
      res.status(404).json({ success: false, message: "Wallet not found" });
      return;
    }

    const isMatch = await wallet.comparePin(pin);

    if (!isMatch) {
      res.status(401).json({ success: false, message: "Incorrect PIN" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "PIN confirmed",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "PIN confirmation failed",
    });
  }
};