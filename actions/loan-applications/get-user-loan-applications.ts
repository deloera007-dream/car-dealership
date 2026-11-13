"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getLogger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/supabase";
import type { ActionResponse } from "@/types/common/action-response";
import type { Database } from "@/types/database.types";
import type { LoanApplicationWithCar } from "@/types/loan-application/loan-application";

const log = getLogger(["app", "actions", "loan-applications"]);

export async function getUserLoanApplications(): Promise<
  ActionResponse<LoanApplicationWithCar[]>
> {
  try {
    const supabase: SupabaseClient<Database> = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !authUser) {
      return {
        success: false,
        error: "Please sign in to view your applications",
      };
    }

    const { data: user, error: userError } = await supabase
      .from("User")
      .select("id")
      .eq("supabaseAuthUserId", authUser.id)
      .single();
    if (userError || !user) {
      return { success: false, error: "Your user profile could not be loaded" };
    }

    const { data, error } = await supabase
      .from("loan_applications")
      .select("*, car:Car(id, model, year, carMake:CarMake(name))")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;

    return { success: true, data: data ?? [] };
  } catch (error) {
    log.error("Unable to load loan applications: {error}", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return {
      success: false,
      error: "Unable to load your applications. Please try again.",
    };
  }
}
