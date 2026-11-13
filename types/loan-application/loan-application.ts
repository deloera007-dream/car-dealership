import type { Tables } from "@/types/database.types";

export type LoanApplication = Tables<"loan_applications">;

export type LoanApplicationWithCar = LoanApplication & {
  car: {
    id: string;
    model: string;
    year: number;
    carMake: { name: string } | null;
  } | null;
};
