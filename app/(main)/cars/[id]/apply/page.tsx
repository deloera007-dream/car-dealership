import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ensureProfile } from "@/actions/auth/ensure-profile";
import { getCarById } from "@/actions/cars/get-car-by-id";
import { LoanApplicationForm } from "@/components/loan-application/loan-application-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/config/routes";
import { CarStatusEnum as CarStatus } from "@/enums/car-status";
import { formatCurrency } from "@/lib/helpers/format-currency";
import { createSignInRedirect } from "@/lib/route/create-sign-in-redirect";

export const metadata = {
  title: "Apply for Financing",
  description: "Submit a financing application for your next car",
};

export default async function ApplyForFinancingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await ensureProfile();
  if (!user) redirect(createSignInRedirect(ROUTES.APPLY_FOR_FINANCING(id)));

  const result = await getCarById(id);
  if (!result.success) notFound();
  const car = result.data;

  return (
    <div className="mx-auto max-w-xl space-y-6 py-12">
      <Link
        href={ROUTES.HOME.CAR_DETAILS(id)}
        className="text-blue-600 hover:underline"
      >
        Back to car details
      </Link>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Apply for Financing</CardTitle>
          <CardDescription>
            {car.year} {car.make} {car.model} · {formatCurrency(car.price)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {car.status === CarStatus.AVAILABLE ? (
            <LoanApplicationForm carId={id} carPrice={car.price} />
          ) : (
            <Alert>
              <AlertDescription>
                This car is not available for financing.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
