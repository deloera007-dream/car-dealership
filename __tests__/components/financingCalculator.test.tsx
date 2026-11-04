import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FinancingCalculator } from "@/app/(main)/cars/[id]/_components/financing-calculator";

function changeInput(label: RegExp, value: string) {
  fireEvent.change(screen.getByRole("spinbutton", { name: label }), {
    target: { value },
  });
}

describe("FinancingCalculator", () => {
  it("prefills the vehicle price and provides labelled inputs and an estimate", () => {
    render(<FinancingCalculator price={12000} />);

    expect(
      screen.getByRole("spinbutton", { name: /vehicle price/i }),
    ).toHaveValue(12000);
    expect(
      screen.getByRole("spinbutton", { name: /down payment/i }),
    ).toHaveValue(0);
    expect(screen.getByRole("spinbutton", { name: /apr/i })).toHaveValue(6.5);
    expect(screen.getByRole("spinbutton", { name: /loan term/i })).toHaveValue(
      60,
    );
    expect(screen.getByText("Monthly payment")).toBeInTheDocument();
    expect(screen.getByText("Total interest")).toBeInTheDocument();
    expect(screen.getByText("Total cost")).toBeInTheDocument();
    expect(screen.getByText(/excluding taxes and fees/)).toBeInTheDocument();
  });

  it("updates all results immediately when inputs change", () => {
    render(<FinancingCalculator price={12000} />);

    changeInput(/down payment/i, "2000");
    changeInput(/apr/i, "12");
    changeInput(/loan term/i, "12");

    expect(screen.getByText("£888.49")).toBeInTheDocument();
    expect(screen.getByText("£661.85")).toBeInTheDocument();
    expect(screen.getByText("£12,661.85")).toBeInTheDocument();

    changeInput(/vehicle price/i, "22000");

    expect(screen.getByText("£1,776.98")).toBeInTheDocument();
    expect(screen.getByText("£1,323.71")).toBeInTheDocument();
    expect(screen.getByText("£23,323.71")).toBeInTheDocument();
  });

  it("supports zero APR and full down payment", () => {
    render(<FinancingCalculator price={30000} />);

    changeInput(/down payment/i, "6000");
    changeInput(/apr/i, "0");

    expect(screen.getByText("£400.00")).toBeInTheDocument();
    expect(screen.getByText("£0.00")).toBeInTheDocument();
    expect(screen.getByText("£30,000.00")).toBeInTheDocument();

    changeInput(/down payment/i, "30000");

    expect(screen.getAllByText("£0.00")).toHaveLength(2);
    expect(screen.getByText("£30,000.00")).toBeInTheDocument();
  });

  it.each([/vehicle price/i, /down payment/i, /apr/i, /loan term/i])(
    "hides results and associates an error when %s is cleared, then recovers",
    (label) => {
      render(<FinancingCalculator price={12000} />);
      changeInput(label, "");

      const input = screen.getByRole("spinbutton", { name: label });
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input).toHaveAccessibleDescription();
      expect(screen.queryByText("Monthly payment")).not.toBeInTheDocument();
      expect(screen.getByText(/enter valid values/i)).toBeInTheDocument();

      changeInput(label, "12");

      expect(input).toHaveAttribute("aria-invalid", "false");
      expect(screen.getByText("Monthly payment")).toBeInTheDocument();
    },
  );

  it.each([
    [/vehicle price/i, "0", /price greater than 0/i],
    [/down payment/i, "-1", /down payment of 0 or more/i],
    [/down payment/i, "12001", /cannot exceed the vehicle price/i],
    [/apr/i, "-1", /apr of 0 or more/i],
    [/loan term/i, "0", /positive whole number of months/i],
    [/loan term/i, "12.5", /positive whole number of months/i],
  ] as const)("validates %s set to %s", (label, value, message) => {
    render(<FinancingCalculator price={12000} />);
    changeInput(label, value);

    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.queryByText("Monthly payment")).not.toBeInTheDocument();
  });
});
