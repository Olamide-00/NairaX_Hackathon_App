import { Router } from "express";
import { chat } from "../../controllers/main/ai/ai.controller";
import { protect } from "../../middlewares/auth.middleware";

const router = Router();

router.post("/chat", protect, chat);

export default router;