"use client";

import { useId, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  calculateFinancing,
  type FinancingInputs,
} from "@/lib/helpers/calculate-financing";

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const fields = [
  { name: "price", label: "Vehicle price (£)", min: 0.01, step: "0.01" },
  { name: "downPayment", label: "Down payment (£)", min: 0, step: "0.01" },
  { name: "apr", label: "APR (%)", min: 0, step: "0.01" },
  { name: "termMonths", label: "Loan term (months)", min: 1, step: "1" },
] satisfies {
  name: keyof FinancingInputs;
  label: string;
  min: number;
  step: string;
}[];

export function FinancingCalculator({ price }: { price: number }) {
  const id = useId();
  const [values, setValues] = useState({
    price: String(price),
    downPayment: "0",
    apr: "6.5",
    termMonths: "60",
  });
  const { errors, estimate } = calculateFinancing({
    price: values.price.trim() === "" ? Number.NaN : Number(values.price),
    downPayment:
      values.downPayment.trim() === ""
        ? Number.NaN
        : Number(values.downPayment),
    apr: values.apr.trim() === "" ? Number.NaN : Number(values.apr),
    termMonths:
      values.termMonths.trim() === "" ? Number.NaN : Number(values.termMonths),
  });

  return (
    <Card className="mt-12" aria-labelledby={`${id}-title`}>
      <CardHeader>
        <CardTitle>
          <h2 id={`${id}-title`} className="font-semibold text-xl">
            Financing calculator
          </h2>
        </CardTitle>
        <CardDescription>
          Adjust the figures to estimate your monthly payment.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-3">
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          {fields.map(({ name, label, min, step }) => (
            <div key={name} className="space-y-2">
              <Label htmlFor={`${id}-${name}`}>{label}</Label>
              <Input
                id={`${id}-${name}`}
                type="number"
                inputMode={name === "termMonths" ? "numeric" : "decimal"}
                min={min}
                max={
                  name === "downPayment" ? Number(values.price) || 0 : undefined
                }
                step={step}
                value={values[name]}
                onChange={(event) =>
                  setValues({ ...values, [name]: event.target.value })
                }
                aria-invalid={!!errors[name]}
                aria-describedby={
                  errors[name] ? `${id}-${name}-error` : undefined
                }
              />
              {errors[name] && (
                <p
                  id={`${id}-${name}-error`}
                  className="text-destructive text-sm"
                >
                  {errors[name]}
                </p>
              )}
            </div>
          ))}
        </div>
        <div
          className="rounded-lg bg-muted p-4"
          aria-live="polite"
          aria-atomic="true"
        >
          {estimate ? (
            <dl className="space-y-4">
              <div>
                <dt className="text-muted-foreground text-sm">
                  Monthly payment
                </dt>
                <dd className="break-words font-bold text-3xl tabular-nums">
                  {currencyFormatter.format(estimate.monthlyPayment)}
                </dd>
              </div>
              <div className="flex flex-wrap justify-between gap-2 text-sm">
                <dt className="text-muted-foreground">Total interest</dt>
                <dd className="font-medium tabular-nums">
                  {currencyFormatter.format(estimate.totalInterest)}
                </dd>
              </div>
              <div className="flex flex-wrap justify-between gap-2 border-t pt-4 text-sm">
                <dt className="text-muted-foreground">Total cost</dt>
                <dd className="font-semibold tabular-nums">
                  {currencyFormatter.format(estimate.totalCost)}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-muted-foreground text-sm">
              Enter valid values to see your financing estimate.
            </p>
          )}
        </div>
        <p className="text-muted-foreground text-xs lg:col-span-3">
          Estimates only, not a finance offer. Total cost includes your down
          payment and all loan repayments, excluding taxes and fees. Actual
          rates and terms may vary; the default APR is illustrative.
        </p>
      </CardContent>
    </Card>
  );
}
