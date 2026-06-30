import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

const NOMBA_WEBHOOK_SECRET = "NombaHackathon2026";

function buildHashingPayload(payload: any, timestamp: string): string {
  const eventType = payload?.event_type ?? "";
  const requestId = payload?.requestId ?? "";

  const merchant = payload?.data?.merchant ?? {};
  const transaction = payload?.data?.transaction ?? {};

  const userId = merchant?.userId ?? "";
  const walletId = merchant?.walletId ?? "";
  const transactionId = transaction?.transactionId ?? "";
  const transactionType = transaction?.type ?? "";
  const transactionTime = transaction?.time ?? "";

  let responseCode = transaction?.responseCode ?? "";
  if (responseCode === "null") responseCode = "";

  return [
    eventType,
    requestId,
    userId,
    walletId,
    transactionId,
    transactionType,
    transactionTime,
    responseCode,
    timestamp,
  ].join(":");
}

export const verifyNombaSignature = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const signature = req.headers["nomba-signature"];
  const timestamp = req.headers["nomba-timestamp"];

  if (!signature || typeof signature !== "string") {
    res.status(401).json({
      success: false,
      message: "Missing webhook signature",
    });
    return;
  }

  if (!timestamp || typeof timestamp !== "string") {
    res.status(401).json({
      success: false,
      message: "Missing webhook timestamp",
    });
    return;
  }


  const rawBody = req.body as Buffer;
  const parsedPayload = JSON.parse(rawBody.toString("utf8"));

  const hashingPayload = buildHashingPayload(parsedPayload, timestamp);

  const expectedSignature = crypto
    .createHmac("sha256", NOMBA_WEBHOOK_SECRET)
    .update(hashingPayload)
    .digest("base64");

  const expectedBuffer = Buffer.from(expectedSignature, "base64");
  const receivedBuffer = Buffer.from(signature, "base64");

  const isValid =
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

  if (!isValid) {
    console.warn("NOMBA WEBHOOK — signature mismatch", {
      expected: expectedSignature,
      received: signature,
      hashingPayload,
    });

    res.status(401).json({
      success: false,
      message: "Invalid webhook signature",
    });
    return;
  }


  req.body = parsedPayload;

  next();
};