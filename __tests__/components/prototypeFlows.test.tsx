import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MarketplaceShell } from "@/components/marketplace-shell";
import { EquityLoanFlow } from "@/components/prototype-loan-form";
import { TradeIn, VehicleFlow } from "@/components/prototype-vehicle-form";

vi.mock("next/navigation", () => ({ usePathname: () => "/value" }));
vi.mock("next/image", () => ({
  default: ({ unoptimized: _unoptimized, ...props }: any) => <img {...props} />,
}));

function enterCar() {
  fireEvent.change(screen.getByLabelText("Make"), {
    target: { value: "Toyota" },
  });
  fireEvent.change(screen.getByLabelText("Model"), {
    target: { value: "Corolla" },
  });
  fireEvent.change(screen.getByLabelText("Year"), {
    target: { value: "2023" },
  });
  fireEvent.change(screen.getByLabelText("Mileage (miles)"), {
    target: { value: "20000" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
}

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
});

describe("vehicle forms", () => {
  it("validates the first step before progressing", () => {
    render(<VehicleFlow />);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Choose a make");
    expect(screen.getByText("Step 1 of 2")).toBeInTheDocument();
  });
  it("completes valuation, allows edits and preserves entries", () => {
    render(<VehicleFlow />);
    enterCar();
    fireEvent.click(screen.getByRole("button", { name: "Get my valuation" }));
    expect(
      screen.getByRole("heading", { name: "£18,100" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Edit car details" }));
    expect(screen.getByLabelText("Mileage (miles)")).toHaveValue(20000);
  });
  it("resets model when make changes", () => {
    render(<VehicleFlow />);
    fireEvent.change(screen.getByLabelText("Make"), {
      target: { value: "Toyota" },
    });
    fireEvent.change(screen.getByLabelText("Model"), {
      target: { value: "Corolla" },
    });
    fireEvent.change(screen.getByLabelText("Make"), {
      target: { value: "Ford" },
    });
    expect(screen.getByLabelText("Model")).toHaveValue("");
  });
  it("requires a valid photo before showing a mock selling offer", () => {
    render(<VehicleFlow mode="sell" />);
    enterCar();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Get my instant offer" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Add at least one photo",
    );
    fireEvent.change(screen.getByLabelText(/Choose car photos/), {
      target: {
        files: [new File(["bad"], "bad.svg", { type: "image/svg+xml" })],
      },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Get my instant offer" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Use JPG, PNG or WebP");
    fireEvent.change(screen.getByLabelText(/Choose car photos/), {
      target: {
        files: [new File(["photo"], "car.jpg", { type: "image/jpeg" })],
      },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Get my instant offer" }),
    );
    expect(
      screen.getByRole("heading", { name: "£16,700" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/1 photo reviewed locally/)).toBeInTheDocument();
  });
  it("supports back navigation without losing details", () => {
    render(<VehicleFlow mode="sell" />);
    enterCar();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByLabelText("Year")).toHaveValue(2023);
    expect(screen.getByLabelText("Model")).toHaveValue("Corolla");
  });
  it("opens a trade-in from car details and computes the price difference", () => {
    render(<TradeIn targetPrice={21900} targetName="Toyota Corolla" />);
    fireEvent.click(screen.getByRole("button", { name: "Trade in your car" }));
    enterCar();
    fireEvent.click(
      screen.getByRole("button", { name: "See my price difference" }),
    );
    expect(screen.getByText("Difference to pay")).toBeInTheDocument();
    expect(screen.getByText("£5,200")).toBeInTheDocument();
  });
});

describe("loan form", () => {
  it("shows validation and calculates a simulated offer", () => {
    render(<EquityLoanFlow />);
    fireEvent.click(
      screen.getByRole("button", { name: "Explore my loan offer" }),
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Estimated car value (£)"), {
      target: { value: "20000" },
    });
    fireEvent.change(screen.getByLabelText("Outstanding loan balance (£)"), {
      target: { value: "5000" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Explore my loan offer" }),
    );
    expect(
      screen.getByRole("heading", { name: "£10,500" }),
    ).toBeInTheDocument();
    expect(screen.getByText("36 months")).toBeInTheDocument();
    expect(screen.getByText("12.9%")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Adjust my numbers" }));
    expect(screen.getByLabelText("Estimated car value (£)")).toHaveValue(20000);
  });
  it("shows a no-equity outcome rather than a loan", () => {
    render(<EquityLoanFlow />);
    fireEvent.change(screen.getByLabelText("Estimated car value (£)"), {
      target: { value: "20000" },
    });
    fireEvent.change(screen.getByLabelText("Outstanding loan balance (£)"), {
      target: { value: "25000" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Explore my loan offer" }),
    );
    expect(screen.getByText("No offer available")).toBeInTheDocument();
    expect(screen.getByText(/no available equity/)).toBeInTheDocument();
  });
});

it("provides five accessible bottom tabs with an active state", () => {
  render(
    <MarketplaceShell>
      <p>Content</p>
    </MarketplaceShell>,
  );
  expect(
    screen.getByRole("navigation", { name: "Main navigation" }),
  ).toBeInTheDocument();
  for (const name of ["Buy", "Sell", "Value", "Loans", "Account"])
    expect(screen.getByRole("link", { name })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Value" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});
