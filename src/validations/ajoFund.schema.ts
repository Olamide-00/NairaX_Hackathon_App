import { z } from "zod";

export const createFundSchema = z.object({
  title: z
    .string().nonempty("Title is required")
    .min(3, "Title is too short")
    .max(100, "Title is too long"),

  description: z
    .string().nonempty("Description is required")
    .min(10, "Description is too short")
    .max(500, "Description is too long"),

  targetAmount: z
    .number()
    .refine((val) => val !== undefined, { message: "Target amount is required" })
    .min(100, "Target amount must be at least 100"),

  visibility: z.enum(["public", "private"], {
    error: "Visibility is required",
  }),

  category: z.enum(["gift", "community_support", "other"], {
    error: "Category is required",
  }),

  deadline: z
    .string().nonempty("Deadline is required")
    .refine(
      (val) => !isNaN(Date.parse(val)) && new Date(val) > new Date(),
      "Deadline must be a valid future date"
    ),
});

export const joinFundSchema = z.object({
  inviteCode: z
    .string().nonempty("Invite code is required")
    .min(4, "Invalid invite code"),
});

export const contributeSchema = z.object({
  amount: z
    .number()
    .refine((val) => val !== undefined, { message: "Amount is required" })
    .positive("Amount must be greater than zero")
    .min(50, "Minimum contribution is 50"),
});

export type CreateFundInput = z.infer<typeof createFundSchema>;
export type JoinFundInput = z.infer<typeof joinFundSchema>;
export type ContributeInput = z.infer<typeof contributeSchema>;