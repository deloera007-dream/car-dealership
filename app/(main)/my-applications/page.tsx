import { redirect } from "next/navigation";
import { ensureProfile } from "@/actions/auth/ensure-profile";
import { getUserLoanApplications } from "@/actions/loan-applications/get-user-loan-applications";
import { LoanApplicationsList } from "@/components/loan-application/loan-applications-list";
import { ROUTES } from "@/config/routes";
import { createSignInRedirect } from "@/lib/route/create-sign-in-redirect";

export const metadata = {
  title: "My Applications",
  description: "View your car financing applications and their status",
};

export default async function MyApplicationsPage() {
  const user = await ensureProfile();
  if (!user) redirect(createSignInRedirect(ROUTES.MY_APPLICATIONS));

  const result = await getUserLoanApplications();
  return (
    <div className="space-y-6 py-12">
      <h1 className="gradient-title text-4xl md:text-6xl">My Applications</h1>
      <p className="text-muted-foreground">
        Track your financing requests and their current status.
      </p>
      <LoanApplicationsList result={result} />
    </div>
  );
}
