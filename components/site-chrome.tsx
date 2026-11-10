"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SignInModal } from "@/components/modals/sign-in-modal";
import {
  isMarketplaceRoute,
  isPrototypeRoute,
  prototypeMode,
} from "@/lib/prototype-mode";
import SupabaseProvider from "@/providers/supabase-provider";
import UserProvider from "@/providers/user-provider";

export function SiteChrome({
  children,
  header,
  footer,
}: {
  children: ReactNode;
  header: ReactNode;
  footer: ReactNode;
}) {
  const pathname = usePathname();
  const marketplace = isMarketplaceRoute(pathname);
  if (prototypeMode && isPrototypeRoute(pathname)) return children;
  return (
    <SupabaseProvider>
      <UserProvider>
        {!marketplace && header}
        {children}
        {!marketplace && footer}
        <SignInModal />
      </UserProvider>
    </SupabaseProvider>
  );
}
