import { describe, expect, it } from "vitest";
import {
  calculateFinancing,
  type FinancingInputs,
} from "@/lib/helpers/calculate-financing";

const inputs: FinancingInputs = {
  price: 12000,
  downPayment: 2000,
  apr: 12,
  termMonths: 12,
};

describe("calculateFinancing", () => {
  it("calculates an amortized loan and includes the down payment in total cost", () => {
    const { errors, estimate } = calculateFinancing(inputs);

    expect(errors).toEqual({});
    expect(estimate?.monthlyPayment).toBeCloseTo(888.48788678, 8);
    expect(estimate?.totalInterest).toBeCloseTo(661.8546414, 6);
    expect(estimate?.totalCost).toBeCloseTo(12661.8546414, 6);
  });

  it("handles zero APR without interest or premature rounding", () => {
    const { estimate } = calculateFinancing({
      price: 10000,
      downPayment: 1000,
      apr: 0,
      termMonths: 7,
    });

    expect(estimate).toEqual({
      monthlyPayment: 9000 / 7,
      totalInterest: 0,
      totalCost: 10000,
    });
  });

  it("handles a fully paid vehicle", () => {
    expect(
      calculateFinancing({ ...inputs, downPayment: inputs.price }).estimate,
    ).toEqual({ monthlyPayment: 0, totalInterest: 0, totalCost: inputs.price });
  });

  it("handles a single-month loan and decimal currency amounts", () => {
    const { estimate } = calculateFinancing({
      price: 12000.5,
      downPayment: 2000.5,
      apr: 12,
      termMonths: 1,
    });

    expect(estimate?.monthlyPayment).toBeCloseTo(10100, 8);
    expect(estimate?.totalInterest).toBeCloseTo(100, 8);
    expect(estimate?.totalCost).toBeCloseTo(12100.5, 8);
  });

  it("keeps very small positive rates numerically stable", () => {
    const { estimate } = calculateFinancing({ ...inputs, apr: 1e-15 });

    expect(estimate?.monthlyPayment).toBeCloseTo(10000 / 12, 8);
    expect(estimate?.totalInterest).toBeCloseTo(0, 8);
  });

  it.each<[keyof FinancingInputs, number]>([
    ["price", 0],
    ["price", -1],
    ["price", Number.NaN],
    ["price", Number.POSITIVE_INFINITY],
    ["downPayment", -1],
    ["downPayment", 12001],
    ["downPayment", Number.NaN],
    ["downPayment", Number.POSITIVE_INFINITY],
    ["apr", -1],
    ["apr", Number.NaN],
    ["apr", Number.POSITIVE_INFINITY],
    ["termMonths", 0],
    ["termMonths", -1],
    ["termMonths", 12.5],
    ["termMonths", Number.NaN],
    ["termMonths", Number.POSITIVE_INFINITY],
    ["termMonths", Number.MAX_SAFE_INTEGER + 1],
  ])("rejects invalid %s: %s", (field, value) => {
    const { errors, estimate } = calculateFinancing({
      ...inputs,
      [field]: value,
    });

    expect(errors[field]).toBeTruthy();
    expect(estimate).toBeNull();
  });

  it("does not return infinite results for extreme inputs", () => {
    const { errors, estimate } = calculateFinancing({
      ...inputs,
      price: Number.MAX_VALUE,
      apr: Number.MAX_VALUE,
    });

    expect(errors.price).toBeTruthy();
    expect(estimate).toBeNull();
  });
});
