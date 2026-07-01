import Groq from "groq-sdk";
import { IChatSession } from "../../models/chatSession.model";
import { transferService } from "../main/transfer.service";
import { executeTransfer } from "./transferOrch.ai";
import { Wallet } from "../../models/wallet.model";
import { AppError } from "../../utils/response.utils";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You are NairaX's transfer assistant. Help users send money via natural conversation.

Flow rules (follow strictly, in order):
1. Collect amount, account number, and bank name from the user. If any are missing, ask for them — never guess.
2. Once you have a bank name, call get_banks and match it to the closest bank in the list.
   - Show the user only the matched bank NAME (never the bank code) and ask them to confirm it's correct.
   - If no confident match exists, tell the user you couldn't find that bank and ask them to clarify.
3. Only after the user confirms the bank, call lookup_account with the account number and matched bank code.
   - Show the returned account holder name to the user and ask them to confirm this is the right person.
   - If the user says the name is wrong, stop and ask them to recheck the account number or bank — do not proceed.
4. Only after the user confirms the account name, ask for their transaction PIN.
5. Call verify_pin with the PIN the user gives you. If it fails, tell the user and ask them to re-enter — do not call execute_transfer.
6. Only after verify_pin succeeds, call execute_transfer with the confirmed amount, account number, and bank code.
7. Never skip a confirmation step. Never call execute_transfer without a prior successful verify_pin in this same conversation.

Amounts like "5k" or "5,000" mean 5000 naira. Always restate the amount in full (₦5,000) when confirming.`;

const tools: Groq.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_banks",
      description: "Get list of banks with their codes to match a bank name the user mentioned",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "lookup_account",
      description: "Resolve account number + bank code to the account holder's name, so the user can confirm before sending",
      parameters: {
        type: "object",
        properties: {
          accountNumber: { type: "string" },
          bankCode: { type: "string" },
        },
        required: ["accountNumber", "bankCode"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "verify_pin",
      description: "Verify the user's transaction PIN before executing a transfer",
      parameters: {
        type: "object",
        properties: { pin: { type: "string" } },
        required: ["pin"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "execute_transfer",
      description: "Execute the money transfer after PIN has been verified and the user confirmed the account name",
      parameters: {
        type: "object",
        properties: {
          amount: { type: "number" },
          accountNumber: { type: "string" },
          accountName: { type: "string" },
          bankCode: { type: "string" },
        },
        required: ["amount", "accountNumber", "accountName", "bankCode"],
      },
    },
  },
];

async function runTool(
  name: string,
  args: any,
  userId: string,
  session: IChatSession
): Promise<any> {
  switch (name) {
    case "get_banks": {
      const raw = await transferService.getBanks();
      const banks = (raw as any)?.data?.data ?? [];
      return banks.map((b: any) => ({ name: b.name, code: b.code }));
    }

    case "lookup_account": {
      return await transferService.lookupAccount(args.accountNumber, args.bankCode);
    }

    case "verify_pin": {
      const wallet = await Wallet.findOne({ userId }).select("+pin");
      if (!wallet) throw new AppError("Wallet not found", 404);

      const isMatch = await wallet.comparePin(args.pin);
      if (!isMatch) {
        return { verified: false, message: "Incorrect PIN" };
      }

      session.pinVerified = true;
      await session.save();
      return { verified: true, message: "PIN confirmed" };
    }

    case "execute_transfer": {
      //precaution 
      if (!session.pinVerified) {
        return { success: false, message: "PIN has not been verified for this session" };
      }

      const result = await executeTransfer({
        userId,
        amount: args.amount,
        accountNumber: args.accountNumber,
        accountName: args.accountName,
        bankCode: args.bankCode,
      });

      // verify again
      session.pinVerified = false;
      await session.save();

      return result;
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

export async function runAgent(
  userId: string,
  session: IChatSession,
  userMessage: string
): Promise<string> {
  session.history.push({ role: "user", content: userMessage });

  let finalReply: string | null = null;
  let iterations = 0;
  const MAX_ITERATIONS = 3; 

  while (!finalReply && iterations < MAX_ITERATIONS) {
    iterations++;

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...session.history.map((m) => ({
          role: m.role,
          content: m.content,
          ...(m.tool_call_id && { tool_call_id: m.tool_call_id }),
          ...(m.tool_calls && { tool_calls: m.tool_calls }),
        })),
      ] as any,
      tools,
      tool_choice: "auto",
    });

    const msg = completion.choices[0].message;

    if (msg.tool_calls?.length) {
      session.history.push({
        role: "assistant",
        content: msg.content || "",
        tool_calls: msg.tool_calls,
      });

      for (const call of msg.tool_calls) {
        const args = JSON.parse(call.function.arguments || "{}");

        let result;
        try {
          result = await runTool(call.function.name, args, userId, session);
        } catch (err) {
          result = { error: err instanceof Error ? err.message : "Tool execution failed" };
        }

        session.history.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }
    } else {
      finalReply = msg.content || "Sorry, I didn't quite get that.";
    }
  }

  if (!finalReply) {
    finalReply = "Something went wrong processing that. Please try again.";
  }

  session.history.push({ role: "assistant", content: finalReply });
  await session.save();

  return finalReply;
}