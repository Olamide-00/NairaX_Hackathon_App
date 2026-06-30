import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/response.utils";
import { HTTP } from "..";

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.code && { code: err.code }),
    });
    return;
  }
  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyValue ?? {})[0];
    res.status(HTTP.CONFLICT).json({
      success: false,
      message: `${field} already in use`,
      code: "DUPLICATE_FIELD",
    });
    return;
  }
  if (err.name === "ValidationError") {
    res.status(HTTP.BAD_REQUEST).json({
      success: false,
      message: err.message,
      code: "VALIDATION_ERROR",
    });
    return;
  }

  // Fallback
  console.error("[Unhandled Error]", err);
  res.status(HTTP.INTERNAL).json({
    success: false,
    message: "Internal server error",
    code: "INTERNAL_ERROR",
  });
};
