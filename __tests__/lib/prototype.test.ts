import { describe, expect, it } from "vitest";
import { isMarketplaceRoute, isPrototypeRoute } from "@/lib/prototype-mode";
import {
  simulateEquityLoan,
  tradeDifference,
  valuateCar,
} from "@/lib/valuation";
import {
  equityLoanSchema,
  photosSchema,
  sellSchema,
  valuationSchema,
} from "@/schemas/prototype.schema";

const car = {
  make: "Toyota",
  model: "Corolla",
  year: 2023,
  mileage: 20000,
  condition: "good" as const,
};

describe("deterministic prototype valuation", () => {
  it("uses make/model, a fixed 2026 reference year and depreciation", () => {
    expect(valuateCar(car)).toEqual({
      marketValue: 18100,
      low: 16800,
      high: 19400,
      instantOffer: 16700,
    });
    expect(valuateCar(car)).toEqual(valuateCar(car));
  });
  it("reduces value with age, mileage and worse condition", () => {
    const value = valuateCar(car).marketValue;
    expect(valuateCar({ ...car, year: 2022 }).marketValue).toBeLessThan(value);
    expect(valuateCar({ ...car, mileage: 60000 }).marketValue).toBeLessThan(
      value,
    );
    expect(valuateCar({ ...car, condition: "fair" }).marketValue).toBeLessThan(
      value,
    );
    expect(
      valuateCar({ ...car, condition: "excellent" }).marketValue,
    ).toBeGreaterThan(value);
  });
  it("keeps a positive floor for old, high-mileage cars", () => {
    expect(
      valuateCar({ ...car, year: 1990, mileage: 500000 }).marketValue,
    ).toBeGreaterThan(0);
  });
  it("rejects unsupported models and non-numeric values at the calculation boundary", () => {
    expect(() => valuateCar({ ...car, model: "Unknown" })).toThrow();
    expect(() => valuateCar({ ...car, mileage: NaN })).toThrow();
    expect(() =>
      valuateCar({ ...car, make: "Toyota", model: "constructor" }),
    ).toThrow();
  });
  it.each([
    { year: 2027 },
    { year: 1989 },
    { year: 2023.5 },
    { mileage: -1 },
    { mileage: 500001 },
    { mileage: 1.5 },
    { mileage: "" },
    { year: "" },
    { condition: "damaged" },
  ])("rejects invalid vehicle details %j", (patch) => {
    expect(valuationSchema.safeParse({ ...car, ...patch }).success).toBe(false);
  });
  it("coerces form numbers and accepts zero mileage", () => {
    expect(
      valuationSchema.parse({ ...car, year: "2023", mileage: "0" }).mileage,
    ).toBe(0);
  });
});

describe("selling photo validation", () => {
  const photo = { name: "car.jpg", type: "image/jpeg", size: 1024 };
  it("requires 1–6 supported photos no larger than 5 MB", () => {
    expect(sellSchema.safeParse({ ...car, photos: [photo] }).success).toBe(
      true,
    );
    expect(photosSchema.safeParse([]).success).toBe(false);
    expect(photosSchema.safeParse(Array(7).fill(photo)).success).toBe(false);
    expect(
      photosSchema.safeParse([{ ...photo, type: "image/svg+xml" }]).success,
    ).toBe(false);
    expect(
      photosSchema.safeParse([{ ...photo, size: 5 * 1024 * 1024 + 1 }]).success,
    ).toBe(false);
    expect(photosSchema.safeParse([{ ...photo, size: 0 }]).success).toBe(false);
    expect(
      photosSchema.safeParse([{ ...photo, size: 5 * 1024 * 1024 }]).success,
    ).toBe(true);
  });
});

describe("trade-in differences", () => {
  it("shows the amount to pay or positive surplus credit", () => {
    expect(tradeDifference(22000, 16000)).toEqual({ toPay: 6000, credit: 0 });
    expect(tradeDifference(16000, 22000)).toEqual({ toPay: 0, credit: 6000 });
    expect(tradeDifference(16000, 16000)).toEqual({ toPay: 0, credit: 0 });
    expect(() => tradeDifference(Infinity, 0)).toThrow();
    expect(() => tradeDifference(-1, 0)).toThrow();
  });
});

describe("equity loan simulation", () => {
  it("offers 70% of positive equity and amortises with the mock rate", () => {
    const result = simulateEquityLoan({
      carValue: 20000,
      balance: 5000,
      term: 36,
    });
    expect(result.equity).toBe(15000);
    expect(result.amount).toBe(10500);
    expect(result.annualRate).toBe(0.129);
    const rate = 0.129 / 12;
    expect(result.monthlyPayment).toBeCloseTo(
      (10500 * rate) / (1 - (1 + rate) ** -36),
      8,
    );
    expect(result.totalRepayment).toBeCloseTo(result.monthlyPayment * 36, 8);
  });
  it.each([20000, 25000])(
    "does not lend against zero or negative equity (balance %s)",
    (balance) => {
      expect(
        simulateEquityLoan({ carValue: 20000, balance, term: 12 }),
      ).toMatchObject({
        equity: 0,
        amount: 0,
        monthlyPayment: 0,
        totalRepayment: 0,
      });
    },
  );
  it("rounds amounts down to £100 and handles insufficient positive equity", () => {
    expect(
      simulateEquityLoan({ carValue: 20123, balance: 5000, term: 24 }).amount,
    ).toBe(10500);
    expect(
      simulateEquityLoan({ carValue: 100, balance: 0, term: 24 }).amount,
    ).toBe(0);
  });
  it.each([
    { carValue: 0 },
    { balance: -1 },
    { carValue: Infinity },
    { term: 0 },
    { term: 60 },
    { balance: "" },
  ])("rejects invalid loan inputs %j", (patch) => {
    expect(
      equityLoanSchema.safeParse({
        carValue: 20000,
        balance: 0,
        term: 36,
        ...patch,
      }).success,
    ).toBe(false);
  });
});

describe("mock-only route allowlist", () => {
  it.each([
    "/",
    "/cars",
    "/cars/demo-toyota-corolla",
    "/sell",
    "/value",
    "/loans",
    "/account",
  ])("allows mock route %s", (path) =>
    expect(isPrototypeRoute(path)).toBe(true),
  );
  it.each([
    "/admin",
    "/api/mcp",
    "/api/oauth/register",
    "/saved-cars",
    "/reservations",
    "/cars/real-id",
    "/cars/demo-x/test-drive",
    "/sell/private",
  ])("does not bypass live route %s", (path) =>
    expect(isPrototypeRoute(path)).toBe(false),
  );
  it("uses the mobile shell for real detail pages but not existing protected pages", () => {
    expect(isMarketplaceRoute("/cars/real-id")).toBe(true);
    expect(isMarketplaceRoute("/saved-cars")).toBe(false);
    expect(isMarketplaceRoute("/admin")).toBe(false);
  });
});
