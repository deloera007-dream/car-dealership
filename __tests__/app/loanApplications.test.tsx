import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ApplyForFinancingPage from "@/app/(main)/cars/[id]/apply/page";
import MyApplicationsPage from "@/app/(main)/my-applications/page";

const mocks = vi.hoisted(() => ({
  profile: vi.fn(),
  getCar: vi.fn(),
  applications: vi.fn(),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));
vi.mock("@/actions/auth/ensure-profile", () => ({
  ensureProfile: mocks.profile,
}));
vi.mock("@/actions/cars/get-car-by-id", () => ({ getCarById: mocks.getCar }));
vi.mock("@/actions/loan-applications/get-user-loan-applications", () => ({
  getUserLoanApplications: mocks.applications,
}));
vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
  notFound: mocks.notFound,
}));
vi.mock("@/components/loan-application/loan-application-form", () => ({
  LoanApplicationForm: ({
    carId,
    carPrice,
  }: {
    carId: string;
    carPrice: number;
  }) => (
    <div>
      Application form: {carId}, {carPrice}
    </div>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.profile.mockResolvedValue({ id: "profile-1" });
  mocks.getCar.mockResolvedValue({
    success: true,
    data: {
      id: "car-1",
      make: "Toyota",
      model: "Corolla",
      year: 2024,
      price: 20000,
      status: "AVAILABLE",
    },
  });
  mocks.applications.mockResolvedValue({ success: true, data: [] });
  mocks.redirect.mockImplementation(() => {
    throw new Error("redirect");
  });
  mocks.notFound.mockImplementation(() => {
    throw new Error("notFound");
  });
});

const params = () => ({ params: Promise.resolve({ id: "car-1" }) });

describe("financing pages", () => {
  it("redirects guests before reading applications", async () => {
    mocks.profile.mockResolvedValue(null);
    await expect(MyApplicationsPage()).rejects.toThrow("redirect");
    expect(mocks.redirect).toHaveBeenCalledWith(
      "/sign-in?redirect=%2Fmy-applications",
    );
    expect(mocks.applications).not.toHaveBeenCalled();
  });

  it("preserves the car-specific return route when requiring sign in", async () => {
    mocks.profile.mockResolvedValue(null);
    await expect(ApplyForFinancingPage(params())).rejects.toThrow("redirect");
    expect(mocks.redirect).toHaveBeenCalledWith(
      "/sign-in?redirect=%2Fcars%2Fcar-1%2Fapply",
    );
    expect(mocks.getCar).not.toHaveBeenCalled();
  });

  it("renders the authenticated applications page", async () => {
    render(await MyApplicationsPage());
    expect(
      screen.getByRole("heading", { name: "My Applications" }),
    ).toBeInTheDocument();
    expect(screen.getByText("No applications yet")).toBeInTheDocument();
  });

  it("renders an application form for an available car", async () => {
    render(await ApplyForFinancingPage(params()));
    expect(
      screen.getByText("Application form: car-1, 20000"),
    ).toBeInTheDocument();
  });

  it.each(["SOLD", "UNAVAILABLE"])(
    "does not offer a form for a %s car",
    async (status) => {
      const result = await mocks.getCar();
      mocks.getCar.mockResolvedValue({
        ...result,
        data: { ...result.data, status },
      });
      render(await ApplyForFinancingPage(params()));
      expect(
        screen.getByText("This car is not available for financing."),
      ).toBeInTheDocument();
      expect(screen.queryByText(/Application form:/)).not.toBeInTheDocument();
    },
  );

  it("returns not found for a missing car", async () => {
    mocks.getCar.mockResolvedValue({ success: false, error: "Car not found" });
    await expect(ApplyForFinancingPage(params())).rejects.toThrow("notFound");
  });
});
