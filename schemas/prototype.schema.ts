import { z } from "zod";
import { valuationYear, vehicleCatalog } from "@/lib/vehicle-catalog";

const numeric = (schema: z.ZodNumber) =>
  z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce.number().pipe(schema),
  );

export const vehicleDetailsSchema = z
  .object({
    make: z.string().min(1, "Choose a make"),
    model: z.string().min(1, "Choose a model"),
    year: numeric(
      z
        .number()
        .int()
        .min(1990, "Use a year from 1990 onwards")
        .max(valuationYear, `Use ${valuationYear} or earlier`),
    ),
    mileage: numeric(
      z
        .number()
        .int()
        .min(0, "Mileage cannot be negative")
        .max(500000, "Mileage must be at most 500,000 miles"),
    ),
  })
  .refine((car) => typeof vehicleCatalog[car.make]?.[car.model] === "number", {
    path: ["model"],
    message: "Choose a supported make and model",
  });

export const conditionSchema = z.object({
  condition: z.enum(["excellent", "good", "fair"]),
});
export const valuationSchema = vehicleDetailsSchema.safeExtend(
  conditionSchema.shape,
);

export const photoSchema = z.object({
  name: z.string(),
  type: z.enum(["image/jpeg", "image/png", "image/webp"], {
    error: "Use JPG, PNG or WebP photos",
  }),
  size: z
    .number()
    .positive("Photo must not be empty")
    .max(5 * 1024 * 1024, "Each photo must be 5 MB or smaller"),
});
export const photosSchema = z
  .array(photoSchema)
  .min(1, "Add at least one photo")
  .max(6, "Add no more than six photos");
export const sellSchema = valuationSchema.safeExtend({ photos: photosSchema });

export const equityLoanSchema = z.object({
  carValue: numeric(
    z.number().positive("Enter a car value above zero").max(1000000),
  ),
  balance: numeric(
    z.number().min(0, "Balance cannot be negative").max(1000000),
  ),
  term: z.coerce
    .number()
    .refine(
      (value) => [12, 24, 36, 48].includes(value),
      "Choose a supported loan term",
    ),
});

export type VehicleValuationInput = z.infer<typeof valuationSchema>;
export type EquityLoanInput = z.infer<typeof equityLoanSchema>;
