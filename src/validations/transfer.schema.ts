import { z } from "zod";

export const makeTransferSchema = z.object({
  amount: z
    .number()
    .refine(value => value !== undefined, { message: "Amount is required" })
    .positive("Amount must be greater than zero")
    .min(100, "Minimum transfer amount is 100"),

  accountNumber: z
    .string()
    .nonempty("Account number is required")
    .length(10, "Account number must be 10 digits")
    .regex(/^\d+$/, "Account number must contain only digits"),

  accountName: z
    .string()
    .nonempty("Account name is required")
    .min(2, "Account name is too short"),

  bankCode: z
    .string()
    .nonempty("Bank code is required")
    .min(3, "Bank code is too short"),

  narration: z
    .string()
    .max(100, "Narration is too long")
    .optional(),
});

export const lookupAccountSchema = z.object({
  accountNumber: z
    .string()
    .nonempty("Account number is required")
    .length(10, "Account number must be 10 digits")
    .regex(/^\d+$/, "Account number must contain only digits"),

  bankCode: z
    .string()
    .nonempty("Bank code is required")
    .min(3, "Bank code is too short"),
});

export type MakeTransferInput = z.infer<typeof makeTransferSchema>;
export type LookupAccountInput = z.infer<typeof lookupAccountSchema>;