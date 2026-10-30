
import type { VehicleStatus } from "../types/vehicle";

const statusStyles: Record<VehicleStatus, string> = {
  AVAILABLE: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  UNAVAILABLE: "bg-slate-100 text-slate-600 ring-slate-500/20",
  MAINTENANCE: "bg-amber-50 text-amber-700 ring-amber-600/20",
};

export default function VehicleStatusBadge({
  status,
}: {
  status: VehicleStatus;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${statusStyles[status]}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
