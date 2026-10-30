
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CarFront,
  CheckCircle2,
  Fuel,
  RefreshCw,
  Search,
  Settings2,
  Users,
  X,
  AlertCircle,
  CalendarDays,
} from "lucide-react";
import toast from "react-hot-toast";

import { getAvailableVehicles } from "../services/vehicleService";
import type { Vehicle } from "../features/vehicles/types/vehicle";
import CreateBookingModal from "../features/booking/components/CreateBookingModal";

const categories = ["All", "Sedan", "SUV", "Van", "Hatchback", "Pickup"];

type SortOption = "recommended" | "price-low" | "price-high";

type VehicleWithOptionalFields = Vehicle & {
  id?: number | string;
  vehicleId?: number | string;
  vehicle_id?: number | string;
  name?: string;
  brand?: string;
  model?: string;
  category?: string;
  type?: string;
  image?: string;
  imageUrl?: string;
  image_url?: string;
  photo?: string;
  photoUrl?: string;
  price?: number | string;
  dailyRate?: number | string;
  daily_rate?: number | string;
  rentalPrice?: number | string;
  rental_price?: number | string;
  transmission?: string;
  fuelType?: string;
  fuel_type?: string;
  fuel?: string;
  seats?: number;
  seatingCapacity?: number;
  seating_capacity?: number;
  capacity?: number;
  isAvailable?: boolean;
  is_available?: boolean;
  available?: boolean;
};

function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatPrice(
  price: number | string | null | undefined
): string {
  if (price === null || price === undefined || price === "") {
    return "Price unavailable";
  }

  const amount = Number(price);

  if (!Number.isFinite(amount) || amount < 0) {
    return "Price unavailable";
  }

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(amount);
}

function getVehicleName(vehicle: Vehicle): string {
  const item = vehicle as VehicleWithOptionalFields;

  if (item.name?.trim()) return item.name;

  return [item.brand, item.model].filter(Boolean).join(" ") || "Vehicle";
}

function getVehicleCategory(vehicle: Vehicle): string {
  const item = vehicle as VehicleWithOptionalFields;

  return item.category || item.type || "Other";
}

function getVehicleImage(vehicle: Vehicle): string | null {
  const item = vehicle as VehicleWithOptionalFields;

  return (
    item.imageUrl ||
    item.image_url ||
    item.image ||
    item.photoUrl ||
    item.photo ||
    null
  );
}

function getVehiclePrice(vehicle: Vehicle): number {
  const item = vehicle as VehicleWithOptionalFields;

  const rawPrice =
    item.dailyRate ??
    item.daily_rate ??
    item.rentalPrice ??
    item.rental_price ??
    item.price;

  if (rawPrice === null || rawPrice === undefined || rawPrice === "") {
    return Number.POSITIVE_INFINITY;
  }

  const price = Number(rawPrice);

  return Number.isFinite(price) && price >= 0
    ? price
    : Number.POSITIVE_INFINITY;
}

function getVehicleTransmission(vehicle: Vehicle): string {
  const item = vehicle as VehicleWithOptionalFields;

  return item.transmission || "Not specified";
}

function getVehicleFuel(vehicle: Vehicle): string {
  const item = vehicle as VehicleWithOptionalFields;

  return item.fuelType || item.fuel_type || item.fuel || "Not specified";
}

function getVehicleSeats(vehicle: Vehicle): number | string {
  const item = vehicle as VehicleWithOptionalFields;

  return (
    item.seats ??
    item.seatingCapacity ??
    item.seating_capacity ??
    item.capacity ??
    "—"
  );
}

function getVehicleId(vehicle: Vehicle): number | string {
  const item = vehicle as VehicleWithOptionalFields;

  return item.id ?? item.vehicleId ?? item.vehicle_id ?? "";
}

function isVehicleAvailable(vehicle: Vehicle): boolean {
  const item = vehicle as VehicleWithOptionalFields;

  // Fail closed: don't allow booking if availability isn't confirmed
  // by the backend response.
  return (
    item.isAvailable === true ||
    item.is_available === true ||
    item.available === true
  );
}

export default function BrowseVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [transmission, setTransmission] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>("recommended");

  const [startDate, setStartDate] = useState(getTodayDate());
  const [endDate, setEndDate] = useState("");

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    null
  );

  const datesValid =
    Boolean(startDate) &&
    Boolean(endDate) &&
    endDate >= startDate &&
    startDate >= getTodayDate();

  async function loadVehicles(
    pickupDate: string,
    returnDate: string
  ) {
    if (!pickupDate || !returnDate) {
      setVehicles([]);
      setError("");
      setLoading(false);
      return;
    }

    if (returnDate < pickupDate) {
      setVehicles([]);
      setError("Return date must be on or after the pickup date.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await getAvailableVehicles(pickupDate, returnDate);

      if (!Array.isArray(data)) {
        throw new Error("The server returned an invalid vehicle list.");
      }

      setVehicles(data);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to load vehicle availability. Please try again.";

      setError(message);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!datesValid) {
      setVehicles([]);
      setLoading(false);

      if (startDate && endDate && endDate < startDate) {
        setError("Return date must be on or after the pickup date.");
      } else {
        setError("");
      }

      return;
    }

    void loadVehicles(startDate, endDate);
  }, [startDate, endDate]);

  const filteredVehicles = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const result = vehicles.filter((vehicle) => {
      const name = getVehicleName(vehicle).toLowerCase();
      const vehicleCategory = getVehicleCategory(vehicle).toLowerCase();
      const vehicleTransmission = getVehicleTransmission(vehicle).toLowerCase();
      const vehicleFuel = getVehicleFuel(vehicle).toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        name.includes(normalizedSearch) ||
        vehicleCategory.includes(normalizedSearch) ||
        vehicleTransmission.includes(normalizedSearch) ||
        vehicleFuel.includes(normalizedSearch);

      const matchesCategory =
        category === "All" ||
        vehicleCategory === category.toLowerCase();

      const matchesTransmission =
        transmission === "All" ||
        vehicleTransmission.toLowerCase() === transmission.toLowerCase();

      return matchesSearch && matchesCategory && matchesTransmission;
    });

    if (sortBy === "price-low") {
      result.sort((a, b) => getVehiclePrice(a) - getVehiclePrice(b));
    } else if (sortBy === "price-high") {
      result.sort((a, b) => getVehiclePrice(b) - getVehiclePrice(a));
    }

    return result;
  }, [vehicles, search, category, transmission, sortBy]);

  function resetFilters() {
    setSearch("");
    setCategory("All");
    setTransmission("All");
    setSortBy("recommended");
  }

  function handleBookNow(vehicle: Vehicle) {
    if (!datesValid) {
      toast.error("Please select valid pickup and return dates.");
      return;
    }

    if (!isVehicleAvailable(vehicle)) {
      toast.error("This vehicle is not available for your selected dates.");
      return;
    }

    const id = getVehicleId(vehicle);

    if (id === "") {
      toast.error("This vehicle does not have a valid ID.");
      return;
    }

    setSelectedVehicleId(String(id));
    setShowBookingModal(true);
  }

  function closeBookingModal() {
    setShowBookingModal(false);
    setSelectedVehicleId(null);
  }

  function handleBookingSuccess() {
    closeBookingModal();
    toast.success("Booking submitted successfully.");

    // Refresh availability after booking submission.
    if (datesValid) {
      void loadVehicles(startDate, endDate);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Page banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-800 via-blue-700 to-sky-500 px-6 py-9 text-white sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-32 right-44 h-64 w-64 rounded-full bg-white/10" />

        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold">
            <CarFront className="h-4 w-4" />
            DRIVE EASE RENTALS
          </span>

          <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
            Find your perfect ride.
          </h2>

          <p className="mt-3 max-w-xl text-sm leading-7 text-blue-50 sm:text-base">
            Choose your rental dates, compare vehicles, and find the right
            ride for your next journey.
          </p>

          <div className="mt-6 flex flex-wrap gap-4 text-sm font-medium">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Date-based availability
            </span>

            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Simple booking process
            </span>
          </div>
        </div>
      </section>

      {/* Date selection and search filters */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="pickup-date"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              <CalendarDays className="mr-2 inline h-4 w-4 text-blue-600" />
              Pickup date
            </label>

            <input
              id="pickup-date"
              type="date"
              min={getTodayDate()}
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          <div>
            <label
              htmlFor="return-date"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              <CalendarDays className="mr-2 inline h-4 w-4 text-blue-600" />
              Return date
            </label>

            <input
              id="return-date"
              type="date"
              min={startDate || getTodayDate()}
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
        </div>

        {!endDate && (
          <p className="mb-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">
            Select your return date to check which vehicles are available.
          </p>
        )}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search vehicles by name, category, or fuel..."
              aria-label="Search vehicles"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          <div className="flex items-center gap-3">
            <label
              htmlFor="vehicle-sort"
              className="flex shrink-0 items-center gap-2 text-sm font-semibold text-slate-600"
            >
              <Settings2 className="h-4 w-4" />
              Sort by
            </label>

            <select
              id="vehicle-sort"
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value as SortOption)
              }
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500 sm:flex-none"
            >
              <option value="recommended">Recommended</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Categories */}
        <div className="mt-5 flex flex-wrap gap-2">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              aria-pressed={category === item}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                category === item
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Transmission filter and reset */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-slate-600">
              Transmission:
            </span>

            {["All", "Automatic", "Manual"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTransmission(item)}
                aria-pressed={transmission === item}
                className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                  transmission === item
                    ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800"
          >
            <X className="h-4 w-4" />
            Reset filters
          </button>
        </div>
      </section>

      {/* Vehicle results */}
      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-900">
              Explore our vehicles
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Availability is checked against your selected rental dates.
            </p>
          </div>

          {!loading && !error && datesValid && (
            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-700">
              {filteredVehicles.length}{" "}
              {filteredVehicles.length === 1 ? "vehicle" : "vehicles"}
            </span>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <div className="h-52 bg-slate-200" />
                <div className="space-y-4 p-5">
                  <div className="h-5 w-2/3 rounded bg-slate-200" />
                  <div className="h-4 w-1/3 rounded bg-slate-100" />
                  <div className="h-12 rounded bg-slate-100" />
                  <div className="h-10 rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* API error */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-white px-6 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <AlertCircle className="h-7 w-7" />
            </div>

            <h3 className="mt-4 text-lg font-bold text-slate-900">
              Unable to load vehicles
            </h3>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
              {error}
            </p>

            <button
              type="button"
              onClick={() => void loadVehicles(startDate, endDate)}
              disabled={!datesValid}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </div>
        )}

        {/* Vehicle cards */}
        {!loading && !error && datesValid && filteredVehicles.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filteredVehicles.map((vehicle) => {
              const id = getVehicleId(vehicle);
              const name = getVehicleName(vehicle);
              const image = getVehicleImage(vehicle);
              const price = getVehiclePrice(vehicle);
              const available = isVehicleAvailable(vehicle);

              return (
                <article
                  key={String(id || name)}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/5"
                >
                  <div className="relative h-52 overflow-hidden bg-gradient-to-br from-blue-50 to-slate-100">
                    {image ? (
                      <img
                        src={image}
                        alt={name}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-blue-300">
                        <CarFront className="h-20 w-20" />
                      </div>
                    )}

                    <span
                      className={`absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm ${
                        available
                          ? "bg-white text-emerald-700"
                          : "bg-red-600 text-white"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          available ? "bg-emerald-500" : "bg-white"
                        }`}
                      />
                      {available ? "Available" : "Not Available"}
                    </span>

                    <span className="absolute bottom-4 right-4 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm">
                      {getVehicleCategory(vehicle)}
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-extrabold text-slate-900">
                          {name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {getVehicleCategory(vehicle)}
                        </p>
                      </div>

                      <CarFront className="h-6 w-6 shrink-0 text-blue-600" />
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-2 border-y border-slate-100 py-4">
                      <div className="flex flex-col items-center gap-1.5 text-center">
                        <Users className="h-4 w-4 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-600">
                          {getVehicleSeats(vehicle)} Seats
                        </span>
                      </div>

                      <div className="flex flex-col items-center gap-1.5 text-center">
                        <Settings2 className="h-4 w-4 text-slate-400" />
                        <span className="text-center text-xs font-semibold text-slate-600">
                          {getVehicleTransmission(vehicle)}
                        </span>
                      </div>

                      <div className="flex flex-col items-center gap-1.5 text-center">
                        <Fuel className="h-4 w-4 text-slate-400" />
                        <span className="text-center text-xs font-semibold text-slate-600">
                          {getVehicleFuel(vehicle)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 flex items-end justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-500">
                          Rental rate
                        </p>

                        <p className="mt-1 break-words text-xl font-black text-slate-900">
                          {price === Number.POSITIVE_INFINITY
                            ? "Price unavailable"
                            : formatPrice(price)}

                          {price !== Number.POSITIVE_INFINITY && (
                            <span className="text-xs font-medium text-slate-500">
                              {" "}/ day
                            </span>
                          )}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleBookNow(vehicle)}
                        disabled={id === "" || !available || !datesValid}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                      >
                        {available ? "Book Now" : "Not Available"}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Empty results */}
        {!loading && !error && datesValid && filteredVehicles.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <CarFront className="h-7 w-7" />
            </div>

            <h3 className="mt-4 text-lg font-bold text-slate-900">
              No vehicles found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              No vehicles match your search or selected filters for these dates.
            </p>

            <button
              type="button"
              onClick={resetFilters}
              className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Dates not yet selected */}
        {!loading && !error && !datesValid && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <CalendarDays className="mx-auto h-10 w-10 text-blue-500" />
            <h3 className="mt-4 text-lg font-bold text-slate-900">
              Select your rental dates
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Choose a pickup date and a return date to check vehicle availability.
            </p>
          </div>
        )}
      </section>

      {/* Booking modal */}
      {showBookingModal && selectedVehicleId !== null && (
        <CreateBookingModal
          initialVehicleId={selectedVehicleId}
          onClose={closeBookingModal}
          onSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
}
