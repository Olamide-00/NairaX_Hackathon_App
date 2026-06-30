import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

const NOMBA_WEBHOOK_SECRET = process.env.NOMBA_WEBHOOK_SECRET;

if (!NOMBA_WEBHOOK_SECRET) {
  throw new Error("NOMBA_WEBHOOK_SECRET is missing in environment variables");
}


function buildHashingPayload(
  payload: any,
  timestamp: string
): string {

  const eventType = payload?.event_type ?? "";
  const requestId = payload?.requestId ?? "";

  const merchant = payload?.data?.merchant ?? {};
  const transaction = payload?.data?.transaction ?? {};

  const userId = merchant?.userId ?? "";
  const walletId = merchant?.walletId ?? "";

  const transactionId =
    transaction?.transactionId ?? "";

  const transactionType =
    transaction?.type ?? "";

  const transactionTime =
    transaction?.time ?? "";


  let responseCode =
    transaction?.responseCode ?? "";

  if (responseCode === "null") {
    responseCode = "";
  }


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

  try {

    const signature =
      req.headers["nomba-signature"];

    const timestamp =
      req.headers["nomba-timestamp"];


    if (
      !signature ||
      typeof signature !== "string"
    ) {
      res.status(401).json({
        success: false,
        message: "Missing webhook signature",
      });
      return;
    }


    if (
      !timestamp ||
      typeof timestamp !== "string"
    ) {
      res.status(401).json({
        success: false,
        message: "Missing webhook timestamp",
      });
      return;
    }



    const rawBody = req.body as Buffer;


    const parsedPayload =
      JSON.parse(
        rawBody.toString("utf8")
      );



    const hashingPayload =
      buildHashingPayload(
        parsedPayload,
        timestamp
      );



    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          NOMBA_WEBHOOK_SECRET
        )
        .update(hashingPayload)
        .digest("base64");



    const expectedBuffer =
      Buffer.from(
        expectedSignature,
        "base64"
      );


    const receivedBuffer =
      Buffer.from(
        signature,
        "base64"
      );



    const isValid =
      expectedBuffer.length === receivedBuffer.length &&
      crypto.timingSafeEqual(
        expectedBuffer,
        receivedBuffer
      );



    if (!isValid) {

      console.warn(
        "NOMBA WEBHOOK - Invalid signature",
        {
          received: signature,
          expected: expectedSignature,
        }
      );


      res.status(401).json({
        success: false,
        message: "Invalid webhook signature",
      });

      return;
    }



   
    req.body = parsedPayload;


    next();


  } catch (error) {

    console.error(
      "NOMBA SIGNATURE ERROR:",
      error
    );


    res.status(400).json({
      success: false,
      message: "Invalid webhook payload",
    });

  }

};