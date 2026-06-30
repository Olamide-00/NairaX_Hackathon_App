import { User, IUser } from "../../models/user.model";
import { AppError } from "../../utils/response.utils";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt.utils";
import { RegisterInput, LoginInput } from "../../validations/auth.schema";
import { HTTP } from "../..";
import {
  createOtp,
  verifyOtp,
  assertResendAllowed,
  OTP_EXPIRES_MINUTES,
} from "../main/email/otp.service";
import { emailService } from "../main/email/email.service";
import { otpTemplate, welcomeTemplate } from "../../templates/otp.template";
import dotenv from "dotenv";
dotenv.config();

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const sanitizeUser = (user: IUser) => ({
  id: user._id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  phone: user.phone,
  isVerified: user.isVerified,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
});

const issueTokens = async (user: IUser): Promise<AuthTokens> => {
  const accessToken = signAccessToken(String(user._id));
  const refreshToken = signRefreshToken(String(user._id));

  user.refreshToken = refreshToken;
  user.lastLoginAt = new Date();
  await user.save();

  return { accessToken, refreshToken };
};

// ─── Register ─────────────────────────────────────────────────────────────────

/**
 * Creates an unverified account, sends an OTP email.
 * No tokens are issued until the user verifies.
 */
export const register = async (input: RegisterInput) => {
  const existing = await User.findOne({ email: input.email });
  if (existing) {
    throw new AppError(
      "Email already registered",
      HTTP.CONFLICT,
      "EMAIL_TAKEN",
    );
  }

  const user = await User.create({
    ...input,
    isVerified: false,
    isActive: false,
  });

  const code = await createOtp(user._id);

  // Fire-and-forget — if email fails, we surface the error so the client can trigger a resend
  await emailService.send(
    user.email,
    otpTemplate(user.firstName, code, OTP_EXPIRES_MINUTES),
  );

  return {
    user: sanitizeUser(user),
    message:
      "Registration successful. Please check your email for a verification code.",
  };
};

// ─── Verify OTP (email verification) ─────────────────────────────────────────

export const verifyEmail = async (email: string, otp: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError("Account not found", HTTP.NOT_FOUND, "USER_NOT_FOUND");
  }

  if (user.isVerified) {
    throw new AppError(
      "Email is already verified",
      HTTP.BAD_REQUEST,
      "ALREADY_VERIFIED",
    );
  }

  await verifyOtp(user._id, otp);

  // Activate account
  user.isVerified = true;
  user.isActive = true;
  await user.save();

  // Send welcome email — non-blocking, failure doesn't affect the response
  emailService.send(user.email, welcomeTemplate(user.firstName)).catch(() => {
    /* already logged inside emailService */
  });

  const tokens = await issueTokens(user);

  return {
    user: sanitizeUser(user),
    ...tokens,
    message: "Email verified successfully.",
  };
};

// ─── Resend OTP ───────────────────────────────────────────────────────────────

export const resendOtp = async (email: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    // Return generic message to avoid email enumeration
    return { message: "If that email exists, a new OTP has been sent." };
  }

  if (user.isVerified) {
    throw new AppError(
      "Email is already verified",
      HTTP.BAD_REQUEST,
      "ALREADY_VERIFIED",
    );
  }

  await assertResendAllowed(user._id);

  const code = await createOtp(user._id);
  await emailService.send(
    user.email,
    otpTemplate(user.firstName, code, OTP_EXPIRES_MINUTES),
  );

  return { message: "If that email exists, a new OTP has been sent." };
};

// ─── Login ────────────────────────────────────────────────────────────────────

export const login = async ({ email, password }: LoginInput) => {
  const user = await User.findOne({ email }).select("+password +refreshToken");
  if (!user) {
    throw new AppError(
      "Invalid credentials",
      HTTP.UNAUTHORIZED,
      "INVALID_CREDENTIALS",
    );
  }

  if (!user.isVerified) {
    throw new AppError(
      "Email not verified. Please verify your account before logging in.",
      HTTP.FORBIDDEN,
      "EMAIL_NOT_VERIFIED",
    );
  }

  if (!user.isActive) {
    throw new AppError(
      "Account is deactivated",
      HTTP.FORBIDDEN,
      "ACCOUNT_INACTIVE",
    );
  }

  if (user.isLocked()) {
    throw new AppError(
      "Account temporarily locked. Try again later.",
      HTTP.TOO_MANY_REQUESTS,
      "ACCOUNT_LOCKED",
    );
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await user.incrementLoginAttempts();
    throw new AppError(
      "Invalid credentials",
      HTTP.UNAUTHORIZED,
      "INVALID_CREDENTIALS",
    );
  }

  await user.resetLoginAttempts();
  const tokens = await issueTokens(user);

  return { user: sanitizeUser(user), ...tokens };
};

// ─── Refresh Token ─────────────────────────────────────────────────────────────

export const refreshTokens = async (token: string): Promise<AuthTokens> => {
  let payload: { userId: string };

  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new AppError(
      "Invalid or expired refresh token",
      HTTP.UNAUTHORIZED,
      "INVALID_REFRESH_TOKEN",
    );
  }

  const user = await User.findById(payload.userId).select("+refreshToken");
  if (!user || user.refreshToken !== token) {
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
    throw new AppError(
      "Refresh token reuse detected",
      HTTP.UNAUTHORIZED,
      "TOKEN_REUSE",
    );
  }

  return issueTokens(user);
};

// ─── Logout ───────────────────────────────────────────────────────────────────

export const logout = async (userId: string) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};

// ─── Get Me ───────────────────────────────────────────────────────────────────

export const getMe = (user: IUser) => sanitizeUser(user);
