
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CarFront,
  CheckCircle2,
  Users,
} from "lucide-react";

import { getVehicleById } from "../services/vehicleService";
import type { Vehicle } from "../features/vehicles/types/vehicle";
import { formatVehiclePrice } from "../utils/vehicleHelpers";
import VehicleStatusBadge from "../features/vehicles/components/VehicleStatusBadge";

export default function VehicleDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadVehicle() {
      if (!id) {
        setError("Invalid vehicle ID.");
        setLoading(false);
        return;
      }

      try {
        const result = await getVehicleById(id);
        if (active) setVehicle(result);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load vehicle details."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadVehicle();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-[60vh] bg-slate-50 p-8">
        <div className="mx-auto h-96 max-w-5xl animate-pulse rounded-3xl bg-slate-200" />
      </main>
    );
  }

  if (error || !vehicle) {
    return (
      <main className="min-h-[60vh] bg-slate-50 px-5 py-20 text-center">
        <h1 className="text-2xl font-black text-slate-900">
          Vehicle not found
        </h1>
        <p className="mt-3 text-slate-500">
          {error || "This vehicle could not be found."}
        </p>
        <Link
          to="/vehicles"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to vehicles
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
          to="/vehicles"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to vehicles
        </Link>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="grid lg:grid-cols-2">
            <div className="min-h-72 bg-slate-100 lg:min-h-[500px]">
              {vehicle.imageUrl ? (
                <img
                  src={vehicle.imageUrl}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  className="h-full min-h-72 w-full object-cover lg:min-h-[500px]"
                />
              ) : (
                <div className="flex min-h-72 h-full flex-col items-center justify-center gap-4 text-slate-400 lg:min-h-[500px]">
                  <CarFront className="h-20 w-20" />
                  <p>No vehicle image available</p>
                </div>
              )}
            </div>

            <div className="p-6 sm:p-10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-bold uppercase tracking-widest text-blue-600">
                  {vehicle.brand}
                </span>
                <VehicleStatusBadge status={vehicle.status} />
              </div>

              <h1 className="mt-4 text-3xl font-black text-slate-900 sm:text-4xl">
                {vehicle.name}
              </h1>

              <p className="mt-2 text-slate-500">
                {vehicle.model}
                {vehicle.year ? ` · ${vehicle.year}` : ""}
              </p>

              <p className="mt-6 text-3xl font-black text-blue-700">
                {formatVehiclePrice(vehicle.dailyRate)}
                <span className="ml-2 text-sm font-medium text-slate-500">
                  per day
                </span>
              </p>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-slate-50 p-4">
                  <Users className="h-5 w-5 text-blue-600" />
                  <p className="mt-3 text-xs text-slate-500">Seats</p>
                  <p className="mt-1 font-bold text-slate-900">
                    {vehicle.seats} passengers
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <CarFront className="h-5 w-5 text-blue-600" />
                  <p className="mt-3 text-xs text-slate-500">Vehicle type</p>
                  <p className="mt-1 font-bold text-slate-900">
                    {vehicle.vehicleType}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <CalendarDays className="h-5 w-5 text-blue-600" />
                  <p className="mt-3 text-xs text-slate-500">Model year</p>
                  <p className="mt-1 font-bold text-slate-900">
                    {vehicle.year ?? "Not specified"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                  <p className="mt-3 text-xs text-slate-500">Plate number</p>
                  <p className="mt-1 break-words font-bold text-slate-900">
                    {vehicle.plateNumber}
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <h2 className="text-lg font-black text-slate-900">
                  About this vehicle
                </h2>
                <p className="mt-3 whitespace-pre-line leading-7 text-slate-600">
                  {vehicle.description || "No description provided."}
                </p>
              </div>

              {vehicle.status === "AVAILABLE" ? (
                <Link
                  to="/login"
                  className="mt-8 flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-4 font-bold text-white transition hover:bg-blue-700"
                >
                  Sign in to continue
                </Link>
              ) : (
                <p className="mt-8 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                  This vehicle is currently {vehicle.status.toLowerCase()}.
                </p>
              )}

              <p className="mt-3 text-center text-xs text-slate-400">
                A booking workflow must be implemented separately to confirm
                rental dates and availability.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
