import { Request, Response } from "express";
import * as AuthService from "../../services/auth/auth.service";
import { catchAsync, sendSuccess } from "../../utils/response.utils";
import { HTTP } from "../..";

export const register = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.register(req.body);
  sendSuccess(res, result, HTTP.CREATED);
});

export const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.verifyEmail(req.body.email, req.body.otp);
  sendSuccess(res, result);
});

export const resendOtp = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.resendOtp(req.body.email);
  sendSuccess(res, result);
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.login(req.body);
  sendSuccess(res, result);
});

export const refresh = catchAsync(async (req: Request, res: Response) => {
  const tokens = await AuthService.refreshTokens(req.body.refreshToken);
  sendSuccess(res, tokens);
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  await AuthService.logout(String(req.user!._id));
  sendSuccess(res, { message: "Logged out successfully" });
});

export const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = AuthService.getMe(req.user!);
  sendSuccess(res, { user });
});
