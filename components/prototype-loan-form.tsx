"use client";

import { ArrowRight, Banknote, RotateCcw } from "lucide-react";
import { useId, useState } from "react";
import { FlowHeading, PrototypeNotice } from "@/components/marketplace-shell";
import {
  FormErrors,
  validationErrors,
} from "@/components/prototype-vehicle-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { formatCurrency } from "@/lib/helpers/format-currency";
import { simulateEquityLoan } from "@/lib/valuation";
import { equityLoanSchema } from "@/schemas/prototype.schema";

export function EquityLoanFlow() {
  const id = useId();
  const [draft, setDraft] = useState({ carValue: "", balance: "", term: "36" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ReturnType<
    typeof simulateEquityLoan
  > | null>(null);
  return (
    <>
      <FlowHeading
        eyebrow="Unlock what’s already yours"
        title="Your car. More possibilities."
        description="Explore a simulated loan backed by the equity in your car, without selling it."
      />
      <div className="mb-7 flex gap-3 rounded-2xl bg-blue-50 p-5">
        <Banknote className="size-6 shrink-0 text-blue-600" />
        <p className="text-sm leading-6">
          Car value − outstanding finance = your equity. This demo offers up to
          70% of that equity.
        </p>
      </div>
      {!result ? (
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            const parsed = equityLoanSchema.safeParse(draft);
            if (!parsed.success) {
              setErrors(validationErrors(parsed.error));
              return;
            }
            setErrors({});
            setResult(simulateEquityLoan(parsed.data));
          }}
        >
          <FormErrors errors={errors} />
          <div className="space-y-5">
            {(
              [
                ["carValue", "Estimated car value (£)", "20000"],
                ["balance", "Outstanding loan balance (£)", "0"],
              ] as const
            ).map(([name, label, placeholder]) => (
              <div key={name}>
                <Label htmlFor={`${id}-${name}`}>{label}</Label>
                <Input
                  id={`${id}-${name}`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={1000000}
                  step="0.01"
                  placeholder={placeholder}
                  value={draft[name]}
                  aria-invalid={!!errors[name]}
                  aria-describedby={
                    errors[name] ? `${id}-${name}-error` : undefined
                  }
                  className="mt-2"
                  onChange={(e) =>
                    setDraft({ ...draft, [name]: e.target.value })
                  }
                />
                {errors[name] && (
                  <p
                    id={`${id}-${name}-error`}
                    className="mt-1 text-red-600 text-xs"
                  >
                    {errors[name]}
                  </p>
                )}
              </div>
            ))}
            <div>
              <Label htmlFor={`${id}-term`}>Loan term</Label>
              <NativeSelect
                id={`${id}-term`}
                className="mt-2 w-full"
                value={draft.term}
                onChange={(e) => setDraft({ ...draft, term: e.target.value })}
              >
                {[12, 24, 36, 48].map((term) => (
                  <option key={term} value={term}>
                    {term} months
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>
          <Button type="submit" className="mt-7 h-12 w-full rounded-xl">
            Explore my loan offer
            <ArrowRight className="size-4" />
          </Button>
        </form>
      ) : (
        <section aria-label="Simulated loan result">
          <p className="font-semibold text-blue-600 text-xs uppercase tracking-widest">
            {result.amount > 0 ? "Your simulated offer" : "No offer available"}
          </p>
          <h2 className="mt-3 font-bold text-4xl">
            {formatCurrency(result.amount)}
          </h2>
          <p className="mt-2 text-slate-500 text-sm">
            Available equity: {formatCurrency(result.equity)}
          </p>
          {result.amount > 0 ? (
            <>
              <div className="mt-6 rounded-2xl border p-5">
                <p className="text-slate-500 text-sm">Monthly payment</p>
                <p className="mt-1 font-bold text-3xl">
                  {new Intl.NumberFormat("en-GB", {
                    style: "currency",
                    currency: "GBP",
                  }).format(result.monthlyPayment)}
                  <span className="font-normal text-slate-500 text-sm">
                    {" "}
                    / month
                  </span>
                </p>
                <dl className="mt-5 space-y-3 border-t pt-4 text-sm">
                  <div className="flex justify-between">
                    <dt>Term</dt>
                    <dd>{result.term} months</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Fixed annual rate (mock)</dt>
                    <dd>12.9%</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Total repayment</dt>
                    <dd>
                      {new Intl.NumberFormat("en-GB", {
                        style: "currency",
                        currency: "GBP",
                      }).format(result.totalRepayment)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Fees (simulated)</dt>
                    <dd>£0</dd>
                  </div>
                </dl>
              </div>
              <p className="mt-4 text-slate-500 text-xs leading-5">
                Illustration only, using monthly amortisation. No application,
                credit check or funds transfer occurs. A real secured loan may
                put your car at risk.
              </p>
            </>
          ) : (
            <p className="mt-4 rounded-xl bg-slate-50 p-4 text-slate-600 text-sm leading-6">
              {result.equity === 0
                ? "Your outstanding balance meets or exceeds your car’s value, so there is no available equity."
                : "Your available equity is too low for a mock offer rounded down to £100."}{" "}
              Try another estimate.
            </p>
          )}
          <Button
            className="mt-6 h-12 w-full rounded-xl"
            variant="outline"
            onClick={() => setResult(null)}
          >
            <RotateCcw className="size-4" />
            Adjust my numbers
          </Button>
        </section>
      )}
      <PrototypeNotice />
    </>
  );
}
