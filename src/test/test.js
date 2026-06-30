
const cryptoModule = require("crypto");

const secret = "NombaHackathon2026";
const timestamp = new Date().toISOString();

const payload = {
  event_type: "payment_success",
  requestId: "test-request-id-123",
  data: {
    merchant: {
      walletId: "6a42a07c520eee89a2994fd1",
      walletBalance: 1000,
      userId: "6a429ef9520eee89a2994fcf",
    },
    terminal: {},
    transaction: {
      aliasAccountNumber: "5674997971", 
      fee: 5,
      sessionId: "test-session",
      type: "vact_transfer",
      transactionId: `TEST-TXN-${Date.now()}`,
      aliasAccountName: "Test Account",
      responseCode: "",
      originatingFrom: "api",
      transactionAmount: 7000,
      narration: "Test funding",
      time: timestamp,
      aliasAccountReference: "test-ref",
      aliasAccountType: "VIRTUAL",
    },
    customer: {
      bankCode: "058",
      senderName: "Test Sender",
      bankName: "Test Bank",
      accountNumber: "0000000000",
    },
  },
};

const hashingPayload = [
  payload.event_type,
  payload.requestId,
  payload.data.merchant.userId,
  payload.data.merchant.walletId,
  payload.data.transaction.transactionId,
  payload.data.transaction.type,
  payload.data.transaction.time,
  payload.data.transaction.responseCode || "",
  timestamp,
].join(":");

const signature = cryptoModule
  .createHmac("sha256", secret)
  .update(hashingPayload)
  .digest("base64");

console.log("Payload:", JSON.stringify(payload, null, 2));
console.log("\nTimestamp:", timestamp);
console.log("Signature:", signature);
console.log(
  "\ncurl command:\n",
  `curl -X POST http://localhost:3000/webhooks/nomba \\
  -H "Content-Type: application/json" \\
  -H "nomba-signature: ${signature}" \\
  -H "nomba-timestamp: ${timestamp}" \\
  -d '${JSON.stringify(payload)}'`
);