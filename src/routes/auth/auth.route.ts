import { Router } from "express";
import * as AuthController from "../../controllers/auth/auth.controller";
import { validate } from "../../middlewares/validation.middlwware";
import { protect } from "../../middlewares/auth.middleware";

import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendOtpSchema,
  refreshTokenSchema,
} from "../../validations/auth.schema";


const router = Router();


// Public

router.post(
  "/register",
  validate(registerSchema),
  AuthController.register
);


router.post(
  "/verify-email",
  validate(verifyEmailSchema),
  AuthController.verifyEmail
);


router.post(
  "/resend-otp",
  validate(resendOtpSchema),
  AuthController.resendOtp
);


router.post(
  "/login",
  validate(loginSchema),
  AuthController.login
);


router.post(
  "/refresh",
  validate(refreshTokenSchema),
  AuthController.refresh
);



// Protected

router.post(
  "/logout",
  protect,
  AuthController.logout
);


router.get(
  "/me",
  protect,
  AuthController.getMe
);


export default router;