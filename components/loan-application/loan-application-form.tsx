"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { submitLoanApplication } from "@/actions/loan-applications/submit-loan-application";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { ROUTES } from "@/config/routes";
import {
  LOAN_TERMS,
  type LoanApplicationFormData,
  loanApplicationSchema,
} from "@/schemas/loan-application/loan-application.schema";

export function LoanApplicationForm({
  carId,
  carPrice,
}: {
  carId: string;
  carPrice: number;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoanApplicationFormData>({
    resolver: zodResolver(
      loanApplicationSchema.refine((data) => data.amount <= carPrice, {
        message: "Amount cannot exceed the car price",
        path: ["amount"],
      }),
    ),
    defaultValues: { carId, amount: carPrice, term: 36 },
  });

  const onSubmit = async (data: LoanApplicationFormData) => {
    setError(null);
    try {
      const result = await submitLoanApplication(data);
      if (!result.success) {
        setError(result.error);
        return;
      }
      toast.success("Your financing application has been submitted");
      router.push(ROUTES.MY_APPLICATIONS);
      router.refresh();
    } catch {
      setError("Unable to submit your application. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <input type="hidden" {...register("carId")} />
      <fieldset disabled={isSubmitting} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="loan-amount">Requested amount (GBP)</Label>
          <Input
            id="loan-amount"
            type="number"
            inputMode="decimal"
            min="0.01"
            max={carPrice}
            step="0.01"
            required
            aria-invalid={!!errors.amount}
            aria-describedby={
              errors.amount ? "loan-amount-error" : "loan-amount-help"
            }
            {...register("amount", { valueAsNumber: true })}
          />
          <p id="loan-amount-help" className="text-muted-foreground text-sm">
            Request up to the car price. Enter a lower amount if you plan to pay
            a deposit.
          </p>
          {errors.amount && (
            <p
              id="loan-amount-error"
              role="alert"
              className="text-destructive text-sm"
            >
              {errors.amount.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="loan-term">Term (months)</Label>
          <NativeSelect
            id="loan-term"
            className="w-full"
            required
            aria-invalid={!!errors.term}
            aria-describedby={errors.term ? "loan-term-error" : undefined}
            {...register("term", { valueAsNumber: true })}
          >
            {LOAN_TERMS.map((term) => (
              <NativeSelectOption key={term} value={term}>
                {term} months
              </NativeSelectOption>
            ))}
          </NativeSelect>
          {errors.term && (
            <p
              id="loan-term-error"
              role="alert"
              className="text-destructive text-sm"
            >
              {errors.term.message}
            </p>
          )}
        </div>
        <p className="text-muted-foreground text-sm">
          Submitting an application does not guarantee approval or reserve the
          car. Financing is subject to review; no interest rate or repayment
          offer is confirmed here.
        </p>
        {error && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && (
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
          )}
          {isSubmitting ? "Submitting application..." : "Submit application"}
        </Button>
      </fieldset>
    </form>
  );
}
