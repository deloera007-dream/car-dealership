import type React from "react";
import { MarketplaceShell } from "@/components/marketplace-shell";

/**
 * Renders the main content wrapper for the authenticated route tree.
 * Keeps main page content centered with consistent responsive padding.
 *
 * @param children - Page content to render inside the container.
 */
const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return <MarketplaceShell>{children}</MarketplaceShell>;
};

export default MainLayout;
