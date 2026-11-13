import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoanApplicationsList } from "@/components/loan-application/loan-applications-list";
import type { LoanApplicationWithCar } from "@/types/loan-application/loan-application";

const application: LoanApplicationWithCar = {
  id: "app-1",
  user_id: "profile-1",
  car_id: "car-1",
  amount: 12000.25,
  term: 48,
  status: "PENDING",
  created_at: "2026-11-04T12:00:00Z",
  car: {
    id: "car-1",
    model: "Corolla",
    year: 2024,
    carMake: { name: "Toyota" },
  },
};

describe("LoanApplicationsList", () => {
  it("offers car browsing when empty", () => {
    render(<LoanApplicationsList result={{ success: true, data: [] }} />);
    expect(screen.getByText("No applications yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse cars" })).toHaveAttribute(
      "href",
      "/cars",
    );
  });

  it("shows failures rather than an empty success state", () => {
    render(
      <LoanApplicationsList
        result={{ success: false, error: "Unable to load" }}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Unable to load");
    expect(screen.queryByText("No applications yet")).not.toBeInTheDocument();
  });

  it.each(["PENDING", "APPROVED", "REJECTED"] as const)(
    "displays amount, term, date and %s status",
    (status) => {
      render(
        <LoanApplicationsList
          result={{ success: true, data: [{ ...application, status }] }}
        />,
      );
      expect(
        screen.getByRole("link", { name: "2024 Toyota Corolla" }),
      ).toHaveAttribute("href", "/cars/car-1");
      expect(screen.getByText("£12,000.25")).toBeInTheDocument();
      expect(screen.getByText("48 months")).toBeInTheDocument();
      expect(screen.getByText("4 Nov 2026")).toBeInTheDocument();
      expect(
        screen.getByText(status[0] + status.slice(1).toLowerCase()),
      ).toBeInTheDocument();
    },
  );

  it("handles missing car details", () => {
    render(
      <LoanApplicationsList
        result={{ success: true, data: [{ ...application, car: null }] }}
      />,
    );
    expect(screen.getByText("Car details unavailable")).toBeInTheDocument();
  });
});
