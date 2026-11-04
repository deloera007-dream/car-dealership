import { format } from "date-fns";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/config/routes";
import type { ActionResponse } from "@/types/common/action-response";
import type { LoanApplicationWithCar } from "@/types/loan-application/loan-application";

const STATUS_LABELS = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
} as const;

export function LoanApplicationsList({
  result,
}: {
  result: ActionResponse<LoanApplicationWithCar[]>;
}) {
  if (!result.success) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertDescription>{result.error}</AlertDescription>
      </Alert>
    );
  }

  if (!result.data.length) {
    return (
      <div className="space-y-4 rounded-lg border p-8 text-center">
        <h2 className="font-semibold text-xl">No applications yet</h2>
        <p className="text-muted-foreground">
          Find a car and choose Apply for Financing to get started.
        </p>
        <Link href={ROUTES.HOME.CARS} className="text-blue-600 hover:underline">
          Browse cars
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {result.data.map((application) => (
        <Card key={application.id}>
          <CardHeader>
            <CardTitle>
              {application.car ? (
                <Link
                  href={ROUTES.HOME.CAR_DETAILS(application.car_id)}
                  className="hover:underline"
                >
                  {application.car.year} {application.car.carMake?.name}{" "}
                  {application.car.model}
                </Link>
              ) : (
                "Car details unavailable"
              )}
            </CardTitle>
            <Badge
              variant={
                application.status === "REJECTED" ? "destructive" : "secondary"
              }
            >
              {STATUS_LABELS[application.status]}
            </Badge>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Requested amount</dt>
                <dd className="font-medium">
                  {application.amount.toLocaleString("en-GB", {
                    style: "currency",
                    currency: "GBP",
                  })}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Term</dt>
                <dd>{application.term} months</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Submitted</dt>
                <dd>
                  <time dateTime={application.created_at}>
                    {format(new Date(application.created_at), "d MMM yyyy")}
                  </time>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
