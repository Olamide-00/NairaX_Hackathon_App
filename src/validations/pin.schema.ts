import z from "zod";



export const confirmPinSchema = z.object({
  pin: z
    .string()
    .nonempty("PIN is required")
    .length(4, "PIN must be exactly 4 digits")
    .regex(/^\d+$/, "PIN must contain only digits"),
});

export type ConfirmPinInput = z.infer<typeof confirmPinSchema>;