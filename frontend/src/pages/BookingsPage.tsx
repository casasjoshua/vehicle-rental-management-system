
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Ban,
  CalendarDays,
  CarFront,
  CheckCircle2,
  Clock,
  Eye,
  FilePlus2,
  History,
  LoaderCircle,
  MapPin,
  MessageSquare,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import BookingStatusBadge from "../features/booking/components/BookingStatusBadge";
import CreateBookingModal from "../features/booking/components/CreateBookingModal";

import type {
  Booking,
  BookingStatus,
  BookingStatusHistory,
} from "../features/booking/types/booking";

import {
  cancelBooking,
  getAllBookings,
  getBookingById,
  getBookingStatusHistory,
  getMyBookings,
  updateBookingStatus,
} from "../services/bookingService";

/* =========================================================
   TYPES
========================================================= */

type UserRole = "ADMIN" | "STAFF" | "CUSTOMER";

type StatusFilter = "ALL" | BookingStatus;

const BOOKING_STATUSES: BookingStatus[] = [
  "PENDING",
  "CONFIRMED",
  "REJECTED",
  "CANCELLED",
  "COMPLETED",
];

const STATUS_FILTERS: StatusFilter[] = [
  "ALL",
  ...BOOKING_STATUSES,
];

/* =========================================================
   AUTHENTICATED USER ROLE
========================================================= */

function normalizeRole(value: unknown): UserRole | null {
  if (typeof value !== "string") return null;

  const role = value.trim().toUpperCase();

  if (role === "ADMIN") return "ADMIN";
  if (role === "CUSTOMER") return "CUSTOMER";

  // Operational staff roles are treated as STAFF in this UI.
  if (
    role === "STAFF" ||
    role === "FRONTDESK" ||
    role === "FRONT_DESK" ||
    role === "BOOKKEEPER" ||
    role === "RECEIVING_OFFICER" ||
    role === "RELEASING_OFFICER" ||
    role === "PAID_OFFICER"
  ) {
    return "STAFF";
  }

  return null;
}

function getStoredRole(): UserRole {
  try {
    const storedRole = normalizeRole(localStorage.getItem("role"));

    if (storedRole) return storedRole;

    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      const user = JSON.parse(storedUser);

      const userRole = normalizeRole(
        user?.role ?? user?.user?.role
      );

      if (userRole) return userRole;
    }

    const token = localStorage.getItem("token");

    if (token) {
      const tokenPayload = token.split(".")[1];

      if (tokenPayload) {
        const normalizedPayload = tokenPayload
          .replace(/-/g, "+")
          .replace(/_/g, "/");

        const decoded = JSON.parse(atob(normalizedPayload));

        const tokenRole = normalizeRole(
          decoded?.role ??
            decoded?.user?.role ??
            decoded?.userRole
        );

        if (tokenRole) return tokenRole;
      }
    }
  } catch (error) {
    console.error("Unable to read the authenticated user role:", error);
  }

  // Safe UI fallback. The backend must still authorize every request.
  return "CUSTOMER";
}

/* =========================================================
   FORMATTERS
========================================================= */

function formatCurrency(
  amount: number | string | null | undefined
): string {
  const value = Number(amount ?? 0);

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number.isFinite(value) ? value : 0);
}

function formatDate(date: string | null | undefined): string {
  if (!date) return "Not specified";

  const parsedDate = new Date(`${date.slice(0, 10)}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) return date;

  return parsedDate.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(date: string | null | undefined): string {
  if (!date) return "Not available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return date;

  return parsedDate.toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getVehicleName(booking: Booking): string {
  const vehicle = booking.Vehicle ?? booking.vehicle;

  if (!vehicle) return "Vehicle";

  const name = [
    vehicle.brand,
    vehicle.model,
    vehicle.year,
  ]
    .filter(Boolean)
    .join(" ");

  return name || "Vehicle";
}

function getBookingNumber(booking: Booking): string {
  return booking.bookingNumber || `BK-${booking.id}`;
}

function getStatusLabel(status: StatusFilter): string {
  if (status === "ALL") return "All Bookings";

  return status.charAt(0) + status.slice(1).toLowerCase();
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function StatCard({
  title,
  value,
  icon: Icon,
  iconClassName,
}: {
  title: string;
  value: number;
  icon: typeof CalendarDays;
  iconClassName: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {value}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconClassName}`}
        >
          <Icon size={23} />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
  hasFilters,
  onClear,
  role,
}: {
  hasFilters: boolean;
  onClear: () => void;
  role: UserRole;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <CarFront size={32} />
      </div>

      <h3 className="mt-5 text-lg font-bold text-slate-900">
        {hasFilters
          ? "No bookings found"
          : role === "CUSTOMER"
            ? "No bookings yet"
            : "No booking records yet"}
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
        {hasFilters
          ? "Try changing your search term or selected booking status."
          : role === "CUSTOMER"
            ? "Your vehicle reservations will appear here after you book a vehicle."
            : "Customer reservations will appear here when bookings are available."}
      </p>

      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

/* =========================================================
   BOOKING DETAILS MODAL
========================================================= */

function BookingDetailsModal({
  booking,
  history,
  loadingHistory,
  onClose,
}: {
  booking: Booking;
  history: BookingStatusHistory[];
  loadingHistory: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-details-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Booking details
            </p>

            <h2
              id="booking-details-title"
              className="mt-1 text-xl font-bold text-slate-900"
            >
              {getBookingNumber(booking)}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              View reservation information and booking history.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close booking details"
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {/* Status and total */}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="text-sm text-slate-500">
                Booking status
              </p>

              <div className="mt-2">
                <BookingStatusBadge status={booking.status} />
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-slate-500">
                Total amount
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {formatCurrency(booking.totalAmount)}
              </p>
            </div>
          </div>

          {/* Vehicle */}

          <section>
            <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-900">
              <CarFront size={18} className="text-blue-600" />
              Vehicle information
            </h3>

            <div className="rounded-xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-900">
                {getVehicleName(booking)}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Booking number: {getBookingNumber(booking)}
              </p>
            </div>
          </section>

          {/* Rental dates */}

          <section>
            <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-900">
              <CalendarDays size={18} className="text-blue-600" />
              Rental schedule
            </h3>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Start date</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {formatDate(booking.startDate)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">End date</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {formatDate(booking.endDate)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Number of days</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {booking.numberOfDays} day(s)
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Daily rate</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {formatCurrency(booking.dailyRate)}
                </p>
              </div>
            </div>
          </section>

          {/* Pickup and return */}

          <section>
            <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-900">
              <MapPin size={18} className="text-blue-600" />
              Pickup and return
            </h3>

            <div className="space-y-3 rounded-xl border border-slate-200 p-4">
              <div>
                <p className="text-sm text-slate-500">
                  Pickup location
                </p>

                <p className="mt-1 font-medium text-slate-900">
                  {booking.pickupLocation || "Not specified"}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <p className="text-sm text-slate-500">
                  Return location
                </p>

                <p className="mt-1 font-medium text-slate-900">
                  {booking.returnLocation || "Not specified"}
                </p>
              </div>
            </div>
          </section>

          {/* Customer note */}

          {booking.customerNote && (
            <section>
              <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-900">
                <MessageSquare size={18} className="text-blue-600" />
                Customer note
              </h3>

              <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                {booking.customerNote}
              </p>
            </section>
          )}

          {/* Staff note */}

          {booking.staffNote && (
            <section>
              <h3 className="mb-3 font-bold text-slate-900">
                Staff note
              </h3>

              <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-slate-700">
                {booking.staffNote}
              </p>
            </section>
          )}

          {/* History */}

          <section>
            <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
              <History size={18} className="text-blue-600" />
              Booking history
            </h3>

            {loadingHistory ? (
              <div className="flex items-center gap-2 py-5 text-sm text-slate-500">
                <LoaderCircle size={17} className="animate-spin" />
                Loading booking history...
              </div>
            ) : history.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center">
                <History
                  size={25}
                  className="mx-auto mb-2 text-slate-400"
                />

                <p className="text-sm font-medium text-slate-700">
                  No booking history is available.
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Status history will appear here when records are
                  available from the server.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="relative border-l-2 border-blue-100 pb-1 pl-5 last:border-l-transparent"
                  >
                    <span className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-blue-600" />

                    <p className="text-sm font-semibold text-slate-900">
                      {item.oldStatus
                        ? `${item.oldStatus.replaceAll("_", " ")} → `
                        : ""}
                      {item.newStatus.replaceAll("_", " ")}
                    </p>

                    {item.note && (
                      <p className="mt-1 text-sm text-slate-600">
                        {item.note}
                      </p>
                    )}

                    <p className="mt-1 text-xs text-slate-400">
                      {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Close details
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   CANCEL BOOKING MODAL
========================================================= */

function CancelBookingModal({
  booking,
  cancelling,
  onCancel,
  onConfirm,
}: {
  booking: Booking;
  cancelling: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !cancelling) {
        onCancel();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onCancel, cancelling]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !cancelling) {
          onCancel();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-booking-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <Ban size={27} />
        </div>

        <h2
          id="cancel-booking-title"
          className="mt-5 text-xl font-bold text-slate-900"
        >
          Cancel this booking?
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Are you sure you want to cancel booking{" "}
          <span className="font-semibold text-slate-800">
            {getBookingNumber(booking)}
          </span>
          ? This will send a cancellation request to the server.
        </p>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">
            {getVehicleName(booking)}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {formatDate(booking.startDate)} –{" "}
            {formatDate(booking.endDate)}
          </p>

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-sm text-slate-500">
              Total amount
            </span>

            <span className="font-bold text-slate-900">
              {formatCurrency(booking.totalAmount)}
            </span>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={cancelling}
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Keep booking
          </button>

          <button
            type="button"
            disabled={cancelling}
            onClick={onConfirm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelling ? (
              <>
                <LoaderCircle size={17} className="animate-spin" />
                Cancelling...
              </>
            ) : (
              <>
                <Ban size={17} />
                Confirm cancellation
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   BOOKINGS PAGE
========================================================= */

export default function BookingsPage() {
  const [role] = useState<UserRole>(() => getStoredRole());

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");

  const [selectedBooking, setSelectedBooking] =
    useState<Booking | null>(null);

  const [bookingHistory, setBookingHistory] = useState<
    BookingStatusHistory[]
  >([]);

  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showCreateBooking, setShowCreateBooking] = useState(false);

  const [cancellingId, setCancellingId] = useState<number | null>(
    null
  );

  const [bookingToCancel, setBookingToCancel] =
    useState<Booking | null>(null);

  const [updatingStatusId, setUpdatingStatusId] =
    useState<number | null>(null);

  /* ---------------------------------------------------------
     LOAD BOOKINGS

     CUSTOMER -> GET /api/bookings/my-bookings
     STAFF/ADMIN -> GET /api/bookings
  --------------------------------------------------------- */

  const fetchBookings = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const response =
          role === "CUSTOMER"
            ? await getMyBookings()
            : await getAllBookings();

        setBookings(Array.isArray(response) ? response : []);
      } catch (error) {
        console.error("Failed to load bookings:", error);

        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to load bookings."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [role]
  );

  useEffect(() => {
    void fetchBookings();
  }, [fetchBookings]);

  /* ---------------------------------------------------------
     SEARCH AND FILTER
  --------------------------------------------------------- */

  const filteredBookings = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return bookings.filter((booking) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        booking.status === statusFilter;

      const matchesSearch =
        !normalizedSearch ||
        getBookingNumber(booking)
          .toLowerCase()
          .includes(normalizedSearch) ||
        getVehicleName(booking)
          .toLowerCase()
          .includes(normalizedSearch) ||
        (booking.pickupLocation ?? "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        (booking.returnLocation ?? "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(booking.id).includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [bookings, search, statusFilter]);

  /* ---------------------------------------------------------
     SUMMARY STATISTICS
  --------------------------------------------------------- */

  const stats = useMemo(
    () => ({
      total: bookings.length,
      pending: bookings.filter(
        (booking) => booking.status === "PENDING"
      ).length,
      confirmed: bookings.filter(
        (booking) => booking.status === "CONFIRMED"
      ).length,
      completed: bookings.filter(
        (booking) => booking.status === "COMPLETED"
      ).length,
    }),
    [bookings]
  );

  /* ---------------------------------------------------------
     VIEW BOOKING DETAILS AND HISTORY
  --------------------------------------------------------- */

  const handleViewBooking = useCallback(
    async (booking: Booking) => {
      setSelectedBooking(booking);
      setBookingHistory([]);
      setLoadingHistory(true);

      try {
        const response = await getBookingStatusHistory(booking.id);

        setBookingHistory(
          Array.isArray(response) ? response : []
        );
      } catch (error) {
        console.error("Failed to load booking history:", error);

        setBookingHistory([]);

        toast.error(
          error instanceof Error
            ? `Unable to load booking history: ${error.message}`
            : "Unable to load booking history."
        );
      } finally {
        setLoadingHistory(false);
      }
    },
    []
  );

  /* ---------------------------------------------------------
     UPDATE BOOKING STATUS - STAFF AND ADMIN
  --------------------------------------------------------- */

  const handleUpdateStatus = useCallback(
    async (booking: Booking, newStatus: BookingStatus) => {
      if (role === "CUSTOMER") {
        toast.error(
          "You are not authorized to update booking statuses."
        );
        return;
      }

      if (booking.status === newStatus) return;

      setUpdatingStatusId(booking.id);

      try {
        await updateBookingStatus(booking.id, newStatus);

        toast.success(
          `Booking ${getBookingNumber(booking)} updated successfully.`
        );

        // Refresh the booking list.
        await fetchBookings(true);

        // Refresh the open details modal if this booking is selected.
        if (selectedBooking?.id === booking.id) {
          try {
            const refreshedBooking = await getBookingById(
              booking.id
            );

            setSelectedBooking(refreshedBooking);

            const refreshedHistory =
              await getBookingStatusHistory(booking.id);

            setBookingHistory(
              Array.isArray(refreshedHistory)
                ? refreshedHistory
                : []
            );
          } catch (refreshError) {
            console.error(
              "Unable to refresh booking details:",
              refreshError
            );
          }
        }
      } catch (error) {
        console.error("Failed to update booking status:", error);

        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to update booking status."
        );
      } finally {
        setUpdatingStatusId(null);
      }
    },
    [role, fetchBookings, selectedBooking]
  );

  /* ---------------------------------------------------------
     CANCEL CUSTOMER BOOKING
  --------------------------------------------------------- */

  const handleCancelBooking = useCallback(
    async (booking: Booking) => {
      if (role !== "CUSTOMER") {
        toast.error(
          "Use the staff booking workflow to manage this reservation."
        );
        setBookingToCancel(null);
        return;
      }

      if (booking.status !== "PENDING") {
        toast.error("Only pending bookings can be cancelled.");
        setBookingToCancel(null);
        return;
      }

      setCancellingId(booking.id);

      try {
        await cancelBooking(booking.id);

        toast.success("Booking cancelled successfully.");

        setBookingToCancel(null);

        await fetchBookings(true);
      } catch (error) {
        console.error("Failed to cancel booking:", error);

        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to cancel this booking."
        );
      } finally {
        setCancellingId(null);
      }
    },
    [role, fetchBookings]
  );

  /* ---------------------------------------------------------
     CREATE BOOKING CALLBACK
  --------------------------------------------------------- */

  const handleBookingCreated = useCallback(() => {
    setShowCreateBooking(false);
    void fetchBookings(true);
  }, [fetchBookings]);

  /* ---------------------------------------------------------
     CLEAR FILTERS
  --------------------------------------------------------- */

  const clearFilters = useCallback(() => {
    setSearch("");
    setStatusFilter("ALL");
  }, []);

  const pageTitle =
    role === "ADMIN"
      ? "Manage Bookings"
      : role === "STAFF"
        ? "Booking Management"
        : "My Bookings";

  const pageDescription =
    role === "CUSTOMER"
      ? "Manage your vehicle reservations and track their status."
      : "Review customer reservations, monitor statuses, and process bookings.";

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-7 px-4 py-8 sm:px-6 lg:px-8">
        {/* PAGE HEADING */}

        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
              <CarFront size={18} />

              {role === "CUSTOMER"
                ? "Customer dashboard"
                : role === "ADMIN"
                  ? "Administrator dashboard"
                  : "Staff dashboard"}
            </div>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {pageTitle}
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {pageDescription}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void fetchBookings(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>

            {role === "CUSTOMER" && (
              <button
                type="button"
                onClick={() => setShowCreateBooking(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <FilePlus2 size={18} />
                Book a Vehicle
              </button>
            )}
          </div>
        </div>

        {/* SUMMARY CARDS */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Bookings"
            value={stats.total}
            icon={CalendarDays}
            iconClassName="bg-blue-50 text-blue-600"
          />

          <StatCard
            title="Pending"
            value={stats.pending}
            icon={Clock}
            iconClassName="bg-amber-50 text-amber-600"
          />

          <StatCard
            title="Confirmed"
            value={stats.confirmed}
            icon={CheckCircle2}
            iconClassName="bg-emerald-50 text-emerald-600"
          />

          <StatCard
            title="Completed"
            value={stats.completed}
            icon={CarFront}
            iconClassName="bg-violet-50 text-violet-600"
          />
        </div>

        {/* BOOKINGS PANEL */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* SEARCH AND FILTERS */}

          <div className="border-b border-slate-200 p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Booking records
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {filteredBookings.length} booking
                  {filteredBookings.length === 1 ? "" : "s"} found
                </p>
              </div>

              <div className="relative w-full lg:max-w-sm">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search booking, vehicle, or location..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>

            {/* STATUS FILTERS */}

            <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
              {STATUS_FILTERS.map((status) => {
                const active = statusFilter === status;

                const count =
                  status === "ALL"
                    ? bookings.length
                    : bookings.filter(
                        (booking) => booking.status === status
                      ).length;

                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                      active
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {getStatusLabel(status)}

                    <span
                      className={`rounded-md px-1.5 py-0.5 text-xs ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-white text-slate-600"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* LOADING */}

          {loading ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-3">
              <LoaderCircle
                size={32}
                className="animate-spin text-blue-600"
              />

              <p className="text-sm text-slate-500">
                Loading bookings...
              </p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <EmptyState
              hasFilters={
                Boolean(search.trim()) || statusFilter !== "ALL"
              }
              onClear={clearFilters}
              role={role}
            />
          ) : (
            <>
              {/* DESKTOP TABLE */}

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-6 py-4 font-semibold">
                        Booking
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Vehicle
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Rental dates
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Total
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Status
                      </th>

                      <th className="px-6 py-4 text-right font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredBookings.map((booking) => (
                      <tr
                        key={booking.id}
                        className="transition hover:bg-slate-50/80"
                      >
                        {/* BOOKING NUMBER */}

                        <td className="px-6 py-5">
                          <p className="font-semibold text-slate-900">
                            {getBookingNumber(booking)}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            ID: {booking.id}
                          </p>
                        </td>

                        {/* VEHICLE */}

                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                              <CarFront size={20} />
                            </div>

                            <div>
                              <p className="font-semibold text-slate-800">
                                {getVehicleName(booking)}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {booking.numberOfDays} day(s)
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* DATES */}

                        <td className="px-6 py-5">
                          <p className="text-sm font-medium text-slate-800">
                            {formatDate(booking.startDate)}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            to {formatDate(booking.endDate)}
                          </p>
                        </td>

                        {/* TOTAL */}

                        <td className="px-6 py-5">
                          <p className="font-bold text-slate-900">
                            {formatCurrency(booking.totalAmount)}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {formatCurrency(booking.dailyRate)}/day
                          </p>
                        </td>

                        {/* STATUS */}

                        <td className="px-6 py-5">
                          {role === "CUSTOMER" ? (
                            <BookingStatusBadge
                              status={booking.status}
                            />
                          ) : (
                            <div className="min-w-36">
                              <select
                                value={booking.status}
                                disabled={
                                  updatingStatusId === booking.id
                                }
                                onChange={(event) => {
                                  void handleUpdateStatus(
                                    booking,
                                    event.target.value as BookingStatus
                                  );
                                }}
                                aria-label={`Update status for ${getBookingNumber(booking)}`}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {BOOKING_STATUSES.map((status) => (
                                  <option
                                    key={status}
                                    value={status}
                                  >
                                    {getStatusLabel(status)}
                                  </option>
                                ))}
                              </select>

                              {updatingStatusId === booking.id && (
                                <p className="mt-1 flex items-center gap-1 text-xs text-blue-600">
                                  <LoaderCircle
                                    size={12}
                                    className="animate-spin"
                                  />
                                  Updating...
                                </p>
                              )}
                            </div>
                          )}
                        </td>

                        {/* ACTIONS */}

                        <td className="px-6 py-5">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              title="View details"
                              aria-label={`View booking ${getBookingNumber(booking)}`}
                              onClick={() =>
                                void handleViewBooking(booking)
                              }
                              className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Eye size={17} />
                            </button>

                            {role === "CUSTOMER" &&
                              booking.status === "PENDING" && (
                                <button
                                  type="button"
                                  title="Cancel booking"
                                  aria-label={`Cancel booking ${getBookingNumber(booking)}`}
                                  disabled={
                                    cancellingId === booking.id
                                  }
                                  onClick={() =>
                                    setBookingToCancel(booking)
                                  }
                                  className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {cancellingId === booking.id ? (
                                    <LoaderCircle
                                      size={17}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Ban size={17} />
                                  )}
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}

              <div className="space-y-4 p-4 md:hidden">
                {filteredBookings.map((booking) => (
                  <article
                    key={booking.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <CarFront size={22} />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-900">
                            {getVehicleName(booking)}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {getBookingNumber(booking)}
                          </p>
                        </div>
                      </div>

                      {role === "CUSTOMER" ? (
                        <BookingStatusBadge
                          status={booking.status}
                        />
                      ) : (
                        <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                          {getStatusLabel(booking.status)}
                        </span>
                      )}
                    </div>

                    {/* MOBILE STATUS CONTROL */}

                    {role !== "CUSTOMER" && (
                      <div className="mt-4">
                        <label
                          htmlFor={`booking-status-${booking.id}`}
                          className="mb-1.5 block text-xs font-semibold text-slate-600"
                        >
                          Update booking status
                        </label>

                        <select
                          id={`booking-status-${booking.id}`}
                          value={booking.status}
                          disabled={
                            updatingStatusId === booking.id
                          }
                          onChange={(event) => {
                            void handleUpdateStatus(
                              booking,
                              event.target.value as BookingStatus
                            );
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:opacity-60"
                        >
                          {BOOKING_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {getStatusLabel(status)}
                            </option>
                          ))}
                        </select>

                        {updatingStatusId === booking.id && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-blue-600">
                            <LoaderCircle
                              size={12}
                              className="animate-spin"
                            />
                            Updating status...
                          </p>
                        )}
                      </div>
                    )}

                    {/* MOBILE BOOKING INFORMATION */}

                    <div className="my-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
                      <div>
                        <p className="text-xs text-slate-500">
                          Start date
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {formatDate(booking.startDate)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">
                          End date
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {formatDate(booking.endDate)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">
                          Duration
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {booking.numberOfDays} day(s)
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">
                          Total amount
                        </p>

                        <p className="mt-1 text-sm font-bold text-slate-900">
                          {formatCurrency(booking.totalAmount)}
                        </p>
                      </div>
                    </div>

                    {/* MOBILE ACTIONS */}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void handleViewBooking(booking)
                        }
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <Eye size={16} />
                        Details
                      </button>

                      {role === "CUSTOMER" &&
                        booking.status === "PENDING" && (
                          <button
                            type="button"
                            disabled={
                              cancellingId === booking.id
                            }
                            onClick={() =>
                              setBookingToCancel(booking)
                            }
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Ban size={16} />
                            Cancel
                          </button>
                        )}
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>

        {/* INFORMATION MESSAGE */}

        <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <AlertCircle
            size={19}
            className="mt-0.5 shrink-0 text-blue-600"
          />

          <p className="text-sm leading-6 text-blue-800">
            {role === "CUSTOMER"
              ? "Pending bookings are awaiting review. Your reservation is not confirmed until the rental staff updates its status."
              : "Review each reservation before changing its status. The server must validate your permissions and the allowed status transitions."}
          </p>
        </div>
      </div>

      {/* CREATE BOOKING MODAL - CUSTOMER ONLY */}

      {role === "CUSTOMER" && showCreateBooking && (
        <CreateBookingModal
          onClose={() => setShowCreateBooking(false)}
          onSuccess={handleBookingCreated}
        />
      )}

      {/* BOOKING DETAILS MODAL */}

      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          history={bookingHistory}
          loadingHistory={loadingHistory}
          onClose={() => setSelectedBooking(null)}
        />
      )}

      {/* CANCEL CONFIRMATION - CUSTOMER ONLY */}

      {role === "CUSTOMER" && bookingToCancel && (
        <CancelBookingModal
          booking={bookingToCancel}
          cancelling={cancellingId === bookingToCancel.id}
          onCancel={() => {
            if (cancellingId === null) {
              setBookingToCancel(null);
            }
          }}
          onConfirm={() =>
            void handleCancelBooking(bookingToCancel)
          }
        />
      )}
    </div>
  );
}
