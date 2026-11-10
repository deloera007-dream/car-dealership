import { getCarFilters } from "@/actions/cars/get-car-filters";
import { CarFilters } from "@/app/(main)/cars/_components/car-filters";
import { CarListings } from "@/app/(main)/cars/_components/cars-listing";
import { PrototypeMarketplace } from "@/app/(main)/cars/_components/prototype-marketplace";
import { prototypeMode } from "@/lib/prototype-mode";

/**
 * Defines SEO metadata for the car inventory page.
 *
 * @see CarsPage - Server page component that fetches filters and renders listings.
 */
export const metadata = {
  title: "Cars",
  description: "Browse and search for your dream car",
};

/**
 * Server page for browsing car inventory.
 * Fetches available filter options, shows an error state when filter loading fails, then renders filters beside the listing.
 *
 * @see getCarFilters - Server action for available inventory filters.
 * @see CarFilters - Client component that renders filter controls.
 * @see CarListings - Client component that renders searchable inventory.
 */
export default async function CarsPage() {
  if (prototypeMode) return <PrototypeMarketplace />;
  // Fetch filters data on the server
  const filtersData = await getCarFilters();

  if (!filtersData.success) {
    return (
      <div className="py-12">
        <p>Error loading filters</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 font-bold text-3xl tracking-tight">
        Find your next car.
      </h1>

      <div className="flex flex-col gap-5">
        {/* Filters Section */}
        <div className="w-full">
          <CarFilters filters={filtersData.data} />
        </div>

        {/* Car Listings */}
        <div className="flex-1">
          <CarListings />
        </div>
      </div>
    </div>
  );
}
