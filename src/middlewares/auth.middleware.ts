import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.utils";
import { User, IUser } from "../models/user.model";
import { AppError } from "../utils/response.utils";
import { HTTP } from "..";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const protect = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  // ── LOG 1: Every incoming request ─────────────────────────────────────────
  console.log("=== [protect] middleware hit ===");
  console.log("[protect] method:", req.method);
  console.log("[protect] url:", req.originalUrl);
  console.log("[protect] authorization header:", req.headers.authorization ?? "❌ MISSING");

  try {
    const header = req.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      // ── LOG 2: No token at all ─────────────────────────────────────────
      console.log("[protect] ❌ No Bearer token found in Authorization header");
      console.log("[protect] All headers received:", JSON.stringify(req.headers, null, 2));
      throw new AppError("No token provided", HTTP.UNAUTHORIZED, "NO_TOKEN");
    }

    const token = header.split(" ")[1];

    // ── LOG 3: Token found, attempting verify ──────────────────────────────
    console.log("[protect] ✅ Token found, length:", token.length);
    console.log("[protect] Token preview:", `${token.slice(0, 20)}...`);

    let decoded: { userId: string };
    try {
      decoded = verifyAccessToken(token);
      console.log("[protect] ✅ Token verified, userId:", decoded.userId);
    } catch (verifyErr: any) {
      // ── LOG 4: Token verification failed ────────────────────────────────
      console.log("[protect] ❌ Token verification failed:", verifyErr.name, verifyErr.message);
      throw verifyErr;
    }

    const { userId } = decoded;
    const user = await User.findById(userId);

    // ── LOG 5: User lookup result ──────────────────────────────────────────
    console.log("[protect] User lookup result:", {
      found: !!user,
      isActive: user?.isActive ?? "N/A",
      isVerified: user?.isVerified ?? "N/A",
      userId,
    });

    if (!user || !user.isActive) {
      console.log("[protect] ❌ User not found or inactive");
      throw new AppError(
        "User not found or inactive",
        HTTP.UNAUTHORIZED,
        "INVALID_USER",
      );
    }

    // ── LOG 6: All good ────────────────────────────────────────────────────
    console.log("[protect] ✅ Auth passed, calling next()");
    req.user = user;
    next();

  } catch (err: unknown) {
    if (err instanceof AppError) return next(err);

    const name = (err as Error).name;
    console.log("[protect] ❌ Caught error:", name, (err as Error).message);

    if (name === "TokenExpiredError") {
      return next(
        new AppError("Token expired", HTTP.UNAUTHORIZED, "TOKEN_EXPIRED"),
      );
    }
    if (name === "JsonWebTokenError") {
      return next(
        new AppError("Invalid token", HTTP.UNAUTHORIZED, "INVALID_TOKEN"),
      );
    }
    next(err);
  }
};