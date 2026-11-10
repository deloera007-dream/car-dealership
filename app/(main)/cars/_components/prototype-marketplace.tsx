"use client";

import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  Heart,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { CarGallery } from "@/app/(main)/cars/[id]/_components/car-gallery";
import { PrototypeNotice } from "@/components/marketplace-shell";
import { TradeIn } from "@/components/prototype-vehicle-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { formatCurrency } from "@/lib/helpers/format-currency";
import { type PrototypeCar, prototypeCars } from "@/lib/prototype-inventory";

export function PrototypeMarketplace() {
  const params = useSearchParams();
  const router = useRouter();
  const [search, setSearch] = useState(params.get("search") || "");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const body = params.get("bodyType") || "All cars";
  const make = params.get("make") || "";
  const sort = params.get("sortBy") || "newest";
  const maxPrice = params.get("maxPrice") || "";
  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`/cars?${next.toString()}`, { scroll: false });
  }
  const cars = prototypeCars
    .filter(
      (car) =>
        (body === "All cars" || car.bodyType === body) &&
        (!make || car.make.toLowerCase() === make.toLowerCase()) &&
        (!maxPrice || car.price <= Number(maxPrice)) &&
        `${car.make} ${car.model}`
          .toLowerCase()
          .includes((params.get("search") || "").toLowerCase()),
    )
    .sort((a, b) =>
      sort === "priceAsc"
        ? a.price - b.price
        : sort === "priceDesc"
          ? b.price - a.price
          : b.year - a.year,
    );
  return (
    <>
      <p className="mb-3 flex items-center gap-1.5 font-semibold text-blue-600 text-xs">
        <Sparkles className="size-3.5" /> A better way to move
      </p>
      <h1 className="font-bold text-[36px] leading-[1.1] tracking-tight">
        Big possibilities.
        <br />
        Your next car.
      </h1>
      <p className="mt-3 mb-6 text-slate-500 text-sm">
        Find a car you’ll love. Enjoy the road ahead.
      </p>
      <form
        className="mb-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          update("search", search);
        }}
      >
        <div className="relative flex-1">
          <Search className="absolute top-3.5 left-3 size-4 text-slate-400" />
          <Input
            aria-label="Search cars"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search make or model"
            className="h-12 rounded-xl bg-slate-50 pl-9"
          />
        </div>
        <Button
          type="submit"
          className="h-12 rounded-xl"
          aria-label="Search inventory"
        >
          <ArrowRight className="size-5" />
        </Button>
        <Button
          variant="outline"
          className="h-12 w-12 rounded-xl"
          aria-label="Toggle filters"
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          <SlidersHorizontal className="size-5" />
        </Button>
      </form>
      {filtersOpen && (
        <div className="mb-5 space-y-3 rounded-2xl border bg-slate-50 p-4">
          <label className="block text-sm">
            Make
            <NativeSelect
              className="mt-1 w-full"
              value={make}
              onChange={(e) => update("make", e.target.value)}
            >
              <option value="">Any make</option>
              {["Toyota", "Honda", "BMW"].map((name) => (
                <option key={name}>{name}</option>
              ))}
            </NativeSelect>
          </label>
          <label className="block text-sm">
            Maximum price (£)
            <Input
              type="number"
              min="0"
              value={maxPrice}
              onChange={(e) => update("maxPrice", e.target.value)}
              className="mt-1"
            />
          </label>
          <Button
            variant="outline"
            onClick={() => {
              setSearch("");
              router.replace("/cars", { scroll: false });
            }}
          >
            Reset filters
          </Button>
        </div>
      )}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {["All cars", "SUV", "Sedan", "Hatchback"].map((type) => (
          <Button
            key={type}
            variant={body === type ? "default" : "outline"}
            className="shrink-0 rounded-full px-5"
            onClick={() => update("bodyType", type === "All cars" ? "" : type)}
          >
            {type}
          </Button>
        ))}
      </div>
      <div className="mb-6 flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3">
        <ShieldCheck className="size-6 shrink-0 text-blue-600" />
        <div>
          <p className="font-semibold text-xs">Peace of mind comes standard</p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Sample inventory · No purchase or booking is made
          </p>
        </div>
      </div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-semibold text-sm">
          {cars.length} cars to discover
        </h2>
        <NativeSelect
          aria-label="Sort cars"
          value={sort}
          onChange={(e) => update("sortBy", e.target.value)}
        >
          <option value="newest">Newest first</option>
          <option value="priceAsc">Price: low to high</option>
          <option value="priceDesc">Price: high to low</option>
        </NativeSelect>
      </div>
      <div className="space-y-5">
        {cars.map((car) => (
          <PrototypeCarCard key={car.id} car={car} />
        ))}
      </div>
      {cars.length === 0 && (
        <div className="rounded-2xl border p-8 text-center">
          <h2 className="font-bold">No cars found</h2>
          <p className="my-3 text-slate-500 text-sm">
            Try a different search or clear your filters.
          </p>
          <Button
            onClick={() => {
              setSearch("");
              router.replace("/cars");
            }}
          >
            Clear filters
          </Button>
        </div>
      )}
      <Link
        href="/sell"
        className="mt-7 flex items-center gap-4 rounded-2xl bg-slate-900 p-5 text-white"
      >
        <div>
          <p className="font-semibold">A fresh start for your car.</p>
          <p className="mt-1 text-slate-300 text-xs">
            Get a mock offer in a few easy steps.
          </p>
        </div>
        <ArrowRight className="ml-auto size-5 shrink-0" />
      </Link>
    </>
  );
}

function PrototypeCarCard({ car }: { car: PrototypeCar }) {
  const [saved, setSaved] = useState(false);
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200">
      <div className="relative bg-slate-100 px-5 pt-6 pb-2">
        <Badge className="absolute top-4 left-4 bg-white text-slate-700">
          {car.badge}
        </Badge>
        <Button
          variant="ghost"
          className="absolute top-3 right-3 z-10 rounded-full bg-white"
          size="icon"
          aria-label={`${saved ? "Unsave" : "Save"} ${car.make} ${car.model}`}
          aria-pressed={saved}
          onClick={() => setSaved(!saved)}
        >
          <Heart
            className={saved ? "fill-blue-600 text-blue-600" : "text-slate-600"}
          />
        </Button>
        <Link href={`/cars/${car.id}`}>
          <Image
            src={car.image}
            alt={`${car.make} ${car.model} — representative body style`}
            width={400}
            height={210}
            className="h-44 w-full object-contain"
          />
        </Link>
        <p className="text-right text-[9px] text-slate-500">
          Representative image
        </p>
      </div>
      <Link href={`/cars/${car.id}`} className="block p-4">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="font-bold text-lg">
            {car.make} {car.model}
          </h3>
          <BadgeCheck className="size-5 text-blue-600" />
        </div>
        <p className="text-slate-500 text-xs">
          {car.year} <span className="px-1">·</span>{" "}
          {car.mileage.toLocaleString("en-GB")} mi{" "}
          <span className="px-1">·</span> {car.transmission}
        </p>
        <div className="mt-4 flex items-end justify-between border-slate-100 border-t pt-3">
          <div>
            <p className="text-[10px] text-slate-500">Cash price</p>
            <p className="font-bold text-xl tracking-tight">
              {formatCurrency(car.price)}
            </p>
          </div>
          <span className="flex items-center gap-1 font-semibold text-blue-600 text-xs">
            Explore car <ArrowRight className="size-3.5" />
          </span>
        </div>
      </Link>
    </article>
  );
}

export function PrototypeCarDetails({ car }: { car: PrototypeCar }) {
  const [interested, setInterested] = useState(false);
  return (
    <>
      <Link
        href="/cars"
        className="mb-5 flex items-center gap-2 text-slate-500 text-sm"
      >
        <ArrowLeft className="size-4" />
        All cars
      </Link>
      <CarGallery
        images={[car.image]}
        carName={`${car.make} ${car.model} (representative image)`}
      />
      <p className="mb-4 text-[10px] text-slate-500">
        Representative body-style image · Demo inventory
      </p>
      <Badge className="mb-3 bg-blue-50 text-blue-700">{car.badge}</Badge>
      <h1 className="font-bold text-3xl tracking-tight">
        {car.make} {car.model}
      </h1>
      <p className="mt-2 text-slate-500 text-sm">
        {car.year} · {car.mileage.toLocaleString("en-GB")} miles ·{" "}
        {car.transmission}
      </p>
      <p className="mt-5 font-bold text-3xl">{formatCurrency(car.price)}</p>
      <p className="mt-1 mb-6 text-slate-500 text-xs">
        Cash price · illustrative listing
      </p>
      <div className="mb-6 grid grid-cols-2 gap-3">
        {[
          ["Fuel", car.fuelType],
          ["Body", car.bodyType],
          ["Colour", car.color],
          ["Transmission", car.transmission],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-slate-50 p-4">
            <p className="text-slate-500 text-xs">{label}</p>
            <p className="mt-1 font-semibold text-sm">{value}</p>
          </div>
        ))}
      </div>
      <Button
        className="h-12 w-full rounded-xl"
        onClick={() => setInterested(true)}
      >
        {interested ? (
          <>
            <Check className="size-4" />
            Interest noted for this demo
          </>
        ) : (
          "I’m interested"
        )}
      </Button>
      {interested && (
        <p role="status" className="mt-3 text-slate-500 text-sm">
          This is a simulation. No reservation or payment was made.
        </p>
      )}
      <div className="mt-8">
        <TradeIn
          targetPrice={car.price}
          targetName={`${car.make} ${car.model}`}
        />
      </div>
      <PrototypeNotice />
    </>
  );
}
