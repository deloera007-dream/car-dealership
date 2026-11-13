import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoanApplicationForm } from "@/components/loan-application/loan-application-form";

const mocks = vi.hoisted(() => ({
  submit: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
  success: vi.fn(),
}));
vi.mock("@/actions/loan-applications/submit-loan-application", () => ({
  submitLoanApplication: mocks.submit,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));
vi.mock("sonner", () => ({ toast: { success: mocks.success } }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.submit.mockResolvedValue({ success: true, data: { id: "app-1" } });
});

function mount() {
  render(<LoanApplicationForm carId="car-1" carPrice={20000} />);
  return screen.getByRole("button", { name: "Submit application" });
}

describe("LoanApplicationForm", () => {
  it("defaults to full price and submits numeric values", async () => {
    fireEvent.click(mount());
    await waitFor(() =>
      expect(mocks.submit).toHaveBeenCalledWith({
        carId: "car-1",
        amount: 20000,
        term: 36,
      }),
    );
    expect(mocks.push).toHaveBeenCalledWith("/my-applications");
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("submits a partial amount and selected term", async () => {
    const submit = mount();
    fireEvent.change(screen.getByLabelText("Requested amount (GBP)"), {
      target: { value: "12000.25" },
    });
    fireEvent.change(screen.getByLabelText("Term (months)"), {
      target: { value: "60" },
    });
    fireEvent.click(submit);
    await waitFor(() =>
      expect(mocks.submit).toHaveBeenCalledWith({
        carId: "car-1",
        amount: 12000.25,
        term: 60,
      }),
    );
  });

  it.each(["0", "-1", "20000.01", "12.345", ""])(
    "blocks invalid amount '%s' with a field error",
    async (value) => {
      const submit = mount();
      fireEvent.change(screen.getByLabelText("Requested amount (GBP)"), {
        target: { value },
      });
      fireEvent.click(submit);
      expect(await screen.findByRole("alert")).toBeInTheDocument();
      expect(mocks.submit).not.toHaveBeenCalled();
    },
  );

  it("shows server errors without navigating and preserves values", async () => {
    mocks.submit.mockResolvedValue({
      success: false,
      error: "Car is no longer available",
    });
    fireEvent.click(mount());
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Car is no longer available",
    );
    expect(screen.getByLabelText("Requested amount (GBP)")).toHaveValue(20000);
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("handles transport failures", async () => {
    mocks.submit.mockRejectedValue(new Error("offline"));
    fireEvent.click(mount());
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to submit",
    );
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("disables submission while the action is pending", async () => {
    let resolve: (value: unknown) => void = () => {};
    mocks.submit.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    fireEvent.click(mount());
    expect(
      await screen.findByRole("button", { name: "Submitting application..." }),
    ).toBeDisabled();
    expect(screen.getByLabelText("Requested amount (GBP)")).toBeDisabled();
    resolve({ success: false, error: "Try again" });
    await screen.findByRole("alert");
    expect(
      screen.getByRole("button", { name: "Submit application" }),
    ).toBeEnabled();
  });
});
