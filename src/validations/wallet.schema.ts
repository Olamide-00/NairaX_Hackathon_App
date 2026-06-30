import { z } from "zod";

export const accountSetupRequestSchema = z.object({
  accountName: z
    .string()
    .min(2, "Account name is too short")
    .refine((val) => val.trim() !== "", {
      message: "Account name is required",
    }),

  currency: z
    .string()
    .default("NGN"),

  bvn: z
    .string()
    .length(11, "BVN must be 11 digits")
    .regex(/^\d+$/, "BVN must contain only digits")
    .optional(),

  pin: z
    .string()
    .refine((val) => val.trim() !== "", { message: "PIN is required" })
    .length(4, "PIN must be exactly 4 digits")
    .regex(/^\d+$/, "PIN must contain only digits"),

  age: z
    .preprocess((val) => (typeof val === "string" ? parseInt(val, 10) : val), z.number())
    .refine((val) => !isNaN(val), { message: "Age must be a whole number" })
    .refine((val) => val !== undefined && val !== null, { message: "Age is required" }),

  gender: z
  .string(),
});

export type AccountSetupInput = z.infer<typeof accountSetupRequestSchema>;