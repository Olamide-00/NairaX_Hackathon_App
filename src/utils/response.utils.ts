import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code?: string,
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

/** Wraps async route handlers — eliminates try/catch boilerplate */
export const catchAsync =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res, next).catch(next);

/** Standard success response shape */
export const sendSuccess = (
  res: Response,
  data: unknown,
  statusCode = 200,
  meta?: Record<string, unknown>,
) => {
  res.status(statusCode).json({ success: true, data, ...(meta && { meta }) });
};
