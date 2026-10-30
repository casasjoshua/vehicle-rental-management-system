import type { BookingStatus } from "../types/booking";

interface BookingStatusBadgeProps {
  status: BookingStatus;
}

const statusStyles: Record<BookingStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
  CONFIRMED: "bg-blue-50 text-blue-700 ring-blue-200",
  REJECTED: "bg-red-50 text-red-700 ring-red-200",
  CANCELLED: "bg-slate-100 text-slate-600 ring-slate-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

export default function BookingStatusBadge({
  status,
}: BookingStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
        statusStyles[status] ?? statusStyles.PENDING
      }`}
    >
      <span className="mr-2 h-1.5 w-1.5 rounded-full bg-current" />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}