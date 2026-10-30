
import { useCallback, useEffect, useMemo, useState } from "react";
import { CarFront, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

import VehicleCard from "../features/vehicles/components/VehicleCard";
import VehicleSearch from "../features/vehicles/components/VehicleSearch";
import { getVehicles } from "../services/vehicleService";
import type {
  Vehicle,
  VehicleFilters,
} from "../features/vehicles/types/vehicle";
import { filterVehicles } from "../utils/vehicleHelpers";

const initialFilters: VehicleFilters = {
  search: "",
  vehicleType: "",
  status: "",
  minRate: "",
  maxRate: "",
};

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filters, setFilters] = useState<VehicleFilters>(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadVehicles = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getVehicles();
      setVehicles(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load vehicles.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVehicles();
  }, [loadVehicles]);

  const vehicleTypes = useMemo(
    () =>
      Array.from(
        new Set(
          vehicles
            .map((vehicle) => vehicle.vehicleType)
            .filter(Boolean)
        )
      ).sort(),
    [vehicles]
  );

  const filteredVehicles = useMemo(
    () =>
      filterVehicles(
        vehicles,
        filters.search,
        filters.vehicleType,
        filters.status,
        filters.minRate,
        filters.maxRate
      ),
    [vehicles, filters]
  );

  function clearFilters() {
    setFilters({ ...initialFilters });
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Page hero */}
        <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 to-sky-500 px-6 py-10 text-white sm:px-10 sm:py-14">
          <div className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold">
              <CarFront className="h-4 w-4" />
              Find your next ride
            </span>

            <h1 className="mt-6 text-3xl font-black tracking-tight sm:text-5xl">
              Explore our vehicles
            </h1>

            <p className="mt-4 max-w-2xl leading-7 text-blue-50">
              Discover a vehicle that suits your trip, compare daily rates,
              and check vehicle details before making a rental inquiry.
            </p>
          </div>
        </section>

        {/* Filters */}
        <VehicleSearch
          filters={filters}
          onChange={setFilters}
          vehicleTypes={vehicleTypes}
        />

        {/* Vehicle results */}
        <section className="mt-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                Vehicle fleet
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {loading
                  ? "Loading vehicles..."
                  : `${filteredVehicles.length} vehicle${
                      filteredVehicles.length !== 1 ? "s" : ""
                    } found`}
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadVehicles()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 6, 5, 4].map((item) => (
                <div
                  key={item}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                >
                  <div className="h-52 animate-pulse bg-slate-200" />

                  <div className="space-y-4 p-5">
                    <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
                    <div className="h-6 w-2/3 animate-pulse rounded bg-slate-200" />
                    <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                    <div className="h-10 w-full animate-pulse rounded-xl bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            /* Error state */
            <div className="rounded-2xl border border-red-200 bg-white p-10 text-center">
              <CarFront className="mx-auto h-12 w-12 text-red-300" />

              <h3 className="mt-4 text-xl font-black text-slate-900">
                Could not load vehicles
              </h3>

              <p className="mt-2 text-sm text-slate-500">{error}</p>

              <button
                type="button"
                onClick={() => void loadVehicles()}
                className="mt-5 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700"
              >
                Try again
              </button>
            </div>
          ) : filteredVehicles.length === 0 ? (
            /* Empty state */
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
              <CarFront className="mx-auto h-12 w-12 text-slate-300" />

              <h3 className="mt-4 text-xl font-black text-slate-900">
                No vehicles found
              </h3>

              <p className="mt-2 text-slate-500">
                Try changing your search terms or filters.
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 font-bold text-blue-600 transition hover:text-blue-800"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            /* Vehicle cards */
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredVehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
