"use client";

import {
  Banknote,
  CarFront,
  ChevronRight,
  CircleUserRound,
  HandCoins,
  MapPin,
  ShieldCheck,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { isMarketplaceRoute, prototypeMode } from "@/lib/prototype-mode";

const tabs = [
  { href: "/cars", label: "Buy", icon: CarFront },
  { href: "/sell", label: "Sell", icon: Tag },
  { href: "/value", label: "Value", icon: HandCoins },
  { href: "/loans", label: "Loans", icon: Banknote },
  { href: "/account", label: "Account", icon: CircleUserRound },
];

export function MarketplaceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (!isMarketplaceRoute(pathname))
    return (
      <main className="container mx-auto my-20 min-h-screen px-4">
        {children}
      </main>
    );
  return (
    <div className="marketplace mx-auto min-h-dvh max-w-[480px] bg-white shadow-xl">
      <a href="#marketplace-content" className="sr-only focus:not-sr-only">
        Skip to content
      </a>
      <header className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
        <Link href="/cars" className="font-black text-2xl tracking-tighter">
          kavak<span className="text-blue-600">/</span>
          <span className="ml-2 font-medium text-[10px] text-slate-500 tracking-widest">
            CONCEPT
          </span>
        </Link>
        <span className="flex items-center gap-1 text-xs">
          <MapPin className="size-3.5 text-blue-600" /> United Kingdom
        </span>
      </header>
      <main
        id="marketplace-content"
        className="px-5 pt-6 pb-[calc(7rem+env(safe-area-inset-bottom))]"
      >
        {children}
      </main>
      <nav
        aria-label="Main navigation"
        className="marketplace-tabs fixed bottom-0 left-1/2 z-40 grid w-full max-w-[480px] -translate-x-1/2 grid-cols-5 border-slate-100 border-t bg-white/95 px-2 pt-2 pb-[max(.75rem,env(safe-area-inset-bottom))] backdrop-blur-lg"
      >
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold ${active ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50"}`}
            >
              <Icon className="size-5" strokeWidth={active ? 2.4 : 1.7} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function FlowHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-7">
      <p className="mb-3 font-bold text-blue-600 text-xs uppercase tracking-[.18em]">
        {eyebrow}
      </p>
      <h1 className="mb-3 font-bold text-[32px] leading-[1.12] tracking-tight">
        {title}
      </h1>
      <p className="text-slate-500 text-sm leading-6">{description}</p>
    </div>
  );
}

export function PrototypeNotice() {
  return (
    <p className="mt-6 flex gap-2 text-slate-500 text-xs leading-5">
      <ShieldCheck className="mt-0.5 size-4 shrink-0" />
      Prototype only. Estimates are illustrative, not binding offers or
      financial advice. Nothing is submitted or uploaded.
    </p>
  );
}

export function MarketplaceAccount() {
  return (
    <>
      <FlowHeading
        eyebrow="Your garage"
        title="Your next chapter starts here."
        description="Explore every step of car ownership. No account is needed for the prototype."
      />
      <div className="mb-6 rounded-2xl bg-blue-50 p-6">
        <CircleUserRound className="mb-4 size-10 text-blue-600" />
        <h2 className="font-semibold text-lg">Welcome, explorer</h2>
        <p className="mt-2 text-slate-500 text-sm">
          {prototypeMode
            ? "You’re in demo mode. Your details stay in this browser session."
            : "Use the dealership’s sign-in to manage saved cars and reservations."}
        </p>
      </div>
      {tabs.slice(0, 4).map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="mb-3 flex items-center gap-3 rounded-xl border p-4 font-semibold text-sm"
        >
          <Icon className="size-5 text-blue-600" />
          {label} a car
          <ChevronRight className="ml-auto size-4" />
        </Link>
      ))}
      {!prototypeMode && (
        <Link
          className="block py-4 text-blue-600 text-sm underline"
          href="/saved-cars"
        >
          Saved cars & sign in
        </Link>
      )}
      <PrototypeNotice />
    </>
  );
}
