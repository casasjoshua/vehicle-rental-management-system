
import { Link } from "react-router-dom";
import { ArrowUpRight, CalendarDays, Users } from "lucide-react";

import type { Vehicle } from "../types/vehicle";
import { formatVehiclePrice } from "../../../utils/vehicleHelpers";
import VehicleStatusBadge from "./VehicleStatusBadge";

interface Props {
  vehicle: Vehicle;
}

export default function VehicleCard({ vehicle }: Props) {
  const image = vehicle.imageUrl?.trim();

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Link
        to={`/vehicles/${vehicle.id}`}
        className="relative block h-52 overflow-hidden bg-slate-100"
      >
        {image ? (
          <img
            src={image}
            alt={`${vehicle.brand} ${vehicle.model}`}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
            <span className="text-5xl">🚘</span>
            <span className="text-xs font-medium">Vehicle image unavailable</span>
          </div>
        )}

        <div className="absolute left-4 top-4">
          <VehicleStatusBadge status={vehicle.status} />
        </div>

        <span className="absolute bottom-4 right-4 rounded-xl bg-white p-2 text-blue-600 shadow">
          <ArrowUpRight className="h-5 w-5" />
        </span>
      </Link>

      <div className="p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
          {vehicle.brand} · {vehicle.vehicleType}
        </p>

        <h3 className="mt-2 text-xl font-black text-slate-900">
          {vehicle.name}
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          {vehicle.model}
          {vehicle.year ? ` · ${vehicle.year}` : ""}
        </p>

        <div className="mt-5 flex items-center gap-4 border-y border-slate-100 py-4 text-sm text-slate-600">
          <span className="inline-flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            {vehicle.seats} seats
          </span>
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-blue-500" />
            Daily rental
          </span>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">Starting from</p>
            <p className="mt-1 text-xl font-black text-slate-900">
              {formatVehiclePrice(vehicle.dailyRate)}
              <span className="ml-1 text-xs font-medium text-slate-500">
                /day
              </span>
            </p>
          </div>

          <Link
            to={`/vehicles/${vehicle.id}`}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}
