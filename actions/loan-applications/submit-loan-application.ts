"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { ROUTES } from "@/config/routes";
import { CarStatusEnum as CarStatus } from "@/enums/car-status";
import { getLogger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/supabase";
import { loanApplicationSchema } from "@/schemas/loan-application/loan-application.schema";
import type { ActionResponse } from "@/types/common/action-response";
import type { Database } from "@/types/database.types";
import type { LoanApplication } from "@/types/loan-application/loan-application";

const log = getLogger(["app", "actions", "loan-applications"]);

export async function submitLoanApplication(
  input: unknown,
): Promise<ActionResponse<LoanApplication>> {
  const validation = loanApplicationSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  try {
    const supabase: SupabaseClient<Database> = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !authUser) {
      return { success: false, error: "Please sign in to apply for financing" };
    }

    const { data: user, error: userError } = await supabase
      .from("User")
      .select("id")
      .eq("supabaseAuthUserId", authUser.id)
      .single();
    if (userError || !user) {
      return { success: false, error: "Your user profile could not be loaded" };
    }

    const { carId, amount, term } = validation.data;
    const { data: car, error: carError } = await supabase
      .from("Car")
      .select("id, price")
      .eq("id", carId)
      .eq("status", CarStatus.AVAILABLE)
      .single();
    if (carError || !car) {
      return {
        success: false,
        error: "This car is not available for financing",
      };
    }
    if (amount > Number(car.price)) {
      return { success: false, error: "Amount cannot exceed the car price" };
    }

    const { data: application, error } = await supabase
      .from("loan_applications")
      .insert({
        user_id: user.id,
        car_id: carId,
        amount,
        term,
        status: "PENDING",
      })
      .select()
      .single();
    if (error || !application) {
      log.error("Loan application insert failed: {error}", {
        error: error?.message,
      });
      return {
        success: false,
        error: "Unable to submit your application. Please try again.",
      };
    }

    revalidatePath(ROUTES.MY_APPLICATIONS);
    return { success: true, data: application };
  } catch (error) {
    log.error("Loan application submission failed: {error}", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return {
      success: false,
      error: "Unable to submit your application. Please try again.",
    };
  }
}
