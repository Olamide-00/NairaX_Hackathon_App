import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    email: z.string().email(),
    password: z.string().min(8).max(128),
    phone: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

export const verifyEmailSchema = z.object({
  body: z.object({
    email: z.string().email(),
    otp: z.string().length(6).regex(/^\d+$/, "OTP must be numeric"),
  }),
});

export const resendOtpSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>["body"];
export type LoginInput = z.infer<typeof loginSchema>["body"];
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>["body"];
export type ResendOtpInput = z.infer<typeof resendOtpSchema>["body"];


