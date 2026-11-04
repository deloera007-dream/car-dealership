import { beforeEach, describe, expect, it, vi } from "vitest";
import { getUserLoanApplications } from "@/actions/loan-applications/get-user-loan-applications";
import { submitLoanApplication } from "@/actions/loan-applications/submit-loan-application";

const mocks = vi.hoisted(() => {
  const builder = () => {
    const b: any = {};
    for (const method of ["select", "eq", "insert", "single", "order"]) {
      b[method] = vi.fn(() => b);
    }
    return b;
  };
  return {
    user: builder(),
    car: builder(),
    applications: builder(),
    auth: vi.fn(),
    createClient: vi.fn(),
    revalidatePath: vi.fn(),
  };
});

vi.mock("@/lib/supabase/supabase", () => ({
  createClient: mocks.createClient,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

const input = { carId: "car-1", amount: 15000.25, term: 36 };
const application = {
  id: "app-1",
  user_id: "profile-1",
  car_id: "car-1",
  amount: 15000.25,
  term: 36,
  status: "PENDING",
  created_at: "2026-11-04T12:00:00Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createClient.mockResolvedValue({
    auth: { getUser: mocks.auth },
    from: (table: string) =>
      table === "User"
        ? mocks.user
        : table === "Car"
          ? mocks.car
          : mocks.applications,
  });
  mocks.auth.mockResolvedValue({
    data: { user: { id: "auth-1" } },
    error: null,
  });
  mocks.user.single.mockResolvedValue({
    data: { id: "profile-1" },
    error: null,
  });
  mocks.car.single.mockResolvedValue({
    data: { id: "car-1", price: 20000 },
    error: null,
  });
  mocks.applications.single.mockResolvedValue({
    data: application,
    error: null,
  });
  mocks.applications.order.mockResolvedValue({
    data: [application],
    error: null,
  });
});

describe("submitLoanApplication", () => {
  it("validates input on the server before touching the database", async () => {
    expect(
      (await submitLoanApplication({ ...input, amount: -1 })).success,
    ).toBe(false);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("derives ownership from authentication and forces initial pending status", async () => {
    expect(
      await submitLoanApplication({
        ...input,
        user_id: "victim",
        status: "APPROVED",
      }),
    ).toEqual({ success: true, data: application });
    expect(mocks.user.eq).toHaveBeenCalledWith("supabaseAuthUserId", "auth-1");
    expect(mocks.car.eq).toHaveBeenCalledWith("id", "car-1");
    expect(mocks.car.eq).toHaveBeenCalledWith("status", "AVAILABLE");
    expect(mocks.applications.insert).toHaveBeenCalledWith({
      user_id: "profile-1",
      car_id: "car-1",
      amount: 15000.25,
      term: 36,
      status: "PENDING",
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/my-applications");
  });

  it("requires a valid authenticated session", async () => {
    mocks.auth.mockResolvedValue({ data: { user: null }, error: null });
    expect((await submitLoanApplication(input)).success).toBe(false);
    expect(mocks.applications.insert).not.toHaveBeenCalled();
  });

  it("rejects auth errors even with a user in the response", async () => {
    mocks.auth.mockResolvedValue({
      data: { user: { id: "auth-1" } },
      error: new Error("expired"),
    });
    expect((await submitLoanApplication(input)).success).toBe(false);
    expect(mocks.applications.insert).not.toHaveBeenCalled();
  });

  it("rejects missing profiles", async () => {
    mocks.user.single.mockResolvedValue({ data: null, error: null });
    expect((await submitLoanApplication(input)).success).toBe(false);
    expect(mocks.applications.insert).not.toHaveBeenCalled();
  });

  it("rejects unavailable or missing cars", async () => {
    mocks.car.single.mockResolvedValue({ data: null, error: null });
    expect((await submitLoanApplication(input)).success).toBe(false);
    expect(mocks.applications.insert).not.toHaveBeenCalled();
  });

  it("rejects amounts above the current database price", async () => {
    const result = await submitLoanApplication({ ...input, amount: 20000.01 });
    expect(result).toEqual({
      success: false,
      error: "Amount cannot exceed the car price",
    });
    expect(mocks.applications.insert).not.toHaveBeenCalled();
  });

  it("does not revalidate or expose database errors on failed insert", async () => {
    mocks.applications.single.mockResolvedValue({
      data: null,
      error: { message: "private database error" },
    });
    const result = await submitLoanApplication(input);
    expect(result.success).toBe(false);
    expect(result).not.toHaveProperty("error", "private database error");
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("handles unexpected client errors", async () => {
    mocks.createClient.mockRejectedValue(new Error("network"));
    expect((await submitLoanApplication(input)).success).toBe(false);
  });
});

describe("getUserLoanApplications", () => {
  it("returns only the current profile's applications newest first", async () => {
    expect(await getUserLoanApplications()).toEqual({
      success: true,
      data: [application],
    });
    expect(mocks.user.eq).toHaveBeenCalledWith("supabaseAuthUserId", "auth-1");
    expect(mocks.applications.eq).toHaveBeenCalledWith("user_id", "profile-1");
    expect(mocks.applications.order).toHaveBeenCalledWith("created_at", {
      ascending: false,
    });
  });

  it("requires authentication", async () => {
    mocks.auth.mockResolvedValue({ data: { user: null }, error: null });
    expect((await getUserLoanApplications()).success).toBe(false);
    expect(mocks.applications.select).not.toHaveBeenCalled();
  });

  it("rejects missing profiles", async () => {
    mocks.user.single.mockResolvedValue({ data: null, error: null });
    expect((await getUserLoanApplications()).success).toBe(false);
    expect(mocks.applications.select).not.toHaveBeenCalled();
  });

  it("returns an empty list when no applications exist", async () => {
    mocks.applications.order.mockResolvedValue({ data: [], error: null });
    expect(await getUserLoanApplications()).toEqual({
      success: true,
      data: [],
    });
  });

  it("returns a failure rather than an empty list on query errors", async () => {
    mocks.applications.order.mockResolvedValue({
      data: null,
      error: { message: "query failure" },
    });
    expect((await getUserLoanApplications()).success).toBe(false);
  });
});
