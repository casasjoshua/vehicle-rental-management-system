import { useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CarFront,
  MapPin,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import { createBooking } from "../../../services/bookingService";
import { getVehicles } from "../../../services/vehicleService";

import type { Vehicle } from "../../vehicles/types/vehicle";
import type { CreateBookingPayload } from "../types/booking";

interface CreateBookingModalProps {
  onClose: () => void;
  onSuccess: () => void;
  initialVehicleId?: string;
}

function getVehicleName(vehicle: Vehicle): string {
  const item = vehicle as Vehicle & {
    brand?: string;
    model?: string;
    name?: string;
    year?: number | string;
  };

  if (item.name) {
    return item.name;
  }

  return [item.year, item.brand, item.model]
    .filter(Boolean)
    .join(" ");
}

function getDailyRate(vehicle: Vehicle): number {
  const item = vehicle as Vehicle & {
    dailyRate?: number | string;
    daily_rate?: number | string;
    pricePerDay?: number | string;
    price_per_day?: number | string;
    rentalPrice?: number | string;
  };

  const rate =
    item.dailyRate ??
    item.daily_rate ??
    item.pricePerDay ??
    item.price_per_day ??
    item.rentalPrice ??
    0;

  return Number(rate) || 0;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function CreateBookingModal({
  onClose,
  onSuccess,
  initialVehicleId,
}: CreateBookingModalProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState<string>(
    initialVehicleId ?? ""
  );

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [returnLocation, setReturnLocation] = useState("");
  const [customerNote, setCustomerNote] = useState("");

  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Keep the selected ID synchronized with the vehicle clicked
  // on the Browse Vehicles page.
  useEffect(() => {
    if (initialVehicleId !== undefined) {
      setVehicleId(String(initialVehicleId));
    }
  }, [initialVehicleId]);

  // Load vehicles for the dropdown.
  useEffect(() => {
    let isMounted = true;

    async function loadVehicles() {
      try {
        setLoadingVehicles(true);

        const response = await getVehicles();

        // Support APIs that return either an array or { data: [...] }.
        const result = response as
          | Vehicle[]
          | { data?: Vehicle[]; vehicles?: Vehicle[] };

        let vehicleList: Vehicle[] = [];

        if (Array.isArray(result)) {
          vehicleList = result;
        } else if (Array.isArray(result.data)) {
          vehicleList = result.data;
        } else if (Array.isArray(result.vehicles)) {
          vehicleList = result.vehicles;
        }

        if (isMounted) {
          setVehicles(vehicleList);
        }
      } catch (error) {
        console.error("Failed to load vehicles:", error);

        if (isMounted) {
          toast.error("Failed to load vehicles.");
          setVehicles([]);
        }
      } finally {
        if (isMounted) {
          setLoadingVehicles(false);
        }
      }
    }

    void loadVehicles();

    return () => {
      isMounted = false;
    };
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    void submitBooking();
  }

  async function submitBooking() {
    if (!vehicleId || !Number.isFinite(Number(vehicleId))) {
      toast.error("Please select a valid vehicle.");
      return;
    }

    if (!startDate || !endDate) {
      toast.error("Please select your pickup and return dates.");
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      toast.error("The return date must be after the pickup date.");
      return;
    }

    if (!pickupLocation.trim() || !returnLocation.trim()) {
      toast.error("Please enter your pickup and return locations.");
      return;
    }

    const selectedVehicle = vehicles.find(
      (vehicle) => String(vehicle.id) === String(vehicleId)
    );

    if (!selectedVehicle) {
      toast.error("The selected vehicle could not be found.");
      return;
    }

    const payload: CreateBookingPayload = {
      vehicleId: Number(vehicleId),
      startDate,
      endDate,
      pickupLocation: pickupLocation.trim(),
      returnLocation: returnLocation.trim(),
      customerNote: customerNote.trim(),
    };

    try {
      setSubmitting(true);

      await createBooking(payload);

      // The parent page closes the modal and refreshes its data.
      onSuccess();
    } catch (error) {
      console.error("Failed to create booking:", error);
      toast.error("Failed to create booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedVehicle = vehicles.find(
    (vehicle) => String(vehicle.id) === String(vehicleId)
  );

  const today = new Date();
  const localToday = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
        className="my-auto w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 sm:px-8">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <CarFront size={15} />
              Vehicle rental
            </div>

            <h2
              id="booking-modal-title"
              className="text-2xl font-bold tracking-tight text-slate-900"
            >
              Book your vehicle
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Complete the details below to request your booking.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close booking modal"
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed"
          >
            <X size={21} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="max-h-[65vh] space-y-6 overflow-y-auto px-6 py-6 sm:px-8">
            {/* Vehicle selection */}
            <section>
              <label
                htmlFor="vehicleId"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Selected vehicle{" "}
                <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <CarFront
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <select
                  id="vehicleId"
                  value={vehicleId}
                  onChange={(event) =>
                    setVehicleId(event.target.value)
                  }
                  required
                  disabled={loadingVehicles || submitting}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50"
                >
                  <option value="">
                    {loadingVehicles
                      ? "Loading vehicles..."
                      : "Choose a vehicle"}
                  </option>

                  {vehicles.map((vehicle) => (
                    <option
                      key={vehicle.id}
                      value={String(vehicle.id)}
                    >
                      {getVehicleName(vehicle)} —{" "}
                      {formatCurrency(getDailyRate(vehicle))}/day
                    </option>
                  ))}
                </select>
              </div>

              {!loadingVehicles && vehicles.length === 0 && (
                <p className="mt-2 flex items-center gap-2 text-sm text-amber-700">
                  <AlertCircle size={16} />
                  No vehicles were returned by the vehicle API.
                </p>
              )}

              {selectedVehicle && (
                <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-white p-2.5 text-blue-600 shadow-sm">
                        <CarFront size={22} />
                      </div>

                      <div>
                        <p className="font-semibold text-slate-900">
                          {getVehicleName(selectedVehicle)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Vehicle ID: {selectedVehicle.id}
                        </p>
                      </div>
                    </div>

                    <p className="shrink-0 text-right font-bold text-blue-700">
                      {formatCurrency(
                        getDailyRate(selectedVehicle)
                      )}
                      <span className="block text-xs font-normal text-slate-500">
                        per day
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* Dates */}
            <section>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <CalendarDays size={17} className="text-blue-600" />
                Rental dates
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="startDate"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Pickup date <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="startDate"
                    type="date"
                    value={startDate}
                    min={localToday}
                    onChange={(event) => {
                      setStartDate(event.target.value);

                      if (
                        endDate &&
                        event.target.value >= endDate
                      ) {
                        setEndDate("");
                      }
                    }}
                    required
                    disabled={submitting}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="endDate"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Return date <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="endDate"
                    type="date"
                    value={endDate}
                    min={startDate || localToday}
                    onChange={(event) =>
                      setEndDate(event.target.value)
                    }
                    required
                    disabled={submitting}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50"
                  />
                </div>
              </div>
            </section>

            {/* Locations */}
            <section>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <MapPin size={17} className="text-blue-600" />
                Pickup and return locations
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="pickupLocation"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Pickup location{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="pickupLocation"
                    type="text"
                    value={pickupLocation}
                    onChange={(event) =>
                      setPickupLocation(event.target.value)
                    }
                    placeholder="Enter pickup location"
                    required
                    disabled={submitting}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="returnLocation"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Return location{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="returnLocation"
                    type="text"
                    value={returnLocation}
                    onChange={(event) =>
                      setReturnLocation(event.target.value)
                    }
                    placeholder="Enter return location"
                    required
                    disabled={submitting}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50"
                  />
                </div>
              </div>
            </section>

            {/* Optional note */}
            <section>
              <label
                htmlFor="customerNote"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Additional notes{" "}
                <span className="font-normal text-slate-400">
                  (optional)
                </span>
              </label>

              <textarea
                id="customerNote"
                value={customerNote}
                onChange={(event) =>
                  setCustomerNote(event.target.value)
                }
                placeholder="Any special requests or instructions?"
                rows={3}
                maxLength={1000}
                disabled={submitting}
                className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50"
              />
            </section>
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                submitting ||
                loadingVehicles ||
                vehicles.length === 0
              }
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Submitting booking..." : "Confirm booking"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}