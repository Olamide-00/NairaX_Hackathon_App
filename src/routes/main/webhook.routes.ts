import {Router} from "express";
import { nombaWebhook } from "../../webhook/nomba.webhook";


const router=Router();


router.post(
 "/nomba",
 nombaWebhook
);


export default router;