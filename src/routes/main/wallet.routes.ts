import { Router } from "express";
import { setupAccount } from "../../controllers/main/wallet.controller";
import { protect } from "../../middlewares/auth.middleware"; // ← add this
import { validate } from "../../middlewares/validation.middlwware";
import { accountSetupRequestSchema } from "../../validations/wallet.schema";
import { confirmPinSchema } from "../../validations/pin.schema";
import { confirmPin } from "../../controllers/main/pin.controller";

const router = Router();

router.post(
  "/setup",
  protect,                              
  validate(accountSetupRequestSchema),  
  setupAccount,                         
);

router.post(
  "/confirm-pin",
  protect,
  validate(confirmPinSchema),
  confirmPin
);

export default router;