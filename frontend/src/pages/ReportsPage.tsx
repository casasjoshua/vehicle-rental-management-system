
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  CalendarDays,
  CarFront,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileBarChart,
  RefreshCw,
  Search,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import toast from "react-hot-toast";

import {
  reportService,
  type ReportSummary,
  type MonthlyReportItem,
  type BookingReportItem,
  type BookingPagination,
  type VehicleReportItem,
  type UserReport,
  type BookingReportResponse,
} from "../services/reportService";

interface ReportsPageProps {
  title?: string;
}

type Tab = "overview" | "bookings" | "vehicles" | "users";

const DEFAULT_SUMMARY: ReportSummary = {
  users: { total: 0, byRole: {} },
  vehicles: { total: 0, byStatus: {} },
  bookings: { total: 0, byStatus: {} },
  revenue: 0,
};

const DEFAULT_PAGINATION: BookingPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
};

const currency = (value: unknown) => {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
};

const number = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const dateLabel = (value?: string) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const titleCase = (value: string) =>
  value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const statusClass = (status: string) => {
  switch (status.toUpperCase()) {
    case "COMPLETED":
    case "AVAILABLE":
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";

    case "CONFIRMED":
    case "RENTED":
      return "bg-blue-50 text-blue-700 ring-blue-600/20";

    case "PENDING":
    case "MAINTENANCE":
      return "bg-amber-50 text-amber-700 ring-amber-600/20";

    case "CANCELLED":
    case "CANCELED":
    case "REJECTED":
    case "INACTIVE":
      return "bg-red-50 text-red-700 ring-red-600/20";

    default:
      return "bg-slate-100 text-slate-700 ring-slate-500/20";
  }
};

function StatusBadge({ status }: { status?: string }) {
  const value = status || "UNKNOWN";

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusClass(
        value
      )}`}
    >
      {titleCase(value)}
    </span>
  );
}

function EmptyState({
  message,
  loading = false,
}: {
  message: string;
  loading?: boolean;
}) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-2 px-5 py-10 text-center">
      {loading ? (
        <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
      ) : (
        <FileBarChart className="h-7 w-7 text-slate-300" />
      )}

      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Users;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>

          <p className="mt-3 break-words text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-2 text-xs text-slate-500">{detail}</p>
        </div>

        <div className={`rounded-xl p-3 ${iconClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      {action}
    </div>
  );
}

function downloadCsv(filename: string, rows: unknown[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((value) => {
          const text = String(value ?? "");
          return `"${text.replace(/"/g, '""')}"`;
        })
        .join(",")
    )
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}

export default function ReportsPage({
  title = "Reports & Analytics",
}: ReportsPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [summary, setSummary] =
    useState<ReportSummary>(DEFAULT_SUMMARY);

  const [monthly, setMonthly] = useState<MonthlyReportItem[]>([]);
  const [vehicles, setVehicles] = useState<VehicleReportItem[]>([]);

  const [users, setUsers] = useState<UserReport>({
    total: 0,
    active: 0,
    inactive: 0,
    byRole: {},
  });

  const [bookings, setBookings] = useState<BookingReportItem[]>([]);

  const [pagination, setPagination] =
    useState<BookingPagination>(DEFAULT_PAGINATION);

  const [year, setYear] = useState(new Date().getFullYear());
  const [search, setSearch] = useState("");
  const [bookingStatus, setBookingStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const pageSize = 10;

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [
        summaryResult,
        monthlyResult,
        vehicleResult,
        userResult,
      ] = await Promise.all([
        reportService.getSummary(),
        reportService.getMonthly(year),
        reportService.getVehicles(),
        reportService.getUsers(),
      ]);

      setSummary({
        users: {
          total: number(summaryResult?.users?.total),
          byRole: summaryResult?.users?.byRole ?? {},
        },
        vehicles: {
          total: number(summaryResult?.vehicles?.total),
          byStatus: summaryResult?.vehicles?.byStatus ?? {},
        },
        bookings: {
          total: number(summaryResult?.bookings?.total),
          byStatus: summaryResult?.bookings?.byStatus ?? {},
        },
        revenue: number(summaryResult?.revenue),
      });

      setMonthly(
        Array.isArray(monthlyResult?.months)
          ? monthlyResult.months
          : []
      );

      const vehicleResultData = vehicleResult as
        | VehicleReportItem[]
        | {
            vehicles?: VehicleReportItem[];
            data?: VehicleReportItem[];
          };

      let vehicleRows: VehicleReportItem[] = [];

      if (Array.isArray(vehicleResultData)) {
        vehicleRows = vehicleResultData;
      } else if (Array.isArray(vehicleResultData.vehicles)) {
        vehicleRows = vehicleResultData.vehicles;
      } else if (Array.isArray(vehicleResultData.data)) {
        vehicleRows = vehicleResultData.data;
      }

      setVehicles(vehicleRows);

      setUsers({
        total: number(userResult?.total),
        active: number(userResult?.active),
        inactive: number(userResult?.inactive),
        byRole: userResult?.byRole ?? {},
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to load reports.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [year]);

  const loadBookings = useCallback(async () => {
    try {
      const result: BookingReportResponse =
        await reportService.getBookings({
          page,
          limit: pageSize,
          status: bookingStatus || undefined,
          from: from || undefined,
          to: to || undefined,
        });

      const rows: BookingReportItem[] = Array.isArray(
        result.bookings
      )
        ? result.bookings
        : [];

      setBookings(rows);

      setPagination(
        result.pagination ?? {
          page,
          limit: pageSize,
          total: rows.length,
          totalPages: Math.ceil(rows.length / pageSize),
        }
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to load bookings.";

      toast.error(message);
      setBookings([]);
      setPagination(DEFAULT_PAGINATION);
    }
  }, [page, bookingStatus, from, to]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return bookings;

    return bookings.filter((booking) => {
      const customer =
        booking.customerName || booking.user?.fullName || "";

      const vehicle =
        booking.vehicleName ||
        booking.vehicle?.name ||
        [booking.vehicle?.brand, booking.vehicle?.model]
          .filter(Boolean)
          .join(" ");

      return [
        booking.bookingNumber,
        customer,
        booking.user?.email,
        vehicle,
        booking.vehicle?.plateNumber,
        booking.status,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(query)
      );
    });
  }, [bookings, search]);

  const monthlyChart = useMemo(() => {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const byMonth = new Map(
      monthly.map((item) => [Number(item.month), item])
    );

    return monthNames.map((month, index) => {
      const item = byMonth.get(index + 1);

      return {
        month,
        revenue: number(item?.revenue),
        bookings: number(item?.bookings),
      };
    });
  }, [monthly]);

  const totalMonthlyRevenue = useMemo(
    () =>
      monthly.reduce(
        (total, item) => total + number(item.revenue),
        0
      ),
    [monthly]
  );

  const totalMonthlyBookings = useMemo(
    () =>
      monthly.reduce(
        (total, item) => total + number(item.bookings),
        0
      ),
    [monthly]
  );

  const exportBookings = () => {
    if (!filteredBookings.length) {
      toast.error("There are no bookings to export.");
      return;
    }

    downloadCsv(`driveease-bookings-${year}.csv`, [
      [
        "Booking Number",
        "Customer",
        "Email",
        "Vehicle",
        "Plate Number",
        "Start Date",
        "End Date",
        "Days",
        "Daily Rate",
        "Total Amount",
        "Status",
        "Created At",
      ],
      ...filteredBookings.map((booking) => [
        booking.bookingNumber || booking.id,
        booking.customerName ||
          booking.user?.fullName ||
          "Unknown",
        booking.user?.email || "",
        booking.vehicleName ||
          booking.vehicle?.name ||
          [booking.vehicle?.brand, booking.vehicle?.model]
            .filter(Boolean)
            .join(" "),
        booking.vehicle?.plateNumber || "",
        booking.startDate || "",
        booking.endDate || "",
        booking.numberOfDays ?? "",
        booking.dailyRate ?? "",
        booking.totalAmount ?? "",
        booking.status,
        booking.createdAt || "",
      ]),
    ]);

    toast.success("Bookings exported successfully.");
  };

  const exportVehicles = () => {
    if (!vehicles.length) {
      toast.error("There are no vehicles to export.");
      return;
    }

    downloadCsv("driveease-vehicle-report.csv", [
      [
        "Vehicle",
        "Plate Number",
        "Type",
        "Status",
        "Total Bookings",
        "Completed",
        "Active",
        "Cancelled",
      ],
      ...vehicles.map((vehicle) => [
        vehicle.name ||
          [vehicle.brand, vehicle.model].filter(Boolean).join(" ") ||
          `Vehicle #${vehicle.id}`,
        vehicle.plateNumber || "",
        vehicle.vehicleType || "",
        vehicle.status || "",
        vehicle.totalBookings ?? 0,
        vehicle.completedBookings ?? 0,
        vehicle.activeBookings ?? 0,
        vehicle.cancelledBookings ?? 0,
      ]),
    ]);

    toast.success("Vehicle report exported successfully.");
  };

  const tabs: {
    id: Tab;
    label: string;
    icon: typeof Activity;
  }[] = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "bookings", label: "Bookings", icon: CalendarDays },
    { id: "vehicles", label: "Vehicles", icon: CarFront },
    { id: "users", label: "Users", icon: Users },
  ];

  const bookingStatusEntries = Object.entries(
    summary.bookings.byStatus
  );

  const vehicleStatusEntries = Object.entries(
    summary.vehicles.byStatus
  );

  const userRoleEntries = Object.entries(users.byRole);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
              <FileBarChart className="h-4 w-4" />
              DriveEase Administration
            </div>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {title}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Monitor revenue, bookings, vehicles, and user activity.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
              <CalendarDays className="h-4 w-4 text-slate-400" />
              <span className="sr-only">Report year</span>

              <select
                value={year}
                onChange={(event) =>
                  setYear(Number(event.target.value))
                }
                className="bg-transparent font-medium outline-none"
              >
                {Array.from(
                  { length: 5 },
                  (_, index) =>
                    new Date().getFullYear() - index
                ).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => {
                void loadReports();
                void loadBookings();
              }}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  loading ? "animate-spin" : ""
                }`}
              />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <p className="font-semibold">
                Unable to load all reports
              </p>
              <p className="mt-1">{error}</p>
              <p className="mt-1 text-red-600">
                Check the backend, report routes, authentication,
                and database connection.
              </p>
            </div>
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
          <div className="flex min-w-max gap-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                  activeTab === id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Revenue"
            value={currency(summary.revenue)}
            detail="Revenue reported by the backend"
            icon={Wallet}
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <StatCard
            label="Total Bookings"
            value={number(summary.bookings.total).toLocaleString(
              "en-PH"
            )}
            detail={`${number(
              summary.bookings.byStatus.COMPLETED
            )} completed bookings`}
            icon={CalendarDays}
            iconClass="bg-blue-50 text-blue-600"
          />

          <StatCard
            label="Total Vehicles"
            value={number(summary.vehicles.total).toLocaleString(
              "en-PH"
            )}
            detail={`${number(
              summary.vehicles.byStatus.AVAILABLE
            )} available`}
            icon={CarFront}
            iconClass="bg-violet-50 text-violet-600"
          />

          <StatCard
            label="Total Users"
            value={number(summary.users.total).toLocaleString(
              "en-PH"
            )}
            detail={`${number(users.active)} active users`}
            icon={Users}
            iconClass="bg-amber-50 text-amber-600"
          />
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:col-span-2">
                <SectionHeading
                  title="Monthly Revenue"
                  description={`Revenue and booking activity for ${year}`}
                />

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-emerald-50 p-4">
                    <p className="text-sm font-medium text-emerald-700">
                      Revenue in monthly report
                    </p>
                    <p className="mt-2 text-xl font-bold text-emerald-900">
                      {currency(totalMonthlyRevenue)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-blue-50 p-4">
                    <p className="text-sm font-medium text-blue-700">
                      Bookings in monthly report
                    </p>
                    <p className="mt-2 text-xl font-bold text-blue-900">
                      {totalMonthlyBookings.toLocaleString("en-PH")}
                    </p>
                  </div>
                </div>

                {loading && monthly.length === 0 ? (
                  <EmptyState
                    message="Loading monthly report..."
                    loading
                  />
                ) : (
                  <div className="mt-6 h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={monthlyChart}
                        margin={{
                          top: 10,
                          right: 10,
                          left: 10,
                          bottom: 0,
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                        />

                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />

                        <YAxis
                          yAxisId="revenue"
                          tickFormatter={(value: number) =>
                            `₱${Number(value).toLocaleString("en-PH")}`
                          }
                          tick={{ fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          width={85}
                        />

                        <YAxis
                          yAxisId="bookings"
                          orientation="right"
                          allowDecimals={false}
                          tick={{ fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          width={35}
                        />

                        <Tooltip
                          formatter={(value, name) => [
                            name === "Revenue"
                              ? currency(value)
                              : Number(value ?? 0).toLocaleString(
                                  "en-PH"
                                ),
                            name,
                          ]}
                        />

                        <Legend />

                        <Line
                          yAxisId="revenue"
                          type="monotone"
                          dataKey="revenue"
                          name="Revenue"
                          stroke="#059669"
                          strokeWidth={3}
                          dot={{ r: 3 }}
                          activeDot={{ r: 6 }}
                        />

                        <Line
                          yAxisId="bookings"
                          type="monotone"
                          dataKey="bookings"
                          name="Bookings"
                          stroke="#2563eb"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <SectionHeading
                  title="Booking Status"
                  description="Current booking distribution"
                />

                {bookingStatusEntries.length === 0 ? (
                  <EmptyState
                    loading={loading}
                    message="No booking status data available."
                  />
                ) : (
                  <div className="mt-5 space-y-4">
                    {bookingStatusEntries.map(([status, count]) => {
                      const total = Math.max(
                        1,
                        number(summary.bookings.total)
                      );

                      const percentage = Math.min(
                        100,
                        (number(count) / total) * 100
                      );

                      return (
                        <div key={status}>
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <StatusBadge status={status} />
                            <span className="text-sm font-bold text-slate-800">
                              {number(count).toLocaleString("en-PH")}
                            </span>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-blue-500 transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-6 rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <TrendingUp className="h-4 w-4" />
                    Completed bookings
                  </div>

                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {number(
                      summary.bookings.byStatus.COMPLETED
                    ).toLocaleString("en-PH")}
                  </p>
                </div>
              </section>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <SectionHeading
                  title="Vehicle Availability"
                  description="Vehicles grouped by status"
                />

                {vehicleStatusEntries.length === 0 ? (
                  <EmptyState
                    loading={loading}
                    message="No vehicle status data available."
                  />
                ) : (
                  <div className="mt-5 space-y-4">
                    {vehicleStatusEntries.map(([status, count]) => (
                      <div
                        key={status}
                        className="flex items-center justify-between rounded-xl border border-slate-100 p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-slate-100 p-2">
                            <CarFront className="h-4 w-4 text-slate-600" />
                          </div>

                          <span className="text-sm font-medium text-slate-700">
                            {titleCase(status)}
                          </span>
                        </div>

                        <span className="text-lg font-bold text-slate-900">
                          {number(count).toLocaleString("en-PH")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <SectionHeading
                  title="User Roles"
                  description="Registered users by role"
                />

                {userRoleEntries.length === 0 ? (
                  <EmptyState
                    loading={loading}
                    message="No user role data available."
                  />
                ) : (
                  <div className="mt-5 space-y-4">
                    {userRoleEntries.map(([role, count]) => {
                      const percentage =
                        users.total > 0
                          ? Math.min(
                              100,
                              (number(count) / users.total) * 100
                            )
                          : 0;

                      return (
                        <div key={role}>
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700">
                              {titleCase(role)}
                            </span>

                            <span className="text-sm font-bold text-slate-900">
                              {number(count)}
                            </span>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-violet-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          </div>
        )}

        {activeTab === "bookings" && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5 sm:p-6">
              <SectionHeading
                title="Booking Reports"
                description="Search, filter, and export booking records."
                action={
                  <button
                    type="button"
                    onClick={exportBookings}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </button>
                }
              />

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <div className="relative xl:col-span-2">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search booking, customer, vehicle..."
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <select
                  value={bookingStatus}
                  onChange={(event) => {
                    setBookingStatus(event.target.value);
                    setPage(1);
                  }}
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">All statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="COMPLETED">Completed</option>
                </select>

                <input
                  type="date"
                  value={from}
                  onChange={(event) => {
                    setFrom(event.target.value);
                    setPage(1);
                  }}
                  aria-label="From date"
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <input
                  type="date"
                  value={to}
                  onChange={(event) => {
                    setTo(event.target.value);
                    setPage(1);
                  }}
                  aria-label="To date"
                  min={from || undefined}
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Booking</th>
                    <th className="px-5 py-4 font-semibold">Customer</th>
                    <th className="px-5 py-4 font-semibold">Vehicle</th>
                    <th className="px-5 py-4 font-semibold">Rental Period</th>
                    <th className="px-5 py-4 font-semibold">Amount</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold">Created</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredBookings.map((booking) => {
                    const vehicle =
                      booking.vehicleName ||
                      booking.vehicle?.name ||
                      [
                        booking.vehicle?.brand,
                        booking.vehicle?.model,
                      ]
                        .filter(Boolean)
                        .join(" ") ||
                      `Vehicle #${booking.vehicleId ?? "—"}`;

                    return (
                      <tr
                        key={booking.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">
                            {booking.bookingNumber || `#${booking.id}`}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            ID: {booking.id}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-800">
                            {booking.customerName ||
                              booking.user?.fullName ||
                              "Unknown customer"}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {booking.user?.email || "No email"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-800">
                            {vehicle}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {booking.vehicle?.plateNumber ||
                              "No plate number"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="whitespace-nowrap text-slate-700">
                            {dateLabel(booking.startDate)}
                          </p>

                          <p className="mt-1 whitespace-nowrap text-xs text-slate-500">
                            to {dateLabel(booking.endDate)}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {booking.numberOfDays ?? "—"} day(s)
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-900">
                            {currency(booking.totalAmount)}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {currency(booking.dailyRate)}/day
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={booking.status} />
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                          {dateLabel(booking.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredBookings.length === 0 && (
                <EmptyState
                  message={
                    loading
                      ? "Loading booking records..."
                      : "No bookings match your search or filters."
                  }
                  loading={loading}
                />
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                {pagination.total} total booking(s) · Page{" "}
                {pagination.page} of{" "}
                {Math.max(1, pagination.totalPages)}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPage((current) => Math.max(1, current - 1))
                  }
                  disabled={page <= 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPage((current) =>
                      Math.min(
                        Math.max(1, pagination.totalPages),
                        current + 1
                      )
                    )
                  }
                  disabled={
                    page >= Math.max(1, pagination.totalPages) ||
                    pagination.totalPages === 0
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>
        )}

        {activeTab === "vehicles" && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5 sm:p-6">
              <SectionHeading
                title="Vehicle Performance"
                description="Review vehicle status and booking activity."
                action={
                  <button
                    type="button"
                    onClick={exportVehicles}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </button>
                }
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Vehicle</th>
                    <th className="px-5 py-4 font-semibold">Plate Number</th>
                    <th className="px-5 py-4 font-semibold">Daily Rate</th>
                    <th className="px-5 py-4 font-semibold">Bookings</th>
                    <th className="px-5 py-4 font-semibold">Completed</th>
                    <th className="px-5 py-4 font-semibold">Active</th>
                    <th className="px-5 py-4 font-semibold">Cancelled</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {vehicle.name ??
                            ([vehicle.brand, vehicle.model]
                              .filter(Boolean)
                              .join(" ") ||
                              `Vehicle #${vehicle.id}`)}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {vehicle.vehicleType || "Vehicle"}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {vehicle.plateNumber || "—"}
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-800">
                        {currency(vehicle.dailyRate)}
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {number(vehicle.totalBookings)}
                      </td>

                      <td className="px-5 py-4 text-emerald-700">
                        {number(vehicle.completedBookings)}
                      </td>

                      <td className="px-5 py-4 text-blue-700">
                        {number(vehicle.activeBookings)}
                      </td>

                      <td className="px-5 py-4 text-red-600">
                        {number(vehicle.cancelledBookings)}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={vehicle.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {vehicles.length === 0 && (
                <EmptyState
                  loading={loading}
                  message="No vehicle report data available."
                />
              )}
            </div>
          </section>
        )}

        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                label="Total Users"
                value={number(users.total).toLocaleString("en-PH")}
                detail="All registered accounts"
                icon={Users}
                iconClass="bg-blue-50 text-blue-600"
              />

              <StatCard
                label="Active Users"
                value={number(users.active).toLocaleString("en-PH")}
                detail="Accounts marked active"
                icon={CheckCircle2}
                iconClass="bg-emerald-50 text-emerald-600"
              />

              <StatCard
                label="Inactive Users"
                value={number(users.inactive).toLocaleString("en-PH")}
                detail="Accounts marked inactive"
                icon={AlertCircle}
                iconClass="bg-red-50 text-red-600"
              />
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <SectionHeading
                title="Users by Role"
                description="Distribution of accounts across user roles."
              />

              {userRoleEntries.length === 0 ? (
                <EmptyState
                  loading={loading}
                  message="No user role data available."
                />
              ) : (
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {userRoleEntries.map(([role, count]) => (
                    <div
                      key={role}
                      className="rounded-xl border border-slate-200 p-5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
                          <Users className="h-5 w-5" />
                        </div>

                        <StatusBadge status={role} />
                      </div>

                      <p className="mt-5 text-3xl font-bold text-slate-900">
                        {number(count).toLocaleString("en-PH")}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {titleCase(role)} accounts
                      </p>

                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{
                            width: `${
                              users.total > 0
                                ? Math.min(
                                    100,
                                    (number(count) / users.total) * 100
                                  )
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        <p className="pb-4 text-center text-xs text-slate-400">
          DriveEase Reports & Analytics · Data provided by your rental
          system API
        </p>
      </div>
    </div>
  );
}
