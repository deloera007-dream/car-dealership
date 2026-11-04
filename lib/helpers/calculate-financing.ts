export interface FinancingInputs {
  price: number;
  downPayment: number;
  apr: number;
  termMonths: number;
}

export function calculateFinancing({
  price,
  downPayment,
  apr,
  termMonths,
}: FinancingInputs) {
  const errors: Partial<Record<keyof FinancingInputs, string>> = {};

  if (!Number.isFinite(price) || price <= 0) {
    errors.price = "Enter a vehicle price greater than 0.";
  }
  if (!Number.isFinite(downPayment) || downPayment < 0) {
    errors.downPayment = "Enter a down payment of 0 or more.";
  } else if (downPayment > price) {
    errors.downPayment = "Down payment cannot exceed the vehicle price.";
  }
  if (!Number.isFinite(apr) || apr < 0) {
    errors.apr = "Enter an APR of 0 or more.";
  }
  if (!Number.isSafeInteger(termMonths) || termMonths <= 0) {
    errors.termMonths = "Enter a positive whole number of months.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors, estimate: null };
  }

  const principal = price - downPayment;
  const monthlyRate = apr / 1200;
  const monthlyPayment =
    principal === 0
      ? 0
      : monthlyRate === 0
        ? principal / termMonths
        : principal *
          (monthlyRate / -Math.expm1(-termMonths * Math.log1p(monthlyRate)));
  const totalInterest = Math.max(0, monthlyPayment * termMonths - principal);
  const totalCost = price + totalInterest;

  if (![monthlyPayment, totalInterest, totalCost].every(Number.isFinite)) {
    errors.price = "These values are too large. Enter smaller amounts.";
    return { errors, estimate: null };
  }

  return { errors, estimate: { monthlyPayment, totalInterest, totalCost } };
}
