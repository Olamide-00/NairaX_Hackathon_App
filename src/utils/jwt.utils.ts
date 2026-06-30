import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export interface TokenPayload {
  userId: string;
  email?: string;
}

export function signAccessToken(payload: TokenPayload | string): string {
  const secret = process.env.JWT_ACCESS_SECRET;

  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET is missing from environment variables");
  }

  const tokenPayload =
    typeof payload === "string" ? { userId: payload } : payload;

  const expiry = process.env.JWT_ACCESS_EXPIRATION ?? "15m";

  return jwt.sign(tokenPayload, secret, {
    expiresIn: expiry as jwt.SignOptions["expiresIn"],
  });
}

export function signRefreshToken(payload: TokenPayload | string): string {
  const secret = process.env.JWT_REFRESH_SECRET;

  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET is missing from environment variables");
  }

  const tokenPayload =
    typeof payload === "string" ? { userId: payload } : payload;

  const expiry = process.env.JWT_REFRESH_EXPIRATION ?? "7d";

  return jwt.sign(tokenPayload, secret, {
    expiresIn: expiry as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET is not configured");
  return jwt.verify(token, secret) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error("JWT_REFRESH_SECRET is not configured");
  return jwt.verify(token, secret) as TokenPayload;
}