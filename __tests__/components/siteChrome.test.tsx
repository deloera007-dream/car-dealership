import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SiteChrome } from "@/components/site-chrome";

const state = vi.hoisted(() => ({
  pathname: "/saved-cars",
  signOut: vi.fn().mockResolvedValue({ error: null }),
  push: vi.fn(),
}));

vi.mock("@/lib/prototype-mode", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/prototype-mode")>()),
  prototypeMode: true,
}));
vi.mock("next/navigation", () => ({
  usePathname: () => state.pathname,
  useRouter: () => ({ push: state.push }),
}));
vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));
vi.mock("@/providers/supabase-provider", () => ({
  default: ({ children }: { children: ReactNode }) => (
    <div data-testid="supabase-provider">{children}</div>
  ),
  useSupabaseClient: () => ({ auth: { signOut: state.signOut } }),
}));
vi.mock("@/providers/user-provider", () => ({
  default: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@/hooks/use-user", () => ({
  useUser: () => ({
    user: { email: "driver@example.com" },
    userDetails: { role: "ADMIN" },
  }),
}));
vi.mock("@/hooks/use-auth-modal", () => ({
  default: () => ({ onOpen: vi.fn() }),
}));
vi.mock("@/components/modals/sign-in-modal", () => ({
  SignInModal: () => null,
}));
vi.mock("@/components/header/desktop-nav", () => ({ DesktopNav: () => null }));
vi.mock("@/components/header/mobile-nav", () => ({ MobileNav: () => null }));
vi.mock("@/components/header/user-menu", () => ({
  UserMenu: ({
    onSignOut,
    isAuthenticated,
  }: {
    onSignOut: () => void;
    isAuthenticated: boolean;
  }) =>
    isAuthenticated && (
      <button type="button" onClick={onSignOut}>
        Sign out
      </button>
    ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  state.pathname = "/saved-cars";
});

function renderChrome(header: ReactNode = null) {
  return render(
    <SiteChrome header={header} footer={<p>Legacy footer</p>}>
      <p>Page content</p>
    </SiteChrome>,
  );
}

describe("prototype legacy navigation", () => {
  it.each(["/saved-cars", "/reservations"])(
    "retains the authenticated sign-out menu on %s when the root omits its server header",
    async (pathname) => {
      state.pathname = pathname;
      renderChrome();
      expect(screen.getByTestId("supabase-provider")).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "Admin Portal" }),
      ).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
      await waitFor(() => expect(state.signOut).toHaveBeenCalledOnce());
      await waitFor(() => expect(state.push).toHaveBeenCalledWith("/"));
    },
  );
  it("preserves the supplied server header on legacy routes", () => {
    renderChrome(<p>Server header</p>);
    expect(screen.getByText("Server header")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Sign out" }),
    ).not.toBeInTheDocument();
  });
  it.each([
    "/cars",
    "/cars/demo-toyota-corolla",
    "/sell",
    "/value",
    "/loans",
    "/account",
  ])(
    "keeps mock route %s free of auth providers and legacy chrome",
    (pathname) => {
      state.pathname = pathname;
      renderChrome(<p>Server header</p>);
      expect(screen.getByText("Page content")).toBeInTheDocument();
      expect(screen.queryByTestId("supabase-provider")).not.toBeInTheDocument();
      expect(screen.queryByText("Server header")).not.toBeInTheDocument();
      expect(screen.queryByText("Legacy footer")).not.toBeInTheDocument();
    },
  );
});
