import { valuationYear, vehicleCatalog } from "@/lib/vehicle-catalog";
import {
  equityLoanSchema,
  type EquityLoanInput,
  valuationSchema,
  type VehicleValuationInput,
} from "@/schemas/prototype.schema";

const roundHundred = (value: number) => Math.round(value / 100) * 100;

export function valuateCar(input: VehicleValuationInput) {
  const car = valuationSchema.parse(input);
  const base = vehicleCatalog[car.make][car.model];
  const age = valuationYear - car.year;
  const ageFactor = Math.max(0.15, 0.88 ** age);
  const mileageFactor = Math.max(0.55, 1 - car.mileage / 400000);
  const conditionFactor = { excellent: 1.05, good: 1, fair: 0.85 }[
    car.condition
  ];
  const marketValue = roundHundred(
    base * ageFactor * mileageFactor * conditionFactor,
  );
  return {
    marketValue,
    low: roundHundred(marketValue * 0.93),
    high: roundHundred(marketValue * 1.07),
    instantOffer: roundHundred(marketValue * 0.92),
  };
}

export function tradeDifference(targetPrice: number, tradeValue: number) {
  if (
    !Number.isFinite(targetPrice) ||
    !Number.isFinite(tradeValue) ||
    targetPrice < 0 ||
    tradeValue < 0
  )
    throw new Error("Prices must be finite and non-negative");
  return {
    toPay: Math.max(0, targetPrice - tradeValue),
    credit: Math.max(0, tradeValue - targetPrice),
  };
}

export function simulateEquityLoan(input: EquityLoanInput) {
  const { carValue, balance, term } = equityLoanSchema.parse(input);
  const equity = Math.max(0, carValue - balance);
  const amount = Math.floor((equity * 0.7) / 100) * 100;
  const annualRate = 0.129;
  const monthlyRate = annualRate / 12;
  const monthlyPayment =
    amount === 0
      ? 0
      : (amount * monthlyRate) / (1 - (1 + monthlyRate) ** -term);
  return {
    equity,
    amount,
    term,
    annualRate,
    monthlyPayment,
    totalRepayment: monthlyPayment * term,
  };
}
