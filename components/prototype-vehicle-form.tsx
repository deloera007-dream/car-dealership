"use client";

import {
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  Camera,
  Check,
  CircleCheck,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { ZodError } from "zod";
import { FlowHeading, PrototypeNotice } from "@/components/marketplace-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/helpers/format-currency";
import { tradeDifference, valuateCar } from "@/lib/valuation";
import { valuationYear, vehicleCatalog } from "@/lib/vehicle-catalog";
import {
  conditionSchema,
  photosSchema,
  sellSchema,
  valuationSchema,
  vehicleDetailsSchema,
} from "@/schemas/prototype.schema";

type VehicleDraft = {
  make: string;
  model: string;
  year: string;
  mileage: string;
  condition: "excellent" | "good" | "fair";
};
const emptyDraft: VehicleDraft = {
  make: "",
  model: "",
  year: "",
  mileage: "",
  condition: "good",
};
type Errors = Record<string, string>;

export function validationErrors(error: ZodError): Errors {
  return Object.fromEntries(
    error.issues.map((issue) => [
      String(issue.path[0] ?? "form"),
      issue.message,
    ]),
  );
}

export function FormErrors({ errors }: { errors: Errors }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (Object.keys(errors).length) ref.current?.focus();
  }, [errors]);
  if (!Object.keys(errors).length) return null;
  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 text-sm"
    >
      <p className="font-semibold">Please check your details</p>
      <ul className="mt-2 list-inside list-disc">
        {Object.entries(errors).map(([key, message]) => (
          <li key={key}>{message}</li>
        ))}
      </ul>
    </div>
  );
}

function VehicleFields({
  draft,
  setDraft,
  errors,
  conditionOnly = false,
}: {
  draft: VehicleDraft;
  setDraft: (value: VehicleDraft) => void;
  errors: Errors;
  conditionOnly?: boolean;
}) {
  const id = useId();
  const field = (name: keyof VehicleDraft) => ({
    id: `${id}-${name}`,
    "aria-invalid": !!errors[name],
    "aria-describedby": errors[name] ? `${id}-${name}-error` : undefined,
  });
  const error = (name: keyof VehicleDraft) =>
    errors[name] && (
      <p id={`${id}-${name}-error`} className="mt-1 text-red-600 text-xs">
        {errors[name]}
      </p>
    );
  if (conditionOnly)
    return (
      <fieldset className="space-y-3">
        <legend className="mb-3 font-semibold text-lg">
          How’s your car looking?
        </legend>
        {(
          [
            ["excellent", "Excellent", "Like new, with no visible damage."],
            ["good", "Good", "Normal wear, well maintained."],
            ["fair", "Fair", "Some dents or repairs needed."],
          ] as const
        ).map(([value, label, description]) => (
          <label
            key={value}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${draft.condition === value ? "border-blue-600 bg-blue-50" : "border-slate-200"}`}
          >
            <input
              type="radio"
              name={`${id}-condition`}
              value={value}
              checked={draft.condition === value}
              onChange={() => setDraft({ ...draft, condition: value })}
              className="mt-0.5 size-4 min-h-0 accent-blue-600"
            />
            <span>
              <span className="block font-semibold text-sm">{label}</span>
              <span className="mt-1 block text-slate-500 text-xs">
                {description}
              </span>
            </span>
          </label>
        ))}
      </fieldset>
    );
  return (
    <div className="space-y-5">
      <div>
        <Label htmlFor={`${id}-make`}>Make</Label>
        <NativeSelect
          className="mt-2 w-full"
          {...field("make")}
          value={draft.make}
          onChange={(e) =>
            setDraft({ ...draft, make: e.target.value, model: "" })
          }
        >
          <option value="">Select make</option>
          {Object.keys(vehicleCatalog).map((make) => (
            <option key={make}>{make}</option>
          ))}
        </NativeSelect>
        {error("make")}
      </div>
      <div>
        <Label htmlFor={`${id}-model`}>Model</Label>
        <NativeSelect
          className="mt-2 w-full"
          {...field("model")}
          value={draft.model}
          disabled={!draft.make}
          onChange={(e) => setDraft({ ...draft, model: e.target.value })}
        >
          <option value="">Select model</option>
          {Object.keys(vehicleCatalog[draft.make] ?? {}).map((model) => (
            <option key={model}>{model}</option>
          ))}
        </NativeSelect>
        {error("model")}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${id}-year`}>Year</Label>
          <Input
            className="mt-2"
            {...field("year")}
            inputMode="numeric"
            type="number"
            min={1990}
            max={valuationYear}
            placeholder="2022"
            value={draft.year}
            onChange={(e) => setDraft({ ...draft, year: e.target.value })}
          />
          {error("year")}
        </div>
        <div>
          <Label htmlFor={`${id}-mileage`}>Mileage (miles)</Label>
          <Input
            className="mt-2"
            {...field("mileage")}
            inputMode="numeric"
            type="number"
            min={0}
            max={500000}
            placeholder="25000"
            value={draft.mileage}
            onChange={(e) => setDraft({ ...draft, mileage: e.target.value })}
          />
          {error("mileage")}
        </div>
      </div>
    </div>
  );
}

function PhotoUpload({
  photos,
  setPhotos,
  errors,
}: {
  photos: File[];
  setPhotos: (photos: File[]) => void;
  errors: Errors;
}) {
  const id = useId();
  const [previews, setPreviews] = useState<string[]>([]);
  useEffect(() => {
    const urls = photos.map((photo) => URL.createObjectURL(photo));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [photos]);
  return (
    <div>
      <h2 className="mb-2 font-semibold text-lg">Give us a first look.</h2>
      <p className="mb-5 text-slate-500 text-sm leading-6">
        Add 1–6 photos of your car. Front, back and interior work best. JPG, PNG
        or WebP, up to 5 MB each.
      </p>
      <Label
        htmlFor={id}
        className="mb-3 flex cursor-pointer flex-col gap-3 rounded-2xl border-2 border-blue-200 border-dashed bg-blue-50/50 px-5 py-8 text-blue-700"
      >
        <Camera className="size-8" />
        <span>Choose car photos</span>
        <span className="font-normal text-slate-500 text-xs">
          Private preview · never uploaded
        </span>
      </Label>
      <Input
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        aria-invalid={!!errors.photos}
        onChange={(e) => setPhotos(Array.from(e.target.files ?? []))}
        className="h-auto py-2"
      />
      {photos.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {photos.map((photo, index) => (
            <div
              key={`${photo.name}-${index}`}
              className="overflow-hidden rounded-lg border"
            >
              <Image
                src={previews[index] || "/body/sedan.webp"}
                width={120}
                height={80}
                alt={`Selected photo ${index + 1}`}
                unoptimized
                className="h-20 w-full object-cover"
              />
              <p className="truncate p-1 text-[10px] text-slate-500">
                {photo.name}
              </p>
              <button
                type="button"
                className="min-h-11 w-full text-blue-700 text-xs"
                onClick={() => setPhotos(photos.filter((_, i) => i !== index))}
              >
                Remove {index + 1}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function VehicleFlow({
  mode = "value",
  targetPrice,
  targetName,
}: {
  mode?: "sell" | "value" | "trade";
  targetPrice?: number;
  targetName?: string;
}) {
  const [draft, setDraft] = useState<VehicleDraft>(emptyDraft);
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<File[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [result, setResult] = useState<ReturnType<typeof valuateCar> | null>(
    null,
  );
  const steps =
    mode === "sell"
      ? ["Your car", "Condition", "Photos"]
      : ["Your car", "Condition"];
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const schema =
      step === 0
        ? vehicleDetailsSchema
        : step === 1
          ? conditionSchema
          : photosSchema;
    const validation = schema.safeParse(step === 2 ? photos : draft);
    if (!validation.success) {
      setErrors(
        step === 2
          ? { photos: validation.error.issues[0].message }
          : validationErrors(validation.error),
      );
      return;
    }
    setErrors({});
    if (step < steps.length - 1) {
      setStep(step + 1);
      return;
    }
    const full =
      mode === "sell"
        ? sellSchema.safeParse({ ...draft, photos })
        : valuationSchema.safeParse(draft);
    if (!full.success) {
      setErrors(validationErrors(full.error));
      return;
    }
    setResult(valuateCar(full.data));
  };
  const reset = () => {
    setResult(null);
    setStep(0);
    setErrors({});
  };
  const title =
    mode === "sell"
      ? "Your car. A new beginning."
      : mode === "trade"
        ? "A smarter way to switch."
        : "Know what your car is worth.";
  if (result) {
    const difference =
      mode === "trade" && targetPrice !== undefined
        ? tradeDifference(targetPrice, result.instantOffer)
        : null;
    return (
      <section aria-label="Valuation result">
        <div className="mb-6 flex size-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <CircleCheck className="size-7" />
        </div>
        <p className="mb-2 font-bold text-blue-600 text-xs uppercase tracking-widest">
          {mode === "sell"
            ? "Your instant offer"
            : mode === "trade"
              ? "Your trade-in estimate"
              : "Your market estimate"}
        </p>
        <h2 className="font-bold text-4xl tracking-tight">
          {formatCurrency(
            mode === "value" ? result.marketValue : result.instantOffer,
          )}
        </h2>
        <p className="mt-3 text-slate-500 text-sm">
          {draft.year} {draft.make} {draft.model} ·{" "}
          {Number(draft.mileage).toLocaleString("en-GB")} mi
        </p>
        <div className="mt-6 rounded-2xl bg-slate-50 p-5">
          <p className="mb-2 text-slate-500 text-sm">Estimated market range</p>
          <p className="font-semibold text-lg">
            {formatCurrency(result.low)} – {formatCurrency(result.high)}
          </p>
          <p className="mt-3 text-slate-500 text-xs leading-5">
            Based on a fixed {valuationYear} reference year, make, model, age,
            mileage and condition.{" "}
            {mode !== "value" &&
              "Mock offers are 92% of estimated market value, rounded to £100, subject to inspection."}
          </p>
        </div>
        {mode === "sell" && (
          <p className="mt-4 flex items-center gap-2 text-slate-500 text-sm">
            <Check className="size-4 text-blue-600" />
            {photos.length} photo{photos.length !== 1 ? "s" : ""} reviewed
            locally · no upload
          </p>
        )}
        {difference && (
          <div className="mt-4 space-y-3 rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <h3 className="font-semibold">Your switch to {targetName}</h3>
            <div className="flex justify-between text-sm">
              <span>Next car</span>
              <span>{formatCurrency(targetPrice ?? 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Trade-in credit</span>
              <span>−{formatCurrency(result.instantOffer)}</span>
            </div>
            <div className="flex justify-between border-blue-200 border-t pt-3 font-bold">
              <span>
                {difference.credit > 0
                  ? "Credit remaining"
                  : "Difference to pay"}
              </span>
              <span>
                {formatCurrency(difference.credit || difference.toPay)}
              </span>
            </div>
            <p className="text-slate-500 text-xs">
              Assumes your trade-in is owned outright. Existing finance must be
              settled separately.
            </p>
          </div>
        )}
        <div className="mt-6 space-y-3">
          <Button
            variant="outline"
            className="h-12 w-full rounded-xl"
            onClick={reset}
          >
            Edit car details
          </Button>
          {mode !== "trade" && (
            <Button
              className="h-12 w-full rounded-xl"
              render={<Link href={mode === "value" ? "/sell" : "/cars"} />}
            >
              {mode === "value"
                ? "Explore selling your car"
                : "Find your next car"}
              <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
        <PrototypeNotice />
      </section>
    );
  }
  return (
    <section>
      <FlowHeading
        eyebrow={
          mode === "sell"
            ? "Sell with confidence"
            : mode === "trade"
              ? "Trade in & move up"
              : "A little clarity goes a long way"
        }
        title={title}
        description={
          mode === "sell"
            ? "Tell us a little about your car. Get a no-pressure, simulated offer in minutes."
            : mode === "trade"
              ? `Value your current car and see the difference for ${targetName}.`
              : "A few details. One clear estimate. Discover your car’s potential."
        }
      />
      <div className="mb-7">
        <div className="mb-3 flex items-center justify-between text-xs">
          <span className="font-semibold">{steps[step]}</span>
          <span className="text-slate-500">
            Step {step + 1} of {steps.length}
          </span>
        </div>
        <Progress
          value={((step + 1) / steps.length) * 100}
          aria-label="Form progress"
        />
      </div>
      <form noValidate onSubmit={submit}>
        <FormErrors errors={errors} />
        {step === 0 && (
          <VehicleFields draft={draft} setDraft={setDraft} errors={errors} />
        )}
        {step === 1 && (
          <VehicleFields
            draft={draft}
            setDraft={setDraft}
            errors={errors}
            conditionOnly
          />
        )}
        {step === 2 && (
          <PhotoUpload photos={photos} setPhotos={setPhotos} errors={errors} />
        )}
        <div className="mt-7 flex gap-3">
          {step > 0 && (
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-xl px-4"
              onClick={() => {
                setStep(step - 1);
                setErrors({});
              }}
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>
          )}
          <Button type="submit" className="h-12 flex-1 rounded-xl">
            {step === steps.length - 1
              ? mode === "sell"
                ? "Get my instant offer"
                : mode === "trade"
                  ? "See my price difference"
                  : "Get my valuation"
              : "Continue"}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </form>
      <div className="mt-6 flex items-center gap-2 text-slate-500 text-xs">
        <ShieldCheck className="size-4 text-blue-600" />
        No commitment. No personal information needed.
      </div>
      <PrototypeNotice />
    </section>
  );
}

export function TradeIn({
  targetPrice,
  targetName,
}: {
  targetPrice: number;
  targetName: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-2xl border border-blue-100 p-5">
      <div className="mb-3 flex items-center gap-2">
        <ArrowRightLeft className="size-5 text-blue-600" />
        <h2 className="font-semibold">Make your next move.</h2>
      </div>
      {!open ? (
        <>
          <p className="mb-4 text-slate-500 text-sm leading-6">
            Your current car could get you closer. See what a switch would look
            like.
          </p>
          <Button
            variant="outline"
            className="h-12 w-full rounded-xl border-blue-200 text-blue-700"
            onClick={() => setOpen(true)}
          >
            Trade in your car
            <ArrowRight className="size-4" />
          </Button>
        </>
      ) : (
        <>
          <Button
            variant="ghost"
            className="mb-5 text-slate-500"
            onClick={() => setOpen(false)}
          >
            Close trade-in estimate
          </Button>
          <VehicleFlow
            mode="trade"
            targetPrice={targetPrice}
            targetName={targetName}
          />
        </>
      )}
    </section>
  );
}
