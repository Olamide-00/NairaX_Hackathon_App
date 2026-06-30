import crypto from "crypto";
import { Types } from "mongoose";
import { Otp } from "../../../models/otp.model";
import { AppError } from "../../../utils/response.utils";
import { HTTP } from "../../..";

const OTP_LENGTH = 6;
const OTP_EXPIRES_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 60;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateCode = (): string =>
  crypto
    .randomInt(0, 10 ** OTP_LENGTH)
    .toString()
    .padStart(OTP_LENGTH, "0");

// ─── Create OTP ───────────────────────────────────────────────────────────────

/**
 * Deletes any previous OTP for the user and issues a fresh one.
 * Returns the plain-text code (caller is responsible for emailing it).
 */
export const createOtp = async (
  userId: Types.ObjectId | string,
): Promise<string> => {
  await Otp.deleteMany({ userId }); // one active OTP per user at a time

  const code = generateCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);

  await Otp.create({ userId, code, expiresAt });

  return code;
};

// ─── Verify OTP ───────────────────────────────────────────────────────────────

export const verifyOtp = async (
  userId: Types.ObjectId | string,
  submittedCode: string,
): Promise<void> => {
  const otp = await Otp.findOne({ userId });

  if (!otp) {
    throw new AppError(
      "No pending verification found. Please request a new OTP.",
      HTTP.BAD_REQUEST,
      "OTP_NOT_FOUND",
    );
  }

  if (otp.expiresAt < new Date()) {
    await otp.deleteOne();
    throw new AppError(
      "OTP has expired. Please request a new one.",
      HTTP.BAD_REQUEST,
      "OTP_EXPIRED",
    );
  }

  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    await otp.deleteOne();
    throw new AppError(
      "Too many failed attempts. Please request a new OTP.",
      HTTP.TOO_MANY_REQUESTS,
      "OTP_MAX_ATTEMPTS",
    );
  }

  if (otp.code !== submittedCode) {
    otp.attempts += 1;
    await otp.save();
    const remaining = OTP_MAX_ATTEMPTS - otp.attempts;
    throw new AppError(
      `Invalid OTP. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
      HTTP.BAD_REQUEST,
      "OTP_INVALID",
    );
  }

  // Valid — clean up
  await otp.deleteOne();
};

// ─── Resend Guard ─────────────────────────────────────────────────────────────

/**
 * Enforces a cooldown window before allowing a resend.
 * Throws if the user must wait longer.
 */
export const assertResendAllowed = async (
  userId: Types.ObjectId | string,
): Promise<void> => {
  const existing = await Otp.findOne({ userId });
  if (!existing) return; // no active OTP, resend is always fine

  const secondsSinceCreation =
    (Date.now() - existing.createdAt.getTime()) / 1000;
  if (secondsSinceCreation < OTP_RESEND_COOLDOWN_SECONDS) {
    const waitSeconds = Math.ceil(
      OTP_RESEND_COOLDOWN_SECONDS - secondsSinceCreation,
    );
    throw new AppError(
      `Please wait ${waitSeconds}s before requesting a new OTP.`,
      HTTP.TOO_MANY_REQUESTS,
      "OTP_RESEND_COOLDOWN",
    );
  }
};

export { OTP_EXPIRES_MINUTES };
