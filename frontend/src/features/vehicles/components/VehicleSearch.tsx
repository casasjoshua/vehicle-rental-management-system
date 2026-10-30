
import { useState, type FormEvent } from "react";
import {
  CalendarDays,
  MapPin,
  Search,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";

import type {
  VehicleFilters,
  VehicleSearchValues,
} from "../types/vehicle";

interface HomeSearchProps {
  onSearch: (values: VehicleSearchValues) => void;
}

interface FleetFilterProps {
  filters: VehicleFilters;
  onChange: (filters: VehicleFilters) => void;
  vehicleTypes: string[];
}

type Props = HomeSearchProps | FleetFilterProps;

function getTodayDate(): string {
  const today = new Date();

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
}

function isFleetFilterProps(props: Props): props is FleetFilterProps {
  return "filters" in props;
}

export default function VehicleSearch(props: Props) {
  if (isFleetFilterProps(props)) {
    return <FleetFilters {...props} />;
  }

  return <HomeVehicleSearch {...props} />;
}

/* Homepage location and date search */
function HomeVehicleSearch({ onSearch }: HomeSearchProps) {
  const [location, setLocation] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!location.trim()) {
      setError("Please enter your pickup location.");
      return;
    }

    if (!pickupDate || !returnDate) {
      setError("Please select your pickup and return dates.");
      return;
    }

    if (pickupDate < getTodayDate()) {
      setError("Pickup date cannot be in the past.");
      return;
    }

    if (returnDate < pickupDate) {
      setError("Return date must be on or after the pickup date.");
      return;
    }

    setError("");

    onSearch({
      location: location.trim(),
      pickupDate,
      returnDate,
    });
  }

  function clearFields() {
    setLocation("");
    setPickupDate("");
    setReturnDate("");
    setError("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-blue-900/5 sm:p-7"
    >
      <div className="mb-6">
        <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-600">
          Plan your trip
        </p>

        <h2 className="mt-2 text-2xl font-black text-slate-950">
          Find your next ride
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Choose your preferred pickup location and rental dates.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <label className="block">
          <span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
            <MapPin size={17} className="text-blue-600" />
            Pickup location
          </span>

          <input
            type="text"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Enter a city or location"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <label className="block">
          <span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
            <CalendarDays size={17} className="text-blue-600" />
            Pickup date
          </span>

          <input
            type="date"
            value={pickupDate}
            min={getTodayDate()}
            onChange={(event) => {
              const value = event.target.value;

              setPickupDate(value);

              if (returnDate && returnDate < value) {
                setReturnDate("");
              }

              setError("");
            }}
            className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <label className="block">
          <span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
            <CalendarDays size={17} className="text-blue-600" />
            Return date
          </span>

          <input
            type="date"
            value={returnDate}
            min={pickupDate || getTodayDate()}
            onChange={(event) => {
              setReturnDate(event.target.value);
              setError("");
            }}
            className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <div className="flex items-end">
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 font-bold text-white transition hover:bg-blue-700"
          >
            <Search size={18} />
            Search Vehicles
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={clearFields}
        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600"
      >
        <RotateCcw size={15} />
        Clear fields
      </button>
    </form>
  );
}

/* Vehicles page filters */
function FleetFilters({
  filters,
  onChange,
  vehicleTypes,
}: FleetFilterProps) {
  function updateFilter<K extends keyof VehicleFilters>(
    key: K,
    value: VehicleFilters[K]
  ) {
    onChange({
      ...filters,
      [key]: value,
    });
  }

  function clearFilters() {
    onChange({
      search: "",
      vehicleType: "",
      status: "",
      minRate: "",
      maxRate: "",
    });
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <SlidersHorizontal size={21} />
        </div>

        <div>
          <h2 className="text-xl font-black text-slate-900">
            Find a vehicle
          </h2>
          <p className="text-sm text-slate-500">
            Search and filter the fleet to match your needs.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block lg:col-span-1">
          <span className="mb-2 block text-sm font-bold text-slate-700">
            Search vehicles
          </span>

          <input
            type="search"
            value={filters.search}
            onChange={(event) => updateFilter("search", event.target.value)}
            placeholder="Name, brand, model..."
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-700">
            Vehicle type
          </span>

          <select
            value={filters.vehicleType}
            onChange={(event) =>
              updateFilter("vehicleType", event.target.value)
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="">All vehicle types</option>

            {vehicleTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-700">
            Vehicle status
          </span>

          <select
            value={filters.status}
            onChange={(event) => updateFilter("status", event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="">All statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="UNAVAILABLE">Unavailable</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-700">
            Minimum daily rate
          </span>

          <input
            type="number"
            min="0"
            value={filters.minRate}
            onChange={(event) => updateFilter("minRate", event.target.value)}
            placeholder="₱ Minimum"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-700">
            Maximum daily rate
          </span>

          <input
            type="number"
            min="0"
            value={filters.maxRate}
            onChange={(event) => updateFilter("maxRate", event.target.value)}
            placeholder="₱ Maximum"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <div className="flex items-end">
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
          >
            <RotateCcw size={16} />
            Clear filters
          </button>
        </div>
      </div>
    </section>
  );
}
