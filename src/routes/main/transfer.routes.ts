import { Router } from "express";
import {
  getBanks,
  lookupAccount,
  makeTransfer,
} from "../../controllers/main/transfer.controller";
import { protect } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middlwware";
import {
    makeTransferSchema,
    lookupAccountSchema
} from "../../validations/transfer.schema"

const router = Router();

// Public
router.get("/banks", getBanks);

// Protected
router.post(
  "/lookup",
  protect,
  validate(lookupAccountSchema),
  lookupAccount
);

router.post(
  "/send",
  protect,
  validate(makeTransferSchema),
  makeTransfer
);

export default router;