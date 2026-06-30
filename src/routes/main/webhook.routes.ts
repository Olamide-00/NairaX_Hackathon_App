import { Router, raw } from "express";
import { nombaWebhook } from "../../controllers/main/webhook.controller";
import { verifyNombaSignature } from "../../middlewares/verifyNomba.middleware";

const router = Router();

router.post(
  "/nomba",
  raw({ type: "application/json" }), 
  verifyNombaSignature,
  nombaWebhook
);

export default router;