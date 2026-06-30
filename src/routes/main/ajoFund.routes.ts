import { Router } from "express";
import {
  createFund,
  joinFund,
  contributeToFund,
  getPublicFunds,
  getFundById,
  getMyFunds,
  getFundContributions,
} from "../../controllers/main/ajoFund.controller";
import { protect } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middlwware";
import {
  createFundSchema,
  joinFundSchema,
  contributeSchema,
} from "../../validations/ajoFund.schema";

const router = Router();

router.post("/create-fund", protect, validate(createFundSchema), createFund);

router.post("/join", protect, validate(joinFundSchema), joinFund);

router.post(
  "/:fundId/contribute",
  protect,
  validate(contributeSchema),
  contributeToFund
);

router.get("/", protect, getPublicFunds);
router.get("/mine", protect, getMyFunds);
router.get("/:fundId", protect, getFundById);
router.get("/:fundId/contributions", protect, getFundContributions);

export default router;