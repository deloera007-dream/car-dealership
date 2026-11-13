import { describe, expect, it } from "vitest";
import {
  LOAN_TERMS,
  loanApplicationSchema,
} from "@/schemas/loan-application/loan-application.schema";

const valid = { carId: "car-1", amount: 12500.25, term: 36 };

describe("loanApplicationSchema", () => {
  it.each(LOAN_TERMS)("accepts a %i month term", (term) => {
    expect(loanApplicationSchema.safeParse({ ...valid, term }).success).toBe(
      true,
    );
  });

  it.each([
    0,
    -1,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    100_000_000,
    12.345,
    "12000",
    null,
    undefined,
  ])("rejects invalid amount %s", (amount) => {
    expect(loanApplicationSchema.safeParse({ ...valid, amount }).success).toBe(
      false,
    );
  });

  it.each([0, -12, 13, 36.5, 96, "36", null])(
    "rejects invalid term %s",
    (term) => {
      expect(loanApplicationSchema.safeParse({ ...valid, term }).success).toBe(
        false,
      );
    },
  );

  it("requires a non-empty car id and strips untrusted fields", () => {
    expect(
      loanApplicationSchema.safeParse({ ...valid, carId: "  " }).success,
    ).toBe(false);
    expect(
      loanApplicationSchema.parse({
        ...valid,
        user_id: "other-user",
        status: "APPROVED",
      }),
    ).toEqual(valid);
  });
});
