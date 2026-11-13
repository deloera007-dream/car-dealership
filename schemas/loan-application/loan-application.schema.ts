import { z } from "zod";

export const LOAN_TERMS = [12, 24, 36, 48, 60, 72, 84] as const;

export const loanApplicationSchema = z.object({
  carId: z.string().trim().min(1, "Select a car"),
  amount: z
    .number({ error: "Enter a valid amount" })
    .positive("Amount must be greater than zero")
    .max(99_999_999.99, "Amount is too large")
    .multipleOf(0.01, "Use no more than two decimal places"),
  term: z.union(
    LOAN_TERMS.map((term) => z.literal(term)),
    { error: "Select a term between 12 and 84 months" },
  ),
});

export type LoanApplicationFormData = z.infer<typeof loanApplicationSchema>;
